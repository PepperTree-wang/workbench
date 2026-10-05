import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import Markdown from '../components/Markdown'
import type { PostListItem, Profile } from '../types'
import { formatDate } from '../utils'

export default function Home() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.profile().then(setProfile).catch((e) => setError(e.message))
    api.posts().then((p) => setPosts(p.slice(0, 5))).catch(() => {})
  }, [])

  if (error) return <p className="error">{error}</p>
  if (!profile) return <p className="muted">加载中…</p>

  const empty = !profile.name && !profile.bio && !profile.resume_md

  return (
    <div className="home">
      <section className="hero">
        {profile.avatar_url && <img className="avatar" src={profile.avatar_url} alt={profile.name} />}
        <div>
          <h1>{profile.name || '你好 👋'}</h1>
          {profile.title && <p className="subtitle">{profile.title}</p>}
          {profile.bio && <p className="bio">{profile.bio}</p>}
          <div className="contact">
            {profile.email && (
              <a className="chip" href={`mailto:${profile.email}`}>
                ✉ {profile.email}
              </a>
            )}
            {profile.social_links.map((l) => (
              <a key={l.platform + l.url} className="chip" href={l.url} target="_blank" rel="noreferrer">
                {l.platform}
              </a>
            ))}
          </div>
        </div>
      </section>

      {empty && <p className="muted">站点还在建设中，登录后在「个人空间 → 个人资料」中填写信息。</p>}

      <section className="section">
        <div className="section-head">
          <h2>最新文章</h2>
          <Link to="/blog">全部文章 →</Link>
        </div>
        {posts.length === 0 ? (
          <p className="muted">暂无文章</p>
        ) : (
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.id}>
                <Link to={`/blog/${p.slug}`}>{p.title}</Link>
                <span className="muted">{formatDate(p.published_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {profile.resume_md && (
        <section className="section">
          <h2>简历</h2>
          <Markdown>{profile.resume_md}</Markdown>
        </section>
      )}
    </div>
  )
}
