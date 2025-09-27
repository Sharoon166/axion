"use client"

import React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { cn } from "@/lib/utils"

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
  metadata?: {
    revenue?: number
    averageOrderValue?: number
  }
}

export interface LineChartProps {
  data: ChartDataPoint[]
  title?: string
  height?: number
  showTooltip?: boolean
  color?: string
  className?: string
}

export default function LineChart({
  data,
  title,
  height = 400,
  showTooltip = true,
  color = "#000000", // Default to black like reference image
  className = "",
}: LineChartProps) {
  const processedData = React.useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    return data
      .filter((point) => point && typeof point.value === "number" && !isNaN(point.value))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])

  if (!processedData || processedData.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-muted-foreground", className)}
        style={{ height: `${height}px` }}
      >
        <p className="text-sm">No data available</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      {title && <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>}

      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart
          data={processedData}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />

          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12}  tickLine={false} axisLine={false} tickMargin={20} />

          {showTooltip && (
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null

                const data = payload[0].payload as ChartDataPoint
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-muted-foreground">Value:</span>
                      <span className="font-semibold text-foreground">{data.value}</span>
                    </div>
                  </div>
                )
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={4}
            dot={{
              fill: color,
              strokeWidth: 0,
              r: 8,
            }}
            activeDot={{
              r: 10,
              stroke: color,
              strokeWidth: 2,
              fill: color,
            }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
