import asyncio, time, uuid
from datetime import datetime, timezone
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.database import (
    initialize_database,
    save_trace,
    get_all_traces,
    get_trace_by_id,
    get_all_incidents,
    resolve_incident
)
from app.incident_detector import create_incident

AUTH = "http://127.0.0.1:8001"
PAYMENT = "http://127.0.0.1:8002"
app = FastAPI(title="PulseMesh API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def startup():
    initialize_database()

class CheckoutRequest(BaseModel):
    amount: float = Field(default=500, gt=0, le=1000000)
    simulate_payment_failure: bool = False

def make_event(name, service, status, duration, message):
    return {"name": name, "service": service, "status": status,
            "duration_ms": round(duration, 2), "message": message}

@app.get("/")
def root():
    return {"name": "PulseMesh API", "status": "running"}

@app.get("/health")
def health():
    return {"service": "main-api", "status": "healthy"}

async def check_service(name, url):
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            response = await client.get(url)
            response.raise_for_status()
        return {"name": name, "status": "healthy",
                "response_time_ms": round((time.perf_counter()-start)*1000, 2)}
    except (httpx.RequestError, httpx.HTTPStatusError):
        return {"name": name, "status": "offline", "response_time_ms": None}

@app.get("/api/v1/services/status")
async def services_status():
    auth, payment = await asyncio.gather(
        check_service("Auth Service", AUTH + "/health"),
        check_service("Payment Service", PAYMENT + "/health"))
    services = [{"name": "Main API", "status": "healthy", "response_time_ms": 0}, auth, payment]
    return {"total_services": 3, "healthy_services": sum(s["status"] == "healthy" for s in services),
            "services": services, "checked_at": datetime.now(timezone.utc).isoformat()}

@app.post("/api/v1/checkout")
async def checkout(request: CheckoutRequest):
    trace_id = str(uuid.uuid4())
    started = time.perf_counter()
    created_at = datetime.now(timezone.utc).isoformat()
    events = []

    stage = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.get(AUTH + "/demo-auth")
            response.raise_for_status()
            auth_data = response.json()
        auth_ok = bool(auth_data.get("authenticated"))
        events.append(make_event("Authentication", "auth-service",
            "success" if auth_ok else "failed", (time.perf_counter()-stage)*1000,
            "Demo authentication accepted." if auth_ok else "Authentication rejected."))
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError):
        auth_ok, auth_data = False, {"authenticated": False}
        events.append(make_event("Authentication", "auth-service", "failed",
            (time.perf_counter()-stage)*1000, "Auth Service is unavailable."))
        create_incident("service_outage", "auth-service",
                        "Auth Service is unavailable during checkout.", "critical")

    if not auth_ok:
        if not events[-1]["message"].startswith("Auth Service"):
            create_incident("authentication_failure", "auth-service",
                            "Authentication failed during checkout.", "warning")
        total = (time.perf_counter()-started)*1000
        trace = {"trace_id": trace_id, "status": "failed", "amount": request.amount,
                 "total_duration_ms": round(total, 2), "created_at": created_at, "events": events}
        save_trace(trace)
        return {"trace": trace, "message": "Checkout stopped because authentication did not succeed."}

    stage = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            response = await client.post(PAYMENT + "/process-payment",
                params={"amount": request.amount, "simulate_failure": request.simulate_payment_failure})
            response.raise_for_status()
            payment_data = response.json()
        payment_status = payment_data.get("status", "failed")
        events.append(make_event("Payment", "payment-service", payment_status,
            (time.perf_counter()-stage)*1000, payment_data.get("message", "Payment processed.")))
        if payment_status != "success":
            create_incident("checkout_failure", "payment-service",
                            "Payment request failed during checkout.", "warning")
    except (httpx.RequestError, httpx.HTTPStatusError, ValueError):
        payment_data, payment_status = {"status": "failed", "message": "Payment Service is unavailable."}, "failed"
        events.append(make_event("Payment", "payment-service", "failed",
            (time.perf_counter()-stage)*1000, payment_data["message"]))
        create_incident("service_outage", "payment-service",
                        "Payment Service is unavailable during checkout.", "critical")

    status = "success" if payment_status == "success" else "failed"
    total = (time.perf_counter()-started)*1000
    trace = {"trace_id": trace_id, "status": status, "amount": request.amount,
             "total_duration_ms": round(total, 2), "created_at": created_at, "events": events}
    save_trace(trace)
    return {"trace": trace,
            "message": "Checkout completed successfully." if status == "success" else "Checkout failed. See trace details.",
            "authentication": auth_data, "payment": payment_data}

@app.get("/api/v1/traces")
def list_traces():
    traces = get_all_traces()
    return {"total_traces": len(traces), "traces": traces}

@app.get("/api/v1/traces/{trace_id}")
def trace_detail(trace_id: str):
    trace = get_trace_by_id(trace_id)
    if trace is None:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace

@app.get("/api/v1/incidents")
def list_incidents():
    incidents = get_all_incidents()
    return {"total_incidents": len(incidents), "incidents": incidents}

@app.patch("/api/v1/incidents/{incident_id}/resolve")
def mark_incident_resolved(incident_id: str):
    updated = resolve_incident(incident_id)

    if not updated:
        raise HTTPException(status_code=404, detail="Incident not found")

    return {
        "message": "Incident resolved successfully.",
        "incident_id": incident_id,
        "status": "resolved"
    }