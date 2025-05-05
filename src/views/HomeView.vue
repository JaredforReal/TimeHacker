<template>
  <div class="home-container">
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

    <main class="main-content">
      <div class="container">
        <div class="todo-container">
          <!-- 添加新待办 -->
          <div class="todo-form">
            <input
              v-model="newTodoTitle"
              type="text"
              placeholder="添加新任务..."
              class="todo-input"
              @keyup.enter="addTodo"
            />
            <button @click="addTodo" class="btn btn-primary" :disabled="isAdding">
              {{ isAdding ? '添加中...' : '添加' }}
            </button>
          </div>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading">加载中...</div>

          <!-- 待办列表 -->
          <div v-else class="todo-list">
            <div v-for="todo in todos" :key="todo.id" class="todo-item">
              <div class="todo-content">
                <input
                  type="checkbox"
                  v-model="todo.is_completed"
                  @change="updateTodo(todo)"
                  class="todo-checkbox"
                />
                <div class="todo-text" :class="{ completed: todo.is_completed }">
                  <h3>{{ todo.title }}</h3>
                  <p v-if="todo.description">{{ todo.description }}</p>
                </div>
              </div>
              <button @click="deleteTodo(todo.id)" class="btn btn-danger" :disabled="isDeleting">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const todos = ref([])
const newTodoTitle = ref('')
const isLoading = ref(false)
const isAdding = ref(false)
const isDeleting = ref(false)

// 获取当前用户的所有待办
const fetchTodos = async () => {
  try {
    isLoading.value = true
    const token = (await userStore.supabase.auth.getSession()).data.session?.access_token
    
    const response = await fetch('/api/todos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) throw new Error('获取待办失败')
    todos.value = await response.json()
  } catch (error) {
    console.error('获取待办失败:', error.message)
  } finally {
    isLoading.value = false
  }
}

// 添加新待办
const addTodo = async () => {
  if (!newTodoTitle.value.trim() || isAdding.value) return
  
  try {
    isAdding.value = true
    const token = (await userStore.supabase.auth.getSession()).data.session?.access_token
    
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: newTodoTitle.value.trim()
      })
    })
    
    if (!response.ok) throw new Error('添加待办失败')
    const newTodo = await response.json()
    todos.value = [newTodo, ...todos.value]
    newTodoTitle.value = ''
  } catch (error) {
    console.error('添加待办失败:', error.message)
  } finally {
    isAdding.value = false
  }
}

// 更新待办状态
const updateTodo = async (todo) => {
  try {
    const token = (await userStore.supabase.auth.getSession()).data.session?.access_token
    
    await fetch(`/api/todos/${todo.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        is_completed: todo.is_completed
      })
    })
  } catch (error) {
    console.error('更新待办失败:', error.message)
    // 恢复原状态
    todo.is_completed = !todo.is_completed
  }
}

// 删除待办
const deleteTodo = async (id) => {
  try {
    isDeleting.value = true
    const token = (await userStore.supabase.auth.getSession()).data.session?.access_token
    
    await fetch(`/api/todos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    todos.value = todos.value.filter(todo => todo.id !== id)
  } catch (error) {
    console.error('删除待办失败:', error.message)
  } finally {
    isDeleting.value = false
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await userStore.supabase.auth.signOut()
    router.push('/')
  } catch (error) {
    console.error('退出登录错误:', error.message)
  }
}

// 组件挂载时获取待办
onMounted(() => {
  fetchTodos()
})
</script>

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

.todo-container {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.todo-form {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.todo-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: #90caf9;
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
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

.todo-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.todo-checkbox {
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
}

.todo-text p {
  font-size: 14px;
  color: #666;
}

.completed {
  text-decoration: line-through;
  color: #999;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
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

.btn-danger:disabled {
  background-color: #ffcdd2;
  cursor: not-allowed;
}
</style>