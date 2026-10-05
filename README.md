# 个人网站

FastAPI + SQLite 后端，React + Vite 前端。方案见 [docs/PLAN.md](docs/PLAN.md)。

- 访客：首页（简介、简历、邮箱、社交链接、最新文章）、博客
- 登录后 `/me`：待办事项（先建项目再建待办）、博客管理（草稿 / 发布 / 撤回）、个人资料编辑

## 本地开发

```bash
# 后端（首次）
cd backend
cp .env.example .env
uv sync                                   # 国内网络慢可加：UV_DEFAULT_INDEX=https://mirrors.aliyun.com/pypi/simple
uv run python -m app.cli create-admin admin   # 创建管理员，按提示输入密码
uv run uvicorn app.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev                               # http://localhost:5173 ，/api 自动代理到 8000
```

接口文档：http://localhost:8000/api/docs

测试：`cd backend && uv run pytest`

## 部署到云服务器（Ubuntu 为例）

### 1. 服务器初始化（只需一次）

```bash
sudo apt update && sudo apt install -y nginx python3-venv rsync
sudo mkdir -p /opt/personal-site
```

云控制台安全组放行 80、443 端口。

### 2. 首次部署

本地执行（会构建前端、同步代码、安装依赖）：

```bash
SERVER=root@你的服务器IP ./deploy/deploy.sh
```

服务器上：

```bash
cd /opt/personal-site/backend
cp .env.example .env
# 生成随机密钥写入 .env 的 SECRET_KEY；CORS_ORIGINS 留空（同域部署不需要）
python3 -c "import secrets;print(secrets.token_urlsafe(48))"
vim .env

# 创建管理员
.venv/bin/python -m app.cli create-admin admin
chown -R www-data: data

# 后端服务
cp /opt/personal-site/deploy/personal-site.service /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now personal-site

# Nginx
cp /opt/personal-site/deploy/nginx.conf /etc/nginx/conf.d/personal-site.conf
# 编辑 server_name：备案通过前先写服务器 IP，通过后改成域名
nginx -t && systemctl reload nginx
```

> CentOS / Alibaba Cloud Linux 等系统 nginx 运行用户是 `nginx` 而不是 `www-data`，需要修改 service 文件中的 User/Group，部署时加 `RUN_USER=nginx`。

### 3. 备案通过后

1. 域名 A 记录解析到服务器 IP
2. 修改 nginx 中的 `server_name` 为你的域名
3. 申请 HTTPS 证书：
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d example.com -d www.example.com
   ```
4. 在 `frontend/src/components/Layout.tsx` 页脚填写备案号（工信部要求网站底部展示备案号并链接到 beian.miit.gov.cn）

### 4. 日常更新

```bash
SERVER=root@你的服务器IP ./deploy/deploy.sh
```

### 5. 备份

数据全部在 `/opt/personal-site/backend/data/site.db`。服务器上加定时备份：

```bash
crontab -e
# 每天 3 点备份，保留 30 份
0 3 * * * /opt/personal-site/deploy/backup.sh
```

## 管理员命令

```bash
python -m app.cli create-admin <用户名>
python -m app.cli reset-password <用户名>
```
