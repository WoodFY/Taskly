import http from './http'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export interface Task {
  _id: string
  title: string
  description: string
  status: TaskStatus
  isPinned: boolean
  dueDate?: string
  pinnedAt?: string
  createdAt: string
  updatedAt: string
}

export interface TaskStats {
  total: number
  completed: number
  completionRate: number
}

export interface GetTaskListParams {
  page?: number
  pageSize?: number
  status?: TaskStatus
  keyword?: string
  dueDateStart?: string
  dueDateEnd?: string
  createdAtDate?: string
}

export interface GetTaskListResult {
  list: Task[]
  total: number
  page: number
  pageSize: number
  stats: TaskStats
}

export interface CreateTaskParams {
  title: string
  description?: string
  status?: TaskStatus
  dueDate?: string
}

export interface UpdateTaskParams {
  id: string
  title?: string
  description?: string
  status?: TaskStatus
  dueDate?: string
}

export const taskApi = {
  getList: (params: GetTaskListParams) => http.post<any, GetTaskListResult>('/task/get-list', params),
  create: (params: CreateTaskParams) => http.post<any, Task>('/task/create', params),
  update: (params: UpdateTaskParams) => http.post<any, Task>('/task/update', params),
  delete: (id: string) => http.post('/task/delete', { id }),
  togglePin: (id: string) => http.post<any, Task>('/task/toggle-pin', { id }),
  getContribution: () => http.post<any, Record<string, number>>('/task/get-contribution')
}
