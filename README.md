# ✦ Taskly

> 🚀 你的任务，你说了算 —— 从待办清单到 AI 周报，一站搞定！

Taskly 是一款专为个人打造的全栈任务管理应用 📋。你可以轻松创建和追踪任务、在热力日历上回顾每天的工作轨迹 🗓️，还能选中任务后让 AI 帮你一键生成日报或周报 🤖✨ —— 再也不用盯着空白文档发呆了！

无论是记录今天做了什么、梳理本周进展，还是跟 AI 随手聊几句，Taskly 都能稳稳接住 💪。中英双语、流式输出、对话历史全都有 🐳。

**技术栈**：Vue 3 · TypeScript · NestJS · MongoDB · Docker

---

## 功能特性

### 任务管理
- **创建 / 编辑 / 删除**：完整的 CRUD 操作，删除采用软删除，数据可追溯
- **状态跟踪**：三种状态——待处理（Pending）/ 进行中（In Progress）/ 已完成（Completed）
- **任务置顶**：支持置顶 / 取消置顶，置顶任务始终排在列表最前
- **截止日期**：每条任务可设置截止日期，支持按日期范围筛选

### 筛选与搜索
- 按**状态**筛选（全部 / 待处理 / 进行中 / 已完成）
- 按**关键词**模糊搜索任务标题与描述
- 按**截止日期范围**精确筛选
- 点击贡献日历格子可**按创建日期**筛选任务，60 秒后自动还原

### 统计看板
- 实时显示总任务数、已完成数、完成率三项核心指标

### 贡献日历
- 类 GitHub 热力图，展示近一年每日任务创建量
- 颜色深浅反映当天任务数量
- 点击日期格子即可筛选该日创建的任务

### AI 对话助手
- **自由对话**：随时打开 AI 对话窗口，与 AI 进行多轮自由问答
- **日报生成**：点击「日报」按钮，自动拼接选中任务列表与 Prompt 模版，一键生成日报
- **周报生成**：同上，生成工作周报
- **SSE 流式输出**：AI 回复逐字流式渲染，无需等待完整响应
- **自定义 Prompt 模版**：日报 / 周报各自维护一套 Prompt，保存至数据库，下次自动填充
- **对话历史**：每次发送后自动保存对话记录，支持按会话切换查看历史
- **重命名 / 删除**：可对历史对话进行重命名或删除

### 认证与安全
- **JWT 双 Token 机制**：Access Token（短期）+ Refresh Token（长期），自动续签
- **Refresh Token 轮换**：每次刷新后旧 Token 立即失效，防止重放攻击
- **软删除隔离**：已删除任务对当前用户不可见，数据物理保留

### 国际化
- 支持中文 / English 一键切换，界面文案全部走 i18n

---

## 项目结构

```
Taskly/
├── backend/                        # NestJS 后端
│   ├── src/
│   │   ├── ai/                     # AI 模块（对话、报告、Prompt 管理）
│   │   ├── auth/                   # 认证模块（注册、登录、JWT）
│   │   ├── task/                   # 任务模块（CRUD、筛选、贡献日历）
│   │   └── common/                 # 公共异常、守卫、管道
│   └── .env                        # 本地环境变量
├── frontend/                       # Vue 3 前端
│   ├── src/
│   │   ├── api/                    # HTTP 请求封装（task、ai、auth）
│   │   ├── components/             # 组件（TaskCard、AiReportModal 等）
│   │   ├── stores/                 # Pinia 状态管理
│   │   ├── views/                  # 页面视图
│   │   └── styles/                 # 全局样式变量
│   └── .env                        # 前端环境变量
├── docker-compose.yml              # 生产部署（三服务）
└── docker-compose.dev.yml          # 本地开发（仅 MongoDB）
```

---

## 本地开发

### 前置条件

- Node.js >= 20
- pnpm
- Docker（用于启动 MongoDB）

### 1. 启动 MongoDB

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 配置后端环境变量

在 `backend/` 目录下创建 `.env` 文件：

```env
MONGODB_URI=mongodb://localhost:27017/taskly
JWT_SECRET=your-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
PORT=3000
AI_BASE_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=your-api-key
AI_MODEL=gpt-4o
```

### 3. 启动后端

```bash
cd backend
pnpm install
pnpm start:dev
```

后端运行在 `http://localhost:3000`

### 4. 配置前端环境变量

在 `frontend/` 目录下创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 5. 启动前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端运行在 `http://localhost:5173`

---

## 生产部署（Docker Compose）

```bash
docker-compose up -d
```

启动三个容器：

| 容器 | 说明 | 端口 |
|------|------|------|
| taskly-frontend | Vue 3 + Nginx 静态服务 | 80 |
| taskly-backend | NestJS API 服务 | 内部 3000 |
| taskly-mongodb | MongoDB 7 数据库 | 内部 27017 |

> 部署前请修改 `backend/.env.production` 中的 `JWT_SECRET`、`JWT_REFRESH_SECRET` 和 AI 相关配置，避免使用默认值。

---

## API 接口

### 认证 `/auth`

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/auth/register` | POST | 注册新用户 | — |
| `/auth/login` | POST | 登录，返回 Access Token + Refresh Token | — |
| `/auth/refresh` | POST | 使用 Refresh Token 换取新 Token 对 | Refresh Token |
| `/auth/logout` | POST | 退出登录，使 Refresh Token 失效 | Access Token |

### 任务 `/task`

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/task/create` | POST | 创建任务 | ✅ |
| `/task/get-list` | POST | 获取任务列表（支持状态 / 关键词 / 日期范围 / 创建日期筛选） | ✅ |
| `/task/update` | POST | 更新任务（标题、描述、状态、截止日期） | ✅ |
| `/task/delete` | POST | 软删除任务 | ✅ |
| `/task/toggle-pin` | POST | 切换置顶状态 | ✅ |
| `/task/contribution` | GET | 获取近一年每日任务创建数量（用于贡献日历） | ✅ |

### AI `/ai`

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/ai/get-prompt` | POST | 获取当前用户保存的日报 / 周报 Prompt 模版 | ✅ |
| `/ai/save-prompt` | POST | 保存 Prompt 模版（按类型覆盖） | ✅ |
| `/ai/generate-stream` | POST | SSE 流式生成 AI 回复（支持 daily / weekly / chat） | ✅ |
| `/ai/conversations` | GET | 获取对话历史列表（按更新时间倒序） | ✅ |
| `/ai/conversations` | POST | 创建新对话记录 | ✅ |
| `/ai/conversations/:id` | PATCH | 更新对话（重命名或追加消息） | ✅ |
| `/ai/conversations/:id` | DELETE | 删除指定对话 | ✅ |

---

## 环境变量说明

### `backend/.env`

| 变量 | 说明 | 示例 |
|------|------|------|
| `MONGODB_URI` | MongoDB 连接字符串 | `mongodb://localhost:27017/taskly` |
| `JWT_SECRET` | Access Token 签名密钥 | 随机字符串 |
| `JWT_EXPIRES_IN` | Access Token 有效期 | `15m` |
| `JWT_REFRESH_SECRET` | Refresh Token 签名密钥 | 随机字符串 |
| `JWT_REFRESH_EXPIRES_IN` | Refresh Token 有效期 | `30d` |
| `PORT` | 后端监听端口 | `3000` |
| `AI_BASE_URL` | AI API 地址（兼容 OpenAI 协议） | `https://api.openai.com/v1/chat/completions` |
| `AI_API_KEY` | AI API 密钥 | `sk-...` |
| `AI_MODEL` | 使用的模型名称 | `gpt-4o` |

### `frontend/.env`

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API 基础地址 | `http://localhost:3000` |

