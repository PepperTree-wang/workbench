def test_login(client):
    bad = client.post("/api/auth/login", json={"username": "admin", "password": "nope"})
    assert bad.status_code == 401


def test_admin_requires_auth(client):
    assert client.get("/api/admin/posts").status_code == 401
    assert client.get("/api/admin/projects").status_code == 401
    assert client.put("/api/admin/profile", json={}).status_code == 401


def test_me(client, auth):
    assert client.get("/api/auth/me", headers=auth).json()["username"] == "admin"


def test_profile(client, auth):
    assert client.get("/api/profile").status_code == 200
    body = {
        "name": "张三",
        "email": "me@example.com",
        "resume_md": "## 经历",
        "social_links": [{"platform": "GitHub", "url": "https://github.com/x"}],
    }
    r = client.put("/api/admin/profile", json=body, headers=auth)
    assert r.status_code == 200
    got = client.get("/api/profile").json()
    assert got["email"] == "me@example.com"
    assert got["social_links"][0]["platform"] == "GitHub"


def test_post_draft_publish_flow(client, auth):
    r = client.post("/api/admin/posts", json={"title": "你好 World"}, headers=auth)
    assert r.status_code == 201
    post = r.json()
    assert post["status"] == "draft" and post["slug"] == "你好-world"

    # 草稿对外不可见
    assert client.get(f"/api/posts/{post['slug']}").status_code == 404
    assert client.get("/api/posts").json() == []

    r = client.post(f"/api/admin/posts/{post['id']}/publish", headers=auth)
    assert r.json()["status"] == "published" and r.json()["published_at"]
    assert client.get(f"/api/posts/{post['slug']}").status_code == 200
    assert len(client.get("/api/posts").json()) == 1

    # 同名标题生成不重复 slug
    dup = client.post("/api/admin/posts", json={"title": "你好 World"}, headers=auth).json()
    assert dup["slug"] == "你好-world-2"

    client.post(f"/api/admin/posts/{post['id']}/unpublish", headers=auth)
    assert client.get("/api/posts").json() == []

    assert client.delete(f"/api/admin/posts/{dup['id']}", headers=auth).status_code == 204


def test_todo_requires_project(client, auth):
    r = client.post("/api/admin/todos", json={"project_id": 9999, "title": "x"}, headers=auth)
    assert r.status_code == 404


def test_project_todo_flow(client, auth):
    p = client.post("/api/admin/projects", json={"name": "网站"}, headers=auth).json()
    t = client.post(
        "/api/admin/todos", json={"project_id": p["id"], "title": "写方案", "priority": 2},
        headers=auth,
    ).json()
    assert t["done"] is False

    r = client.put(f"/api/admin/todos/{t['id']}", json={"done": True}, headers=auth)
    assert r.json()["done"] is True

    projects = client.get("/api/admin/projects", headers=auth).json()
    mine = next(x for x in projects if x["id"] == p["id"])
    assert mine["todo_count"] == 1 and mine["done_count"] == 1

    todos = client.get(f"/api/admin/todos?project_id={p['id']}", headers=auth).json()
    assert len(todos) == 1

    # 删除项目级联删除待办
    assert client.delete(f"/api/admin/projects/{p['id']}", headers=auth).status_code == 204
    assert client.get(f"/api/admin/todos?project_id={p['id']}", headers=auth).json() == []
