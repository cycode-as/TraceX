from sqlalchemy.orm import Session

from app.models.event import Event
from app.schemas.event import NormalizedEvent
from app.services.event_service import get_events


def event_to_dict(event: Event) -> dict:
    return {
        "event_id": event.event_id,
        "timestamp": event.timestamp,
        "event_type": event.event_type,
        "user_id": event.user_id,
        "device_id": event.device_id,
        "ip_address": event.ip_address,
        "location": event.location,
        "session_id": event.session_id,
        "resource": event.resource,
        "action": event.action,
        "metadata": event.event_metadata,
    }


def get_historical_context(
    db: Session,
    event: NormalizedEvent,
) -> dict:

    user_events = []
    device_events = []
    related_events = []

    if event.user_id:
        user_events = get_events(
            db,
            user_id=event.user_id,
        )

    if event.device_id:
        device_events = get_events(
            db,
            device_id=event.device_id,
        )

    return {
        "user_events": [
            event_to_dict(item)
            for item in user_events
            if item.event_id != event.event_id
        ],
        "device_events": [
            event_to_dict(item)
            for item in device_events
            if item.event_id != event.event_id
        ],
        "related_events": [
            event_to_dict(item)
            for item in related_events
            if item.event_id != event.event_id
        ],
        "existing_incident": None,
    }