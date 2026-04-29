<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import type { Task, TaskStatus } from '@/api/task'

  const { t } = useI18n()

  const props = defineProps<{
    isVisible: boolean
    task?: Task | null
  }>()

  const emit = defineEmits<{
    close: []
    submit: [data: { title: string; description: string; status: TaskStatus; dueDate: string }]
  }>()

  const isLoading = ref(false)
  const form = reactive({
    title: '',
    description: '',
    status: 'pending' as TaskStatus,
    dueDate: ''
  })

  watch(
    () => props.task,
    task => {
      if (task) {
        form.title = task.title
        form.description = task.description ?? ''
        form.status = task.status
        form.dueDate = task.dueDate ? task.dueDate.slice(0, 10) : ''
      } else {
        form.title = ''
        form.description = ''
        form.status = 'pending'
        form.dueDate = ''
      }
    },
    { immediate: true }
  )

  const statusOptions: TaskStatus[] = ['pending', 'in_progress', 'completed']

  async function handleSubmit() {
    isLoading.value = true
    try {
      emit('submit', { ...form })
    } finally {
      isLoading.value = false
    }
  }
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="modal-overlay"
      @click.self="emit('close')"
    >
      <div class="modal-panel card">
        <div class="modal-panel__header">
          <h2>{{ task ? t('task.editTask') : t('task.createTask') }}</h2>
          <button
            class="modal-panel__close"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="form-item">
            <label>{{ t('task.title') }}</label>
            <input
              v-model="form.title"
              type="text"
              class="input"
              :placeholder="t('task.titlePlaceholder')"
              required
            />
          </div>

          <div class="form-item">
            <label>{{ t('task.description') }}</label>
            <textarea
              v-model="form.description"
              class="input"
              :placeholder="t('task.descPlaceholder')"
              rows="3"
            />
          </div>

          <div class="form-item">
            <label>{{ t('task.status') }}</label>
            <select
              v-model="form.status"
              class="input"
            >
              <option
                v-for="s in statusOptions"
                :key="s"
                :value="s"
              >
                {{ t(`task.status_${s}`) }}
              </option>
            </select>
          </div>

          <div class="form-item">
            <label>{{ t('task.dueDate') }}</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="input"
            />
          </div>

          <div class="modal-panel__actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="emit('close')"
            >
              {{ t('task.cancel') }}
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isLoading"
            >
              {{ t('task.saveTask') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 16px;
  }

  .modal-panel {
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h2 {
        font-size: 18px;
        font-weight: 600;
      }
    }

    &__close {
      background: none;
      border: none;
      font-size: 16px;
      color: @text-secondary;
      padding: 4px;
      cursor: pointer;

      &:hover {
        color: @text-color;
      }
    }

    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 8px;
    }

    textarea.input {
      resize: vertical;
      min-height: 80px;
    }
  }
</style>
