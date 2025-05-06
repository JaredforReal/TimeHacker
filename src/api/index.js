import { supabase } from '../supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL

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
    try {
      const headers = await this.getAuthHeader()
      console.log('Fetching todos with headers:', headers)

      const response = await fetch(`${API_BASE_URL}/todos`, { headers })
      if (!response.ok) {
        // Try to get error details if available
        const errorText = await response.text()
        console.error('Error response:', errorText)

        try {
          // Try to parse as JSON if possible
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `获取待办失败 (${response.status})`)
        } catch {
          // If parsing fails, use the text or status code
          throw new Error(`获取待办失败: ${errorText || response.status}`)
        }
      }

      const data = await response.json()
      console.log('Todos fetched successfully:', data)
      return data
    } catch (error) {
      console.error('Error in fetchTodos:', error)
      throw error
    }
  },

  // 创建待办
  async createTodo(title, description = null) {
    try {
      const headers = await this.getAuthHeader()
      const payload = { title, description }
      console.log('Creating todo with payload:', payload)

      const response = await fetch(`${API_BASE_URL}/todos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Create todo error response:', errorText, 'Status:', response.status)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `创建待办失败 (${response.status})`)
        } catch {
          throw new Error(`创建待办失败: ${errorText || response.status}`)
        }
      }

      const data = await response.json()
      console.log('Todo created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createTodo:', error)
      throw error
    }
  },

  // 更新待办
  async updateTodo(id, updates) {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '更新待办失败')
    }
    return await response.json()
  },

  // 删除待办
  async deleteTodo(id) {
    const headers = await this.getAuthHeader()
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
      headers
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '删除待办失败')
    }
    return true
  },

  // 检查服务健康状态
  async healthCheck() {
    try {
      const healthEndpoint = `${API_BASE_URL}/api/`
      console.log(`Checking API health at: ${healthEndpoint}`)

      const response = await fetch(healthEndpoint)
      if (!response.ok) {
        console.error(`API health check failed with status: ${response.status}`)
        return { status: "error", message: `API服务不可用 (${response.status})` }
      }

      const data = await response.json()
      console.log("API health check response:", data)
      return data
    } catch (error) {
      console.error("API connection error:", error)
      return { status: "error", message: `无法连接到API服务: ${error.message}` }
    }
  }
}