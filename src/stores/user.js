import { defineStore } from 'pinia'
import { supabase } from '../supabase'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
  }),
  actions: {
    async fetchUser() {
      const { data: { user } } = await supabase.auth.getUser()
      this.user = user
    },
    setUser(user) {
      this.user = user
    }
  }
})