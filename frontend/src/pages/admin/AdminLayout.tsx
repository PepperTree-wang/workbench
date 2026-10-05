import { Suspense } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="admin">
      <aside className="admin-side">
        <Link to="/" className="brand">
          ← 返回首页
        </Link>
        <nav>
          <NavLink to="/me/todos">✅ 待办事项</NavLink>
          <NavLink to="/me/posts">📝 博客管理</NavLink>
          <NavLink to="/me/profile">👤 个人资料</NavLink>
        </nav>
        <div className="admin-user">
          <span className="muted">{user?.username}</span>
          <button
            className="btn small"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            退出
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Suspense fallback={<p className="muted">加载中…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
