"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "@/api/reports.api"
import { Button } from "@/components/ui/button"
import { AttainmentBadge } from "@/components/shared/AttainmentBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import { ArrowLeft, Printer, AlertTriangle, ClipboardList, GitBranch, FileSpreadsheet, BarChart2 } from "lucide-react"
import Link from "next/link"
import { PO_DESCRIPTIONS, MATRIX_COLORS } from "@/lib/utils"
import { AppLayout } from "@/components/layout/AppLayout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Map known backend error messages to helpful UI guidance
const REPORT_ERROR_STEPS: { match: string; title: string; description: string; step: string }[] = [
  {
    match: "no attainment data",
    title: "Attainment Not Calculated Yet",
    description: "The report can't be generated because attainment hasn't been calculated for this course. Please complete all the required steps first.",
    step: "attainment",
  },
  {
    match: "no matrix",
    title: "CO-PO Matrix Missing",
    description: "The CO-PO correlation matrix hasn't been set up yet. Please go to the Matrix tab and fill in the correlations before generating the report.",
    step: "matrix",
  },
  {
    match: "no marks",
    title: "No Marks Uploaded",
    description: "No assessment marks have been uploaded for this course yet. Please upload marks before calculating attainment.",
    step: "marks",
  },
  {
    match: "no course outcome",
    title: "Course Outcomes Missing",
    description: "No Course Outcomes (COs) have been defined yet. Please add COs before proceeding.",
    step: "cos",
  },
]

const COMPLETION_STEPS = [
  { key: "cos", label: "Define Course Outcomes (COs)", tab: "cos" },
  { key: "matrix", label: "Set up CO-PO Matrix", tab: "matrix" },
  { key: "marks", label: "Upload Assessment Marks", tab: "marks" },
  { key: "attainment", label: "Calculate Attainment", tab: "attainment" },
]

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["full-report", resolvedParams.id],
    queryFn: () => reportsApi.getFullReport(resolvedParams.id),
    retry: false,
  })

  // API returns: { success, message, data: { report: {...} } }
  const report = reportData?.data?.report

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <AppLayout>
        <LoadingSkeleton type="detail" />
      </AppLayout>
    )
  }

  if (error) {
    const apiMessage: string =
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      ""
    const lowerMessage = apiMessage.toLowerCase()
    const matched = REPORT_ERROR_STEPS.find((e) => lowerMessage.includes(e.match))

    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-10 space-y-6">
          <Link href={`/faculty/courses/${resolvedParams.id}`}>
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </Link>

          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              {matched ? matched.title : "Report Not Available"}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 mt-1">
              {matched
                ? matched.description
                : apiMessage || "This report could not be generated. Please ensure all steps below are completed."}
            </AlertDescription>
          </Alert>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Complete these steps to generate the report:
            </h3>
            <ol className="space-y-3">
              {COMPLETION_STEPS.map((step, i) => {
                const isBlocker = matched?.step === step.key
                return (
                  <li key={step.key} className="flex items-center gap-3">
                    <span
                      className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${isBlocker
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 ring-2 ring-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                    >
                      {i + 1}
                    </span>
                    <span className={`flex-1 text-sm ${isBlocker ? "font-semibold text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}>
                      {step.label}
                      {isBlocker && (
                        <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </span>
                    <Link href={`/faculty/courses/${resolvedParams.id}?tab=${step.tab}`}>
                      <Button
                        size="sm"
                        variant={isBlocker ? "default" : "ghost"}
                        className={isBlocker ? "bg-amber-500 hover:bg-amber-600 text-slate-900" : "text-slate-500"}
                      >
                        Go
                      </Button>
                    </Link>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!report) {
    return (
      <AppLayout>
        <EmptyState
          title="Report not available"
          description="Calculate attainment to generate the report"
        />
      </AppLayout>
    )
  }

  const poNumbers = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12"]

  const courseInfo = report.courseInfo
  const coAttainmentTable = report.coAttainment?.table || []
  const poAttainmentTable = report.poAttainment?.table || []
  const coPOMatrix = report.coPOMatrix || []
  const feedbackSummary = report.feedbackSummary || {}
  const assessments = report.assessments || {}
  const warnings = report.warnings || []

  return (
    <AppLayout>
      <div className="print-p-0 print-bg-white">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6 print-hide">
          <Link href={`/faculty/courses/${resolvedParams.id}`}>
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Course
            </Button>
          </Link>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Warnings</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside text-sm">
                {warnings.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Report Content */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg print-shadow-none print-rounded-none">
          {/* Report Header */}
          <div className="border-b border-slate-200 dark:border-slate-700 p-8 print-p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                NBA Accreditation Report
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Outcome Based Education (OBE) Attainment Report
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-slate-500">Course Code</p>
                <p className="font-semibold">{courseInfo?.courseCode || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Course Name</p>
                <p className="font-semibold">{courseInfo?.courseName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Faculty</p>
                <p className="font-semibold">{courseInfo?.faculty?.name || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Department</p>
                <p className="font-semibold">{courseInfo?.department || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Semester</p>
                <p className="font-semibold">{courseInfo?.semester || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Academic Year</p>
                <p className="font-semibold">{courseInfo?.academicYear || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="p-8 print-p-4 space-y-8">
            {/* Section 1: Course Outcomes */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                1. Course Outcomes
              </h2>
              {coAttainmentTable.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="p-3 text-left border border-slate-200 dark:border-slate-700">CO</th>
                      <th className="p-3 text-left border border-slate-200 dark:border-slate-700">Description</th>
                      <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Threshold (%)</th>
                      <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Success %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coAttainmentTable.map((co: any) => (
                      <tr key={co.coNumber}>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 font-mono">{co.coNumber}</td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700">{co.description || "N/A"}</td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">{co.threshold}%</td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                          {co.successPercentage?.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 text-sm">No course outcomes data available</p>
              )}
            </section>

            {/* Section 2: CO-PO Matrix */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                2. CO-PO Correlation Matrix
              </h2>
              {coPOMatrix.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                          CO / PO
                        </th>
                        {poNumbers.map((po) => (
                          <th
                            key={po}
                            className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center"
                          >
                            {po}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coPOMatrix.map((row: any) => (
                        <tr key={row.coNumber}>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 font-mono">
                            {row.coNumber}
                          </td>
                          {poNumbers.map((po) => {
                            // ✅ FIX: Backend returns PO values as flat keys on the row object
                            // e.g. { coNumber: "CO1", PO1: 2, PO2: 1, ... }
                            // NOT as row.correlations.PO1 — that nested shape doesn't exist
                            const value = Number(row[po] ?? 0)
                            const textColorClass =
                              value >= 2
                                ? "text-white"
                                : value === 1
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-slate-900 dark:text-slate-100"

                            return (
                              <td
                                key={po}
                                className={`p-2 border border-slate-200 dark:border-slate-700 text-center ${
                                  MATRIX_COLORS[value as keyof typeof MATRIX_COLORS] || ""
                                }`}
                              >
                                <span className={textColorClass}>{value}</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No CO-PO matrix data available</p>
              )}
            </section>

            {/* Section 3: Assessment Summary */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                3. Assessment Summary
              </h2>
              {assessments?.types?.length > 0 ? (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="p-3 text-left border border-slate-200 dark:border-slate-700">Assessment Type</th>
                      <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Records</th>
                      <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Max Marks</th>
                      <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Uploaded At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.types.map((assessment: any, i: number) => (
                      <tr key={i}>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 capitalize">
                          {assessment.type}
                        </td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                          {assessment.totalRecords}
                        </td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                          {assessment.totalMaxMarks}
                        </td>
                        <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                          {assessment.uploadedAt ? new Date(assessment.uploadedAt).toLocaleDateString() : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-slate-500 text-sm">No assessment data available</p>
              )}
            </section>

            {/* Section 4: CO Attainment */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                4. CO Attainment
              </h2>
              {coAttainmentTable.length > 0 ? (
                <>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-3 text-left border border-slate-200 dark:border-slate-700">CO</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Direct</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Indirect</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Final</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coAttainmentTable.map((co: any) => (
                        <tr key={co.coNumber}>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 font-mono">
                            {co.coNumber}
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <AttainmentBadge level={co.directAttainment} size="sm" />
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <AttainmentBadge level={co.indirectAttainment} size="sm" />
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <AttainmentBadge level={co.finalAttainment} size="sm" />
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                co.attainmentLevel === "High"
                                  ? "bg-green-100 text-green-800"
                                  : co.attainmentLevel === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {co.attainmentLevel || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Total COs:</span>
                        <span className="ml-2 font-medium">
                          {report.coAttainment?.summary?.totalCOs || coAttainmentTable.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Average CO Attainment:</span>
                        <span className="ml-2 font-medium">
                          {report.coAttainment?.summary?.averageCOAttainment?.toFixed(2) || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No CO attainment data available</p>
              )}
            </section>

            {/* Section 5: PO Attainment */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                5. PO Attainment
              </h2>
              {poAttainmentTable.length > 0 ? (
                <>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-3 text-left border border-slate-200 dark:border-slate-700">PO</th>
                        <th className="p-3 text-left border border-slate-200 dark:border-slate-700">Description</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Attainment</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {poAttainmentTable.map((po: any) => (
                        <tr key={po.poNumber}>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 font-mono">
                            {po.poNumber}
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700">
                            {po.poName || PO_DESCRIPTIONS[po.poNumber] || "N/A"}
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            {po.attainmentValue !== null && po.attainmentValue !== undefined ? (
                              <>
                                <AttainmentBadge level={po.attainmentValue} size="sm" />
                                <span className="ml-2 text-xs text-slate-500">
                                  ({po.attainmentValue.toFixed(2)})
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                po.attainmentLevel === "High"
                                  ? "bg-green-100 text-green-800"
                                  : po.attainmentLevel === "Medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {po.attainmentLevel || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="text-sm">
                      <span className="text-slate-500">Average PO Attainment:</span>
                      <span className="ml-2 font-medium">
                        {report.poAttainment?.summary?.averagePOAttainment?.toFixed(2) || "N/A"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No PO attainment data available</p>
              )}
            </section>

            {/* Section 6: Feedback Summary */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">
                6. Feedback Summary
              </h2>
              {feedbackSummary?.coWiseRatings?.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {feedbackSummary.totalResponses || 0}
                      </p>
                      <p className="text-sm text-slate-500">Total Responses</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {feedbackSummary.responseRate
                          ? `${feedbackSummary.responseRate}%`
                          : "0%"}
                      </p>
                      <p className="text-sm text-slate-500">Response Rate</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg text-center">
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {feedbackSummary.overallAverageRating || "N/A"}
                      </p>
                      <p className="text-sm text-slate-500">Overall Avg Rating</p>
                    </div>
                  </div>
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-800">
                        <th className="p-3 text-left border border-slate-200 dark:border-slate-700">CO</th>
                        <th className="p-3 text-center border border-slate-200 dark:border-slate-700">Average Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackSummary.coWiseRatings.map((fb: any) => (
                        <tr key={fb.coNumber}>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 font-mono">
                            {fb.coNumber}
                          </td>
                          <td className="p-3 border border-slate-200 dark:border-slate-700 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-medium">{fb.averageRating?.toFixed(2)}</span>
                              <span className="text-slate-400">/ 5</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No feedback data available</p>
              )}
            </section>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 text-center text-sm text-slate-500">
              <p>Generated on {new Date().toLocaleDateString()} by NBAC</p>
              <p>
                Report calculated at:{" "}
                {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "N/A"}
              </p>
              {report.generatedBy && (
                <p>
                  Generated by: {report.generatedBy.name} ({report.generatedBy.email})
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}