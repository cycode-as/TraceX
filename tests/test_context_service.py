from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from app.core.database import Base
from app.models.event import Event
from app.schemas.event import NormalizedEvent
from app.services.context_service import get_historical_context


def test_historical_context():

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    db.add(
        Event(
            event_id="EVT-HISTORY-001",
            timestamp=datetime.fromisoformat("2026-09-25T09:00:00"),
            event_type="login",
            user_id="USR-101",
            device_id="DEV-882",
        )
    )

    db.add(
        Event(
            event_id="EVT-HISTORY-002",
            timestamp=datetime.fromisoformat("2026-09-25T09:05:00"),
            event_type="mfa_failure",
            user_id="USR-101",
            device_id="DEV-882",
        )
    )

    db.commit()

    current_event = NormalizedEvent(
        event_id="EVT-HISTORY-003",
        timestamp="2026-09-25T09:10:00",
        event_type="resource_access",
        user_id="USR-101",
        device_id="DEV-882",
    )

    context = get_historical_context(
        db,
        current_event,
    )

    assert len(context["user_events"]) == 2
    assert len(context["device_events"]) == 2
    assert context["related_events"] == []
    assert context["existing_incident"] is None

    db.close()