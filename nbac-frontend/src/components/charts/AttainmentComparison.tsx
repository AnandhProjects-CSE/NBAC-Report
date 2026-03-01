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

interface AttainmentComparisonProps {
  data: Array<{
    coNumber: string
    direct: number
    indirect: number
  }>
}

export function AttainmentComparison({ data }: AttainmentComparisonProps) {
  const chartData = data.map((item) => ({
    name: item.coNumber,
    Direct: item.direct,
    Indirect: item.indirect,
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis 
            type="number" 
            domain={[0, 3]} 
            ticks={[0, 1, 2, 3]}
            tick={{ fill: "#64748b" }}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: "#64748b" }}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="Direct" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          <Bar dataKey="Indirect" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
