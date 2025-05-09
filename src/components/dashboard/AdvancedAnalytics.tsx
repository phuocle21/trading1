"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area 
} from "recharts"
import { calculateProfitLoss, formatCurrency } from "@/lib/trade-utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { Trade } from "@/types"
import { useMemo } from "react"

interface AdvancedAnalyticsProps {
  trades: Trade[];
  isLoading?: boolean;
}

// Color palette for charts
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export function AdvancedAnalytics({ trades, isLoading }: AdvancedAnalyticsProps) {
  // 1. Distribution by Symbol
  const symbolDistribution = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    const symbolData: { [key: string]: { count: number, profit: number } } = {};
    
    trades.forEach(trade => {
      if (!trade.symbol) return;
      
      const pnl = calculateProfitLoss(trade) || 0;
      
      if (!symbolData[trade.symbol]) {
        symbolData[trade.symbol] = { count: 0, profit: 0 };
      }
      
      symbolData[trade.symbol].count += 1;
      symbolData[trade.symbol].profit += pnl;
    });
    
    return Object.entries(symbolData)
      .map(([name, data]) => ({ 
        name, 
        value: data.count,
        profit: data.profit
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 symbols
  }, [trades, isLoading]);

  // 2. Performance by Day of Week
  const dayOfWeekPerformance = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayData: { [key: string]: { total: number, count: number } } = {};
    
    // Initialize all days
    days.forEach(day => {
      dayData[day] = { total: 0, count: 0 };
    });
    
    trades.forEach(trade => {
      if (!trade.exitDate) return;
      
      const pnl = calculateProfitLoss(trade);
      if (pnl === null) return;
      
      const dayOfWeek = days[new Date(trade.exitDate).getDay()];
      dayData[dayOfWeek].total += pnl;
      dayData[dayOfWeek].count += 1;
    });
    
    return Object.entries(dayData)
      .map(([day, data]) => ({
        name: day.substring(0, 3), // Abbreviate day names
        total: data.total,
        count: data.count,
        average: data.count > 0 ? data.total / data.count : 0
      }))
      .filter(item => item.count > 0); // Only show days with trades
  }, [trades, isLoading]);

  // 3. Win Rate Over Time
  const winRateOverTime = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    const monthlyData: { [key: string]: { wins: number, total: number } } = {};
    
    trades.forEach(trade => {
      if (!trade.exitDate) return;
      
      const pnl = calculateProfitLoss(trade);
      if (pnl === null) return;
      
      const date = new Date(trade.exitDate);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { wins: 0, total: 0 };
      }
      
      monthlyData[monthYear].total += 1;
      if (pnl > 0) monthlyData[monthYear].wins += 1;
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        name: month,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
        trades: data.total
      }))
      .sort((a, b) => {
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-12); // Last 12 months
  }, [trades, isLoading]);

  // 4. Risk-Reward Analysis
  const riskRewardAnalysis = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return [];
    
    const riskRewardBuckets: { [key: string]: { count: number, won: number } } = {
      '<0.5': { count: 0, won: 0 },
      '0.5-1': { count: 0, won: 0 },
      '1-2': { count: 0, won: 0 },
      '2-3': { count: 0, won: 0 },
      '>3': { count: 0, won: 0 }
    };
    
    trades.forEach(trade => {
      if (!trade.riskRewardRatio || !trade.exitPrice) return;
      
      const rr = parseFloat(trade.riskRewardRatio.toString());
      if (isNaN(rr)) return;
      
      const pnl = calculateProfitLoss(trade);
      let bucket;
      
      if (rr < 0.5) bucket = '<0.5';
      else if (rr < 1) bucket = '0.5-1';
      else if (rr < 2) bucket = '1-2';
      else if (rr < 3) bucket = '2-3';
      else bucket = '>3';
      
      riskRewardBuckets[bucket].count += 1;
      if (pnl !== null && pnl > 0) {
        riskRewardBuckets[bucket].won += 1;
      }
    });
    
    return Object.entries(riskRewardBuckets)
      .map(([range, data]) => ({
        name: range,
        count: data.count,
        winRate: data.count > 0 ? (data.won / data.count) * 100 : 0
      }))
      .filter(item => item.count > 0); // Only show ranges with trades
  }, [trades, isLoading]);

  const renderLoadingState = () => (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Phân Tích Nâng Cao</CardTitle>
        <CardDescription>Thông tin chi tiết về hiệu suất giao dịch của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[350px] w-full" />
      </CardContent>
    </Card>
  );

  const renderEmptyState = () => (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Phân Tích Nâng Cao</CardTitle>
        <CardDescription>Thông tin chi tiết về hiệu suất giao dịch của bạn</CardDescription>
      </CardHeader>
      <CardContent className="h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">Hoàn thành thêm các giao dịch để xem phân tích nâng cao.</p>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (trades.length < 5 && !isLoading) {
    return renderEmptyState();
  }

  return (
    <Card className="shadow-lg col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Phân Tích Nâng Cao</CardTitle>
        <CardDescription>Thông tin chi tiết về hiệu suất giao dịch của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="symbols" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="symbols">Mã CP</TabsTrigger>
            <TabsTrigger value="dayOfWeek">Ngày trong tuần</TabsTrigger>
            <TabsTrigger value="winRate">Xu hướng thắng</TabsTrigger>
            <TabsTrigger value="riskReward">Tỷ lệ R/R</TabsTrigger>
          </TabsList>
          
          {/* Symbol Distribution */}
          <TabsContent value="symbols" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3 text-center">Mã CP Giao Dịch Nhiều Nhất</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={symbolDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {symbolDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [`${value} giao dịch`, props.payload.name]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: 'var(--radius)',
                        borderColor: 'hsl(var(--border))' 
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-center">Lãi/Lỗ theo Mã CP</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={symbolDistribution.sort((a, b) => b.profit - a.profit).slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickFormatter={(value) => formatCurrency(value, undefined, true)}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      scale="band"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      width={50}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Lãi/Lỗ"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: 'var(--radius)',
                        borderColor: 'hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="profit" 
                      radius={[0, 4, 4, 0]}
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        const fill = payload.profit >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))';
                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx="4" ry="4" />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          {/* Day of Week Performance */}
          <TabsContent value="dayOfWeek" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3 text-center">Tổng Lãi/Lỗ theo Ngày trong Tuần</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dayOfWeekPerformance}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickFormatter={(value) => formatCurrency(value, undefined, true)}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Lãi/Lỗ"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: 'var(--radius)',
                        borderColor: 'hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="total" 
                      radius={[4, 4, 0, 0]}
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        const fill = payload.total >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-3))';
                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx="4" ry="4" />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-center">Lãi/Lỗ Trung Bình theo Ngày trong Tuần</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dayOfWeekPerformance}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      tickFormatter={(value) => formatCurrency(value, undefined, true)}
                    />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Trung bình"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: 'var(--radius)',
                        borderColor: 'hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="average" 
                      radius={[4, 4, 0, 0]}
                      shape={(props: any) => {
                        const { x, y, width, height, payload } = props;
                        const fill = payload.average >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-4))';
                        return <rect x={x} y={y} width={width} height={height} fill={fill} rx="4" ry="4" />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          {/* Win Rate Over Time */}
          <TabsContent value="winRate" className="mt-4">
            <div>
              <h4 className="text-sm font-medium mb-3 text-center">Xu Hướng Tỷ Lệ Thắng</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={winRateOverTime}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Tỷ lệ thắng"]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      borderRadius: 'var(--radius)',
                      borderColor: 'hsl(var(--border))' 
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="winRate" 
                    stroke="hsl(var(--chart-1))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          {/* Risk/Reward Analysis */}
          <TabsContent value="riskReward" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-3 text-center">Số Giao Dịch theo Tỷ lệ Rủi ro/Phần thưởng</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={riskRewardAnalysis}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} giao dịch`, "Số lượng"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: 'var(--radius)',
                        borderColor: 'hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-4))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-3 text-center">Tỷ Lệ Thắng theo Tỷ lệ Rủi ro/Phần thưởng</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={riskRewardAnalysis}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Tỷ lệ thắng"]}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        borderRadius: 'var(--radius)',
                        borderColor: 'hsl(var(--border))' 
                      }}
                    />
                    <Bar 
                      dataKey="winRate" 
                      fill="hsl(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}