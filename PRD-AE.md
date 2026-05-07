  📋 项目需求理解总结

  核心目标

  构建一个 个人任务管理系统，支持用户注册登录、任务 CRUD、中英双语切换，采用 Vue
   3 + NestJS + MongoDB 全栈架构。

  技术要点确认

  ✅ 已明确:
  - 前端: Vue 3 Composition API + TypeScript + Pinia + vue-i18n + Less
  - 后端: NestJS + MongoDB (Mongoose) + JWT 认证
  - 代码规范: 无分号、单引号、120字符宽度
  - 后端 API: 统一使用 @Post() + kebab-case 动宾短语路由
  - 异常处理: 使用 DefaultException

  ---
  ❓ 需要确认的技术细节

  1. 数据库设计相关

  - 任务的 status 字段：是否定义为枚举？建议值：pending / in_progress /
  completed？
  - 任务的 deletedAt 字段：采用软删除还是硬删除？（建议软删除）
  - 用户密码存储：是否使用 bcrypt 加密？

  2. API 接口相关

  - 任务列表是否需要分页？（建议支持，参数：page, pageSize）
  - 任务筛选除了 status，是否需要支持日期范围、关键词搜索？
  - JWT Token 过期时间：建议 7 天？是否需要 Refresh Token？

  3. 前端组件相关

  - 是否需要任务详情弹窗/抽屉，还是独立页面？
  - 语言切换按钮放在哪里？（建议：顶部导航栏）
  - 是否需要任务统计看板（如：总任务数、完成率）？

  4. 部署相关

  - Docker 部署：前后端是否分离为两个容器？还是单体部署？
  - MongoDB 是否也容器化？还是使用云服务（如 MongoDB Atlas）？

  ---
  🗓️ 详细开发计划（Plan）

  阶段一：数据库设计与后端基础搭建

  1.1 MongoDB Schema 设计

  User Schema (user.schema.ts)
  interface UserDocument {
    email: string // 用户邮箱（唯一）
    password: string // 加密后的密码
    createdAt: Date // 创建时间
    updatedAt: Date // 更新时间
  }

  Task Schema (task.schema.ts)
  interface TaskDocument {
    title: string // 任务标题
    description: string // 任务描述
    status: 'pending' | 'in_progress' | 'completed' // 任务状态
    userId: Types.ObjectId // 所属用户ID
    createdAt: Date // 创建时间
    updatedAt: Date // 更新时间
    dueDate?: Date // 截止日期（可选）
    deletedAt?: Date // 软删除时间（可选）
  }

  1.2 后端 API 接口定义（NestJS）

  认证模块 (Auth Module)

  ┌────────────────┬──────┬──────────┬─────────────┐
  │    接口路径    │ 方法 │   功能   │     DTO     │
  ├────────────────┼──────┼──────────┼─────────────┤
  │ /auth/register │ POST │ 用户注册 │ RegisterDto │
  ├────────────────┼──────┼──────────┼─────────────┤
  │ /auth/login    │ POST │ 用户登录 │ LoginDto    │
  └────────────────┴──────┴──────────┴─────────────┘

  任务模块 (Task Module)

  ┌────────────────┬──────┬──────────────┬────────────────┬──────────┐
  │    接口路径    │ 方法 │     功能     │      DTO       │ 需要认证 │
  ├────────────────┼──────┼──────────────┼────────────────┼──────────┤
  │ /task/create   │ POST │ 创建任务     │ CreateTaskDto  │ ✅       │
  ├────────────────┼──────┼──────────────┼────────────────┼──────────┤
  │ /task/get-list │ POST │ 获取任务列表 │ GetTaskListDto │ ✅       │
  ├────────────────┼──────┼──────────────┼────────────────┼──────────┤
  │ /task/update   │ POST │ 更新任务     │ UpdateTaskDto  │ ✅       │
  ├────────────────┼──────┼──────────────┼────────────────┼──────────┤
  │ /task/delete   │ POST │ 删除任务     │ DeleteTaskDto  │ ✅       │
  └────────────────┴──────┴──────────────┴────────────────┴──────────┘

  1.3 DTO 定义示例

  // CreateTaskDto
  class CreateTaskDto {
    title: string // 任务标题
    description: string // 任务描述
    status: 'pending' | 'in_progress' | 'completed' // 任务状态
    dueDate?: Date // 截止日期（可选）
  }

  // GetTaskListDto
  class GetTaskListDto {
    page: number // 页码
    pageSize: number // 每页数量
    status?: 'pending' | 'in_progress' | 'completed' // 状态筛选（可选）
  }

  ---
  阶段二：前端组件结构设计

  2.1 路由结构 (src/router/)

  /login          -> LoginView.vue (登录页)
  /register       -> RegisterView.vue (注册页)
  /tasks          -> TaskListView.vue (任务列表页，需要认证)
  /tasks/:id      -> TaskDetailView.vue (任务详情页，可选)

  2.2 组件树结构 (src/)

  src/
  ├── views/
  │   ├── auth/
  │   │   ├── LoginView.vue          # 登录页
  │   │   └── RegisterView.vue       # 注册页
  │   └── task/
  │       ├── TaskListView.vue       # 任务列表页
  │       └── TaskDetailView.vue     # 任务详情页（可选）
  ├── components/
  │   ├── layout/
  │   │   ├── AppHeader.vue          # 顶部导航（含语言切换）
  │   │   └── AppLayout.vue          # 布局容器
  │   └── task/
  │       ├── TaskCard.vue           # 任务卡片组件
  │       ├── TaskForm.vue           # 任务表单（创建/编辑）
  │       └── TaskFilter.vue         # 任务筛选器
  ├── stores/
  │   ├── auth.ts                    # 用户认证状态（Pinia）
  │   └── task.ts                    # 任务列表状态（Pinia）
  ├── api/
  │   ├── auth.ts                    # 认证接口调用
  │   └── task.ts                    # 任务接口调用
  ├── locales/
  │   ├── zh-CN.json                 # 中文翻译
  │   └── en-US.json                 # 英文翻译
  └── styles/
      ├── variables.less             # Less 变量（主题色）
      └── global.less                # 全局样式

  2.3 状态管理策略

  - 全局状态（Pinia）:
    - authStore: 用户登录信息、Token
    - taskStore: 任务列表、筛选条件
  - 局部状态（VueUse）:
    - 表单组件内部状态（如 TaskForm.vue 的表单字段）

  ---
  阶段三：分步开发任务清单

  Phase 1: 后端基础搭建 (优先级: P0)

  - 1.1 初始化 NestJS 项目，配置 MongoDB 连接
  - 1.2 创建 User Schema 和 Auth Module（注册/登录接口）
  - 1.3 实现 JWT 生成与验证逻辑
  - 1.4 创建 JWT Guard，保护需要认证的接口
  - 1.5 创建 Task Schema 和 Task Module（CRUD 接口）
  - 1.6 实现 DefaultException 异常处理

  Phase 2: 前端基础搭建 (优先级: P0)

  - 2.1 初始化 Vue 3 项目，配置 TypeScript + Pinia + vue-i18n
  - 2.2 配置 Less，创建主题变量文件
  - 2.3 创建路由结构（登录/注册/任务列表）
  - 2.4 创建 authStore，实现 Token 持久化
  - 2.5 封装 Axios，添加请求拦截器（自动携带 Token）
  - 2.6 配置 vue-i18n，添加中英文翻译文件

  Phase 3: 用户认证功能 (优先级: P0)

  - 3.1 开发 LoginView.vue 和 RegisterView.vue
  - 3.2 开发 api/auth.ts 接口调用函数
  - 3.3 集成登录/注册表单，调用后端接口
  - 3.4 实现登录成功后跳转到任务列表页
  - 3.5 添加路由守卫，未登录用户重定向到登录页

  Phase 4: 任务管理功能 (优先级: P1)

  - 4.1 开发 TaskListView.vue，展示任务列表
  - 4.2 开发 TaskCard.vue 组件，显示单个任务
  - 4.3 开发 TaskForm.vue 组件（创建/编辑任务）
  - 4.4 开发 TaskFilter.vue 组件（状态筛选）
  - 4.5 开发 api/task.ts 接口调用函数
  - 4.6 实现任务创建、更新、删除功能
  - 4.7 实现任务列表分页和筛选

  Phase 5: UI/UX 优化 (优先级: P2)

  - 5.1 开发 AppHeader.vue，添加语言切换按钮
  - 5.2 优化 Less 样式，确保响应式布局
  - 5.3 添加加载状态和错误提示（Toast/Message）
  - 5.4 添加任务统计看板（可选）

  Phase 6: 部署与调试 (优先级: P2)

  - 6.1 编写后端 Dockerfile
  - 6.2 编写前端 Dockerfile（或使用 Nginx）
  - 6.3 编写 docker-compose.yml（前后端 + MongoDB）
  - 6.4 测试容器化部署流程
  - 6.5 编写 README.md（启动指南）

  ---
  🎯 关键技术决策建议

  1. 任务状态枚举: 建议使用 pending / in_progress / completed
  2. 删除策略: 建议软删除（添加 deletedAt 字段）
  3. 分页: 建议支持，默认每页 10 条
  4. JWT 过期时间: 建议 7 天，暂不实现 Refresh Token（后续可扩展）
  5. 任务详情: 建议使用弹窗/抽屉，避免额外路由
  6. 部署: 建议前后端分离容器 + docker-compose 编排

---

## Feature 1: 任务置顶 & 贡献日历

### 需求描述
- 任务卡片支持置顶/取消置顶，置顶任务排列在列表最前
- 新增贡献日历组件（类 GitHub contribution graph），按日期展示任务创建数量
- 点击日历格子按创建日期筛选任务，再次点击或 60 秒后自动恢复

### 后端变更
- `Task Schema` 新增字段：`isPinned: boolean`、`pinnedAt?: Date`
- 新增接口 `POST /task/toggle-pin`：切换任务置顶状态，记录 `pinnedAt`
- 新增接口 `GET /task/contribution`：返回近一年每日任务创建数量 `Record<string, number>`
- 任务列表排序：置顶任务优先，同级按 `createdAt` 升序
- `GetTaskListDto` 新增 `createdAtDate?: string` 字段，按精确日期筛选

### 前端变更
- `TaskCard` 新增置顶按钮，置顶状态高亮显示
- 新增 `ContributionCalendar.vue` 组件：SVG 渲染 52 周热力图，深色代表数量多
- `TaskListView` 新增日期筛选状态管理：`selectedDate`、`savedFilter`，点击格子后保存当前筛选条件，恢复时还原

---

## Feature 2: 任务筛选增强

### 需求描述
- 任务列表支持按截止日期范围筛选（起始日期 + 结束日期）
- 支持关键词搜索（匹配任务标题和描述）
- 筛选器 UI 使用 pill 按钮组切换状态，搜索框带清除按钮，日期选择器带标签

### 后端变更
- `GetTaskListDto` 新增：`keyword?: string`、`dueDateStart?: string`、`dueDateEnd?: string`
- `TaskService.getList` 支持 `$regex` 关键词搜索、`dueDate.$gte/$lte` 日期范围过滤

### 前端变更
- `TaskFilter.vue` 重构：状态 pill 组 + 搜索框 + 日期范围选择器 + 重置按钮
- 日期输入框锁定 `width` 和 `height`，防止选择日期时布局抖动

---

## Feature 3: AI 报告生成

### 需求描述
- 用户可多选任务卡片，点击「AI 生成」按钮选择日报或周报
- 弹出 AI 聊天窗口，预填充 Prompt + 任务 Markdown 表格，支持流式输出
- 支持多轮对话、消息复制、错误重试
- 支持自定义 Prompt 模版，存储至数据库，下次打开自动填充

### 后端变更
- 新增 `AiModule`，接口路径 `/ai`
- `POST /ai/generate-stream`：接收 `type`、`messages[]`，调用 LLM，SSE 流式返回
- `GET /ai/prompt`：获取用户保存的 Prompt 模版（`dailyPrompt`、`weeklyPrompt`）
- `POST /ai/save-prompt`：保存用户自定义 Prompt 模版至数据库
- 新增 `AiPrompt Schema`：`userId`、`dailyPrompt`、`weeklyPrompt`

### 前端变更
- `TaskCard` 新增 checkbox 多选，`TaskListView` 工具栏显示已选数量
- 新增 `AiReportModal.vue`：聊天气泡布局，SSE 流式渲染，支持 Ctrl+Enter 发送
- 输入框自动根据内容高度伸缩，带动画过渡（`transition: height 0.25s ease`）
- 新增「Prompt 模版」按钮，点击弹出独立编辑弹窗，保存后立即更新输入框内容
- AI 弹窗仅点击关闭按钮关闭，点击遮罩层不关闭

---

## Feature 4: 任务列表 UI 优化

### 需求描述
- 任务卡片横向单行滚动排列，固定高度，不受内容影响
- 移除分页，后端返回全量任务（不传 `pageSize` 时无限制）
- 统一工具栏按钮高度，消除布局抖动

### 变更内容
- 引入 Less 变量 `@task-card-height: 110px` 作为单一来源，卡片、骨架屏、行高均派生于此
- `.task-row` 使用固定 `height: @task-card-height + 18px`，配合 `overflow-y: hidden` 防止抖动
- 任务描述固定单行显示（`height: 20px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis`）
- `btn-sm` 统一 `height: 26px`，日期筛选 chip 同步对齐
- 后端 `pageSize` 不传时跳过 `.limit()`，返回全部数据
- 前端 store 不再发送 `pageSize`

---

## Feature 5: AI 对话历史

### 1. 数据模型（新增 `AiConversation` 集合）

| 字段 | 类型 | 说明 |
|---|---|---|
| `_id` | ObjectId | 主键 |
| `userId` | ObjectId | 关联用户 |
| `type` | `'daily' \| 'weekly'` | 报告类型 |
| `name` | string | 对话名，默认格式 `YYYYMMDD-日报-HHMM` |
| `messages` | `{role, content}[]` | 完整对话消息列表 |
| `createdAt` | Date | 创建时间 |
| `updatedAt` | Date | 最后更新时间 |

### 2. 后端接口（新增 `/ai/conversations`）

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/ai/conversations` | 获取当前用户所有对话（按 `updatedAt` 倒序） |
| `POST` | `/ai/conversations` | 创建新对话（传入 `type`、`name`、`messages`） |
| `PATCH` | `/ai/conversations/:id` | 更新对话（修改名称 或 追加消息） |
| `DELETE` | `/ai/conversations/:id` | 删除对话 |

### 3. 前端 UI 变化

#### 弹窗布局
- 弹窗最大宽度：`660px → 960px`
- 新增左侧栏（宽 `220px`），右侧保留现有聊天区域

#### 左侧栏内容
- 顶部「新建对话」按钮
- 对话列表，每项显示：
  - 对话名（可点击切换）
  - 悬浮出现「重命名 ✎」和「删除 🗑」操作
- 当前激活对话高亮

#### 对话名称规则
- 自动生成格式：`YYYYMMDD-日报-HHMM`（中文）/ `YYYYMMDD-Daily-HHMM`（英文）
- 点击重命名后原地变为输入框，回车或失焦保存

#### 交互逻辑
- **打开弹窗**：自动创建一条新对话（不立即存库，首次发送后保存）
- **发送消息**：追加到当前对话的 `messages` 并同步到后端
- **切换历史对话**：加载该对话的 `messages` 渲染到聊天区，`inputText` 清空
- **删除对话**：确认后删除，若删除的是当前对话则自动新建一条

### 4. 分支名
`feature/ai-conversation-history`