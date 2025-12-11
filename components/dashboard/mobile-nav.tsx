"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Brain, LayoutDashboard, ListTodo, LogOut, Menu, Sparkles, User } from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tasks", href: "/dashboard/tasks", icon: ListTodo },
  { name: "ML Insights", href: "/dashboard/ml", icon: Sparkles },
]

export function MobileNav() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">ML Tasks</span>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-sidebar border-sidebar-border">
            <SheetHeader>
              <SheetTitle className="text-sidebar-foreground">Navigation</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 mt-6">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 border-t border-sidebar-border p-4">
              <div className="flex items-center gap-3 px-2 py-2">
                <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center">
                  <User className="h-5 w-5 text-sidebar-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.username}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start mt-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={() => {
                  logout()
                  setOpen(false)
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
