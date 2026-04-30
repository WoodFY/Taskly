<script setup lang="ts">
  import { reactive } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { TaskStatus } from '@/api/task'

  const { t } = useI18n()

  const emit = defineEmits<{
    filter: [params: { status?: TaskStatus; keyword?: string; dueDateStart?: string; dueDateEnd?: string }]
    reset: []
  }>()

  const form = reactive({
    status: '' as TaskStatus | '',
    keyword: '',
    dueDateStart: '',
    dueDateEnd: ''
  })

  const statusTabs: Array<{ value: TaskStatus | ''; label: string }> = [
    { value: '', label: t('filter.allStatus') },
    { value: 'pending', label: t('task.status_pending') },
    { value: 'in_progress', label: t('task.status_in_progress') },
    { value: 'completed', label: t('task.status_completed') }
  ]

  function selectStatus(value: TaskStatus | '') {
    form.status = value
    emitFilter()
  }

  function emitFilter() {
    emit('filter', {
      status: form.status || undefined,
      keyword: form.keyword || undefined,
      dueDateStart: form.dueDateStart || undefined,
      dueDateEnd: form.dueDateEnd || undefined
    })
  }

  function handleReset() {
    form.status = ''
    form.keyword = ''
    form.dueDateStart = ''
    form.dueDateEnd = ''
    emit('reset')
  }

  const isActive = (value: TaskStatus | '') => form.status === value
</script>

<template>
  <div class="task-filter card">
    <!-- 状态 pill 按钮组 -->
    <div class="task-filter__status-group">
      <button
        v-for="tab in statusTabs"
        :key="tab.value"
        :class="['status-tab', `status-tab--${tab.value || 'all'}`, { 'is-active': isActive(tab.value) }]"
        @click="selectStatus(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 搜索 + 日期 -->
    <div class="task-filter__controls">
      <!-- 搜索框 -->
      <div class="search-box">
        <svg
          class="search-box__icon"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8.5 3a5.5 5.5 0 1 0 3.45 9.863l3.594 3.594a.75.75 0 1 0 1.06-1.06l-3.593-3.595A5.5 5.5 0 0 0 8.5 3Z"
            fill="currentColor"
          />
        </svg>
        <input
          v-model="form.keyword"
          type="text"
          class="search-box__input"
          :placeholder="t('filter.keywordPlaceholder')"
          @input="emitFilter"
        />
        <button
          v-if="form.keyword"
          class="search-box__clear"
          @click="form.keyword = ''; emitFilter()"
        >
          ✕
        </button>
      </div>

      <!-- 日期范围 -->
      <div class="date-range">
        <div class="date-range__item">
          <span class="date-range__label">{{ t('filter.dueDateStart') }}</span>
          <input
            v-model="form.dueDateStart"
            type="date"
            class="date-range__input"
            @change="emitFilter"
          />
        </div>
        <span class="date-range__sep">—</span>
        <div class="date-range__item">
          <span class="date-range__label">{{ t('filter.dueDateEnd') }}</span>
          <input
            v-model="form.dueDateEnd"
            type="date"
            class="date-range__input"
            @change="emitFilter"
          />
        </div>
      </div>

      <!-- 重置 -->
      <button
        class="reset-btn"
        @click="handleReset"
      >
        {{ t('filter.reset') }}
      </button>
    </div>
  </div>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .task-filter {
    margin-bottom: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    &__status-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    &__controls {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 8px;
    }
  }

  // 状态 pill 按钮
  .status-tab {
    padding: 5px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid @border-color;
    background-color: #fff;
    color: @text-secondary;
    cursor: pointer;
    transition: @transition;

    &:hover {
      border-color: #c7c7f0;
      color: @text-color;
    }

    &.is-active {
      border-color: transparent;
      color: #fff;
    }

    &--all.is-active {
      background-color: @primary-color;
    }

    &--pending.is-active {
      background-color: #d97706;
    }

    &--in_progress.is-active {
      background-color: #2563eb;
    }

    &--completed.is-active {
      background-color: #059669;
    }
  }

  // 搜索框
  .search-box {
    flex: 1;
    min-width: 180px;
    position: relative;
    display: flex;
    align-items: center;

    &__icon {
      position: absolute;
      left: 10px;
      width: 15px;
      height: 15px;
      color: @text-secondary;
      pointer-events: none;
    }

    &__input {
      width: 100%;
      padding: 7px 32px 7px 32px;
      border: 1px solid @border-color;
      border-radius: @border-radius;
      background-color: #f9fafb;
      font-size: 13px;
      transition: @transition;

      &:focus {
        outline: none;
        border-color: @primary-color;
        background-color: #fff;
        box-shadow: 0 0 0 3px fade(@primary-color, 10%);
      }
    }

    &__clear {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      font-size: 11px;
      color: @text-secondary;
      padding: 2px 4px;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background-color: @border-color;
        color: @text-color;
      }
    }
  }

  // 日期范围
  .date-range {
    display: flex;
    align-items: center;
    gap: 6px;

    &__item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &__label {
      font-size: 11px;
      color: @text-secondary;
      white-space: nowrap;
    }

    &__input {
      width: 130px;
      height: 31px;
      padding: 6px 8px;
      border: 1px solid @border-color;
      border-radius: @border-radius;
      background-color: #f9fafb;
      font-size: 12px;
      color: @text-color;
      transition: @transition;

      &:focus {
        outline: none;
        border-color: @primary-color;
        background-color: #fff;
        box-shadow: 0 0 0 3px fade(@primary-color, 10%);
      }
    }

    &__sep {
      color: @text-secondary;
      font-size: 13px;
      align-self: flex-end;
      margin-bottom: 7px;
    }
  }

  // 重置按钮
  .reset-btn {
    padding: 7px 12px;
    border: 1px solid @border-color;
    border-radius: @border-radius;
    background-color: #fff;
    font-size: 12px;
    color: @text-secondary;
    cursor: pointer;
    white-space: nowrap;
    transition: @transition;
    align-self: flex-end;

    &:hover {
      border-color: #c7c7f0;
      color: @text-color;
    }
  }
</style>
