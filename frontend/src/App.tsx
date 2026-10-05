import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './auth'
import Layout from './components/Layout'
import Blog from './pages/Blog'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import PostDetail from './pages/PostDetail'

// 后台页面按需加载，访客不下载后台代码
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const PostEditor = lazy(() => import('./pages/admin/PostEditor'))
const Posts = lazy(() => import('./pages/admin/Posts'))
const ProfileEditor = lazy(() => import('./pages/admin/ProfileEditor'))
const Todos = lazy(() => import('./pages/admin/Todos'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:slug" element={<PostDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="me"
        element={
          <RequireAuth>
            <Suspense fallback={<div className="center muted">加载中…</div>}>
              <AdminLayout />
            </Suspense>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="todos" replace />} />
        <Route path="todos" element={<Todos />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/new" element={<PostEditor />} />
        <Route path="posts/:id" element={<PostEditor />} />
        <Route path="profile" element={<ProfileEditor />} />
      </Route>
    </Routes>
  )
}
