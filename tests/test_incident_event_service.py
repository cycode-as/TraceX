from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from datetime import datetime

from app.core.database import Base
from app.models.event import Event
from app.models.incident import Incident
from app.services.incident_event_service import (
    get_incident_events,
    link_event_to_incident,
)


def test_link_event_to_incident():

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
        timestamp=datetime.fromisoformat("2026-09-25T10:00:00"),
        event_type="login",
        user_id="USR-001",
        device_id="DEV-001",
        event_metadata={},
    )

    db.add(incident)
    db.add(event)
    db.commit()

    linked_event = link_event_to_incident(
        db=db,
        incident_id="INC-001",
        event_id="EVT-001",
        relationship="SUPPORTING",
    )

    assert linked_event.incident_id == "INC-001"
    assert linked_event.event_id == "EVT-001"
    assert linked_event.relationship == "SUPPORTING"

    relationships = get_incident_events(
        db,
        "INC-001",
    )

    assert len(relationships) == 1
    assert relationships[0].event_id == "EVT-001"

    db.close()