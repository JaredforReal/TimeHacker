import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    loading: false,
  }),
  getters: {
    isAuthenticated() {
      return !!this.user
    }
  },
  actions: {
    async fetchUser() {
      this.loading = true
      try {
        const { data: { user } } = await supabase.auth.getUser()
        this.user = user
        console.log("Current user:", user?.email || "Not logged in")
        return user
      } catch (error) {
        console.error("Error fetching user:", error)
        return null
      } finally {
        this.loading = false
      }
    },
    setUser(user) {
      this.user = user
    },
    async signOut() {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      this.user = null
    },

    // 刷新认证令牌 - 在认证失败时尝试刷新
    async refreshSession() {
      try {
        const { data, error } = await supabase.auth.refreshSession()
        if (error) throw error
        this.user = data.user
        console.log("Session refreshed successfully")
        return true
      } catch (error) {
        console.error("Failed to refresh session:", error)
        return false
      }
    },
    
    // 更新用户资料
    // 这里的 profileData 应该包含用户的所有可更新信息
    async updateProfile(profileData) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          email: profileData.email,
          password: profileData.password || undefined,
        });
        if (error) throw error;

        // 更新其他用户信息（如头像、姓名等）
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            name: profileData.name,
            bio: profileData.bio,
            school: profileData.school,
            location: profileData.location,
            avatar: profileData.avatar,
          })
          .eq('id', this.user.id);
        if (updateError) throw updateError;

        // 更新本地状态
        this.user = { ...this.user, ...profileData };
      } catch (error) {
        console.error('Failed to update profile:', error);
        throw error;
      }
    },

    // 验证用户凭据
    async verifyCredentials(email, password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('Failed to verify credentials:', error);
        return false;
      }
    }
  }
})