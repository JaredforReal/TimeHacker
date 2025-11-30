# TimeHacker 前端

基于 Vue 3 + Vite 的时间管理应用前端，支持待办事项、日历排程和番茄钟功能。

## 项目完成度与规划

### 当前完成度

- Vue 3 + Vite 脚手架稳定；Pinia 管理用户状态
- **完全移除 Supabase 依赖**，使用自建 JWT 认证（Access Token + Refresh Token）
- 中央化 API 客户端（`src/api/index.js`）：统一请求封装、错误解析，401 自动刷新 Token 并重试
- 路由守卫保护需要登录的页面
- 首页聚合 `TodoList`、`PomodoroTimer`、`Calendar`，通过事件完成「待办 ↔ 日历」编排
- 个人资料页：资料读取/保存、头像上传、密码重置链路
- 测试与 CI：已引入 Vitest，GitHub Actions 工作流进行测试与构建

### 已知缺口

- 日程仅本地持久化，尚未与后端的 Todo 日程字段完全同步
- 组件级单测与 e2e 测试覆盖不足
- 缺少统一通知/Toast 体系

### 下一步计划

1. 完善 Todo 日程字段与日历的双向同步
2. 增加组件/编排单测覆盖
3. 统一通知系统：引入轻量 Toast 组件

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/JaredforReal/TimeHacker.git
cd TimeHacker/frontend

# 安装依赖
npm install

# 配置环境变量
# 编辑 .env 文件，设置 VITE_API_URL

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test
```

## 项目结构

```
frontend/
├── src/
│   ├── api/
│   │   └── index.js            # API 客户端（自建 JWT 认证）
│   │
│   ├── components/
│   │   ├── Calendar.vue        # 日历组件
│   │   ├── PomodoroTimer.vue   # 番茄钟组件
│   │   ├── TodoList.vue        # 待办事项组件
│   │   └── OnboardingModal.vue # 引导弹窗
│   │
│   ├── router/
│   │   └── index.js            # 路由配置（含守卫）
│   │
│   ├── stores/
│   │   └── user.js             # 用户状态管理（Pinia）
│   │
│   ├── views/
│   │   ├── HomeView.vue        # 首页
│   │   ├── LoginView.vue       # 登录/注册页面
│   │   ├── ProfileView.vue     # 个人资料页面
│   │   └── ResetPasswordView.vue # 密码重置页面
│   │
│   ├── App.vue
│   └── main.js
│
├── .env                        # 环境变量
├── package.json
└── vite.config.js
```

## 环境配置

```env
# 后端 API 地址
VITE_API_URL=https://api.your-domain.com

# 本地开发
# VITE_API_URL=http://localhost:8000
```

## 认证机制

前端使用自建 JWT 认证系统：

1. **登录**：调用 `/token` 获取 `access_token` 和 `refresh_token`
2. **Token 存储**：保存在 localStorage
3. **自动刷新**：401 时自动调用 `/refresh` 刷新 Token
4. **登出**：调用 `/logout` 撤销刷新令牌，清除本地存储

## API 接口

### 认证

- `POST /register` - 用户注册
- `POST /token` - 用户登录
- `POST /refresh` - 刷新 Token
- `POST /logout` - 用户登出
- `POST /forgot-password` - 请求密码重置
- `POST /reset-password` - 确认密码重置

### 待办事项

- `GET /todos` - 获取待办列表
- `POST /todos` - 创建待办（支持日历排程字段）
- `PUT /todos/{id}` - 更新待办
- `DELETE /todos/{id}` - 删除待办

### 番茄钟

- `POST /pomodoro/sessions` - 保存番茄钟会话
- `GET /pomodoro/sessions` - 获取历史记录
- `GET /pomodoro/settings` - 获取设置
- `PUT /pomodoro/settings` - 更新设置

### 个人资料

- `GET /profile` - 获取个人资料
- `PUT /profile` - 更新个人资料
- `POST /profile/avatar` - 上传头像

## 测试

```bash
# 运行测试
npm run test

# 监听模式
npm run test:watch
```

## 许可证

MIT License
