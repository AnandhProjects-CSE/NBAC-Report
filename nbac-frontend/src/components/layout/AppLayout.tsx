"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { cn } from "@/lib/utils"

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  // Track whether Zustand persist has finished rehydrating from localStorage
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    // Wait for Zustand persist to rehydrate, then mark as ready
    const unsubFinishHydration = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true)
    })
    // If already hydrated (e.g. fast second render), mark immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true)
    }
    return () => unsubFinishHydration()
  }, [])

  useEffect(() => {
    // Only redirect after hydration is complete
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Redirect to correct dashboard based on role
    const rolePaths: Record<string, string> = {
      admin: "/admin/dashboard",
      faculty: "/faculty/dashboard",
      student: "/student/dashboard",
    }

    if (pathname === "/") {
      router.push(rolePaths[user?.role || "student"])
    }
  }, [hasHydrated, isAuthenticated, user?.role, router, pathname])

  // Show nothing while hydrating — prevents flash redirect to login
  if (!hasHydrated) {
    return null
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className={cn("transition-all duration-300 ml-64")}>
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
