from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.incident_event import IncidentEvent


def link_event_to_incident(
    db: Session,
    incident_id: str,
    event_id: str,
    relationship: str,
) -> IncidentEvent:

    incident_event = IncidentEvent(
        incident_id=incident_id,
        event_id=event_id,
        relationship=relationship,
    )

    db.add(incident_event)
    db.commit()
    db.refresh(incident_event)

    return incident_event


def get_incident_events(
    db: Session,
    incident_id: str,
) -> list[IncidentEvent]:

    statement = (
        select(IncidentEvent)
        .where(
            IncidentEvent.incident_id == incident_id
        )
    )

    return list(db.scalars(statement).all())