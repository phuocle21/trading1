"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { calculateProfitLoss, formatCurrency } from "@/lib/trade-utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/types";
import { format, parseISO, compareAsc } from "date-fns";

interface AccountGrowthChartProps {
  trades: Trade[];
  isLoading?: boolean;
  initialBalance?: number;
}

export function AccountGrowthChart({ 
  trades, 
  isLoading, 
  initialBalance = 10000 // Default starting balance
}: AccountGrowthChartProps) {
  // Calculate account balance growth over time
  const accountGrowthData = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    // Filter to closed trades only and sort by exitDate
    const closedTrades = trades
      .filter(trade => trade.exitDate)
      .sort((a, b) => {
        if (!a.exitDate || !b.exitDate) return 0;
        return compareAsc(new Date(a.exitDate), new Date(b.exitDate));
      });
    
    if (closedTrades.length === 0) return [];
    
    // Calculate cumulative P/L and growth percentages
    let balance = initialBalance;
    let cumulativeData: Array<{
      date: string;
      balance: number;
      growthPercent: number;
      dailyPnL: number;
    }> = [];
    
    // For calculating daily P/L
    let currentDateStr = '';
    let dailyPnL = 0;
    
    closedTrades.forEach(trade => {
      if (!trade.exitDate) return;
      
      const pnl = calculateProfitLoss(trade);
      if (pnl === null) return;
      
      // Process day change or first entry
      const exitDateStr = trade.exitDate;
      if (exitDateStr !== currentDateStr) {
        // Add the previous day's data
        if (currentDateStr !== '') {
          const growthPercent = ((balance / initialBalance) - 1) * 100;
          cumulativeData.push({
            date: currentDateStr,
            balance,
            growthPercent,
            dailyPnL
          });
        }
        
        // Reset for new day
        currentDateStr = exitDateStr;
        dailyPnL = pnl;
      } else {
        // Same day, accumulate P/L
        dailyPnL += pnl;
      }
      
      // Update overall balance
      balance += pnl;
    });
    
    // Add the last day
    if (currentDateStr !== '') {
      const growthPercent = ((balance / initialBalance) - 1) * 100;
      cumulativeData.push({
        date: currentDateStr,
        balance,
        growthPercent,
        dailyPnL
      });
    }
    
    return cumulativeData;
  }, [trades, isLoading, initialBalance]);
  
  // Calculate key statistics
  const stats = useMemo(() => {
    if (accountGrowthData.length === 0) {
      return {
        totalGrowthPercent: 0,
        maxDrawdownPercent: 0,
        currentBalance: initialBalance,
      };
    }
    
    const currentBalance = accountGrowthData[accountGrowthData.length - 1].balance;
    const totalGrowthPercent = ((currentBalance / initialBalance) - 1) * 100;
    
    // Calculate max drawdown
    let maxBalance = initialBalance;
    let maxDrawdown = 0;
    
    accountGrowthData.forEach(day => {
      if (day.balance > maxBalance) {
        maxBalance = day.balance;
      }
      
      const drawdown = ((maxBalance - day.balance) / maxBalance) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return {
      totalGrowthPercent,
      maxDrawdownPercent: maxDrawdown,
      currentBalance,
    };
  }, [accountGrowthData, initialBalance]);

  if (isLoading) {
    return (
      <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Tăng Trưởng Tài Khoản</CardTitle>
          <CardDescription>Tỷ lệ tăng trưởng của tài khoản giao dịch theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (accountGrowthData.length === 0) {
    return (
      <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>Tăng Trưởng Tài Khoản</CardTitle>
          <CardDescription>Tỷ lệ tăng trưởng của tài khoản giao dịch theo thời gian</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <p className="text-muted-foreground">Không đủ dữ liệu để hiển thị tăng trưởng tài khoản.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <div>
          <CardTitle>Tăng Trưởng Tài Khoản (%)</CardTitle>
          <CardDescription>Số dư ban đầu: {formatCurrency(initialBalance)}</CardDescription>
        </div>
        <div className="flex flex-col space-y-1 sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Hiện tại:</span>
            <span className={`text-base font-bold ${stats.totalGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.totalGrowthPercent.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Giảm Tối Đa:</span>
            <span className="text-base font-bold text-red-600">
              {stats.maxDrawdownPercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={accountGrowthData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.2} />
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(dateStr) => format(parseISO(dateStr), 'dd/MM')}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}%`, "Tăng trưởng"]}
              labelFormatter={(dateStr) => format(parseISO(dateStr as string), 'dd/MM/yyyy')}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderRadius: 'var(--radius)',
                borderColor: 'hsl(var(--border))' 
              }}
            />
            <Area 
              type="monotone" 
              dataKey="growthPercent" 
              stroke="hsl(var(--chart-2))" 
              fillOpacity={1}
              fill="url(#colorGrowth)" 
              strokeWidth={2}
              activeDot={{ r: 6 }}
              // Use different colors for positive vs negative values
              strokeColor={({ value }) => (value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))')}
              dot={({ payload, index }) => {
                const value = payload.growthPercent;
                const fill = value >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))';
                return (
                  <circle 
                    key={`dot-${index}`} // Adding unique key for each dot
                    cx={0}
                    cy={0}
                    r={4}
                    stroke={fill}
                    strokeWidth={2}
                    fill={fill}
                    opacity={0.8}
                  />
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}