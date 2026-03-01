"use client"

import { useQuery } from "@tanstack/react-query"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { feedbackApi } from "@/api/feedback.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, CheckCircle, Clock, Sparkles } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { getGreeting } from "@/lib/utils"
import { EmptyState } from "@/components/shared/EmptyState"

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const greeting = getGreeting()

  const { data: feedbackStatus, isLoading } = useQuery({
    queryKey: ["feedback-status"],
    queryFn: () => feedbackApi.getStudentStatus(),
  })

  // API returns: { data: { courses: [...], summary: { total, submitted, pending } } }
  const courses = feedbackStatus?.data?.courses || []
  const summary = feedbackStatus?.data?.summary
  const pendingCount = summary?.pending ?? courses.filter((c) => c.feedbackStatus === "pending").length
  const submittedCount = summary?.submitted ?? courses.filter((c) => c.feedbackStatus === "submitted").length

  return (
    <AppLayout>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] || "Student"}! 👋`}
        description="View your courses and submit feedback"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Enrolled Courses
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{courses.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Feedback Submitted
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{submittedCount}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pending Feedback
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <div>
        <h2 className="text-lg font-semibold mb-4">My Courses</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="No courses enrolled"
                description="You haven't been enrolled in any courses yet"
                icon={MessageSquare}
              />
            </CardContent>
          </Card>
        ) : pendingCount === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                  All caught up! 🎉
                </h3>
                <p className="text-slate-500 mt-1">
                  You&apos;ve submitted feedback for all your courses
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card key={course._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {course.courseCode}
                    </Badge>
                    {course.feedbackStatus === "submitted" ? (
                      <Badge className="bg-emerald-500 hover:bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                    {course.courseName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {course.faculty?.name || "N/A"}
                  </p>
                  {course.feedbackStatus === "pending" && (
                    <Link href={`/student/feedback/${course._id}`}>
                      <Button
                        className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-slate-900"
                      >
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
    </AppLayout>
  )
}
