"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { reportsApi } from "@/api/reports.api"
import { Button } from "@/components/ui/button"
import { AttainmentBadge } from "@/components/shared/AttainmentBadge"
import { EmptyState } from "@/components/shared/EmptyState"
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton"
import {
  ArrowLeft, Download, AlertTriangle, ClipboardList, GitBranch, FileSpreadsheet, BarChart2,
  Building2, Users, BookOpen, CheckCircle2, TrendingUp, Lightbulb, Star
} from "lucide-react"
import Link from "next/link"
import { PO_DESCRIPTIONS, MATRIX_COLORS } from "@/lib/utils"
import { AppLayout } from "@/components/layout/AppLayout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { COAttainmentRadarChart } from "@/components/charts/COAttainmentRadarChart"
import { FeedbackRatingChart } from "@/components/charts/FeedbackRatingChart"
import { InfrastructureRatingChart } from "@/components/charts/InfrastructureRatingChart"

// ─── Error guidance ────────────────────────────────────────────────────────
const REPORT_ERROR_STEPS = [
  { match: "no attainment data", title: "Attainment Not Calculated Yet", description: "Calculate attainment first.", step: "attainment" },
  { match: "no matrix", title: "CO-PO Matrix Missing", description: "Set up the CO-PO matrix first.", step: "matrix" },
  { match: "no marks", title: "No Marks Uploaded", description: "Upload marks before calculating attainment.", step: "marks" },
  { match: "no course outcome", title: "Course Outcomes Missing", description: "Define Course Outcomes first.", step: "cos" },
]
const COMPLETION_STEPS = [
  { key: "cos", label: "Define Course Outcomes", tab: "cos" },
  { key: "matrix", label: "Set up CO-PO Matrix", tab: "matrix" },
  { key: "marks", label: "Upload Assessment Marks", tab: "marks" },
  { key: "attainment", label: "Calculate Attainment", tab: "attainment" },
]

// ─── Grade colour helper ───────────────────────────────────────────────────
const gradeColor = (grade: string) => {
  if (grade === "A++" || grade === "A+") return "bg-emerald-600 text-white"
  if (grade === "A") return "bg-emerald-500 text-white"
  if (grade === "B++" || grade === "B+") return "bg-blue-500 text-white"
  if (grade === "B") return "bg-blue-400 text-white"
  if (grade === "C") return "bg-amber-500 text-white"
  return "bg-slate-400 text-white"
}

// ─── Section header component ──────────────────────────────────────────────
function SectionHeader({ number, title, icon: Icon }: { number: number; title: string; icon?: any }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-200 dark:border-slate-700">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm">
        {number}
      </div>
      {Icon && <Icon className="h-5 w-5 text-slate-500" />}
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
    </div>
  )
}

// ─── Table components ──────────────────────────────────────────────────────
function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="p-3 text-left border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 font-semibold text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
      {children}
    </th>
  )
}
function TableCell({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <td className={`p-3 border border-slate-200 dark:border-slate-700 text-sm ${center ? "text-center" : ""}`}>
      {children}
    </td>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)

  const { data: reportData, isLoading, error } = useQuery({
    queryKey: ["full-report", resolvedParams.id],
    queryFn: () => reportsApi.getFullReport(resolvedParams.id),
    retry: false,
  })

  const report = reportData?.data?.report as any

  const handlePrint = () => window.print()

  // ── Loading ──
  if (isLoading) return <AppLayout><LoadingSkeleton type="detail" /></AppLayout>

  // ── Error ──
  if (error) {
    const apiMessage: string = (error as any)?.response?.data?.message || (error as any)?.message || ""
    const lowerMessage = apiMessage.toLowerCase()
    const matched = REPORT_ERROR_STEPS.find((e) => lowerMessage.includes(e.match))
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-10 space-y-6">
          <Link href={`/faculty/courses/${resolvedParams.id}`}>
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
            </Button>
          </Link>
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              {matched ? matched.title : "Report Not Available"}
            </AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300 mt-1">
              {matched ? matched.description : apiMessage || "Complete all steps below to generate the report."}
            </AlertDescription>
          </Alert>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Complete these steps:</h3>
            <ol className="space-y-3">
              {COMPLETION_STEPS.map((step, i) => {
                const isBlocker = matched?.step === step.key
                return (
                  <li key={step.key} className="flex items-center gap-3">
                    <span className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${isBlocker ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400" : "bg-slate-100 text-slate-500"}`}>{i + 1}</span>
                    <span className={`flex-1 text-sm ${isBlocker ? "font-semibold text-amber-700 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"}`}>{step.label}</span>
                    <Link href={`/faculty/courses/${resolvedParams.id}?tab=${step.tab}`}>
                      <Button size="sm" variant={isBlocker ? "default" : "ghost"} className={isBlocker ? "bg-amber-500 hover:bg-amber-600 text-slate-900" : "text-slate-500"}>Go</Button>
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

  if (!report) return <AppLayout><EmptyState title="Report not available" description="Calculate attainment to generate the report" /></AppLayout>

  // ── Data extraction ──
  const poNumbers = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11", "PO12"]
  const courseInfo = report.courseInfo || {}
  const institutionInfo = report.institutionInfo || {}
  const courseOutcomeFramework = report.courseOutcomeFramework || {}
  const assessmentMethodology = report.assessmentMethodology || {}
  const attainmentSummary = report.attainmentSummary || {}
  const feedbackAnalysis = report.feedbackAnalysis || {}
  const infraFeedback = report.infrastructureFeedback || {}
  const facultyPerf = report.facultyPerformance || {}
  const finalResult = report.finalResult || {}
  const recommendations = report.recommendations || []
  const warnings = report.warnings || []
  const coPOMatrix = report.coPOMatrix || []

  const coAttainments = attainmentSummary.coAttainments || report.coAttainment?.table || []
  const poTable = report.poAttainment?.table || []
  const feedbackRatings = feedbackAnalysis.coWiseRatings || report.feedbackSummary?.coWiseRatings || []
  const infraFacilities = infraFeedback.facilities || []

  return (
    <AppLayout>
      {/* ── Toolbar (hidden in print) ─────────────────────── */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href={`/faculty/courses/${resolvedParams.id}`}>
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Course
          </Button>
        </Link>
        <Button
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
        >
          <Download className="h-4 w-4" />
          Download Accreditation Report (PDF)
        </Button>
      </div>

      {/* ── Warnings ─────────────────────────────────────── */}
      {warnings.length > 0 && (
        <Alert className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-amber-200 print:hidden">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Calculation Warnings</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside text-sm">
              {warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* ════════════════════════════════════════════════════
          NAAC REPORT CONTENT  — id used for print scoping
          ════════════════════════════════════════════════════ */}
      <div id="naac-report-content" className="bg-white dark:bg-slate-900 rounded-xl shadow-md print:shadow-none print:rounded-none">

        {/* ── Report Cover ─────────────────────────────────────── */}
        <div className="border-b border-slate-200 dark:border-slate-700 p-10 print:p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-medium mb-4">
            NAAC / NBA Accreditation Documentation
          </div>
          <h1 className="text-3xl print:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {institutionInfo.collegeName || "Institution"}
          </h1>
          <p className="text-slate-500 text-base">
            Department of {courseInfo.department} · {institutionInfo.programName || "B.Tech"}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Academic Year: {courseInfo.academicYear} · Semester: {courseInfo.semester}
          </p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              ["Course Code", courseInfo.courseCode],
              ["Course Name", courseInfo.courseName],
              ["Faculty", courseInfo.faculty?.name || "N/A"],
              ["Department", courseInfo.department],
              ["Credits", courseInfo.credits],
              ["Enrolled Students", courseInfo.totalEnrolledStudents],
            ].map(([label, value]) => (
              <div key={label as string} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="font-semibold text-sm mt-0.5">{String(value ?? "N/A")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 print:p-5 space-y-10">

          {/* ── SECTION 1: Institution Information ──────────────── */}
          <section>
            <SectionHeader number={1} title="Institution Information" icon={Building2} />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><p className="text-slate-500 text-xs">College Name</p><p className="font-medium">{institutionInfo.collegeName || "N/A"}</p></div>
              <div><p className="text-slate-500 text-xs">Program</p><p className="font-medium">{institutionInfo.programName || "B.Tech / BE"}</p></div>
              <div><p className="text-slate-500 text-xs">Department</p><p className="font-medium">{institutionInfo.department || courseInfo.department}</p></div>
              <div><p className="text-slate-500 text-xs">Academic Year</p><p className="font-medium">{courseInfo.academicYear}</p></div>
              <div><p className="text-slate-500 text-xs">Semester</p><p className="font-medium">{courseInfo.semester}</p></div>
              <div><p className="text-slate-500 text-xs">Courses</p><p className="font-medium">{courseInfo.courseCode} — {courseInfo.courseName}</p></div>
            </div>
          </section>

          {/* ── SECTION 2: Course Outcome Framework ─────────────── */}
          <section>
            <SectionHeader number={2} title="Course Outcome Framework" icon={ClipboardList} />
            <div className="mb-4 text-sm">
              <p><span className="text-slate-500">Instructor:</span> <span className="font-medium">{courseOutcomeFramework.instructor?.name || courseInfo.faculty?.name || "N/A"}</span></p>
              <p className="text-slate-500 text-xs mt-2 italic">
                CO-PO mapping is {courseOutcomeFramework.hasPOMapping ? "available" : "not yet configured"}.
              </p>
            </div>
            {(courseOutcomeFramework.outcomes || coAttainments).length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <TableHead>CO</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Threshold (%)</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {(courseOutcomeFramework.outcomes || coAttainments).map((co: any) => (
                    <tr key={co.coNumber}>
                      <TableCell><span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{co.coNumber}</span></TableCell>
                      <TableCell>{co.description || "N/A"}</TableCell>
                      <TableCell center>{co.threshold || 60}%</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-slate-500 text-sm">No COs defined.</p>}

            {/* CO-PO Matrix sub-section */}
            {coPOMatrix.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <GitBranch className="h-4 w-4" /> CO-PO Correlation Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">CO / PO</th>
                        {poNumbers.map((po) => (
                          <th key={po} className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-center w-10">{po}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {coPOMatrix.map((row: any) => (
                        <tr key={row.coNumber}>
                          <td className="p-2 border border-slate-200 dark:border-slate-700 font-mono">{row.coNumber}</td>
                          {poNumbers.map((po) => {
                            const value = Number(row[po] ?? 0)
                            return (
                              <td key={po} className={`p-2 border border-slate-200 dark:border-slate-700 text-center ${MATRIX_COLORS[value as keyof typeof MATRIX_COLORS] || ""}`}>
                                <span className={value >= 2 ? "text-white" : ""}>{value || ""}</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {/* ── SECTION 3: Assessment Methodology ───────────────── */}
          <section>
            <SectionHeader number={3} title="Assessment Methodology" icon={FileSpreadsheet} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Direct Assessment Methods</h3>
                {(assessmentMethodology.directMethods || report.assessments?.types || []).length > 0 ? (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <TableHead>Assessment</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Max Marks</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      {(assessmentMethodology.directMethods || report.assessments?.types || []).map((a: any, i: number) => (
                        <tr key={i}>
                          <TableCell><span className="capitalize">{a.label || a.type}</span></TableCell>
                          <TableCell center>{a.totalRecords}</TableCell>
                          <TableCell center>{a.totalMaxMarks}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : <p className="text-slate-500 text-sm">No marks uploaded yet.</p>}
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">Indirect Assessment</h3>
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm space-y-2">
                  <p>Student CO Feedback Survey (1–5 star scale)</p>
                  <p className="text-slate-500">Total Responses: <span className="font-medium text-slate-700 dark:text-slate-300">{feedbackAnalysis.totalResponses ?? report.feedbackSummary?.totalResponses ?? 0}</span></p>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-sm">
                  <p className="font-semibold text-indigo-800 dark:text-indigo-200">Weightage Formula</p>
                  <p className="text-indigo-700 dark:text-indigo-300 font-mono text-xs mt-1">
                    {assessmentMethodology.weightages?.formulaDescription ||
                      "Final CO Attainment = (0.80 × Direct) + (0.20 × Indirect)"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── SECTION 4: Attainment Calculation Summary ─────────── */}
          <section>
            <SectionHeader number={4} title="Attainment Calculation Summary" icon={BarChart2} />

            {/* Radar chart */}
            {coAttainments.length > 0 && (
              <div className="mb-6 print:mb-4">
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">CO Attainment Radar</h3>
                <COAttainmentRadarChart data={coAttainments} height={300} />
              </div>
            )}

            {/* Attainment scales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wide">Direct Attainment Scale</h3>
                <table className="w-full text-xs border-collapse">
                  <thead><tr><TableHead>Success %</TableHead><TableHead>Level</TableHead><TableHead>Label</TableHead></tr></thead>
                  <tbody>
                    {(attainmentSummary.directAttainmentScale || [
                      { range: "≥ 70%", level: 3, label: "High" },
                      { range: "60–69%", level: 2, label: "Medium" },
                      { range: "50–59%", level: 1, label: "Low" },
                      { range: "< 50%", level: 0, label: "Very Low" },
                    ]).map((s: any) => (
                      <tr key={s.level}>
                        <TableCell>{s.range}</TableCell>
                        <TableCell center>{s.level}</TableCell>
                        <TableCell>{s.label}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="text-xs font-semibold mb-2 text-slate-500 uppercase tracking-wide">Indirect Attainment Scale</h3>
                <table className="w-full text-xs border-collapse">
                  <thead><tr><TableHead>Avg Rating</TableHead><TableHead>Level</TableHead><TableHead>Label</TableHead></tr></thead>
                  <tbody>
                    {(attainmentSummary.indirectAttainmentScale || [
                      { range: "≥ 4.5★", level: 3, label: "High" },
                      { range: "3.5–4.4★", level: 2, label: "Medium" },
                      { range: "2.5–3.4★", level: 1, label: "Low" },
                      { range: "< 2.5★", level: 0, label: "Very Low" },
                    ]).map((s: any) => (
                      <tr key={s.level}>
                        <TableCell>{s.range}</TableCell>
                        <TableCell center>{s.level}</TableCell>
                        <TableCell>{s.label}</TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CO attainment table */}
            {coAttainments.length > 0 && (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <TableHead>CO</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Students Attained</TableHead>
                    <TableHead>Success %</TableHead>
                    <TableHead>Direct</TableHead>
                    <TableHead>Indirect</TableHead>
                    <TableHead>Final</TableHead>
                    <TableHead>Level</TableHead>
                  </tr>
                </thead>
                <tbody>
                  {coAttainments.map((co: any) => (
                    <tr key={co.coNumber} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell><span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">{co.coNumber}</span></TableCell>
                      <TableCell><span className="text-xs">{co.description || "N/A"}</span></TableCell>
                      <TableCell center>{co.threshold || 60}%</TableCell>
                      <TableCell center>{co.studentsAttained}/{co.totalStudents}</TableCell>
                      <TableCell center>
                        <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${(co.successPercentage ?? 0) >= 60 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {(co.successPercentage ?? 0).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell center><AttainmentBadge level={co.directAttainment} size="sm" /></TableCell>
                      <TableCell center><AttainmentBadge level={co.indirectAttainment} size="sm" /></TableCell>
                      <TableCell center><AttainmentBadge level={co.finalAttainment} size="sm" /></TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${co.attainmentLevel?.includes("High") ? "bg-green-100 text-green-800" :
                            co.attainmentLevel?.includes("Medium") ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                          }`}>{co.attainmentLevel || "N/A"}</span>
                      </TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* PO Attainment */}
            {poTable.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-300">PO Attainment</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <TableHead>PO</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Attainment</TableHead>
                      <TableHead>Level</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {poTable.map((po: any) => (
                      <tr key={po.poNumber}>
                        <TableCell><span className="font-mono text-indigo-600 dark:text-indigo-400">{po.poNumber}</span></TableCell>
                        <TableCell><span className="text-xs">{po.poName || PO_DESCRIPTIONS[po.poNumber] || "N/A"}</span></TableCell>
                        <TableCell center>
                          {po.attainmentValue !== null && po.attainmentValue !== undefined
                            ? <><AttainmentBadge level={po.attainmentValue} size="sm" /><span className="ml-2 text-xs text-slate-500">({po.attainmentValue.toFixed(2)})</span></>
                            : <span className="text-slate-400">N/A</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${po.attainmentLevel?.includes("High") ? "bg-green-100 text-green-800" :
                              po.attainmentLevel?.includes("Medium") ? "bg-yellow-100 text-yellow-800" :
                                "bg-red-100 text-red-800"
                            }`}>{po.attainmentLevel || "N/A"}</span>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 5: Student Feedback Analysis ─────────────── */}
          <section>
            <SectionHeader number={5} title="Student Feedback Analysis" icon={Users} />
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                ["Total Responses", feedbackAnalysis.totalResponses ?? report.feedbackSummary?.totalResponses ?? 0],
                ["Response Rate", `${feedbackAnalysis.responseRate ?? report.feedbackSummary?.responseRate ?? 0}%`],
                ["Overall Avg Rating", feedbackAnalysis.overallAverageRating ?? report.feedbackSummary?.overallAverageRating ?? "N/A"],
              ].map(([label, value]) => (
                <div key={label as string} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{String(value)}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {feedbackRatings.length > 0 ? (
              <>
                <FeedbackRatingChart data={feedbackRatings} height={260} />
                <table className="w-full text-sm border-collapse mt-4">
                  <thead>
                    <tr>
                      <TableHead>CO</TableHead>
                      <TableHead>Average Rating</TableHead>
                      <TableHead>Responses</TableHead>
                      <TableHead>Interpretation</TableHead>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbackRatings.map((f: any) => (
                      <tr key={f.coNumber}>
                        <TableCell><span className="font-mono text-indigo-600 dark:text-indigo-400">{f.coNumber}</span></TableCell>
                        <TableCell center>
                          <div className="flex items-center justify-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{f.averageRating?.toFixed(2)}</span>
                            <span className="text-slate-400 text-xs">/ 5</span>
                          </div>
                        </TableCell>
                        <TableCell center>{f.totalResponses ?? "N/A"}</TableCell>
                        <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium ${f.interpretation === "Excellent" ? "bg-emerald-100 text-emerald-800" :
                            f.interpretation === "Good" ? "bg-blue-100 text-blue-800" :
                              f.interpretation === "Average" ? "bg-amber-100 text-amber-800" :
                                "bg-red-100 text-red-800"
                          }`}>{f.interpretation || "N/A"}</span></TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : <p className="text-slate-500 text-sm">No student feedback submitted yet.</p>}
          </section>

          {/* ── SECTION 6: Infrastructure Feedback ───────────────── */}
          <section>
            <SectionHeader number={6} title="Infrastructure Feedback Summary" icon={Building2} />
            <p className="text-sm text-slate-500 mb-4">
              Facility ratings for {infraFeedback.department || courseInfo.department} · Semester {infraFeedback.semester || courseInfo.semester} ({infraFeedback.academicYear || courseInfo.academicYear})
            </p>
            {infraFacilities.length > 0 ? (
              <>
                <InfrastructureRatingChart data={infraFacilities} height={240} />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {infraFacilities.map((f: any) => (
                    <div key={f.ratingType} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                      <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {f.averageRating !== null ? `${f.averageRating}★` : "—"}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{f.ratingType.toLowerCase()}</p>
                      <p className="text-xs text-slate-400">{f.totalResponses} responses</p>
                    </div>
                  ))}
                </div>
              </>
            ) : <p className="text-slate-500 text-sm">No infrastructure feedback collected for this period.</p>}
          </section>

          {/* ── SECTION 7: Faculty Performance Summary ───────────── */}
          <section>
            <SectionHeader number={7} title="Faculty Performance Summary" icon={Users} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ["Faculty Name", facultyPerf.faculty?.name || courseInfo.faculty?.name || "N/A"],
                ["Department", facultyPerf.faculty?.department || courseInfo.department || "N/A"],
                ["Avg CO Attainment", (facultyPerf.averageCOAttainment ?? report.coAttainment?.summary?.averageCOAttainment)?.toFixed(2) ?? "N/A"],
                ["Avg PO Attainment", (facultyPerf.averagePOAttainment ?? report.poAttainment?.summary?.averagePOAttainment)?.toFixed(2) ?? "N/A"],
              ].map(([label, value]) => (
                <div key={label as string} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="font-semibold text-sm mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── SECTION 8: Final Attainment + NAAC Grade ─────────── */}
          <section>
            <SectionHeader number={8} title="Final Attainment Result & NAAC Grade" icon={TrendingUp} />
            <div className="flex flex-col md:flex-row items-center gap-8 mb-6">
              {/* Grade badge */}
              <div className="flex-shrink-0 text-center">
                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-black shadow-lg ${gradeColor(finalResult.naacGrade || "N/A")}`}>
                  {finalResult.naacGrade || "N/A"}
                </div>
                <p className="text-sm text-slate-500 mt-2">NAAC Grade</p>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  ["Avg CO Attainment", finalResult.averageCOAttainment?.toFixed(2) ?? "N/A", "/ 3"],
                  ["Avg PO Attainment", finalResult.averagePOAttainment?.toFixed(2) ?? "N/A", "/ 3"],
                  ["Overall Attainment", finalResult.overallAttainmentPercentage?.toFixed(1) ?? "N/A", "%"],
                ].map(([label, value, suffix]) => (
                  <div key={label as string} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {String(value)}<span className="text-base font-normal text-slate-500 ml-1">{suffix}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Interpretation */}
            {finalResult.interpretation && (
              <div className={`p-4 rounded-lg text-sm font-medium ${finalResult.naacGrade?.startsWith("A") ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200" :
                  finalResult.naacGrade?.startsWith("B") ? "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200" :
                    "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200"
                }`}>
                <CheckCircle2 className="inline h-4 w-4 mr-2" />
                {finalResult.interpretation}
              </div>
            )}

            {/* Grading schema table */}
            {finalResult.gradingSchema && (
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Grading Schema</h3>
                <div className="flex flex-wrap gap-2">
                  {finalResult.gradingSchema.map((g: any) => (
                    <div key={g.grade} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${gradeColor(g.grade)} ${finalResult.naacGrade === g.grade ? "ring-2 ring-offset-1 ring-current scale-105" : "opacity-70"}`}>
                      {g.grade} ≥ {g.minPercentage}%
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── SECTION 9: Recommendations ────────────────────────── */}
          <section>
            <SectionHeader number={9} title="Recommendations" icon={Lightbulb} />
            {recommendations.length > 0 ? (
              <div className="space-y-4">
                {recommendations.map((rec: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      {rec.coNumber !== "GENERAL" && (
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{rec.coNumber}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${rec.priority === "Critical" ? "bg-red-100 text-red-700" :
                          rec.priority === "High" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                        }`}>{rec.priority}</span>
                      {rec.currentAttainment !== undefined && rec.coNumber !== "GENERAL" && (
                        <span className="text-xs text-slate-500">Current: {rec.currentAttainment.toFixed(2)} / 3</span>
                      )}
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {rec.suggestions.map((s: string, j: number) => (
                        <li key={j} className="text-sm text-slate-700 dark:text-slate-300">{s}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                All course outcomes are satisfactorily attained. No critical recommendations.
              </div>
            )}
          </section>

          {/* ── Footer ─────────────────────────────────────────────── */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 text-center text-xs text-slate-500 space-y-1">
            <p>Generated on {new Date().toLocaleString()} by NBAC Platform</p>
            {report.generatedAt && <p>Attainment calculated: {new Date(report.generatedAt).toLocaleString()}</p>}
            {report.generatedBy && <p>Calculated by: {report.generatedBy.name} ({report.generatedBy.email})</p>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}