from .schemas import (
    HistoricalContext,
    IntelligenceResult,
    NormalizedEvent,
)


class IntelligencePipeline:
    """
    Main TraceX Intelligence entry point.

    Backend provides:
        - normalized_event
        - historical_context

    Intelligence returns:
        - structured IntelligenceResult
    """

    def process(
        self,
        normalized_event: NormalizedEvent,
        historical_context: HistoricalContext,
    ) -> IntelligenceResult:
        """
        Process one normalized event through the Intelligence pipeline.

        Phase 1:
        Establish the contract only.
        Actual intelligence components will be added in later phases.
        """

        return IntelligenceResult()


def process_event(
    normalized_event: NormalizedEvent,
    historical_context: HistoricalContext,
) -> IntelligenceResult:
    """
    Convenience function for Backend integration.
    """

    pipeline = IntelligencePipeline()

    return pipeline.process(
        normalized_event,
        historical_context,
    )