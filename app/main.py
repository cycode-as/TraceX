from fastapi import Depends, FastAPI
from app.schemas.event import NormalizedEvent
from sqlalchemy.orm import Session

from app.core.database import Base, engine, get_db
from app.models.event import Event

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TraceX API",
    description="Incident Intelligence Backend for Autonomous AI Systems",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "TraceX API is running"
    }

@app.post("/api/events")
def create_event(
    event: NormalizedEvent,
    db: Session = Depends(get_db),
):
    db_event = Event(
    event_id=event.event_id,
    timestamp=event.timestamp,
    event_type=event.event_type,
    user_id=event.user_id,
    device_id=event.device_id,
    ip_address=event.ip_address,
    location=event.location,
    session_id=event.session_id,
    resource=event.resource,
    action=event.action,
)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return {
        "success": True,
        "data": event,
        "error": None,
    }

@app.get("/api/events")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()

    return {
        "success": True,
        "data": events,
        "error": None,
    }