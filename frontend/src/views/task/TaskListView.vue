<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTaskStore } from '@/stores/task'
  import AppHeader from '@/components/layout/AppHeader.vue'
  import TaskCard from '@/components/task/TaskCard.vue'
  import TaskForm from '@/components/task/TaskForm.vue'
  import TaskFilter from '@/components/task/TaskFilter.vue'
  import ContributionCalendar from '@/components/contribution/ContributionCalendar.vue'
  import type { Task, TaskStatus, GetTaskListParams } from '@/api/task'

  const { t } = useI18n()
  const taskStore = useTaskStore()

  const isFormVisible = ref(false)
  const editingTask = ref<Task | null>(null)

  // 日历日期筛选状态
  const selectedDate = ref<string | null>(null)
  const savedFilter = ref<GetTaskListParams | null>(null)
  let restoreTimer: ReturnType<typeof setTimeout> | null = null

  onMounted(() => {
    taskStore.fetchList()
  })

  onUnmounted(() => {
    if (restoreTimer) clearTimeout(restoreTimer)
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

  async function handleFormSubmit(data: { title: string; description: string; status: TaskStatus; dueDate: string }) {
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

  async function handlePin(id: string) {
    await taskStore.togglePin(id)
  }

  function handleFilter(params: { status?: TaskStatus; keyword?: string; dueDateStart?: string; dueDateEnd?: string }) {
    taskStore.setFilter(params)
  }

  function handleReset() {
    taskStore.resetFilter()
  }

  function restoreSavedFilter() {
    if (restoreTimer) {
      clearTimeout(restoreTimer)
      restoreTimer = null
    }
    selectedDate.value = null
    if (savedFilter.value) {
      taskStore.setFilter({ ...savedFilter.value, createdAtDate: undefined })
      savedFilter.value = null
    } else {
      taskStore.resetFilter()
    }
  }

  function handleDateSelect(date: string) {
    // 再次点击同一格 → 立即还原
    if (selectedDate.value === date) {
      restoreSavedFilter()
      return
    }

    // 首次点击：保存当前 filter，切换到日期筛选
    if (!selectedDate.value) {
      savedFilter.value = { ...taskStore.filter }
    }

    if (restoreTimer) clearTimeout(restoreTimer)

    selectedDate.value = date
    taskStore.setFilter({ createdAtDate: date })

    // 1 分钟后自动还原
    restoreTimer = setTimeout(() => {
      restoreSavedFilter()
    }, 60_000)
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
        <div class="task-toolbar__right">
          <span
            v-if="selectedDate"
            class="date-filter-chip"
            @click="restoreSavedFilter"
          >
            {{ selectedDate }} &times;
          </span>
          <button
            class="btn btn-primary btn-sm"
            @click="openCreate"
          >
            + {{ t('task.createTask') }}
          </button>
        </div>
      </div>

      <!-- 任务列表（单行横向滚动） -->
      <div :class="['task-list-area', { 'is-loading': taskStore.isLoading }]">
        <Transition
          name="task-fade"
          mode="out-in"
        >
          <div
            v-if="taskStore.list.length === 0 && !taskStore.isLoading"
            key="empty"
            class="task-empty"
          >
            {{ t('task.noTasks') }}
          </div>
          <div
            v-else
            key="list"
            class="task-row"
          >
            <div
              v-for="task in taskStore.list"
              :key="task._id"
              class="task-row__item"
            >
              <TaskCard
                :task="task"
                @edit="openEdit"
                @delete="handleDelete"
                @pin="handlePin"
              />
            </div>
          </div>
        </Transition>
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

      <!-- Contribution 日历 -->
      <ContributionCalendar
        :selected-date="selectedDate"
        @select-date="handleDateSelect"
      />
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
      padding: 24px 16px 40px;
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

    &__right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .date-filter-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    background-color: fade(@primary-color, 15%);
    color: @primary-color;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: @transition;

    &:hover {
      background-color: fade(@primary-color, 25%);
    }
  }

  .task-list-area {
    transition: opacity 0.25s ease;
    min-height: 140px;

    &.is-loading {
      opacity: 0.45;
      pointer-events: none;
    }
  }

  .task-fade-enter-active,
  .task-fade-leave-active {
    transition: opacity 0.18s ease;
  }

  .task-fade-enter-from,
  .task-fade-leave-to {
    opacity: 0;
  }

  // 单行横向滚动
  .task-row {
    display: flex;
    flex-wrap: nowrap;
    gap: 12px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-bottom: 4px;

    // 自定义滚动条
    &::-webkit-scrollbar {
      height: 8px;
    }
    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;

      &:hover {
        background: #a8a8a8;
      }
    }

    &__item {
      flex: 0 0 280px;
      min-width: 0;
    }
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
    margin-top: 12px;

    &__info {
      font-size: 13px;
      color: @text-secondary;
    }
  }
</style>
