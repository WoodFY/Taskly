<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import { useI18n } from 'vue-i18n'
  import { aiApi, type ReportType, type ConvType, type ChatMessage, type AiConversation } from '@/api/ai'
  import type { Task } from '@/api/task'

  const { locale } = useI18n()

  const props = defineProps<{
    isVisible: boolean
    tasks: Task[]
    prompts: { dailyPrompt: string; weeklyPrompt: string }
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

  // ── Chat state ────────────────────────────────────────────
  const messages = ref<DisplayMessage[]>([])
  const inputText = ref('')
  const isLoading = ref(false)
  const messagesEl = ref<HTMLElement | null>(null)
  const inputEl = ref<HTMLTextAreaElement | null>(null)
  const currentType = ref<ReportType | null>(null)
  const promptSavedRef = ref(false)
  const copiedIdx = ref(-1)
  const isPromptEditorOpen = ref(false)
  const editingPrompt = ref('')
  const isSavingPrompt = ref(false)

  // ── Conversation history state ────────────────────────────
  const conversations = ref<AiConversation[]>([])
  const currentConvId = ref<string | null>(null) // null = unsaved new conversation
  const isConvsLoading = ref(false)
  const renamingId = ref<string | null>(null)
  const renameText = ref('')
  const renamingInputEl = ref<HTMLInputElement | null>(null)

  // ── Init / watch ──────────────────────────────────────────
  watch(
    () => props.isVisible,
    async isVisible => {
      if (!isVisible) return
      messages.value = []
      currentConvId.value = null
      promptSavedRef.value = false
      if (props.tasks.length > 0) {
        currentType.value = 'daily'
        inputText.value = buildReportMessage('daily')
      } else {
        currentType.value = null
        inputText.value = ''
      }
      nextTick(autoResize)
      await loadConversations()
    }
  )

  async function loadConversations() {
    isConvsLoading.value = true
    try {
      conversations.value = await aiApi.getConversations()
    } catch {
      conversations.value = []
    } finally {
      isConvsLoading.value = false
    }
  }

  // ── Template helpers ──────────────────────────────────────
  function buildDefaultTemplate(type: ReportType): string {
    const label = typeLabelText(type)
    if (locale.value === 'zh-CN') {
      return `请根据以下任务列表，生成一份专业的工作${label}。\n\n要求：语言简洁、逻辑清晰，按完成情况分类汇总，最后附上简短的工作总结。`
    }
    return `Please generate a professional ${label} based on the following task list.\n\nRequirements: concise language, clear logic, categorize by completion status, and end with a brief summary.`
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

  function buildReportMessage(type: ReportType): string {
    const savedPrompt = type === 'daily' ? props.prompts.dailyPrompt : props.prompts.weeklyPrompt
    const template = savedPrompt || buildDefaultTemplate(type)
    if (props.tasks.length > 0) {
      return `${template}\n\n${buildMarkdownTable()}`
    }
    return template
  }

  function typeLabelText(type: ReportType): string {
    return type === 'daily'
      ? locale.value === 'zh-CN' ? '日报' : 'Daily Report'
      : locale.value === 'zh-CN' ? '周报' : 'Weekly Report'
  }

  function generateConvName(): string {
    const now = new Date()
    const ymd = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0')
    const hm = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
    if (currentType.value) {
      const label = currentType.value === 'daily'
        ? locale.value === 'zh-CN' ? '日报' : 'Daily'
        : locale.value === 'zh-CN' ? '周报' : 'Weekly'
      return `${ymd}-${label}-${hm}`
    }
    return locale.value === 'zh-CN' ? `${ymd}-对话-${hm}` : `${ymd}-Chat-${hm}`
  }

  // ── API messages helper ───────────────────────────────────
  function toApiMessages(): ChatMessage[] {
    return messages.value
      .filter(m => !m.isError)
      .map(({ role, content }) => ({ role, content }))
  }

  // ── Scroll ────────────────────────────────────────────────
  async function scrollToBottom() {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  }

  // ── Auto resize textarea ──────────────────────────────────
  function autoResize() {
    const el = inputEl.value
    if (!el) return
    const current = el.offsetHeight
    el.style.height = 'auto'
    const target = Math.max(Math.min(el.scrollHeight, 200), 88)
    el.style.height = current + 'px'
    requestAnimationFrame(() => {
      el.style.height = target + 'px'
    })
  }

  // ── Persist conversation to backend ──────────────────────
  async function persistConversation(msgs: ChatMessage[]) {
    const convType: ConvType = currentType.value ?? 'chat'
    if (currentConvId.value) {
      await aiApi.updateConversation(currentConvId.value, { messages: msgs }).catch(() => null)
    } else {
      const name = generateConvName()
      const conv = await aiApi.createConversation({ type: convType, name, messages: msgs }).catch(e => {
        console.error('[AI] createConversation failed:', e)
        return null
      })
      if (conv) {
        currentConvId.value = conv._id
        conversations.value = [conv, ...conversations.value]
      }
    }
  }

  // ── Send message ──────────────────────────────────────────
  async function sendMessage(text: string) {
    if (!text.trim() || isLoading.value) return

    if (currentType.value && !promptSavedRef.value) {
      const type = currentType.value
      const savedPrompt = type === 'daily' ? props.prompts.dailyPrompt : props.prompts.weeklyPrompt
      const template = savedPrompt || buildDefaultTemplate(type)
      await aiApi.savePrompt(type, template).catch(() => null)
      emit('promptSaved', type, template)
      promptSavedRef.value = true
    }

    messages.value.push({ role: 'user', content: text })
    inputText.value = ''
    await nextTick()
    autoResize()
    isLoading.value = true
    await scrollToBottom()

    // placeholder for streaming
    const aiMsg: DisplayMessage = { role: 'assistant', content: '' }
    messages.value.push(aiMsg)
    const aiIdx = messages.value.length - 1

    const convType: ConvType = currentType.value ?? 'chat'

    try {
      await aiApi.generateStream(convType, toApiMessages().slice(0, -1), chunk => {
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
      // persist all clean messages
      await persistConversation(toApiMessages())
      // update updatedAt in sidebar list
      if (currentConvId.value) {
        const idx = conversations.value.findIndex(c => c._id === currentConvId.value)
        if (idx > 0) {
          const [conv] = conversations.value.splice(idx, 1)
          conversations.value.unshift(conv)
        }
      }
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

  // ── Type selection (daily / weekly) ──────────────────────
  function selectReportType(type: ReportType) {
    currentType.value = type
    promptSavedRef.value = false
    inputText.value = buildReportMessage(type)
    nextTick(autoResize)
    inputEl.value?.focus()
  }

  // ── Conversation switching ────────────────────────────────
  function selectConversation(conv: AiConversation) {
    if (currentConvId.value === conv._id) return
    currentConvId.value = conv._id
    currentType.value = (conv.type === 'daily' || conv.type === 'weekly') ? conv.type : null
    messages.value = conv.messages.map(m => ({ role: m.role, content: m.content }))
    inputText.value = ''
    nextTick(autoResize)
  }

  function newConversation() {
    currentConvId.value = null
    currentType.value = null
    messages.value = []
    inputText.value = ''
    promptSavedRef.value = false
    nextTick(autoResize)
  }

  // ── Rename ────────────────────────────────────────────────
  async function startRename(conv: AiConversation) {
    renamingId.value = conv._id
    renameText.value = conv.name
    await nextTick()
    renamingInputEl.value?.focus()
    renamingInputEl.value?.select()
  }

  async function commitRename(conv: AiConversation) {
    const name = renameText.value.trim()
    if (!name || name === conv.name) {
      renamingId.value = null
      return
    }
    await aiApi.updateConversation(conv._id, { name }).catch(() => null)
    const idx = conversations.value.findIndex(c => c._id === conv._id)
    if (idx !== -1) conversations.value[idx] = { ...conversations.value[idx], name }
    renamingId.value = null
  }

  function cancelRename() {
    renamingId.value = null
  }

  // ── Delete ────────────────────────────────────────────────
  async function deleteConversation(conv: AiConversation) {
    const label = locale.value === 'zh-CN' ? `确认删除对话「${conv.name}」？` : `Delete conversation "${conv.name}"?`
    if (!window.confirm(label)) return
    await aiApi.deleteConversation(conv._id).catch(() => null)
    conversations.value = conversations.value.filter(c => c._id !== conv._id)
    if (currentConvId.value === conv._id) {
      newConversation()
    }
  }

  // ── Prompt editor ─────────────────────────────────────────
  function openPromptEditor() {
    if (!currentType.value) return
    const savedPrompt = currentType.value === 'daily' ? props.prompts.dailyPrompt : props.prompts.weeklyPrompt
    editingPrompt.value = savedPrompt || buildDefaultTemplate(currentType.value)
    isPromptEditorOpen.value = true
  }

  function closePromptEditor() {
    isPromptEditorOpen.value = false
  }

  async function savePromptTemplate() {
    if (!currentType.value) return
    isSavingPrompt.value = true
    try {
      await aiApi.savePrompt(currentType.value, editingPrompt.value)
      emit('promptSaved', currentType.value, editingPrompt.value)
      promptSavedRef.value = true
      isPromptEditorOpen.value = false
      inputText.value = buildReportMessage(currentType.value)
      await nextTick()
      autoResize()
    } catch {
      // ignore
    } finally {
      isSavingPrompt.value = false
    }
  }

  const modalTitle = () => {
    const assistant = locale.value === 'zh-CN' ? 'AI 助手' : 'AI Assistant'
    if (!currentType.value) return assistant
    return `${typeLabelText(currentType.value)} · ${assistant}`
  }
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isVisible"
      class="modal-overlay"
    >
      <div class="ai-chat card">
        <!-- Sidebar -->
        <aside class="ai-sidebar">
          <button
            class="ai-sidebar__new"
            @click="newConversation"
          >
            + {{ locale === 'zh-CN' ? '新建对话' : 'New Chat' }}
          </button>

          <div class="ai-sidebar__list">
            <div
              v-if="isConvsLoading"
              class="ai-sidebar__loading"
            >…</div>
            <template v-else-if="conversations.length > 0">
              <div
                v-for="conv in conversations"
                :key="conv._id"
                class="ai-sidebar__item"
                :class="{ 'is-active': currentConvId === conv._id }"
                @click="selectConversation(conv)"
              >
                <template v-if="renamingId === conv._id">
                  <input
                    ref="renamingInputEl"
                    v-model="renameText"
                    class="ai-sidebar__rename-input"
                    @keydown.enter.prevent="commitRename(conv)"
                    @keydown.escape="cancelRename"
                    @blur="commitRename(conv)"
                    @click.stop
                  />
                </template>
                <template v-else>
                  <span class="ai-sidebar__name">{{ conv.name }}</span>
                  <span class="ai-sidebar__actions">
                    <button
                      class="ai-sidebar__action"
                      :title="locale === 'zh-CN' ? '重命名' : 'Rename'"
                      @click.stop="startRename(conv)"
                    >✎</button>
                    <button
                      class="ai-sidebar__action ai-sidebar__action--delete"
                      :title="locale === 'zh-CN' ? '删除' : 'Delete'"
                      @click.stop="deleteConversation(conv)"
                    >🗑</button>
                  </span>
                </template>
              </div>
            </template>
            <div
              v-else
              class="ai-sidebar__empty"
            >
              {{ locale === 'zh-CN' ? '暂无对话' : 'No conversations' }}
            </div>
          </div>
        </aside>

        <!-- Main chat area -->
        <div class="ai-main">
          <!-- Header -->
          <div class="ai-chat__header">
            <div class="ai-chat__title">
              <span class="ai-chat__icon">✦</span>
              <h2>{{ modalTitle() }}</h2>
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
            <!-- Report type selector -->
            <div class="composer__type-bar">
              <button
                class="composer__type-opt"
                :class="{ 'is-active': currentType === null }"
                @click="newConversation"
              >{{ locale === 'zh-CN' ? '💬 对话' : '💬 Chat' }}</button>
              <button
                class="composer__type-opt"
                :class="{ 'is-active': currentType === 'daily' }"
                @click="selectReportType('daily')"
              >{{ locale === 'zh-CN' ? '📋 日报' : '📋 Daily Report' }}</button>
              <button
                class="composer__type-opt"
                :class="{ 'is-active': currentType === 'weekly' }"
                @click="selectReportType('weekly')"
              >{{ locale === 'zh-CN' ? '📊 周报' : '📊 Weekly Report' }}</button>
            </div>
            <div class="composer__box">
              <textarea
                ref="inputEl"
                v-model="inputText"
                class="composer__textarea"
                :disabled="isLoading"
                :placeholder="locale === 'zh-CN' ? '输入消息…' : 'Type a message…'"
                @input="autoResize"
                @keydown="handleKeydown"
              />
            </div>
            <div class="composer__footer">
              <span class="composer__hint">{{ locale === 'zh-CN' ? 'Ctrl+Enter 发送' : 'Ctrl+Enter to send' }}</span>
              <button
                v-if="currentType"
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

        <!-- Prompt 模版弹窗 -->
        <div
          v-if="isPromptEditorOpen"
          class="prompt-modal"
        >
          <div class="prompt-modal__panel card">
            <div class="prompt-modal__header">
              <span class="prompt-modal__title">{{ locale === 'zh-CN' ? 'Prompt 模版' : 'Prompt Template' }}</span>
              <button
                class="prompt-modal__close"
                @click="closePromptEditor"
              >✕</button>
            </div>
            <textarea
              v-model="editingPrompt"
              class="prompt-modal__textarea"
              :placeholder="locale === 'zh-CN' ? '输入 Prompt 模版，任务列表将自动拼接在末尾…' : 'Enter prompt template, task list will be appended automatically…'"
            />
            <div class="prompt-modal__actions">
              <button
                class="prompt-modal__cancel"
                @click="closePromptEditor"
              >{{ locale === 'zh-CN' ? '取消' : 'Cancel' }}</button>
              <button
                class="prompt-modal__save"
                :disabled="isSavingPrompt"
                @click="savePromptTemplate"
              >{{ isSavingPrompt ? '…' : (locale === 'zh-CN' ? '保存' : 'Save') }}</button>
            </div>
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
    position: relative;
    width: 100%;
    max-width: 960px;
    height: 82vh;
    display: flex;
    flex-direction: row;
    padding: 0;
    overflow: hidden;
  }

  // ── Sidebar ───────────────────────────────────────────────

  .ai-sidebar {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid @border-color;
    background: #fafafa;
    overflow: hidden;

    &__new {
      flex-shrink: 0;
      margin: 12px 12px 8px;
      padding: 7px 12px;
      background: @primary-color;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: opacity 0.15s;

      &:hover {
        opacity: 0.88;
      }
    }

    &__list {
      flex: 1;
      overflow-y: auto;
      padding: 0 6px 12px;
    }

    &__loading,
    &__empty {
      padding: 16px 8px;
      font-size: 12px;
      color: @text-secondary;
      text-align: center;
    }

    &__item {
      position: relative;
      display: flex;
      align-items: center;
      padding: 8px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.12s;
      min-height: 34px;

      &:hover {
        background: #f0f0f8;

        .ai-sidebar__actions {
          opacity: 1;
        }
      }

      &.is-active {
        background: fade(@primary-color, 10%);

        .ai-sidebar__name {
          color: @primary-color;
          font-weight: 500;
        }

        .ai-sidebar__actions {
          opacity: 1;
        }
      }
    }

    &__name {
      flex: 1;
      font-size: 12px;
      color: @text-color;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      padding-right: 44px;
    }

    &__actions {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      gap: 2px;
      opacity: 0;
      transition: opacity 0.12s;
    }

    &__action {
      background: none;
      border: none;
      padding: 3px 5px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      color: @text-secondary;
      line-height: 1;
      transition: background 0.12s;

      &:hover {
        background: rgba(0, 0, 0, 0.06);
        color: @primary-color;
      }

      &--delete:hover {
        color: @error-color;
      }
    }

    &__rename-input {
      flex: 1;
      font-size: 12px;
      font-family: inherit;
      padding: 2px 6px;
      border: 1px solid @primary-color;
      border-radius: 4px;
      outline: none;
      background: #fff;
      color: @text-color;
      box-shadow: 0 0 0 2px fade(@primary-color, 15%);
    }
  }

  // ── Main chat area ────────────────────────────────────────

  .ai-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ai-chat {
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
    &__type-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }

    &__type-opt {
      padding: 4px 12px;
      border: 1px solid @border-color;
      border-radius: 999px;
      background: #fff;
      font-size: 12px;
      color: @text-secondary;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;

      &:hover {
        border-color: @primary-color;
        color: @primary-color;
      }

      &.is-active {
        border-color: @primary-color;
        background: fade(@primary-color, 10%);
        color: @primary-color;
        font-weight: 500;
      }
    }

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
      height: 88px;
      overflow-y: auto;
      transition: height 0.25s ease;

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

  // ── Prompt modal ──────────────────────────────────────────

  .prompt-modal {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    border-radius: inherit;
    z-index: 10;

    &__panel {
      width: 90%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid @border-color;
    }

    &__title {
      font-size: 14px;
      font-weight: 600;
      color: @text-color;
    }

    &__close {
      background: none;
      border: none;
      font-size: 13px;
      color: @text-secondary;
      cursor: pointer;
      padding: 3px 6px;
      border-radius: 4px;
      line-height: 1;

      &:hover {
        color: @text-color;
        background: @bg-color;
      }
    }

    &__textarea {
      display: block;
      width: 100%;
      padding: 12px 16px;
      font-size: 13px;
      line-height: 1.65;
      font-family: inherit;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      color: @text-color;
      min-height: 120px;
      max-height: 240px;
      overflow-y: auto;
      box-sizing: border-box;

      &::placeholder {
        color: @text-secondary;
      }
    }

    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 10px 16px;
      border-top: 1px solid @border-color;
    }

    &__cancel {
      padding: 5px 14px;
      border: 1px solid @border-color;
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      color: @text-secondary;
      cursor: pointer;
      transition: @transition;

      &:hover {
        color: @text-color;
        border-color: #c7c7f0;
      }
    }

    &__save {
      padding: 5px 14px;
      border: none;
      border-radius: 6px;
      background: linear-gradient(135deg, #7c3aed, #4f46e5);
      font-size: 13px;
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

  // ── Loading dots ──────────────────────────────────────────

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
