const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const nameEQ = `${name}=`
  const cookies = document.cookie.split(";")
  for (let cookie of cookies) {
    cookie = cookie.trim()
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`
}

export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  full_name?: string | null
  avatar_url?: string | null
  oauth_provider?: string | null
  created_at?: string | null
  has_password?: boolean | null
}

export interface OAuthProvider {
  name: string
  url: string
}

export interface LinkedAccount {
  provider: string
  linked: boolean
  email?: string | null
}

export interface UserUpdate {
  username?: string
  email?: string
  full_name?: string
  current_password?: string
  new_password?: string
}

// TaskStatus enum
export type TaskStatus = "pending" | "in_progress" | "completed"
export interface TaskPriority {
  high: number
  medium: number
  low: number
}

export interface TaskCreate {
  title: string
  description?: string | null
  priority: number
  due_date?: string | null
  status?: TaskStatus | null
  user_experience?: number
}

export interface Task {
  id: number
  title: string
  description: string | null
  priority: number
  due_date: string | null
  status: TaskStatus
  owner_id: number | null
  completed: boolean
  user_experience: number
}

export type CreateTaskInput = TaskCreate

export interface LoginResponse {
  access_token: string
  refresh_token?: string
  token_type: string
}

export interface CompletionTimePredictRequest {
  description_length: number
  priority: number
  user_experience: number
  is_complex: boolean
  days_until_due?: number
  status?: TaskStatus
}

export interface CompletionTimePredictResponse {
  predicted_hours: number
  input_features: Record<string, unknown>
}

export interface PriorityPredictRequest {
  text: string
  days_until_due?: number
  status?: TaskStatus
}

export interface PriorityPredictResponse {
  predicted_priority: string
  confidence: TaskPriority
}

export interface BatchCompletionTimeRequest {
  tasks: CompletionTimePredictRequest[]
}

export interface BatchCompletionTimeResponse {
  predictions: number[]
  total_predicted_hours: number
}

export interface MLHealthResponse {
  status: string
  models_loaded: boolean
  details: Record<string, unknown>
}

export function getToken(): string | null {
  return getCookie("auth_token")
}

export function getRefreshToken(): string | null {
  return getCookie("refresh_token")
}

export function setToken(token: string): void {
  setCookie("auth_token", token, 1) // Access token expires in 1 day (shorter for security)
}

export function setRefreshToken(token: string): void {
  setCookie("refresh_token", token, 7) // Refresh token expires in 7 days
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  setToken(accessToken)
  if (refreshToken) {
    setRefreshToken(refreshToken)
  }
}

export function removeToken(): void {
  deleteCookie("auth_token")
}

export function removeRefreshToken(): void {
  deleteCookie("refresh_token")
}

export function removeAllTokens(): void {
  deleteCookie("auth_token")
  deleteCookie("refresh_token")
}

export function getCookieConsent(): boolean {
  return getCookie("cookie_consent") === "accepted"
}

export function setCookieConsent(accepted: boolean): void {
  if (accepted) {
    setCookie("cookie_consent", "accepted", 365)
  }
}

export function hasCookieConsentBeenAsked(): boolean {
  return getCookie("cookie_consent") !== null
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  // Handle 401 - try to refresh token
  if (response.status === 401 && retry) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        const refreshResponse = await authApi.refreshToken(refreshToken)
        setToken(refreshResponse.access_token)
        // Retry the original request with the new token
        return apiRequest<T>(endpoint, options, false)
      } catch {
        // Refresh failed, clear tokens
        removeAllTokens()
        throw new Error("Session expired. Please log in again.")
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(error.detail || "Request failed")
  }

  const text = await response.text()
  return text ? JSON.parse(text) : undefined as any
}

export const authApi = {
  async register(username: string, email: string, password: string): Promise<User> {
    return apiRequest<User>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    })
  },

  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Login failed" }))
      throw new Error(error.detail || "Login failed")
    }

    return response.json()
  },

  async getCurrentUser(): Promise<User> {
    return apiRequest<User>("/auth/me")
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      throw new Error("Token refresh failed")
    }

    return response.json()
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
    } catch {
      // Ignore logout errors
    }
  },

  async revokeToken(refreshToken: string): Promise<void> {
    return apiRequest<void>("/auth/revoke", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  },

  async revokeAllTokens(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/auth/revoke-all", {
      method: "POST",
    })
  },

  async getOAuthProviders(): Promise<{ providers: string[] }> {
    const response = await fetch(`${API_BASE_URL}/auth/providers`)
    return response.json()
  },

  getOAuthUrl(provider: string): string {
    return `${API_BASE_URL}/auth/oauth/${provider}`
  },

  async updateProfile(data: UserUpdate): Promise<User> {
    return apiRequest<User>("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  },

  async setPassword(password: string): Promise<User> {
    return apiRequest<User>(`/auth/profile/set-password?password=${encodeURIComponent(password)}`, {
      method: "POST",
    })
  },

  async getLinkedAccounts(): Promise<LinkedAccount[]> {
    return apiRequest<LinkedAccount[]>("/auth/profile/linked-accounts")
  },

  async unlinkOAuth(): Promise<{ message: string }> {
    return apiRequest<{ message: string }>("/auth/profile/unlink-oauth", {
      method: "DELETE",
    })
  },

  async getLinkOAuthUrl(provider: string): Promise<{ authorization_url: string }> {
    return apiRequest<{ authorization_url: string }>(`/auth/profile/link-oauth/${provider}`)
  },
}

export const tasksApi = {
  async list(params?: { skip?: number; limit?: number; status?: string }): Promise<Task[]> {
    const searchParams = new URLSearchParams()
    if (params?.skip) searchParams.set("skip", params.skip.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.status) searchParams.set("status", params.status)

    const query = searchParams.toString()
    return apiRequest<Task[]>(`/tasks/${query ? `?${query}` : ""}`)
  },

  async get(id: number): Promise<Task> {
    return apiRequest<Task>(`/tasks/${id}`)
  },

  async create(task: CreateTaskInput): Promise<Task> {
    return apiRequest<Task>("/tasks/", {
      method: "POST",
      body: JSON.stringify(task),
    })
  },

  async update(id: number, task: Partial<CreateTaskInput>): Promise<Task> {
    return apiRequest<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(task),
    })
  },

  async delete(id: number): Promise<void> {
    return apiRequest<void>(`/tasks/${id}`, {
      method: "DELETE",
    })
  },

  async exportCSV(): Promise<Blob> {
    const token = getToken()
    const response = await fetch(`${API_BASE_URL}/tasks/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Export failed")
    }

    return response.blob()
  },

  async importCSV(file: File): Promise<{ imported: number }> {
    const token = getToken()
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/tasks/import`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Import failed")
    }

    return response.json()
  },
}

export const mlApi = {
  async predictCompletionTime(data: CompletionTimePredictRequest): Promise<CompletionTimePredictResponse> {
    return apiRequest<CompletionTimePredictResponse>("/ml/predict/completion-time", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async predictPriority(data: PriorityPredictRequest): Promise<PriorityPredictResponse> {
    return apiRequest<PriorityPredictResponse>("/ml/predict/priority", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async batchPredictCompletionTime(data: BatchCompletionTimeRequest): Promise<BatchCompletionTimeResponse> {
    return apiRequest<BatchCompletionTimeResponse>("/ml/predict/batch", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async getHealth(): Promise<MLHealthResponse> {
    return apiRequest<MLHealthResponse>("/ml/health")
  },
}

export const MLCompletionPrediction = {} as CompletionTimePredictResponse
export const MLPriorityPrediction = {} as PriorityPredictResponse
export const MLModelStatus = {} as MLHealthResponse
