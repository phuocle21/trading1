// src/components/trade/TradeHistoryTable.tsx
"use client";

import type { ColumnDef, SortingState, VisibilityState } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  Edit3,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  PlusCircle,
  History as HistoryIcon,
  ChevronDown,
  FilterX,
  Clock,
  Search,
  Star,
  Shield,
  Target,
  Eye,
  Thermometer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useJournals } from "@/contexts/JournalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlaybooks } from "@/contexts/PlaybookContext";
import type { Trade, TradeWithProfit } from "@/types";
import { calculateProfitLoss, formatCurrency, formatDate } from "@/lib/trade-utils";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const columnHelper = createColumnHelper<TradeWithProfit>();

export function TradeHistoryTable() {
  const { getCurrentJournal, currentJournalId, deleteTradeFromJournal, isLoading } = useJournals();
  const { t } = useLanguage();
  const { playbooks } = usePlaybooks();
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    entryTime: false,
    exitTime: false,
    stopLoss: false,
    takeProfit: false,
    fees: false,
    playbook: false,
    risk: false,
    mood: false,
    rating: false,
  });
  
  const [activeTab, setActiveTab] = useState<"all" | "open" | "closed">("all");
  const [activeTradeMobile, setActiveTradeMobile] = useState<string | null>(null);

  const currentJournal = getCurrentJournal();
  const trades = currentJournal?.trades || [];

  const data = useMemo(() => {
    if (isLoading) return [];
    
    let filteredTrades = trades.map(trade => ({
      ...trade,
      profitOrLoss: calculateProfitLoss(trade),
      stockSymbol: trade.symbol // Map symbol to stockSymbol for compatibility
    }));
    
    // Filter by tab
    if (activeTab === "open") {
      filteredTrades = filteredTrades.filter(trade => !trade.exitDate);
    } else if (activeTab === "closed") {
      filteredTrades = filteredTrades.filter(trade => trade.exitDate);
    }
    
    return filteredTrades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [trades, isLoading, activeTab]);

  const handleDeleteTrade = (tradeId: string) => {
    if (currentJournalId) {
      deleteTradeFromJournal(currentJournalId, tradeId);
    }
  };

  const columns = useMemo<ColumnDef<TradeWithProfit, any>[]>(() => [
    columnHelper.accessor((row) => row, {
      id: "date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 sm:px-2"
        >
          {t('trade.date')}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: (info) => {
        const trade = info.getValue();
        return (
          <div className="min-w-[120px]">
            <div className="font-medium">{formatDate(trade.entryDate)}</div>
            {trade.exitDate && (
              <div className="text-xs text-muted-foreground">
                to {formatDate(trade.exitDate)}
              </div>
            )}
          </div>
        );
      },
      sortingFn: (a, b, columnId) => {
        const aDate = new Date(a.original.entryDate).getTime();
        const bDate = new Date(b.original.entryDate).getTime();
        return aDate - bDate;
      },
    }),
    columnHelper.accessor("entryTime", {
      header: t('trade.entryTime'),
      cell: (info) => info.getValue() || <Minus className="h-3 w-3 text-muted-foreground mx-auto" />,
    }),
    columnHelper.accessor("exitTime", {
      header: t('trade.exitTime'),
      cell: (info) => info.getValue() || <Minus className="h-3 w-3 text-muted-foreground mx-auto" />,
    }),
    columnHelper.accessor("stockSymbol", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 sm:px-2"
        >
          {t('trade.symbol')}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: (info) => (
        <div className="font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor("tradeType", {
      header: t('trade.direction'),
      cell: (info) => {
        const type = info.getValue();
        return type === 'buy' ? (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
            <TrendingUp className="mr-1 h-3 w-3" /> {t('trade.long')}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
            <TrendingDown className="mr-1 h-3 w-3" /> {t('trade.short')}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("quantity", {
      header: t('trade.quantity'),
      cell: (info) => (
        <div className="text-right font-medium">{info.getValue()}</div>
      ),
    }),
    columnHelper.accessor((row) => row, {
      id: "prices",
      header: t('trade.price'),
      cell: (info) => {
        const trade = info.getValue();
        return (
          <div className="min-w-[120px]">
            <div className="font-medium">
              {formatCurrency(trade.entryPrice)}
            </div>
            {trade.exitPrice ? (
              <div className="text-xs text-muted-foreground">
                → {formatCurrency(trade.exitPrice)}
              </div>
            ) : null}
          </div>
        );
      },
    }),
    columnHelper.accessor("stopLoss", {
      header: t('trade.stopLoss'),
      cell: (info) => {
        const value = info.getValue();
        return value ? formatCurrency(value) : <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
      },
    }),
    columnHelper.accessor("takeProfit", {
      header: t('trade.takeProfit'),
      cell: (info) => {
        const value = info.getValue();
        return value ? formatCurrency(value) : <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
      },
    }),
    columnHelper.accessor("fees", {
      header: t('trade.fees'),
      cell: (info) => {
        const value = info.getValue();
        return value ? formatCurrency(value) : <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
      },
    }),
    columnHelper.accessor("playbook", {
      header: t('trade.setup'),
      cell: (info) => {
        const playbookId = info.getValue();
        if (!playbookId) return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
        
        // Tìm tên chiến lược từ ID
        const selectedPlaybook = playbooks.find(p => p.id === playbookId);
        const playbookName = selectedPlaybook ? selectedPlaybook.name : playbookId;
        
        return (
          <Badge variant="outline" className="capitalize">
            {playbookName}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("risk", {
      header: t('trade.risk'),
      cell: (info) => {
        const risk = info.getValue();
        if (!risk) return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
        
        let badgeClass = "capitalize";
        if (risk === "low") badgeClass += " bg-green-50 text-green-700 border-green-200";
        if (risk === "medium") badgeClass += " bg-yellow-50 text-yellow-700 border-yellow-200";
        if (risk === "high") badgeClass += " bg-red-50 text-red-700 border-red-200";
        
        return (
          <Badge variant="outline" className={badgeClass}>
            {risk}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("mood", {
      header: t('trade.mood'),
      cell: (info) => {
        const mood = info.getValue();
        if (!mood) return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
        
        return (
          <Badge variant="outline" className="capitalize">
            {mood}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("rating", {
      header: t('trade.rating'),
      cell: (info) => {
        const rating = info.getValue();
        if (!rating) return <Minus className="h-3 w-3 text-muted-foreground mx-auto" />;
        
        return (
          <div className="flex items-center justify-center">
            {Array.from({ length: rating }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-primary text-primary" />
            ))}
            {Array.from({ length: 5 - rating }).map((_, i) => (
              <Star key={i + rating} className="h-3 w-3 text-muted-foreground/30" />
            ))}
          </div>
        );
      },
    }),
    columnHelper.accessor("profitOrLoss", {
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-1 sm:px-2"
        >
          {t('trade.pl')}
          <ArrowUpDown className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      ),
      cell: (info) => {
        const profit = info.getValue();
        if (profit === null || profit === undefined) return <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-auto" />;
        const profitColor = profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-foreground";
        return (
          <div className={`font-medium ${profitColor} text-right`}>
            {formatCurrency(profit)}
          </div>
        );
      },
      sortingFn: 'alphanumeric', 
    }),
    columnHelper.accessor((row) => row, {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const trade = row.original;
        return (
          <div className="flex space-x-1 justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => router.push(`/edit-trade/${trade.id}`)}
                  >
                    <Edit3 className="h-3 w-3 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('trade.editTrade')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <AlertDialog open={showDeleteConfirm === trade.id} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={() => setShowDeleteConfirm(trade.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{t('trade.deleteTrade')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('trade.confirmDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('trade.confirmDeleteDescription').replace('{symbol}', trade.stockSymbol || trade.symbol)}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowDeleteConfirm(null)}>{t('trade.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (trade.id) handleDeleteTrade(trade.id);
                      setShowDeleteConfirm(null);
                    }}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {t('trade.delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    }),
  ], [router, handleDeleteTrade, showDeleteConfirm, t]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Summary stats
  const stats = useMemo(() => {
    const openTrades = data.filter(trade => !trade.exitDate);
    const closedTrades = data.filter(trade => trade.exitDate);
    const winningTrades = closedTrades.filter(trade => (trade.profitOrLoss || 0) > 0);
    const losingTrades = closedTrades.filter(trade => (trade.profitOrLoss || 0) < 0);
    
    const totalProfit = closedTrades.reduce((sum, trade) => sum + (trade.profitOrLoss || 0), 0);
    const winRate = closedTrades.length ? (winningTrades.length / closedTrades.length) * 100 : 0;
    
    return {
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      totalProfit,
      winRate
    };
  }, [data]);

  // Function to render mobile card for each trade
  const renderMobileTradeCard = (trade: TradeWithProfit) => {
    const isExpanded = activeTradeMobile === trade.id;
    const profitColor = (trade.profitOrLoss || 0) > 0 
      ? "text-green-600" 
      : (trade.profitOrLoss || 0) < 0 
        ? "text-red-600" 
        : "text-foreground";

    return (
      <Card 
        key={trade.id} 
        className={`mb-3 overflow-hidden transition-all ${isExpanded ? 'border-primary' : ''}`}
        onClick={() => setActiveTradeMobile(isExpanded ? null : trade.id)}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{trade.stockSymbol}</div>
                {trade.tradeType === 'buy' ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                    <TrendingUp className="mr-1 h-3 w-3" /> {t('trade.long')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                    <TrendingDown className="mr-1 h-3 w-3" /> {t('trade.short')}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDate(trade.entryDate)}
                {trade.exitDate && ` - ${formatDate(trade.exitDate)}`}
              </div>
            </div>
            <div className={`font-medium text-right ${profitColor}`}>
              {trade.profitOrLoss !== undefined ? formatCurrency(trade.profitOrLoss) : '-'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 pt-0">
          <div className="flex justify-between text-sm">
            <div>
              <div className="text-muted-foreground">{t('trade.entry')}</div>
              <div>{formatCurrency(trade.entryPrice)}</div>
            </div>
            {trade.exitPrice && (
              <div>
                <div className="text-muted-foreground">{t('trade.exit')}</div>
                <div>{formatCurrency(trade.exitPrice)}</div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground">{t('trade.quantity')}</div>
              <div>{trade.quantity}</div>
            </div>
          </div>
          
          {isExpanded && (
            <>
              <div className="border-t my-3 pt-3 grid grid-cols-2 gap-2 text-sm">
                {trade.stopLoss && (
                  <div>
                    <div className="text-muted-foreground">{t('trade.stopLoss')}</div>
                    <div>{formatCurrency(trade.stopLoss)}</div>
                  </div>
                )}
                {trade.takeProfit && (
                  <div>
                    <div className="text-muted-foreground">{t('trade.takeProfit')}</div>
                    <div>{formatCurrency(trade.takeProfit)}</div>
                  </div>
                )}
                {trade.risk && (
                  <div>
                    <div className="text-muted-foreground">{t('trade.risk')}</div>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${
                          trade.risk === 'low' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : trade.risk === 'medium' 
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {trade.risk}
                      </Badge>
                    </div>
                  </div>
                )}
                {trade.playbook && (
                  <div>
                    <div className="text-muted-foreground">{t('trade.setup')}</div>
                    <Badge variant="outline" className="capitalize mt-1">
                      {(() => {
                        const selectedPlaybook = playbooks.find(p => p.id === trade.playbook);
                        return selectedPlaybook ? selectedPlaybook.name : trade.playbook;
                      })()}
                    </Badge>
                  </div>
                )}
                {trade.notes && (
                  <div className="col-span-2">
                    <div className="text-muted-foreground">{t('trade.notes')}</div>
                    <div className="text-sm mt-1">{trade.notes}</div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2 mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/edit-trade/${trade.id}`);
                  }}
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" /> {t('trade.edit')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> {t('trade.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('trade.confirmDeleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('trade.confirmDeleteDescription').replace('{symbol}', trade.stockSymbol || trade.symbol)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('trade.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (trade.id) handleDeleteTrade(trade.id);
                        }}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        {t('trade.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('tradeHistory.title')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (data.length === 0 && activeTab === "all") {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">{t('tradeHistory.title')}</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 sm:py-12">
          <HistoryIcon className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('tradeHistory.noTradesYet')}</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base">{t('tradeHistory.startByAdding')}</p>
          <Button size="sm" className="sm:text-base sm:px-4 sm:h-10" onClick={() => router.push('/add-trade')}>
            <PlusCircle className="mr-2 h-4 w-4" /> {t('tradeHistory.addNewTrade')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-3">
            <div>
              <CardTitle className="text-xl sm:text-2xl">{t('tradeHistory.title')}</CardTitle>
              <CardDescription>
                {t('tradeHistory.description')}
              </CardDescription>
            </div>
            <div className="flex gap-2 flex-col sm:flex-row">
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('tradeHistory.searchPlaceholder')}
                  value={globalFilter || ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 h-9 md:w-[200px] lg:w-[250px]"
                />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9" 
                onClick={() => router.push('/add-trade')}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> {t('tradeHistory.newTrade')}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-accent/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase font-medium">{t('tradeHistory.openTrades')}</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.openTrades}</div>
            </div>
            <div className="bg-accent/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase font-medium">{t('tradeHistory.closedTrades')}</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.closedTrades}</div>
            </div>
            <div className="bg-accent/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase font-medium">{t('tradeHistory.winRate')}</div>
              <div className="text-xl sm:text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            </div>
            <div className="bg-accent/20 rounded-lg p-3">
              <div className="text-xs text-muted-foreground uppercase font-medium">{t('tradeHistory.totalPL')}</div>
              <div className={`text-xl sm:text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.totalProfit)}
              </div>
            </div>
          </div>
        
          {/* Filters and tabs */}
          <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-3">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "open" | "closed")} className="w-full sm:w-auto">
              <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">
                  {t('tradeHistory.allTrades')}
                  <Badge variant="secondary" className="ml-1 sm:ml-2">{trades.length}</Badge>
                </TabsTrigger>
                <TabsTrigger value="open" className="text-xs sm:text-sm px-2 sm:px-3">
                  {t('tradeHistory.open')}
                  <Badge variant="secondary" className="ml-1 sm:ml-2">{stats.openTrades}</Badge>
                </TabsTrigger>
                <TabsTrigger value="closed" className="text-xs sm:text-sm px-2 sm:px-3">
                  {t('tradeHistory.closed')}
                  <Badge variant="secondary" className="ml-1 sm:ml-2">{stats.closedTrades}</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-1 ml-auto">
                    <Eye className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{t('tradeHistory.columns')}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id === "entryTime" && <Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
                          {column.id === "exitTime" && <Clock className="mr-2 h-4 w-4 text-muted-foreground" />}
                          {column.id === "stopLoss" && <Shield className="mr-2 h-4 w-4 text-muted-foreground" />}
                          {column.id === "takeProfit" && <Target className="mr-2 h-4 w-4 text-muted-foreground" />}
                          {column.id === "mood" && <Thermometer className="mr-2 h-4 w-4 text-muted-foreground" />}
                          {column.id === "date" && t('trade.date')}
                          {column.id === "prices" && t('trade.price')}
                          {column.id !== "date" && column.id !== "prices" && t(`trade.${column.id}`)}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {globalFilter && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => setGlobalFilter("")}
                >
                  <FilterX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Message for no results with filter active */}
          {table.getFilteredRowModel().rows.length === 0 && activeTab !== "all" && (
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-2">{t(`tradeHistory.no${activeTab}TradesFound`)}</div>
              <p className="text-sm text-muted-foreground">
                {activeTab === "open" 
                  ? t('tradeHistory.noOpenTradesMessage')
                  : t('tradeHistory.noClosedTradesMessage')}
              </p>
            </div>
          )}
          
          {/* Message for no results with search active */}
          {table.getFilteredRowModel().rows.length === 0 && globalFilter && (
            <div className="text-center py-8">
              <div className="text-lg font-medium mb-2">{t('tradeHistory.noResultsFound')}</div>
              <p className="text-sm text-muted-foreground">
                {t('tradeHistory.noMatchingTrades')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGlobalFilter("")}
                className="mt-4"
              >
                <FilterX className="mr-2 h-4 w-4" /> {t('tradeHistory.clearFilters')}
              </Button>
            </div>
          )}
          
          {/* Mobile view */}
          {table.getFilteredRowModel().rows.length > 0 && (
            <>
              <div className="md:hidden">
                {table.getRowModel().rows.map((row) => renderMobileTradeCard(row.original))}
                
                {/* Mobile pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="w-24 flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('pagination.previous')}
                  </Button>
                  <span className="text-sm">
                    {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="w-24 flex items-center justify-center gap-1"
                  >
                    {t('pagination.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Desktop view */}
              <div className="hidden md:block">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="whitespace-nowrap px-2 py-2 text-xs sm:text-sm">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} className="px-2 py-2 text-xs sm:text-sm">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Desktop pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    {t('tradeHistory.showing').replace('{filtered}', table.getFilteredRowModel().rows.length.toString()).replace('{total}', data.length.toString())}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      {t('pagination.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      {t('pagination.next')}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
