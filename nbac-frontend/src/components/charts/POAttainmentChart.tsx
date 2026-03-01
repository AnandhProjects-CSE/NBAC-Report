"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { PO_DESCRIPTIONS } from "@/lib/utils"
import { AttainmentBadge } from "@/components/shared/AttainmentBadge"
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface POAttainmentData {
  poNumber: string
  attainment: number | null
}

interface POAttainmentChartProps {
  data: POAttainmentData[]
}

export function POAttainmentChart({ data }: POAttainmentChartProps) {
  // Filter out null values for the chart, or set them to 0
  const chartData = data.map((item) => ({
    name: item.poNumber,
    value: item.attainment ?? 0,
    fullName: PO_DESCRIPTIONS[item.poNumber] || item.poNumber,
  }))

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
            <PolarGrid className="stroke-slate-200 dark:stroke-slate-700" />
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <PolarRadiusAxis 
              domain={[0, 3]} 
              ticks={[0, 1, 2, 3]}
              tick={{ fill: "#64748b", fontSize: 10 }}
            />
            <Radar
              name="Attainment"
              dataKey="value"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.4}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string, props: any) => [
                value === 0 && data.find(d => d.poNumber === props.payload.name)?.attainment === null 
                  ? "N/A" 
                  : value,
                "Attainment",
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium">PO</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-center font-medium">Attainment</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.poNumber}
                className={index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}
              >
                <td className="px-4 py-3 font-medium">{item.poNumber}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {PO_DESCRIPTIONS[item.poNumber] || "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <AttainmentBadge level={item.attainment} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
