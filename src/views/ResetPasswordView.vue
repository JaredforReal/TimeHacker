<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase.js';

const route = useRoute();
const router = useRouter();

// 状态变量
const isLoading = ref(false);
const error = ref(null);
const success = ref(false);
const newPassword = ref('');
const confirmPassword = ref('');
const passwordsMatch = ref(true);

// 处理密码重置
const handleResetPassword = async () => {
  // 验证密码
  if (newPassword.value !== confirmPassword.value) {
    passwordsMatch.value = false;
    return;
  }
  
  if (newPassword.value.length < 8) {
    error.value = '密码长度必须至少为8个字符';
    return;
  }
  
  passwordsMatch.value = true;
  
  try {
    isLoading.value = true;
    error.value = null;

    // 使用Supabase提供的方法更新密码
    const { error: resetError } = await supabase.auth.updateUser({
      password: newPassword.value
    });

    if (resetError) throw resetError;
    
    success.value = true;
    
    // 清空密码字段
    newPassword.value = '';
    confirmPassword.value = '';

    // 3秒后重定向到登录页
    setTimeout(() => {
      router.push('/login');
    }, 3000);
    
  } catch (err) {
    console.error('密码重置失败:', err);
    error.value = `密码重置失败: ${err.message || '请重试'}`;
  } finally {
    isLoading.value = false;
  }
};

// 检查URL中的token和密码重置会话
onMounted(async () => {
  // 检查URL中是否包含hash部分（Supabase 会在重定向时添加）
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const type = hashParams.get('type');

  if (type === 'recovery' && accessToken) {
    try {
      isLoading.value = true;
      
      // 设置会话
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (sessionError) throw sessionError;
      
    } catch (err) {
      console.error('设置恢复会话失败:', err);
      error.value = '链接无效或已过期，请重新请求密码重置';
    } finally {
      isLoading.value = false;
    }
  } else {
    error.value = '无效的密码重置链接';
  }
});
</script>

<template>
  <div class="reset-password-container">
    <header class="header">
      <h1 class="section-title">重设密码</h1>
    </header>
    
    <!-- 错误提示 -->
    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>处理中...</span>
    </div>
    
    <!-- 成功消息 -->
    <div v-if="success" class="success-container">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m9 12 2 2 4-4"></path>
        </svg>
      </div>
      <h2>密码已成功重置!</h2>
      <p>您的密码已经更新。现在可以使用新密码登录您的账户。</p>
      <p>正在跳转到登录页面...</p>
    </div>
    
    <!-- 重置密码表单 -->
    <form v-if="!success" @submit.prevent="handleResetPassword" class="reset-form">
      <div class="form-group">
        <label for="newPassword">新密码</label>
        <input 
          id="newPassword" 
          v-model="newPassword" 
          type="password" 
          required 
          placeholder="请输入新密码"
          minlength="8"
        />
        <small class="form-hint">密码长度至少为8个字符</small>
      </div>
      
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <input 
          id="confirmPassword" 
          v-model="confirmPassword" 
          type="password" 
          required 
          placeholder="请再次输入新密码"
          :class="{ 'input-error': !passwordsMatch }"
        />
        <p v-if="!passwordsMatch" class="error-text">两次输入的密码不一致</p>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isLoading || !newPassword || !confirmPassword">
          {{ isLoading ? '处理中...' : '重设密码' }}
        </button>
      </div>
    </form>
    
    <footer class="footer">
      <button @click="router.push('/login')" class="btn btn-secondary">返回登录</button>
    </footer>
  </div>
</template>

<style scoped>
.reset-password-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
}

.header {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

.reset-form {
  background: #f5f7f9;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  font-size: 14px;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
}

input:focus {
  outline: none;
  border-color: #90caf9;
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
}

.input-error {
  border-color: #ef5350;
}

.input-error:focus {
  box-shadow: 0 0 0 2px rgba(239, 83, 80, 0.3);
}

.form-hint {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #757575;
}

.error-text {
  color: #c62828;
  font-size: 12px;
  margin-top: 5px;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1e88e5;
  color: white;
  width: 100%;
  padding: 12px;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-primary:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #757575;
  color: white;
}

.btn-secondary:hover {
  background-color: #616161;
}

.footer {
  text-align: center;
  margin-top: 30px;
}

.message {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  animation: fadeIn 0.3s;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #ef5350;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1e88e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.success-container {
  text-align: center;
  padding: 40px 20px;
  background: #f5f7f9;
  border-radius: 8px;
  margin-bottom: 20px;
}

.success-icon {
  margin-bottom: 20px;
  color: #4caf50;
}

.success-container h2 {
  margin-bottom: 15px;
  color: #2e7d32;
  font-size: 20px;
}

.success-container p {
  color: #555;
  margin-bottom: 10px;
  line-height: 1.5;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>