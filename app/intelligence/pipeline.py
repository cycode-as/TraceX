from typing import Any

from app.schemas.event import NormalizedEvent


def process_event(
    event: NormalizedEvent,
    historical_context: dict[str, Any],
) -> dict[str, Any]:

    return {
        "anomalies": [],
        "entities": [],
        "correlations": [],
        "incident": None,
        "evidence": [],
        "priority": None,
    }