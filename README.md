# 前端开发说明：

## 项目完成度与规划（更新）

- 当前完成度

  - Vue 3 + Vite 脚手架稳定；Pinia + Supabase 完成会话管理。
  - 路由守卫已保护需要登录的页面（如 `profile`）。
  - 中央化 API 客户端（`src/api/index.js`）：统一请求封装、错误解析，401/403 自动刷新 session 并重试。
  - 首页聚合 `TodoList`、`PomodoroTimer`、`Calendar`，并通过事件完成「待办 ↔ 日历」编排；本地使用 `localStorage` 持久化待办日程，支持拖拽更新与删除。
  - 个人资料页重构：资料读取/保存、头像上传、密码重置链路打通；样式去重。
  - 测试与 CI：已引入 Vitest，补充了 API 客户端的单测；新增 GitHub Actions 工作流对前端进行测试与构建。

- 已知缺口

  - 本地开发命令偶发退出（`npm run dev` exit 1），需要定位 Vite/Supabase/env 加载的具体报错。
  - Vitest 测试中对 `supabase` 的模块 mock 存在 hoist 问题（vi.mock 提前执行），需按 Vitest 推荐使用 `vi.hoisted` 和在导入被测模块前 `vi.stubEnv`。
  - 日程仅本地持久化，尚未与后端同步，跨设备不可用。
  - 组件级单测（`TodoList`/`Calendar`/`HomeView`）与 e2e 测试未覆盖；缺少统一通知/Toast 体系。

- 下一步计划（短期）
  1. 修复 Vitest 测试环境与 mock：在测试中使用 `vi.hoisted` 声明 mock 函数，并在导入 `apiClient` 前使用 `vi.stubEnv('VITE_API_URL', ...)`；必要时将 `API_BASE_URL` 读取改为惰性（调用时读取）。
  2. 排查本地 dev 失败：检查 `.env`、`supabase.js` 初始化、Vite 插件与 Node 版本；增加开发期报错浮层与日志。
  3. 增加组件/编排单测：覆盖 Home 的日程映射、拖拽更新、删除回写、异常提示；补充 stores 的边界用例。
  4. 设计并实现「日程后端化」：新增后端日程表与 CRUD 接口，登录后进行本地缓存与服务器的双向同步。
  5. 统一通知系统：引入轻量 Toast/Alert 组件，规范错误与成功提示文案与展现时机。

## 环境准备

克隆仓库到本地

```bash
git clone https://github.com/JaredforReal/TimeHacker.git
```

安装好 nodejs 与 vite 后，在项目的根目录：

```bash
npm install
```

开发者模式：

```bash
npm run dev
```

运行测试：

```bash
npm run test
```

Vitest 小贴士：

- 模块 mock 的工厂函数会被「提升」（hoist）到文件顶部执行；如需在 mock 中引用变量，请使用 `vi.hoisted(() => ({ ... }))` 先声明，再在 `vi.mock` 中使用。
- 在导入被测模块前，使用 `vi.stubEnv('VITE_API_URL', 'https://api.example.com')` 或在源码中惰性读取 `import.meta.env`，避免构造时抓取到空的环境变量。

## 项目结构

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── api/
│   │   └── index.js            # API请求客户端(包含认证逻辑)
│   │
│   ├── assets/
│   │   ├── main.css           # 全局样式
│   │   └── vue.svg
│   │
│   ├── components/
│   │   ├── PomodoroTimer.vue  # 番茄钟组件
│   │   └── TodoList.vue       # 待办事项组件
│   │
│   ├── router/
│   │   └── index.js           # 路由配置
│   │
│   ├── stores/
│   │   └── user.js            # 用户状态管理
│   │
│   ├── views/
│   │   ├── HomeView.vue       # 首页(包含待办和番茄钟)
│   │   └── LoginView.vue      # 登录/注册页面
│   │
│   ├── App.vue                # 应用根组件
│   ├── main.js                # 应用入口
│   ├── style.css              # 应用基础样式
│   └── supabase.js            # Supabase客户端配置
│
├── .env                        # 环境变量配置
├── index.html                  # HTML入口文件
├── package.json                # 项目依赖配置
├── README.md                   # 项目说明文档
└── vite.config.js              # Vite构建配置
```

---

# [后端](https://github.com/JaredforReal/timehacker-api)接口说明：

date: 2025-05-10

这份文档详细介绍了 TimeHacker 项目的 API 接口，供前端开发者使用。

## 基础信息

**基础 URL**: `http://117.72.112.49:8000`

所有 API 请求需要在 Headers 中携带授权信息：

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## 认证

### 登录

**接口**: `POST /token`

**请求体**:

```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**响应**:

```json
{
  "access_token": "eyJxxxxx...",
  "token_type": "bearer"
}
```

## 系统状态

### 健康检查

**接口**: `GET /api/` 或 `GET /`

**响应**:

```json
{
  "status": "ok",
  "message": "Todo API is running",
  "version": "1.0.0"
}
```

## 待办事项 API

### 获取所有待办事项

**接口**: `GET /todos`

**响应**: 待办事项列表

```json
[
  {
    "id": "123",
    "user_id": "user-uuid",
    "title": "完成作业",
    "description": "需要在周五前完成",
    "is_completed": false,
    "created_at": "2023-05-20T10:30:00Z",
    "updated_at": "2023-05-20T10:30:00Z"
  }
]
```

### 创建待办事项

**接口**: `POST /todos`

**请求体**:

```json
{
  "title": "买牛奶",
  "description": "购买2升鲜奶"
}
```

**响应**: 创建的待办事项

```json
{
  "id": "456",
  "user_id": "user-uuid",
  "title": "买牛奶",
  "description": "购买2升鲜奶",
  "is_completed": false,
  "created_at": "2023-05-21T08:15:00Z",
  "updated_at": "2023-05-21T08:15:00Z"
}
```

### 更新待办事项

**接口**: `PUT /todos/{todo_id}`

**请求体**:

```json
{
  "title": "更新的标题",
  "description": "更新的描述",
  "is_completed": true
}
```

**响应**: 更新后的待办事项

```json
{
  "id": "456",
  "user_id": "user-uuid",
  "title": "更新的标题",
  "description": "更新的描述",
  "is_completed": true,
  "created_at": "2023-05-21T08:15:00Z",
  "updated_at": "2023-05-21T09:30:00Z"
}
```

### 删除待办事项

**接口**: `DELETE /todos/{todo_id}`

**响应**: HTTP 204 No Content

## 番茄钟 API

### 保存番茄钟会话

**接口**: `POST /pomodoro/sessions`

**请求体**:

```json
{
  "title": "学习编程",
  "duration": 25,
  "completedAt": "2023-05-21T14:25:00Z"
}
```

**响应**: 保存的番茄钟会话

```json
{
  "id": "789",
  "user_id": "user-uuid",
  "title": "学习编程",
  "duration": 25,
  "completedAt": "2023-05-21T14:25:00Z",
  "created_at": "2023-05-21T14:25:30Z"
}
```

### 获取番茄钟历史记录

**接口**: `GET /pomodoro/sessions`

**响应**: 最近 50 条番茄钟记录

```json
[
  {
    "id": "789",
    "user_id": "user-uuid",
    "title": "学习编程",
    "duration": 25,
    "completedAt": "2023-05-21T14:25:00Z",
    "created_at": "2023-05-21T14:25:30Z"
  }
]
```

### 获取番茄钟设置

**接口**: `GET /pomodoro/settings`

**响应**: 用户的番茄钟设置

```json
{
  "workTime": 25,
  "shortBreakTime": 5,
  "longBreakTime": 15,
  "sessionsUntilLongBreak": 4
}
```

### 保存番茄钟设置

**接口**: `PUT /pomodoro/settings`

**请求体**:

```json
{
  "workTime": 30,
  "shortBreakTime": 5,
  "longBreakTime": 20,
  "sessionsUntilLongBreak": 4
}
```

**响应**: 更新后的设置

```json
{
  "workTime": 30,
  "shortBreakTime": 5,
  "longBreakTime": 20,
  "sessionsUntilLongBreak": 4
}
```

## 错误处理

所有接口在出错时返回适当的 HTTP 状态码和错误信息：

```json
{
  "detail": "错误描述信息"
}
```

常见错误状态码：

- 400: 请求参数错误
- 401: 未认证或认证过期
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

## 前端调用示例

请参考 apiClient(/src/api/index.js) 中的实现方法，其中包含了完整的错误处理和认证逻辑。
