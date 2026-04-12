import api from "@/lib/axios"

export interface FacultyInfo {
  _id: string
  name: string
  email: string
  department?: string
}

export interface StudentInfo {
  _id: string
  name: string
  email: string
  rollNumber?: string
  year?: number
  section?: string
}

export interface Course {
  _id: string
  courseCode: string
  courseName: string
  department: string
  semester: number
  academicYear: string
  facultyId?: FacultyInfo | string
  enrolledStudents?: StudentInfo[]
  isActive: boolean
  credits?: number
  description?: string
  createdAt: string
  updatedAt: string
}

// Response for GET /api/courses (list)
interface CourseListResponse {
  success: boolean
  message: string
  data: Course[]
  meta: {
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

// Response for GET /api/courses/:id
interface CourseDetailResponse {
  success: boolean
  message: string
  data: {
    course: Course
    coCount: number
    hasMatrix: boolean
    marksRecordsCount: number
    hasAttainment: boolean
    attainmentGeneratedAt?: string
  }
}

// Response for POST /api/courses (create)
interface CourseCreateResponse {
  success: boolean
  message: string
  data: {
    course: Course
    enrolledCount: number
  }
}

// Response for student's enrolled courses
interface StudentCoursesResponse {
  success: boolean
  message: string
  data: {
    courses: Array<{
      _id: string
      courseCode: string
      courseName: string
      semester: number
      academicYear: string
      facultyId: FacultyInfo
      credits?: number
    }>
    count: number
  }
}

// Query parameters for course list
interface CourseListParams {
  page?: number
  limit?: number
  semester?: number
  academicYear?: string
  department?: string
  facultyId?: string
  isActive?: boolean
  search?: string
}

export const coursesApi = {
  /**
   * Get All Courses - GET /api/courses
   * Access: Faculty, Admin
   * Note: Faculty sees only their own courses; Admin sees all.
   */
  getAll: async (params?: CourseListParams): Promise<CourseListResponse> => {
    const response = await api.get<CourseListResponse>("/courses", { params })
    return response.data
  },

  /**
   * Get Course by ID - GET /api/courses/:id
   * Access: Faculty (owner), Admin
   */
  getById: async (id: string): Promise<CourseDetailResponse> => {
    const response = await api.get<CourseDetailResponse>(`/courses/${id}`)
    return response.data
  },

  /**
   * Create Course - POST /api/courses
   * Access: Faculty, Admin
   */
  create: async (courseData: {
    courseCode: string
    courseName: string
    department: string
    semester: number
    academicYear: string
    facultyId: string
    credits?: number
    description?: string
    enrolledStudents?: string[]
  }): Promise<CourseCreateResponse> => {
    const response = await api.post<CourseCreateResponse>("/courses", courseData)
    return response.data
  },

  /**
   * Update Course - PATCH /api/courses/:id
   * Access: Faculty (owner), Admin
   */
  update: async (
    id: string,
    courseData: Partial<{
      courseCode: string
      courseName: string
      semester: number
      academicYear: string
      facultyId: string
      credits: number
      description: string
      isActive: boolean
    }>
  ): Promise<{ success: boolean; message: string; data: { course: Course } }> => {
    const response = await api.patch(`/courses/${id}`, courseData)
    return response.data
  },

  /**
   * Delete Course (Soft Delete) - DELETE /api/courses/:id
   * Access: Admin only
   */
  delete: async (id: string, force?: boolean): Promise<{ success: boolean; message: string }> => {
    const params = force ? { force: "true" } : {}
    const response = await api.delete(`/courses/${id}`, { params })
    return response.data
  },

  /**
   * Get Student's Enrolled Courses - GET /api/courses/student/my-courses
   * Access: Student only
   */
  getStudentCourses: async (): Promise<StudentCoursesResponse> => {
    const response = await api.get<StudentCoursesResponse>("/courses/student/my-courses")
    return response.data
  },

  /**
   * Enroll Students - POST /api/courses/:id/enroll
   * Access: Faculty (owner), Admin
   */
  enrollStudents: async (
    courseId: string,
    studentIds: string[]
  ): Promise<{
    success: boolean
    message: string
    data: {
      enrolledCount: number
      alreadyEnrolledCount: number
      invalidCount: number
      alreadyEnrolled: string[]
      invalidIds: string[]
    }
  }> => {
    const response = await api.post(`/courses/${courseId}/enroll`, { studentIds })
    return response.data
  },

  /**
   * Remove Student from Course - DELETE /api/courses/:id/enroll/:studentId
   * Access: Faculty (owner), Admin
   */
  removeStudent: async (
    courseId: string,
    studentId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/courses/${courseId}/enroll/${studentId}`)
    return response.data
  },
}
