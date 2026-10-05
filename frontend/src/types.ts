export interface SocialLink {
  platform: string
  url: string
}

export interface Profile {
  name: string
  title: string
  avatar_url: string
  bio: string
  email: string
  resume_md: string
  social_links: SocialLink[]
  updated_at?: string | null
}

export type PostStatus = 'draft' | 'published'

export interface PostListItem {
  id: number
  title: string
  slug: string
  summary: string
  status: PostStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Post extends PostListItem {
  content_md: string
}

export interface Project {
  id: number
  name: string
  description: string
  color: string
  created_at: string
  todo_count: number
  done_count: number
}

export interface Todo {
  id: number
  project_id: number
  title: string
  notes: string
  done: boolean
  priority: 0 | 1 | 2
  due_date: string | null
  created_at: string
  updated_at: string
}
