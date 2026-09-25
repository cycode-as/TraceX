from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.evidence_service import get_incident_evidence
from app.services.incident_service import (
    get_incident,
    get_incident_timeline,
    get_incidents,
)


router = APIRouter(
    prefix="/api/incidents",
    tags=["Incidents"],
)


def incident_to_dict(incident):
    return {
        "incident_id": incident.incident_id,
        "title": incident.title,
        "status": incident.status,
        "priority_score": incident.priority_score,
        "priority_label": incident.priority_label,
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
        "resolved_at": incident.resolved_at,
    }


def event_to_dict(event):
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

def evidence_to_dict(evidence):
    return {
        "evidence_id": evidence.evidence_id,
        "incident_id": evidence.incident_id,
        "event_id": evidence.event_id,
        "type": evidence.type,
        "description": evidence.description,
        "impact": evidence.impact,
        "created_at": evidence.created_at,
    }

@router.get("")
def list_incidents(
    db: Session = Depends(get_db),
):
    incidents = get_incidents(db)

    return {
        "success": True,
        "data": [
            incident_to_dict(incident)
            for incident in incidents
        ],
        "error": None,
    }


@router.get("/{incident_id}")
def retrieve_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = get_incident(
        db,
        incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return {
        "success": True,
        "data": incident_to_dict(incident),
        "error": None,
    }


@router.get("/{incident_id}/timeline")
def retrieve_incident_timeline(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = get_incident(
        db,
        incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    events = get_incident_timeline(
        db,
        incident_id,
    )

    return {
        "success": True,
        "data": [
            event_to_dict(event)
            for event in events
        ],
        "error": None,
    }

@router.get("/{incident_id}/evidence")
def retrieve_incident_evidence(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = get_incident(
        db,
        incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    evidence = get_incident_evidence(
        db,
        incident_id,
    )

    return {
        "success": True,
        "data": [
            evidence_to_dict(item)
            for item in evidence
        ],
        "error": None,
    }