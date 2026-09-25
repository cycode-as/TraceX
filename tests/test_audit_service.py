from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.audit_log import AuditLog
from app.models.incident import Incident
from app.services.audit_service import (
    create_audit_log,
    get_incident_audit_logs,
)


def create_test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    return SessionLocal()


def test_create_audit_log():
    db = create_test_db()

    incident = Incident(
        incident_id="INC-001",
        title="Test incident",
        status="INCIDENT_CANDIDATE",
    )

    db.add(incident)
    db.commit()

    audit = create_audit_log(
        db=db,
        audit_id="AUD-001",
        incident_id="INC-001",
        action="INCIDENT_CREATED",
        actor="system",
        details={
            "event_id": "EVT-001",
        },
    )

    assert audit.audit_id == "AUD-001"
    assert audit.incident_id == "INC-001"
    assert audit.action == "INCIDENT_CREATED"
    assert audit.actor == "system"
    assert audit.details["event_id"] == "EVT-001"


def test_get_incident_audit_logs():
    db = create_test_db()

    incident = Incident(
        incident_id="INC-001",
        title="Test incident",
        status="INCIDENT_CANDIDATE",
    )

    db.add(incident)
    db.commit()

    create_audit_log(
        db=db,
        audit_id="AUD-001",
        incident_id="INC-001",
        action="INCIDENT_CREATED",
        actor="system",
        details={"event_id": "EVT-001"},
    )

    create_audit_log(
        db=db,
        audit_id="AUD-002",
        incident_id="INC-001",
        action="INCIDENT_UPDATED",
        actor="system",
        details={"event_id": "EVT-002"},
    )

    logs = get_incident_audit_logs(
        db=db,
        incident_id="INC-001",
    )

    assert len(logs) == 2
    assert logs[0].audit_id == "AUD-001"
    assert logs[1].audit_id == "AUD-002"