from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.evidence import Evidence
from app.models.event import Event
from app.models.incident import Incident
from app.services.evidence_service import (
    create_evidence,
    get_incident_evidence,
)


def test_create_and_get_evidence():

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    incident = Incident(
        incident_id="INC-001",
        title="Suspicious account activity",
        status="INCIDENT_CANDIDATE",
        priority_score=72.0,
        priority_label="HIGH",
    )

    event = Event(
        event_id="EVT-001",
        timestamp=datetime.fromisoformat(
            "2026-09-25T10:00:00"
        ),
        event_type="login",
        user_id="USR-001",
        device_id="DEV-001",
        event_metadata={},
    )

    db.add(incident)
    db.add(event)
    db.commit()

    evidence = create_evidence(
        db=db,
        evidence_id="EVD-001",
        incident_id="INC-001",
        event_id="EVT-001",
        evidence_type="SUPPORTING",
        description="Login occurred from a previously unseen device",
        impact="Supports investigation of unusual account activity",
    )

    assert evidence.evidence_id == "EVD-001"
    assert evidence.incident_id == "INC-001"
    assert evidence.event_id == "EVT-001"
    assert evidence.type == "SUPPORTING"

    results = get_incident_evidence(
        db,
        "INC-001",
    )

    assert len(results) == 1
    assert results[0].evidence_id == "EVD-001"

    db.close()