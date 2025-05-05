<template>
  <div class="home-container">
    <nav class="navbar">
      <div class="container">
        <div class="navbar-content">
          <h1 class="logo">欢迎回来</h1>
          <button @click="handleLogout" class="btn btn-primary">
            退出登录
          </button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div class="dashboard">
          <div class="placeholder">
            <p>这里是您的主页内容</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    router.push('/')
  } catch (error) {
    console.error('退出登录错误:', error.message)
  }
}
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

.dashboard {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.placeholder {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  color: #757575;
}
</style>