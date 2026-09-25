from sqlalchemy.orm import Session

from app.intelligence.pipeline import process_event
from app.schemas.event import NormalizedEvent
from app.services.audit_service import create_audit_log
from app.services.context_service import get_historical_context
from app.services.event_service import create_event, event_exists


def process_incoming_event(
    db: Session,
    event: NormalizedEvent,
) -> dict:
    if event_exists(db, event.event_id):
        raise ValueError("Event already exists")

    saved_event = create_event(db, event)

    historical_context = get_historical_context(
        db,
        event,
    )

    intelligence_result = process_event(
        event,
        historical_context,
    )

    create_audit_log(
        db=db,
        audit_id=f"AUD-{event.event_id}",
        incident_id=None,
        action="EVENT_PROCESSED",
        actor="system",
        details={
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
        },
    )

    return {
        "event": {
            "event_id": saved_event.event_id,
            "message": "Event processed successfully",
        },
        "intelligence": intelligence_result,
    }