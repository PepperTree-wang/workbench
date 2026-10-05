import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../../api'
import Markdown from '../../components/Markdown'
import type { Profile } from '../../types'

const PLATFORMS = ['GitHub', '知乎', '微博', '掘金', 'Bilibili', '小红书', 'X / Twitter', 'LinkedIn']

export default function ProfileEditor() {
  const [p, setP] = useState<Profile | null>(null)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.profile().then(setP).catch((e) => setError(e.message))
  }, [])

  if (!p) return <p className="muted">{error || '加载中…'}</p>

  const set = (patch: Partial<Profile>) => setP({ ...p, ...patch })
  const setLink = (i: number, patch: Partial<Profile['social_links'][number]>) =>
    set({ social_links: p.social_links.map((l, j) => (j === i ? { ...l, ...patch } : l)) })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const links = p!.social_links.filter((l) => l.platform.trim() && l.url.trim())
      setP(await api.updateProfile({ ...p!, social_links: links }))
      setMsg('已保存')
      setTimeout(() => setMsg(''), 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="section-head">
        <h1>个人资料</h1>
        <div className="row">
          {msg && <span className="success small">{msg}</span>}
          <a className="btn" href="/" target="_blank">
            预览首页
          </a>
          <button className="btn primary" disabled={busy}>
            保存
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card form-grid">
        <label>
          姓名
          <input value={p.name} onChange={(e) => set({ name: e.target.value })} />
        </label>
        <label>
          头衔 / 职位
          <input value={p.title} onChange={(e) => set({ title: e.target.value })} placeholder="全栈工程师" />
        </label>
        <label>
          邮箱
          <input type="email" value={p.email} onChange={(e) => set({ email: e.target.value })} />
        </label>
        <label>
          头像地址
          <input value={p.avatar_url} onChange={(e) => set({ avatar_url: e.target.value })} placeholder="https://…" />
        </label>
        <label className="full">
          一句话简介
          <textarea rows={2} value={p.bio} onChange={(e) => set({ bio: e.target.value })} />
        </label>
      </div>

      <h3>社交媒体</h3>
      <div className="card">
        <datalist id="platforms">
          {PLATFORMS.map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
        {p.social_links.map((l, i) => (
          <div key={i} className="inline-form">
            <input
              list="platforms"
              placeholder="平台"
              value={l.platform}
              onChange={(e) => setLink(i, { platform: e.target.value })}
            />
            <input
              className="grow"
              placeholder="https://…"
              value={l.url}
              onChange={(e) => setLink(i, { url: e.target.value })}
            />
            <button
              type="button"
              className="icon-btn"
              onClick={() => set({ social_links: p.social_links.filter((_, j) => j !== i) })}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn small"
          onClick={() => set({ social_links: [...p.social_links, { platform: '', url: '' }] })}
        >
          + 添加链接
        </button>
      </div>

      <h3>简历（Markdown）</h3>
      <div className="split">
        <textarea
          value={p.resume_md}
          onChange={(e) => set({ resume_md: e.target.value })}
          placeholder={'## 工作经历\n\n### 某公司 · 后端工程师（2022 – 至今）\n- …\n\n## 教育背景\n\n## 技能'}
        />
        <div className="preview card">
          {p.resume_md ? <Markdown>{p.resume_md}</Markdown> : <p className="muted">预览区</p>}
        </div>
      </div>
    </form>
  )
}
