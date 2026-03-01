"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { coursesApi } from "@/api/courses.api"
import { DataTable } from "@/components/shared/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/store/authStore"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ColumnDef } from "@tanstack/react-table"
import { Course } from "@/api/courses.api"
import { Plus, Pencil, Eye, Check, X, Loader2, BookOpen, Hash, Building2, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { DEPARTMENTS, SEMESTERS, getAcademicYears } from "@/lib/utils"

const courseSchema = z.object({
  courseCode: z
    .string()
    .min(2, "Course code must be at least 2 characters")
    .max(20, "Course code must be at most 20 characters")
    .transform((v) => v.toUpperCase()),
  courseName: z
    .string()
    .min(3, "Course name must be at least 3 characters")
    .max(100, "Course name must be at most 100 characters"),
  department: z.string().min(1, "Department is required"),
  semester: z.coerce.number().min(1).max(8),
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-YY (e.g., 2024-25)"),
})

type CourseFormValues = z.infer<typeof courseSchema>

export default function CourseListPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [page, setPage] = useState(1)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["faculty-courses", page],
    queryFn: async () => {
      const result = await coursesApi.getAll({ page, limit: 10 })
      console.log("Courses API Response:", result)
      return result
    },
  })

  // Extract courses array - handle multiple possible response formats
  const courses = Array.isArray(data?.data) 
    ? data.data 
    : Array.isArray(data) 
      ? data 
      : []
  console.log("Processed courses:", courses)

  const createMutation = useMutation({
    mutationFn: (data: CourseFormValues) => coursesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-courses"] })
      setSheetOpen(false)
      form.reset()
      toast.success("Course created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create course")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CourseFormValues> }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty-courses"] })
      setSheetOpen(false)
      setEditingCourse(null)
      form.reset()
      toast.success("Course updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update course")
    },
  })

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      courseCode: "",
      courseName: "",
      department: "",
      semester: 1,
      academicYear: getAcademicYears()[0],
    },
  })

  const handleOpenSheet = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      form.reset({
        courseCode: course.courseCode,
        courseName: course.courseName,
        department: course.department,
        semester: course.semester,
        academicYear: course.academicYear,
      })
    } else {
      setEditingCourse(null)
      form.reset({
        courseCode: "",
        courseName: "",
        department: "",
        semester: 1,
        academicYear: getAcademicYears()[0],
      })
    }
    setSheetOpen(true)
  }

  const handleSubmit = (values: CourseFormValues) => {
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse._id, data: values })
    } else {
      // Include facultyId from current user when creating a course
      createMutation.mutate({
        ...values,
        facultyId: user?._id || "",
      })
    }
  }

  const IconBoolean = ({ value }: { value: boolean }) =>
    value ? (
      <div className="flex items-center justify-center">
        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    ) : (
      <div className="flex items-center justify-center">
        <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <X className="h-3 w-3 text-slate-400" />
        </div>
      </div>
    )

  const columns: ColumnDef<Course>[] = [
    {
      accessorKey: "courseCode",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{row.getValue("courseCode")}</span>
      ),
    },
    {
      accessorKey: "courseName",
      header: "Course Name",
      cell: ({ row }) => (
        <div className="max-w-xs">
          <span className="truncate block">{row.getValue("courseName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "semester",
      header: "Sem",
      cell: ({ row }) => (
        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">
          Sem {row.getValue("semester")}
        </span>
      ),
    },
    {
      accessorKey: "academicYear",
      header: "Year",
      cell: ({ row }) => (
        <span className="text-slate-500">{row.getValue("academicYear")}</span>
      ),
    },
    {
      accessorKey: "students",
      header: "Students",
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-slate-500">
          <span className="font-medium text-slate-700 dark:text-slate-300">{Array.isArray(row.original.enrolledStudents) ? row.original.enrolledStudents.length : (Array.isArray(row.original.students) ? row.original.students.length : 0)}</span>
        </span>
      ),
    },
    {
      id: "cos",
      header: "COs",
      cell: ({ row }) => (
        <IconBoolean value={row.original.hasCOs} />
      ),
    },
    {
      id: "matrix",
      header: "Matrix",
      cell: ({ row }) => (
        <IconBoolean value={row.original.hasMatrix} />
      ),
    },
    {
      id: "marks",
      header: "Marks",
      cell: ({ row }) => (
        <IconBoolean value={row.original.hasMarks} />
      ),
    },
    {
      id: "attainment",
      header: "Attainment",
      cell: ({ row }) => (
        <IconBoolean value={row.original.hasAttainment} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Link href={`/faculty/courses/${row.original._id}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Eye className="h-3.5 w-3.5 mr-1" />
              View
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => handleOpenSheet(row.original)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      ),
    },
  ]

  const academicYears = getAcademicYears()

  return (
    <AppLayout>
      <PageHeader
        title="My Courses"
        description="Manage your courses and OBE data"
        actions={
          <Button
            onClick={() => handleOpenSheet()}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={courses}
        isLoading={isLoading}
        pagination={{ pageIndex: page - 1, pageSize: 10 }}
        pageCount={data?.meta?.pagination?.totalPages || 1}
        onPageChange={(p) => setPage(p + 1)}
        emptyState={{
          title: "No courses yet",
          description: "Create your first course to get started",
        }}
      />

      {/* Course Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <SheetTitle className="text-left">
                    {editingCourse ? "Edit Course" : "Create New Course"}
                  </SheetTitle>
                  <SheetDescription className="text-left mt-1">
                    {editingCourse
                      ? "Update course information"
                      : "Fill in the details to create a new course"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                {/* Course Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    Course Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="courseCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Code</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="CS501"
                                className="pl-9 font-mono uppercase bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <Select
                            onValueChange={(v) => field.onChange(parseInt(v))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SEMESTERS.map((sem) => (
                                <SelectItem key={sem} value={sem.toString()}>
                                  Semester {sem}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="courseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Data Structures and Algorithms" 
                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Academic Info Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Academic Information
                  </h3>

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academic Year</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                              <SelectValue placeholder="Select academic year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {academicYears.map((year) => (
                              <SelectItem key={year} value={year}>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                  {year}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                disabled={createMutation.isPending || updateMutation.isPending}
                onClick={form.handleSubmit(handleSubmit)}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  )
}
