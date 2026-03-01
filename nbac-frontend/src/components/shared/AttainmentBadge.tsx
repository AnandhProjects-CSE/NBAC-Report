"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface AttainmentBadgeProps {
  level: number | null | undefined
  size?: "sm" | "md" | "lg"
}

export function AttainmentBadge({ level, size = "md" }: AttainmentBadgeProps) {
  const getColorClass = (lvl: number | null | undefined) => {
    if (lvl === null || lvl === undefined) {
      return "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
    }
    switch (lvl) {
      case 0:
        return "bg-red-500 text-white"
      case 1:
        return "bg-orange-500 text-white"
      case 2:
        return "bg-amber-500 text-white"
      case 3:
        return "bg-green-500 text-white"
      default:
        return "bg-slate-200 text-slate-600"
    }
  }

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-0.5",
    lg: "text-base px-3 py-1",
  }

  return (
    <Badge
      className={cn(
        getColorClass(level),
        sizeClasses[size],
        "font-semibold rounded-md"
      )}
    >
      {level === null || level === undefined ? "N/A" : level}
    </Badge>
  )
}
