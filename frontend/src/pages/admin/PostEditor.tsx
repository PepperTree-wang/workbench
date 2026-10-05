import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom'
import { api, type PostInput } from '../../api'
import Markdown from '../../components/Markdown'
import type { Post } from '../../types'

const EMPTY: PostInput = { title: '', slug: '', summary: '', content_md: '' }

export default function PostEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [form, setForm] = useState<PostInput>(EMPTY)
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const formRef = useRef(form)
  formRef.current = form

  useEffect(() => {
    if (!id) {
      setPost(null)
      setForm(EMPTY)
      return
    }
    api
      .adminPost(Number(id))
      .then((p) => {
        setPost(p)
        setForm({ title: p.title, slug: p.slug, summary: p.summary, content_md: p.content_md })
        setDirty(false)
      })
      .catch((e) => setError(e.message))
  }, [id])

  const set = (patch: Partial<PostInput>) => {
    setForm((f) => ({ ...f, ...patch }))
    setDirty(true)
  }

  const save = useCallback(
    async (publish = false): Promise<Post | null> => {
      const data = formRef.current
      if (!data.title.trim()) {
        setError('标题不能为空')
        return null
      }
      setBusy(true)
      setError('')
      try {
        const body = { ...data, slug: data.slug?.trim() || undefined }
        let saved = post ? await api.updatePost(post.id, body) : await api.createPost(body)
        if (publish) saved = await api.publishPost(saved.id)
        setPost(saved)
        setForm((f) => ({ ...f, slug: saved.slug }))
        setDirty(false)
        setMsg(publish ? '已发布' : '草稿已保存')
        setTimeout(() => setMsg(''), 2000)
        if (!post) navigate(`/me/posts/${saved.id}`, { replace: true })
        return saved
      } catch (e) {
        setError((e as Error).message)
        return null
      } finally {
        setBusy(false)
      }
    },
    [post, navigate],
  )

  async function unpublish() {
    if (!post) return
    try {
      setPost(await api.unpublishPost(post.id))
      setMsg('已撤回为草稿')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  // Ctrl/Cmd + S 保存
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  // 未保存时提醒
  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (blocker.state === 'blocked') {
      if (confirm('有未保存的修改，确定离开？')) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker])

  const published = post?.status === 'published'

  return (
    <div className="editor">
      <div className="section-head">
        <div className="row">
          <Link to="/me/posts">← 文章列表</Link>
          <span className={`status ${post?.status ?? 'draft'}`}>{published ? '已发布' : '草稿'}</span>
          {dirty && <span className="muted small">未保存</span>}
          {msg && <span className="success small">{msg}</span>}
        </div>
        <div className="row">
          <button className="btn" onClick={() => save(false)} disabled={busy}>
            {published ? '保存修改' : '保存草稿'}
          </button>
          {published ? (
            <>
              <a className="btn" href={`/blog/${post!.slug}`} target="_blank" rel="noreferrer">
                查看
              </a>
              <button className="btn" onClick={unpublish} disabled={busy}>
                撤回发布
              </button>
            </>
          ) : (
            <button className="btn primary" onClick={() => save(true)} disabled={busy}>
              发布
            </button>
          )}
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <input
        className="title-input"
        placeholder="文章标题"
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
      />
      <div className="row meta-row">
        <label className="grow">
          链接 slug（留空按标题生成）
          <input value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="my-first-post" />
        </label>
        <label className="grow2">
          摘要
          <input value={form.summary} onChange={(e) => set({ summary: e.target.value })} placeholder="列表页展示的简介" />
        </label>
      </div>

      <div className="split">
        <textarea
          value={form.content_md}
          onChange={(e) => set({ content_md: e.target.value })}
          placeholder="使用 Markdown 写作…（Ctrl/⌘ + S 保存）"
        />
        <div className="preview card">
          {form.content_md ? <Markdown>{form.content_md}</Markdown> : <p className="muted">预览区</p>}
        </div>
      </div>
    </div>
  )
}
