import json
import os

import httpx

ENDPOINT = "https://api.openai.com/v1/chat/completions"
DEFAULT_MODEL = "gpt-4o-mini"


def _config():
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    model = os.environ.get("LLM_MODEL", "").strip() or DEFAULT_MODEL
    return key, model


def is_configured():
    key, _ = _config()
    if not key:
        return False
    lowered = key.lower()
    return "your-key" not in lowered and "your_key" not in lowered


def chat_json(system, payload, timeout=30.0, temperature=0.2):
    if not is_configured():
        raise RuntimeError("AI service unavailable")
    key, model = _config()
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                ENDPOINT,
                headers={"Authorization": "Bearer " + key},
                json={
                    "model": model,
                    "temperature": temperature,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": json.dumps(payload)},
                    ],
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            data = json.loads(content)
    except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError):
        raise RuntimeError("AI service unavailable")
    if not isinstance(data, dict):
        raise RuntimeError("AI service unavailable")
    return data