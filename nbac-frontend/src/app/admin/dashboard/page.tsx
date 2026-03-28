"use client"

import { useQuery } from "@tanstack/react-query"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { usersApi } from "@/api/users.api"
import { coursesApi } from "@/api/courses.api"
import { attainmentApi } from "@/api/attainment.api"
import { infrastructureApi } from "@/api/infrastructure.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, BookOpen, GraduationCap, BarChart3, Plus, ArrowRight, Building2 } from "lucide-react"
import Link from "next/link"
import { DepartmentSummaryChart } from "@/components/charts/DepartmentSummaryChart"
import { InfrastructureRatingChart } from "@/components/charts/InfrastructureRatingChart"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/utils"

interface POSummaryItem {
  poNumber: string
  averageAttainment?: number
  courseCount?: number
  courses?: unknown[]
  [key: string]: unknown
}

export default function AdminDashboard() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.getAll({ limit: 1000 }),
  })

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: () => coursesApi.getAll({ limit: 1000 }),
  })

  const { data: departmentSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ["department-summary"],
    queryFn: () => attainmentApi.getDepartmentSummary(),
  })

  const { data: infraData, isLoading: infraLoading } = useQuery({
    queryKey: ["admin-infra-summary"],
    queryFn: () => infrastructureApi.getAdminAnalytics(),
  })

  const users = usersData?.data || []
  const courses = coursesData?.data || []

  const facultyCount = users.filter((u) => u.role === "faculty").length
  const studentCount = users.filter((u) => u.role === "student").length
  const activeCourses = courses.filter((c) => c.isActive).length

  const attainments = departmentSummary?.data?.attainments || []
  const coursesWithAttainment = attainments.length

  const rawPoSummary: POSummaryItem[] = departmentSummary?.data?.poSummary || []
  const poChartData: Record<string, number | null> = rawPoSummary.reduce(
    (acc: Record<string, number | null>, item: POSummaryItem) => {
      if (item.poNumber) {
        const value = item.averageAttainment ?? null
        acc[item.poNumber] = value !== null && !isNaN(Number(value)) ? Number(value) : null
      }
      return acc
    },
    {}
  )
  const hasPoData = Object.keys(poChartData).length > 0

  const infraSummary = infraData?.data?.summary || []
  const hasInfraData = infraSummary.some((s) => s.totalResponses > 0)

  const recentCourses = [...courses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <AppLayout>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of your institution's accreditation data"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Faculty</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {usersLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{facultyCount}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {usersLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{studentCount}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {coursesLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{activeCourses}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Courses with Attainment</CardTitle>
            <BarChart3 className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {summaryLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{coursesWithAttainment}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Courses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Courses</CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentCourses.length === 0 ? (
              <EmptyState title="No courses yet" description="Create your first course to get started" icon={BookOpen} />
            ) : (
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <div key={course._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div>
                      <p className="font-medium">{course.courseCode}</p>
                      <p className="text-sm text-slate-500">{course.courseName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        {(course.facultyId && typeof course.facultyId === "object"
                          ? course.facultyId.name
                          : course.faculty?.name) || "Unassigned"}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(course.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/users" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add User
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/admin/reports/department" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" /> Department Report
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Department PO Attainment Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Department PO Attainment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : hasPoData ? (
            <DepartmentSummaryChart data={poChartData} />
          ) : (
            <EmptyState
              title="No attainment data"
              description="Calculate attainment for courses to see the department overview"
              icon={BarChart3}
            />
          )}
        </CardContent>
      </Card>

      {/* Infrastructure Feedback Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" />
            Infrastructure Facility Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {infraLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : hasInfraData ? (
            <div className="space-y-4">
              <InfrastructureRatingChart data={infraSummary} height={260} />
              <div className="grid grid-cols-3 gap-3 text-center">
                {infraSummary.map((facility) => (
                  <div key={facility.ratingType} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {facility.averageRating !== null ? `${facility.averageRating}★` : "—"}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {facility.ratingType.toLowerCase()} ({facility.totalResponses} responses)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="No infrastructure ratings yet"
              description="Students will submit ratings for Library, Transport, and Canteen facilities"
              icon={Building2}
            />
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}