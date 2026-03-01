"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RoleBadgeProps {
  role: "admin" | "faculty" | "student"
  size?: "sm" | "md"
}

export function RoleBadge({ role, size = "md" }: RoleBadgeProps) {
  const colorClasses = {
    admin: "bg-purple-500 hover:bg-purple-500",
    faculty: "bg-blue-500 hover:bg-blue-500",
    student: "bg-emerald-500 hover:bg-emerald-500",
  }

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0",
    md: "text-sm px-2 py-0.5",
  }

  return (
    <Badge
      className={cn(
        colorClasses[role],
        sizeClasses[size],
        "text-white font-medium capitalize"
      )}
    >
      {role}
    </Badge>
  )
}
