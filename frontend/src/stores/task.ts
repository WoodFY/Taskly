import { defineStore } from 'pinia'
import { ref } from 'vue'
import { taskApi, type Task, type GetTaskListParams, type TaskStats } from '@/api/task'

export const useTaskStore = defineStore('task', () => {
  const list = ref<Task[]>([])
  const total = ref(0)
  const isLoading = ref(false)
  const stats = ref<TaskStats>({ total: 0, completed: 0, completionRate: 0 })
  const filter = ref<GetTaskListParams>({ page: 1, pageSize: 1000 })

  async function fetchList() {
    isLoading.value = true
    try {
      const res = await taskApi.getList(filter.value)
      list.value = res.list
      total.value = res.total
      stats.value = res.stats
    } finally {
      isLoading.value = false
    }
  }

  async function createTask(params: Parameters<typeof taskApi.create>[0]) {
    await taskApi.create(params)
    await fetchList()
  }

  async function updateTask(params: Parameters<typeof taskApi.update>[0]) {
    await taskApi.update(params)
    await fetchList()
  }

  async function deleteTask(id: string) {
    await taskApi.delete(id)
    await fetchList()
  }

  function setFilter(params: Partial<GetTaskListParams>) {
    filter.value = { ...filter.value, ...params, page: 1 }
    fetchList()
  }

  async function togglePin(id: string) {
    await taskApi.togglePin(id)
    await fetchList()
  }

  function resetFilter() {
    filter.value = { page: 1, pageSize: 1000 }
    fetchList()
  }

  return { list, total, isLoading, stats, filter, fetchList, createTask, updateTask, deleteTask, togglePin, setFilter, resetFilter }
})
