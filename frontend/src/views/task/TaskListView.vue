<script setup lang="ts">
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { useTaskStore } from '@/stores/task'
  import AppHeader from '@/components/layout/AppHeader.vue'
  import TaskCard from '@/components/task/TaskCard.vue'
  import TaskForm from '@/components/task/TaskForm.vue'
  import TaskFilter from '@/components/task/TaskFilter.vue'
  import ContributionCalendar from '@/components/contribution/ContributionCalendar.vue'
  import AiReportModal from '@/components/ai/AiReportModal.vue'
  import { aiApi, type ReportType } from '@/api/ai'
  import type { Task, TaskStatus, GetTaskListParams } from '@/api/task'

  const { t, locale } = useI18n()
  const taskStore = useTaskStore()

  const isFormVisible = ref(false)
  const editingTask = ref<Task | null>(null)

  // 日历日期筛选状态
  const selectedDate = ref<string | null>(null)
  const savedFilter = ref<GetTaskListParams | null>(null)
  let restoreTimer: ReturnType<typeof setTimeout> | null = null

  // 任务选择状态
  const selectedTaskIds = ref<Set<string>>(new Set())

  // AI 报告状态
  const isAiMenuOpen = ref(false)
  const isAiModalVisible = ref(false)
  const aiReportType = ref<ReportType>('daily')
  const aiPrompts = ref({ dailyPrompt: '', weeklyPrompt: '' })
  const isAiPromptsLoaded = ref(false)

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
    const next = new Set(selectedTaskIds.value)
    next.delete(id)
    selectedTaskIds.value = next
  }

  async function handlePin(id: string) {
    await taskStore.togglePin(id)
  }

  function handleSelect(id: string) {
    const next = new Set(selectedTaskIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    selectedTaskIds.value = next
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
    if (selectedDate.value === date) {
      restoreSavedFilter()
      return
    }
    if (!selectedDate.value) {
      savedFilter.value = { ...taskStore.filter }
    }
    if (restoreTimer) clearTimeout(restoreTimer)
    selectedDate.value = date
    taskStore.setFilter({ createdAtDate: date })
    restoreTimer = setTimeout(() => {
      restoreSavedFilter()
    }, 60_000)
  }

  async function openAiMenu() {
    isAiMenuOpen.value = !isAiMenuOpen.value
  }

  async function handleAiSelect(type: ReportType) {
    isAiMenuOpen.value = false
    aiReportType.value = type

    // 首次加载 prompt
    if (!isAiPromptsLoaded.value) {
      const res = await aiApi.getPrompt().catch(() => ({ dailyPrompt: '', weeklyPrompt: '' }))
      aiPrompts.value = res
      isAiPromptsLoaded.value = true
    }

    isAiModalVisible.value = true
  }

  function handlePromptSaved(type: ReportType, prompt: string) {
    if (type === 'daily') {
      aiPrompts.value.dailyPrompt = prompt
    } else {
      aiPrompts.value.weeklyPrompt = prompt
    }
  }

  // 当前 AI 类型对应的已保存 prompt
  const currentPrompt = () =>
    aiReportType.value === 'daily' ? aiPrompts.value.dailyPrompt : aiPrompts.value.weeklyPrompt

  // 已选任务对象列表
  const selectedTasks = () => taskStore.list.filter(t => selectedTaskIds.value.has(t._id))
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

          <!-- AI 生成按钮（有选中任务时显示） -->
          <div
            v-if="selectedTaskIds.size > 0"
            class="ai-btn-wrap"
          >
            <button
              class="btn btn-ai btn-sm"
              @click="openAiMenu"
            >
              ✦ {{ locale === 'zh-CN' ? 'AI 生成' : 'AI Generate' }}
              <span class="ai-badge">{{ selectedTaskIds.size }}</span>
            </button>
            <div
              v-if="isAiMenuOpen"
              class="ai-menu"
            >
              <button
                class="ai-menu__item"
                @click="handleAiSelect('daily')"
              >{{ locale === 'zh-CN' ? '📋 日报' : '📋 Daily Report' }}</button>
              <button
                class="ai-menu__item"
                @click="handleAiSelect('weekly')"
              >{{ locale === 'zh-CN' ? '📊 周报' : '📊 Weekly Report' }}</button>
            </div>
          </div>

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
        <div class="task-row">
          <!-- 加载骨架（数量与 pageSize 对齐，撑住高度） -->
          <template v-if="taskStore.isLoading && taskStore.list.length === 0">
            <div
              v-for="i in 4"
              :key="i"
              class="task-row__item"
            >
              <div class="task-skeleton card" />
            </div>
          </template>

          <!-- 真实任务列表 -->
          <template v-else-if="taskStore.list.length > 0">
            <div
              v-for="task in taskStore.list"
              :key="task._id"
              class="task-row__item"
            >
              <TaskCard
                :task="task"
                :is-selected="selectedTaskIds.has(task._id)"
                @edit="openEdit"
                @delete="handleDelete"
                @pin="handlePin"
                @select="handleSelect"
              />
            </div>
          </template>

          <!-- 空状态 -->
          <div
            v-else
            class="task-empty"
          >
            {{ t('task.noTasks') }}
          </div>
        </div>
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

    <!-- AI 报告弹窗 -->
    <AiReportModal
      :is-visible="isAiModalVisible"
      :type="aiReportType"
      :tasks="selectedTasks()"
      :initial-prompt="currentPrompt()"
      @close="isAiModalVisible = false"
      @prompt-saved="handlePromptSaved"
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
    min-height: 32px; // 固定高度，防止 AI 按钮出现时撑高工具栏

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

  .ai-btn-wrap {
    position: relative;
  }

  .btn-ai {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    color: #fff;
    border: none;
    gap: 6px;

    &:hover {
      opacity: 0.88;
    }
  }

  .ai-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    font-size: 11px;
    font-weight: 600;
  }

  .ai-menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    background: #fff;
    border: 1px solid @border-color;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 100;
    min-width: 140px;

    &__item {
      display: block;
      width: 100%;
      padding: 10px 16px;
      text-align: left;
      background: none;
      border: none;
      font-size: 13px;
      color: @text-color;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: @bg-color;
      }
    }
  }

  .task-list-area {
    transition: opacity 0.25s ease;
    margin-bottom: 20px;

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
    overflow-y: hidden;
    padding-bottom: 18px;
    margin-bottom: 0;
    height: @task-card-height + 18px; // card + gap(10px) + scrollbar(8px)

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
      flex: 0 0 300px;
      min-width: 0;
      display: flex;
    }
  }

  .task-empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: @text-secondary;
    font-size: 15px;
  }

  .task-skeleton {
    height: @task-card-height;
    padding: 0;
    border-radius: @border-radius;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.4s infinite;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
