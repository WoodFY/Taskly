<script setup lang="ts">
  import { useI18n } from 'vue-i18n'
  import type { Task } from '@/api/task'

  const { t } = useI18n()

  defineProps<{
    task: Task
  }>()

  const emit = defineEmits<{
    edit: [task: Task]
    delete: [id: string]
  }>()
</script>

<template>
  <div class="task-card card">
    <div class="task-card__header">
      <h3
        class="task-card__title"
        @click="emit('edit', task)"
      >
        {{ task.title }}
      </h3>
      <span :class="['badge', `badge-${task.status}`]">{{ t(`task.status_${task.status}`) }}</span>
    </div>

    <p
      v-if="task.description"
      class="task-card__desc"
    >
      {{ task.description }}
    </p>

    <div class="task-card__footer">
      <span
        v-if="task.dueDate"
        class="task-card__due"
      >
        {{ new Date(task.dueDate).toLocaleDateString() }}
      </span>
      <div class="task-card__actions">
        <button
          class="action-btn"
          @click="emit('edit', task)"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <button
          class="action-btn action-btn--delete"
          @click="emit('delete', task._id)"
        >
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.5 4h3a1.5 1.5 0 0 0-3 0ZM7 4a2.5 2.5 0 0 1 5 0h4.25a.75.75 0 0 1 0 1.5h-.58l-.94 9.42A2.75 2.75 0 0 1 12 17.5H8A2.75 2.75 0 0 1 5.27 14.92L4.33 5.5H3.75a.75.75 0 0 1 0-1.5H7Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .task-card {
    transition: @transition;

    &:hover {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    &__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }

    &__title {
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      flex: 1;

      &:hover {
        color: @primary-color;
      }
    }

    &__desc {
      font-size: 13px;
      color: @text-secondary;
      margin-bottom: 12px;
      line-height: 1.6;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    &__footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__due {
      font-size: 12px;
      color: @text-secondary;
    }

    &__actions {
      display: flex;
      gap: 4px;
    }
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: @text-secondary;
    cursor: pointer;
    transition: @transition;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover {
      background-color: @bg-color;
      color: @primary-color;
    }

    &--delete:hover {
      background-color: #fef2f2;
      color: #b91c1c;
    }
  }
</style>
