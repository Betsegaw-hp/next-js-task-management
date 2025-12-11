"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { authApi, type LinkedAccount, type UserUpdate } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { 
  User, Shield, Link2, Unlink, Loader2, CheckCircle2, AlertCircle,
  Calendar, Mail, AtSign
} from "lucide-react"

// OAuth provider icons
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const GitHubIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
)

const providerIcons: Record<string, React.ReactNode> = {
  google: <GoogleIcon />,
  github: <GitHubIcon />,
}

const providerNames: Record<string, string> = {
  google: "Google",
  github: "GitHub",
}

export default function ProfilePage() {
  const { user, refreshUser, oauthProviders } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Profile form state
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Set password for OAuth users
  const [setPasswordValue, setSetPasswordValue] = useState("")
  const [confirmSetPassword, setConfirmSetPassword] = useState("")

  // Handle URL params (success/error from OAuth linking)
  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")
    
    if (error) {
      toast({
        title: "Error",
        description: decodeURIComponent(error),
        variant: "destructive",
      })
      window.history.replaceState({}, "", window.location.pathname)
    }
    
    if (success) {
      toast({
        title: "Success",
        description: decodeURIComponent(success),
      })
      window.history.replaceState({}, "", window.location.pathname)
      refreshUser()
      loadLinkedAccounts()
    }
  }, [searchParams, toast, refreshUser])

  // Load user data into form
  useEffect(() => {
    if (user) {
      setUsername(user.username)
      setEmail(user.email)
      setFullName(user.full_name || "")
    }
  }, [user])

  // Load linked accounts
  const loadLinkedAccounts = async () => {
    try {
      const accounts = await authApi.getLinkedAccounts()
      setLinkedAccounts(accounts)
    } catch (error) {
      console.error("Failed to load linked accounts:", error)
    }
  }

  useEffect(() => {
    loadLinkedAccounts()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const updateData: UserUpdate = {}
      
      if (username !== user?.username) updateData.username = username
      if (email !== user?.email) updateData.email = email
      if (fullName !== (user?.full_name || "")) updateData.full_name = fullName

      if (Object.keys(updateData).length === 0) {
        toast({ description: "No changes to save" })
        setIsSaving(false)
        return
      }

      await authApi.updateProfile(updateData)
      await refreshUser()
      toast({ title: "Profile updated", description: "Your profile has been updated successfully." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await authApi.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      })
      toast({ title: "Password changed", description: "Your password has been updated successfully." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (setPasswordValue !== confirmSetPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (setPasswordValue.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await authApi.setPassword(setPasswordValue)
      await refreshUser()
      toast({ title: "Password set", description: "You can now log in with your email and password." })
      setSetPasswordValue("")
      setConfirmSetPassword("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set password",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleLinkAccount = async (provider: string) => {
    const response = await authApi.getLinkOAuthUrl(provider)
    window.location.href = response.authorization_url
  }

  const handleUnlinkAccount = async () => {
    setIsLoading(true)
    try {
      await authApi.unlinkOAuth()
      await refreshUser()
      await loadLinkedAccounts()
      toast({ title: "Account unlinked", description: "OAuth account has been unlinked." })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlink account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Use the has_password field from the API
  const hasPassword = user?.has_password ?? false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and connected accounts
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="connections" className="gap-2">
            <Link2 className="h-4 w-4" />
            Connections
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar 
                  src={user?.avatar_url} 
                  alt={user?.full_name || user?.username}
                  fallback={user?.username}
                  size="xl"
                />
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{user?.full_name || user?.username}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  {user?.oauth_provider && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      {providerIcons[user.oauth_provider]}
                      <span>Connected via {providerNames[user.oauth_provider]}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Account Info */}
              <div className="grid gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>

              <Separator />

              {/* Profile Form */}
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <AtSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Change Password Card - Only show if user has a password */}
            {hasPassword && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Set Password Card - Only show for OAuth users without a password */}
            {user?.oauth_provider && !hasPassword && (
              <Card>
                <CardHeader>
                  <CardTitle>Set Password</CardTitle>
                  <CardDescription>
                    Set a password to enable email/password login in addition to {providerNames[user.oauth_provider]}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="setPassword">Password</Label>
                        <Input
                          id="setPassword"
                          type="password"
                          value={setPasswordValue}
                          onChange={(e) => setSetPasswordValue(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmSetPassword">Confirm Password</Label>
                        <Input
                          id="confirmSetPassword"
                          type="password"
                          value={confirmSetPassword}
                          onChange={(e) => setConfirmSetPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Set Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Active Sessions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active login sessions across devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">
                      This device • Active now
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Link your social accounts for easier sign-in and enhanced features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {oauthProviders.map((provider) => {
                const isLinked = user?.oauth_provider === provider
                const linkedAccount = linkedAccounts.find((a) => a.provider === provider)

                return (
                  <div
                    key={provider}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {providerIcons[provider]}
                      </div>
                      <div>
                        <p className="font-medium">{providerNames[provider]}</p>
                        {isLinked ? (
                          <p className="text-sm text-muted-foreground">
                            Connected as {linkedAccount?.email || user?.email}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Not connected</p>
                        )}
                      </div>
                    </div>
                    {isLinked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUnlinkAccount}
                        disabled={isLoading || !user?.oauth_provider}
                        className="gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unlink className="h-4 w-4" />
                        )}
                        Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLinkAccount(provider)}
                        disabled={isLoading || !!user?.oauth_provider}
                        className="gap-2"
                      >
                        <Link2 className="h-4 w-4" />
                        Connect
                      </Button>
                    )}
                  </div>
                )
              })}

              {user?.oauth_provider && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        Account linked to {providerNames[user.oauth_provider]}
                      </p>
                      <p className="text-amber-700 dark:text-amber-300">
                        To disconnect, you must first set a password in the Security tab so you can still log in.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
