from .anomaly import detect_anomaly
from .baseline import build_baseline
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

        # Phase 2: feature extraction
        features = extract_features(normalized_event)

        # Phase 3: behavioral baseline
        baseline = build_baseline(
            event=normalized_event,
            features=features,
            context=historical_context,
        )

        # Phase 4: anomaly detection
        anomaly = detect_anomaly(
            event=normalized_event,
            features=features,
            baseline=baseline,
        )

        return IntelligenceResult(
            anomalies=[anomaly],
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