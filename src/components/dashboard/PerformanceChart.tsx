// src/components/dashboard/PerformanceChart.tsx
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateProfitLoss, formatCurrency } from "@/lib/trade-utils"
import type { Trade } from "@/types"
import { useMemo, useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { addDays, isAfter, parseISO, format, subDays } from "date-fns"

interface PerformanceChartProps {
  trades: Trade[];
  isLoading?: boolean;
  initialTimePeriod?: TimePeriod;
  hideTimePeriodSelector?: boolean;
}

interface ChartData {
  name: string;
  total: number;
  winCount: number;
  lossCount: number;
}

type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export function PerformanceChart({ 
  trades, 
  isLoading, 
  initialTimePeriod = '30d',
  hideTimePeriodSelector = false 
}: PerformanceChartProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(initialTimePeriod as TimePeriod);
  
  // Update timePeriod when initialTimePeriod changes (from dashboard)
  useEffect(() => {
    if (initialTimePeriod) {
      setTimePeriod(initialTimePeriod as TimePeriod);
    }
  }, [initialTimePeriod]);
  
  const chartData = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    console.log("Generating chart data with", trades.length, "trades");
    
    // Filter trades by selected time period
    const today = new Date();
    let filteredTrades = [...trades].filter(trade => trade.exitDate);
    
    if (timePeriod !== 'all') {
      const daysToLookBack = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : timePeriod === '90d' ? 90 : 365;
      const cutoffDate = subDays(today, daysToLookBack);
      
      filteredTrades = filteredTrades.filter(trade => {
        try {
          const exitDate = parseISO(trade.exitDate as string);
          return isAfter(exitDate, cutoffDate);
        } catch (e) {
          console.error("Error parsing date:", trade.exitDate, e);
          return false;
        }
      });
    }
    
    console.log("Filtered to", filteredTrades.length, "trades for period", timePeriod);

    if (filteredTrades.length === 0) return [];
    
    // Group data based on time period
    const groupByFormat = timePeriod === '7d' ? 'EEE' : // Day name for 7 days
                         timePeriod === '30d' ? 'MMM d' : // Month and day for 30 days
                         'MMM yyyy'; // Month and year for 90d, 1y, and all
    
    const pnlByPeriod: { [key: string]: { total: number, winCount: number, lossCount: number } } = {};
    const dateKeys: string[] = [];

    // Pre-populate date keys for consistent display
    if (timePeriod === '7d') {
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const key = format(date, groupByFormat);
        pnlByPeriod[key] = { total: 0, winCount: 0, lossCount: 0 };
        dateKeys.push(key);
      }
    }
    
    // Calculate P/L for each period and count wins/losses
    filteredTrades.forEach(trade => {
      if (trade.exitDate) {
        const pnl = calculateProfitLoss(trade);
        if (pnl !== null) {
          try {
            const exitDate = parseISO(trade.exitDate);
            const key = format(exitDate, groupByFormat);
            
            if (!pnlByPeriod[key]) {
              pnlByPeriod[key] = { total: 0, winCount: 0, lossCount: 0 };
              if (timePeriod !== '7d' && !dateKeys.includes(key)) {
                dateKeys.push(key);
              }
            }
            
            pnlByPeriod[key].total += pnl;
            
            // Count wins and losses for each day
            if (pnl > 0) {
              pnlByPeriod[key].winCount += 1;
            } else if (pnl < 0) {
              pnlByPeriod[key].lossCount += 1;
            }
          } catch (e) {
            console.error("Error processing trade:", trade, e);
          }
        }
      }
    });
    
    // For 7d, ensure chronological order with all days
    if (timePeriod === '7d') {
      const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dateKeys.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
        .map(key => ({
          name: key,
          total: pnlByPeriod[key].total,
          winCount: pnlByPeriod[key].winCount,
          lossCount: pnlByPeriod[key].lossCount
        }));
    }
    
    // For other periods, sort dates chronologically
    return dateKeys
      .sort((a, b) => {
        try {
          // For 30d, parse the date correctly
          if (timePeriod === '30d') {
            // Add current year to make parsing work (assumes current year)
            const yearStr = format(today, 'yyyy');
            const dateA = new Date(`${a} ${yearStr}`);
            const dateB = new Date(`${b} ${yearStr}`);
            return dateA.getTime() - dateB.getTime();
          }
          
          // For monthly and yearly views
          const dateA = new Date(a);
          const dateB = new Date(b);
          return dateA.getTime() - dateB.getTime();
        } catch (e) {
          console.error("Error sorting dates:", a, b, e);
          return 0;
        }
      })
      .map(key => ({
        name: key,
        total: pnlByPeriod[key].total,
        winCount: pnlByPeriod[key].winCount,
        lossCount: pnlByPeriod[key].lossCount
      }));
  }, [trades, isLoading, timePeriod]);

  // Calculate total P/L for the selected period
  const totalPnL = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.total, 0);
  }, [chartData]);
  
  // Debug output
  useEffect(() => {
    console.log("Current chartData:", chartData);
  }, [chartData]);
  
  const renderTimeFrameTabs = () => (
    <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)} className="w-full">
      <TabsList className="grid grid-cols-5 h-8 mb-4">
        <TabsTrigger value="7d" className="text-xs">7D</TabsTrigger>
        <TabsTrigger value="30d" className="text-xs">30D</TabsTrigger>
        <TabsTrigger value="90d" className="text-xs">90D</TabsTrigger>
        <TabsTrigger value="1y" className="text-xs">1Y</TabsTrigger>
        <TabsTrigger value="all" className="text-xs">Tất cả</TabsTrigger>
      </TabsList>
    </Tabs>
  );

  if (isLoading) {
    return (
      <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Hiệu Suất</CardTitle>
              <CardDescription>Lãi và lỗ của bạn theo thời gian</CardDescription>
            </div>
            {!hideTimePeriodSelector && renderTimeFrameTabs()}
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] sm:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0 && !isLoading) {
    return (
      <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Hiệu Suất</CardTitle>
              <CardDescription>Lãi và lỗ của bạn theo thời gian</CardDescription>
            </div>
            {!hideTimePeriodSelector && renderTimeFrameTabs()}
          </div>
        </CardHeader>
        <CardContent className="h-[250px] sm:h-[300px] flex flex-col items-center justify-center">
          <p className="text-muted-foreground">Không tìm thấy dữ liệu giao dịch cho khoảng thời gian đã chọn.</p>
          <p className="text-sm text-muted-foreground mt-1">Hãy thử chọn một khoảng thời gian khác hoặc thêm giao dịch mới.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total wins and losses for the period
  const totalWins = chartData.reduce((sum, item) => sum + item.winCount, 0);
  const totalLosses = chartData.reduce((sum, item) => sum + item.lossCount, 0);

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Hiệu Suất</CardTitle>
            <CardDescription>Lãi và lỗ của bạn theo thời gian</CardDescription>
          </div>
          {!hideTimePeriodSelector && renderTimeFrameTabs()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-2 text-sm">
          <div className="flex gap-3">
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-green-600"></span>
              <span>Ngày Lãi: {totalWins}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-red-600"></span>
              <span>Ngày Lỗ: {totalLosses}</span>
            </div>
          </div>
          <div className={`font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Tổng: {formatCurrency(totalPnL)}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              angle={-30}
              textAnchor="end"
              height={50}
              interval={0}
              dy={10}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${formatCurrency(value, undefined, true)}`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderRadius: 'var(--radius)',
                borderColor: 'hsl(var(--border))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                const label = name === "total" ? "Lãi/Lỗ" : name === "winCount" ? "Thắng" : "Thua";
                const color = name === "total" 
                  ? (value >= 0 ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)') 
                  : (name === "winCount" ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)');
                  
                return [<span style={{ color, fontWeight: 'bold' }}>
                  {name === "total" ? formatCurrency(value) : value}
                </span>, label];
              }}
            />
            <Bar dataKey="total" barSize={timePeriod === '7d' ? 24 : timePeriod === '30d' ? 16 : 36}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.total >= 0 ? 'rgb(22, 163, 74)' : 'rgb(220, 38, 38)'} 
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
