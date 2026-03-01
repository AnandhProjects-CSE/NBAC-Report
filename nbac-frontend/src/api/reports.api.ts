import api from "@/lib/axios"

// Course info in reports
export interface CourseInfo {
  courseCode: string
  courseName: string
  department: string
  semester: number
  academicYear: string
  faculty: {
    _id: string
    name: string
    email: string
    department: string
  }
  credits?: number
}

// CO Attainment table row
export interface COAttainmentRow {
  coNumber: string
  description: string
  threshold: number
  studentsAttained: number
  totalStudents: number
  successPercentage: number
  directAttainment: number
  indirectAttainment: number
  finalAttainment: number
  attainmentLevel: string
}

// PO Attainment table row
export interface POAttainmentRow {
  poNumber: string
  poName: string
  attainmentValue: number
  attainmentLevel: string
  contributingCOs: number
  correlationWeight: number
}

// CO-PO Matrix in reports
export interface COPOMatrixRow {
  coNumber: string
  correlations: Record<string, number>
}

// Response for GET /api/reports/:courseId/co
interface COReportResponse {
  success: boolean
  message: string
  data: {
    report: {
      courseInfo: CourseInfo
      coAttainmentTable: COAttainmentRow[]
      summary: {
        totalCOs: number
        averageCOAttainment: number
        generatedAt: string
      }
    }
  }
}

// Response for GET /api/reports/:courseId/po
interface POReportResponse {
  success: boolean
  message: string
  data: {
    report: {
      courseInfo: CourseInfo
      poAttainmentTable: POAttainmentRow[]
      coPOMatrix: {
        rows: COPOMatrixRow[]
      }
      summary: {
        averagePOAttainment: number
        totalCOsContributing: number
      }
    }
  }
}

// Response for GET /api/reports/:courseId/full
interface FullReportResponse {
  success: boolean
  message: string
  data: {
    report: {
      courseInfo: CourseInfo
      coAttainment: {
        table: COAttainmentRow[]
        summary: {
          totalCOs: number
          averageCOAttainment: number
        }
      }
      coPOMatrix: COPOMatrixRow[]
      poAttainment: {
        table: POAttainmentRow[]
        summary: {
          averagePOAttainment: number
        }
      }
      feedbackSummary: {
        totalResponses: number
        responseRate: string
        coWiseRatings: Array<{
          coNumber: string
          averageRating: number
        }>
        overallAverageRating: string
      }
      assessments: {
        types: Array<{
          type: string
          uploadedAt: string
          totalRecords: number
          totalMaxMarks: number
        }>
        hasAllAssessments: boolean
      }
      generatedAt: string
      generatedBy: {
        _id: string
        name: string
        email: string
      }
      warnings: string[]
    }
  }
}

// Department report item
interface DepartmentReportCourse {
  courseId: string
  courseCode: string
  courseName: string
  facultyName: string
  semester: number
  academicYear: string
  coAttainment: Array<{
    coNumber: string
    attainment: number
  }>
  poAttainment: Array<{
    poNumber: string
    attainment: number
  }>
  avgCOAttainment: number
  avgPOAttainment: number
}

// Response for GET /api/reports/department
interface DepartmentReportResponse {
  success: boolean
  message: string
  data: {
    report: {
      department: string
      academicYear: string
      generatedAt: string
      courses: any[]
      courseAttainments: DepartmentReportCourse[]
      poSummary: Array<{
        poNumber: string
        poName: string
        averageAttainment: number
        courseCount: number
      }>
      overallSummary: {
        totalCourses: number
        coursesWithAttainment: number
        averageDepartmentPOAttainment: number
      }
    }
  }
}

// Export response
interface ExportResponse {
  title: string
  generatedAt: string
  course: {
    code: string
    name: string
    department: string
    semester: number
    academicYear: string
  }
  coAttainment: any[]
  poAttainment: any[]
  summary: any
}

export const reportsApi = {
  /**
   * Get CO Attainment Report - GET /api/reports/:courseId/co
   * Access: Faculty (owner), Admin
   */
  getCOReport: async (courseId: string): Promise<COReportResponse> => {
    const response = await api.get<COReportResponse>(`/reports/${courseId}/co`)
    return response.data
  },

  /**
   * Get PO Attainment Report - GET /api/reports/:courseId/po
   * Access: Faculty (owner), Admin
   */
  getPOReport: async (courseId: string): Promise<POReportResponse> => {
    const response = await api.get<POReportResponse>(`/reports/${courseId}/po`)
    return response.data
  },

  /**
   * Get Full NBA Report - GET /api/reports/:courseId/full
   * Access: Faculty (owner), Admin
   */
  getFullReport: async (courseId: string): Promise<FullReportResponse> => {
    const response = await api.get<FullReportResponse>(`/reports/${courseId}/full`)
    return response.data
  },

  /**
   * Get Department Report - GET /api/reports/department
   * Access: Admin only
   */
  getDepartmentReport: async (params?: {
    department?: string
    academicYear?: string
  }): Promise<DepartmentReportResponse> => {
    const response = await api.get<DepartmentReportResponse>("/reports/department", { params })
    return response.data
  },

  /**
   * Export Report - GET /api/reports/:courseId/export
   * Access: Faculty (owner), Admin
   */
  exportReport: async (courseId: string): Promise<ExportResponse> => {
    const response = await api.get<ExportResponse>(`/reports/${courseId}/export`)
    return response.data
  },
}
