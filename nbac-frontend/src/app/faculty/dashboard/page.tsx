"use client"

import { useQuery } from "@tanstack/react-query"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { coursesApi } from "@/api/courses.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Calculator, Plus, ArrowRight, CheckCircle, Circle } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/store/authStore"
import { getGreeting, formatDate } from "@/lib/utils"
import { EmptyState } from "@/components/shared/EmptyState"

export default function FacultyDashboard() {
  const { user } = useAuthStore()
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ["faculty-courses"],
    queryFn: () => coursesApi.getAll({ limit: 100 }),
  })

  const courses = coursesData?.data || []

  // Calculate stats
  const totalStudents = courses.reduce(
    (sum, course) => {
      const students = course.enrolledStudents || course.students || []
      return sum + (Array.isArray(students) ? students.length : 0)
    },
    0
  )
  
  const pendingCalculations = courses.filter((course) => {
    // Courses without attainment calculated - we'll need to check this
    return true // Placeholder - would need attainment data per course
  }).length

  const today = new Date()
  const greeting = getGreeting()

  return (
    <AppLayout>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] || "Faculty"}`}
        description={formatDate(today)}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              My Courses
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
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
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalStudents}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Semester
            </CardTitle>
            <Calculator className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {courses[0]?.academicYear || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Cards */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">My Courses</h2>
          <Link href="/faculty/courses">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <EmptyState
                title="No courses yet"
                description="Create your first course to start managing OBE data"
                icon={BookOpen}
                action={
                  <Link href="/faculty/courses">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Course
                    </Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.slice(0, 6).map((course) => (
              <Card key={course._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="font-mono">
                      {course.courseCode}
                    </Badge>
                    <div className="h-2 w-2 rounded-full bg-emerald-500" title="Attainment calculated" />
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                    {course.courseName}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                    <span>Sem {course.semester}</span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : (Array.isArray(course.students) ? course.students.length : 0)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/faculty/courses/${course._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Manage
                      </Button>
                    </Link>
                    <Link href={`/faculty/courses/${course._id}?tab=marks`} className="flex-1">
                      <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900">
                        Upload Marks
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
