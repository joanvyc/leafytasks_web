export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived'
export type ProjectVisibility = 'private' | 'org'
export type TaskStatus = 'todo' | 'wip' | 'blocked' | 'canceled' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  name: string
  avatar: string
}

export type OrgRole = 'owner' | 'admin' | 'member'

export interface Org {
  id: string
  url_name: string
  title: string
}

export interface OrgMember {
  id: string
  email: string
  name: string
  role: OrgRole
}

export interface OrgInvite {
  id: string
  username: string
  role: OrgRole
  created_at: string
}

export interface UserSummary {
  id: string
  username: string
  name?: string
}

export type ApiDateTime = [number, number, number, number, number, number, number, number, number]

export interface Project {
  url_name: string
  title: string
  description: string
  end_date: ApiDateTime | null
  created_by: string
  created_at: ApiDateTime
  updated_at: ApiDateTime
}

export interface TaskSummary {
  id: number
  parent_id: number | null
  title: string
  description: string
  priority: string
  assignee_id: string
  due_at: ApiDateTime
  created_by: string
  created_at: ApiDateTime
  updated_at: ApiDateTime
  status: TaskStatus
  has_active_dependencies: boolean
  actionable: boolean
}

export interface StatusUpdate {
  status: TaskStatus | ProjectStatus
  description: string
  author: string
  created_at?: string
}

export interface DependableCandidate {
  id: string
  title: string
}
