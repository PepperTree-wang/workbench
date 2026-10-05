import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import type { PostListItem } from '../types'
import { formatDate } from '../utils'

export default function Blog() {
  const [posts, setPosts] = useState<PostListItem[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.posts().then(setPosts).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!posts) return <p className="muted">加载中…</p>

  return (
    <div>
      <h1>博客</h1>
      {posts.length === 0 && <p className="muted">暂无文章</p>}
      <div className="post-cards">
        {posts.map((p) => (
          <Link key={p.id} to={`/blog/${p.slug}`} className="post-card">
            <h3>{p.title}</h3>
            {p.summary && <p>{p.summary}</p>}
            <span className="muted">{formatDate(p.published_at)}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
