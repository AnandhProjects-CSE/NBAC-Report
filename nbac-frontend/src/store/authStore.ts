import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "faculty" | "student"
  department: string
  year?: number
  section?: string
  isActive: boolean
  createdAt: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void
  updateUser: (user: Partial<User>) => void
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken)
          if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken)
          }
        }
        set({
          user,
          accessToken,
          isAuthenticated: true,
        })
      },

      updateUser: (userData) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },

      checkAuth: () => {
        if (typeof window !== "undefined") {
          const token = localStorage.getItem("accessToken")
          const storedUser = localStorage.getItem("user")
          
          if (token && storedUser) {
            try {
              const user = JSON.parse(storedUser)
              set({
                user,
                accessToken: token,
                isAuthenticated: true,
              })
            } catch {
              set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
              })
            }
          }
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
