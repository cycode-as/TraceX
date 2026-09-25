from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.incident import Incident


client = TestClient(app)


def create_test_incident() -> str:
    incident_id = f"INC-E2E-{uuid4().hex[:8].upper()}"

    db = SessionLocal()

    try:
        incident = Incident(
            incident_id=incident_id,
            title="Analyst E2E test incident",
            status="INCIDENT_CANDIDATE",
            priority_score=50,
            priority_label="MEDIUM",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(incident)
        db.commit()

        return incident_id

    finally:
        db.close()


def test_analyst_action_end_to_end():
    incident_id = create_test_incident()

    action_response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "CONFIRM",
            "analyst_id": "e2e-analyst",
        },
    )

    assert action_response.status_code == 200

    action_data = action_response.json()

    assert action_data["success"] is True
    assert action_data["data"]["action"] == "CONFIRM"
    assert action_data["data"]["incident"]["status"] == "CONFIRMED"

    audit_response = client.get(
        f"/api/incidents/{incident_id}/audit"
    )

    assert audit_response.status_code == 200

    audit_data = audit_response.json()

    assert audit_data["success"] is True

    audit_entries = audit_data["data"]

    matching_entries = [
        entry
        for entry in audit_entries
        if entry["action"] == "ANALYST_ACTION_CONFIRM"
    ]

    assert len(matching_entries) >= 1

    audit_entry = matching_entries[-1]

    assert audit_entry["timestamp"] is not None
    assert audit_entry["action"] == "ANALYST_ACTION_CONFIRM"