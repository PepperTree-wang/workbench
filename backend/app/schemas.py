from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(ORM):
    id: int
    username: str


# ---------- profile ----------
class SocialLink(BaseModel):
    platform: str = Field(max_length=32)
    url: str = Field(max_length=512)


class ProfileIn(BaseModel):
    name: str = Field("", max_length=64)
    title: str = Field("", max_length=128)
    avatar_url: str = Field("", max_length=512)
    bio: str = ""
    email: str = Field("", max_length=128)
    resume_md: str = ""
    social_links: list[SocialLink] = []


class ProfileOut(ProfileIn, ORM):
    updated_at: datetime | None = None


# ---------- posts ----------
class PostIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(None, max_length=200)
    summary: str = Field("", max_length=500)
    content_md: str = ""


class PostListItem(ORM):
    id: int
    title: str
    slug: str
    summary: str
    status: Literal["draft", "published"]
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PostOut(PostListItem):
    content_md: str


# ---------- projects / todos ----------
class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ""
    color: str = Field("#4f46e5", max_length=16)


class ProjectOut(ORM):
    id: int
    name: str
    description: str
    color: str
    created_at: datetime
    todo_count: int = 0
    done_count: int = 0


class TodoIn(BaseModel):
    project_id: int
    title: str = Field(min_length=1, max_length=200)
    notes: str = ""
    priority: int = Field(1, ge=0, le=2)
    due_date: date | None = None


class TodoUpdate(BaseModel):
    project_id: int | None = None
    title: str | None = Field(None, min_length=1, max_length=200)
    notes: str | None = None
    done: bool | None = None
    priority: int | None = Field(None, ge=0, le=2)
    due_date: date | None = None


class TodoOut(ORM):
    id: int
    project_id: int
    title: str
    notes: str
    done: bool
    priority: int
    due_date: date | None
    created_at: datetime
    updated_at: datetime
