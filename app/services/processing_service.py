from uuid import uuid4

from sqlalchemy.orm import Session

from app.intelligence.pipeline import process_event
from app.schemas.event import NormalizedEvent
from app.services.audit_service import create_audit_log
from app.services.context_service import get_historical_context
from app.services.correlation_service import (
    create_correlation,
    link_event_to_correlation,
)
from app.services.evidence_service import create_evidence
from app.services.event_service import create_event, event_exists
from app.services.incident_event_service import link_event_to_incident
from app.services.incident_service import (
    create_incident,
    get_incident,
)


def generate_incident_id() -> str:
    """
    Generate a persistent Backend-owned incident identifier.
    """

    return f"INC-{uuid4().hex[:8].upper()}"


def generate_persistence_id(prefix: str) -> str:
    """
    Generate a unique identifier for persisted intelligence records.
    """

    return f"{prefix}-{uuid4().hex[:8].upper()}"


def _get_incident_title(event: NormalizedEvent) -> str:
    """
    Generate the required database title for a new incident.

    Intelligence owns the incident decision, while the Backend owns
    persistence details such as the database identifier and title.
    """

    event_name = event.event_type.value.replace("_", " ")

    return f"Suspicious {event_name} activity"


def _persist_correlations(
    db: Session,
    incident_id: str,
    current_event_id: str,
    correlations: list[dict],
) -> None:
    """
    Persist intelligence-produced correlations and their event links.

    The incident_id is intentionally not stored on the correlation
    itself. Incident membership is derived through the linked events.
    """

    for correlation in correlations:
        correlation_id = correlation.get("correlation_id")

        if not correlation_id:
            correlation_id = generate_persistence_id("COR")

        reason = correlation.get("reason")

        if not reason:
            continue

        strength = correlation.get("strength")

        if strength is None:
            strength = 0.0

        create_correlation(
            db=db,
            correlation_id=correlation_id,
            reason=reason,
            strength=float(strength),
        )

        event_ids = correlation.get("event_ids") or []

        if current_event_id not in event_ids:
            event_ids.append(current_event_id)

        for event_id in event_ids:
            relationship = (
                "CURRENT_EVENT"
                if event_id == current_event_id
                else "CORRELATED_EVENT"
            )

            link_event_to_correlation(
                db=db,
                correlation_id=correlation_id,
                event_id=event_id,
                relationship=relationship,
            )


def _persist_evidence(
    db: Session,
    incident_id: str,
    current_event_id: str,
    evidence_items: list[dict],
) -> None:
    """
    Persist intelligence-produced evidence and associate it
    with the current incident.
    """

    for item in evidence_items:
        evidence_id = item.get("evidence_id")

        if not evidence_id:
            evidence_id = generate_persistence_id("EVD")

        event_id = item.get("event_id") or current_event_id

        evidence_type = item.get("type")

        if not evidence_type:
            continue

        description = item.get("description")

        if not description:
            continue

        create_evidence(
            db=db,
            evidence_id=evidence_id,
            incident_id=incident_id,
            event_id=event_id,
            evidence_type=evidence_type,
            description=description,
            impact=item.get("impact"),
        )


def _apply_incident_result(
    db: Session,
    event: NormalizedEvent,
    intelligence_result: dict,
    historical_context: dict,
) -> str | None:
    """
    Convert the Intelligence incident decision into persistent
    Backend records.

    Returns the resulting incident_id, or None when Intelligence
    returned no incident.
    """

    incident_result = intelligence_result.get("incident")

    if not incident_result:
        return None

    action = incident_result.get("action")

    if action == "NONE":
        return None

    if action not in {"CREATED", "UPDATED"}:
        raise ValueError(
            f"Unsupported intelligence incident action: {action}"
        )

    status = incident_result.get(
        "status",
        "INCIDENT_CANDIDATE",
    )

    priority = intelligence_result.get("priority")

    priority_score = None
    priority_label = None

    if priority:
        priority_score = priority.get("score")
        priority_label = priority.get("label")

    if action == "CREATED":
        incident_id = generate_incident_id()

        incident = create_incident(
            db=db,
            incident_id=incident_id,
            title=_get_incident_title(event),
            status=status,
            priority_score=priority_score,
            priority_label=priority_label,
        )

    else:
        existing_incident = (
            historical_context.get("existing_incident")
        )

        if not existing_incident:
            raise ValueError(
                "Intelligence returned UPDATED but no existing "
                "incident was provided in historical context"
            )

        incident_id = existing_incident.get("incident_id")

        if not incident_id:
            raise ValueError(
                "Existing incident context does not contain "
                "an incident_id"
            )

        incident = get_incident(
            db=db,
            incident_id=incident_id,
        )

        if incident is None:
            raise ValueError(
                f"Existing incident '{incident_id}' was not found"
            )

        incident.status = status

        if priority:
            incident.priority_score = priority_score
            incident.priority_label = priority_label

        db.commit()
        db.refresh(incident)

    link_event_to_incident(
        db=db,
        incident_id=incident.incident_id,
        event_id=event.event_id,
        relationship="CURRENT_EVENT",
    )

    correlations = (
        intelligence_result.get("correlations")
        or []
    )

    _persist_correlations(
        db=db,
        incident_id=incident.incident_id,
        current_event_id=event.event_id,
        correlations=correlations,
    )

    evidence = (
        intelligence_result.get("evidence")
        or []
    )

    _persist_evidence(
        db=db,
        incident_id=incident.incident_id,
        current_event_id=event.event_id,
        evidence_items=evidence,
    )

    return incident.incident_id


def process_incoming_event(
    db: Session,
    event: NormalizedEvent,
) -> dict:
    if event_exists(db, event.event_id):
        raise ValueError("Event already exists")

    saved_event = create_event(
        db,
        event,
    )

    historical_context = get_historical_context(
        db,
        event,
    )

    try:
        intelligence_result = process_event(
            event,
            historical_context,
        )

    except Exception as exc:
        create_audit_log(
            db=db,
            audit_id=f"AUD-{event.event_id}",
            incident_id=None,
            action="INTELLIGENCE_PROCESSING_FAILED",
            actor="system",
            details={
                "event_id": event.event_id,
                "event_type": event.event_type.value,
                "timestamp": event.timestamp.isoformat(),
                "error": str(exc),
            },
        )

        raise

    incident_id = _apply_incident_result(
        db=db,
        event=event,
        intelligence_result=intelligence_result,
        historical_context=historical_context,
    )

    audit_action = "EVENT_PROCESSED"

    if incident_id:
        incident_result = (
            intelligence_result.get("incident")
            or {}
        )

        if incident_result.get("action") == "CREATED":
            audit_action = "INCIDENT_CREATED"
        elif incident_result.get("action") == "UPDATED":
            audit_action = "INCIDENT_UPDATED"

    create_audit_log(
        db=db,
        audit_id=f"AUD-{event.event_id}",
        incident_id=incident_id,
        action=audit_action,
        actor="system",
        details={
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp.isoformat(),
            "incident_action": (
                intelligence_result.get("incident")
                or {}
            ).get("action"),
            "priority": intelligence_result.get("priority"),
            "evidence_count": len(
                intelligence_result.get("evidence")
                or []
            ),
            "correlation_count": len(
                intelligence_result.get("correlations")
                or []
            ),
        },
    )

    return {
        "event": {
            "event_id": saved_event.event_id,
            "message": "Event processed successfully",
        },
        "intelligence": intelligence_result,
        "incident_id": incident_id,
    }