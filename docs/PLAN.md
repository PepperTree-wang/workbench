# 个人网站 技术方案

## 1. 目标

一个部署在个人云服务器上的个人网站：

- **访客（不登录）**：浏览首页 —— 个人简介 / 简历、联系邮箱、社交媒体链接、已发布的博客文章列表与详情。
- **站长（登录后）**：进入个人后台
  - 待办事项：先建「项目」，再在项目下建「待办」
  - 博客管理：Markdown 编辑、保存草稿、发布 / 撤回发布、删除
  - 个人资料：维护简历、邮箱、社交链接（首页数据来源）

站点只有一个用户（你自己），不开放注册，管理员账号通过命令行创建。

## 2. 技术栈

| 层 | 选型 | 说明 |
|---|---|---|
| 后端 | Python 3.12+ / FastAPI / SQLAlchemy 2.0 / Pydantic v2 | 自带 OpenAPI 文档，开发调试方便 |
| 数据库 | SQLite（WAL 模式） | 单文件，备份只需复制一个文件 |
| 认证 | JWT（PyJWT）+ bcrypt 密码哈希 | 前端存 token，请求头 `Authorization: Bearer` |
| 前端 | React 18 + TypeScript + Vite + React Router | 构建为纯静态文件 |
| Markdown | react-markdown + remark-gfm + rehype-highlight | 博客与简历都用 Markdown |
| 部署 | Nginx + systemd + uvicorn | Nginx 托管静态文件并反代 `/api` |
| HTTPS | certbot（Let's Encrypt） | 备案通过、域名解析后执行 |

## 3. 数据模型

```
users      id, username(unique), password_hash, created_at
profile    id(=1 单行), name, title, avatar_url, bio, email, resume_md,
           social_links(JSON: [{platform, url}]), updated_at
posts      id, title, slug(unique), summary, content_md,
           status('draft'|'published'), published_at, created_at, updated_at
projects   id, name, description, color, created_at
todos      id, project_id(FK→projects, 级联删除), title, notes,
           done, priority(0低/1中/2高), due_date, created_at, updated_at
```

## 4. API 设计（前缀 `/api`）

公开接口：
- `GET  /profile` 个人资料（简历、邮箱、社交链接）
- `GET  /posts` 已发布文章列表
- `GET  /posts/{slug}` 已发布文章详情
- `POST /auth/login` 登录，返回 JWT

需登录：
- `GET  /auth/me`
- `PUT  /admin/profile`
- `GET/POST /admin/posts`，`GET/PUT/DELETE /admin/posts/{id}`
- `POST /admin/posts/{id}/publish`，`POST /admin/posts/{id}/unpublish`
- `GET/POST /admin/projects`，`PUT/DELETE /admin/projects/{id}`
- `GET /admin/todos?project_id=&done=`，`POST /admin/todos`，`PUT/DELETE /admin/todos/{id}`

规则：创建待办必须指定已存在的 `project_id`，否则 400/404。

## 5. 前端路由

```
/                 首页：简介 + 简历 + 联系方式 + 社交链接 + 最新文章
/blog             文章列表
/blog/:slug       文章详情
/login            登录
/me               个人后台（需登录，未登录跳转 /login）
  /me/todos       待办（左侧项目列表，右侧该项目的待办）
  /me/posts       文章管理（草稿 / 已发布）
  /me/posts/new   新建文章
  /me/posts/:id   编辑文章（左编辑右预览，保存草稿 / 发布）
  /me/profile     编辑个人资料与简历
```

## 6. 目录结构

```
workbench/
├── backend/         FastAPI 应用、CLI、测试
├── frontend/        React 应用
├── deploy/          nginx 配置、systemd 服务、部署脚本
└── docs/PLAN.md
```

## 7. 部署方案

1. 服务器安装 Python3、Nginx；本地或服务器上 `npm run build` 生成 `frontend/dist`。
2. 代码放在 `/opt/personal-site`，后端用 venv 安装依赖，`.env` 中配置 `SECRET_KEY`。
3. systemd 运行 `uvicorn app.main:app --host 127.0.0.1 --port 8000`。
4. Nginx：`/` 指向 `frontend/dist`（SPA 回退到 index.html），`/api/` 反代到 8000。
5. 备案通过后：域名 A 记录指向服务器 → `certbot --nginx -d 你的域名` 开启 HTTPS。
6. 备份：定时复制 `backend/data/site.db`。

注意：备案期间域名不能解析访问，可以先用服务器 IP 访问测试；云服务器安全组需放行 80/443。

## 8. 开发阶段

1. 后端：模型、认证、全部 API、管理员 CLI、接口测试
2. 前端：公共首页 / 博客、登录、后台（待办、文章、资料）
3. 部署文件与 README
