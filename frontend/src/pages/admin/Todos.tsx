import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../api'
import type { Project, Todo } from '../../types'

const PRIORITY = ['低', '中', '高'] as const
const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b']

export default function Todos() {
  const [projects, setProjects] = useState<Project[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [error, setError] = useState('')
  const [showDone, setShowDone] = useState(true)

  const [newProject, setNewProject] = useState({ name: '', color: COLORS[0] })
  const [newTodo, setNewTodo] = useState({ title: '', priority: 1, due_date: '' })

  const fail = (e: unknown) => setError((e as Error).message)

  const loadProjects = useCallback(async () => {
    const list = await api.projects()
    setProjects(list)
    setActiveId((cur) => (cur && list.some((p) => p.id === cur) ? cur : (list[0]?.id ?? null)))
  }, [])

  useEffect(() => {
    loadProjects().catch(fail)
  }, [loadProjects])

  useEffect(() => {
    if (activeId == null) return setTodos([])
    api.todos(activeId).then(setTodos).catch(fail)
  }, [activeId])

  const refresh = async () => {
    if (activeId != null) setTodos(await api.todos(activeId))
    await loadProjects()
  }

  async function addProject(e: FormEvent) {
    e.preventDefault()
    if (!newProject.name.trim()) return
    try {
      const p = await api.createProject({ ...newProject, description: '' })
      setNewProject({ name: '', color: COLORS[(COLORS.indexOf(newProject.color) + 1) % COLORS.length] })
      await loadProjects()
      setActiveId(p.id)
    } catch (err) {
      fail(err)
    }
  }

  async function renameProject(p: Project) {
    const name = prompt('项目名称', p.name)?.trim()
    if (!name || name === p.name) return
    await api.updateProject(p.id, { name, description: p.description, color: p.color }).catch(fail)
    await loadProjects()
  }

  async function removeProject(p: Project) {
    if (!confirm(`删除项目「${p.name}」及其下 ${p.todo_count} 条待办？`)) return
    await api.deleteProject(p.id).catch(fail)
    await loadProjects()
  }

  async function addTodo(e: FormEvent) {
    e.preventDefault()
    if (activeId == null || !newTodo.title.trim()) return
    try {
      await api.createTodo({
        project_id: activeId,
        title: newTodo.title.trim(),
        priority: newTodo.priority,
        due_date: newTodo.due_date || null,
      })
      setNewTodo({ ...newTodo, title: '' })
      await refresh()
    } catch (err) {
      fail(err)
    }
  }

  async function toggle(t: Todo) {
    await api.updateTodo(t.id, { done: !t.done }).catch(fail)
    await refresh()
  }

  async function editTodo(t: Todo) {
    const title = prompt('待办内容', t.title)?.trim()
    if (!title || title === t.title) return
    await api.updateTodo(t.id, { title }).catch(fail)
    await refresh()
  }

  async function removeTodo(t: Todo) {
    if (!confirm(`删除待办「${t.title}」？`)) return
    await api.deleteTodo(t.id).catch(fail)
    await refresh()
  }

  const active = projects.find((p) => p.id === activeId)
  const visible = showDone ? todos : todos.filter((t) => !t.done)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <h1>待办事项</h1>
      {error && (
        <p className="error" onClick={() => setError('')}>
          {error}（点击关闭）
        </p>
      )}
      <div className="todo-layout">
        <section className="card project-panel">
          <h3>项目</h3>
          <ul className="project-list">
            {projects.map((p) => (
              <li
                key={p.id}
                className={p.id === activeId ? 'active' : ''}
                onClick={() => setActiveId(p.id)}
              >
                <span className="dot" style={{ background: p.color }} />
                <span className="grow">{p.name}</span>
                <span className="muted small">
                  {p.done_count}/{p.todo_count}
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={addProject} className="inline-form">
            <input
              placeholder="新项目名称"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            />
            <input
              type="color"
              value={newProject.color}
              onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
              title="项目颜色"
            />
            <button className="btn primary">添加</button>
          </form>
        </section>

        <section className="card todo-panel">
          {!active ? (
            <p className="muted">还没有项目。先创建一个项目，然后就可以在项目下添加待办了。</p>
          ) : (
            <>
              <div className="section-head">
                <h3>
                  <span className="dot" style={{ background: active.color }} /> {active.name}
                </h3>
                <div className="row">
                  <label className="small">
                    <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />{' '}
                    显示已完成
                  </label>
                  <button className="btn small" onClick={() => renameProject(active)}>
                    重命名
                  </button>
                  <button className="btn small danger" onClick={() => removeProject(active)}>
                    删除项目
                  </button>
                </div>
              </div>

              <form onSubmit={addTodo} className="inline-form">
                <input
                  className="grow"
                  placeholder="添加待办，回车保存"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                />
                <select
                  value={newTodo.priority}
                  onChange={(e) => setNewTodo({ ...newTodo, priority: Number(e.target.value) })}
                  title="优先级"
                >
                  {PRIORITY.map((label, i) => (
                    <option key={i} value={i}>
                      {label}优先级
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTodo.due_date}
                  onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                  title="截止日期"
                />
                <button className="btn primary">添加</button>
              </form>

              {visible.length === 0 && <p className="muted">暂无待办</p>}
              <ul className="todo-list">
                {visible.map((t) => (
                  <li key={t.id} className={t.done ? 'done' : ''}>
                    <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
                    <span className="grow todo-title" onDoubleClick={() => editTodo(t)} title="双击编辑">
                      {t.title}
                    </span>
                    <span className={`badge p${t.priority}`}>{PRIORITY[t.priority]}</span>
                    {t.due_date && (
                      <span className={`small ${!t.done && t.due_date < today ? 'error' : 'muted'}`}>
                        {t.due_date}
                      </span>
                    )}
                    <button className="icon-btn" onClick={() => removeTodo(t)} title="删除">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
