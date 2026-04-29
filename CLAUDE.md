# 项目角色与技术栈

你是一个资深的全栈开发工程师，专注于 **Vue 3 (Frontend)** 和 **NestJS (Backend)** 开发。请严格遵守以下规范生成代码。

## 🛠️ 技术栈详情
- **前端**: Vue 3 (Composition API), TypeScript, Less, Pinia, VueUse
- **后端**: NestJS, TypeScript, MongoDB (Mongoose/Typegoose), RxJS
- **代码格式**: Prettier (无分号, 单引号, 120字符行宽)

## ⚙️ 核心代码风格 (Prettier)
生成代码时必须遵循：
- `semi`: false (无分号)
- `singleQuote`: true (单引号)
- `printWidth`: 120
- `trailingComma`: "none"
- **Less 风格**: 嵌套编写，使用变量存储主题色。

## 📝 命名规范 (严格约束)

### 通用与文件命名
- **目录**: `kebab-case` (如 `src/views/user-list/`)。
- **普通文件**: `kebab-case` (如 `format-time.ts`, `user.service.ts`)。
- **组件文件**: `PascalCase` (如 `UserCard.vue`)。

### 前端 (Vue 3)
- **变量/函数**: `camelCase`。
- **布尔值**: 必须带前缀 (`is`/`has`/`can`)。
- **组件名**: `PascalCase`，文件名必须与组件名一致。
- **状态管理**: 
    - 全局共享数据 -> **Pinia**
    - 页面级/组件树局部状态 -> **VueUse `createInjectionState`**

### 后端 (NestJS)
- **变量/函数**: `camelCase`。
- **常量**: `CONSTANT_CASE`。
- **枚举**:
    - Key: `CONSTANT_CASE` (如 `ADMIN`)
    - Value: `lower_case` (新项目标准，如 `admin`)
- **类命名**:
    - Controller: `XxxController` (如 `AuthController`)
    - DTO: `XxxDto` (如 `GetUserListDto`)
    - Service: `XxxService`
- **接口/Schema**:
    - 数据库 Schema 接口以 `Document` 结尾 (如 `ProjectDocument`)。
    - 可选字段必须排列在 Interface 的最后。

## 💻 后端开发规范 (NestJS)

### API 路由定义
- **风格**: 虽然 NestJS 支持 RESTful 动词，但本项目**统一使用 `@Post()`** 装饰器（除非有特殊 REST 需求）。
- **路径**: 使用 `kebab-case` 描述动宾短语。
    - ✅ 正确: `@Post('get-label-statistic')`
    - ❌ 错误: `@Get('label-statistic')`

### 异常处理
- 统一抛出 `DefaultException` 或 `Exception`。
- ❌ 禁止: `throw new Error('...')`
- ✅ 推荐: `throw new DefaultException('task is closed')`

### 数组方法
- 元素命名：如果数组名是复数 (如 `labels`)，回调参数用单数 (`label`) 或有意义缩写 (`el`)。
    - `labels.map((label) => ...)`

### 注释规范
- 双斜杠后空一格。
- 字段注释跟在类型后面。
```typescript
interface ProjectDocument {
  name: string // 项目名称
  clientId: Types.ObjectId // 客户id
}