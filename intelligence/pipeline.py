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

        # Phase 2:
        # Convert raw normalized event into deterministic features.
        features = extract_features(normalized_event)

        # Phase 3:
        # Build behavioral baseline from historical context.
        baseline = build_baseline(
            event=normalized_event,
            features=features,
            context=historical_context,
        )

        # Phase 4 will consume:
        #   features
        #   baseline
        #
        # and produce anomaly results.

        return IntelligenceResult()


def process_event(
    normalized_event: NormalizedEvent,
    historical_context: HistoricalContext,
) -> IntelligenceResult:

    pipeline = IntelligencePipeline()

    return pipeline.process(
        normalized_event,
        historical_context,
    )