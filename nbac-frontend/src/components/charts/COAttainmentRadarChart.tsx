"use client"

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts"

interface COAttainmentData {
    coNumber: string
    directAttainment: number
    indirectAttainment?: number
    finalAttainment: number
}

interface COAttainmentRadarChartProps {
    data: COAttainmentData[]
    height?: number
    showIndirect?: boolean
}

export function COAttainmentRadarChart({
    data,
    height = 320,
    showIndirect = true,
}: COAttainmentRadarChartProps) {
    if (!data || data.length === 0) return null

    const chartData = data.map((d) => ({
        co: d.coNumber,
        Direct: Number((d.directAttainment ?? 0).toFixed(2)),
        ...(showIndirect && d.indirectAttainment !== undefined
            ? { Indirect: Number((d.indirectAttainment ?? 0).toFixed(2)) }
            : {}),
        Final: Number((d.finalAttainment ?? 0).toFixed(2)),
    }))

    // A Radar chart cannot draw a polygon with fewer than 3 axes.
    // Fall back to a standard Bar Chart for courses with 1 or 2 COs.
    if (data.length < 3) {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="co" tick={{ fontSize: 12, fill: "#475569", fontFamily: "monospace" }} stroke="#94a3b8" />
                    <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar name="Direct" dataKey="Direct" fill="#10b981" radius={[4, 4, 0, 0]} />
                    {showIndirect && <Bar name="Indirect" dataKey="Indirect" fill="#f59e0b" radius={[4, 4, 0, 0]} />}
                    <Bar name="Final" dataKey="Final" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                    dataKey="co"
                    tick={{ fontSize: 12, fill: "#475569", fontFamily: "monospace" }}
                />
                <PolarRadiusAxis
                    angle={90}
                    domain={[0, 3]}
                    tickCount={4}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                />
                <Tooltip
                    formatter={(value: number, name: string) => [`${value} / 3`, name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Radar
                    name="Final"
                    dataKey="Final"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.35}
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#6366f1" }}
                />
                <Radar
                    name="Direct"
                    dataKey="Direct"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.15}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                />
                {showIndirect && (
                    <Radar
                        name="Indirect"
                        dataKey="Indirect"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.1}
                        strokeWidth={1.5}
                        strokeDasharray="2 3"
                    />
                )}
            </RadarChart>
        </ResponsiveContainer>
    )
}
