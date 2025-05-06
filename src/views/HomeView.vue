<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../api'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

// 状态管理
const todos = ref([])
const newTodoTitle = ref('')
const newTodoDesc = ref('')
const isLoading = ref(false)
const error = ref(null)
const apiStatus = ref(null)

// 初始化加载
onMounted(async () => {
  try {
    // 首先确保用户已登录
    if (!userStore.user) {
      await userStore.fetchUser()

      // 如果仍未登录，跳转到登录页
      if (!userStore.isAuthenticated) {
        console.log("No authenticated user found, redirecting to login")
        router.push('/login')
        return
      }
    }

    // 然后检查API健康状态
    await checkApiHealth()

    // 最后加载待办事项
    await loadTodos()
  } catch (err) {
    error.value = `初始化失败: ${err.message}`
    // 如果是认证错误，尝试刷新会话
    if (err.message.includes('未登录') || err.message.includes('credentials')) {
      const refreshed = await userStore.refreshSession()
      if (refreshed) {
        // 刷新成功，重试加载
        await loadTodos()
      } else {
        // 刷新失败，跳转到登录页
        router.push('/login')
      }
    }
  }
})

// 检查后端状态
const checkApiHealth = async () => {
  apiStatus.value = await apiClient.healthCheck()
}

// 加载待办列表
const loadTodos = async () => {
  try {
    isLoading.value = true
    error.value = null
    todos.value = await apiClient.fetchTodos()
  } catch (err) {
    error.value = `加载失败: ${err.message}`
    if (err.message.includes('未登录')) {
      router.push('/login')
    }
  } finally {
    isLoading.value = false
  }
}

// 添加新待办
const handleAddTodo = async () => {
  if (!newTodoTitle.value.trim()) return
  
  try {
    const createdTodo = await apiClient.createTodo(
      newTodoTitle.value.trim(),
      newTodoDesc.value.trim() || null
    )
    todos.value = [createdTodo, ...todos.value]
    newTodoTitle.value = ''
    newTodoDesc.value = ''
  } catch (err) {
    error.value = `添加失败: ${err.message}`
  }
}

// 切换完成状态
const toggleComplete = async (todo) => {
  try {
    await apiClient.updateTodo(todo.id, {
      is_completed: !todo.is_completed
    })
    todo.is_completed = !todo.is_completed
  } catch (err) {
    error.value = `更新失败: ${err.message}`
  }
}

// 删除待办
const handleDelete = async (id) => {
  if (!confirm('确定删除此待办？')) return
  
  try {
    await apiClient.deleteTodo(id)
    todos.value = todos.value.filter(t => t.id !== id)
  } catch (err) {
    error.value = `删除失败: ${err.message}`
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.signOut()
    router.push('/login')
  } catch (err) {
    error.value = `退出失败: ${err.message}`
  }
}
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <nav class="navbar">
      <div class="container">
        <div class="navbar-content">
          <h1 class="logo">我的待办事项</h1>
          <button @click="handleLogout" class="btn btn-primary">
            退出登录
          </button>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <div class="container">
        <!-- API状态显示 -->
        <div v-if="apiStatus" class="api-status">
          后端状态: {{ apiStatus.status }} - {{ apiStatus.message }}
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <!-- 添加待办表单 -->
        <div class="todo-form">
          <input
            v-model="newTodoTitle"
            type="text"
            placeholder="任务标题"
            class="todo-input"
            @keyup.enter="handleAddTodo"
          />
          <input
            v-model="newTodoDesc"
            type="text"
            placeholder="任务描述（可选）"
            class="todo-input"
            @keyup.enter="handleAddTodo"
          />
          <button 
            @click="handleAddTodo" 
            class="btn btn-primary"
            :disabled="isLoading"
          >
            {{ isLoading ? '处理中...' : '添加任务' }}
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          加载中...
        </div>

        <!-- 待办列表 -->
        <div v-else class="todo-list">
          <div 
            v-for="todo in todos" 
            :key="todo.id" 
            class="todo-item"
            :class="{ completed: todo.is_completed }"
          >
            <div class="todo-content">
              <input
                type="checkbox"
                :checked="todo.is_completed"
                @change="() => toggleComplete(todo)"
                class="todo-checkbox"
              />
              <div class="todo-text">
                <h3>{{ todo.title }}</h3>
                <p v-if="todo.description">{{ todo.description }}</p>
                <small>
                  创建于: {{ new Date(todo.created_at).toLocaleString() }}
                </small>
              </div>
            </div>
            <button 
              @click="() => handleDelete(todo.id)"
              class="btn btn-danger"
            >
              删除
            </button>
          </div>

          <div v-if="todos.length === 0" class="empty-state">
            暂无待办事项，请添加您的第一个任务
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px 0;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.main-content {
  flex: 1;
  padding: 40px 0;
}

.container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
}

.api-status {
  padding: 10px;
  background: #f0f9ff;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.error-message {
  padding: 15px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  margin-bottom: 20px;
}

.todo-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.todo-input {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
}

.todo-input:focus {
  outline: none;
  border-color: #90caf9;
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #666;
}

.spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #1e88e5;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.2s;
}

.todo-item:hover {
  background-color: #f1f3f5;
}

.todo-item.completed {
  opacity: 0.7;
}

.todo-content {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  flex: 1;
}

.todo-checkbox {
  margin-top: 3px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
}

.todo-text h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
  word-break: break-word;
}

.todo-text p {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.todo-text small {
  font-size: 12px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #757575;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.btn-primary {
  background-color: #1e88e5;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
}
</style>