"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow, TableCaption 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { calculateProfitLoss, formatCurrency, formatDate } from "@/lib/trade-utils";
import type { Trade } from "@/types";
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, 
  getDay, isToday, parseISO, isValid, startOfDay, endOfDay
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";

interface TradeCalendarProps {
  trades: Trade[];
  isLoading?: boolean;
}

export function TradeCalendar({ trades, isLoading }: TradeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Generate days for the calendar
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);
    
    return eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  }, [currentMonth]);
  
  // Map trades to days
  const tradesByDay = useMemo(() => {
    if (isLoading || !trades || trades.length === 0) return new Map();
    
    const tradeMap = new Map<string, Trade[]>();
    
    trades.forEach(trade => {
      if (!trade.exitDate) return; // Skip open trades
      
      try {
        const exitDate = parseISO(trade.exitDate);
        if (!isValid(exitDate)) return;
        
        const dateKey = format(exitDate, 'yyyy-MM-dd');
        const existingTrades = tradeMap.get(dateKey) || [];
        tradeMap.set(dateKey, [...existingTrades, trade]);
      } catch (e) {
        console.error("Invalid date format:", trade.exitDate);
      }
    });
    
    return tradeMap;
  }, [trades, isLoading]);
  
  // Get trades for the selected day
  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return tradesByDay.get(dateKey) || [];
  }, [selectedDate, tradesByDay]);
  
  // Get stats for a specific day
  const getDayStats = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTrades = tradesByDay.get(dateKey) || [];
    
    if (dayTrades.length === 0) return null;
    
    let totalPnL = 0;
    let winCount = 0;
    let lossCount = 0;
    
    dayTrades.forEach(trade => {
      const pnl = calculateProfitLoss(trade);
      if (pnl === null) return;
      
      totalPnL += pnl;
      
      if (pnl > 0) winCount++;
      else if (pnl < 0) lossCount++;
    });
    
    return {
      totalTrades: dayTrades.length,
      totalPnL,
      winCount,
      lossCount,
      winRate: dayTrades.length > 0 ? (winCount / dayTrades.length) * 100 : 0
    };
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(nextMonth => addMonths(nextMonth, 1));
  };
  
  // Handle day click
  const handleDayClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayTrades = tradesByDay.get(dateKey) || [];
    
    if (dayTrades.length > 0) {
      setSelectedDate(day);
      setIsDialogOpen(true);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Trading Calendar</CardTitle>
          <CardDescription>View your trades by day</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Calculate first day of month offset (0 = Sunday, 1 = Monday, etc.)
  const firstDayOffset = getDay(startOfMonth(currentMonth));
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Monthly Trading Calendar</CardTitle>
            <CardDescription>View your trades by day</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {/* Day labels */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
            <div key={day} className="text-center text-sm font-medium py-2">
              {day}
            </div>
          ))}
          
          {/* Empty cells for offset */}
          {Array.from({ length: firstDayOffset }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square p-1 bg-muted/30 rounded-md" />
          ))}
          
          {/* Calendar days */}
          {calendarDays.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayTrades = tradesByDay.get(dateKey) || [];
            const hasTrades = dayTrades.length > 0;
            const stats = hasTrades ? getDayStats(day) : null;
            
            return (
              <div 
                key={dateKey}
                onClick={() => hasTrades && handleDayClick(day)}
                className={`
                  aspect-square p-1 rounded-md border flex flex-col
                  ${hasTrades ? 'cursor-pointer hover:border-primary hover:bg-primary/5' : 'bg-background'}
                  ${isToday(day) ? 'border-primary/50 bg-primary/10' : 'border-border/50'}
                `}
              >
                <div className="text-right text-sm font-medium mb-1">
                  {format(day, 'd')}
                </div>
                
                {hasTrades && stats && (
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-center space-x-1">
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                        {dayTrades.length}
                      </Badge>
                    </div>
                    
                    <div 
                      className={`text-xs text-center font-medium 
                        ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(stats.totalPnL, 'USD', true)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
      
      {/* Dialog for day detail */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Trades on {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedDayTrades.length} trade{selectedDayTrades.length !== 1 ? 's' : ''} completed on this day
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDate && (
              <>
                {/* Daily stats summary */}
                {(() => {
                  const stats = getDayStats(selectedDate);
                  if (!stats) return null;
                  
                  return (
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Win Rate</div>
                        <div className="text-lg font-semibold">{stats.winRate.toFixed(0)}%</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Total P/L</div>
                        <div className={`text-lg font-semibold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.totalPnL)}
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Winners</div>
                        <div className="text-lg font-semibold text-green-600">{stats.winCount}</div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-md">
                        <div className="text-sm font-medium text-muted-foreground">Losers</div>
                        <div className="text-lg font-semibold text-red-600">{stats.lossCount}</div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Trades table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Entry Price</TableHead>
                        <TableHead>Exit Price</TableHead>
                        <TableHead className="text-right">P/L</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDayTrades.map(trade => {
                        const pnl = calculateProfitLoss(trade);
                        
                        return (
                          <TableRow key={trade.id}>
                            <TableCell className="font-medium">{trade.symbol}</TableCell>
                            <TableCell>
                              {trade.tradeType === 'buy' ? (
                                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                                  Long
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                                  Short
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{trade.quantity}</TableCell>
                            <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                            <TableCell>{trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}</TableCell>
                            <TableCell 
                              className={`text-right font-medium ${pnl && pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {pnl !== null ? formatCurrency(pnl) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}