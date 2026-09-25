from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.correlation import Correlation
from app.models.correlation_event import CorrelationEvent
from app.models.event import Event
from app.services.correlation_service import (
    create_correlation,
    get_correlation,
    get_correlation_events,
    link_event_to_correlation,
)


def test_correlation_persistence():

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    event = Event(
        event_id="EVT-CORR-001",
        timestamp=datetime.fromisoformat(
            "2026-09-25T10:00:00"
        ),
        event_type="login",
        user_id="USR-001",
        device_id="DEV-001",
        event_metadata={},
    )

    db.add(event)
    db.commit()

    correlation = create_correlation(
        db=db,
        correlation_id="CORR-001",
        reason="Same user and device within a short time window",
        strength=0.85,
    )

    assert correlation.correlation_id == "CORR-001"
    assert correlation.reason == (
        "Same user and device within a short time window"
    )
    assert correlation.strength == 0.85

    link = link_event_to_correlation(
        db=db,
        correlation_id="CORR-001",
        event_id="EVT-CORR-001",
        relationship="primary",
    )

    assert link.correlation_id == "CORR-001"
    assert link.event_id == "EVT-CORR-001"
    assert link.relationship == "primary"

    retrieved = get_correlation(
        db,
        "CORR-001",
    )

    assert retrieved is not None
    assert retrieved.correlation_id == "CORR-001"

    links = get_correlation_events(
        db,
        "CORR-001",
    )

    assert len(links) == 1
    assert links[0].event_id == "EVT-CORR-001"

    db.close()