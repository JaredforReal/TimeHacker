import { supabase } from '../supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-railway-app.up.railway.app'

export const apiClient = {
  // 获取当前用户JWT
  async getAuthHeader() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('未登录')
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  },

  // 获取所有待办
  async fetchTodos() {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/todos`, { headers })
    if (!response.ok) throw new Error('获取待办失败')
    return await response.json()
  },

  // 创建待办
  async createTodo(title, description = null) {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, description })
    })
    if (!response.ok) throw new Error('创建待办失败')
    return await response.json()
  },

  // 更新待办
  async updateTodo(id, updates) {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('更新待办失败')
    return await response.json()
  },

  // 删除待办
  async deleteTodo(id) {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
      headers
    })
    if (!response.ok) throw new Error('删除待办失败')
    return true
  },

  // 检查服务健康状态
  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/`)
    return await response.json()
  }
}