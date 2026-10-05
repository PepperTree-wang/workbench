import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import Markdown from '../components/Markdown'
import type { Post } from '../types'
import { formatDate } from '../utils'

export default function PostDetail() {
  const { slug = '' } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setPost(null)
    setError('')
    api
      .post(slug)
      .then((p) => {
        setPost(p)
        document.title = p.title
      })
      .catch((e) => setError(e.message))
  }, [slug])

  if (error)
    return (
      <div>
        <p className="error">{error}</p>
        <Link to="/blog">← 返回博客</Link>
      </div>
    )
  if (!post) return <p className="muted">加载中…</p>

  return (
    <article className="article">
      <Link to="/blog" className="muted">
        ← 返回博客
      </Link>
      <h1>{post.title}</h1>
      <p className="muted">{formatDate(post.published_at)}</p>
      <Markdown>{post.content_md}</Markdown>
    </article>
  )
}
