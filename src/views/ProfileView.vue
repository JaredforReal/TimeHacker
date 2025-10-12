<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { apiClient } from '../api'

const router = useRouter()
const userStore = useUserStore()

const isEditing = ref(false)
const isResetPasswordMode = ref(false)
const resetPasswordEmail = ref('')
const resetPasswordSent = ref(false)
const isLoading = ref(false)
const error = ref(null)
const successMessage = ref(null)

const profileForm = ref({
  name: '',
  school: '',
  avatar: ''
})

const defaultAvatarUrl = computed(() => {
  const email = userStore.user?.email || 'guest'
  const seed = email.split('@')[0] || 'guest'
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&size=128&backgroundColor=transparent`
})

const loadProfile = async () => {
  try {
    isLoading.value = true
    error.value = null
    const data = await apiClient.fetchProfile()
    profileForm.value = {
      name: data?.name || '',
      school: data?.school || '',
      avatar: data?.avatar || null
    }
    resetPasswordEmail.value = userStore.user?.email || ''
  } catch (err) {
    error.value = err.message || '加载个人资料失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const saveProfile = async () => {
  try {
    isLoading.value = true
    error.value = null
    await apiClient.updateProfile({
      name: profileForm.value.name,
      school: profileForm.value.school
    })
    isEditing.value = false
    successMessage.value = '个人资料已保存'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err.message || '保存失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const cancelEdit = () => {
  isEditing.value = false
  loadProfile()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    isLoading.value = true
    error.value = null
    const result = await apiClient.uploadAvatar(file)
    profileForm.value.avatar = result?.url || result?.publicUrl || profileForm.value.avatar
    successMessage.value = '头像已更新'
    setTimeout(() => {
      successMessage.value = null
    }, 3000)
  } catch (err) {
    error.value = err.message || '头像上传失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const initiatePasswordReset = async () => {
  try {
    isLoading.value = true
    error.value = null
    const email = resetPasswordEmail.value || userStore.user?.email
    if (!email) {
      error.value = '请输入有效的邮箱地址'
      return
    }
    await apiClient.requestPasswordReset(email)
    resetPasswordSent.value = true
    successMessage.value = '密码重置链接已发送到您的邮箱'
    setTimeout(() => {
      successMessage.value = null
    }, 5000)
  } catch (err) {
    error.value = err.message || '发送密码重置邮件失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const cancelPasswordReset = () => {
  isResetPasswordMode.value = false
  resetPasswordEmail.value = userStore.user?.email || ''
  resetPasswordSent.value = false
}

const goBack = () => {
  router.push('/home')
}

onMounted(async () => {
  try {
    if (!userStore.isAuthenticated) {
      await userStore.fetchUser()
    }

    if (!userStore.user?.id) {
      error.value = '请登录后再查看个人资料'
      setTimeout(() => router.push('/login'), 1500)
      return
    }

    await loadProfile()
  } catch (err) {
    error.value = err.message || '初始化失败，请重试'
  }
})
</script>

<template>
  <div class="profile-container">
    <header class="header">
      <h1 class="section-title">个人资料</h1>
    </header>

    <div v-if="error" class="message error-message">
      {{ error }}
    </div>
    <div v-if="successMessage" class="message success-message">
      {{ successMessage }}
    </div>

    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <div class="profile-content">
      <div class="avatar-section">
        <img
          :src="profileForm.avatar || defaultAvatarUrl"
          alt="Avatar"
          class="avatar"
          @error="(e) => { e.target.src = defaultAvatarUrl }"
        />
        <label v-if="isEditing" class="avatar-upload">
          更换头像
          <input type="file" accept="image/*" @change="handleAvatarChange" />
        </label>
      </div>

      <div class="form-section">
        <div v-if="!isEditing && !isResetPasswordMode" class="profile-info">
          <p><strong>姓名:</strong> {{ profileForm.name || '未填写' }}</p>
          <p><strong>学校:</strong> {{ profileForm.school || '未填写' }}</p>
          <p><strong>邮箱:</strong> {{ userStore.user?.email }}</p>
          <div class="form-actions">
            <button @click="isEditing = true" class="btn btn-primary">编辑资料</button>
            <button @click="isResetPasswordMode = true" class="btn btn-secondary">修改密码</button>
          </div>
        </div>

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
            <button type="button" class="btn btn-secondary" :disabled="isLoading" @click="cancelEdit">
              取消
            </button>
          </div>
        </form>

        <div v-else class="password-reset-form">
          <template v-if="!resetPasswordSent">
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
              <button class="btn btn-primary" :disabled="isLoading" @click="initiatePasswordReset">
                {{ isLoading ? '发送中...' : '发送重置邮件' }}
              </button>
              <button type="button" class="btn btn-secondary" :disabled="isLoading" @click="cancelPasswordReset">
                取消
              </button>
            </div>
          </template>
          <div v-else class="reset-success">
            <p>密码重置链接已发送，请检查您的邮箱。</p>
            <button type="button" class="btn btn-secondary" @click="cancelPasswordReset">
              返回
            </button>
          </div>
        </div>
      </div>
    </div>

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
  margin-bottom: 30px;
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

.profile-content {
  position: relative;
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

.profile-form,
.password-reset-form {
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

.reset-success {
  text-align: center;
  padding: 20px 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>