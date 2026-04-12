"use client"

import { useQuery } from "@tanstack/react-query"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { coursesApi } from "@/api/courses.api"
import { DataTable } from "@/components/shared/DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ColumnDef } from "@tanstack/react-table"
import { Course } from "@/api/courses.api"
import { Eye, Users, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function AdminCoursesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-courses", page, search],
    queryFn: () => coursesApi.getAll({ page, limit: 10, search: search || undefined }),
  })

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "courseCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.getValue("courseCode")}</span>
      ),
    },
    {
      accessorKey: "courseName",
      header: "Course Name",
    },
    {
      id: "faculty",
      header: "Faculty",
      cell: ({ row }) => {
        const faculty = row.original.facultyId || row.original.faculty
        const facultyName = typeof faculty === 'object' ? faculty?.name : "Unassigned"
        return facultyName
      },
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "semester",
      header: "Semester",
      cell: ({ row }) => <span>Sem {row.getValue("semester")}</span>,
    },
    {
      accessorKey: "academicYear",
      header: "Year",
    },
    {
      id: "students",
      header: "Students",
      cell: ({ row }) => {
        const students = row.original.enrolledStudents || row.original.students || []
        const count = Array.isArray(students) ? students.length : 0
        return (
          <div className="flex items-center gap-1 text-slate-500">
            <Users className="h-3 w-3" />
            {count}
          </div>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("isActive") ? "default" : "secondary"}
          className={
            row.getValue("isActive")
              ? "bg-emerald-500 hover:bg-emerald-500"
              : "bg-slate-400"
          }
        >
          {row.getValue("isActive") ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={`/faculty/courses/${row.original._id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <AppLayout>
      <PageHeader
        title="All Courses"
        description="View all courses across the department"
      />

      {/* Search bar */}
      <div className="mb-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={{ pageIndex: page - 1, pageSize: 10 }}
        pageCount={data?.meta?.pagination?.totalPages || 1}
        onPageChange={(p) => setPage(p + 1)}
        emptyState={{
          title: "No courses found",
          description: "No courses have been created yet",
        }}
      />
    </AppLayout>
  )
}


