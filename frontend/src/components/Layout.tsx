import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Layout() {
  const { user } = useAuth()
  return (
    <div className="site">
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            首页
          </Link>
          <nav className="nav">
            <NavLink to="/" end>
              关于我
            </NavLink>
            <NavLink to="/blog">博客</NavLink>
            {user ? <NavLink to="/me">个人空间</NavLink> : <NavLink to="/login">登录</NavLink>}
          </nav>
        </div>
      </header>
      <main className="container site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container muted">
          © {new Date().getFullYear()}
          {/* 备案通过后在此填写备案号，例如：
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">京ICP备xxxxxxxx号</a> */}
        </div>
      </footer>
    </div>
  )
}
