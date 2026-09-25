from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.schemas.event import NormalizedEvent
from app.services.processing_service import process_incoming_event


def test_process_incoming_event():

    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    event = NormalizedEvent(
        event_id="EVT-PROCESS-001",
        timestamp=datetime.fromisoformat(
            "2026-09-25T09:12:00"
        ),
        event_type="login",
        user_id="USR-101",
        device_id="DEV-882",
    )

    result = process_incoming_event(
        db,
        event,
    )

    assert result["event"]["event_id"] == "EVT-PROCESS-001"
    assert result["intelligence"] is not None

    assert "anomalies" in result["intelligence"]
    assert "entities" in result["intelligence"]
    assert "correlations" in result["intelligence"]
    assert "incident" in result["intelligence"]
    assert "evidence" in result["intelligence"]
    assert "priority" in result["intelligence"]

    db.close()