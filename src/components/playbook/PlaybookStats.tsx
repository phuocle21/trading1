"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, LineChart, PercentIcon, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { Playbook } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/contexts/TradeContext';

interface PlaybookStatsProps {
  playbook: Playbook;
  onClose: () => void;
}

export default function PlaybookStats({ playbook, onClose }: PlaybookStatsProps) {
  const { t } = useLanguage();
  const { trades } = useTrades();
  const [playbookTrades, setPlaybookTrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    winRate: 0,
    avgProfit: 0,
    totalTrades: 0,
    profitFactor: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    averageHoldingTime: 0,
    totalWins: 0,
    totalLosses: 0,
    largestWin: 0,
    largestLoss: 0
  });

  // Lọc giao dịch thuộc playbook hiện tại và tính toán thống kê
  useEffect(() => {
    if (!trades || trades.length === 0) return;

    // Lọc các giao dịch thuộc playbook này
    const filteredTrades = trades.filter(trade => 
      trade.playbook === playbook.id && trade.status === 'closed'
    );
    
    setPlaybookTrades(filteredTrades);
    
    // Nếu không có giao dịch thì trả về
    if (filteredTrades.length === 0) return;

    // Tính toán thống kê
    const winningTrades = filteredTrades.filter(trade => 
      trade.returnValue && trade.returnValue > 0
    );
    
    const losingTrades = filteredTrades.filter(trade => 
      trade.returnValue && trade.returnValue <= 0
    );
    
    const winRate = (winningTrades.length / filteredTrades.length) * 100;
    
    const totalProfit = filteredTrades.reduce((acc, trade) => 
      acc + (trade.returnValue || 0), 0
    );
    
    const avgProfit = totalProfit / filteredTrades.length;
    
    // Tìm chuỗi thắng/thua lớn nhất
    let currentWins = 0;
    let maxWins = 0;
    let currentLosses = 0;
    let maxLosses = 0;
    
    // Sắp xếp theo ngày để đảm bảo tính đúng chuỗi
    const sortedTrades = [...filteredTrades].sort((a, b) => {
      const dateA = a.exitDate ? new Date(a.exitDate).getTime() : 0;
      const dateB = b.exitDate ? new Date(b.exitDate).getTime() : 0;
      return dateA - dateB;
    });
    
    sortedTrades.forEach(trade => {
      if (trade.returnValue && trade.returnValue > 0) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxWins) maxWins = currentWins;
      } else {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxLosses) maxLosses = currentLosses;
      }
    });
    
    // Tính thời gian giữ trung bình (nếu có dữ liệu thời gian)
    let totalHoldingTime = 0;
    let tradesWithTime = 0;
    
    filteredTrades.forEach(trade => {
      if (trade.entryDate && trade.exitDate) {
        const entryTime = new Date(`${trade.entryDate} ${trade.entryTime || '00:00:00'}`).getTime();
        const exitTime = new Date(`${trade.exitDate} ${trade.exitTime || '00:00:00'}`).getTime();
        if (entryTime && exitTime) {
          totalHoldingTime += (exitTime - entryTime) / (1000 * 60 * 60); // Giờ
          tradesWithTime++;
        }
      }
    });
    
    const averageHoldingTime = tradesWithTime > 0 ? totalHoldingTime / tradesWithTime : 0;
    
    // Tìm lợi nhuận/lỗ lớn nhất
    let largestWin = 0;
    let largestLoss = 0;
    
    filteredTrades.forEach(trade => {
      if (trade.returnValue) {
        if (trade.returnValue > largestWin) largestWin = trade.returnValue;
        if (trade.returnValue < largestLoss) largestLoss = trade.returnValue;
      }
    });
    
    // Tính profit factor (tổng lợi nhuận / tổng lỗ)
    const totalGain = winningTrades.reduce((acc, trade) => acc + (trade.returnValue || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((acc, trade) => acc + (trade.returnValue || 0), 0));
    const profitFactor = totalLoss > 0 ? totalGain / totalLoss : 0;
    
    setStats({
      winRate,
      avgProfit,
      totalTrades: filteredTrades.length,
      profitFactor,
      consecutiveWins: maxWins,
      consecutiveLosses: maxLosses,
      averageHoldingTime,
      totalWins: winningTrades.length,
      totalLosses: losingTrades.length,
      largestWin,
      largestLoss
    });
    
  }, [trades, playbook.id]);

  // Chuẩn bị dữ liệu cho biểu đồ
  const chartData = [
    { name: t('playbooks.wins'), value: stats.totalWins },
    { name: t('playbooks.losses'), value: stats.totalLosses }
  ];

  // Dữ liệu biểu đồ theo tháng
  const monthlyData = () => {
    const data: any = {};
    
    playbookTrades.forEach(trade => {
      if (trade.exitDate) {
        const date = new Date(trade.exitDate);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!data[monthYear]) {
          data[monthYear] = {
            name: monthYear,
            profit: 0,
            trades: 0,
            wins: 0,
            losses: 0
          };
        }
        
        data[monthYear].profit += trade.returnValue || 0;
        data[monthYear].trades += 1;
        
        if (trade.returnValue && trade.returnValue > 0) {
          data[monthYear].wins += 1;
        } else {
          data[monthYear].losses += 1;
        }
      }
    });
    
    return Object.values(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{playbook.name}</h2>
          <p className="text-muted-foreground">{t('playbooks.statisticsAndAnalysis')}</p>
        </div>
        <Button onClick={onClose} variant="outline">
          {t('playbooks.close')}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="overview">{t('playbooks.overview')}</TabsTrigger>
          <TabsTrigger value="charts">{t('playbooks.charts')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t('playbooks.performanceMetrics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <PercentIcon className="w-4 h-4 mr-1" /> {t('playbooks.winRate')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.winRate.toFixed(1)}%
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <DollarSign className="w-4 h-4 mr-1" /> {t('playbooks.avgProfit')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.avgProfit.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" /> {t('playbooks.totalTrades')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.totalTrades}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <LineChart className="w-4 h-4 mr-1" /> {t('playbooks.profitFactor')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.profitFactor.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t('playbooks.streaksAndTiming')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" /> {t('playbooks.consecutiveWins')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.consecutiveWins}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <TrendingDown className="w-4 h-4 mr-1" /> {t('playbooks.consecutiveLosses')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.consecutiveLosses}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <Clock className="w-4 h-4 mr-1" /> {t('playbooks.avgHoldingTime')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {stats.averageHoldingTime.toFixed(1)}h
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground flex items-center">
                      <Calendar className="w-4 h-4 mr-1" /> {t('playbooks.timeframe')}
                    </dt>
                    <dd className="text-2xl font-bold">
                      {playbook.timeframe || t('playbooks.na')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>{t('playbooks.tradeResults')}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('playbooks.totalWins')}
                    </dt>
                    <dd className="text-2xl font-bold text-green-500">
                      {stats.totalWins}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('playbooks.totalLosses')}
                    </dt>
                    <dd className="text-2xl font-bold text-red-500">
                      {stats.totalLosses}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('playbooks.bestTrade')}
                    </dt>
                    <dd className="text-2xl font-bold text-green-500">
                      {stats.largestWin.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">
                      {t('playbooks.worstTrade')}
                    </dt>
                    <dd className="text-2xl font-bold text-red-500">
                      {stats.largestLoss.toFixed(2)}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="charts">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('playbooks.winLossRatio')}</CardTitle>
                <CardDescription>
                  {t('playbooks.winLossRatioDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name={t('playbooks.trades')} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('playbooks.monthlyPerformance')}</CardTitle>
                <CardDescription>
                  {t('playbooks.monthlyPerformanceDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="profit" name={t('playbooks.profit')} fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="trades" name={t('playbooks.trades')} fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}