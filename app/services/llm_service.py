import os
from typing import Any

import httpx
from dotenv import load_dotenv


load_dotenv()


class LLMService:
    """
    Optional OpenRouter-based explanation service.

    This service only explains structured TraceX results.
    It does not detect incidents, calculate priority,
    generate evidence, or modify TraceX state.
    """

    OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self) -> None:
        self.enabled = (
            os.getenv("TRACEX_LLM_ENABLED", "false").lower()
            == "true"
        )

        self.api_key = os.getenv("OPENROUTER_API_KEY")

        self.model = os.getenv(
            "TRACEX_LLM_MODEL",
            "openrouter/free",
        )

    def is_available(self) -> bool:
        """
        Return whether the OpenRouter provider is configured.
        """

        return (
            self.enabled
            and bool(self.api_key)
        )

    def generate_explanation(
        self,
        context: dict[str, Any],
    ) -> str:
        """
        Generate a human-readable explanation from
        structured TraceX facts.

        The LLM is explicitly instructed not to create
        new security conclusions.
        """

        if not self.is_available():
            raise RuntimeError(
                "OpenRouter LLM is not configured"
            )

        prompt = self._build_prompt(context)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are the explanation layer for TraceX. "
                        "You explain only structured facts supplied "
                        "by TraceX and must not invent security findings."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "temperature": 0.2,
        }

        try:
            response = httpx.post(
                self.OPENROUTER_URL,
                headers=headers,
                json=payload,
                timeout=10.0,
            )

            response.raise_for_status()

        except httpx.HTTPStatusError as exc:
            raise RuntimeError(
                f"OpenRouter API request failed: "
                f"{exc.response.status_code} "
                f"{exc.response.text}"
            ) from exc

        except httpx.HTTPError as exc:
            raise RuntimeError(
                f"OpenRouter API request failed: {exc}"
            ) from exc

        response_data = response.json()

        choices = response_data.get("choices", [])

        if not choices:
            raise RuntimeError(
                "OpenRouter returned no choices"
            )

        message = choices[0].get("message", {})

        content = message.get("content")

        if not content:
            raise RuntimeError(
                "OpenRouter returned an empty response"
            )

        return content.strip()

    def _build_prompt(
        self,
        context: dict[str, Any],
    ) -> str:
        """
        Build a constrained explanation prompt.

        Only structured TraceX data is supplied to the model.
        """

        return f"""
You are the explanation layer for TraceX,
an incident-intelligence system.

Your job is ONLY to explain findings that TraceX
has already produced.

You MUST follow these rules:

1. Do not invent events.
2. Do not invent evidence.
3. Do not invent correlations.
4. Do not change the incident priority.
5. Do not decide whether an incident should exist.
6. Do not claim that an attack definitely occurred.
7. Do not introduce facts outside the supplied TraceX data.
8. Clearly distinguish supporting evidence from mitigating evidence.
9. Explain why events are connected using only supplied correlations.
10. Explain why the current investigation priority exists.
11. Keep the explanation concise and suitable for a security analyst.

TRACE X STRUCTURED CONTEXT:

{context}

Produce a concise explanation containing:

SUMMARY:
A short description of what TraceX identified.

WHY CONNECTED:
Explain how the supplied events are connected.

SUPPORTING EVIDENCE:
List the supplied evidence that increases concern.

MITIGATING EVIDENCE:
List the supplied evidence that reduces concern.

WHY INVESTIGATE:
Explain the current TraceX priority and status.

RECOMMENDED ACTIONS:
Suggest analyst-oriented next steps based only on the supplied
incident state and evidence.

Do not add information that is not present in the TraceX context.
""".strip()