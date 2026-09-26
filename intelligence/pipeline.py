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

        features = extract_features(normalized_event)

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