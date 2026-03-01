import api from "@/lib/axios"

export interface CourseOutcome {
  _id: string
  courseId: string
  coNumber: string
  description: string
  threshold: number
  createdAt: string
  updatedAt: string
}

interface CourseInfo {
  _id: string
  courseCode: string
  courseName: string
}

interface CoListResponse {
  success: boolean
  message: string
  data: {
    course: CourseInfo
    cos: CourseOutcome[]
    count: number
  }
}

interface CoCreateResponse {
  success: boolean
  message: string
  data: CourseOutcome
}

export const coApi = {
  getAll: async (courseId: string): Promise<CoListResponse> => {
    const response = await api.get<CoListResponse>(`/courses/${courseId}/cos`)
    return response.data
  },

  create: async (
    courseId: string,
    data: { coNumber: string; description: string; threshold: number }
  ): Promise<CoCreateResponse> => {
    const response = await api.post(`/courses/${courseId}/cos`, data)
    return response.data
  },

  update: async (
    courseId: string,
    coId: string,
    data: Partial<{ coNumber: string; description: string; threshold: number }>
  ): Promise<CoCreateResponse> => {
    const response = await api.patch(`/courses/${courseId}/cos/${coId}`, data)
    return response.data
  },

  delete: async (
    courseId: string,
    coId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/courses/${courseId}/cos/${coId}`)
    return response.data
  },
}
