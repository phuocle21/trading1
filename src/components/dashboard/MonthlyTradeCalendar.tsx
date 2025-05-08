"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { calculateProfitLoss, formatCurrency, formatDate } from "@/lib/trade-utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { Trade } from "@/types";
import { format, isSameDay, subDays } from "date-fns";

interface MonthlyTradeCalendarProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function MonthlyTradeCalendar({ trades, isLoading }: MonthlyTradeCalendarProps) {
  // Group trades by day for the past 30 days
  const dailyTradeStats = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    const stats: Array<{
      date: Date;
      count: number;
      winCount: number;
      lossCount: number;
      totalPnL: number;
      trades: Trade[];
    }> = [];
    
    // Get the past 30 days
    const today = new Date();
    const startDate = subDays(today, 30);
    
    // Initialize array with all days
    for (let i = 0; i <= 30; i++) {
      const date = subDays(today, i);
      stats.push({
        date,
        count: 0,
        winCount: 0,
        lossCount: 0,
        totalPnL: 0,
        trades: [],
      });
    }
    
    // Add trade data to each day
    trades.forEach(trade => {
      if (!trade.exitDate) return; // Skip open trades
      
      const exitDate = new Date(trade.exitDate);
      const dayIndex = stats.findIndex(day => isSameDay(day.date, exitDate));
      
      if (dayIndex >= 0) {
        const pnl = calculateProfitLoss(trade);
        if (pnl === null) return;
        
        stats[dayIndex].count += 1;
        stats[dayIndex].totalPnL += pnl;
        stats[dayIndex].trades.push(trade);
        
        if (pnl > 0) {
          stats[dayIndex].winCount += 1;
        } else if (pnl < 0) {
          stats[dayIndex].lossCount += 1;
        }
      }
    });
    
    // Sort by date (newest first) and filter to include only days with trades and limit to most recent 30 days
    return stats
      .filter(day => day.count > 0)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 30);
  }, [trades, isLoading]);

  // Get totals for the period
  const periodStats = useMemo(() => {
    if (dailyTradeStats.length === 0) return {
      days: 0,
      count: 0,
      winCount: 0,
      lossCount: 0,
      totalPnL: 0,
      winRate: 0,
    };
    
    const days = dailyTradeStats.length;
    const count = dailyTradeStats.reduce((sum, day) => sum + day.count, 0);
    const winCount = dailyTradeStats.reduce((sum, day) => sum + day.winCount, 0);
    const lossCount = dailyTradeStats.reduce((sum, day) => sum + day.lossCount, 0);
    const totalPnL = dailyTradeStats.reduce((sum, day) => sum + day.totalPnL, 0);
    const winRate = count > 0 ? (winCount / count) * 100 : 0;
    
    return {
      days,
      count,
      winCount,
      lossCount,
      totalPnL,
      winRate,
    };
  }, [dailyTradeStats]);

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Monthly Trading Activity</CardTitle>
          <CardDescription>Your trading results for the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (dailyTradeStats.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Monthly Trading Activity</CardTitle>
          <CardDescription>Your trading results for the past 30 days</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 sm:py-8">
          <p className="text-muted-foreground text-sm sm:text-base">No trades completed in the past 30 days.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">Monthly Trading Activity</CardTitle>
        <CardDescription className="text-sm">
          {periodStats.days} trading days with {periodStats.count} trades in the past month
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px] text-xs sm:text-sm">Date</TableHead>
                <TableHead className="text-center w-[60px] text-xs sm:text-sm">Trades</TableHead>
                <TableHead className="text-center w-[80px] text-xs sm:text-sm">Win/Loss</TableHead>
                <TableHead className="text-right w-[70px] text-xs sm:text-sm">P/L</TableHead>
                <TableHead className="text-right w-[70px] text-xs sm:text-sm">Win %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTradeStats.map((day, index) => {
                const winRate = day.count > 0 ? (day.winCount / day.count) * 100 : 0;
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium text-xs sm:text-sm py-2">{format(day.date, 'MMM dd')}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm py-2">{day.count}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm py-2">
                      <span className="text-green-600">{day.winCount}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-red-600">{day.lossCount}</span>
                    </TableCell>
                    <TableCell 
                      className={`text-right text-xs sm:text-sm py-2 ${day.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(day.totalPnL, 'USD', true)}
                    </TableCell>
                    <TableCell 
                      className={`text-right font-medium text-xs sm:text-sm py-2 ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {winRate.toFixed(0)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-muted/30 font-medium">
                <TableCell className="font-medium text-xs sm:text-sm py-2">Period Total</TableCell>
                <TableCell className="text-center text-xs sm:text-sm py-2">{periodStats.count}</TableCell>
                <TableCell className="text-center text-xs sm:text-sm py-2">
                  <span className="text-green-600">{periodStats.winCount}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-red-600">{periodStats.lossCount}</span>
                </TableCell>
                <TableCell 
                  className={`text-right text-xs sm:text-sm py-2 ${periodStats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {formatCurrency(periodStats.totalPnL, 'USD', true)}
                </TableCell>
                <TableCell 
                  className={`text-right font-medium text-xs sm:text-sm py-2 ${periodStats.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {periodStats.winRate.toFixed(0)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}