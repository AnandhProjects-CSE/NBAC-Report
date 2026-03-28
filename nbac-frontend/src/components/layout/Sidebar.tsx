"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/courses", label: "All Courses", icon: BookOpen },
  { href: "/admin/reports/department", label: "Department Report", icon: BarChart3 },
]

const facultyLinks = [
  { href: "/faculty/dashboard", label: "Dashboard", icon: Home },
  { href: "/faculty/courses", label: "My Courses", icon: BookOpen },
]

const studentLinks = [
  { href: "/student/dashboard", label: "Dashboard", icon: Home },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)

  const links =
    user?.role === "admin"
      ? adminLinks
      : user?.role === "faculty"
        ? facultyLinks
        : studentLinks

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  const roleColors = {
    admin: "bg-purple-500 hover:bg-purple-600",
    faculty: "bg-blue-500 hover:bg-blue-600",
    student: "bg-emerald-500 hover:bg-emerald-600",
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-700 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-900">
                N
              </div>
              <span className="font-semibold text-lg">NBAC</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon

            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-amber-500 text-slate-900"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{link.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-slate-800 text-white">
                    {link.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-slate-700 p-3">
          {user && (
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-9 w-9 bg-slate-700">
                    <AvatarFallback className="bg-slate-700 text-white text-sm">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-slate-800 text-white">
                    {user.name}
                  </TooltipContent>
                )}
              </Tooltip>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <Badge
                    className={cn(
                      "text-xs mt-0.5 capitalize",
                      roleColors[user.role]
                    )}
                  >
                    {user.role}
                  </Badge>
                </div>
              )}
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className={cn(
                  "mt-2 w-full text-slate-400 hover:text-white hover:bg-slate-800",
                  collapsed && "justify-center px-0"
                )}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="ml-2">Logout</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" className="bg-slate-800 text-white">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
