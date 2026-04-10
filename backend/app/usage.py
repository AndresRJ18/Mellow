import os
from datetime import datetime, timezone
import httpx
from fastapi import HTTPException

_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
_MAX_SEARCHES = 5

_headers = {
    "apikey": _SERVICE_KEY,
    "Authorization": f"Bearer {_SERVICE_KEY}",
    "Content-Type": "application/json",
}


async def check_and_record_search(user_id: str) -> int:
    """
    Checks if user is under the daily limit and records the search.
    Returns remaining searches after this one.
    Raises HTTP 429 if limit exceeded.
    """
    today_start = datetime.now(timezone.utc).date().isoformat() + "T00:00:00+00:00"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{_SUPABASE_URL}/rest/v1/search_usage",
            params={
                "user_id": f"eq.{user_id}",
                "searched_at": f"gte.{today_start}",
                "select": "id",
            },
            headers=_headers,
        )
        count = len(resp.json())

        if count >= _MAX_SEARCHES:
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "daily_limit_exceeded",
                    "searches_used": count,
                    "max_searches": _MAX_SEARCHES,
                },
            )

        await client.post(
            f"{_SUPABASE_URL}/rest/v1/search_usage",
            json={"user_id": user_id},
            headers=_headers,
        )

    return _MAX_SEARCHES - count - 1
