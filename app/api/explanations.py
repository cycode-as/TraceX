from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.explanation import ExplanationResponse
from app.services.explanation_service import (
    build_explanation_context,
    generate_deterministic_explanation,
)
from app.services.incident_service import get_incident


router = APIRouter(
    prefix="/api/incidents",
    tags=["AI Explanation"],
)


@router.post(
    "/{incident_id}/explain",
    response_model=dict,
)
def explain_incident(
    incident_id: str,
    db: Session = Depends(get_db),
):
    incident = get_incident(
        db=db,
        incident_id=incident_id,
    )

    if incident is None:
        raise HTTPException(
            status_code=404,
            detail={
                "success": False,
                "data": None,
                "error": {
                    "code": "INCIDENT_NOT_FOUND",
                    "message": f"Incident '{incident_id}' not found",
                },
            },
        )

    try:
        context = build_explanation_context(
            db=db,
            incident=incident,
        )

        explanation = generate_deterministic_explanation(
            context=context,
        )

        validated_explanation = ExplanationResponse(
            **explanation
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "data": None,
                "error": {
                    "code": "EXPLANATION_ERROR",
                    "message": str(exc),
                },
            },
        )

    return {
        "success": True,
        "data": validated_explanation.model_dump(),
        "error": None,
    }