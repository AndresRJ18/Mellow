import os
import jwt
from fastapi import Header, HTTPException

_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")


def get_user_id(authorization: str = Header(...)) -> str:
    """Validates Supabase JWT and returns the user UUID."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization[7:]
    try:
        payload = jwt.decode(
            token,
            _JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload["sub"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
