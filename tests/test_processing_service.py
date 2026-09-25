from datetime import datetime

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.audit_log import AuditLog
from app.models.correlation import Correlation
from app.models.correlation_event import CorrelationEvent
from app.models.evidence import Evidence
from app.models.event import Event
from app.models.incident import Incident
from app.models.incident_event import IncidentEvent
from app.schemas.event import NormalizedEvent
from app.services.processing_service import process_incoming_event


def create_test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)

    return SessionLocal()


def create_event():
    return NormalizedEvent(
        event_id="EVT-PROCESS-001",
        timestamp=datetime.fromisoformat(
            "2026-09-25T09:12:00"
        ),
        event_type="login",
        user_id="USR-101",
        device_id="DEV-882",
        ip_address="10.0.0.15",
        session_id="SES-001",
        location="Indore",
    )


def test_process_incoming_event(monkeypatch):
    db = create_test_db()

    def fake_process_event(event, historical_context):
        return {
            "anomalies": [],
            "entities": [],
            "correlations": [],
            "incident": None,
            "evidence": [],
            "priority": None,
        }

    monkeypatch.setattr(
        "app.services.processing_service.process_event",
        fake_process_event,
    )

    result = process_incoming_event(
        db,
        create_event(),
    )

    assert result["event"]["event_id"] == "EVT-PROCESS-001"
    assert result["intelligence"] is not None
    assert result["incident_id"] is None

    assert "anomalies" in result["intelligence"]
    assert "entities" in result["intelligence"]
    assert "correlations" in result["intelligence"]
    assert "incident" in result["intelligence"]
    assert "evidence" in result["intelligence"]
    assert "priority" in result["intelligence"]

    event = db.get(
        Event,
        "EVT-PROCESS-001",
    )

    assert event is not None

    audit = db.scalars(
        select(AuditLog).where(
            AuditLog.audit_id
            == "AUD-EVT-PROCESS-001"
        )
    ).first()

    assert audit is not None
    assert audit.action == "EVENT_PROCESSED"
    assert audit.actor == "system"
    assert audit.incident_id is None
    assert audit.details["event_id"] == "EVT-PROCESS-001"

    db.close()


def test_created_incident_persists_intelligence_results(
    monkeypatch,
):
    db = create_test_db()

    def fake_process_event(event, historical_context):
        return {
            "anomalies": [
                {
                    "event_id": event.event_id,
                    "is_anomaly": True,
                    "score": 0.82,
                    "reasons": [
                        "Unusual login location"
                    ],
                }
            ],
            "entities": [],
            "correlations": [
                {
                    "correlation_id": "COR-PROCESS-001",
                    "event_ids": [
                        event.event_id
                    ],
                    "reason": "Same user and session",
                    "strength": 0.91,
                }
            ],
            "incident": {
                "action": "CREATED",
                "status": "INCIDENT_CANDIDATE",
            },
            "evidence": [
                {
                    "evidence_id": "EVD-PROCESS-001",
                    "event_id": event.event_id,
                    "type": "SUPPORTING",
                    "description": "Unusual login location",
                    "impact": "increases_priority",
                }
            ],
            "priority": {
                "score": 86,
                "label": "HIGH",
                "factors": {
                    "behavioral_anomaly": 24,
                    "correlation_strength": 18,
                },
            },
        }

    monkeypatch.setattr(
        "app.services.processing_service.process_event",
        fake_process_event,
    )

    result = process_incoming_event(
        db,
        create_event(),
    )

    incident_id = result["incident_id"]

    assert incident_id is not None
    assert incident_id.startswith("INC-")

    incident = db.get(
        Incident,
        incident_id,
    )

    assert incident is not None
    assert incident.status == "INCIDENT_CANDIDATE"
    assert incident.priority_score == 86
    assert incident.priority_label == "HIGH"

    incident_event = db.scalars(
        select(IncidentEvent).where(
            IncidentEvent.incident_id == incident_id,
            IncidentEvent.event_id == "EVT-PROCESS-001",
        )
    ).first()

    assert incident_event is not None
    assert incident_event.relationship == "CURRENT_EVENT"

    evidence = db.get(
        Evidence,
        "EVD-PROCESS-001",
    )

    assert evidence is not None
    assert evidence.incident_id == incident_id
    assert evidence.event_id == "EVT-PROCESS-001"
    assert evidence.type == "SUPPORTING"

    correlation = db.get(
        Correlation,
        "COR-PROCESS-001",
    )

    assert correlation is not None
    assert correlation.reason == "Same user and session"
    assert correlation.strength == 0.91

    correlation_event = db.scalars(
        select(CorrelationEvent).where(
            CorrelationEvent.correlation_id
            == "COR-PROCESS-001",
            CorrelationEvent.event_id
            == "EVT-PROCESS-001",
        )
    ).first()

    assert correlation_event is not None

    audit = db.scalars(
        select(AuditLog).where(
            AuditLog.audit_id
            == "AUD-EVT-PROCESS-001"
        )
    ).first()

    assert audit is not None
    assert audit.action == "INCIDENT_CREATED"
    assert audit.incident_id == incident_id
    assert audit.details["incident_action"] == "CREATED"

    db.close()


def test_updated_incident_uses_existing_incident(
    monkeypatch,
):
    db = create_test_db()

    first_event = create_event()

    def first_process_event(event, historical_context):
        return {
            "anomalies": [],
            "entities": [],
            "correlations": [],
            "incident": {
                "action": "CREATED",
                "status": "INCIDENT_CANDIDATE",
            },
            "evidence": [],
            "priority": {
                "score": 50,
                "label": "MEDIUM",
                "factors": {},
            },
        }

    monkeypatch.setattr(
        "app.services.processing_service.process_event",
        first_process_event,
    )

    first_result = process_incoming_event(
        db,
        first_event,
    )

    incident_id = first_result["incident_id"]

    assert incident_id is not None

    second_event = NormalizedEvent(
        event_id="EVT-PROCESS-002",
        timestamp=datetime.fromisoformat(
            "2026-09-25T09:31:00"
        ),
        event_type="privilege_change",
        user_id="USR-101",
        device_id="DEV-882",
        ip_address="10.0.0.15",
        session_id="SES-001",
        location="Indore",
    )

    def second_process_event(
        event,
        historical_context,
    ):
        assert (
            historical_context["existing_incident"]
            is not None
        )

        assert (
            historical_context["existing_incident"]
            ["incident_id"]
            == incident_id
        )

        return {
            "anomalies": [],
            "entities": [],
            "correlations": [],
            "incident": {
                "action": "UPDATED",
                "status": "HIGH_PRIORITY",
            },
            "evidence": [],
            "priority": {
                "score": 86,
                "label": "HIGH",
                "factors": {},
            },
        }

    monkeypatch.setattr(
        "app.services.processing_service.process_event",
        second_process_event,
    )

    second_result = process_incoming_event(
        db,
        second_event,
    )

    assert second_result["incident_id"] == incident_id

    incidents = list(
        db.scalars(
            select(Incident)
        ).all()
    )

    assert len(incidents) == 1

    incident = incidents[0]

    assert incident.incident_id == incident_id
    assert incident.status == "HIGH_PRIORITY"
    assert incident.priority_score == 86
    assert incident.priority_label == "HIGH"

    linked_events = list(
        db.scalars(
            select(IncidentEvent).where(
                IncidentEvent.incident_id
                == incident_id
            )
        ).all()
    )

    assert len(linked_events) == 2

    event_ids = {
        item.event_id
        for item in linked_events
    }

    assert event_ids == {
        "EVT-PROCESS-001",
        "EVT-PROCESS-002",
    }

    db.close()


def test_intelligence_failure_does_not_create_incident(
    monkeypatch,
):
    db = create_test_db()

    def failing_process_event(
        event,
        historical_context,
    ):
        raise RuntimeError(
            "Intelligence engine unavailable"
        )

    monkeypatch.setattr(
        "app.services.processing_service.process_event",
        failing_process_event,
    )

    try:
        process_incoming_event(
            db,
            create_event(),
        )
        assert False, "Expected intelligence failure"
    except RuntimeError as exc:
        assert str(exc) == (
            "Intelligence engine unavailable"
        )

    incidents = list(
        db.scalars(
            select(Incident)
        ).all()
    )

    assert incidents == []

    event = db.get(
        Event,
        "EVT-PROCESS-001",
    )

    assert event is not None

    audit = db.scalars(
        select(AuditLog).where(
            AuditLog.audit_id
            == "AUD-EVT-PROCESS-001"
        )
    ).first()

    assert audit is not None
    assert audit.action == (
        "INTELLIGENCE_PROCESSING_FAILED"
    )

    db.close()