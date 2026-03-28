import api from "@/lib/axios"

export type RatingType = "LIBRARY" | "TRANSPORT" | "CANTEEN"

export interface InfraRating {
    _id: string
    studentId: string
    ratingType: RatingType
    rating: number
    semester: number
    academicYear: string
    department: string
    comments?: string
    createdAt: string
}

export interface InfraRatingSummary {
    ratingType: RatingType
    averageRating: number | null
    totalResponses: number
    ratingDistribution?: number[]
}

export interface SubmitRatingPayload {
    ratingType: RatingType
    rating: number
    semester: number
    academicYear: string
    department: string
    comments?: string
}

export const infrastructureApi = {
    /**
     * Submit a new infrastructure rating (student only)
     * POST /api/infrastructure/rate
     */
    submitRating: async (payload: SubmitRatingPayload) => {
        const response = await api.post("/infrastructure/rate", payload)
        return response.data
    },

    /**
     * Update an existing infrastructure rating (student only)
     * PATCH /api/infrastructure/rate
     */
    updateRating: async (payload: Omit<SubmitRatingPayload, "department">) => {
        const response = await api.patch("/infrastructure/rate", payload)
        return response.data
    },

    /**
     * Get current student's ratings for a semester/year
     * GET /api/infrastructure/my-ratings?semester=1&academicYear=2024-25
     */
    getMyRatings: async (semester: number, academicYear: string) => {
        const response = await api.get("/infrastructure/my-ratings", {
            params: { semester, academicYear },
        })
        return response.data as {
            success: boolean
            data: {
                ratings: Record<RatingType, InfraRating | null>
                totalSubmitted: number
                totalTypes: number
            }
        }
    },

    /**
     * Get aggregated summary (all authenticated users)
     * GET /api/infrastructure/summary
     */
    getSummary: async (params?: {
        department?: string
        semester?: number
        academicYear?: string
    }) => {
        const response = await api.get("/infrastructure/summary", { params })
        return response.data as {
            success: boolean
            data: { summary: InfraRatingSummary[] }
        }
    },

    /**
     * Get admin analytics (admin only)
     * GET /api/infrastructure/admin
     */
    getAdminAnalytics: async (params?: {
        department?: string
        semester?: number
        academicYear?: string
    }) => {
        const response = await api.get("/infrastructure/admin", { params })
        return response.data as {
            success: boolean
            data: {
                summary: InfraRatingSummary[]
                departmentBreakdown: Array<{
                    department: string
                    ratingType: RatingType
                    averageRating: number
                    totalResponses: number
                }>
                totalUniqueRespondents: number
                appliedFilters: Record<string, string>
            }
        }
    },
}
