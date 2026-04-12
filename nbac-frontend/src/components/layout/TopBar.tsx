"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAuthStore } from "@/store/authStore"
import { Badge } from "@/components/ui/badge"

export function TopBar() {
  const { user, logout } = useAuthStore()

  const roleColors = {
    admin: "bg-purple-500",
    faculty: "bg-blue-500",
    student: "bg-emerald-500",
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
      <div className="flex h-full items-center justify-end px-6 gap-3">
        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold px-1 pb-2 border-b border-slate-200 dark:border-slate-700">
                Notifications
              </p>
              <div className="py-6 text-center text-sm text-slate-400">
                No new notifications
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  className={`${user?.role ? roleColors[user.role] : "bg-slate-500"} text-white`}
                >
                  {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
                <Badge
                  className={`w-fit mt-1 capitalize ${
                    user?.role ? roleColors[user.role] : "bg-slate-500"
                  } text-white`}
                >
                  {user?.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
