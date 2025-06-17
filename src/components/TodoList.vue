<script setup>
import { onMounted, ref } from 'vue'
import { ElDatePicker } from 'element-plus'
import 'element-plus/dist/index.css'
import { apiClient } from '../api'

const props = defineProps({
  initialTodos: {
    type: Array,
    default: () => []
  }
})

// 状态管理
const todos = ref(props.initialTodos || [])
const newTodoTitle = ref('')
const newTodoDesc = ref('')
const newStartDate = ref('')
const newEndDate = ref('')
const isLoading = ref(false)
const error = ref(null)

const emit = defineEmits(['error'])

// 日期选择配置
const datePickerConfig = {
  valueFormat: 'YYYY-MM-DD',
  type: 'date',
  placeholder: '请选择日期',
  style: {
    width: '100%'
  }
}

// 确保响应数据正确处理
const processTodoData = (data) => {
  if (!data) return [];
  
  // 确保数据是数组
  if (!Array.isArray(data)) {
    console.error('Expected array of todos, got:', data);
    return [];
  }
  
  // 验证每个todo项
  return data.map(todo => {
    // 确保必要字段存在
    if (!todo.id || !todo.title) {
      console.warn('Todo item missing required fields:', todo);
    }
    
    // 确保日期格式正确
    if (todo.created_at && !(todo.created_at instanceof Date)) {
      try {
        // 尝试转换日期字符串，但保留原始值
        const dateObj = new Date(todo.created_at);
        if (!isNaN(dateObj.getTime())) {
          console.log(`Successfully parsed date: ${todo.created_at}`);
        }
      } catch (e) {
        console.warn(`Invalid date format: ${todo.created_at}`, e);
      }
    }
    
    // 确保布尔值正确
    if (typeof todo.is_completed !== 'boolean') {
      todo.is_completed = Boolean(todo.is_completed);
    }
    
    return todo;
  });
};

// 添加新待办
const handleAddTodo = async () => {
  if (!newTodoTitle.value.trim()) {
    alert('请输入任务标题')
    return
  }
  
  try {
    isLoading.value = true
    await apiClient.createTodo(
      newTodoTitle.value.trim(),
      newTodoDesc.value.trim() || null
    )
    // 清空输入框
    newTodoTitle.value = ''
    newTodoDesc.value = ''
    // 重新获取最新的任务列表以确保数据一致性
    await refreshTodos()
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
    // 重新获取最新数据以确保一致性
    await refreshTodos()
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
    // 重新获取最新数据以确保一致性
    await refreshTodos()
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
    const todoData = await apiClient.fetchTodos()
    console.log('Fetched todos:', todoData)
    todos.value = processTodoData(todoData)
  } catch (err) {
    error.value = `加载失败: ${err.message}`
    emit('error', error.value)
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时加载待办
onMounted(() => {
  if (!props.initialTodos || props.initialTodos.length === 0) {
    refreshTodos()
  }
})

// 导出方法以供父组件调用
defineExpose({
  refreshTodos
})

// 添加新的 ref 控制表单显示
const showAddForm = ref(false)

// 添加切换表单显示的方法
const toggleAddForm = () => {
  showAddForm.value = !showAddForm.value
}
</script>

<template>
  <div class="todo-container">
    <h2 class="section-title">待办事项</h2>
    
    <!-- 添加任务按钮 -->
    <button 
      v-if="!showAddForm"
      @click="toggleAddForm" 
      class="btn btn-primary add-todo-btn"
    >
      添加新任务
    </button>

    <!-- 添加待办表单 -->
    <div v-if="showAddForm" class="todo-form">
      <input
        v-model="newTodoTitle"
        type="text"
        placeholder="任务标题"
        class="todo-input"
      />
      <input
        v-model="newTodoDesc"
        type="text"
        placeholder="任务描述（可选）"
        class="todo-input"
      />
      <!-- 替换原来的日期选择器 -->
      <el-date-picker
        v-model="newStartDate"
        :placeholder="'开始日期'"
        class="todo-input date-picker"
        :class="['date-picker']"
        :style="datePickerConfig.style"
        :type="datePickerConfig.type"
        :value-format="datePickerConfig.valueFormat"
      />
      <el-date-picker
        v-model="newEndDate"
        :placeholder="'截止日期'"
        class="todo-input date-picker"
        :class="['date-picker']"
        :style="datePickerConfig.style"
        :type="datePickerConfig.type"
        :value-format="datePickerConfig.valueFormat"
        :min-date="newStartDate"
      />
      <input
        type="text"
        placeholder="优先级（可选）"
        class="todo-input"
      />
      <input
        type="text"
        placeholder="标签（可选）"
        class="todo-input"
      />
      <div class="form-buttons">
        <button 
          @click="handleAddTodo" 
          class="btn btn-primary"
          :disabled="isLoading"
        >
          {{ isLoading ? '添加中...' : '确认添加' }}
        </button>
        <button 
          @click="toggleAddForm" 
          class="btn btn-secondary"
        >
          取消
        </button>
      </div>
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
.add-todo-btn {
  margin-bottom: 20px;
}

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

/* 统一输入框和日期选择器样式 */
.todo-input,
:deep(.el-input__wrapper) {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  background-color: white;
  transition: all 0.2s ease;
  box-shadow: none !important;
}

/* 输入框和日期选择器焦点样式 */
.todo-input:focus,
:deep(.el-input__wrapper.is-focus) {
  border-color: #90caf9;
  box-shadow: 0 0 0 1px #90caf9 !important;
  outline: none;
}

/* 日期选择器内部输入框样式 */
:deep(.el-input__inner) {
  height: 40px;
  font-size: 16px;
  color: #333;
}

/* 移除之前的日期选择器样式 */
.date-picker {
  width: 100%;
  margin: 0;
  display: block;
}

/* 调整表单间距 */
.todo-form {
  display: flex;
  flex-direction: column;
  gap: 20px;  /* 增加默认间距 */
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

/* 为日期选择器添加特定样式 */
:deep(.el-date-editor.el-input) {
  margin-bottom: 10px; /* 添加底部间距 */
  width: 100%;
}

/* 移除最后一个日期选择器的底部间距 */
:deep(.el-date-editor.el-input:last-of-type) {
  margin-bottom: 0;
}

/* 统一hover效果 */
.todo-input:hover,
:deep(.el-input__wrapper:hover) {
  border-color: #90caf9;
}

/* 确保所有表单项之间的间距一致 */
.todo-form {
  display: flex;
  flex-direction: column;
  gap: 15px;  /* 默认间距设置为15px */
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

/* 移除日期选择器可能的默认边距 */
:deep(.el-date-editor.el-input) {
  margin: 0;
  width: 100%;
}

/* 调整日期选择器的间距 */
.todo-input.date-picker {
  margin-bottom: 500px;
}

/* 确保最后一个日期选择器不会有多余的边距 */
.todo-input.date-picker:last-of-type {
  margin-bottom: 0;
}

/* 确保日期选择弹出框样式统一 */
:deep(.el-picker__popper) {
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 加载状态 */
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

.btn-secondary {
  background: gray;
  color: white;
}

.form-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* 统一所有输入框的 placeholder 颜色 */
.todo-input::placeholder {
  color: #999;
}

:deep(.el-input__inner::placeholder) {
  color: #999 !important;
}

/* 确保日期选择器的 placeholder 颜色也一致 */
:deep(.el-input__placeholder) {
  color: #999 !important;
}

/* 防止日期选择器在获得焦点时改变 placeholder 颜色 */
:deep(.el-input.is-focus .el-input__placeholder) {
  color: #999 !important;
}
</style>