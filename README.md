# 前端开发说明：
## 环境准备

克隆仓库到本地
```bash
git clone https://github.com/JaredforReal/TimeHacker.git
```

安装好nodejs与vite后，在项目的根目录：
```bash
npm install
```

开发者模式：
```bash
npm run dev
```

## PR操作
参考：[B站-Github合作流程](https://www.bilibili.com/video/BV19e4y1q7JJ/?spm_id_from=333.337.search-card.all.click&vd_source=d497b3197440772fec7efce0bf91063e)

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
# 后端接口说明：

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

**响应**: 最近50条番茄钟记录
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