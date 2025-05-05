<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ isLogin ? '欢迎回来' : '创建账户' }}</h1>
        <p>{{ isLogin ? '请输入您的登录信息' : '只需几步即可完成注册' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="email">邮箱地址</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="your@email.com"
          />
        </div>

        <div class="form-group">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            required
            minlength="6"
            placeholder="至少6个字符"
          />
        </div>

        <div v-if="isLogin" class="remember-forgot">
          <div class="remember-me">
            <input
              id="remember-me"
              v-model="form.rememberMe"
              type="checkbox"
            />
            <label for="remember-me">记住我</label>
          </div>
          <a href="#" class="forgot-password">忘记密码?</a>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="submit-btn"
        >
          {{ loading ? '处理中...' : isLogin ? '登录' : '注册' }}
        </button>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <div class="auth-footer">
        <span>{{ isLogin ? '还没有账户?' : '已有账户?' }}</span>
        <button
          @click="isLogin = !isLogin"
          class="toggle-btn"
        >
          {{ isLogin ? '立即注册' : '立即登录' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const isLogin = ref(true)
const loading = ref(false)
const error = ref('')

const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''
    
    if (isLogin.value) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.value.email,
        password: form.value.password
      })
      
      if (authError) throw authError
      router.push('/home')
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.value.email,
        password: form.value.password,
      })
      
      if (signUpError) throw signUpError
      alert('注册成功！请检查您的邮箱以确认账户')
      isLogin.value = true
    }
  } catch (err) {
    error.value = err.message || (isLogin.value ? '登录失败' : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 基础样式 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 容器样式 */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f9ff;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 头部样式 */
.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.auth-header h1 {
  font-size: 24px;
  font-weight: 400;
  color: #1e88e5;
  margin-bottom: 8px;
}

.auth-header p {
  color: #616161;
  font-size: 14px;
}

/* 表单样式 */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #424242;
  font-weight: 500;
}

.form-group input {
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #90caf9;
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
}

/* 记住我 & 忘记密码 */
.remember-forgot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remember-me input {
  width: 16px;
  height: 16px;
}

.forgot-password {
  color: #1e88e5;
  font-size: 13px;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

/* 提交按钮 */
.submit-btn {
  padding: 12px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #1976d2;
}

.submit-btn:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

/* 错误信息 */
.error-message {
  padding: 12px;
  background-color: #ffebee;
  color: #d32f2f;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

/* 底部切换按钮 */
.auth-footer {
  margin-top: 24px;
  text-align: center;
  font-size: 14px;
  color: #616161;
}

.toggle-btn {
  background: none;
  border: none;
  color: #1e88e5;
  cursor: pointer;
  font-weight: 500;
  margin-left: 4px;
}

.toggle-btn:hover {
  text-decoration: underline;
}
</style>