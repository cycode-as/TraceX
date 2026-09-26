from .anomaly import detect_anomaly
from .baseline import build_baseline
from .entities import resolve_entities
from .features import extract_features
from .schemas import (
    HistoricalContext,
    IntelligenceResult,
    NormalizedEvent,
)


class IntelligencePipeline:
    """
    Main TraceX Intelligence entry point.
    """

    def process(
        self,
        normalized_event: NormalizedEvent,
        historical_context: HistoricalContext,
    ) -> IntelligenceResult:

        # Phase 2
        features = extract_features(normalized_event)

        # Phase 3
        baseline = build_baseline(
            event=normalized_event,
            features=features,
            context=historical_context,
        )

        # Phase 4
        anomaly = detect_anomaly(
            event=normalized_event,
            features=features,
            baseline=baseline,
        )

        # Phase 5
        entities = resolve_entities(normalized_event)

        return IntelligenceResult(
            anomalies=[anomaly],
            entities=entities,
        )


def process_event(
    normalized_event: NormalizedEvent,
    historical_context: HistoricalContext,
) -> IntelligenceResult:

    pipeline = IntelligencePipeline()

    return pipeline.process(
        normalized_event,
        historical_context,
    )