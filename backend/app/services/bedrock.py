import json
import os
import boto3
from app.prompts.mood_analysis import SYSTEM_PROMPT, build_user_prompt

_MODEL_ID = "us.amazon.nova-lite-v1:0"

_client: boto3.client = None


def _get_client() -> boto3.client:
    global _client
    if _client is None:
        _client = boto3.client(
            "bedrock-runtime",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
        )
    return _client


def _invoke(user_prompt: str) -> str:
    client = _get_client()
    body = {
        "messages": [{"role": "user", "content": [{"text": user_prompt}]}],
        "system": [{"text": SYSTEM_PROMPT}],
        "inferenceConfig": {
            "maxTokens": 1024,
            "temperature": 0.7,
        },
    }
    response = client.invoke_model(
        modelId=_MODEL_ID,
        body=json.dumps(body),
        contentType="application/json",
        accept="application/json",
    )
    result = json.loads(response["body"].read())
    return result["output"]["message"]["content"][0]["text"]


def _parse_json(raw: str) -> dict:
    # Strip markdown fences if the model slips them in despite instructions
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    return json.loads(text)


async def call_nova_lite(
    emotional_text: str,
    music_taste_text: str | None,
    slider_tempo: int,
    slider_lyrics: int,
    slider_familiarity: int,
) -> dict:
    """Call Nova Lite and return parsed JSON. Retries once on malformed JSON."""
    user_prompt = build_user_prompt(
        emotional_text, music_taste_text, slider_tempo, slider_lyrics, slider_familiarity
    )

    raw = _invoke(user_prompt)
    try:
        return _parse_json(raw)
    except (json.JSONDecodeError, KeyError):
        # One retry
        raw = _invoke(user_prompt)
        try:
            return _parse_json(raw)
        except (json.JSONDecodeError, KeyError) as exc:
            raise ValueError(f"Bedrock returned malformed JSON after retry: {exc}\n{raw}")
