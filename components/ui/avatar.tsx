import * as React from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
}

export function Avatar({ 
  src, 
  alt = "", 
  fallback, 
  size = "md", 
  className, 
  ...props 
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false)

  const initials = React.useMemo(() => {
    if (fallback) {
      return fallback.slice(0, 2).toUpperCase()
    }
    if (alt) {
      return alt
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    }
    return "?"
  }, [fallback, alt])

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  )
}
