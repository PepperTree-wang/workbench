import os
import tempfile

_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-32b"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import User  # noqa: E402
from app.security import hash_password  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        with SessionLocal() as db:
            db.add(User(username="admin", password_hash=hash_password("password123")))
            db.commit()
        yield c


@pytest.fixture(scope="session")
def auth(client):
    r = client.post("/api/auth/login", json={"username": "admin", "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}
