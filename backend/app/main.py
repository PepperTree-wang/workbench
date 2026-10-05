from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  确保模型已注册
from .config import settings
from .database import Base, engine
from .routers import auth, posts, profile, todos


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="Personal Site API", lifespan=lifespan, docs_url="/api/docs",
              openapi_url="/api/openapi.json")

if settings.cors_origin_list:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )

for r in (auth.router, profile.public, profile.admin, posts.public, posts.admin, todos.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}
