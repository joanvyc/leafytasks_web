export type ProjectStatus = 'active' | 'on-hold' | 'completed' | 'archived'
export type TaskStatus = 'pending' | 'wip' | 'blocked' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface User {
  name: string
  avatar: string
}

export interface Project {
  url_name: string
  title: string
  description: string
  status: ProjectStatus
  owner: User
  start_date: string
  end_date: string
  tasks_total: number
  tasks_done: number
  created_at: string
  updated_at: string
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
