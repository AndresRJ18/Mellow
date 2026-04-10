import os
import jwt
from jwt import PyJWKClient
from fastapi import Header, HTTPException

_SUPABASE_URL = os.getenv("SUPABASE_URL", "")
_JWKS_URL = f"{_SUPABASE_URL}/auth/v1/.well-known/jwks.json"

_jwks_client = PyJWKClient(_JWKS_URL, cache_keys=True)


def get_user_id(authorization: str = Header(...)) -> str:
    """Validates Supabase JWT (ES256 or HS256) and returns the user UUID."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = authorization[7:]
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "HS256"],
            audience="authenticated",
        )
        return payload["sub"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
