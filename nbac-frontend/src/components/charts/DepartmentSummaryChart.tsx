"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts"
import { PO_DESCRIPTIONS } from "@/lib/utils"
import { Info } from "lucide-react"

interface DepartmentSummaryChartProps {
  data: Record<string, number | null>
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{
    value: number | string | null
    name: string
    payload: { name: string; value: number; fullName: string }
  }>
}) => {
  if (active && payload && payload.length) {
    const item = payload[0]
    const rawValue = item?.value
    const numericValue =
      rawValue !== null && rawValue !== undefined && !isNaN(Number(rawValue))
        ? Number(rawValue)
        : null

    return (
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.97)",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px 14px",
          fontSize: 13,
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
          {item?.payload?.fullName || item?.payload?.name}
        </p>
        <p style={{ color: "#0ea5e9" }}>
          Avg Attainment:{" "}
          <strong>
            {numericValue !== null ? numericValue.toFixed(2) : "N/A"}
          </strong>
        </p>
      </div>
    )
  }
  return null
}

// Attainment level labels for the legend
const ATTAINMENT_LEVELS = [
  { range: "0 – 1", label: "Below Target", color: "#ef4444" },
  { range: "1 – 2", label: "Approaching Target", color: "#f59e0b" },
  { range: "2 – 3", label: "Meeting Target", color: "#10b981" },
]

export function DepartmentSummaryChart({ data }: DepartmentSummaryChartProps) {
  // Guard against null/undefined/empty data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-slate-400 text-sm">
        No attainment data available
      </div>
    )
  }

  const chartData = Object.entries(data).map(([poNumber, attainment]) => ({
    name: poNumber,
    value:
      attainment !== null && attainment !== undefined && !isNaN(Number(attainment))
        ? Number(attainment)
        : 0,
    fullName: PO_DESCRIPTIONS[poNumber] || poNumber,
  }))

  const hasNonZeroValues = chartData.some((d) => d.value > 0)

  return (
    <div className="space-y-4">
      {/* Explanation banner */}
      <div className="flex gap-3 rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
        <div className="space-y-1">
          <p className="font-medium">How to read this chart</p>
          <p className="text-sky-700 leading-relaxed">
            Each axis represents a <strong>Programme Outcome (PO)</strong> — a
            skill or competency students are expected to achieve by graduation.
            The <strong>shaded area</strong> shows how well students across all
            courses have attained each PO, on a scale of <strong>0 to 3</strong>.
            A larger, more evenly-spread shape means stronger overall attainment.
            Hover over any axis point to see the exact average score.
          </p>
          {/* Attainment scale legend */}
          <div className="flex flex-wrap gap-4 pt-1">
            {ATTAINMENT_LEVELS.map((level) => (
              <span key={level.range} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                <span className="text-sky-700">
                  <strong>{level.range}</strong> — {level.label}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 relative">
        {!hasNonZeroValues && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <span className="text-slate-400 text-sm bg-white/80 px-3 py-1 rounded">
              All attainment values are zero
            </span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
          >
            <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <PolarRadiusAxis
              domain={[0, 3]}
              ticks={[0, 1, 2, 3]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              angle={90}
            />
            <Radar
              name="Average Attainment"
              dataKey="value"
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={() => "Average Attainment"}
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: "#64748b" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}