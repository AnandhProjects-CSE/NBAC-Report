import api from "@/lib/axios"

// Individual response in feedback
export interface FeedbackResponse {
  coId: string
  rating: number
}

// Feedback submission
export interface Feedback {
  _id: string
  student?: {
    rollNumber: string
  }
  responses: Array<{
    coNumber: string
    rating: number
  }>
  submittedAt: string
  comments?: string
}

// CO-wise summary in feedback summary
export interface COWiseFeedbackSummary {
  coId: string
  coNumber: string
  averageRating: number
  totalResponses: number
}

// Response for GET /api/feedback/:courseId/summary
export interface FeedbackSummaryResponse {
  success: boolean
  message: string
  data: {
    course: {
      _id: string
      courseCode: string
      courseName: string
    }
    totalSubmissions: number
    totalEnrolled: number
    overallAverageRating: number
    coWiseSummary: COWiseFeedbackSummary[]
    responseRate: string
  }
}

// Course status for student
export interface CourseFeedbackStatus {
  _id: string
  courseCode: string
  courseName: string
  semester: number
  academicYear: string
  faculty: {
    _id: string
    name: string
    email: string
  }
  feedbackStatus: "submitted" | "pending"
  submittedAt?: string
}

// Response for GET /api/feedback/student/status
export interface StudentFeedbackStatusResponse {
  success: boolean
  message: string
  data: {
    courses: CourseFeedbackStatus[]
    summary: {
      total: number
      submitted: number
      pending: number
    }
  }
}

// Response for GET /api/feedback/:courseId/status
export interface CourseFeedbackStatusResponse {
  success: boolean
  message: string
  data: {
    courseId: string
    courseCode: string
    courseName: string
    hasSubmitted: boolean
    feedback?: {
      submittedAt: string
      responses: Array<{
        coNumber: string
        rating: number
      }>
    }
    // COs for pending feedback (if backend supports it)
    cos?: Array<{
      _id: string
      coNumber: string
      description: string
    }>
  }
}

// Response for GET /api/feedback/:courseId (list)
interface FeedbackListResponse {
  success: boolean
  message: string
  data: Feedback[]
  meta?: {
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

// Request for POST /api/feedback/:courseId
interface FeedbackSubmitRequest {
  responses: Array<{
    coId: string
    rating: number
  }>
  comments?: string
}

// Response for POST /api/feedback/:courseId
interface FeedbackSubmitResponse {
  success: boolean
  message: string
  data: {
    feedback: {
      _id: string
      submittedAt: string
      totalCOs: number
    }
  }
}

export const feedbackApi = {
  /**
   * Submit Feedback - POST /api/feedback/:courseId
   * Access: Student only (must be enrolled)
   */
  submit: async (
    courseId: string,
    responses: Array<{ coId: string; rating: number }>,
    comments?: string
  ): Promise<FeedbackSubmitResponse> => {
    const body: FeedbackSubmitRequest = { responses, comments }
    const response = await api.post<FeedbackSubmitResponse>(`/feedback/${courseId}`, body)
    return response.data
  },

  /**
   * Get Student's Feedback Status - GET /api/feedback/student/status
   * Access: Student only
   */
  getStudentStatus: async (): Promise<StudentFeedbackStatusResponse> => {
    const response = await api.get<StudentFeedbackStatusResponse>("/feedback/student/status")
    return response.data
  },

  /**
   * Get Feedback Status for Course - GET /api/feedback/:courseId/status
   * Access: Student only (must be enrolled)
   */
  getCourseStatus: async (courseId: string): Promise<CourseFeedbackStatusResponse> => {
    const response = await api.get<CourseFeedbackStatusResponse>(`/feedback/${courseId}/status`)
    return response.data
  },

  /**
   * Get All Feedback for Course - GET /api/feedback/:courseId
   * Access: Faculty (owner), Admin
   */
  getAll: async (
    courseId: string,
    params?: { page?: number; limit?: number }
  ): Promise<FeedbackListResponse> => {
    const response = await api.get<FeedbackListResponse>(`/feedback/${courseId}`, { params })
    return response.data
  },

  /**
   * Get Feedback Summary - GET /api/feedback/:courseId/summary
   * Access: Faculty (owner), Admin
   */
  getSummary: async (courseId: string): Promise<FeedbackSummaryResponse> => {
    const response = await api.get<FeedbackSummaryResponse>(`/feedback/${courseId}/summary`)
    return response.data
  },
}
