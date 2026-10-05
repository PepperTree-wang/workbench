from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Profile
from ..schemas import ProfileIn, ProfileOut
from ..security import current_user

public = APIRouter(tags=["profile"])
admin = APIRouter(prefix="/admin", tags=["profile"], dependencies=[Depends(current_user)])


def _get_or_create(db: Session) -> Profile:
    profile = db.get(Profile, 1)
    if profile is None:
        profile = Profile(id=1)
        db.add(profile)
        db.commit()
    return profile


@public.get("/profile", response_model=ProfileOut)
def get_profile(db: Session = Depends(get_db)):
    return _get_or_create(db)


@admin.put("/profile", response_model=ProfileOut)
def update_profile(body: ProfileIn, db: Session = Depends(get_db)):
    profile = _get_or_create(db)
    for key, value in body.model_dump().items():
        setattr(profile, key, value)
    db.commit()
    return profile
