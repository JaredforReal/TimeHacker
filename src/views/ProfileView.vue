<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { supabase } from '../supabase.js';
import { apiClient } from '../api/index.js';

const router = useRouter();
const userStore = useUserStore();

// 状态变量
const isEditing = ref(false);
const isResetPasswordMode = ref(false);
const resetPasswordEmail = ref('');
const resetPasswordSent = ref(false);
const isLoading = ref(false);
const error = ref(null);
const successMessage = ref(null);

// 表单数据
const profileForm = ref({
  name: '',
  school: '',
  avatar: '',
});

// 从后端加载用户数据
const loadProfile = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const { data, error: fetchError } = await apiClient.fetchProfile();

    if (fetchError) throw fetchError;

    profileForm.value = {
      name: data.name || '',
      school: data.school || '',
      avatar: data.avatar
    };
  } catch (err) {
    console.error('加载个人资料失败:', err);
    error.value = '加载个人资料失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

// 保存个人资料
const saveProfile = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    const { data, error: updateError } = await apiClient.updateProfile({
      name: profileForm.value.name,
      school: profileForm.value.school,
    });

    if (updateError) throw updateError;

    isEditing.value = false; // 退出编辑模式
    successMessage.value = '个人资料已保存';
    setTimeout(() => {
      successMessage.value = null;
    }, 3000);
  } catch (err) {
    console.error('保存个人资料失败:', err);
    error.value = '保存失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  loadProfile(); // 恢复原始数据
};

// 发起密码重置
const initiatePasswordReset = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // 使用当前用户邮箱或输入的邮箱
    const email = resetPasswordEmail.value || userStore.user.email;
    
    if (!email) {
      error.value = '请输入有效的邮箱地址';
      return;
    }
    
    await apiClient.requestPasswordReset(email);
    
    resetPasswordSent.value = true;
    successMessage.value = '密码重置链接已发送到您的邮箱';
    setTimeout(() => {
      successMessage.value = null;
    }, 5000);
  } catch (err) {
    console.error('发送密码重置邮件失败:', err);
    error.value = '发送密码重置邮件失败，请重试';
  } finally {
    isLoading.value = false;
  }
};

// 取消密码重置
const cancelPasswordReset = () => {
  isResetPasswordMode.value = false;
  resetPasswordEmail.value = '';
  resetPasswordSent.value = false;
};

// 替换头像
const handleAvatarChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    // 上传头像到后端
    try {
      isLoading.value = true;
      error.value = null;

      const result = await apiClient.uploadAvatar(file);

      profileForm.value.avatar = result.publicUrl; // 更新头像 URL
      successMessage.value = '头像已更新';
      setTimeout(() => {
        successMessage.value = null;
      }, 3000);
    } catch (err) {
      console.error('头像上传失败:', err);
      error.value = '头像上传失败，请重试';
    } finally {
      isLoading.value = false;
    }
  }
};

// 返回主页
const goBack = () => {
  router.push('/');
};

// 加载用户数据
onMounted(async () => {
  try {
    if (!userStore.isAuthenticated) {
      await userStore.fetchUser(); // 刷新用户状态
    }

    if (userStore.user?.id) {
      await loadProfile(); // 加载个人资料
    } else {
      console.error('用户未登录或用户 ID 不存在');
      error.value = '加载个人资料失败，请重新登录';
      setTimeout(() => {
        router.push('/login'); // 跳转到登录页面
      }, 2000);
    }
  } catch (err) {
    console.error('初始化失败:', err.message || err);
    error.value = '初始化失败，请重试';
  }
});
</script>

<template>
  <div class="profile-container">
    <!-- 顶部导航 -->
    <header class="header">
      <h1 class="section-title">个人资料</h1>
    </header>

    <!-- 消息通知 -->
    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    <div v-if="successMessage" class="message success-message">
      {{ successMessage }}
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 个人资料展示/编辑 -->
    <div class="profile-content">
      <div class="avatar-section">
        <img 
          :src="profileForm.avatar" 
          alt="Avatar" 
          class="avatar" 
          @error="profileForm.avatar = 'https://via.placeholder.com/100'" 
        />
        <label v-if="isEditing" class="avatar-upload">
          更换头像
          <input type="file" @change="handleAvatarChange" />
        </label>
      </div>

      <div class="form-section">
        <!-- 个人资料显示模式 -->
        <div v-if="!isEditing && !isResetPasswordMode" class="profile-info">
          <p><strong>姓名:</strong> {{ profileForm.name }}</p>
          <p><strong>学校:</strong> {{ profileForm.school }}</p>
          <div class="form-actions">
            <button @click="isEditing = true" class="btn btn-primary">编辑资料</button>
            <button @click="isResetPasswordMode = true" class="btn btn-secondary">修改密码</button>
          </div>
        </div>

        <!-- 编辑模式 -->
        <form v-else-if="isEditing" @submit.prevent="saveProfile" class="profile-form">
          <div class="form-group">
            <label for="name">姓名</label>
            <input id="name" v-model="profileForm.name" type="text" required />
          </div>
          <div class="form-group">
            <label for="school">学校</label>
            <input id="school" v-model="profileForm.school" type="text" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? '保存中...' : '保存' }}
            </button>
            <button type="button" @click="cancelEdit" class="btn btn-secondary" :disabled="isLoading">取消</button>
          </div>
        </form>

        <!-- 修改密码模式 -->
        <div v-else-if="isResetPasswordMode" class="password-reset-form">
          <div v-if="!resetPasswordSent">
            <p class="reset-info">
              我们将向您的邮箱发送密码重置链接。通过链接，您可以安全地重设密码。
            </p>
            <div class="form-group">
              <label for="resetEmail">确认您的邮箱</label>
              <input 
                id="resetEmail" 
                v-model="resetPasswordEmail" 
                type="email" 
                :placeholder="userStore.user?.email || '请输入邮箱'" 
              />
            </div>
            <div class="form-actions">
              <button @click="initiatePasswordReset" class="btn btn-primary" :disabled="isLoading">
                {{ isLoading ? '发送中...' : '发送重置链接' }}
              </button>
              <button @click="cancelPasswordReset" class="btn btn-secondary" :disabled="isLoading">取消</button>
            </div>
          </div>
          <div v-else class="reset-sent">
            <div class="reset-success">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>
              <p>密码重置链接已发送!</p>
            </div>
            <p>请检查您的邮箱，按照邮件中的指引完成密码重置。</p>
            <div class="reset-help">
              <p><strong>注意事项:</strong></p>
              <ul>
                <li>邮件可能需要几分钟才能送达</li>
                <li>点击邮件中的链接将会打开密码重置页面</li>
                <li>如果看不到邮件，请检查垃圾邮件文件夹</li>
                <li>密码重置链接有效期为24小时</li>
              </ul>
            </div>
            <button @click="cancelPasswordReset" class="btn btn-primary">返回个人资料</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 返回按钮 -->
    <footer class="footer">
      <button @click="goBack" class="btn btn-secondary">返回主页</button>
    </footer>
  </div>
</template>

<style scoped>
.profile-container {
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

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-upload {
  display: inline-block;
  cursor: pointer;
  color: #1e88e5;
  font-size: 14px;
  padding: 5px 10px;
  background-color: #e3f2fd;
  border-radius: 4px;
  transition: all 0.2s;
}

.avatar-upload:hover {
  background-color: #bbdefb;
}

.avatar-upload input {
  display: none;
}

.form-section {
  margin-bottom: 20px;
}

.profile-info p {
  padding: 12px;
  border-bottom: 1px solid #f1f3f5;
  margin: 0;
  font-size: 16px;
}

.profile-info p:last-of-type {
  margin-bottom: 20px;
}

.profile-form, .password-reset-form {
  background: #f5f7f9;
  border-radius: 8px;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  font-size: 14px;
}

input,
textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #90caf9;
  box-shadow: 0 0 0 2px rgba(144, 202, 249, 0.3);
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
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

.btn-secondary:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
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

.success-message {
  background-color: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #66bb6a;
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

.reset-info {
  margin-bottom: 20px;
  color: #555;
  line-height: 1.5;
}

.reset-sent {
  text-align: center;
  padding: 20px 0;
}

.reset-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.reset-success svg {
  color: #4caf50;
  margin-bottom: 16px;
}

.reset-success p {
  font-size: 18px;
  font-weight: 500;
  color: #2e7d32;
  margin: 0;
}

.reset-help {
  margin: 20px 0;
  padding: 15px;
  background-color: #e3f2fd;
  border-left: 4px solid #1e88e5;
  border-radius: 4px;
  text-align: left;
}

.reset-help p {
  margin-top: 0;
  margin-bottom: 10px;
  color: #0d47a1;
}

.reset-help ul {
  margin: 0;
  padding-left: 20px;
}

.reset-help li {
  margin-bottom: 8px;
  color: #0d47a1;
  font-size: 14px;
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