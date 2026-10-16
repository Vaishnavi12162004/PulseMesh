import uuid
from datetime import datetime, timezone
from app.database import save_incident

def create_incident(incident_type, service_name, description, severity="warning"):
    incident = {
        "incident_id": str(uuid.uuid4()), "incident_type": incident_type,
        "service_name": service_name, "description": description,
        "severity": severity, "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    save_incident(incident)
    return incident
