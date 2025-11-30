/**
 * TimeHacker API 客户端
 * 自建 JWT 认证，无 Supabase 依赖
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// Token 存储 key
const ACCESS_TOKEN_KEY = 'th_access_token'
const REFRESH_TOKEN_KEY = 'th_refresh_token'
const USER_KEY = 'th_user'

export const apiClient = {
  // ============ Token 管理 ============

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  },

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },

  getUser() {
    const user = localStorage.getItem(USER_KEY)
    return user ? JSON.parse(user) : null
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },

  // ============ 认证相关 ============

  /**
   * 用户注册
   */
  async register(email, password) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await this.parseError(response, '注册失败')
      throw new Error(error)
    }

    return await response.json()
  },

  /**
   * 用户登录
   */
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await this.parseError(response, '登录失败')
      throw new Error(error)
    }

    const data = await response.json()
    this.setTokens(data.access_token, data.refresh_token)
    return data
  },

  /**
   * 刷新 Access Token
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken()
    if (!refreshToken) {
      return null
    }

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      })

      if (!response.ok) {
        this.clearTokens()
        return null
      }

      const data = await response.json()
      this.setTokens(data.access_token, null)  // 只更新 access token
      return data.access_token
    } catch (error) {
      console.error('Token 刷新失败:', error)
      this.clearTokens()
      return null
    }
  },

  /**
   * 登出
   */
  async logout() {
    const refreshToken = this.getRefreshToken()
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        })
      } catch (error) {
        console.error('登出请求失败:', error)
      }
    }
    this.clearTokens()
  },

  /**
   * 请求密码重置
   */
  async forgotPassword(email) {
    const response = await fetch(`${API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const error = await this.parseError(response, '密码重置请求失败')
      throw new Error(error)
    }

    return await response.json()
  },

  /**
   * 确认密码重置
   */
  async resetPassword(token, newPassword) {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, new_password: newPassword })
    })

    if (!response.ok) {
      const error = await this.parseError(response, '密码重置失败')
      throw new Error(error)
    }

    return await response.json()
  },

  // ============ 通用请求方法 ============

  async parseError(response, fallback) {
    try {
      const data = await response.json()
      return data.detail || fallback
    } catch {
      return fallback
    }
  },

  /**
   * 带认证的请求
   */
  async request(path, options = {}, fallbackMessage = '请求失败') {
    const {
      method = 'GET',
      body,
      headers = {},
      requiresAuth = true,
      isFormData = false
    } = options

    let requestHeaders = { ...headers }

    if (requiresAuth) {
      const token = this.getAccessToken()
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`
      }
    }

    if (body && !isFormData) {
      requestHeaders['Content-Type'] = 'application/json'
    }

    const url = `${API_BASE_URL}${path}`
    let response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body
    })

    // Token 过期，尝试刷新
    if (requiresAuth && response.status === 401) {
      const newToken = await this.refreshAccessToken()
      if (newToken) {
        requestHeaders['Authorization'] = `Bearer ${newToken}`
        response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body
        })
      } else {
        throw new Error('登录已过期，请重新登录')
      }
    }

    if (!response.ok) {
      const error = await this.parseError(response, fallbackMessage)
      throw new Error(error)
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

  // ============ Todo API ============

  async fetchTodos() {
    return await this.request('/todos', {}, '获取待办失败')
  },

  async createTodo(title, description = null, scheduleData = null) {
    const payload = { title, description }
    if (scheduleData) {
      payload.start_at = scheduleData.start_at
      payload.end_at = scheduleData.end_at
      payload.all_day = scheduleData.all_day || false
      payload.color = scheduleData.color
    }
    return await this.request(
      '/todos',
      { method: 'POST', body: JSON.stringify(payload) },
      '创建待办失败'
    )
  },

  async updateTodo(id, updates) {
    return await this.request(
      `/todos/${id}`,
      { method: 'PUT', body: JSON.stringify(updates) },
      '更新待办失败'
    )
  },

  async deleteTodo(id) {
    await this.request(`/todos/${id}`, { method: 'DELETE' }, '删除待办失败')
    return true
  },

  // ============ Pomodoro API ============

  async savePomodoro(session) {
    return await this.request(
      '/pomodoro/sessions',
      { method: 'POST', body: JSON.stringify(session) },
      '保存番茄钟失败'
    )
  },

  async getPomodoroHistory() {
    return await this.request('/pomodoro/sessions', {}, '获取番茄钟历史失败')
  },

  async getPomodoroSettings() {
    return await this.request('/pomodoro/settings', {}, '获取番茄钟设置失败')
  },

  async savePomodoroSettings(settings) {
    return await this.request(
      '/pomodoro/settings',
      { method: 'PUT', body: JSON.stringify(settings) },
      '保存番茄钟设置失败'
    )
  },

  // ============ Profile API ============

  async fetchProfile() {
    return await this.request('/profile', {}, '获取个人资料失败')
  },

  async updateProfile(profileData) {
    return await this.request(
      '/profile',
      { method: 'PUT', body: JSON.stringify(profileData) },
      '更新个人资料失败'
    )
  },

  async uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return await this.request(
      '/profile/avatar',
      { method: 'POST', body: formData, isFormData: true },
      '上传头像失败'
    )
  },

  // ============ 健康检查 ============

  async healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/`)
      if (response.ok) {
        const contentType = response.headers.get('Content-Type') || ''
        if (contentType.includes('application/json')) {
          return await response.json()
        }
        return { status: 'ok', message: '服务可用' }
      }
    } catch (error) {
      console.error('API 连接错误:', error)
    }
    return { status: 'error', message: '无法连接到API服务' }
  },

  // ============ 兼容性方法 ============

  // 保留旧方法名以兼容
  async requestPasswordReset(email) {
    return await this.forgotPassword(email)
  }
}