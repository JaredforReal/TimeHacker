<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { supabase } from '../supabase.js';

const router = useRouter();
const userStore = useUserStore();

// 是否处于编辑模式
const isEditing = ref(false);
const isChangingEmailPassword = ref(false); // 是否处于更改邮箱和密码模式

// 表单数据
const profileForm = ref({
  name: '',
  bio: '',
  school: '',
  location: '',
  email: '',
  avatar: '',
});

// 更改邮箱和密码的表单数据
const emailPasswordForm = ref({
  currentEmail: '',
  currentPassword: '',
  newEmail: '',
  newPassword: '',
});

// 从后端加载用户数据
const loadProfile = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userStore.user.id)
      .single();

    if (error) throw error;

    profileForm.value = {
      name: data.name || '',
      bio: data.bio || '',
      school: data.school || '',
      location: data.location || '',
      email: userStore.user.email || '',
      avatar: data.avatar || 'https://via.placeholder.com/100',
    };
  } catch (err) {
    console.error('加载个人资料失败:', err);
    alert('加载个人资料失败，请重试');
  }
};

// 保存个人资料
const saveProfile = async () => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileForm.value.name,
        bio: profileForm.value.bio,
        school: profileForm.value.school,
        location: profileForm.value.location,
        avatar: profileForm.value.avatar,
      })
      .eq('id', userStore.user.id);

    if (error) throw error;

    isEditing.value = false; // 退出编辑模式
    alert('个人资料已保存');
  } catch (err) {
    console.error('保存个人资料失败:', err);
    alert('保存失败，请重试');
  }
};

// 取消编辑
const cancelEdit = () => {
  isEditing.value = false;
  loadProfile(); // 恢复原始数据
};

// 保存邮箱和密码
const saveEmailPassword = async () => {
  try {
    // 验证当前邮箱和密码
    const isValid = await userStore.verifyCredentials(
      emailPasswordForm.value.currentEmail,
      emailPasswordForm.value.currentPassword
    );
    if (!isValid) {
      alert('当前邮箱或密码错误');
      return;
    }

    // 更新邮箱和密码
    await userStore.updateProfile({
      email: emailPasswordForm.value.newEmail || profileForm.value.email,
      password: emailPasswordForm.value.newPassword || undefined,
    });

    isChangingEmailPassword.value = false; // 退出更改模式
    alert('邮箱和密码已更新');
  } catch (err) {
    console.error('更新邮箱和密码失败:', err);
    alert('更新失败，请重试');
  }
};

// 取消更改邮箱和密码
const cancelEmailPasswordChange = () => {
  isChangingEmailPassword.value = false;
  emailPasswordForm.value = {
    currentEmail: '',
    currentPassword: '',
    newEmail: '',
    newPassword: '',
  };
};

// 替换头像
const handleAvatarChange = async (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Avatar = e.target.result;

      // 上传头像到后端
      try {
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`public/${userStore.user.id}.png`, file, {
            upsert: true,
          });
        if (error) throw error;

        // 获取头像的公共 URL
        const { publicURL, error: urlError } = supabase.storage
          .from('avatars')
          .getPublicUrl(`public/${userStore.user.id}.png`);
        if (urlError) throw urlError;

        profileForm.value.avatar = publicURL; // 更新头像 URL
      } catch (err) {
        console.error('头像上传失败:', err);
        alert('头像上传失败，请重试');
      }
    };
    reader.readAsDataURL(file);
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
      alert('加载个人资料失败，请重新登录');
      router.push('/login'); // 跳转到登录页面
    }
  } catch (err) {
    console.error('初始化失败:', err.message || err);
    alert('初始化失败，请重试');
  }
});
</script>

<template>
  <div class="profile-container">
    <!-- 顶部导航 -->
    <header class="header">
      <h1>个人资料</h1>
    </header>

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
        <div v-if="!isEditing && !isChangingEmailPassword">
          <p><strong>姓名:</strong> {{ profileForm.name }}</p>
          <p><strong>简介:</strong> {{ profileForm.bio }}</p>
          <p><strong>学校:</strong> {{ profileForm.school }}</p>
          <p><strong>位置:</strong> {{ profileForm.location }}</p>
          <p><strong>邮箱:</strong> {{ profileForm.email }}</p>
          <button @click="isEditing = true" class="btn btn-primary">编辑</button>
          <button @click="isChangingEmailPassword = true" class="btn btn-secondary">更改邮箱和密码</button>
        </div>

        <!-- 编辑模式 -->
        <form v-else-if="isEditing" @submit.prevent="saveProfile">
          <div class="form-group">
            <label for="name">姓名</label>
            <input id="name" v-model="profileForm.name" type="text" required />
          </div>
          <div class="form-group">
            <label for="bio">简介</label>
            <textarea id="bio" v-model="profileForm.bio"></textarea>
          </div>
          <div class="form-group">
            <label for="school">学校</label>
            <input id="school" v-model="profileForm.school" type="text" />
          </div>
          <div class="form-group">
            <label for="location">位置</label>
            <input id="location" v-model="profileForm.location" type="text" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" @click="cancelEdit" class="btn btn-secondary">取消</button>
          </div>
        </form>

        <!-- 更改邮箱和密码模式 -->
        <form v-else @submit.prevent="saveEmailPassword">
          <div class="form-group">
            <label for="currentEmail">当前邮箱</label>
            <input id="currentEmail" v-model="emailPasswordForm.currentEmail" type="email" required />
          </div>
          <div class="form-group">
            <label for="currentPassword">当前密码</label>
            <input id="currentPassword" v-model="emailPasswordForm.currentPassword" type="password" required />
          </div>
          <div class="form-group">
            <label for="newEmail">新邮箱</label>
            <input id="newEmail" v-model="emailPasswordForm.newEmail" type="email" />
          </div>
          <div class="form-group">
            <label for="newPassword">新密码</label>
            <input id="newPassword" v-model="emailPasswordForm.newPassword" type="password" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存</button>
            <button type="button" @click="cancelEmailPasswordChange" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 返回按钮 -->
    <footer class="footer">
      <button @click="goBack" class="btn btn-secondary">返回</button>
    </footer>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 20px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.avatar-upload {
  display: inline-block;
  cursor: pointer;
  color: #1e88e5;
}

.avatar-upload input {
  display: none;
}

.form-section {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

textarea {
  resize: none;
}

.form-actions {
  display: flex;
  justify-content: space-between;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #1e88e5;
  color: white;
}

.btn-primary:hover {
  background-color: #1976d2;
}

.btn-secondary {
  background-color: #ccc;
  color: #333;
}

.btn-secondary:hover {
  background-color: #bbb;
}

.footer {
  text-align: center;
}
</style>