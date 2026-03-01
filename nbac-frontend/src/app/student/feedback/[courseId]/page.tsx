"use client"

import { use, useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { AppLayout } from "@/components/layout/AppLayout"
import { PageHeader } from "@/components/layout/PageHeader"
import { feedbackApi } from "@/api/feedback.api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { Star, Loader2, CheckCircle, Info, ArrowLeft, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"

const feedbackSchema = z.object({
  ratings: z.record(z.string(), z.number().min(1).max(5)),
})

type FeedbackFormValues = z.infer<typeof feedbackSchema>

// CO for feedback - we expect the backend to return this
interface COForFeedback {
  _id: string
  coNumber: string
  description: string
}

export default function FeedbackFormPage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [submitted, setSubmitted] = useState(false)

  // Get feedback status for this course - this is a student-accessible endpoint
  const { data: feedbackStatus, isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ["feedback-status", resolvedParams.courseId],
    queryFn: () => feedbackApi.getCourseStatus(resolvedParams.courseId),
    retry: false,
  })

  // The backend should return COs for pending feedback
  // We'll check if courseOs is in the response
  const courseInfo = feedbackStatus?.data
  const isSubmitted = feedbackStatus?.data?.hasSubmitted || submitted
  const existingFeedback = feedbackStatus?.data?.feedback
  
  // COs for rating - if backend returns them
  const cos: COForFeedback[] = (feedbackStatus?.data as any)?.cos || []
  
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      ratings: {},
    },
  })

  // Initialize ratings when COs load
  useEffect(() => {
    if (Array.isArray(cos) && cos.length > 0 && !isSubmitted) {
      const initialRatings: Record<string, number> = {}
      cos.forEach((co) => {
        initialRatings[co.coNumber] = 0
      })
      form.reset({ ratings: initialRatings })
    }
  }, [cos, isSubmitted, form])

  const submitMutation = useMutation({
    mutationFn: (responses: Array<{ coId: string; rating: number }>) =>
      feedbackApi.submit(resolvedParams.courseId, responses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-status"] })
      queryClient.invalidateQueries({ queryKey: ["feedback-status", resolvedParams.courseId] })
      setSubmitted(true)
      toast.success("Feedback submitted successfully!")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit feedback")
    },
  })

  const handleRatingChange = (coNumber: string, rating: number) => {
    form.setValue(`ratings.${coNumber}`, rating)
  }

  const onSubmit = (values: FeedbackFormValues) => {
    // Map coNumber to coId for API submission
    const coIdMap = new Map(cos.map((co) => [co.coNumber, co._id]))
    const responses = Object.entries(values.ratings).map(([coNumber, rating]) => ({
      coId: coIdMap.get(coNumber) || coNumber,
      rating,
    }))

    // Check if all ratings are provided
    const hasAllRatings = responses.every((r) => r.rating > 0)
    if (!hasAllRatings) {
      toast.error("Please provide ratings for all course outcomes")
      return
    }

    submitMutation.mutate(responses)
  }

  if (statusLoading) {
    return (
      <AppLayout>
        <LoadingSkeleton type="detail" />
      </AppLayout>
    )
  }

  if (statusError) {
    const errorMessage = (statusError as any)?.response?.data?.message ||
                         (statusError as any)?.message ||
                         "You may not be enrolled in this course or it doesn't exist"
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <EmptyState
            title="Unable to Load Course"
            description={errorMessage}
          />
          <Link href="/student/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  if (!courseInfo) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <EmptyState
            title="Course not found"
            description="You are not enrolled in this course or it doesn't exist"
          />
          <Link href="/student/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Course Feedback"
        description={`Provide your feedback for ${courseInfo.courseCode} - ${courseInfo.courseName}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/student/dashboard" },
          { label: courseInfo.courseCode },
        ]}
      />

      {/* Info Alert */}
      <Alert className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle>Your feedback matters</AlertTitle>
        <AlertDescription>
          Your ratings help us improve the course and measure learning outcomes. 
          All responses are anonymous and will be used for academic improvement purposes only.
        </AlertDescription>
      </Alert>

      {isSubmitted ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Feedback Already Submitted
              </h2>
              <p className="text-slate-500 mt-2 mb-6">
                Thank you for your feedback! You can view your submitted ratings below.
              </p>
              
              {existingFeedback && (
                <div className="max-w-lg mx-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="px-4 py-3 text-left">CO</th>
                        <th className="px-4 py-3 text-center">Your Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(existingFeedback?.responses) && existingFeedback.responses.map((rating: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                          <td className="px-4 py-3 font-medium">{rating.coNumber}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={cn(
                                    "h-5 w-5",
                                    star <= rating.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-slate-300"
                                  )}
                                />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <Link href="/student/dashboard">
                <Button className="mt-6">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : cos.length === 0 ? (
        // No COs available - backend needs to provide them
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Course Outcomes Not Available
              </h2>
              <p className="text-slate-500 mt-2 mb-6 max-w-md mx-auto">
                The course outcomes for this course are not yet available for feedback. 
                Please contact your faculty or try again later.
              </p>
              <Link href="/student/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{courseInfo.courseCode}</CardTitle>
              <CardDescription>{courseInfo.courseName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {cos.map((co) => {
                  const currentRating = form.watch(`ratings.${co.coNumber}`) || 0
                  
                  return (
                    <div
                      key={co._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <p className="font-mono text-sm text-amber-600 mb-1">
                          {co.coNumber}
                        </p>
                        <p className="text-slate-700 dark:text-slate-300">
                          {co.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRatingChange(co.coNumber, star)}
                            className="p-1 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
                          >
                            <Star
                              className={cn(
                                "h-7 w-7 transition-colors",
                                star <= currentRating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-300 hover:text-amber-300"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-end gap-3 mt-8">
                <Link href="/student/dashboard">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitMutation.isPending || cos.length === 0}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                >
                  {submitMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </AppLayout>
  )
}
