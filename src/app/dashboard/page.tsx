"use client";

import { useTrades } from "@/contexts/TradeContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";
import { TradeCalendar } from "@/components/dashboard/TradeCalendar";
import { AccountGrowthChart } from "@/components/dashboard/AccountGrowthChart";
import { calculateProfitLoss, formatCurrency } from "@/lib/trade-utils";
import { DollarSign, Percent, TrendingUp, TrendingDown, CalendarDays, BarChart, AlertTriangle, Database } from "lucide-react";
import type { Trade } from "@/types";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { trades, isLoading, loadDemoData } = useTrades();
  const [activeTab, setActiveTab] = useState("overview");

  const closedTrades = useMemo(() => trades.filter(trade => trade.exitPrice && trade.exitDate), [trades]);

  const dashboardStats = useMemo(() => {
    if (isLoading) return {
        totalProfitLoss: 0,
        winRate: 0,
        averageTradeDuration: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
    };

    let totalProfitLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalDuration = 0;
    let tradesWithDuration = 0;

    closedTrades.forEach((trade: Trade) => {
      const pnl = calculateProfitLoss(trade);
      if (pnl !== null) {
        totalProfitLoss += pnl;
        if (pnl > 0) winningTrades++;
        else if (pnl < 0) losingTrades++;
      }

      if (trade.entryDate && trade.exitDate) {
        const entry = new Date(trade.entryDate).getTime();
        const exit = new Date(trade.exitDate).getTime();
        if (!isNaN(entry) && !isNaN(exit) && exit > entry) {
          totalDuration += (exit - entry) / (1000 * 60 * 60 * 24); // Duration in days
          tradesWithDuration++;
        }
      }
    });

    const totalClosedTrades = closedTrades.length;
    const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
    const averageTradeDuration = tradesWithDuration > 0 ? totalDuration / tradesWithDuration : 0;

    return {
      totalProfitLoss,
      winRate,
      averageTradeDuration,
      totalTrades: trades.length,
      winningTrades,
      losingTrades,
    };
  }, [trades, closedTrades, isLoading]);
  
  if (!isLoading && trades.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center py-8 sm:py-12 shadow-xl">
        <CardHeader>
          <BarChart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary mb-4" />
          <CardTitle className="text-xl sm:text-2xl font-semibold">Welcome to Trade Insights!</CardTitle>
          <CardDescription className="text-muted-foreground text-sm sm:text-base">
            It looks like you haven't added any trades yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="mb-2 text-sm sm:text-base">
            Get started by adding your first trade to see your performance dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="sm" className="sm:size-auto">
              <Link href="/add-trade">Add Your First Trade</Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:size-auto flex items-center gap-2"
              onClick={loadDemoData}
            >
              <Database className="h-4 w-4" />
              Load Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const openTradesCount = trades.length - closedTrades.length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Trading Dashboard</h1>
        {trades.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDemoData} 
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Refresh Demo Data
          </Button>
        )}
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4">
          {openTradesCount > 0 && (
            <Card className="bg-accent/20 border-accent shadow-md">
              <CardHeader className="flex flex-col items-start space-y-2 pb-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
                <CardTitle className="text-base sm:text-lg text-accent-foreground">Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-accent-foreground text-sm sm:text-base">
                  You have {openTradesCount} open trade{openTradesCount > 1 ? 's' : ''}. Statistics below are based on closed trades only.
                </p>
              </CardContent>
            </Card>
          )}
          
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total P/L"
              value={formatCurrency(dashboardStats.totalProfitLoss)}
              icon={DollarSign}
              isLoading={isLoading}
              valueClassName={dashboardStats.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}
            />
            <StatCard
              title="Win Rate"
              value={`${dashboardStats.winRate.toFixed(1)}%`}
              icon={Percent}
              isLoading={isLoading}
            />
            <StatCard
              title="Avg. Trade Duration"
              value={`${dashboardStats.averageTradeDuration.toFixed(1)} days`}
              icon={CalendarDays}
              isLoading={isLoading}
            />
            <StatCard
              title="Total Closed Trades"
              value={closedTrades.length}
              icon={BarChart}
              isLoading={isLoading}
            />
            <StatCard
              title="Winning Trades"
              value={dashboardStats.winningTrades}
              icon={TrendingUp}
              isLoading={isLoading}
              valueClassName="text-green-600"
            />
            <StatCard
              title="Losing Trades"
              value={dashboardStats.losingTrades}
              icon={TrendingDown}
              isLoading={isLoading}
              valueClassName="text-red-600"
            />
          </div>

          <PerformanceChart trades={closedTrades} isLoading={isLoading} />
          
          <TradeCalendar trades={trades} isLoading={isLoading} />
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setActiveTab("advanced")}>
              View Advanced Analytics
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 md:space-y-6 mt-4">
          <AccountGrowthChart trades={closedTrades} isLoading={isLoading} initialBalance={10000} />
          
          <AdvancedAnalytics trades={closedTrades} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

