// API client for ML Task Management Backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

// Types
export interface User {
  id: number
  username: string
  email: string
  is_active: boolean
  created_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  priority: number
  due_date: string | null
  status: "pending" | "in_progress" | "completed"
  created_at: string
  updated_at: string
  user_id: number
}

export interface CreateTaskInput {
  title: string
  description: string
  priority: number
  due_date?: string
  status: "pending" | "in_progress" | "completed"
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface MLCompletionPrediction {
  predicted_hours: number
  confidence: number
}

export interface MLPriorityPrediction {
  suggested_priority: number
  reasoning: string
}

export interface MLModelStatus {
  completion_model: boolean
  priority_model: boolean
}

// Token management
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

export function setToken(token: string): void {
  localStorage.setItem("auth_token", token)
}

export function removeToken(): void {
  localStorage.removeItem("auth_token")
}

// API helper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
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
  return text ? JSON.parse(text) : null
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
      method: "PUT",
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
    const response = await fetch(`${API_BASE_URL}/tasks/export/csv`, {
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

    const response = await fetch(`${API_BASE_URL}/tasks/import/csv`, {
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

// ML API
export const mlApi = {
  async predictCompletionTime(data: {
    priority: number
    description_length: number
    has_due_date: boolean
    days_until_due: number
    status: string
  }): Promise<MLCompletionPrediction> {
    return apiRequest<MLCompletionPrediction>("/ml/predict/completion-time", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async predictPriority(data: {
    description: string
    due_date: string
    status: string
  }): Promise<MLPriorityPrediction> {
    return apiRequest<MLPriorityPrediction>("/ml/predict/priority", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  async getModelStatus(): Promise<MLModelStatus> {
    return apiRequest<MLModelStatus>("/ml/models/status")
  },
}
