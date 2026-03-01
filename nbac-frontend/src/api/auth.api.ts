import api from "@/lib/axios"
import { User } from "@/store/authStore"

// Response type for login endpoint
interface LoginResponse {
  success: boolean
  message: string
  data: {
    user: User
    accessToken: string
    refreshToken: string
  }
}

// Response type for refresh token endpoint
interface RefreshResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
  }
}

// Response type for /auth/me endpoint
interface MeResponse {
  success: boolean
  message: string
  data: {
    user: User
  }
}

// Response type for register endpoint
interface RegisterResponse {
  success: boolean
  message: string
  data: {
    user: User
  }
}

// Request type for student registration
interface StudentRegisterData {
  name: string
  email: string
  password: string
  role: "student"
  department: string
  year: number
  section: string
  rollNumber?: string
}

// Request type for faculty/admin registration
interface FacultyRegisterData {
  name: string
  email: string
  password: string
  role: "faculty" | "admin"
  department: string
}

export const authApi = {
  /**
   * Login - POST /api/auth/login
   * Access: Public
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", { email, password })
    return response.data
  },

  /**
   * Register - POST /api/auth/register
   * Access: Admin only
   */
  register: async (
    userData: StudentRegisterData | FacultyRegisterData
  ): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>("/auth/register", userData)
    return response.data
  },

  /**
   * Refresh Token - POST /api/auth/refresh
   * Access: Public
   */
  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const response = await api.post<RefreshResponse>("/auth/refresh", { refreshToken })
    return response.data
  },

  /**
   * Logout - POST /api/auth/logout
   * Access: Protected
   */
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<{ success: boolean; message: string }>("/auth/logout")
    return response.data
  },

  /**
   * Get Current User Profile - GET /api/auth/me
   * Access: Protected
   */
  getMe: async (): Promise<MeResponse> => {
    const response = await api.get<MeResponse>("/auth/me")
    return response.data
  },

  /**
   * Update Current User Profile - PATCH /api/auth/me
   * Access: Protected
   */
  updateMe: async (data: {
    name?: string
    password?: string
  }): Promise<{ success: boolean; message: string; data: { user: User } }> => {
    const response = await api.patch("/auth/me", data)
    return response.data
  },
}
