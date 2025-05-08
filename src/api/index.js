import { supabase } from '../supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL

export const apiClient = {
  // 获取当前用户JWT
  async getAuthHeader() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log("Current session:", session) // 调试当前会话信息

      if (!session) {
        console.error("No active session found")
        throw new Error('未登录')
      }

      console.log("Using access token:", session.access_token?.substring(0, 15) + "...") // 仅打印部分token以保护安全

      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.error("Error getting auth header:", error)
      throw new Error('获取认证信息失败')
    }
  },

  // 获取所有待办
  async fetchTodos() {
    try {
      const headers = await this.getAuthHeader()
      console.log('Fetching todos with headers:', headers)

      const response = await fetch(`${API_BASE_URL}/todos`, {
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Error response:', errorText)
        console.error('Response status:', response.status)
        console.error('Response headers:', Object.fromEntries([...response.headers]))

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `获取待办失败 (${response.status})`)
        } catch {
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
    try {
      const headers = await this.getAuthHeader()

      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update todo error response:', errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `更新待办失败 (${response.status})`)
        } catch {
          throw new Error(`更新待办失败: ${errorText || response.status}`)
        }
      }

      return await response.json()
    } catch (error) {
      console.error('Error in updateTodo:', error)
      throw error
    }
  },

  // 删除待办
  async deleteTodo(id) {
    try {
      const headers = await this.getAuthHeader()

      const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete todo error response:', errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `删除待办失败 (${response.status})`)
        } catch {
          throw new Error(`删除待办失败: ${errorText || response.status}`)
        }
      }

      return true
    } catch (error) {
      console.error('Error in deleteTodo:', error)
      throw error
    }
  },

  // 保存番茄钟会话
  async savePomodoro(session) {
    try {
      const headers = await this.getAuthHeader()

      const response = await fetch(`${API_BASE_URL}/pomodoro/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(session)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Save pomodoro error response:', errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `保存番茄钟失败 (${response.status})`)
        } catch {
          throw new Error(`保存番茄钟失败: ${errorText || response.status}`)
        }
      }

      return await response.json()
    } catch (error) {
      console.error('Error in savePomodoro:', error)
      throw error
    }
  },

  // 获取番茄钟历史记录
  async getPomodoroHistory() {
    try {
      const headers = await this.getAuthHeader()

      const response = await fetch(`${API_BASE_URL}/pomodoro/sessions`, {
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Get pomodoro history error:', errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `获取番茄钟历史失败 (${response.status})`)
        } catch {
          throw new Error(`获取番茄钟历史失败: ${errorText || response.status}`)
        }
      }

      return await response.json()
    } catch (error) {
      console.error('Error in getPomodoroHistory:', error)
      throw error
    }
  },

  // 获取番茄钟设置
  async getPomodoroSettings() {
    try {
      const headers = await this.getAuthHeader()

      const response = await fetch(`${API_BASE_URL}/pomodoro/settings`, {
        headers
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Get pomodoro settings error:', errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `获取番茄钟设置失败 (${response.status})`)
        } catch {
          throw new Error(`获取番茄钟设置失败: ${errorText || response.status}`)
        }
      }

      return await response.json()
    } catch (error) {
      console.error('Error in getPomodoroSettings:', error)
      throw error
    }
  },

  // 保存番茄钟设置
  async savePomodoroSettings(settings) {
    try {
      const headers = await this.getAuthHeader()

      const response = await fetch(`${API_BASE_URL}/pomodoro/settings`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Save pomodoro settings error:', errorText)

        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || `保存番茄钟设置失败 (${response.status})`)
        } catch {
          throw new Error(`保存番茄钟设置失败: ${errorText || response.status}`)
        }
      }

      return await response.json()
    } catch (error) {
      console.error('Error in savePomodoroSettings:', error)
      throw error
    }
  },

  // 检查服务健康状态
  async healthCheck() {
    try {
      // Try the main API health check
      console.log(`Checking API health at: ${API_BASE_URL}/api/`)

      const response = await fetch(`${API_BASE_URL}/api/`)
      if (!response.ok) {
        console.error(`API health check failed with status: ${response.status}`)

        // Try the root health check
        console.log(`Trying root health check at: ${API_BASE_URL}/`)
        const rootResponse = await fetch(`${API_BASE_URL}/`)
        if (!rootResponse.ok) {
          return {
            status: "error",
            message: `API服务不可用 (${response.status})`
          }
        }

        const rootData = await rootResponse.json()
        return rootData
      }

      const data = await response.json()
      console.log("API health check response:", data)
      return data
    } catch (error) {
      console.error("API connection error:", error)

      // Try root endpoint as fallback
      try {
        const rootResponse = await fetch(`${API_BASE_URL}/`)
        if (rootResponse.ok) {
          const rootData = await rootResponse.json()
          return rootData
        }
      } catch (e) {
        console.error("Root API check also failed:", e)
      }

      return {
        status: "error",
        message: `无法连接到API服务: ${error.message}`
      }
    }
  }
}