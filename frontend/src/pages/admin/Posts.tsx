import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import type { PostListItem, PostStatus } from '../../types'
import { formatDate } from '../../utils'

export default function Posts() {
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [filter, setFilter] = useState<PostStatus | 'all'>('all')
  const [error, setError] = useState('')

  const load = () => api.adminPosts().then(setPosts).catch((e) => setError(e.message))
  useEffect(() => {
    load()
  }, [])

  async function act(fn: () => Promise<unknown>) {
    try {
      await fn()
      await load()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const shown = filter === 'all' ? posts : posts.filter((p) => p.status === filter)
  const count = (s: PostStatus) => posts.filter((p) => p.status === s).length

  return (
    <div>
      <div className="section-head">
        <h1>博客管理</h1>
        <Link to="/me/posts/new" className="btn primary">
          + 写文章
        </Link>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="tabs">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          全部 ({posts.length})
        </button>
        <button className={filter === 'draft' ? 'active' : ''} onClick={() => setFilter('draft')}>
          草稿 ({count('draft')})
        </button>
        <button className={filter === 'published' ? 'active' : ''} onClick={() => setFilter('published')}>
          已发布 ({count('published')})
        </button>
      </div>
      <div className="card">
        {shown.length === 0 ? (
          <p className="muted">暂无文章</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>标题</th>
                <th>状态</th>
                <th>更新时间</th>
                <th>发布时间</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/me/posts/${p.id}`}>{p.title}</Link>
                  </td>
                  <td>
                    <span className={`status ${p.status}`}>{p.status === 'published' ? '已发布' : '草稿'}</span>
                  </td>
                  <td className="muted">{formatDate(p.updated_at)}</td>
                  <td className="muted">{formatDate(p.published_at)}</td>
                  <td className="actions">
                    {p.status === 'published' ? (
                      <>
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                          查看
                        </a>
                        <button className="link" onClick={() => act(() => api.unpublishPost(p.id))}>
                          撤回
                        </button>
                      </>
                    ) : (
                      <button className="link" onClick={() => act(() => api.publishPost(p.id))}>
                        发布
                      </button>
                    )}
                    <button
                      className="link danger"
                      onClick={() => confirm(`删除「${p.title}」？此操作不可恢复`) && act(() => api.deletePost(p.id))}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
