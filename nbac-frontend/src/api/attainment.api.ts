import api from "@/lib/axios"

// CO Attainment structure
export interface COAttainment {
  coId: string
  coNumber: string
  description: string
  successPercentage: number
  directAttainment: number
  indirectAttainment: number
  finalAttainment: number
  studentsAttained: number
  totalStudents: number
  averageFeedbackRating: number
  threshold?: number
}

// PO Attainment structure
export interface POAttainment {
  poNumber: string
  poName: string
  attainmentValue: number
  contributingCOs: number
  totalCorrelationWeight: number
  level?: string
}

// Attainment summary
interface AttainmentSummary {
  totalCOs: number
  averageCOAttainment: number
  averagePOAttainment: number
  totalStudents: number
  totalFeedbackResponses: number
}

// Full attainment result
export interface AttainmentResult {
  _id: string
  courseId: string
  coAttainments: COAttainment[]
  poAttainments: POAttainment[]
  generatedAt: string
  generatedBy: {
    _id: string
    name: string
    email: string
  }
  summary: AttainmentSummary
  warnings?: string[]
}

// Response for GET /api/attainment/:courseId
interface AttainmentResponse {
  success: boolean
  message: string
  data: {
    attainment: AttainmentResult | null
  }
}

// Response for POST /api/attainment/:courseId/calculate
interface AttainmentCalculateResponse {
  success: boolean
  message: string
  data: {
    attainment: AttainmentResult
    warnings: string[]
  }
}

// PO Summary for department
interface POSummaryItem {
  poNumber: string
  poName: string
  averageAttainment: number
  courseCount: number
  courses: Array<{
    courseCode: string
    value: number
  }>
}

// Course attainment for department report
interface CourseAttainment {
  courseId: string
  courseCode: string
  courseName: string
  facultyName: string
  avgCOAttainment: number
  avgPOAttainment: number
}

// Response for GET /api/attainment/department/summary
interface DepartmentSummaryResponse {
  success: boolean
  message: string
  data: {
    department: string
    academicYear: string
    courses: any[]
    courseAttainments: CourseAttainment[]
    poSummary: POSummaryItem[]
  }
}

// Response for GET /api/attainment/:courseId/co-comparison
interface COComparisonResponse {
  success: boolean
  message: string
  data: {
    coComparison: Array<{
      coNumber: string
      description: string
      directAttainment: number
      indirectAttainment: number
      finalAttainment: number
      successPercentage: number
    }>
  }
}

// Response for GET /api/attainment/:courseId/po-chart
interface POChartResponse {
  success: boolean
  message: string
  data: {
    poChart: Array<{
      poNumber: string
      poName: string
      attainmentValue: number
      level: string
      contributingCOs: number
    }>
  }
}

export const attainmentApi = {
  /**
   * Calculate Attainment - POST /api/attainment/:courseId/calculate
   * Access: Faculty (owner), Admin
   */
  calculate: async (courseId: string): Promise<AttainmentCalculateResponse> => {
    const response = await api.post<AttainmentCalculateResponse>(
      `/attainment/${courseId}/calculate`
    )
    return response.data
  },

  /**
   * Get Attainment Results - GET /api/attainment/:courseId
   * Access: Faculty, Admin
   */
  get: async (courseId: string): Promise<AttainmentResponse> => {
    const response = await api.get<AttainmentResponse>(`/attainment/${courseId}`)
    return response.data
  },

  /**
   * Get Department Summary - GET /api/attainment/department/summary
   * Access: Admin only
   */
  getDepartmentSummary: async (params?: {
    department?: string
    academicYear?: string
  }): Promise<DepartmentSummaryResponse> => {
    const response = await api.get<DepartmentSummaryResponse>(
      "/attainment/department/summary",
      { params }
    )
    return response.data
  },

  /**
   * Clear Attainment Data - DELETE /api/attainment/:courseId
   * Access: Admin only
   */
  clear: async (courseId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/attainment/${courseId}`)
    return response.data
  },

  /**
   * Get CO Comparison Data - GET /api/attainment/:courseId/co-comparison
   * Access: Faculty (owner), Admin
   */
  getCOComparison: async (courseId: string): Promise<COComparisonResponse> => {
    const response = await api.get<COComparisonResponse>(
      `/attainment/${courseId}/co-comparison`
    )
    return response.data
  },

  /**
   * Get PO Chart Data - GET /api/attainment/:courseId/po-chart
   * Access: Faculty (owner), Admin
   */
  getPOChart: async (courseId: string): Promise<POChartResponse> => {
    const response = await api.get<POChartResponse>(`/attainment/${courseId}/po-chart`)
    return response.data
  },
}
