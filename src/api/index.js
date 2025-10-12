import { supabase } from '../supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL

export const apiClient = {
  // 获取当前用户JWT
  async getAuthHeader() {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('未登录')
      }

      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    } catch (error) {
      console.error('Error getting auth header:', error)
      throw new Error('获取认证信息失败')
    }
  },

  async refreshAuthSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      if (error) {
        console.error('Failed to refresh session:', error)
        return null
      }
      return data?.session ?? null
    } catch (error) {
      console.error('Failed to refresh session:', error)
      return null
    }
  },

  async parseErrorResponse(response, fallbackMessage) {
    const defaultMessage = fallbackMessage || `请求失败 (${response.status})`
    const errorText = await response.text()

    if (errorText) {
      try {
        const errorData = JSON.parse(errorText)
        throw new Error(errorData.detail || defaultMessage)
      } catch (parseError) {
        throw new Error(`${defaultMessage}: ${errorText}`)
      }
    }

    throw new Error(defaultMessage)
  },

  async request(path, options = {}, fallbackMessage) {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      isFormData = false
    } = options

    let requestHeaders = { ...headers }
    let requestBody = body

    if (requiresAuth) {
      const authHeaders = await this.getAuthHeader()
      requestHeaders = { ...authHeaders, ...requestHeaders }
    }

    if (requestBody && !isFormData && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    if (isFormData) {
      delete requestHeaders['Content-Type']
    }

    const urlBase = API_BASE_URL || ''
    const url = `${urlBase}${path}`

    let response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody
    })

    if (requiresAuth && [401, 403].includes(response.status)) {
      const session = await this.refreshAuthSession()
      if (session?.access_token) {
        requestHeaders['Authorization'] = `Bearer ${session.access_token}`
        response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: requestBody
        })
      }
    }

    if (!response.ok) {
      await this.parseErrorResponse(response, fallbackMessage)
    }

    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('Content-Type') || ''
    if (contentType.includes('application/json')) {
      return await response.json()
    }

    return await response.text()
  },

  // 获取所有待办
  async fetchTodos() {
    try {
      return await this.request('/todos', {}, '获取待办失败')
    } catch (error) {
      console.error('Error in fetchTodos:', error)
      throw error
    }
  },

  // 创建待办
  async createTodo(title, description = null) {
    try {
      const payload = { title, description }
      return await this.request(
        '/todos',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        },
        '创建待办失败'
      )
    } catch (error) {
      console.error('Error in createTodo:', error)
      throw error
    }
  },

  // 更新待办
  async updateTodo(id, updates) {
    try {
      return await this.request(
        `/todos/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updates)
        },
        '更新待办失败'
      )
    } catch (error) {
      console.error('Error in updateTodo:', error)
      throw error
    }
  },

  // 删除待办
  async deleteTodo(id) {
    try {
      await this.request(
        `/todos/${id}`,
        {
          method: 'DELETE'
        },
        '删除待办失败'
      )
      return true
    } catch (error) {
      console.error('Error in deleteTodo:', error)
      throw error
    }
  },

  // 保存番茄钟会话
  async savePomodoro(session) {
    try {
      return await this.request(
        '/pomodoro/sessions',
        {
          method: 'POST',
          body: JSON.stringify(session)
        },
        '保存番茄钟失败'
      )
    } catch (error) {
      console.error('Error in savePomodoro:', error)
      throw error
    }
  },

  // 获取番茄钟历史记录
  async getPomodoroHistory() {
    try {
      return await this.request('/pomodoro/sessions', {}, '获取番茄钟历史失败')
    } catch (error) {
      console.error('Error in getPomodoroHistory:', error)
      throw error
    }
  },

  // 获取番茄钟设置
  async getPomodoroSettings() {
    try {
      return await this.request('/pomodoro/settings', {}, '获取番茄钟设置失败')
    } catch (error) {
      console.error('Error in getPomodoroSettings:', error)
      throw error
    }
  },

  // 保存番茄钟设置
  async savePomodoroSettings(settings) {
    try {
      return await this.request(
        '/pomodoro/settings',
        {
          method: 'PUT',
          body: JSON.stringify(settings)
        },
        '保存番茄钟设置失败'
      )
    } catch (error) {
      console.error('Error in savePomodoroSettings:', error)
      throw error
    }
  },

  // 获取个人资料
  async fetchProfile() {
    try {
      return await this.request('/profile', {}, '获取个人资料失败')
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      throw error
    }
  },

  // 更新个人资料
  async updateProfile(profileData) {
    try {
      return await this.request(
        '/profile',
        {
          method: 'PUT',
          body: JSON.stringify(profileData)
        },
        '更新个人资料失败'
      )
    } catch (error) {
      console.error('Error in updateProfile:', error)
      throw error
    }
  },

  // 上传头像
  async uploadAvatar(file) {
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      return await this.request(
        '/profile/avatar',
        {
          method: 'POST',
          body: formData,
          isFormData: true
        },
        '上传头像失败'
      )
    } catch (error) {
      console.error('Error in uploadAvatar:', error)
      throw error
    }
  },

  // 密码重置请求
  async requestPasswordReset(email) {
    try {
      return await this.request(
        '/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ email }),
          requiresAuth: false,
          headers: {
            'Content-Type': 'application/json'
          }
        },
        '密码重置请求失败'
      )
    } catch (error) {
      console.error('Error in requestPasswordReset:', error)
      throw error
    }
  },

  // 检查服务健康状态
  async healthCheck() {
    const baseUrl = API_BASE_URL || ''
    const urls = [`${baseUrl}/api/`, `${baseUrl}/`]

    for (const url of urls) {
      try {
        const response = await fetch(url)
        if (response.ok) {
          const contentType = response.headers.get('Content-Type') || ''
          if (contentType.includes('application/json')) {
            return await response.json()
          }
          const message = await response.text()
          return {
            status: 'ok',
            message: message || '服务可用'
          }
        }
      } catch (error) {
        console.error('API connection error:', error)
      }
    }

    return {
      status: 'error',
      message: '无法连接到API服务'
    }
  }
}