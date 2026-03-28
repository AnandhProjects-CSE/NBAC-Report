"use client"

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList,
} from "recharts"

interface InfraRatingSummary {
    ratingType: "LIBRARY" | "TRANSPORT" | "CANTEEN"
    averageRating: number | null
    totalResponses: number
}

interface InfrastructureRatingChartProps {
    data: InfraRatingSummary[]
    height?: number
}

const FACILITY_LABELS: Record<string, string> = {
    LIBRARY: "Library",
    TRANSPORT: "Transport",
    CANTEEN: "Canteen",
}

const FACILITY_COLORS: Record<string, string> = {
    LIBRARY: "#6366f1",   // indigo
    TRANSPORT: "#0ea5e9", // sky blue
    CANTEEN: "#f97316",   // orange
}

export function InfrastructureRatingChart({ data, height = 250 }: InfrastructureRatingChartProps) {
    if (!data || data.length === 0) return null

    const chartData = data.map((d) => ({
        name: FACILITY_LABELS[d.ratingType] || d.ratingType,
        ratingType: d.ratingType,
        rating: d.averageRating != null ? Number(d.averageRating.toFixed(2)) : 0,
        responses: d.totalResponses,
        hasData: d.averageRating !== null && d.totalResponses > 0,
    }))

    return (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                barSize={56}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 13, fontWeight: 500 }}
                    stroke="#94a3b8"
                />
                <YAxis
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    label={{ value: "Avg Rating (1–5)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                    formatter={(value: number, _: string, props: any) => {
                        const item = props.payload
                        if (!item?.hasData) return ["No data", "Rating"]
                        return [`${value} / 5 (${item.responses} responses)`, "Average Rating"]
                    }}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="rating" radius={[6, 6, 0, 0]}>
                    <LabelList
                        dataKey="rating"
                        position="top"
                        formatter={(v: number) => (v > 0 ? `${v}★` : "N/A")}
                        style={{ fontSize: 12, fontWeight: 600, fill: "#475569" }}
                    />
                    {chartData.map((entry, index) => (
                        <Cell
                            key={index}
                            fill={entry.hasData ? FACILITY_COLORS[entry.ratingType] : "#e2e8f0"}
                            opacity={entry.hasData ? 1 : 0.5}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
