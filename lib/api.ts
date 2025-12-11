// API client for ML Task Management Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

// Cookie utility functions
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

// ============ Types (matching backend OpenAPI spec) ============

export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
}

// TaskStatus enum
export type TaskStatus = "pending" | "in_progress" | "completed"
export interface TaskPriority {
  high: number               // 0.0 - 1.0 confidence score
  medium: number             // 0.0 - 1.0 confidence score
  low: number                // 0.0 - 1.0 confidence score
}

// POST /tasks/ - Request (TaskCreate schema)
export interface TaskCreate {
  title: string                   // 1-100 chars, required
  description?: string | null     // max 500 chars, optional
  priority: number                // 0=low, 1=medium, 2=high
  due_date?: string | null        // datetime string, optional
  status?: TaskStatus | null      // default "pending"
}

// GET /tasks/, GET /tasks/{id}, etc. - Response (TaskResponse schema)
export interface Task {
  id: number                      // required
  title: string                   // required
  description: string | null      // may be null
  priority: number                // 0=low, 1=medium, 2=high
  due_date: string | null         // datetime string or null
  status: TaskStatus              // required
  owner_id: number | null         // may be null
  completed: boolean              // required
}

// Legacy alias for backward compatibility
export type CreateTaskInput = TaskCreate

export interface LoginResponse {
  access_token: string
  token_type: string
}

// ============ ML Types (matching backend OpenAPI spec) ============

// POST /ml/predict/completion-time - Request
export interface CompletionTimePredictRequest {
  description_length: number      // 1-1000, length of task description
  priority: number                // 0=low, 1=medium, 2=high
  user_experience: number         // user experience level
  is_complex: boolean             // task complexity flag
  days_until_due?: number         // optional: days until due date
  status?: TaskStatus  // optional: task status
}

// POST /ml/predict/completion-time - Response
export interface CompletionTimePredictResponse {
  predicted_hours: number         // predicted completion time in hours
  input_features: Record<string, unknown>  // features used for prediction
}

// POST /ml/predict/priority - Request
export interface PriorityPredictRequest {
  text: string                    // task description text
  days_until_due?: number         // optional: days until due date
  status?: TaskStatus  // optional: task status
}

// POST /ml/predict/priority - Response
export interface PriorityPredictResponse {
  predicted_priority: string      // "low", "medium", or "high"
  confidence: TaskPriority              // 0.0 - 1.0 confidence score
}

// POST /ml/predict/batch - Request
export interface BatchCompletionTimeRequest {
  tasks: CompletionTimePredictRequest[]  // max 100 tasks
}

// POST /ml/predict/batch - Response
export interface BatchCompletionTimeResponse {
  predictions: number[]           // list of predicted hours
  total_predicted_hours: number   // sum of all predictions
}

// GET /ml/health - Response
export interface MLHealthResponse {
  status: string                  // overall ML service status
  models_loaded: boolean          // whether all models are loaded
  details: Record<string, unknown>  // detailed model info
}

// Token management (using cookies)
export function getToken(): string | null {
  return getCookie("auth_token")
}

export function setToken(token: string): void {
  setCookie("auth_token", token, 7) // 7 days expiry
}

export function removeToken(): void {
  deleteCookie("auth_token")
}

// Cookie consent management
export function getCookieConsent(): boolean {
  return getCookie("cookie_consent") === "accepted"
}

export function setCookieConsent(accepted: boolean): void {
  if (accepted) {
    setCookie("cookie_consent", "accepted", 365) // 1 year
  }
}

export function hasCookieConsentBeenAsked(): boolean {
  return getCookie("cookie_consent") !== null
}

// API helper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }))
    throw new Error(error.detail || "Request failed")
  }

  // Handle empty responses
  const text = await response.text()
  return text ? JSON.parse(text) : undefined as any
}

// Auth API
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
}

// Tasks API
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
      method: "PATCH",  // Use PATCH for partial updates
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

// ML API (matching backend OpenAPI spec)
export const mlApi = {
  /**
   * Predict completion time for a task
   * POST /ml/predict/completion-time
   */
  async predictCompletionTime(data: CompletionTimePredictRequest): Promise<CompletionTimePredictResponse> {
    return apiRequest<CompletionTimePredictResponse>("/ml/predict/completion-time", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Predict priority from task description text
   * POST /ml/predict/priority
   */
  async predictPriority(data: PriorityPredictRequest): Promise<PriorityPredictResponse> {
    return apiRequest<PriorityPredictResponse>("/ml/predict/priority", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Batch predict completion times for multiple tasks
   * POST /ml/predict/batch
   */
  async batchPredictCompletionTime(data: BatchCompletionTimeRequest): Promise<BatchCompletionTimeResponse> {
    return apiRequest<BatchCompletionTimeResponse>("/ml/predict/batch", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  /**
   * Check ML service health and model status
   * GET /ml/health
   */
  async getHealth(): Promise<MLHealthResponse> {
    return apiRequest<MLHealthResponse>("/ml/health")
  },
}

// Legacy aliases for backward compatibility
export const MLCompletionPrediction = {} as CompletionTimePredictResponse
export const MLPriorityPrediction = {} as PriorityPredictResponse
export const MLModelStatus = {} as MLHealthResponse
