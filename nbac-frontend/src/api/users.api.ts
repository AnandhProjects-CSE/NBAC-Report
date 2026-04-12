import api from "@/lib/axios"
import { User } from "@/store/authStore"

// Pagination metadata from API
interface PaginationMeta {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Response for GET /api/users (list)
interface UserListResponse {
  success: boolean
  message: string
  data: User[]
  meta: PaginationMeta
}

// Response for GET /api/users/:id
interface UserDetailResponse {
  success: boolean
  message: string
  data: {
    user: User
    coursesCount?: number
  }
}

// Response for unenrolled students
interface UnenrolledStudentsResponse {
  success: boolean
  message: string
  data: {
    course: {
      _id: string
      courseCode: string
      courseName: string
    }
    students: Array<{
      _id: string
      name: string
      email: string
      rollNumber: string
      year: number
      section: string
    }>
    count: number
  }
}

// Query parameters for user list
interface UserListParams {
  page?: number
  limit?: number
  role?: "admin" | "faculty" | "student"
  department?: string
  isActive?: boolean
  search?: string
}

// Query parameters for unenrolled students
interface UnenrolledStudentsParams {
  year?: number
  section?: string
}

export const usersApi = {
  /**
   * Get All Users - GET /api/users
   * Access: Admin only
   */
  getAll: async (params?: UserListParams): Promise<UserListResponse> => {
    const response = await api.get<UserListResponse>("/users", { params })
    return response.data
  },

  /**
   * Get User by ID - GET /api/users/:id
   * Access: Admin only
   */
  getById: async (id: string): Promise<UserDetailResponse> => {
    const response = await api.get<UserDetailResponse>(`/users/${id}`)
    return response.data
  },

  /**
   * Create User (uses /api/auth/register) - POST /api/auth/register
   * Access: Admin only
   */
  create: async (userData: {
    name: string
    email: string
    password: string
    role: "admin" | "faculty" | "student"
    department: string
    year?: number
    section?: string
    rollNumber?: string
  }): Promise<{ success: boolean; message: string; data: { user: User } }> => {
    const response = await api.post("/auth/register", userData)
    return response.data
  },

  /**
   * Update User - PATCH /api/users/:id
   * Access: Admin only
   */
  update: async (
    id: string,
    userData: Partial<{
      name: string
      department: string
      year: number
      section: string
      rollNumber: string
      isActive: boolean
      isApproved: boolean
    }>
  ): Promise<{ success: boolean; message: string; data: { user: User } }> => {
    const response = await api.patch(`/users/${id}`, userData)
    return response.data
  },

  /**
   * Delete User (Soft Delete) - DELETE /api/users/:id
   * Access: Admin only
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  /**
   * Restore Deleted User - POST /api/users/:id/restore
   * Access: Admin only
   */
  restore: async (id: string): Promise<{ success: boolean; message: string; data: { user: User } }> => {
    const response = await api.post(`/users/${id}/restore`)
    return response.data
  },

  /**
   * Reset User Password - POST /api/users/:id/reset-password
   * Access: Admin only
   */
  resetPassword: async (
    id: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/users/${id}/reset-password`, { newPassword })
    return response.data
  },

  /**
   * Get Unenrolled Students for Course - GET /api/users/students/unenrolled/:courseId
   * Access: Faculty (owner), Admin
   */
  getUnenrolledStudents: async (
    courseId: string,
    params?: UnenrolledStudentsParams
  ): Promise<UnenrolledStudentsResponse> => {
    const response = await api.get<UnenrolledStudentsResponse>(
      `/users/students/unenrolled/${courseId}`,
      { params }
    )
    return response.data
  },
}
