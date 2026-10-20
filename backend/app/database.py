import json, sqlite3
from pathlib import Path

DB = Path(__file__).resolve().parent / "pulsemesh.db"

def connect():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con

def initialize_database():
    with connect() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS traces (
            trace_id TEXT PRIMARY KEY, status TEXT NOT NULL, amount REAL NOT NULL,
            total_duration_ms REAL NOT NULL, created_at TEXT NOT NULL, events_json TEXT NOT NULL)""")
        con.execute("""CREATE TABLE IF NOT EXISTS incidents (
            incident_id TEXT PRIMARY KEY, incident_type TEXT NOT NULL, service_name TEXT NOT NULL,
            description TEXT NOT NULL, severity TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL)""")

def save_trace(t):
    with connect() as con:
        con.execute("INSERT OR REPLACE INTO traces VALUES (?, ?, ?, ?, ?, ?)",
            (t["trace_id"], t["status"], t["amount"], t["total_duration_ms"], t["created_at"], json.dumps(t["events"])))

def get_all_traces():
    with connect() as con:
        rows = con.execute("SELECT * FROM traces ORDER BY created_at DESC").fetchall()
    result = []
    for row in rows:
        item = dict(row)
        item["events"] = json.loads(item.pop("events_json"))
        result.append(item)
    return result

def get_trace_by_id(trace_id):
    return next((t for t in get_all_traces() if t["trace_id"] == trace_id), None)

def save_incident(i):
    with connect() as con:
        con.execute("INSERT OR REPLACE INTO incidents VALUES (?, ?, ?, ?, ?, ?, ?)",
            (i["incident_id"], i["incident_type"], i["service_name"], i["description"], i["severity"], i["status"], i["created_at"]))

def get_all_incidents():
    with connect() as con:
        return [dict(r) for r in con.execute("SELECT * FROM incidents ORDER BY created_at DESC").fetchall()]


def resolve_incident(incident_id):
    with connect() as con:
        cursor = con.execute(
            "UPDATE incidents SET status = ? WHERE incident_id = ?",
            ("resolved", incident_id)
        )
        return cursor.rowcount > 0