"use client"

import { useState, use, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { coursesApi } from "@/api/courses.api"
import { coApi } from "@/api/co.api"
import { matrixApi } from "@/api/matrix.api"
import { marksApi } from "@/api/marks.api"
import { attainmentApi } from "@/api/attainment.api"
import { usersApi } from "@/api/users.api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileUploadZone } from "@/components/shared/FileUploadZone"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { AttainmentBadge } from "@/components/shared/AttainmentBadge"
import { COAttainmentChart } from "@/components/charts/COAttainmentChart"
import { POAttainmentChart } from "@/components/charts/POAttainmentChart"
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  Upload,
  Download,
  Calculator,
  AlertTriangle,
  FileSpreadsheet,
  Eye,
  Printer,
  Hash,
  Percent,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ASSESSMENT_TYPES, MATRIX_COLORS, PO_DESCRIPTIONS } from "@/lib/utils"

// CO Form Schema
const coSchema = z.object({
  coNumber: z.string().regex(/^CO\d+$/, "Format: CO1, CO2, etc."),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  threshold: z.coerce.number().min(0).max(100),
})

type COFormValues = z.infer<typeof coSchema>

// PO numbers constant
const PO_NUMBERS = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12"]

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview")
  const [coSheetOpen, setCoSheetOpen] = useState(false)
  const [editingCO, setEditingCO] = useState<any>(null)
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<string>("")
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [marksViewDialogOpen, setMarksViewDialogOpen] = useState(false)
  const [selectedMarks, setSelectedMarks] = useState<any>(null)
  const [deleteCoDialogOpen, setDeleteCoDialogOpen] = useState(false)
  const [coToDelete, setCoToDelete] = useState<string | null>(null)
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false)
  const [deleteMarksDialogOpen, setDeleteMarksDialogOpen] = useState(false)
  const [marksToDelete, setMarksToDelete] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)

  // Fetch course data
  const { data: courseData, isLoading: courseLoading, error: courseError } = useQuery({
    queryKey: ["course", resolvedParams.id],
    queryFn: () => coursesApi.getById(resolvedParams.id),
    retry: false,
  })

  const { data: cosData, isLoading: cosLoading, refetch: refetchCOs, error: cosError } = useQuery({
    queryKey: ["cos", resolvedParams.id],
    queryFn: () => coApi.getAll(resolvedParams.id),
    refetchOnMount: true,
    staleTime: 0,
  })

  const { data: matrixData, isLoading: matrixLoading } = useQuery({
    queryKey: ["matrix", resolvedParams.id],
    queryFn: () => matrixApi.get(resolvedParams.id),
  })

  const { data: marksData, isLoading: marksLoading } = useQuery({
    queryKey: ["marks", resolvedParams.id],
    queryFn: () => marksApi.getAll(resolvedParams.id),
  })

  const { data: attainmentData, isLoading: attainmentLoading } = useQuery({
    queryKey: ["attainment", resolvedParams.id],
    queryFn: () => attainmentApi.get(resolvedParams.id),
  })

  const { data: unenrolledStudents } = useQuery({
    queryKey: ["unenrolled-students", resolvedParams.id],
    queryFn: () => usersApi.getUnenrolledStudents(resolvedParams.id),
    enabled: enrollDialogOpen,
  })

  // Fetch full marks detail when View Records dialog is open
  const { data: marksDetailData, isLoading: marksDetailLoading } = useQuery({
    queryKey: ["marks-detail", resolvedParams.id, selectedMarks?._id],
    queryFn: () => marksApi.getById(resolvedParams.id, selectedMarks!._id),
    enabled: marksViewDialogOpen && !!selectedMarks?._id,
  })
  const marksDetail = marksDetailData?.data?.marks

  // Extract course data - API returns { data: { course, coCount, hasMatrix, ... } }
  const course = courseData?.data?.course || null
  const courseMetadata = courseData?.data

  // Handle nested response format: { data: { course, cos, count } }
  const cos = Array.isArray(cosData?.data?.cos) ? cosData.data.cos : []

  // Matrix data - API returns { data: { matrix: { rows: [...] }, poNames: {...} } }
  const matrix = matrixData?.data?.matrix || null
  const poNames = matrixData?.data?.poNames || null

  // Marks data - API returns { data: { course, marks: [...], count } }
  const marks = Array.isArray(marksData?.data?.marks) ? marksData.data.marks : []

  // Attainment data - API returns { data: { attainment: {...} } }
  const attainment = attainmentData?.data?.attainment || null

  // CO Form
  const coForm = useForm<COFormValues>({
    resolver: zodResolver(coSchema),
    defaultValues: {
      coNumber: `CO${cos.length + 1}`,
      description: "",
      threshold: 60,
    },
  })

  // Mutations
  const createCOMutation = useMutation({
    mutationFn: (data: COFormValues) => coApi.create(resolvedParams.id, data),
    onSuccess: async () => {
      await refetchCOs()
      setCoSheetOpen(false)
      coForm.reset({ coNumber: `CO${cos.length + 2}`, description: "", threshold: 60 })
      toast.success("CO created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create CO")
    },
  })

  const updateCOMutation = useMutation({
    mutationFn: ({ coId, data }: { coId: string; data: Partial<COFormValues> }) =>
      coApi.update(resolvedParams.id, coId, data),
    onSuccess: async () => {
      await refetchCOs()
      setCoSheetOpen(false)
      setEditingCO(null)
      toast.success("CO updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update CO")
    },
  })

  const deleteCOMutation = useMutation({
    mutationFn: (coId: string) => coApi.delete(resolvedParams.id, coId),
    onSuccess: async () => {
      await refetchCOs()
      setDeleteCoDialogOpen(false)
      setCoToDelete(null)
      toast.success("CO deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete CO")
    },
  })

  const enrollStudentsMutation = useMutation({
    mutationFn: (studentIds: string[]) =>
      coursesApi.enrollStudents(resolvedParams.id, studentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course", resolvedParams.id] })
      queryClient.invalidateQueries({ queryKey: ["unenrolled-students", resolvedParams.id] })
      setEnrollDialogOpen(false)
      setSelectedStudents([])
      toast.success("Students enrolled successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to enroll students")
    },
  })

  const uploadMarksMutation = useMutation({
    mutationFn: ({ assessmentType, file }: { assessmentType: string; file: File }) =>
      marksApi.upload(resolvedParams.id, assessmentType, file),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["marks", resolvedParams.id] })
      const data = response?.data
      const errors = data?.errors || []
      const skipped = data?.skippedStudents || []
      const warnings = data?.warnings || []

      if (errors.length > 0) {
        // Some question columns were skipped due to CO not found
        setUploadResult({ errors, skipped, warnings, summary: data?.summary })
        // Don't close dialog — show result inside it
        toast.warning(
          `Marks saved, but ${errors.length} column(s) were skipped. Check the upload summary for details.`
        )
      } else {
        // Clean upload
        setUploadResult(null)
        setUploadDialogOpen(false)
        setUploadFile(null)
        setSelectedAssessment("")
        toast.success(
          `Marks uploaded successfully — ${data?.summary?.totalStudents ?? ""} students, ${data?.marks?.totalQuestions ?? ""} questions saved.`
        )
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload marks")
    },
  })

  const deleteMarksMutation = useMutation({
    mutationFn: (marksId: string) => marksApi.delete(resolvedParams.id, marksId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marks", resolvedParams.id] })
      setDeleteMarksDialogOpen(false)
      setMarksToDelete(null)
      toast.success("Marks deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete marks")
    },
  })

  const calculateAttainmentMutation = useMutation({
    mutationFn: () => attainmentApi.calculate(resolvedParams.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attainment", resolvedParams.id] })
      setCalculateDialogOpen(false)
      toast.success("Attainment calculated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to calculate attainment")
    },
  })

  // =====================================================
  // MATRIX STATE - FIXED VERSION
  // =====================================================

  // Matrix state - stores matrix as { CO1: { PO1: 3, PO2: 2, ... }, ... }
  const [matrixValues, setMatrixValues] = useState<Record<string, Record<string, number>>>({})

  // ✅ FIX: Initialize matrixValues from existing matrix data when loaded
  useEffect(() => {
    if (matrix?.rows && Array.isArray(matrix.rows)) {
      const initialValues: Record<string, Record<string, number>> = {}

      // Initialize ALL COs from the course with default 0 values
      cos.forEach((co: any) => {
        initialValues[co.coNumber] = {}
        PO_NUMBERS.forEach((po) => {
          initialValues[co.coNumber][po] = 0
        })
      })

      // Fill in existing values from matrix
      matrix.rows.forEach((row: any) => {
        if (!initialValues[row.coNumber]) {
          // CO exists in matrix but not in cos array (edge case)
          initialValues[row.coNumber] = {}
        }
        PO_NUMBERS.forEach((po) => {
          const poKey = `po${po.slice(2)}` as keyof typeof row // po1, po2, etc.
          initialValues[row.coNumber][po] = (row[poKey] as number) || 0
        })
      })

      setMatrixValues(initialValues)
      console.log("Matrix initialized from server:", initialValues)
    } else if (cos.length > 0) {
      // No existing matrix, initialize with zeros for all COs
      const initialValues: Record<string, Record<string, number>> = {}
      cos.forEach((co: any) => {
        initialValues[co.coNumber] = {}
        PO_NUMBERS.forEach((po) => {
          initialValues[co.coNumber][po] = 0
        })
      })
      setMatrixValues(initialValues)
      console.log("Matrix initialized with zeros:", initialValues)
    }
  }, [matrix, cos])

  // Compute matrix value for display
  const getMatrixValue = (coNumber: string, po: string): number => {
    // Return from matrixValues (which is now initialized from server data)
    if (matrixValues[coNumber]?.[po] !== undefined) {
      return matrixValues[coNumber][po]
    }
    // Fallback to existing matrix from API
    if (matrix?.rows && Array.isArray(matrix.rows)) {
      const row = matrix.rows.find((r: any) => r.coNumber === coNumber)
      if (row) {
        const poKey = `po${po.slice(2)}` as keyof typeof row
        return (row[poKey] as number) || 0
      }
    }
    return 0
  }

  const handleOpenCOSheet = (co?: any) => {
    if (co) {
      setEditingCO(co)
      coForm.reset({
        coNumber: co.coNumber,
        description: co.description,
        threshold: co.threshold,
      })
    } else {
      setEditingCO(null)
      coForm.reset({
        coNumber: `CO${cos.length + 1}`,
        description: "",
        threshold: 60,
      })
    }
    setCoSheetOpen(true)
  }

  const handleCOSubmit = (values: COFormValues) => {
    if (editingCO) {
      updateCOMutation.mutate({ coId: editingCO._id, data: values })
    } else {
      createCOMutation.mutate(values)
    }
  }

  // ✅ FIX: Handle matrix change - ensure the CO entry exists
  const handleMatrixChange = (co: string, po: string, value: number) => {
    setMatrixValues((prev) => ({
      ...prev,
      [co]: {
        ...(prev[co] || {}), // Ensure the CO object exists
        [po]: value,
      },
    }))
  }

  // ✅ FIX: Convert matrixValues to rows format for API - includes ALL COs
  const convertMatrixToRows = () => {
    return cos.map((co: any) => {
      const row: any = {
        coId: co._id,
        coNumber: co.coNumber,
      }

      // Get ALL PO values for this CO
      PO_NUMBERS.forEach((po) => {
        const poKey = `po${po.slice(2)}` // po1, po2, etc.

        // Get value from matrixValues (which now contains ALL values)
        let value = 0
        if (matrixValues[co.coNumber]?.[po] !== undefined) {
          value = matrixValues[co.coNumber][po]
        } else if (matrix?.rows && Array.isArray(matrix.rows)) {
          // Fallback to existing matrix data
          const existingRow = matrix.rows.find((r: any) => r.coNumber === co.coNumber)
          if (existingRow) {
            value = (existingRow[poKey as keyof typeof existingRow] as number) || 0
          }
        }

        row[poKey] = value
      })

      return row
    })
  }

  const saveMatrixMutation = useMutation({
    mutationFn: () => {
      const rows = convertMatrixToRows()
      console.log("Saving matrix rows:", rows)
      return matrixApi.create(resolvedParams.id, rows)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matrix", resolvedParams.id] })
      toast.success("Matrix saved successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save matrix")
    },
  })

  const uploadMatrixMutation = useMutation({
    mutationFn: (file: File) => matrixApi.upload(resolvedParams.id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matrix", resolvedParams.id] })
      toast.success("Matrix uploaded successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to upload matrix")
    },
  })

  // =====================================================
  // END MATRIX STATE FIX
  // =====================================================

  if (courseLoading) {
    return (
      <AppLayout>
        <LoadingSkeleton type="detail" />
      </AppLayout>
    )
  }

  if (courseError) {
    const errorMessage = (courseError as any)?.response?.data?.message ||
      (courseError as any)?.message ||
      "An error occurred while loading the course"
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <EmptyState
            title="Error Loading Course"
            description={errorMessage}
          />
          <Link href="/faculty/courses">
            <Button variant="outline">
              Back to Courses
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <EmptyState
            title="Course not found"
            description="The course you're looking for doesn't exist or you don't have access"
          />
          <Link href="/faculty/courses">
            <Button variant="outline">
              Back to Courses
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  // Check readiness
  const hasCOs = cos.length > 0
  const hasMatrix = !!matrix
  const hasMarks = marks.length > 0
  const hasAttainment = !!attainment

  return (
    <AppLayout>
      <PageHeader
        title={course.courseCode}
        description={course.courseName}
        breadcrumbs={[
          { label: "Courses", href: "/faculty/courses" },
          { label: course.courseCode },
        ]}
        actions={
          <Link href={`/faculty/courses/${resolvedParams.id}/report`}>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              View Report
            </Button>
          </Link>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cos">Course Outcomes</TabsTrigger>
          <TabsTrigger value="matrix">CO-PO Matrix</TabsTrigger>
          <TabsTrigger value="marks">Marks Upload</TabsTrigger>
          <TabsTrigger value="attainment">Attainment</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Course Code</p>
                    <p className="font-medium">{course.courseCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Course Name</p>
                    <p className="font-medium">{course.courseName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Department</p>
                    <p className="font-medium">{course.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Faculty</p>
                    <p className="font-medium">{(course.facultyId && typeof course.facultyId === 'object' ? course.facultyId.name : course.faculty?.name) || "Unassigned"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Semester</p>
                    <p className="font-medium">Semester {course.semester}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Academic Year</p>
                    <p className="font-medium">{course.academicYear}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Readiness Checklist</CardTitle>
                <CardDescription>Requirements for attainment calculation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  {hasCOs ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <X className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={hasCOs ? "" : "text-slate-400"}>COs Defined</span>
                </div>
                <div className="flex items-center gap-3">
                  {hasMatrix ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <X className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={hasMatrix ? "" : "text-slate-400"}>CO-PO Matrix Set</span>
                </div>
                <div className="flex items-center gap-3">
                  {hasMarks ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <X className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={hasMarks ? "" : "text-slate-400"}>Marks Uploaded</span>
                </div>
                <div className="flex items-center gap-3">
                  {hasAttainment ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <X className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={hasAttainment ? "" : "text-slate-400"}>Attainment Calculated</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Enrolled Students</CardTitle>
                  <CardDescription>{(course.enrolledStudents?.length || course.students?.length || 0)} students enrolled</CardDescription>
                </div>
                <Button onClick={() => setEnrollDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enroll Students
                </Button>
              </CardHeader>
              <CardContent>
                {((course.enrolledStudents?.length || course.students?.length || 0) === 0) ? (
                  <EmptyState
                    title="No students enrolled"
                    description="Enroll students to start tracking their progress"
                    icon={Users}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Array.isArray(course.enrolledStudents) && course.enrolledStudents.slice(0, 12).map((student: any) => (
                      <div
                        key={student._id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm"
                      >
                        <p className="font-medium truncate">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    ))}
                    {Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 12 && (
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm flex items-center justify-center">
                        +{course.enrolledStudents.length - 12} more
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Course Outcomes Tab */}
        <TabsContent value="cos">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Course Outcomes</CardTitle>
                <CardDescription>Define the learning outcomes for this course</CardDescription>
              </div>
              <Button onClick={() => handleOpenCOSheet()}>
                <Plus className="h-4 w-4 mr-2" />
                Add CO
              </Button>
            </CardHeader>
            <CardContent>
              {cosLoading ? (
                <LoadingSkeleton type="list" rows={3} />
              ) : cos.length === 0 ? (
                <EmptyState
                  title="No COs defined"
                  description="Add your first course outcome to get started"
                  action={
                    <Button onClick={() => handleOpenCOSheet()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First CO
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {cos.map((co: any) => (
                    <div
                      key={co._id}
                      className="flex items-start justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono">
                            {co.coNumber}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Threshold: {co.threshold}%
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          {co.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenCOSheet(co)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setCoToDelete(co._id)
                            setDeleteCoDialogOpen(true)
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CO-PO Matrix Tab */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>CO-PO Correlation Matrix</CardTitle>
              <CardDescription>
                Map each Course Outcome to Program Outcomes with correlation strength (0-3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cosLoading ? (
                <LoadingSkeleton type="table" rows={5} columns={13} />
              ) : cos.length === 0 ? (
                <EmptyState
                  title="Define COs first"
                  description="You need to define Course Outcomes before setting up the matrix"
                />
              ) : (
                <div className="space-y-4">
                  {/* Matrix Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                            CO / PO
                          </th>
                          {PO_NUMBERS.map((po) => (
                            <th
                              key={po}
                              className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center"
                            >
                              {po}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cos.map((co: any) => (
                          <tr key={co._id}>
                            <td className="p-2 border border-slate-200 dark:border-slate-700 font-medium">
                              {co.coNumber}
                            </td>
                            {PO_NUMBERS.map((po) => {
                              const value = getMatrixValue(co.coNumber, po)
                              const textColorClass = value >= 2
                                ? "text-white"
                                : value === 1
                                  ? "text-blue-900 dark:text-blue-100"
                                  : "text-slate-900 dark:text-slate-100"

                              const cycleValue = () => {
                                const newValue = (value + 1) % 4 as 0 | 1 | 2 | 3
                                handleMatrixChange(co.coNumber, po, newValue)
                              }

                              return (
                                <td
                                  key={po}
                                  onClick={cycleValue}
                                  className={`p-0 border border-slate-200 dark:border-slate-700 text-center cursor-pointer select-none hover:opacity-80 transition-opacity ${MATRIX_COLORS[value as keyof typeof MATRIX_COLORS]}`}
                                >
                                  <div className={`h-8 w-10 flex items-center justify-center font-bold ${textColorClass}`}>
                                    {value}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-500">Correlation:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-white border rounded" />
                      <span>0 (None)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-200 rounded" />
                      <span>1 (Low)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-400 rounded" />
                      <span>2 (Medium)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded" />
                      <span>3 (High)</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => saveMatrixMutation.mutate()}
                      disabled={saveMatrixMutation.isPending}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    >
                      {saveMatrixMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Save Matrix
                    </Button>
                    <FileUploadZone
                      onFileAccepted={(file) => {
                        uploadMatrixMutation.mutate(file)
                      }}
                      label="Upload Matrix Excel"
                      selectedFile={null}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marks Upload Tab */}
        <TabsContent value="marks">
          <div className="space-y-4">
            {ASSESSMENT_TYPES.map((assessment) => {
              const marksRecord = marks.find(
                (m: any) => m.assessmentType === assessment.id
              )

              return (
                <Card key={assessment.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{assessment.label}</CardTitle>
                      {marksRecord && (
                        <CardDescription>
                          {marksRecord.studentCount} students • Uploaded{" "}
                          {new Date(marksRecord.uploadedAt).toLocaleDateString()}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {marksRecord ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMarks(marksRecord)
                              setMarksViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Records
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => {
                              setMarksToDelete(marksRecord._id)
                              setDeleteMarksDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssessment(assessment.id)
                            setUploadDialogOpen(true)
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              )
            })}

            {marks.length === 0 && (
              <EmptyState
                title="No marks uploaded"
                description="Upload marks for each assessment type to calculate attainment"
                icon={FileSpreadsheet}
              />
            )}
          </div>
        </TabsContent>

        {/* Attainment Tab */}
        <TabsContent value="attainment">
          <div className="space-y-6">
            {/* Calculate Button */}
            {!hasAttainment && (
              <Card>
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Calculate Attainment</h3>
                      <p className="text-sm text-slate-500">
                        Calculate CO and PO attainment based on marks and feedback
                      </p>
                    </div>
                    <Button
                      onClick={() => setCalculateDialogOpen(true)}
                      disabled={!hasCOs || !hasMatrix || !hasMarks}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Attainment
                    </Button>
                  </div>
                  {(!hasCOs || !hasMatrix || !hasMarks) && (
                    <Alert className="mt-4" variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Requirements not met</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside text-sm">
                          {!hasCOs && <li>Define Course Outcomes</li>}
                          {!hasMatrix && <li>Set up CO-PO Matrix</li>}
                          {!hasMarks && <li>Upload marks for at least one assessment</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {attainmentLoading ? (
              <LoadingSkeleton type="chart" />
            ) : attainment ? (
              <>
                {/* Warnings */}
                {Array.isArray(attainment?.warnings) && attainment.warnings.length > 0 && (
                  <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>Warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside text-sm">
                        {attainment.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* CO Attainment */}
                <Card>
                  <CardHeader>
                    <CardTitle>CO Attainment</CardTitle>
                    <CardDescription>
                      How well students achieved each Course Outcome (CO), measured on a scale of 0–3
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Explanation box */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                      <div>
                        <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">🎯 Direct Attainment</p>
                        <p className="text-slate-600 dark:text-slate-400">Based on marks scored by students in internal, external and assignment assessments. Reflects actual exam performance.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-violet-600 dark:text-violet-400 mb-1">💬 Indirect Attainment</p>
                        <p className="text-slate-600 dark:text-slate-400">Based on student feedback/perception ratings (1–5 scale). Reflects how confident students feel about achieving the outcome.</p>
                      </div>
                      <div>
                        <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">📊 Final Attainment</p>
                        <p className="text-slate-600 dark:text-slate-400">Combined score: <strong>75% Direct + 25% Indirect</strong>. This is the NBA-standard final CO attainment value.</p>
                      </div>
                    </div>
                    {/* Attainment level legend */}
                    <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500">
                      <span className="font-medium">Attainment Level:</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-200" />0 — Not attained (&lt;50% students passed)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-yellow-200" />1 — Low (50–59%)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-blue-200" />2 — Medium (60–69%)</span>
                      <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-green-200" />3 — High (≥70%)</span>
                    </div>
                    <COAttainmentChart
                      data={Array.isArray(attainment?.coAttainments) ? attainment.coAttainments.map((co: any) => ({
                        coNumber: co.coNumber,
                        direct: co.directAttainment,
                        indirect: co.indirectAttainment,
                        final: co.finalAttainment,
                      })) : []}
                    />
                  </CardContent>
                </Card>

                {/* PO Attainment */}
                <Card>
                  <CardHeader>
                    <CardTitle>PO Attainment</CardTitle>
                    <CardDescription>
                      How well the course contributes to each Program Outcome (PO), derived from CO attainment and the CO-PO matrix
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Explanation box */}
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm space-y-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">🔗 How PO Attainment is Calculated</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Each <strong>Program Outcome (PO)</strong> is a broad graduate-level skill (e.g., problem-solving, ethics, teamwork).
                        PO attainment is computed as a <strong>weighted average of the CO attainments</strong>, where the weight is the
                        correlation value from your CO-PO matrix (0 = no link, 1 = low, 2 = medium, 3 = strong link).
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        A PO with <strong>N/A</strong> means no CO in this course has a non-zero correlation to that PO — it is not assessed by this course.
                      </p>
                    </div>
                    {/* Attainment level legend */}
                    <div className="flex flex-wrap items-center gap-4 px-1 text-xs text-slate-500">
                      <span className="font-medium">Attainment Level:</span>
                      <span>0 — Not attained</span>
                      <span>1 — Low</span>
                      <span>2 — Medium</span>
                      <span>3 — High</span>
                    </div>
                    <POAttainmentChart
                      data={Array.isArray(attainment?.poAttainments) ? attainment.poAttainments.map((po: any) => ({
                        poNumber: po.poNumber,
                        attainment: po.attainmentValue ?? po.attainment ?? null,
                      })) : []}
                    />
                  </CardContent>
                </Card>

                {/* Recalculate */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setCalculateDialogOpen(true)}
                  >
                    <Calculator className="h-4 w-4 mr-2" />
                    Recalculate Attainment
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      {/* CO Form Sheet */}
      <Sheet open={coSheetOpen} onOpenChange={setCoSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <SheetTitle className="text-left">
                    {editingCO ? "Edit Course Outcome" : "Add Course Outcome"}
                  </SheetTitle>
                  <SheetDescription className="text-left mt-1">
                    {editingCO ? "Update the course outcome details" : "Define a new learning outcome for this course"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <Form {...coForm}>
              <form onSubmit={coForm.handleSubmit(handleCOSubmit)} className="space-y-5">
                {/* CO Details Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                    Outcome Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={coForm.control}
                      name="coNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CO Number</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                placeholder="CO1"
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
                      control={coForm.control}
                      name="threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Threshold (%)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={coForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Describe what students will be able to do after completing this outcome..."
                            className="flex min-h-[100px] w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-slate-500 mt-1">
                          Describe the learning outcome in clear, measurable terms
                        </p>
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
                onClick={() => setCoSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900"
                disabled={createCOMutation.isPending || updateCOMutation.isPending}
                onClick={coForm.handleSubmit(handleCOSubmit)}
              >
                {(createCOMutation.isPending || updateCOMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingCO ? "Update CO" : "Create CO"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Enroll Students Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Students</DialogTitle>
            <DialogDescription>
              Select students to enroll in this course
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-64">
            {!Array.isArray(unenrolledStudents?.data?.students) || unenrolledStudents.data.students.length === 0 ? (
              <EmptyState title="No students available" description="All students are already enrolled" />
            ) : (
              <div className="space-y-2">
                {unenrolledStudents.data.students.map((student: any) => (
                  <label
                    key={student._id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedStudents.includes(student._id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, student._id])
                        } else {
                          setSelectedStudents(selectedStudents.filter((id) => id !== student._id))
                        }
                      }}
                    />
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => enrollStudentsMutation.mutate(selectedStudents)}
              disabled={selectedStudents.length === 0 || enrollStudentsMutation.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {enrollStudentsMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Enroll ({selectedStudents.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Marks Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { setUploadDialogOpen(open); if (!open) setUploadResult(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Marks</DialogTitle>
            <DialogDescription>
              Upload an Excel file with student marks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show result summary if upload had errors */}
            {uploadResult ? (
              <div className="space-y-3">
                <Alert variant="destructive" className="bg-amber-50 dark:bg-amber-900/20 border-amber-300 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Some columns were skipped</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2 text-sm">
                      {uploadResult.errors.length} column(s) in your Excel were skipped because the referenced CO(s) don't exist in this course.
                      The marks that <em>were</em> saved are recorded, but incomplete.
                    </p>
                    <div className="rounded-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 divide-y divide-amber-100 dark:divide-amber-900 text-xs mt-2 max-h-40 overflow-y-auto">
                      {uploadResult.errors.map((e: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2">
                          <span className="font-mono font-semibold shrink-0">Col {e.column}:</span>
                          <span className="text-slate-700 dark:text-slate-300">{e.label} — {e.message}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs">
                      ✅ <strong>Fix:</strong> Go to the <strong>Course Outcomes</strong> tab, add the missing COs (e.g. CO3, CO4, CO5),
                      then delete this uploaded record and re-upload the Excel.
                    </div>
                  </AlertDescription>
                </Alert>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setUploadResult(null); setUploadDialogOpen(false) }}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <FileUploadZone
                  onFileAccepted={setUploadFile}
                  selectedFile={uploadFile}
                  onClear={() => setUploadFile(null)}
                />
                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Expected Format:</p>
                  <code className="text-xs">
                    StudentID | Q1_CO1 | Q2_CO1 | Q3_CO2 | ... (Row 2: Max marks)
                  </code>
                  <p className="text-xs text-slate-500 mt-1">
                    ⚠️ Make sure all COs referenced in the Excel (CO1, CO2…) are already defined in the <strong>Course Outcomes</strong> tab.
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (uploadFile && selectedAssessment) {
                        uploadMarksMutation.mutate({
                          assessmentType: selectedAssessment,
                          file: uploadFile,
                        })
                      }
                    }}
                    disabled={!uploadFile || uploadMarksMutation.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                  >
                    {uploadMarksMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Upload
                  </Button>

                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Marks Dialog */}
      <Dialog open={marksViewDialogOpen} onOpenChange={setMarksViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Marks Records — {selectedMarks?.assessmentType}</DialogTitle>
            <DialogDescription>
              {selectedMarks?.totalRecords} student records • {selectedMarks?.originalFileName}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            {marksDetailLoading ? (
              <div className="flex items-center justify-center h-24 text-slate-400">Loading records...</div>
            ) : marksDetail?.records && marksDetail.records.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Roll No</th>
                    <th className="p-2 text-left">Student</th>
                    {marksDetail.records[0]?.questionWiseMarks?.map((q: any) => (
                      <th key={q.questionNo} className="p-2 text-center">
                        {q.questionNo}
                        <span className="block text-xs text-slate-400">/{q.maxMarks}</span>
                      </th>
                    ))}
                    <th className="p-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {marksDetail.records.map((row: any, i: number) => {
                    const total = row.questionWiseMarks?.reduce((sum: number, q: any) => sum + q.marksObtained, 0) ?? 0
                    const maxTotal = row.questionWiseMarks?.reduce((sum: number, q: any) => sum + q.maxMarks, 0) ?? 0
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                        <td className="p-2 font-mono text-xs">{row.rollNumber}</td>
                        <td className="p-2">{row.studentId?.name ?? "—"}</td>
                        {row.questionWiseMarks?.map((q: any, j: number) => (
                          <td key={j} className="p-2 text-center">{q.marksObtained}</td>
                        ))}
                        <td className="p-2 text-center font-medium">{total}/{maxTotal}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-24 text-slate-400">No records found.</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete CO Dialog */}
      <ConfirmDialog
        open={deleteCoDialogOpen}
        onOpenChange={setDeleteCoDialogOpen}
        onConfirm={() => coToDelete && deleteCOMutation.mutate(coToDelete)}
        title="Delete Course Outcome"
        description="Are you sure you want to delete this CO? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteCOMutation.isPending}
      />

      {/* Calculate Attainment Dialog */}
      <ConfirmDialog
        open={calculateDialogOpen}
        onOpenChange={setCalculateDialogOpen}
        onConfirm={() => calculateAttainmentMutation.mutate()}
        title="Calculate Attainment"
        description="This will calculate CO and PO attainment based on uploaded marks and feedback. Previous results will be overwritten."
        confirmLabel="Calculate"
        variant="warning"
        loading={calculateAttainmentMutation.isPending}
      />

      {/* Delete Marks Dialog */}
      <ConfirmDialog
        open={deleteMarksDialogOpen}
        onOpenChange={setDeleteMarksDialogOpen}
        onConfirm={() => marksToDelete && deleteMarksMutation.mutate(marksToDelete)}
        title="Delete Marks Record"
        description="Are you sure you want to delete this marks record? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMarksMutation.isPending}
      />
    </AppLayout>
  )
}