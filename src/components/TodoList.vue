<script setup>
import { ref } from 'vue'
import { apiClient } from '../api'

const props = defineProps({
  initialTodos: {
    type: Array,
    default: () => []
  }
})

// 状态管理
const todos = ref(props.initialTodos)
const newTodoTitle = ref('')
const newTodoDesc = ref('')
const isLoading = ref(false)
const error = ref(null)

const emit = defineEmits(['error'])

// 添加新待办
const handleAddTodo = async () => {
  if (!newTodoTitle.value.trim()) return
  
  try {
    isLoading.value = true
    const createdTodo = await apiClient.createTodo(
      newTodoTitle.value.trim(),
      newTodoDesc.value.trim() || null
    )
    todos.value = [createdTodo, ...todos.value]
    newTodoTitle.value = ''
    newTodoDesc.value = ''
  } catch (err) {
    error.value = `添加失败: ${err.message}`
    emit('error', error.value)
  } finally {
    isLoading.value = false
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
    emit('error', error.value)
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
    emit('error', error.value)
  }
}

// 刷新待办列表
const refreshTodos = async () => {
  try {
    isLoading.value = true
    error.value = null
    todos.value = await apiClient.fetchTodos()
  } catch (err) {
    error.value = `加载失败: ${err.message}`
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

// 导出方法以供父组件调用
defineExpose({
  refreshTodos
})
</script>

<template>
  <div class="todo-container">
    <h2 class="section-title">待办事项</h2>
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
</template>

<style scoped>
.todo-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
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