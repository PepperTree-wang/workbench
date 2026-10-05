import type { Post, PostListItem, Profile, Project, Todo } from './types'

const TOKEN_KEY = 'token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401 && token) {
    tokenStore.clear()
    window.dispatchEvent(new Event('auth:logout'))
  }
  if (!res.ok) {
    let msg = `请求失败 (${res.status})`
    try {
      const data = await res.json()
      if (typeof data.detail === 'string') msg = data.detail
      else if (Array.isArray(data.detail)) msg = data.detail.map((d: { msg: string }) => d.msg).join('；')
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

const get = <T,>(p: string) => request<T>('GET', p)
const post = <T,>(p: string, b?: unknown) => request<T>('POST', p, b ?? {})
const put = <T,>(p: string, b: unknown) => request<T>('PUT', p, b)
const del = (p: string) => request<void>('DELETE', p)

export type PostInput = { title: string; slug?: string; summary: string; content_md: string }
export type ProjectInput = { name: string; description: string; color: string }
export type TodoInput = {
  project_id: number
  title: string
  notes?: string
  priority?: number
  due_date?: string | null
}

export const api = {
  login: (username: string, password: string) =>
    post<{ access_token: string }>('/auth/login', { username, password }),
  me: () => get<{ id: number; username: string }>('/auth/me'),

  profile: () => get<Profile>('/profile'),
  updateProfile: (p: Profile) => put<Profile>('/admin/profile', p),

  posts: () => get<PostListItem[]>('/posts'),
  post: (slug: string) => get<Post>(`/posts/${encodeURIComponent(slug)}`),

  adminPosts: () => get<PostListItem[]>('/admin/posts'),
  adminPost: (id: number) => get<Post>(`/admin/posts/${id}`),
  createPost: (b: PostInput) => post<Post>('/admin/posts', b),
  updatePost: (id: number, b: PostInput) => put<Post>(`/admin/posts/${id}`, b),
  publishPost: (id: number) => post<Post>(`/admin/posts/${id}/publish`),
  unpublishPost: (id: number) => post<Post>(`/admin/posts/${id}/unpublish`),
  deletePost: (id: number) => del(`/admin/posts/${id}`),

  projects: () => get<Project[]>('/admin/projects'),
  createProject: (b: ProjectInput) => post<Project>('/admin/projects', b),
  updateProject: (id: number, b: ProjectInput) => put<Project>(`/admin/projects/${id}`, b),
  deleteProject: (id: number) => del(`/admin/projects/${id}`),

  todos: (projectId: number) => get<Todo[]>(`/admin/todos?project_id=${projectId}`),
  createTodo: (b: TodoInput) => post<Todo>('/admin/todos', b),
  updateTodo: (id: number, b: Partial<TodoInput> & { done?: boolean }) =>
    put<Todo>(`/admin/todos/${id}`, b),
  deleteTodo: (id: number) => del(`/admin/todos/${id}`),
}
