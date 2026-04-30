<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { aiApi, type ReportType, type ChatMessage } from '@/api/ai'
  import type { Task } from '@/api/task'

  const { locale } = useI18n()

  const props = defineProps<{
    isVisible: boolean
    type: ReportType
    tasks: Task[]
    initialPrompt: string
  }>()

  const emit = defineEmits<{
    close: []
    promptSaved: [type: ReportType, prompt: string]
  }>()

  interface DisplayMessage {
    role: 'user' | 'assistant'
    content: string
    isError?: boolean
  }

  const messages = ref<DisplayMessage[]>([])
  const inputText = ref('')
  const isLoading = ref(false)
  const messagesEl = ref<HTMLElement | null>(null)
  const inputEl = ref<HTMLTextAreaElement | null>(null)
  const promptSavedRef = ref(false)
  const copiedIdx = ref(-1)
  const isPromptEditorOpen = ref(false)
  const editingPrompt = ref('')
  const isSavingPrompt = ref(false)

  watch(
    () => props.isVisible,
    isVisible => {
      if (!isVisible) return
      messages.value = []
      promptSavedRef.value = !!props.initialPrompt
      inputText.value = buildInitialMessage()
    }
  )

  function buildDefaultTemplate(): string {
    const typeLabel =
      props.type === 'daily'
        ? locale.value === 'zh-CN' ? '日报' : 'Daily Report'
        : locale.value === 'zh-CN' ? '周报' : 'Weekly Report'

    if (locale.value === 'zh-CN') {
      return `请根据以下任务列表，生成一份专业的工作${typeLabel}。\n\n要求：语言简洁、逻辑清晰，按完成情况分类汇总，最后附上简短的工作总结。`
    }
    return `Please generate a professional ${typeLabel} based on the following task list.\n\nRequirements: concise language, clear logic, categorize by completion status, and end with a brief summary.`
  }

  function buildMarkdownTable(): string {
    const header =
      locale.value === 'zh-CN'
        ? '| 任务标题 | 任务描述 | 任务状态 |\n|---|---|---|'
        : '| Title | Description | Status |\n|---|---|---|'

    const rows = props.tasks.map(task => {
      const status =
        task.status === 'completed'
          ? locale.value === 'zh-CN' ? '已完成' : 'Completed'
          : task.status === 'in_progress'
            ? locale.value === 'zh-CN' ? '进行中' : 'In Progress'
            : locale.value === 'zh-CN' ? '待处理' : 'Pending'
      return `| ${task.title} | ${task.description || '-'} | ${status} |`
    })

    return `${header}\n${rows.join('\n')}`
  }

  function buildInitialMessage(): string {
    const template = props.initialPrompt || buildDefaultTemplate()
    return `${template}\n\n${buildMarkdownTable()}`
  }

  // only {role, content} goes to AI
  function toApiMessages(): ChatMessage[] {
    return messages.value
      .filter(m => !m.isError)
      .map(({ role, content }) => ({ role, content }))
  }

  async function scrollToBottom() {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading.value) return

    if (!promptSavedRef.value) {
      const template = props.initialPrompt || buildDefaultTemplate()
      await aiApi.savePrompt(props.type, template).catch(() => null)
      emit('promptSaved', props.type, template)
      promptSavedRef.value = true
    }

    messages.value.push({ role: 'user', content: text })
    inputText.value = ''
    isLoading.value = true
    await scrollToBottom()

    // placeholder for streaming
    const aiMsg: DisplayMessage = { role: 'assistant', content: '' }
    messages.value.push(aiMsg)
    const aiIdx = messages.value.length - 1

    try {
      await aiApi.generateStream(props.type, toApiMessages().slice(0, -1), chunk => {
        messages.value[aiIdx].content += chunk
        scrollToBottom()
      })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      messages.value[aiIdx].content =
        locale.value === 'zh-CN' ? `生成失败：${errMsg}` : `Generation failed: ${errMsg}`
      messages.value[aiIdx].isError = true
    } finally {
      isLoading.value = false
      await scrollToBottom()
      await nextTick()
      inputEl.value?.focus()
    }
  }

  async function handleSubmit() {
    await sendMessage(inputText.value)
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  async function handleRetry(idx: number) {
    const userMsg = messages.value[idx - 1]
    if (!userMsg || userMsg.role !== 'user') return
    messages.value.splice(idx - 1, 2)
    await sendMessage(userMsg.content)
  }

  async function copyMessage(content: string, idx: number) {
    await navigator.clipboard.writeText(content)
    copiedIdx.value = idx
    setTimeout(() => {
      copiedIdx.value = -1
    }, 1500)
  }

  function openPromptEditor() {
    editingPrompt.value = props.initialPrompt || buildDefaultTemplate()
    isPromptEditorOpen.value = true
  }

  function closePromptEditor() {
    isPromptEditorOpen.value = false
  }

  async function savePromptTemplate() {
    isSavingPrompt.value = true
    try {
      await aiApi.savePrompt(props.type, editingPrompt.value)
      emit('promptSaved', props.type, editingPrompt.value)
      promptSavedRef.value = true
      isPromptEditorOpen.value = false
      inputText.value = `${editingPrompt.value}\n\n${buildMarkdownTable()}`
    } catch {
      // ignore
    } finally {
      isSavingPrompt.value = false
    }
  }

  const typeLabel = (type: ReportType) =>
    type === 'daily'
      ? locale.value === 'zh-CN' ? '日报' : 'Daily Report'
      : locale.value === 'zh-CN' ? '周报' : 'Weekly Report'
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="modal-overlay"
      @click.self="emit('close')"
    >
      <div class="ai-chat card">
        <!-- Header -->
        <div class="ai-chat__header">
          <div class="ai-chat__title">
            <span class="ai-chat__icon">✦</span>
            <h2>{{ typeLabel(type) }} · AI {{ locale === 'zh-CN' ? '助手' : 'Assistant' }}</h2>
          </div>
          <button
            class="ai-chat__close"
            @click="emit('close')"
          >✕</button>
        </div>

        <!-- Messages -->
        <div
          ref="messagesEl"
          class="ai-chat__messages"
        >
          <div
            v-if="messages.length === 0"
            class="ai-chat__empty"
          >
            <div class="ai-chat__empty-icon">✦</div>
            <p>{{ locale === 'zh-CN' ? '编辑下方消息，点击发送开始生成' : 'Edit the message below and click Send' }}</p>
          </div>

          <template
            v-for="(msg, i) in messages"
            :key="i"
          >
            <!-- User message -->
            <div
              v-if="msg.role === 'user'"
              class="bubble bubble--user"
            >
              <div class="bubble__content">{{ msg.content }}</div>
            </div>

            <!-- AI message -->
            <div
              v-else
              class="bubble bubble--assistant"
              :class="{ 'bubble--error': msg.isError }"
            >
              <div
                v-if="!msg.content && isLoading"
                class="bubble__loading"
              >
                <span class="loading-dot" />
                <span class="loading-dot" />
                <span class="loading-dot" />
              </div>
              <div
                v-else
                class="bubble__content"
              >{{ msg.content }}</div>
              <div
                v-if="msg.content"
                class="bubble__toolbar"
              >
                <button
                  v-if="msg.isError"
                  class="bubble__action bubble__action--retry"
                  @click="handleRetry(i)"
                >
                  ↺ {{ locale === 'zh-CN' ? '重试' : 'Retry' }}
                </button>
                <button
                  v-else
                  class="bubble__action"
                  @click="copyMessage(msg.content, i)"
                >
                  {{ copiedIdx === i ? (locale === 'zh-CN' ? '✓ 已复制' : '✓ Copied') : (locale === 'zh-CN' ? '复制' : 'Copy') }}
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <div class="ai-chat__composer">
          <!-- Prompt 模版编辑面板 -->
          <div
            v-if="isPromptEditorOpen"
            class="prompt-editor"
          >
            <div class="prompt-editor__header">
              <span class="prompt-editor__title">{{ locale === 'zh-CN' ? 'Prompt 模版' : 'Prompt Template' }}</span>
              <button
                class="prompt-editor__close"
                @click="closePromptEditor"
              >✕</button>
            </div>
            <textarea
              v-model="editingPrompt"
              class="prompt-editor__textarea"
              :placeholder="locale === 'zh-CN' ? '输入 Prompt 模版，任务列表将自动拼接在末尾…' : 'Enter prompt template, task list will be appended automatically…'"
            />
            <div class="prompt-editor__actions">
              <button
                class="prompt-editor__cancel"
                @click="closePromptEditor"
              >{{ locale === 'zh-CN' ? '取消' : 'Cancel' }}</button>
              <button
                class="prompt-editor__save"
                :disabled="isSavingPrompt"
                @click="savePromptTemplate"
              >{{ isSavingPrompt ? '…' : (locale === 'zh-CN' ? '保存' : 'Save') }}</button>
            </div>
          </div>

          <div class="composer__box">
            <textarea
              ref="inputEl"
              v-model="inputText"
              class="composer__textarea"
              :disabled="isLoading"
              :placeholder="locale === 'zh-CN' ? '输入消息…' : 'Type a message…'"
              @keydown="handleKeydown"
            />
          </div>
          <div class="composer__footer">
            <span class="composer__hint">{{ locale === 'zh-CN' ? 'Ctrl+Enter 发送' : 'Ctrl+Enter to send' }}</span>
            <button
              class="composer__template"
              :class="{ 'is-active': isPromptEditorOpen }"
              @click="openPromptEditor"
            >{{ locale === 'zh-CN' ? 'Prompt 模版' : 'Prompt Template' }}</button>
            <button
              class="composer__send"
              :disabled="!inputText.trim() || isLoading"
              @click="handleSubmit"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              ><path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.896 28.896 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.289Z" /></svg>
              {{ locale === 'zh-CN' ? '发送' : 'Send' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style lang="less" scoped>
  @import '@/styles/variables.less';

  .modal-overlay {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    padding: 16px;
  }

  .ai-chat {
    width: 100%;
    max-width: 660px;
    height: 82vh;
    display: flex;
    flex-direction: column;
    padding: 0;
    overflow: hidden;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      border-bottom: 1px solid @border-color;
      flex-shrink: 0;
    }

    &__title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__icon {
      font-size: 14px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    h2 {
      font-size: 15px;
      font-weight: 600;
    }

    &__close {
      background: none;
      border: none;
      font-size: 15px;
      color: @text-secondary;
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      line-height: 1;

      &:hover {
        color: @text-color;
        background: @bg-color;
      }
    }

    &__messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      scroll-behavior: smooth;
    }

    &__empty {
      margin: auto;
      text-align: center;
      color: @text-secondary;

      p {
        font-size: 13px;
        line-height: 1.6;
        margin-top: 10px;
      }
    }

    &__empty-icon {
      font-size: 28px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &__composer {
      flex-shrink: 0;
      padding: 12px 16px 16px;
      border-top: 1px solid @border-color;
      background: #fff;
    }
  }

  // ── Bubbles ───────────────────────────────────────────────

  .bubble {
    display: flex;
    flex-direction: column;
    max-width: 85%;
    gap: 4px;

    &--user {
      align-self: flex-end;
      align-items: flex-end;

      .bubble__content {
        background: linear-gradient(135deg, #7c3aed, #4f46e5);
        color: #fff;
        border-radius: 16px 16px 4px 16px;
      }
    }

    &--assistant {
      align-self: flex-start;
      align-items: flex-start;

      .bubble__content {
        background: @bg-color;
        border: 1px solid @border-color;
        border-radius: 4px 16px 16px 16px;
        color: @text-color;
      }
    }

    &--error .bubble__content {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }

    &__content {
      padding: 10px 14px;
      font-size: 13px;
      line-height: 1.75;
      white-space: pre-wrap;
      word-break: break-word;
    }

    &__loading {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      background: @bg-color;
      border: 1px solid @border-color;
      border-radius: 4px 16px 16px 16px;
    }

    &__toolbar {
      display: flex;
      gap: 4px;
      padding: 0 2px;
    }

    &__action {
      background: none;
      border: none;
      font-size: 11px;
      color: @text-secondary;
      cursor: pointer;
      padding: 3px 8px;
      border-radius: 4px;
      transition: all 0.15s;

      &:hover {
        color: @primary-color;
        background: fade(@primary-color, 8%);
      }

      &--retry {
        &:hover {
          color: #b91c1c;
          background: #fef2f2;
        }
      }
    }
  }

  // ── Composer ─────────────────────────────────────────────

  .composer {
    &__box {
      background: @bg-color;
      border: 1.5px solid @border-color;
      border-radius: 12px;
      transition: border-color 0.2s, box-shadow 0.2s;
      overflow: hidden;

      &:focus-within {
        border-color: @primary-color;
        box-shadow: 0 0 0 3px fade(@primary-color, 12%);
      }
    }

    &__textarea {
      display: block;
      width: 100%;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.7;
      font-family: inherit;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      color: @text-color;
      min-height: 88px;
      max-height: 200px;
      overflow-y: auto;

      &::placeholder {
        color: @text-secondary;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &__footer {
      display: flex;
      align-items: center;
      padding: 8px 0 0;
      gap: 8px;
    }

    &__hint {
      font-size: 11px;
      color: @text-secondary;
      flex: 1;
    }

    &__template {
      padding: 5px 10px;
      border: 1px solid @border-color;
      border-radius: 6px;
      background: #fff;
      font-size: 12px;
      color: @text-secondary;
      cursor: pointer;
      white-space: nowrap;
      transition: @transition;

      &:hover {
        color: @primary-color;
        border-color: @primary-color;
      }

      &.is-active {
        color: @primary-color;
        border-color: @primary-color;
        background: fade(@primary-color, 6%);
      }
    }

    &__send {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity 0.15s;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover:not(:disabled) {
        opacity: 0.88;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  // ── Loading dots ─────────────────────────────────────────

  .prompt-editor {
    margin-bottom: 10px;
    border: 1.5px solid @border-color;
    border-radius: 10px;
    overflow: hidden;
    background: @bg-color;

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-bottom: 1px solid @border-color;
    }

    &__title {
      font-size: 12px;
      font-weight: 600;
      color: @text-color;
    }

    &__close {
      background: none;
      border: none;
      font-size: 11px;
      color: @text-secondary;
      cursor: pointer;
      padding: 2px 5px;
      border-radius: 4px;
      line-height: 1;

      &:hover {
        color: @text-color;
        background: @border-color;
      }
    }

    &__textarea {
      display: block;
      width: 100%;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.65;
      font-family: inherit;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      color: @text-color;
      min-height: 80px;
      max-height: 160px;
      overflow-y: auto;
      box-sizing: border-box;

      &::placeholder {
        color: @text-secondary;
      }
    }

    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
      padding: 8px 12px;
      border-top: 1px solid @border-color;
    }

    &__cancel {
      padding: 5px 12px;
      border: 1px solid @border-color;
      border-radius: 6px;
      background: #fff;
      font-size: 12px;
      color: @text-secondary;
      cursor: pointer;
      transition: @transition;

      &:hover {
        color: @text-color;
        border-color: #c7c7f0;
      }
    }

    &__save {
      padding: 5px 12px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      font-size: 12px;
      color: #fff;
      cursor: pointer;
      transition: opacity 0.15s;

      &:hover:not(:disabled) {
        opacity: 0.88;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .loading-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: @primary-color;
    animation: dot-bounce 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }

  @keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40%           { transform: scale(1);   opacity: 1;   }
  }
</style>
