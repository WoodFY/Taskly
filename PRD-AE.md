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