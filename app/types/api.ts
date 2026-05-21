export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived'
export type ProjectVisibility = 'private' | 'org'
export type TaskStatus = 'pending' | 'wip' | 'blocked' | 'done'
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
  email: string
  role: OrgRole
  created_at: string
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
  id: string
  title: string
  description: string
  status: TaskStatus | ''
  priority: TaskPriority | ''
  assignee_id: string
  due_at: string
  updated_at: string
  completed_at: string
}

export interface TaskDependency {
  id: string
  title: string
  status: TaskStatus
}

export interface Task extends TaskSummary {
  assignee: User
  created_at: string
  dependencies: TaskDependency[]
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
