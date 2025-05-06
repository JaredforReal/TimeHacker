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
    }
  }
})