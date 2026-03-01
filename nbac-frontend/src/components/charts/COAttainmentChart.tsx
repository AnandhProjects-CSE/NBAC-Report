"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { AttainmentBadge } from "@/components/shared/AttainmentBadge"

interface COAttainmentData {
  coNumber: string
  direct: number
  indirect: number
  final: number
}

interface COAttainmentChartProps {
  data: COAttainmentData[]
}

export function COAttainmentChart({ data }: COAttainmentChartProps) {
  const chartData = data.map((item) => ({
    name: item.coNumber,
    Direct: item.direct,
    Indirect: item.indirect,
    Final: item.final,
  }))

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="name" 
              className="text-xs"
              tick={{ fill: "#64748b" }}
            />
            <YAxis 
              domain={[0, 3]} 
              ticks={[0, 1, 2, 3]}
              tick={{ fill: "#64748b" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            />
            <Legend />
            <Bar dataKey="Direct" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Indirect" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Final" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left font-medium">CO</th>
              <th className="px-4 py-3 text-center font-medium">Direct</th>
              <th className="px-4 py-3 text-center font-medium">Indirect</th>
              <th className="px-4 py-3 text-center font-medium">Final</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.coNumber}
                className={index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}
              >
                <td className="px-4 py-3 font-medium">{item.coNumber}</td>
                <td className="px-4 py-3 text-center">
                  <AttainmentBadge level={item.direct} size="sm" />
                </td>
                <td className="px-4 py-3 text-center">
                  <AttainmentBadge level={item.indirect} size="sm" />
                </td>
                <td className="px-4 py-3 text-center">
                  <AttainmentBadge level={item.final} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
