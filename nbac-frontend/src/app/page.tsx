"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes = {
        admin: "/admin/dashboard",
        faculty: "/faculty/dashboard",
        student: "/student/dashboard",
      }
      router.push(roleRoutes[user.role])
    } else {
      // Redirect to login if not authenticated
      router.push("/login")
    }
  }, [isAuthenticated, user, router])

  return null
}
