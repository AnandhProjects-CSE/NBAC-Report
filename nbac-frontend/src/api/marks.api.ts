import api from "@/lib/axios"

// Assessment types supported by the backend
export type AssessmentType = "internal1" | "internal2" | "assignment" | "external"

// Uploaded by info
interface UploadedBy {
  _id: string
  name: string
  email: string
}

// Question-wise marks in records
interface QuestionMarks {
  questionNo: string
  marksObtained: number
  maxMarks: number
  mappedCO: {
    _id: string
    coNumber: string
    description: string
  }
}

// Student record in marks
interface StudentRecord {
  studentId: {
    _id: string
    name: string
    rollNumber: string
  }
  rollNumber: string
  questionWiseMarks: QuestionMarks[]
}

// Marks record structure
export interface MarksRecord {
  _id: string
  courseId: string
  assessmentType: AssessmentType
  uploadedBy: UploadedBy
  uploadedAt: string
  isProcessed: boolean
  totalMaxMarks: number
  totalRecords: number
  totalQuestions?: number
  originalFileName?: string
  records?: StudentRecord[]
}

// Response for GET /api/courses/:courseId/marks
interface MarksListResponse {
  success: boolean
  message: string
  data: {
    course: {
      _id: string
      courseCode: string
      courseName: string
    }
    marks: MarksRecord[]
    count: number
  }
}

// Response for GET /api/courses/:courseId/marks/:marksId
interface MarksDetailResponse {
  success: boolean
  message: string
  data: {
    marks: MarksRecord
  }
}

// Response for POST /api/courses/:courseId/marks/upload
interface MarksUploadResponse {
  success: boolean
  message: string
  data: {
    marks: MarksRecord
    summary: {
      totalStudents: number
      skippedStudents: number
      cosCovered: number
      cosNotCovered: number
    }
    warnings: string[]
    skippedStudents: Array<{
      row: number
      rollNumber: string
      reason: string
    }>
  }
}

// Response for GET /api/courses/:courseId/marks/summary
interface MarksSummaryResponse {
  success: boolean
  message: string
  data: {
    studentSummary: Array<{
      student: {
        _id: string
        name: string
        rollNumber: string
      }
      assessments: Record<AssessmentType, {
        obtained: number
        max: number
        percentage: string
      }>
    }>
    assessmentTypes: AssessmentType[]
  }
}

export const marksApi = {
  /**
   * Get All Marks Records - GET /api/courses/:courseId/marks
   * Access: Faculty (owner), Admin
   */
  getAll: async (courseId: string): Promise<MarksListResponse> => {
    const response = await api.get<MarksListResponse>(`/courses/${courseId}/marks`)
    return response.data
  },

  /**
   * Get Specific Marks Record - GET /api/courses/:courseId/marks/:marksId
   * Access: Faculty (owner), Admin
   */
  getById: async (courseId: string, marksId: string): Promise<MarksDetailResponse> => {
    const response = await api.get<MarksDetailResponse>(`/courses/${courseId}/marks/${marksId}`)
    return response.data
  },

  /**
   * Upload Marks via Excel - POST /api/courses/:courseId/marks/upload
   * Access: Faculty (owner), Admin
   */
  upload: async (
    courseId: string,
    assessmentType: AssessmentType,
    file: File
  ): Promise<MarksUploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("assessmentType", assessmentType)
    const response = await api.post<MarksUploadResponse>(
      `/courses/${courseId}/marks/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data
  },

  /**
   * Get Marks Summary - GET /api/courses/:courseId/marks/summary
   * Access: Faculty (owner), Admin
   */
  getSummary: async (courseId: string): Promise<MarksSummaryResponse> => {
    const response = await api.get<MarksSummaryResponse>(`/courses/${courseId}/marks/summary`)
    return response.data
  },

  /**
   * Get Marks Template - GET /api/courses/:courseId/marks/template
   * Access: Faculty, Admin
   */
  downloadTemplate: async (courseId: string): Promise<Blob> => {
    const response = await api.get(`/courses/${courseId}/marks/template`, {
      responseType: "blob",
    })
    return response.data
  },

  /**
   * Delete Marks Record - DELETE /api/courses/:courseId/marks/:marksId
   * Access: Faculty (owner), Admin
   */
  delete: async (
    courseId: string,
    marksId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/courses/${courseId}/marks/${marksId}`)
    return response.data
  },
}
