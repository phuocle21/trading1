// src/components/dashboard/PerformanceChart.tsx
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateProfitLoss, formatCurrency } from "@/lib/trade-utils"
import type { Trade } from "@/types"
import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface PerformanceChartProps {
  trades: Trade[];
  isLoading?: boolean;
}

interface ChartData {
  name: string;
  total: number;
}

export function PerformanceChart({ trades, isLoading }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    const monthlyPnL: { [key: string]: number } = {};

    trades.forEach(trade => {
      if (trade.exitDate) { // Only consider closed trades
        const pnl = calculateProfitLoss(trade);
        if (pnl !== null) {
          const monthYear = new Date(trade.exitDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          monthlyPnL[monthYear] = (monthlyPnL[monthYear] || 0) + pnl;
        }
      }
    });

    // Sort by date for chronological order
    return Object.entries(monthlyPnL)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-12); // Show last 12 months
  }, [trades, isLoading]);

  if (isLoading) {
    return (
      <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Monthly P/L</CardTitle>
          <CardDescription>Your profit and loss over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <Skeleton className="h-[250px] sm:h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 && !isLoading) {
     return (
      <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Monthly P/L</CardTitle>
          <CardDescription>Your profit and loss over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">Not enough data to display chart. Close some trades to see your P/L.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Monthly P/L</CardTitle>
        <CardDescription>Your profit and loss over the last 12 months.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" className="h-[250px] sm:h-[350px]">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10} // Smaller font for mobile
              tickLine={false}
              axisLine={false}
              angle={-30} // Angle labels to save space
              textAnchor="end"
              height={50} // Increased height for angled labels
              interval={0} // Show all labels if possible, might need adjustment based on data
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10} // Smaller font for mobile
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${formatCurrency(value, undefined, true)}`} // Short format for Y-axis
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderRadius: 'var(--radius)',
                borderColor: 'hsl(var(--border))' 
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string, props) => {
                const color = value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))'; 
                return [<span style={{ color }}>{formatCurrency(value)}</span>, "P/L"];
              }}
            />
            <Bar 
              dataKey="total" 
              radius={[4, 4, 0, 0]}
              fill="hsl(var(--primary))"
              shape={(props: any) => {
                const { x, y, width, height, payload } = props;
                const fill = payload.total >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))';
                return <rect x={x} y={y} width={width} height={height} fill={fill} rx="4" ry="4" />;
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
