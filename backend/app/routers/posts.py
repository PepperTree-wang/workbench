import re
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Post, utcnow
from ..schemas import PostIn, PostListItem, PostOut
from ..security import current_user

public = APIRouter(prefix="/posts", tags=["posts"])
admin = APIRouter(prefix="/admin/posts", tags=["posts"], dependencies=[Depends(current_user)])


def _slugify(text: str) -> str:
    # \w 在 Python 中包含中文，中文标题会保留为中文 slug
    return re.sub(r"[^\w]+", "-", text.strip().lower()).strip("-_")[:180]


def _unique_slug(db: Session, wanted: str, exclude_id: int | None = None) -> str:
    base = _slugify(wanted) or f"post-{secrets.token_hex(3)}"
    slug, n = base, 2
    while True:
        existing = db.scalar(select(Post).where(Post.slug == slug))
        if existing is None or existing.id == exclude_id:
            return slug
        slug, n = f"{base}-{n}", n + 1


def _get(db: Session, post_id: int) -> Post:
    post = db.get(Post, post_id)
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "文章不存在")
    return post


# ---------- 公开 ----------
@public.get("", response_model=list[PostListItem])
def list_published(limit: int = Query(50, le=200), db: Session = Depends(get_db)):
    stmt = (
        select(Post)
        .where(Post.status == "published")
        .order_by(Post.published_at.desc())
        .limit(limit)
    )
    return db.scalars(stmt).all()


@public.get("/{slug}", response_model=PostOut)
def get_published(slug: str, db: Session = Depends(get_db)):
    post = db.scalar(select(Post).where(Post.slug == slug, Post.status == "published"))
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "文章不存在")
    return post


# ---------- 管理 ----------
@admin.get("", response_model=list[PostListItem])
def list_all(status_: str | None = Query(None, alias="status"), db: Session = Depends(get_db)):
    stmt = select(Post).order_by(Post.updated_at.desc())
    if status_:
        stmt = stmt.where(Post.status == status_)
    return db.scalars(stmt).all()


@admin.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
def create_post(body: PostIn, db: Session = Depends(get_db)):
    post = Post(
        title=body.title,
        slug=_unique_slug(db, body.slug or body.title),
        summary=body.summary,
        content_md=body.content_md,
    )
    db.add(post)
    db.commit()
    return post


@admin.get("/{post_id}", response_model=PostOut)
def get_post(post_id: int, db: Session = Depends(get_db)):
    return _get(db, post_id)


@admin.put("/{post_id}", response_model=PostOut)
def update_post(post_id: int, body: PostIn, db: Session = Depends(get_db)):
    post = _get(db, post_id)
    post.title = body.title
    post.summary = body.summary
    post.content_md = body.content_md
    if body.slug and body.slug != post.slug:
        post.slug = _unique_slug(db, body.slug, exclude_id=post.id)
    db.commit()
    return post


@admin.post("/{post_id}/publish", response_model=PostOut)
def publish(post_id: int, db: Session = Depends(get_db)):
    post = _get(db, post_id)
    post.status = "published"
    post.published_at = post.published_at or utcnow()
    db.commit()
    return post


@admin.post("/{post_id}/unpublish", response_model=PostOut)
def unpublish(post_id: int, db: Session = Depends(get_db)):
    post = _get(db, post_id)
    post.status = "draft"
    db.commit()
    return post


@admin.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    db.delete(_get(db, post_id))
    db.commit()
