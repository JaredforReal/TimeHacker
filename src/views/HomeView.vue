<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { apiClient } from '../api'
import { useUserStore } from '../stores/user'
import TodoList from '../components/TodoList.vue'
import PomodoroTimer from '../components/PomodoroTimer.vue'
import Calendar from '../components/Calendar.vue'

const router = useRouter()
const userStore = useUserStore()

// 状态管理
const isLoading = ref(false)
const error = ref(null)
const apiStatus = ref(null)
const todos = ref([])
const showMenu = ref(false)
const showCalendar = ref(false)

// 用户头像 URL
const avatarUrl = computed(() => {
  const username = userStore.user?.email ? userStore.user.email.split('@')[0] : ''
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${username}&size=128&backgroundColor=transparent`
})

// 初始化加载
onMounted(async () => {
  try {
    // 首先确保用户已登录
    if (!userStore.user) {
      await userStore.fetchUser()
    }

    // 检查API健康状态
    await checkApiHealth()

    // 如果已登录，加载待办事项
    if (userStore.isAuthenticated) {
      await loadTodos()
    }
  } catch (err) {
    error.value = `初始化失败: ${err.message}`
    // 如果是认证错误，尝试刷新会话
    if (err.message.includes('未登录') || err.message.includes('credentials')) {
      const refreshed = await userStore.refreshSession()
      if (refreshed) {
        // 刷新成功，重试加载
        await loadTodos()
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
  } finally {
    isLoading.value = false
  }
}

// 处理子组件的错误
const handleComponentError = (errorMsg) => {
  error.value = errorMsg
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

// 跳转到登录页
const handleLogin = () => {
  router.push('/login')
}

// 显示/隐藏菜单
const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

// 跳转到个人资料页
const goToProfile = () => {
  router.push('/profile')
  showMenu.value = false
}

// 添加点击外部关闭菜单的处理函数
const handleClickOutside = (event) => {
  const dropdown = document.querySelector('.user-info')
  if (dropdown && !dropdown.contains(event.target) && showMenu.value) {
    showMenu.value = false
  }
}

// 添加生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <nav class="navbar">
      <div class="container">
        <div class="navbar-content">
          <h1 class="logo">TimeHacker</h1>
          <!-- 日历按钮 -->
          <button @click="showCalendar = true" class="calendar-btn">
            <span class="calendar-icon">📅</span>
            日历
          </button>
          <!-- 用户信息/登录按钮 -->
          <div v-if="userStore.isAuthenticated" class="user-info">
            <div class="avatar-container" @click.stop="toggleMenu">
              <img :src="avatarUrl" alt="User Avatar" class="avatar">
              <span class="username">{{ userStore.user.name }}</span>
              <span class="dropdown-icon" :class="{ open: showMenu }">▼</span>
            </div>

            <Transition name="dropdown">
              <ul v-if="showMenu" class="dropdown">
              <li @click="goToProfile">个人资料</li>
              <li @click="handleLogout">退出登录</li>
            </ul>
            </Transition>
            
          </div>
          <button v-else @click="handleLogin" class="btn btn-primary">
            登录
          </button>
        </div>
      </div>
    </nav>

    <!-- 主内容区 -->
    <Calendar v-if="showCalendar" @close="showCalendar = false" />
    <main class="main-content">
      <div class="container">
        <!-- API状态显示 -->
        <!-- <div v-if="apiStatus" class="api-status">
          后端状态: {{ apiStatus.status }} - {{ apiStatus.message }}
        </div> -->

        <!-- 错误提示 -->
        <!-- <div v-if="error" class="error-message">
          {{ error }}
        </div> -->

        <!-- 如果未登录，显示提示 -->
        <div v-if="!userStore.isAuthenticated" class="login-prompt">
          <h2>欢迎使用 TimeHacker</h2>
          <p>请登录以使用待办事项和番茄钟功能</p>
          <button @click="handleLogin" class="btn btn-primary">立即登录</button>
        </div>

        <!-- 已登录时显示主要功能区 -->
        <div v-else class="dashboard">
          <div class="dashboard-grid">
            <TodoList :initialTodos="todos" @error="handleComponentError" class="dashboard-item" />
            <PomodoroTimer @error="handleComponentError" class="dashboard-item" />
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

.user-info {
  display: flex;
  align-items: center;
  position: relative;
}

.avatar-container {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.username {
  font-size: 14px;
  color: #333;
}

.dropdown-icon {
  margin-left: 5px;
  font-size: 12px;
  transition: transform 0.3s;
}

.dropdown-icon.open {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: #fff;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  list-style: none;
  padding: 10px 0;
  margin: 10px 0 0;
  width: 200px;
  z-index: 10;
}

.dropdown li {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
}

.dropdown li:hover {
  background-color: #f5f5f5;
}

.dashboard {
  margin-top: 20px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.dashboard-item {
  height: 100%;
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

.main-content {
  flex: 1;
  padding: 40px 0;
}

.container {
  width: 100%;
  max-width: 1200px;
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

.login-prompt {
  text-align: center;
  padding: 50px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-top: 30px;
}

.login-prompt h2 {
  margin-bottom: 15px;
  color: #333;
}

.login-prompt p {
  margin-bottom: 25px;
  color: #666;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>