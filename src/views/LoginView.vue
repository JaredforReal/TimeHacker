<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>{{ isRegistering ? '注册' : '登录' }}</h1>
        <p>{{ isRegistering ? '只需几步即可完成注册' : '请输入您的登录信息' }}</p>
      </div>

      <!-- 登录/注册表单 -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- 邮箱输入框 -->
        <div class="form-group">
          <label for="email">邮箱</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="请输入邮箱"
          />
        </div>

        <!-- 密码输入框 -->
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

        <div v-if="!isRegistering" class="remember-forgot">
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

        <!-- 提交按钮 -->
        <button
          type="submit"
          :disabled="loading"
          class="submit-btn"
        >
          {{ loading ? '处理中...' : isRegistering ? '注册' : '登录' }}
        </button>

        <!-- 错误信息 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>

      <!-- 登录/注册切换 -->
      <div class="auth-footer">
        <span>{{ isRegistering ? '已有账号？' : '没有账号？' }}</span>
        <button
          @click="toggleMode"
          class="toggle-btn"
        >
          {{ isRegistering ? '登录' : '注册' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase'; // 确保正确导入 Supabase 客户端

const router = useRouter();

// 是否处于注册模式
const isRegistering = ref(false);

// 加载状态和错误信息
const loading = ref(false);
const error = ref('');

// 表单数据
const form = ref({
  email: '',
  password: '',
  rememberMe: false
});

// 切换登录/注册模式
const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  error.value = ''; // 切换模式时清空错误信息
};

// 提交表单逻辑
const handleSubmit = async () => {
  if (isRegistering.value) {
    await registerUser();
  } else {
    await loginUser();
  }
};

// 登录逻辑
const loginUser = async () => {
  try {
    loading.value = true;
    error.value = '';

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.value.email,
      password: form.value.password,
    });

    if (authError) throw authError;
    router.push('/home'); // 跳转到主页
  } catch (err) {
    error.value = err.message || '登录失败，请重试';
  } finally {
    loading.value = false;
  }
};

// 注册逻辑
const registerUser = async () => {
  try {
    loading.value = true;
    error.value = '';

    // 使用邮箱生成头像
    const avatarUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${form.value.email}&size=128&backgroundColor=transparent`;

    // 调用 Supabase 注册用户
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.value.email,
      password: form.value.password,
    });

    if (signUpError) throw signUpError;

    // 保存用户信息到 profiles 表
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        avatar: avatarUrl,
      });

    if (profileError) throw profileError;

    alert('注册成功！请检查您的邮箱以确认账户');
    toggleMode(); // 切换到登录模式
  } catch (err) {
    error.value = err.message || '注册失败，请重试';
  } finally {
    loading.value = false;
  }
};
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
  font-size: 13px;
}
.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
}
.remember-me input {
  width: 14px;
  height: 14px;
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