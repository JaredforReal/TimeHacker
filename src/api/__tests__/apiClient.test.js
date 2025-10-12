import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient } from '../index.js'

const getSessionMock = vi.fn()
const refreshSessionMock = vi.fn()

vi.mock('../../supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      refreshSession: refreshSessionMock
    }
  }
}))

const originalFetch = global.fetch

const createResponse = (status, body = '', headers = { 'Content-Type': 'application/json' }) => ({
  ok: status >= 200 && status < 300,
  status,
  text: vi.fn().mockResolvedValue(body),
  json: vi.fn().mockResolvedValue(body ? JSON.parse(body) : {}),
  headers: {
    get: (key) => headers[key] || headers[key?.toLowerCase?.()] || null
  }
})

describe('apiClient helpers', () => {
  beforeEach(() => {
    process.env.VITE_API_URL = 'https://api.example.com'
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: 'token-initial' } }
    })
    refreshSessionMock.mockResolvedValue({
      data: { session: { access_token: 'token-refresh' } },
      error: null
    })
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    global.fetch = originalFetch
  })

  it('parseErrorResponse returns detail message when available', async () => {
    const response = {
      status: 400,
      text: vi.fn().mockResolvedValue(JSON.stringify({ detail: 'Invalid payload' }))
    }

    await expect(
      apiClient.parseErrorResponse(response, 'fallback message')
    ).rejects.toThrow('Invalid payload')

    expect(response.text).toHaveBeenCalled()
  })

  it('request retries after refreshing session on unauthorized response', async () => {
    const unauthorized = {
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' }
    }

    const success = createResponse(200, JSON.stringify({ success: true }))

    global.fetch
      .mockResolvedValueOnce(unauthorized)
      .mockResolvedValueOnce(success)

    const result = await apiClient.request('/todos')

    expect(getSessionMock).toHaveBeenCalledTimes(1)
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch.mock.calls[0][0]).toBe('https://api.example.com/todos')
    expect(result).toEqual({ success: true })
  })
})
