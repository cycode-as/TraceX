from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.database import SessionLocal
from app.main import app
from app.models.analyst_action import AnalystAction
from app.models.audit_log import AuditLog
from app.models.incident import Incident


client = TestClient(app)


def create_test_incident() -> str:
    incident_id = f"INC-PERSIST-{uuid4().hex[:8].upper()}"

    db = SessionLocal()

    try:
        incident = Incident(
            incident_id=incident_id,
            title="Analyst persistence test",
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


def test_analyst_action_is_persisted():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "CONFIRM",
            "analyst_id": "analyst-persistence-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    action_id = data["data"]["action_id"]

    db = SessionLocal()

    try:
        action = db.get(AnalystAction, action_id)

        assert action is not None
        assert action.action_id == action_id
        assert action.incident_id == incident_id
        assert action.action == "CONFIRM"
        assert action.analyst_id == "analyst-persistence-test"

    finally:
        db.close()


def test_analyst_action_creates_audit_log():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/action",
        json={
            "action": "ESCALATE",
            "analyst_id": "analyst-audit-test",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True

    action_id = data["data"]["action_id"]

    db = SessionLocal()

    try:
        audit = db.scalar(
            select(AuditLog).where(
                AuditLog.audit_id == f"AUD-{action_id}"
            )
        )

        assert audit is not None
        assert audit.incident_id == incident_id
        assert audit.action == "ANALYST_ACTION_ESCALATE"
        assert audit.actor == "analyst-audit-test"

        assert audit.details["action_id"] == action_id
        assert audit.details["action"] == "ESCALATE"
        assert audit.details["previous_status"] == "INCIDENT_CANDIDATE"
        assert audit.details["new_status"] == "HIGH_PRIORITY"

    finally:
        db.close()