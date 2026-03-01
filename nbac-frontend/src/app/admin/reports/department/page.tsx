"use client"

import { useQuery } from "@tanstack/react-query"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { reportsApi } from "@/api/reports.api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DepartmentSummaryChart } from "@/components/charts/DepartmentSummaryChart"
import { AttainmentBadge } from "@/components/shared/AttainmentBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { BarChart3 } from "lucide-react"
import { PO_DESCRIPTIONS } from "@/lib/utils"

export default function DepartmentReportPage() {
  const { data: departmentData, isLoading, error } = useQuery({
    queryKey: ["department-report"],
    queryFn: () => reportsApi.getDepartmentReport(),
  })

  // ✅ FIX: Backend returns { data: { report: { department, courses, poSummary, ... } } }
  // NOT a plain array — it's a nested report object
  const report = departmentData?.data?.report

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader
          title="Department Report"
          description="PO attainment summary across all courses"
        />
        <div className="space-y-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    )
  }

  // ✅ FIX: Check the actual report object and its meaningful contents
  const courseAttainments = report?.courseAttainments || []
  const poSummary = report?.poSummary || []
  const courses = report?.courses || []
  const overallSummary = report?.overallSummary

  const hasData = poSummary.length > 0 || courseAttainments.length > 0

  if (error || !report || !hasData) {
    return (
      <AppLayout>
        <PageHeader
          title="Department Report"
          description="PO attainment summary across all courses"
        />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="No data available"
              description="Calculate attainment for courses to generate the department report"
              icon={BarChart3}
            />
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  const poNumbers = [
    "PO1","PO2","PO3","PO4","PO5","PO6",
    "PO7","PO8","PO9","PO10","PO11","PO12",
  ]

  // ✅ FIX: Backend already computes averages in poSummary — just transform to chart format
  // poSummary shape: [{ poNumber: "PO1", averageAttainment: 2.56, ... }]
  // DepartmentSummaryChart expects: Record<string, number | null>
  const poChartData: Record<string, number | null> = poNumbers.reduce(
    (acc, po) => {
      const found = poSummary.find((p: any) => p.poNumber === po)
      acc[po] = found?.averageAttainment ?? null
      return acc
    },
    {} as Record<string, number | null>
  )

  return (
    <AppLayout>
      <PageHeader
        title="Department Report"
        description="PO attainment summary across all courses"
      />

      {/* Overall Summary Stats */}
      {overallSummary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{overallSummary.totalCourses}</p>
              <p className="text-sm text-slate-500 mt-1">Total Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{overallSummary.coursesWithAttainment}</p>
              <p className="text-sm text-slate-500 mt-1">Courses with Attainment</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">
                {overallSummary.averageDepartmentPOAttainment?.toFixed(2) ?? "N/A"}
              </p>
              <p className="text-sm text-slate-500 mt-1">Avg Department PO Attainment</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PO Attainment Overview Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Department PO Attainment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentSummaryChart data={poChartData} />
        </CardContent>
      </Card>

      {/* Course-wise Summary */}
      {courseAttainments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Course-wise Attainment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Course</th>
                    <th className="px-4 py-3 text-left font-medium">Faculty</th>
                    <th className="px-4 py-3 text-center font-medium">Avg CO Attainment</th>
                    <th className="px-4 py-3 text-center font-medium">Avg PO Attainment</th>
                  </tr>
                </thead>
                <tbody>
                  {courseAttainments.map((course: any, index: number) => (
                    <tr
                      key={course.courseId || course._id || index}
                      className={
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-900"
                          : "bg-slate-50 dark:bg-slate-800/50"
                      }
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{course.courseCode}</p>
                          <p className="text-xs text-slate-500">{course.courseName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {course.faculty?.name || course.facultyName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <AttainmentBadge
                          level={Math.round(course.averageCOAttainment || 0)}
                          size="sm"
                        />
                        <span className="ml-2 text-xs text-slate-500">
                          ({(course.averageCOAttainment || 0).toFixed(2)})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <AttainmentBadge
                          level={Math.round(course.averagePOAttainment || 0)}
                          size="sm"
                        />
                        <span className="ml-2 text-xs text-slate-500">
                          ({(course.averagePOAttainment || 0).toFixed(2)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed PO Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>PO-wise Department Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {poNumbers.map((po) => {
              const poData = poSummary.find((p: any) => p.poNumber === po)
              const value = poData?.averageAttainment ?? null
              return (
                <div
                  key={po}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{po}</span>
                    <AttainmentBadge
                      level={value !== null ? Math.round(value) : null}
                      size="sm"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    {poData?.poName || PO_DESCRIPTIONS[po]}
                  </p>
                  <p className="text-lg font-semibold">
                    {value !== null ? value.toFixed(2) : "N/A"}
                  </p>
                  {poData?.courseCount !== undefined && (
                    <p className="text-xs text-slate-400 mt-1">
                      {poData.courseCount} course{poData.courseCount !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  )
}