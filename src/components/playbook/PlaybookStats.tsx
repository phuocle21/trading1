"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Clock, DollarSign, LineChart, PercentIcon, 
  TrendingUp, TrendingDown, BarChart3, Award, Users,
  BarChart4, Target, Activity, BarChart, BookOpen, BadgePercent
} from "lucide-react";
import { Playbook } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrades } from '@/contexts/TradeContext';

interface PlaybookStatsProps {
  playbook: Playbook;
  onClose: () => void;
}

export default function PlaybookStats({ playbook, onClose }: PlaybookStatsProps) {
  const { t } = useLanguage();
  const { trades, refreshTrades } = useTrades();
  const [playbookTrades, setPlaybookTrades] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    winRate: 0,
    avgProfit: 0,
    avgLoss: 0, // Thêm phần thua lỗ trung bình
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

  // Refresh dữ liệu khi component này được hiển thị
  useEffect(() => {
    // Refresh trades data when the stats component opens
    refreshTrades();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lọc giao dịch thuộc playbook hiện tại và tính toán thống kê
  useEffect(() => {
    if (!trades || trades.length === 0) {
      console.log("Không có giao dịch nào để hiển thị thống kê");
      return;
    }

    console.log("Tổng số giao dịch:", trades.length);
    console.log("Playbook ID cần lọc:", playbook.id);
    
    // Lọc các giao dịch thuộc playbook này
    const filteredTrades = trades.filter(trade => {
      // Kiểm tra playbook ID khớp
      const playbookMatched = String(trade.playbook) === String(playbook.id);
      
      // Kiểm tra xem giao dịch đã đóng chưa - giao dịch được coi là đóng khi có exitDate hoặc trường status là 'closed'
      const isClosed = (trade.status === 'closed') || 
                       (trade.exitDate && trade.exitDate !== '');
      
      console.log(`Giao dịch ${trade.id}: playbook=${trade.playbook}, closed=${isClosed}`);
      
      return playbookMatched && isClosed;
    });
    
    console.log("Số giao dịch đã lọc theo playbook:", filteredTrades.length);
    if (filteredTrades.length > 0) {
      console.log("Ví dụ giao dịch đầu tiên:", filteredTrades[0]);
    }
    
    setPlaybookTrades(filteredTrades);
    
    // Nếu không có giao dịch thì trả về
    if (filteredTrades.length === 0) return;

    // Tính toán thống kê
    const winningTrades = filteredTrades.filter(trade => {
      // Nếu có returnValue thì dùng returnValue
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        return trade.returnValue > 0;
      }
      
      // Nếu có entryPrice và exitPrice thì tính thủ công
      if (trade.entryPrice && trade.exitPrice) {
        if (trade.tradeType === 'buy') {
          return trade.exitPrice > trade.entryPrice;
        } else {
          return trade.exitPrice < trade.entryPrice;
        }
      }
      
      return false; // Không đủ dữ liệu để tính
    });
    
    const losingTrades = filteredTrades.filter(trade => !winningTrades.includes(trade));
    
    const winRate = (winningTrades.length / filteredTrades.length) * 100;
    
    // Tính tổng lợi nhuận của các giao dịch thắng
    const totalGainValue = winningTrades.reduce((acc, trade) => {
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        return acc + (trade.returnValue > 0 ? trade.returnValue : 0);
      }
      
      if (trade.entryPrice && trade.exitPrice && trade.quantity) {
        const entryAmount = trade.quantity * trade.entryPrice;
        const exitAmount = trade.quantity * trade.exitPrice;
        let profit = 0;
        
        if (trade.tradeType === 'buy') {
          profit = exitAmount - entryAmount;
        } else {
          profit = entryAmount - exitAmount;
        }
        
        return acc + (profit > 0 ? profit : 0);
      }
      
      return acc;
    }, 0);
    
    // Tính lợi nhuận trung bình đúng: Tổng lợi nhuận của các giao dịch thắng chia cho số lượng giao dịch thắng
    const avgProfit = winningTrades.length > 0 ? totalGainValue / winningTrades.length : 0;
    
    // Tính tổng thua lỗ của các giao dịch thua
    const totalLossValue = losingTrades.reduce((acc, trade) => {
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        return acc + (trade.returnValue < 0 ? Math.abs(trade.returnValue) : 0);
      }
      
      if (trade.entryPrice && trade.exitPrice && trade.quantity) {
        const entryAmount = trade.quantity * trade.entryPrice;
        const exitAmount = trade.quantity * trade.exitPrice;
        let loss = 0;
        
        if (trade.tradeType === 'buy') {
          loss = exitAmount - entryAmount;
        } else {
          loss = entryAmount - exitAmount;
        }
        
        return acc + (loss < 0 ? Math.abs(loss) : 0);
      }
      
      return acc;
    }, 0);
    
    // Tính thua lỗ trung bình đúng: Tổng thua lỗ của các giao dịch thua chia cho số lượng giao dịch thua
    const avgLoss = losingTrades.length > 0 ? totalLossValue / losingTrades.length : 0;
    
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
      // Xác định thắng/thua dựa trên giá trị returnValue hoặc giá mua/bán
      let isWin = false;
      
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        isWin = trade.returnValue > 0;
      } else if (trade.entryPrice && trade.exitPrice) {
        if (trade.tradeType === 'buy') {
          isWin = trade.exitPrice > trade.entryPrice;
        } else {
          isWin = trade.exitPrice < trade.entryPrice;
        }
      }
      
      if (isWin) {
        currentWins++;
        currentLosses = 0;
        if (currentWins > maxWins) maxWins = currentWins;
      } else {
        currentLosses++;
        currentWins = 0;
        if (currentLosses > maxLosses) maxLosses = currentLosses;
      }
    });
    
    // Cải thiện cách tính thời gian giữ trung bình
    let totalHoldingTime = 0;
    let tradesWithTime = 0;
    
    filteredTrades.forEach(trade => {
      if (trade.entryDate && trade.exitDate) {
        try {
          const entryDate = new Date(trade.entryDate);
          const exitDate = new Date(trade.exitDate);
          
          if (!isNaN(entryDate.getTime()) && !isNaN(exitDate.getTime())) {
            // Thời gian entry và exit hợp lệ
            let entryTime = entryDate.getTime();
            let exitTime = exitDate.getTime();
            
            // Thêm giờ nếu có
            if (trade.entryTime) {
              const [hours, minutes, seconds] = trade.entryTime.split(':').map(Number);
              if (!isNaN(hours) && !isNaN(minutes)) {
                entryDate.setHours(hours, minutes, seconds || 0);
                entryTime = entryDate.getTime();
              }
            }
            
            if (trade.exitTime) {
              const [hours, minutes, seconds] = trade.exitTime.split(':').map(Number);
              if (!isNaN(hours) && !isNaN(minutes)) {
                exitDate.setHours(hours, minutes, seconds || 0);
                exitTime = exitDate.getTime();
              }
            }
            
            // Kiểm tra thời gian hợp lệ (exitTime > entryTime)
            if (exitTime > entryTime) {
              totalHoldingTime += (exitTime - entryTime) / (1000 * 60 * 60); // Giờ
              tradesWithTime++;
            }
          }
        } catch (error) {
          console.error("Lỗi khi xử lý thời gian:", error);
        }
      }
    });
    
    const averageHoldingTime = tradesWithTime > 0 ? totalHoldingTime / tradesWithTime : 0;
    
    // Tìm lợi nhuận lớn nhất và thua lỗ lớn nhất
    let largestWin = 0;
    let largestLoss = 0;
    
    winningTrades.forEach(trade => {
      let profitValue = 0;
      
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        profitValue = trade.returnValue > 0 ? trade.returnValue : 0;
      } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
        const entryAmount = trade.quantity * trade.entryPrice;
        const exitAmount = trade.quantity * trade.exitPrice;
        
        if (trade.tradeType === 'buy') {
          profitValue = exitAmount - entryAmount;
        } else {
          profitValue = entryAmount - exitAmount;
        }
        
        // Đảm bảo chỉ tính các giá trị lợi nhuận dương
        profitValue = profitValue > 0 ? profitValue : 0;
      }
      
      if (profitValue > largestWin) {
        largestWin = profitValue;
      }
    });
    
    losingTrades.forEach(trade => {
      let lossValue = 0;
      
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        lossValue = trade.returnValue < 0 ? Math.abs(trade.returnValue) : 0;
      } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
        const entryAmount = trade.quantity * trade.entryPrice;
        const exitAmount = trade.quantity * trade.exitPrice;
        let tradePnL = 0;
        
        if (trade.tradeType === 'buy') {
          tradePnL = exitAmount - entryAmount;
        } else {
          tradePnL = entryAmount - exitAmount;
        }
        
        // Tính giá trị tuyệt đối của khoản lỗ
        lossValue = tradePnL < 0 ? Math.abs(tradePnL) : 0;
      }
      
      if (lossValue > largestLoss) {
        largestLoss = lossValue;
      }
    });
    
    // Cải thiện cách tính profit factor, sử dụng lại giá trị từ tính toán trước đó
    // totalGainValue đã được tính từ trước (trong phần tính avgProfit)
    // totalLossValue đã được tính từ trước (trong phần tính avgLoss)
    const profitFactor = totalLossValue > 0 ? totalGainValue / totalLossValue : (totalGainValue > 0 ? Infinity : 0);
    
    setStats({
      winRate,
      avgProfit,
      avgLoss,
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {playbook.name}
          </h2>
          <p className="text-muted-foreground">{t('playbooks.statisticsAndAnalysis')}</p>
        </div>
        <Button onClick={onClose} variant="outline">
          {t('playbooks.close')}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-600 shadow-md">
          <CardHeader className="pb-2 bg-gradient-to-r from-blue-50/70 to-transparent dark:from-blue-950/30">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <BadgePercent className="h-5 w-5" />
              {t('playbooks.performanceMetrics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                <dt className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center">
                  <PercentIcon className="w-4 h-4 mr-1" /> {t('playbooks.winRate')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-300">
                  {stats.winRate.toFixed(1)}%
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                <dt className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" /> {t('playbooks.avgProfit')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-300 truncate">
                  ${stats.avgProfit.toFixed(2)}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-800">
                <dt className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" /> {t('playbooks.avgLoss')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-300 truncate">
                  ${stats.avgLoss.toFixed(2)}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                <dt className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400 flex items-center">
                  <LineChart className="w-4 h-4 mr-1" /> {t('playbooks.profitFactor')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-amber-800 dark:text-amber-300 truncate">
                  {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-indigo-500 dark:border-l-indigo-600 shadow-md">
          <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50/70 to-transparent dark:from-indigo-950/30">
            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Activity className="h-5 w-5" />
              {t('playbooks.streaksAndTiming')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <dt className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" /> {t('playbooks.consecutiveWins')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                  {stats.consecutiveWins}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-pink-50 to-pink-100/50 dark:from-pink-950/40 dark:to-pink-900/20 border border-pink-200 dark:border-pink-800">
                <dt className="text-xs sm:text-sm font-medium text-pink-700 dark:text-pink-400 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" /> {t('playbooks.consecutiveLosses')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-pink-800 dark:text-pink-300">
                  {stats.consecutiveLosses}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-sky-50 to-sky-100/50 dark:from-sky-950/40 dark:to-sky-900/20 border border-sky-200 dark:border-sky-800">
                <dt className="text-xs sm:text-sm font-medium text-sky-700 dark:text-sky-400 flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> {t('playbooks.avgHoldingTime')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-sky-800 dark:text-sky-300">
                  {stats.averageHoldingTime.toFixed(1)}h
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-teal-950/40 dark:to-teal-900/20 border border-teal-200 dark:border-teal-800">
                <dt className="text-xs sm:text-sm font-medium text-teal-700 dark:text-teal-400 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" /> {t('playbooks.timeframe')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-teal-800 dark:text-teal-300 truncate">
                  {playbook.timeframe || t('playbooks.na')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4 grid grid-cols-1 gap-4">
        <Card className="overflow-hidden border-l-4 border-l-orange-500 dark:border-l-orange-600 shadow-md">
          <CardHeader className="pb-2 bg-gradient-to-r from-orange-50/70 to-transparent dark:from-orange-950/30">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Award className="h-5 w-5" />
              {t('playbooks.tradeResults')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 border border-green-200 dark:border-green-800">
                <dt className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400">
                  {t('playbooks.totalWins')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-300">
                  {stats.totalWins}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200 dark:border-red-800">
                <dt className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-400">
                  {t('playbooks.totalLosses')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-red-800 dark:text-red-300">
                  {stats.totalLosses}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <dt className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {t('playbooks.bestTrade')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-emerald-800 dark:text-emerald-300 truncate">
                  ${stats.largestWin.toFixed(2)}
                </dd>
              </div>
              <div className="flex flex-col space-y-1 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-rose-50 to-rose-100/50 dark:from-rose-950/40 dark:to-rose-900/20 border border-rose-200 dark:border-rose-800">
                <dt className="text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-400">
                  {t('playbooks.worstTrade')}
                </dt>
                <dd className="text-xl sm:text-2xl font-bold text-rose-800 dark:text-rose-300 truncate">
                  ${stats.largestLoss.toFixed(2)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
      
      {playbookTrades.length === 0 && (
        <div className="p-6 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-950/40 dark:to-gray-900/20 border-gray-200 dark:border-gray-800 text-center mt-4 shadow-sm">
          <Target className="mx-auto h-10 w-10 text-indigo-500 mb-2" />
          <p className="mb-2 font-medium text-lg">{t('playbooks.noTradesYet')}</p>
          <p className="text-sm text-muted-foreground">{t('playbooks.addTradesHint')}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Hãy thêm giao dịch với chiến lược "<span className="font-semibold text-primary">{playbook.name}</span>" để xem thống kê chi tiết.
            <br />Đảm bảo giao dịch của bạn có chọn chiến lược này trong phần cài đặt.
          </p>
        </div>
      )}
    </div>
  );
}