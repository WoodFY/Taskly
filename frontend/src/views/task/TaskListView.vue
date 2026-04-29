<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTaskStore } from '@/stores/task'
  import AppHeader from '@/components/layout/AppHeader.vue'
  import TaskCard from '@/components/task/TaskCard.vue'
  import TaskForm from '@/components/task/TaskForm.vue'
  import TaskFilter from '@/components/task/TaskFilter.vue'
  import type { Task, TaskStatus } from '@/api/task'

  const { t } = useI18n()
  const taskStore = useTaskStore()

  const isFormVisible = ref(false)
  const editingTask = ref<Task | null>(null)

  onMounted(() => {
    taskStore.fetchList()
  })

  function openCreate() {
    editingTask.value = null
    isFormVisible.value = true
  }

  function openEdit(task: Task) {
    editingTask.value = task
    isFormVisible.value = true
  }

  function closeForm() {
    isFormVisible.value = false
    editingTask.value = null
  }

  async function handleFormSubmit(data: {
    title: string
    description: string
    status: TaskStatus
    dueDate: string
  }) {
    if (editingTask.value) {
      await taskStore.updateTask({ id: editingTask.value._id, ...data })
    } else {
      await taskStore.createTask(data)
    }
    closeForm()
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('task.confirmDelete'))) return
    await taskStore.deleteTask(id)
  }

  function handleFilter(params: { status?: TaskStatus; keyword?: string; dueDateStart?: string; dueDateEnd?: string }) {
    taskStore.setFilter(params)
  }

  function handleReset() {
    taskStore.resetFilter()
  }

  const totalPages = () => Math.ceil(taskStore.total / (taskStore.filter.pageSize ?? 10))
</script>

<template>
  <div class="task-page">
    <AppHeader />

    <main class="task-page__main">
      <!-- 统计看板 -->
      <div class="stats-board">
        <div class="stat-item card">
          <div class="stat-item__value">{{ taskStore.stats.total }}</div>
          <div class="stat-item__label">{{ t('stats.total') }}</div>
        </div>
        <div class="stat-item card">
          <div class="stat-item__value">{{ taskStore.stats.completed }}</div>
          <div class="stat-item__label">{{ t('stats.completed') }}</div>
        </div>
        <div class="stat-item card">
          <div class="stat-item__value">{{ taskStore.stats.completionRate }}%</div>
          <div class="stat-item__label">{{ t('stats.completionRate') }}</div>
        </div>
      </div>

      <!-- 筛选器 -->
      <TaskFilter
        @filter="handleFilter"
        @reset="handleReset"
      />

      <!-- 操作栏 -->
      <div class="task-toolbar">
        <span class="task-toolbar__count">
          {{ t('pagination.total', { total: taskStore.total }) }}
        </span>
        <button
          class="btn btn-primary btn-sm"
          @click="openCreate"
        >
          + {{ t('task.createTask') }}
        </button>
      </div>

      <!-- 任务列表 -->
      <div
        v-if="taskStore.isLoading"
        class="task-empty"
      >
        {{ t('common.loading') }}
      </div>

      <div
        v-else-if="taskStore.list.length === 0"
        class="task-empty"
      >
        {{ t('task.noTasks') }}
      </div>

      <div
        v-else
        class="task-grid"
      >
        <TaskCard
          v-for="task in taskStore.list"
          :key="task._id"
          :task="task"
          @edit="openEdit"
          @delete="handleDelete"
        />
      </div>

      <!-- 分页 -->
      <div
        v-if="totalPages() > 1"
        class="pagination"
      >
        <button
          class="btn btn-secondary btn-sm"
          :disabled="taskStore.filter.page === 1"
          @click="taskStore.setPage((taskStore.filter.page ?? 1) - 1)"
        >
          {{ t('pagination.prev') }}
        </button>
        <span class="pagination__info">{{ taskStore.filter.page }} / {{ totalPages() }}</span>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="taskStore.filter.page === totalPages()"
          @click="taskStore.setPage((taskStore.filter.page ?? 1) + 1)"
        >
          {{ t('pagination.next') }}
        </button>
      </div>
    </main>

    <!-- 任务表单弹窗 -->
    <TaskForm
      :is-visible="isFormVisible"
      :task="editingTask"
      @close="closeForm"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .task-page {
    min-height: 100vh;

    &__main {
      max-width: 960px;
      margin: 0 auto;
      padding: 24px 16px;
    }
  }

  .stats-board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-item {
    text-align: center;
    padding: 16px;

    &__value {
      font-size: 28px;
      font-weight: 700;
      color: @primary-color;
    }

    &__label {
      font-size: 13px;
      color: @text-secondary;
      margin-top: 4px;
    }
  }

  .task-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    &__count {
      font-size: 13px;
      color: @text-secondary;
    }
  }

  .task-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .task-empty {
    text-align: center;
    padding: 60px 0;
    color: @text-secondary;
    font-size: 15px;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;

    &__info {
      font-size: 13px;
      color: @text-secondary;
    }
  }
</style>
