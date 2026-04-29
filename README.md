# Taskly

个人任务管理系统，支持任务 CRUD、状态跟踪、中英双语切换。

**技术栈**：Vue 3 + NestJS + MongoDB

---

## 项目结构

```
Taskly/
├── backend/          # NestJS 后端
├── frontend/         # Vue 3 前端
├── docker-compose.yml        # 生产部署
└── docker-compose.dev.yml    # 本地开发（仅 MongoDB）
```

---

## 本地开发

### 前置条件

- Node.js >= 20
- pnpm
- Docker

### 1. 启动 MongoDB

```bash
docker run -d --name taskly-mongo -p 27017:27017 mongo:7
```

或使用项目自带的 dev compose：

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 2. 启动后端

```bash
cd backend
pnpm install
pnpm start:dev
```

后端运行在 `http://localhost:3000`

### 3. 启动前端

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
| taskly-frontend | Vue 3 + Nginx | 80 |
| taskly-backend | NestJS | 内部 3000 |
| taskly-mongodb | MongoDB 7 | 内部 27017 |

> 部署前请修改 `backend/.env.production` 中的 `JWT_SECRET` 和 `JWT_REFRESH_SECRET`。

---

## API 接口

### 认证

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/auth/register` | POST | 注册 | — |
| `/auth/login` | POST | 登录 | — |
| `/auth/refresh` | POST | 刷新 Token | Refresh Token |
| `/auth/logout` | POST | 退出 | Access Token |

### 任务

| 路径 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/task/create` | POST | 创建任务 | ✅ |
| `/task/get-list` | POST | 获取任务列表（分页+筛选） | ✅ |
| `/task/update` | POST | 更新任务 | ✅ |
| `/task/delete` | POST | 删除任务（软删除） | ✅ |

---

## 环境变量

### backend/.env

```env
MONGODB_URI=mongodb://localhost:27017/taskly
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
PORT=3000
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:3000
```
