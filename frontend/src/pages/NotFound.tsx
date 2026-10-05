import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="center">
      <h1>404</h1>
      <p className="muted">页面不存在</p>
      <Link to="/">回到首页</Link>
    </div>
  )
}
