from typing import Any

from app.schemas.event import NormalizedEvent


def process_event(
    event: NormalizedEvent,
    historical_context: dict[str, Any],
) -> dict[str, Any]:
    """
    Process one normalized event through the TraceX
    intelligence layer.

    The intelligence layer returns structured results.
    It does not persist data or make API responses.
    """

    return {
        "anomalies": [],
        "entities": [],
        "correlations": [],
        "incident": None,
        "evidence": [],
        "priority": None,
    }