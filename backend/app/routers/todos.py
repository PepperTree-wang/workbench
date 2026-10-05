from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Project, Todo
from ..schemas import ProjectIn, ProjectOut, TodoIn, TodoOut, TodoUpdate
from ..security import current_user

router = APIRouter(prefix="/admin", tags=["todos"], dependencies=[Depends(current_user)])


def _get_project(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "项目不存在，请先创建项目")
    return project


def _get_todo(db: Session, todo_id: int) -> Todo:
    todo = db.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "待办不存在")
    return todo


def _project_out(project: Project, total: int = 0, done: int = 0) -> ProjectOut:
    out = ProjectOut.model_validate(project)
    out.todo_count, out.done_count = total, done
    return out


# ---------- 项目 ----------
@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    stmt = (
        select(
            Project,
            func.count(Todo.id),
            func.coalesce(func.sum(case((Todo.done, 1), else_=0)), 0),
        )
        .outerjoin(Todo)
        .group_by(Project.id)
        .order_by(Project.created_at)
    )
    return [_project_out(p, total, done) for p, total, done in db.execute(stmt)]


@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(body: ProjectIn, db: Session = Depends(get_db)):
    project = Project(**body.model_dump())
    db.add(project)
    db.commit()
    return _project_out(project)


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, body: ProjectIn, db: Session = Depends(get_db)):
    project = _get_project(db, project_id)
    for key, value in body.model_dump().items():
        setattr(project, key, value)
    db.commit()
    total = len(project.todos)
    return _project_out(project, total, sum(t.done for t in project.todos))


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db.delete(_get_project(db, project_id))
    db.commit()


# ---------- 待办 ----------
@router.get("/todos", response_model=list[TodoOut])
def list_todos(
    project_id: int | None = None, done: bool | None = None, db: Session = Depends(get_db)
):
    stmt = select(Todo).order_by(Todo.done, Todo.priority.desc(), Todo.created_at)
    if project_id is not None:
        stmt = stmt.where(Todo.project_id == project_id)
    if done is not None:
        stmt = stmt.where(Todo.done == done)
    return db.scalars(stmt).all()


@router.post("/todos", response_model=TodoOut, status_code=status.HTTP_201_CREATED)
def create_todo(body: TodoIn, db: Session = Depends(get_db)):
    _get_project(db, body.project_id)
    todo = Todo(**body.model_dump())
    db.add(todo)
    db.commit()
    return todo


@router.put("/todos/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, body: TodoUpdate, db: Session = Depends(get_db)):
    todo = _get_todo(db, todo_id)
    changes = body.model_dump(exclude_unset=True)
    if changes.get("project_id") is not None:
        _get_project(db, changes["project_id"])
    for key, value in changes.items():
        if value is None and key not in ("due_date",):
            continue
        setattr(todo, key, value)
    db.commit()
    return todo


@router.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, db: Session = Depends(get_db)):
    db.delete(_get_todo(db, todo_id))
    db.commit()
