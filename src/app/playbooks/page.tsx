"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlaybooks, Playbook } from "@/contexts/PlaybookContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTrades } from "@/contexts/TradeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpenText, PlusCircle, Trash2, Edit, 
  Save, LayoutList, ArrowRightLeft, BarChart, Loader2,
  PercentIcon, Clock, LineChart, BarChart3
} from "lucide-react";
import PlaybookStats from "@/components/playbook/PlaybookStats";
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

// Define the form schema
const playBookFormSchema = z.object({
  name: z.string().min(2, {
    message: "Tên chiến lược phải có ít nhất 2 ký tự.",
  }),
  strategy: z.string().min(5, {
    message: "Mô tả chiến lược phải có ít nhất 5 ký tự.",
  }),
  timeframe: z.string().optional(),
  setupCriteria: z.string().min(1, {
    message: "Tiêu chí thiết lập là bắt buộc.",
  }),
  entryTriggers: z.string().min(1, {
    message: "Tín hiệu mở lệnh là bắt buộc.",
  }),
  exitRules: z.string().min(1, {
    message: "Quy tắc thoát lệnh là bắt buộc.",
  }),
  riskManagement: z.string().optional(),
  notes: z.string().optional(),
});

type PlaybookFormValues = z.infer<typeof playBookFormSchema>;

export default function PlaybooksPage() {
  const [activeTab, setActiveTab] = useState("list");
  const [editingPlaybook, setEditingPlaybook] = useState<Playbook | null>(null);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showStats, setShowStats] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { trades, refreshTrades } = useTrades();
  const { 
    playbooks, 
    loading, 
    error, 
    fetchPlaybooks, 
    addPlaybook, 
    updatePlaybook, 
    deletePlaybook,
    isAuthReady
  } = usePlaybooks();

  // Initialize form
  const form = useForm<PlaybookFormValues>({
    resolver: zodResolver(playBookFormSchema),
    defaultValues: {
      name: "",
      strategy: "",
      timeframe: "",
      setupCriteria: "",
      entryTriggers: "",
      exitRules: "",
      riskManagement: "",
      notes: "",
    },
  });

  // Load playbooks when component mounts, auth is ready, or when navigating back to this page
  useEffect(() => {
    if (isAuthReady) {
      console.log("Auth is ready in PlaybooksPage, fetching playbooks");
      fetchPlaybooks();
      refreshTrades(); // Đồng thời refresh dữ liệu giao dịch để cập nhật thống kê
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady]); 
  
  // Auto-refresh playbooks data and trades when window regains focus 
  useEffect(() => {
    const handleFocus = () => {
      console.log("Window regained focus, refreshing data");
      if (isAuthReady && currentUser) {
        fetchPlaybooks();
        refreshTrades(); // Đồng thời refresh dữ liệu giao dịch để cập nhật thống kê
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, currentUser]);

  async function onSubmit(data: PlaybookFormValues) {
    try {
      if (!isAuthReady) {
        toast({
          title: t('error'),
          description: t('errors.waitingForAuth'),
          variant: 'destructive',
        });
        return;
      }

      if (!currentUser) {
        toast({
          title: t('error'),
          description: t('errors.notLoggedIn'),
          variant: 'destructive',
        });
        return;
      }

      if (editingPlaybook) {
        // Update existing playbook
        const result = await updatePlaybook({
          ...editingPlaybook,
          ...data
        });
        
        if (result) {
          // Reset form and go back to list view only if successful
          form.reset();
          setActiveTab("list");
          setEditingPlaybook(null);
        }
      } else {
        // Add new playbook
        const result = await addPlaybook(data);
        
        if (result) {
          // Reset form and go back to list view only if successful
          form.reset();
          setActiveTab("list");
          setEditingPlaybook(null);
        }
      }
    } catch (error) {
      console.error("Error submitting playbook:", error);
      toast({
        title: t('error'),
        description: t('errors.unexpectedError'),
        variant: 'destructive',
      });
    }
  }

  function handleEdit(playbook: Playbook) {
    setEditingPlaybook(playbook);
    form.reset({
      name: playbook.name,
      strategy: playbook.strategy,
      timeframe: playbook.timeframe,
      setupCriteria: playbook.setupCriteria,
      entryTriggers: playbook.entryTriggers,
      exitRules: playbook.exitRules,
      riskManagement: playbook.riskManagement,
      notes: playbook.notes,
    });
    setActiveTab("edit");
  }

  async function handleDelete(id: string) {
    try {
      if (!isAuthReady || !currentUser) {
        toast({
          title: t('error'),
          description: t('errors.notLoggedIn'),
          variant: 'destructive',
        });
        return;
      }

      const success = await deletePlaybook(id);
      if (!success) {
        toast({
          title: t('error'),
          description: t('errors.failedToDeletePlaybook'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('playbooks.playbookDeleted'),
          description: t('playbooks.playbookDeletedDesc'),
        });
      }
    } catch (error) {
      console.error("Error deleting playbook:", error);
      toast({
        title: t('error'),
        description: t('errors.unexpectedError'),
        variant: 'destructive',
      });
    }
  }

  function handleAddNew() {
    form.reset();
    setEditingPlaybook(null);
    setActiveTab("edit");
  }

  function handleShowStats(playbook: Playbook) {
    console.log(`Hiển thị thống kê cho chiến lược: ${playbook.name} (ID: ${playbook.id})`);
    console.log(`Tổng số giao dịch hiện có: ${trades?.length || 0}`);
    
    setSelectedPlaybook(playbook);
    setShowStats(true);
  }

  function handleCloseStats() {
    setShowStats(false);
    setSelectedPlaybook(null);
  }

  // Tính toán số liệu thống kê cho mỗi playbook dựa trên dữ liệu giao dịch
  const calculatePlaybookStats = (playbookId: string) => {
    if (!trades || trades.length === 0) {
      console.log(`Không có giao dịch nào để tính toán thống kê cho playbook: ${playbookId}`);
      return { winRate: 0, avgProfit: 0, totalTrades: 0, profitFactor: 0 };
    }

    console.log(`Tổng số giao dịch: ${trades.length}`);
    console.log(`Tính toán thống kê cho playbook ID: ${playbookId}`);

    // Lọc các giao dịch thuộc playbook này
    const filteredTrades = trades.filter(trade => {
      // Kiểm tra playbook ID khớp
      const playbookMatched = String(trade.playbook) === String(playbookId);
      
      // Kiểm tra xem giao dịch đã đóng chưa
      const isClosed = (trade.status === 'closed') || 
                       (trade.exitDate && trade.exitDate !== '');
      
      return playbookMatched && isClosed;
    });

    console.log(`Số giao dịch đã lọc theo playbook ${playbookId}: ${filteredTrades.length}`);

    if (filteredTrades.length === 0) {
      return { winRate: 0, avgProfit: 0, totalTrades: 0, profitFactor: 0 };
    }

    // Tính toán trades thắng/thua dựa trên returnValue hoặc giá mua/bán
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

    const winRate = (winningTrades.length / filteredTrades.length) * 100;
    
    // Tính tổng lợi nhuận của các giao dịch thắng
    const totalGains = winningTrades.reduce((acc, trade) => {
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
      
      return acc; // Không đủ dữ liệu để tính
    }, 0);
    
    const losingTrades = filteredTrades.filter(trade => !winningTrades.includes(trade));
    
    // Tính tổng thua lỗ (giá trị tuyệt đối) của các giao dịch thua
    const totalLosses = losingTrades.reduce((acc, trade) => {
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
        
        lossValue = tradePnL < 0 ? Math.abs(tradePnL) : 0;
      }
      
      return acc + lossValue;
    }, 0);
    
    // Tính lợi nhuận trung bình
    const avgProfit = winningTrades.length > 0 ? totalGains / winningTrades.length : 0;
    
    // Tính thua lỗ trung bình
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    
    // Tính profit factor (hệ số lợi nhuận)
    const profitFactor = totalLosses > 0 ? totalGains / totalLosses : (totalGains > 0 ? Infinity : 0);
    
    // Tìm giao dịch tốt nhất và tệ nhất
    let bestTrade = 0;
    let worstTrade = 0;
    
    // Tìm giao dịch tốt nhất từ các giao dịch thắng
    winningTrades.forEach(trade => {
      let profitValue = 0;
      
      if (trade.returnValue !== undefined && trade.returnValue !== null) {
        profitValue = trade.returnValue > 0 ? trade.returnValue : 0;
      } else if (trade.entryPrice && trade.exitPrice && trade.quantity) {
        const entryAmount = trade.quantity * trade.entryPrice;
        const exitAmount = trade.quantity * trade.exitPrice;
        let tradePnL = 0;
        
        if (trade.tradeType === 'buy') {
          tradePnL = exitAmount - entryAmount;
        } else {
          tradePnL = entryAmount - exitAmount;
        }
        
        profitValue = tradePnL > 0 ? tradePnL : 0;
      }
      
      if (profitValue > bestTrade) {
        bestTrade = profitValue;
      }
    });
    
    // Tìm giao dịch tệ nhất từ các giao dịch thua
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
        
        lossValue = tradePnL < 0 ? Math.abs(tradePnL) : 0;
      }
      
      if (lossValue > Math.abs(worstTrade)) {
        worstTrade = -lossValue; // Lưu giá trị âm để biểu thị thua lỗ
      }
    });

    return {
      winRate,
      avgProfit,
      avgLoss,
      totalTrades: filteredTrades.length,
      profitFactor,
      bestTrade,
      worstTrade
    };
  };

  // Thêm kiểm tra khi không có người dùng đăng nhập
  if (!isAuthReady) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Đang kiểm tra thông tin đăng nhập...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('playbooks.title')}</h1>
          <p className="text-muted-foreground">
            {t('playbooks.description')}
          </p>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpenText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
            <h3 className="mt-4 text-lg font-medium">{t('errors.notLoggedIn')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('errors.pleaseLogInToView')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('playbooks.title')}</h1>
          <p className="text-muted-foreground">
            {t('playbooks.description')}
          </p>
        </div>
        <Button onClick={handleAddNew} className="self-start sm:self-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('playbooks.addPlaybook')}
        </Button>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-1">
            <LayoutList className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{t('playbooks.playbookList')}</span>
            <span className="sm:hidden">{t('playbooks.list')}</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-1">
            <BookOpenText className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {editingPlaybook ? t('playbooks.editPlaybook') : t('playbooks.createPlaybook')}
            </span>
            <span className="sm:hidden">
              {editingPlaybook ? t('playbooks.edit') : t('playbooks.create')}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">{t('playbooks.loadingPlaybooks')}</span>
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-10 text-center">
                <h3 className="mt-4 text-lg font-medium text-destructive">{t('playbooks.errorLoadingPlaybooks')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                <Button className="mt-4" onClick={() => fetchPlaybooks()}>
                  {t('playbooks.tryAgain')}
                </Button>
              </CardContent>
            </Card>
          ) : playbooks.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <BookOpenText className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                <h3 className="mt-4 text-lg font-medium">{t('playbooks.noPlaybooksYet')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('playbooks.createFirstPlaybook')}
                </p>
                <Button className="mt-4" onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t('playbooks.createPlaybook')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {playbooks.map((playbook) => {
                // Tính số liệu thống kê cho mỗi playbook
                const stats = calculatePlaybookStats(playbook.id);
                
                return (
                  <Card key={playbook.id} className="overflow-hidden hover:shadow-md transition-all duration-300 border-t-4 border-t-primary">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{playbook.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {playbook.strategy}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 shadow-sm">
                          <span className="font-medium flex items-center text-blue-700 dark:text-blue-400">
                            <PercentIcon className="h-4 w-4 mr-1" /> {t('playbooks.winRate')}
                          </span>
                          <span className="text-lg font-bold text-blue-800 dark:text-blue-300">
                            {stats.winRate ? stats.winRate.toFixed(1) : '0.0'}%
                          </span>
                        </div>
                        <div className="flex flex-col p-2 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 shadow-sm">
                          <span className="font-medium flex items-center text-purple-700 dark:text-purple-400">
                            <Clock className="h-4 w-4 mr-1" /> {t('playbooks.timeframe')}
                          </span>
                          <span className="text-lg font-bold text-purple-800 dark:text-purple-300">
                            {playbook.timeframe || t('playbooks.na')}
                          </span>
                        </div>
                        <div className="flex flex-col p-2 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                          <span className="font-medium flex items-center text-emerald-700 dark:text-emerald-400">
                            <BarChart3 className="h-4 w-4 mr-1" /> {t('playbooks.totalTrades')}
                          </span>
                          <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                            {stats.totalTrades || 0}
                          </span>
                        </div>
                        <div className="flex flex-col p-2 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800 shadow-sm">
                          <span className="font-medium flex items-center text-amber-700 dark:text-amber-400">
                            <LineChart className="h-4 w-4 mr-1" /> {t('playbooks.profitFactor')}
                          </span>
                          <span className="text-lg font-bold text-amber-800 dark:text-amber-300">
                            {stats.profitFactor === Infinity ? "∞" : (stats.profitFactor ? `${stats.profitFactor.toFixed(2)}` : '0.00')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/50 p-3">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between w-full">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(playbook)}
                          className="justify-start sm:justify-center"
                        >
                          <Edit className="h-4 w-4 mr-1" /> {t('playbooks.edit')}
                        </Button>
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-blue-500"
                            onClick={() => handleShowStats(playbook)}
                          >
                            <BarChart className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">{t('playbooks.stats')}</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">{t('playbooks.delete')}</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('playbooks.confirmDelete')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('playbooks.confirmDeleteDesc')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(playbook.id)} className="bg-destructive">
                                  {t('playbooks.delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="edit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingPlaybook ? t('playbooks.editPlaybook') : t('playbooks.createNewPlaybook')}
              </CardTitle>
              <CardDescription>
                {t('playbooks.documentStrategyDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('playbooks.playbookName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('playbooks.playbookNamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="timeframe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('playbooks.timeframe')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('playbooks.selectTimeframe')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1min">{t('playbooks.timeframes.1min')}</SelectItem>
                              <SelectItem value="5min">{t('playbooks.timeframes.5min')}</SelectItem>
                              <SelectItem value="15min">{t('playbooks.timeframes.15min')}</SelectItem>
                              <SelectItem value="30min">{t('playbooks.timeframes.30min')}</SelectItem>
                              <SelectItem value="1h">{t('playbooks.timeframes.1h')}</SelectItem>
                              <SelectItem value="4h">{t('playbooks.timeframes.4h')}</SelectItem>
                              <SelectItem value="1d">{t('playbooks.timeframes.1d')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('playbooks.strategyDescription')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('playbooks.strategyPlaceholder')}
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="setupCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('playbooks.setupCriteria')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('playbooks.setupCriteriaPlaceholder')}
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entryTriggers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('playbooks.entryTriggers')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('playbooks.entryTriggersPlaceholder')}
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="exitRules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('playbooks.exitRules')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('playbooks.exitRulesPlaceholder')}
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskManagement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('playbooks.riskManagement')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('playbooks.riskManagementPlaceholder')}
                              className="min-h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('playbooks.additionalNotes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('playbooks.notesPlaceholder')}
                            className="min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveTab("list");
                        setEditingPlaybook(null);
                      }}
                      className="mt-2 sm:mt-0"
                    >
                      {t('playbooks.cancel')}
                    </Button>
                    <Button type="submit">
                      <Save className="mr-2 h-4 w-4" />
                      {editingPlaybook ? t('playbooks.updatePlaybook') : t('playbooks.savePlaybook')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showStats && selectedPlaybook && (
        <Card className="fixed inset-0 z-50 overflow-auto bg-background/95 p-4 sm:p-6 md:p-8">
          <CardContent>
            <PlaybookStats 
              playbook={selectedPlaybook} 
              onClose={handleCloseStats} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}