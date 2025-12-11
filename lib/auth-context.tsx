"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { 
  authApi, 
  getToken, 
  getRefreshToken,
  setTokens, 
  removeAllTokens, 
  type User 
} from "./api"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  oauthProviders: string[]
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  loginWithOAuth: (provider: string) => void
  revokeAllSessions: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [oauthProviders, setOauthProviders] = useState<string[]>([])
  const searchParams = useSearchParams()

  // Handle OAuth callback tokens from URL
  useEffect(() => {
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")
    
    if (accessToken) {
      setTokens(accessToken, refreshToken || undefined)
      // Clean up URL
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams])

  // Fetch available OAuth providers
  useEffect(() => {
    authApi.getOAuthProviders()
      .then(({ providers }) => setOauthProviders(providers))
      .catch(() => setOauthProviders([]))
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const userData = await authApi.getCurrentUser()
      setUser(userData)
    } catch {
      removeAllTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (username: string, password: string) => {
    const response = await authApi.login(username, password)
    setTokens(response.access_token, response.refresh_token)
    await refreshUser()
  }

  const register = async (username: string, email: string, password: string) => {
    await authApi.register(username, email, password)
  }

  const logout = async () => {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await authApi.logout(refreshToken)
    }
    removeAllTokens()
    setUser(null)
  }

  const loginWithOAuth = (provider: string) => {
    window.location.href = authApi.getOAuthUrl(provider)
  }

  const revokeAllSessions = async () => {
    await authApi.revokeAllTokens()
    removeAllTokens()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        oauthProviders,
        login,
        register,
        logout,
        refreshUser,
        loginWithOAuth,
        revokeAllSessions,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
