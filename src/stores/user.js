/**
 * 用户状态管理
 * 自建 JWT 认证，无 Supabase 依赖
 */
import { defineStore } from 'pinia'
import { apiClient } from '../api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: apiClient.getUser(),
    loading: false,
  }),

  getters: {
    isAuthenticated() {
      return !!this.user && !!apiClient.getAccessToken()
    }
  },

  actions: {
    /**
     * 用户注册
     */
    async register(email, password) {
      this.loading = true
      try {
        const result = await apiClient.register(email, password)
        console.log('注册成功:', result.email)
        return result
      } finally {
        this.loading = false
      }
    },

    /**
     * 用户登录
     */
    async login(email, password) {
      this.loading = true
      try {
        const result = await apiClient.login(email, password)
        // 从 JWT 解析用户信息或直接获取 profile
        const profile = await apiClient.fetchProfile()
        this.user = {
          email,
          id: profile.user_id,
          ...profile
        }
        apiClient.setUser(this.user)
        console.log('登录成功:', email)
        return result
      } finally {
        this.loading = false
      }
    },

    /**
     * 获取当前用户（从本地存储恢复）
     */
    async fetchUser() {
      this.loading = true
      try {
        const token = apiClient.getAccessToken()
        if (!token) {
          this.user = null
          return null
        }

        // 尝试获取用户资料来验证 token 有效性
        try {
          const profile = await apiClient.fetchProfile()
          this.user = {
            id: profile.user_id,
            ...profile
          }
          apiClient.setUser(this.user)
          console.log('用户已恢复:', this.user.email || this.user.name)
          return this.user
        } catch (error) {
          // Token 无效或已过期
          console.log('Token 无效，清除登录状态')
          apiClient.clearTokens()
          this.user = null
          return null
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * 设置用户（手动）
     */
    setUser(user) {
      this.user = user
      if (user) {
        apiClient.setUser(user)
      }
    },

    /**
     * 登出
     */
    async signOut() {
      await apiClient.logout()
      this.user = null
    },

    /**
     * 刷新认证令牌
     */
    async refreshSession() {
      try {
        const token = await apiClient.refreshAccessToken()
        if (token) {
          console.log('Token 刷新成功')
          return true
        }
        return false
      } catch (error) {
        console.error('刷新 Token 失败:', error)
        return false
      }
    },

    /**
     * 更新用户资料
     */
    async updateProfile(profileData) {
      try {
        const result = await apiClient.updateProfile(profileData)
        // 更新本地状态
        this.user = { ...this.user, ...result }
        apiClient.setUser(this.user)
        return result
      } catch (error) {
        console.error('更新资料失败:', error)
        throw error
      }
    },

    /**
     * 请求密码重置
     */
    async requestPasswordReset(email) {
      return await apiClient.forgotPassword(email)
    },

    /**
     * 确认密码重置
     */
    async confirmPasswordReset(token, newPassword) {
      return await apiClient.resetPassword(token, newPassword)
    }
  }
})