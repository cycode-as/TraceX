from .anomaly import detect_anomaly
from .baseline import build_baseline
from .correlation import correlate_events
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

        # Phase 2: Feature extraction
        features = extract_features(normalized_event)

        # Phase 3: Behavioral baseline
        baseline = build_baseline(
            event=normalized_event,
            features=features,
            context=historical_context,
        )

        # Phase 4: Anomaly detection
        anomaly = detect_anomaly(
            event=normalized_event,
            features=features,
            baseline=baseline,
        )

        # Phase 5: Entity resolution
        entities = resolve_entities(
            normalized_event,
        )

        # Phase 6: Event correlation
        correlations = correlate_events(
            event=normalized_event,
            context=historical_context,
        )

        return IntelligenceResult(
            anomalies=[anomaly],
            entities=entities,
            correlations=correlations,
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