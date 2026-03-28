"use client"

import { useState, type ElementType } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { feedbackApi } from "@/api/feedback.api"
import { infrastructureApi, type RatingType, type SubmitRatingPayload } from "@/api/infrastructure.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  MessageSquare,
  CheckCircle,
  Clock,
  Sparkles,
  Library,
  Bus,
  UtensilsCrossed,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { getGreeting, getAcademicYears } from "@/lib/utils"
import { EmptyState } from "@/components/shared/EmptyState"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// ─── Infrastructure Rating Card ─────────────────────────────────────────────

interface InfraCardProps {
  type: RatingType
  label: string
  icon: ElementType
  color: string
  existingRating: number | null
  semester: number
  academicYear: string
  department: string
  onSuccess: () => void
}

function InfraRatingCard({
  type,
  label,
  icon: Icon,
  color,
  existingRating,
  semester,
  academicYear,
  department,
  onSuccess,
}: InfraCardProps) {
  const [hovered, setHovered] = useState<number>(0)
  const [selected, setSelected] = useState<number>(existingRating ?? 0)
  const [isEditing, setIsEditing] = useState(false)

  const submitMutation = useMutation({
    mutationFn: (payload: SubmitRatingPayload) =>
      existingRating !== null
        ? infrastructureApi.updateRating({
          ratingType: payload.ratingType,
          rating: payload.rating,
          semester: payload.semester,
          academicYear: payload.academicYear,
        })
        : infrastructureApi.submitRating(payload),
    onSuccess: () => {
      toast.success(`${label} rating ${existingRating !== null ? "updated" : "submitted"}!`)
      setIsEditing(false)
      onSuccess()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || `Failed to submit ${label} rating`)
    },
  })

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select a rating (1–5)")
      return
    }
    submitMutation.mutate({ ratingType: type, rating: selected, semester, academicYear, department })
  }

  const canEdit = existingRating !== null && !isEditing
  const showForm = existingRating === null || isEditing

  return (
    <Card className="relative overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
      <div className={cn("absolute top-0 left-0 w-1 h-full", color)} />
      <CardHeader className="pb-2 pl-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", `text-${color.split("-")[1]}-500`)} />
            <CardTitle className="text-base font-semibold">{label}</CardTitle>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => { setIsEditing(true); setSelected(existingRating) }}
            >
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pl-5">
        {canEdit ? (
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-5 w-5",
                  star <= existingRating
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300 dark:text-slate-600"
                )}
              />
            ))}
            <span className="ml-2 text-sm text-slate-500">{existingRating}/5 (Submitted)</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className="flex items-center gap-1 mt-1"
              onMouseLeave={() => setHovered(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onClick={() => setSelected(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      star <= (hovered || selected)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300 dark:text-slate-600 hover:text-amber-300"
                    )}
                  />
                </button>
              ))}
              {selected > 0 && (
                <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  {selected}/5
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 h-8 text-xs"
                disabled={!selected || submitMutation.isPending}
                onClick={handleSubmit}
              >
                {submitMutation.isPending ? "Submitting..." : isEditing ? "Update" : "Submit"}
              </Button>
              {isEditing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => { setIsEditing(false); setSelected(existingRating ?? 0) }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const INFRA_FACILITIES = [
  { type: "LIBRARY" as RatingType, label: "Library Facilities", icon: Library, color: "bg-indigo-500" },
  { type: "TRANSPORT" as RatingType, label: "Transport Facilities", icon: Bus, color: "bg-sky-500" },
  { type: "CANTEEN" as RatingType, label: "Canteen Facilities", icon: UtensilsCrossed, color: "bg-orange-500" },
]

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const greeting = getGreeting()
  const queryClient = useQueryClient()

  const { data: feedbackStatus, isLoading } = useQuery({
    queryKey: ["feedback-status"],
    queryFn: () => feedbackApi.getStudentStatus(),
  })

  const courses = feedbackStatus?.data?.courses || []

  // Determine current semester/year from enrolled courses (use first course's data)
  // Fallback defaults if no courses
  const currentSemester = courses.length > 0
    ? (courses[0].course?.semester || courses[0].semester || 1)
    : 1
  const currentAcademicYear = courses.length > 0
    ? (courses[0].course?.academicYear || courses[0].academicYear || getAcademicYears()[0])
    : getAcademicYears()[0]
  const department = user?.department || ""

  const { data: infraData, isLoading: infraLoading } = useQuery({
    queryKey: ["infra-ratings", currentSemester, currentAcademicYear],
    queryFn: () => infrastructureApi.getMyRatings(currentSemester, currentAcademicYear),
    enabled: !!user && !!feedbackStatus, // Only fetch after we have course data to know the semester
  })

  const summary = feedbackStatus?.data?.summary
  const pendingCount = summary?.pending ?? courses.filter((c: any) => c.feedbackStatus === "pending").length
  const submittedCount = summary?.submitted ?? courses.filter((c: any) => c.feedbackStatus === "submitted").length

  const infraRatings = infraData?.data?.ratings || {}

  const handleInfraSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["infra-ratings"] })
  }

  return (
    <AppLayout>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] || "Student"}! 👋`}
        description="View your courses, submit feedback, and rate campus facilities"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Enrolled Courses</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{courses.length}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Feedback Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{submittedCount}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Pending Feedback</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{pendingCount}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">My Courses</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState title="No courses enrolled" description="You haven't been enrolled in any courses yet" icon={MessageSquare} />
            </CardContent>
          </Card>
        ) : pendingCount === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">All caught up! 🎉</h3>
                <p className="text-slate-500 mt-1">You&apos;ve submitted feedback for all your courses</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course: any) => (
              <Card key={course._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="font-mono">{course.courseCode}</Badge>
                    {course.feedbackStatus === "submitted" ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{course.courseName}</h3>
                  <p className="text-sm text-slate-500 mt-1">{course.faculty?.name || "N/A"}</p>
                  {course.feedbackStatus === "pending" && (
                    <Link href={`/student/feedback/${course._id}`}>
                      <Button className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900">
                        Submit Feedback
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Infrastructure Feedback */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Infrastructure Feedback</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Rate campus facilities for Semester {currentSemester} ({currentAcademicYear})
            </p>
          </div>
        </div>

        {infraLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {INFRA_FACILITIES.map((facility) => {
              const existing = infraRatings[facility.type]
              return (
                <InfraRatingCard
                  key={facility.type}
                  type={facility.type}
                  label={facility.label}
                  icon={facility.icon}
                  color={facility.color}
                  existingRating={existing ? existing.rating : null}
                  semester={currentSemester}
                  academicYear={currentAcademicYear}
                  department={department}
                  onSuccess={handleInfraSuccess}
                />
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
