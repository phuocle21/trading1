"use client";

import { useJournals } from "@/contexts/JournalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AdvancedAnalytics } from "@/components/dashboard/AdvancedAnalytics";
import { TradeCalendar } from "@/components/dashboard/TradeCalendar";
import { AccountGrowthChart } from "@/components/dashboard/AccountGrowthChart";
import { JournalHeader } from "@/components/ui/journal-header";
import { calculateProfitLoss, formatCurrency, calculateRMultiple } from "@/lib/trade-utils";
import { DollarSign, Percent, TrendingUp, TrendingDown, CalendarDays, BarChart, AlertTriangle, Database, BookOpen } from "lucide-react";
import type { Trade } from "@/types";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { subDays } from 'date-fns';

// Định nghĩa type TimePeriod
type PerformanceTimePeriod = '7d' | '30d' | '90d' | '1y' | 'all';

export default function DashboardPage() {
  const { getCurrentJournal, currentJournalId, isLoading: journalLoading } = useJournals();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [timePeriod, setTimePeriod] = useState("all");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Lấy dữ liệu giao dịch từ API thay vì từ journal
  useEffect(() => {
    const fetchTrades = async () => {
      setIsLoading(true);
      try {
        // Thêm tham số journalId để lọc giao dịch theo nhật ký hiện tại
        const response = await fetch(`/api/trades?journalId=${currentJournalId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        if (data.trades && Array.isArray(data.trades)) {
          console.log(`Dashboard loaded ${data.trades.length} trades for journal ${currentJournalId}`);
          setTrades(data.trades);
        } else {
          setTrades([]);
        }
      } catch (error) {
        console.error('Error loading trades from API:', error);
        setTrades([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!journalLoading && currentJournalId) {
      fetchTrades();
    } else {
      setTrades([]);
    }
  }, [journalLoading, currentJournalId]); // Thêm currentJournalId vào dependency array

  const currentJournal = getCurrentJournal();
  
  const closedTrades = useMemo(() => trades.filter(trade => trade.exitPrice && trade.exitDate), [trades]);

  // Map dashboard time period to performance chart time period
  const mapToPerfChartTimePeriod = (dashboardTimePeriod: string): PerformanceTimePeriod => {
    switch (dashboardTimePeriod) {
      case "7days": return "7d";
      case "30days": return "30d";
      case "90days": return "90d";
      default: return "all";
    }
  };

  // Filter trades based on selected time period
  const filteredTrades = useMemo(() => {
    if (timePeriod === "all") return closedTrades;
    
    const now = new Date();
    let startDate;
    
    switch (timePeriod) {
      case "7days":
        startDate = subDays(now, 7);
        break;
      case "30days":
        startDate = subDays(now, 30);
        break;
      case "90days":
        startDate = subDays(now, 90);
        break;
      default:
        return closedTrades;
    }
    
    return closedTrades.filter(trade => {
      if (!trade.exitDate) return false;
      const exitDate = new Date(trade.exitDate);
      return exitDate >= startDate && exitDate <= now;
    });
  }, [closedTrades, timePeriod]);

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

    filteredTrades.forEach((trade: Trade) => {
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

    const totalClosedTrades = filteredTrades.length;
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
  }, [trades, filteredTrades, isLoading]);
  
  if (!isLoading && trades.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center py-8 sm:py-12 shadow-xl">
        <CardHeader>
          <BarChart className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary mb-4" />
          <CardTitle className="text-xl sm:text-2xl font-semibold">{t('dashboard.welcome')}</CardTitle>
          <CardDescription className="text-muted-foreground text-sm sm:text-base">
            {t('dashboard.noTrades')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="mb-2 text-sm sm:text-base">
            {t('dashboard.getStarted')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="sm" className="sm:size-auto">
              <Link href="/add-trade">{t('dashboard.addFirstTrade')}</Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="sm:size-auto flex items-center gap-2"
              asChild
            >
              <Link href="/journals">
                <BookOpen className="h-4 w-4" />
                {t('dashboard.manageJournals')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const openTradesCount = trades.length - closedTrades.length;

  return (
    <div className="space-y-4 md:space-y-6 px-2 sm:px-0">
      <JournalHeader 
        title={t('dashboard.title')}
        icon={<BarChart className="h-6 w-6 text-primary" />}
      />

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
          <TabsTrigger value="advanced">{t('dashboard.advancedAnalytics')}</TabsTrigger>
        </TabsList>
        
        {/* Time period selector placed at top */}
        <div className="flex justify-end gap-2 mt-4 mb-2">
          <Button 
            size="sm" 
            variant={timePeriod === "7days" ? "default" : "outline"}
            onClick={() => setTimePeriod("7days")}
          >
            {t('dashboard.7days')}
          </Button>
          <Button 
            size="sm" 
            variant={timePeriod === "30days" ? "default" : "outline"}
            onClick={() => setTimePeriod("30days")}
          >
            {t('dashboard.30days')}
          </Button>
          <Button 
            size="sm" 
            variant={timePeriod === "90days" ? "default" : "outline"}
            onClick={() => setTimePeriod("90days")}
          >
            {t('dashboard.90days')}
          </Button>
          <Button 
            size="sm" 
            variant={timePeriod === "all" ? "default" : "outline"}
            onClick={() => setTimePeriod("all")}
          >
            {t('dashboard.allTime')}
          </Button>
        </div>
        
        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {openTradesCount > 0 && (
            <Card className="bg-[hsl(var(--warning-background))] border-[hsl(var(--warning-border))] shadow-md">
              <CardHeader className="flex flex-col items-start space-y-2 pb-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(var(--warning-foreground))]" />
                <CardTitle className="text-base sm:text-lg text-[hsl(var(--warning-foreground))]">{t('dashboard.openPositions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[hsl(var(--warning-foreground))] text-sm sm:text-base">
                  {t('dashboard.openPositionsMessage').replace('{count}', String(openTradesCount))}
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Layout: Calendar on left, Stats on right for larger screens */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Monthly Trade Calendar takes up 2/3 of the space */}
            <div className="lg:col-span-2">
              <TradeCalendar trades={trades} isLoading={isLoading} />
            </div>
            
            {/* Stats take up 1/3 of the space in a vertical layout */}
            <div className="space-y-3 lg:space-y-4">
              <StatCard
                title={t('dashboard.totalPL')}
                value={formatCurrency(dashboardStats.totalProfitLoss)}
                icon={DollarSign}
                isLoading={isLoading}
                valueClassName={dashboardStats.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}
                variant={dashboardStats.totalProfitLoss >= 0 ? "green" : "red"}
              />
              <StatCard
                title={t('dashboard.winRate')}
                value={`${dashboardStats.winRate.toFixed(1)}%`}
                icon={Percent}
                isLoading={isLoading}
                variant="blue"
              />
              <StatCard
                title={t('dashboard.avgTradeDuration')}
                value={`${dashboardStats.averageTradeDuration.toFixed(1)} ${t('dashboard.days')}`}
                icon={CalendarDays}
                isLoading={isLoading}
                variant="purple"
              />
              <StatCard
                title={t('dashboard.rMultiple')}
                value={calculateRMultiple(filteredTrades).toFixed(2) + 'R'}
                icon={BarChart}
                isLoading={isLoading}
                variant="amber"
              />
              <StatCard
                title={t('dashboard.winningTrades')}
                value={dashboardStats.winningTrades}
                icon={TrendingUp}
                isLoading={isLoading}
                valueClassName="text-green-600"
                variant="green"
              />
              <StatCard
                title={t('dashboard.losingTrades')}
                value={dashboardStats.losingTrades}
                icon={TrendingDown}
                isLoading={isLoading}
                valueClassName="text-red-600"
                variant="red"
              />
            </div>
          </div>
          
          {/* Account Growth Chart full width */}
          <AccountGrowthChart 
            trades={filteredTrades} 
            isLoading={isLoading} 
            initialBalance={currentJournal?.settings?.initialCapital || 10000} 
          />

          <PerformanceChart 
            trades={filteredTrades} 
            isLoading={isLoading} 
            initialTimePeriod={mapToPerfChartTimePeriod(timePeriod)}
            hideTimePeriodSelector
          />
          
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setActiveTab("advanced")}>
              {t('dashboard.viewAdvancedAnalytics')}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 md:space-y-6">
          <AdvancedAnalytics trades={filteredTrades} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

