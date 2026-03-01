import api from "@/lib/axios"

// Matrix row structure from API
export interface MatrixRow {
  coId?: string | { _id: string; coNumber: string; description: string }
  coNumber: string
  po1: number
  po2: number
  po3: number
  po4: number
  po5: number
  po6: number
  po7: number
  po8: number
  po9: number
  po10: number
  po11: number
  po12: number
}

// Matrix structure from API
export interface Matrix {
  _id: string
  courseId: string
  rows: MatrixRow[]
  updatedBy?: string
  createdAt: string
  updatedAt?: string
}

// PO Names mapping
export interface PONames {
  PO1: string
  PO2: string
  PO3: string
  PO4: string
  PO5: string
  PO6: string
  PO7: string
  PO8: string
  PO9: string
  PO10: string
  PO11: string
  PO12: string
}

// Response for GET /api/courses/:courseId/matrix
interface MatrixResponse {
  success: boolean
  message: string
  data: {
    matrix: Matrix | null
    poNames: PONames
  }
}

// Request body for POST /api/courses/:courseId/matrix
interface MatrixCreateRequest {
  rows: Array<{
    coId?: string
    coNumber: string
    po1: number
    po2: number
    po3: number
    po4: number
    po5: number
    po6: number
    po7: number
    po8: number
    po9: number
    po10: number
    po11: number
    po12: number
  }>
}

// Response for POST /api/courses/:courseId/matrix
interface MatrixCreateResponse {
  success: boolean
  message: string
  data: {
    matrix: Matrix
    poNames: PONames
  }
}

// Response for upload endpoint
interface MatrixUploadResponse {
  success: boolean
  message: string
  data: {
    matrix: Matrix
    summary: {
      totalCOs: number
      uploadedRows: number
      missingCOs: number
    }
  }
}

export const matrixApi = {
  /**
   * Get CO-PO Matrix - GET /api/courses/:courseId/matrix
   * Access: Faculty, Admin
   */
  get: async (courseId: string): Promise<MatrixResponse> => {
    const response = await api.get<MatrixResponse>(`/courses/${courseId}/matrix`)
    return response.data
  },

  /**
   * Create/Update CO-PO Matrix - POST /api/courses/:courseId/matrix
   * Access: Faculty (owner), Admin
   */
  create: async (
    courseId: string,
    rows: MatrixCreateRequest["rows"]
  ): Promise<MatrixCreateResponse> => {
    const response = await api.post<MatrixCreateResponse>(`/courses/${courseId}/matrix`, { rows })
    return response.data
  },

  /**
   * Upload Matrix via Excel - POST /api/courses/:courseId/matrix/upload
   * Access: Faculty (owner), Admin
   */
  upload: async (courseId: string, file: File): Promise<MatrixUploadResponse> => {
    const formData = new FormData()
    formData.append("file", file)
    const response = await api.post<MatrixUploadResponse>(
      `/courses/${courseId}/matrix/upload`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    )
    return response.data
  },

  /**
   * Download Matrix Template - GET /api/courses/:courseId/matrix/template
   * Access: Faculty, Admin
   */
  downloadTemplate: async (courseId: string): Promise<Blob> => {
    const response = await api.get(`/courses/${courseId}/matrix/template`, {
      responseType: "blob",
    })
    return response.data
  },
}
