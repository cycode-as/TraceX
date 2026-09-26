import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.models.event import Event
from app.services.event_service import get_events


def test_sqlite_wal_mode_and_connection():
    with engine.connect() as conn:
        journal_mode = conn.execute(text("PRAGMA journal_mode;")).scalar()
        assert journal_mode.lower() in ("wal", "memory")


def test_event_service_time_window_filtering():
    db = SessionLocal()
    unique_user = f"USER_OPT_{uuid.uuid4().hex[:8]}"
    evt1_id = f"EVT_{uuid.uuid4().hex[:8]}"
    evt2_id = f"EVT_{uuid.uuid4().hex[:8]}"

    try:
        now = datetime.now(timezone.utc)
        ev1 = Event(
            event_id=evt1_id,
            timestamp=now - timedelta(minutes=10),
            event_type="AUTH",
            user_id=unique_user,
            event_metadata={}
        )
        ev2 = Event(
            event_id=evt2_id,
            timestamp=now,
            event_type="AUTH",
            user_id=unique_user,
            event_metadata={}
        )
        db.add_all([ev1, ev2])
        db.commit()

        # Query only the last 5 minutes
        filtered = get_events(
            db,
            user_id=unique_user,
            start_time=now - timedelta(minutes=5)
        )
        assert len(filtered) == 1
        assert filtered[0].event_id == evt2_id
    finally:
        db.rollback()
        db.query(Event).filter(Event.user_id == unique_user).delete()
        db.commit()
        db.close()