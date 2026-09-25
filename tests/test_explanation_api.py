from datetime import datetime
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.main import app
from app.models.correlation import Correlation
from app.models.correlation_event import CorrelationEvent
from app.models.evidence import Evidence
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.models.event import Event


client = TestClient(app)


def create_test_incident() -> str:
    incident_id = f"INC-EXPLAIN-{uuid4().hex[:8].upper()}"
    event_id = f"EVT-EXPLAIN-{uuid4().hex[:8].upper()}"
    correlation_id = f"COR-EXPLAIN-{uuid4().hex[:8].upper()}"

    now = datetime.utcnow()

    db = SessionLocal()

    try:
        incident = Incident(
            incident_id=incident_id,
            title="Suspicious account activity",
            status="HIGH_PRIORITY",
            priority_score=86,
            priority_label="HIGH",
            created_at=now,
            updated_at=now,
        )

        event = Event(
            event_id=event_id,
            timestamp=now,
            event_type="login",
            user_id="USR-EXPLAIN-001",
            device_id="DEV-EXPLAIN-001",
            ip_address="10.0.0.15",
            location="Indore",
            session_id="SES-EXPLAIN-001",
            resource=None,
            action="login",
            event_metadata={},
        )

        incident_event = IncidentEvent(
            incident_id=incident_id,
            event_id=event_id,
            relationship="RELATED",
        )

        evidence = Evidence(
            evidence_id=f"EVD-{uuid4().hex[:8].upper()}",
            incident_id=incident_id,
            event_id=event_id,
            type="SUPPORTING",
            description="Login originated from an unusual location.",
            impact="Increases investigation priority.",
            created_at=now,
        )

        mitigating_evidence = Evidence(
            evidence_id=f"EVD-{uuid4().hex[:8].upper()}",
            incident_id=incident_id,
            event_id=event_id,
            type="MITIGATING",
            description="The device is associated with a known corporate account.",
            impact="Reduces concern about the login.",
            created_at=now,
        )

        correlation = Correlation(
            correlation_id=correlation_id,
            reason="Login is associated with the same user and session.",
            strength=0.9,
            created_at=now,
        )

        correlation_event = CorrelationEvent(
            correlation_id=correlation_id,
            event_id=event_id,
            relationship="RELATED",
        )

        db.add_all(
            [
                incident,
                event,
                incident_event,
                evidence,
                mitigating_evidence,
                correlation,
                correlation_event,
            ]
        )

        db.commit()

        return incident_id

    finally:
        db.close()


def test_explanation_incident_not_found():
    response = client.post(
        "/api/incidents/INC-EXPLAIN-NOT-FOUND/explain"
    )

    assert response.status_code == 404

    data = response.json()

    assert data["detail"]["success"] is False
    assert data["detail"]["error"]["code"] == "INCIDENT_NOT_FOUND"


def test_explanation_endpoint_returns_success():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/explain"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["error"] is None
    assert data["data"] is not None


def test_explanation_has_required_fields():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/explain"
    )

    assert response.status_code == 200

    explanation = response.json()["data"]

    assert "summary" in explanation
    assert "why_connected" in explanation
    assert "supporting_evidence" in explanation
    assert "mitigating_evidence" in explanation
    assert "why_investigate" in explanation
    assert "recommended_actions" in explanation


def test_explanation_uses_supporting_and_mitigating_evidence():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/explain"
    )

    assert response.status_code == 200

    explanation = response.json()["data"]

    assert (
        "Login originated from an unusual location."
        in explanation["supporting_evidence"]
    )

    assert (
        "The device is associated with a known corporate account."
        in explanation["mitigating_evidence"]
    )


def test_explanation_includes_correlation():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/explain"
    )

    assert response.status_code == 200

    explanation = response.json()["data"]

    assert len(explanation["why_connected"]) >= 1

    correlation = explanation["why_connected"][0]

    assert correlation["reason"] == (
        "Login is associated with the same user and session."
    )

    assert correlation["strength"] == 0.9


def test_explanation_uses_incident_priority():
    incident_id = create_test_incident()

    response = client.post(
        f"/api/incidents/{incident_id}/explain"
    )

    assert response.status_code == 200

    explanation = response.json()["data"]

    assert "86" in explanation["why_investigate"]
    assert "HIGH" in explanation["why_investigate"]