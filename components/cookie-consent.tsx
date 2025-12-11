"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { hasCookieConsentBeenAsked, setCookieConsent } from "@/lib/api"
import { Cookie, X, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCookieConsentBeenAsked()) {
        setShowBanner(true)
        requestAnimationFrame(() => setIsAnimating(true))
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleAccept = () => {
    setCookieConsent(true)
    setIsAnimating(false)
    setTimeout(() => setShowBanner(false), 300)
  }

  const handleDecline = () => {
    setCookieConsent(false)
    setIsAnimating(false)
    setTimeout(() => setShowBanner(false), 300)
  }

  if (!showBanner) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6",
        "transition-all duration-300 ease-out",
        isAnimating ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-4xl",
          "bg-white dark:bg-slate-900",
          "border border-slate-200 dark:border-slate-700",
          "rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-slate-900/50",
          "backdrop-blur-xl"
        )}
      >
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="flex gap-4 flex-1">
              <div className="shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Cookie className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  We value your privacy
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  We use cookies to enhance your browsing experience, provide personalized content, 
                  and keep you securely logged in. By clicking &quot;Accept&quot;, you consent to our use of cookies.
                  <a 
                    href="/privacy" 
                    className="text-primary hover:underline ml-1 font-medium"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-3 shrink-0 w-full md:w-auto">
              <Button
                variant="outline"
                onClick={handleDecline}
                className="flex-1 md:flex-none"
              >
                Decline
              </Button>
              <Button
                onClick={handleAccept}
                className="flex-1 md:flex-none bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25"
              >
                Accept Cookies
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Essential (Required)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Authentication</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Preferences</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  )
}
