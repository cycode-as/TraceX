from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.incident import Incident


client = TestClient(app)


def create_test_incident() -> str:
    incident_id = f"INC-ACTION-{uuid4().hex[:8].upper()}"

    db = SessionLocal()

    try:
        incident = Incident(
            incident_id=incident_id,
            title="Analyst action test incident",
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


def test_confirm_incident():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "CONFIRM",
            "analyst_id": "analyst-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "CONFIRM"
    assert data["data"]["incident"]["status"] == "CONFIRMED"


def test_dismiss_requires_reason():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "DISMISS",
            "analyst_id": "analyst-test",
        },
    )

    assert response.status_code == 400

    data = response.json()

    assert data["detail"]["success"] is False
    assert data["detail"]["error"]["code"] == "VALIDATION_ERROR"


def test_dismiss_incident():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "DISMISS",
            "reason": "approved_activity",
            "analyst_id": "analyst-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "DISMISS"
    assert data["data"]["reason"] == "approved_activity"
    assert data["data"]["incident"]["status"] == "DISMISSED"


def test_escalate_incident():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "ESCALATE",
            "analyst_id": "analyst-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "ESCALATE"
    assert data["data"]["incident"]["status"] == "HIGH_PRIORITY"


def test_resolve_incident():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "RESOLVE",
            "analyst_id": "analyst-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "RESOLVE"
    assert data["data"]["incident"]["status"] == "RESOLVED"
    assert data["data"]["incident"]["resolved_at"] is not None


def test_investigate_incident():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "INVESTIGATE",
            "analyst_id": "analyst-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["data"]["action"] == "INVESTIGATE"
    assert data["data"]["incident"]["status"] == "INCIDENT_CANDIDATE"