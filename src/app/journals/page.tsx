// filepath: /Users/tinanpha/Desktop/trading/src/app/journals/page.tsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useJournals } from '@/contexts/JournalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Journal, Trade } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertCircle,
  BarChart,
  BookOpenText,
  Calendar,
  ChevronRight,
  Clock,
  Copy,
  Edit,
  FileSpreadsheet,
  Filter,
  LineChart,
  Loader2,
  MoreHorizontal,
  Plus,
  Settings,
  Trash2,
  TrendingUp,
  Wallet,
  Zap,
  CheckCircle,
  Globe,
  Activity,
  Bitcoin,
  CircleX,
  RefreshCw,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export default function JournalsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const { 
    journals, 
    currentJournalId, 
    addJournal, 
    updateJournal, 
    deleteJournal, 
    switchJournal,
    createTemplateJournal,
    isLoading 
  } = useJournals();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [journalToDelete, setJournalToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [journalToEdit, setJournalToEdit] = useState<Journal | null>(null);
  const [editJournalData, setEditJournalData] = useState({
    name: '',
    description: '',
    icon: 'chart',
    color: '#4f46e5',
    initialCapital: 10000,
  });
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);

  const [newJournalData, setNewJournalData] = useState({
    name: '',
    description: '',
    icon: 'chart',
    color: '#4f46e5',
    initialCapital: 10000, // Add initial capital with default value
  });
  
  // Tải dữ liệu giao dịch từ API khi component được tải
  useEffect(() => {
    const fetchTrades = async () => {
      try {
        // Thêm tham số allJournals=true để lấy giao dịch từ tất cả nhật ký
        const response = await fetch('/api/trades?allJournals=true');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        if (data.trades && Array.isArray(data.trades)) {
          console.log(`Loaded ${data.trades.length} trades from all journals`);
          setTrades(data.trades);
        } else {
          setTrades([]);
        }
      } catch (error) {
        console.error('Error loading trades:', error);
        setTrades([]);
      }
    };
    
    fetchTrades();
  }, []);

  // Handle opening the edit dialog
  const handleOpenEditDialog = (journal: Journal) => {
    setJournalToEdit(journal);
    setEditJournalData({
      name: journal.name,
      description: journal.description || '',
      icon: journal.icon || 'chart',
      color: journal.color || '#4f46e5',
      initialCapital: journal.settings?.initialCapital || 10000,
    });
    setEditDialogOpen(true);
  };

  // Handle updating the journal
  const handleUpdateJournal = () => {
    if (!journalToEdit) return;
    
    if (!editJournalData.name.trim()) {
      toast({ 
        title: t('journals.errors.nameRequired'),
        description: t('journals.errors.nameRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    const updatedJournal = {
      ...journalToEdit,
      name: editJournalData.name,
      description: editJournalData.description,
      icon: editJournalData.icon,
      color: editJournalData.color,
      settings: {
        ...journalToEdit.settings || {},
        initialCapital: editJournalData.initialCapital,
      },
      updatedAt: new Date().toISOString()
    };

    updateJournal(updatedJournal);
    
    toast({ 
      title: t('journals.journalUpdated'),
      description: t('journals.journalUpdatedDesc')
    });
    
    setEditDialogOpen(false);
    setJournalToEdit(null);
  };

  // Filter journals based on the selected tab and search query
  const filteredJournals = useMemo(() => {
    let filtered = [...journals];

    // Apply tab filter
    if (selectedTab === 'templates') {
      filtered = filtered.filter(journal => journal.isTemplate);
    } else if (selectedTab === 'active') {
      filtered = filtered.filter(journal => !journal.isTemplate);
    }

    // Apply search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(journal => 
        journal.name.toLowerCase().includes(query) || 
        (journal.description && journal.description.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [journals, selectedTab, searchQuery]);

  const handleCreateJournal = () => {
    if (!newJournalData.name.trim()) {
      toast({ 
        title: t('journals.errors.nameRequired'),
        description: t('journals.errors.nameRequiredDesc'),
        variant: "destructive"
      });
      return;
    }

    const newJournal = addJournal({
      name: newJournalData.name,
      description: newJournalData.description,
      icon: newJournalData.icon,
      color: newJournalData.color,
      trades: [],
      settings: {
        initialCapital: newJournalData.initialCapital, // Add initial capital to journal settings
        currency: 'USD',
      }
    });

    toast({ 
      title: t('journals.journalCreated'),
      description: t('journals.journalCreatedDesc'),
    });

    // Reset form
    setNewJournalData({
      name: '',
      description: '',
      icon: 'chart',
      color: '#4f46e5',
      initialCapital: 10000,
    });
    setCreateDialogOpen(false);

    // Switch to the new journal but stay on the journals page
    switchJournal(newJournal.id);
  };

  const handleCreateTemplateJournal = (templateName: string) => {
    const newJournal = createTemplateJournal(templateName);
    
    toast({ 
      title: t('journals.templateCreated'),
      description: t('journals.templateCreatedDesc'),
    });

    // Switch to the new journal but stay on the journals page
    switchJournal(newJournal.id);
  };

  const handleDeleteJournal = (journalId: string) => {
    if (journals.length <= 1) {
      toast({ 
        title: t('journals.errors.cannotDeleteLast'),
        description: t('journals.errors.cannotDeleteLastDesc'),
        variant: "destructive"
      });
      return;
    }

    setJournalToDelete(journalId);
    setConfirmDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (journalToDelete) {
      try {
        deleteJournal(journalToDelete);
        
        toast({ 
          title: t('journals.journalDeleted'),
          description: t('journals.journalDeletedDesc'),
        });
        
        setConfirmDeleteDialogOpen(false);
        setJournalToDelete(null);
      } catch (error) {
        console.error('Error deleting journal:', error);
        toast({
          title: t('journals.errors.deleteFailed') || 'Lỗi xóa nhật ký',
          description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa nhật ký',
          variant: "destructive"
        });
      }
    }
  };

  const handleSwitchJournal = async (journalId: string) => {
    try {
      // Đợi cho tới khi switchJournal hoàn thành việc chuyển đổi nhật ký
      await switchJournal(journalId);
      
      // Thêm một chút độ trễ để đảm bảo context được cập nhật đầy đủ
      setTimeout(() => {
        // Sau đó mới chuyển hướng đến trang dashboard
        router.push('/dashboard');
      }, 100);
      
    } catch (error) {
      console.error('Error switching journal:', error);
      toast({
        title: 'Lỗi chuyển đổi nhật ký',
        description: 'Có lỗi xảy ra khi chuyển đổi nhật ký, vui lòng thử lại.',
        variant: "destructive"
      });
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'trending-up': return <TrendingUp className="w-4 h-4" />;
      case 'activity': return <Activity className="w-4 h-4" />;
      case 'bitcoin': return <Bitcoin className="w-4 h-4" />;
      case 'globe': return <Globe className="w-4 h-4" />;
      case 'timeline': return <LineChart className="w-4 h-4" />;
      case 'chart': return <BarChart className="w-4 h-4" />;
      default: return <BarChart className="w-4 h-4" />;
    }
  };

  const getJournalStatsInfo = (journal: Journal) => {
    // Lọc giao dịch thuộc về journal hiện tại
    const journalTrades = trades.filter(trade => trade.journalId === journal.id);
    
    const totalTrades = journalTrades.length;
    const closedTrades = journalTrades.filter(trade => trade.exitDate).length;
    const openTrades = journalTrades.filter(trade => !trade.exitDate).length;
    
    const winningTrades = journalTrades.filter(trade => {
      if (!trade.exitDate || !trade.exitPrice) return false;
      return trade.tradeType === 'buy' 
        ? trade.exitPrice > trade.entryPrice 
        : trade.exitPrice < trade.entryPrice;
    }).length;
    
    const winRate = closedTrades > 0 ? Math.round((winningTrades / closedTrades) * 100) : 0;
    
    // Tính toán thời gian hoạt động gần đây dựa trên giao dịch mới nhất
    let lastActivity = journal.updatedAt || journal.createdAt;
    
    // Tìm giao dịch mới nhất (dựa trên thời gian tạo hoặc cập nhật)
    if (journalTrades.length > 0) {
      // Sắp xếp giao dịch theo thời gian mới nhất
      const sortedTrades = [...journalTrades].sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.entryDate).getTime();
        const dateB = new Date(b.updatedAt || b.entryDate).getTime();
        return dateB - dateA; // Sắp xếp giảm dần (mới nhất trước)
      });
      
      // Lấy thời gian từ giao dịch mới nhất
      const newestTrade = sortedTrades[0];
      if (newestTrade) {
        const tradeDate = newestTrade.updatedAt || newestTrade.entryDate;
        // Chỉ cập nhật nếu giao dịch mới hơn thời gian cập nhật của nhật ký
        if (new Date(tradeDate) > new Date(lastActivity)) {
          lastActivity = tradeDate;
        }
      }
    }
    
    return { 
      totalTrades, 
      closedTrades, 
      openTrades, 
      winningTrades, 
      winRate,
      lastActivity 
    };
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-xl font-medium">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('journals.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('journals.description')}</p>
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" /> {t('journals.createNew')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{t('journals.createNewJournal')}</DialogTitle>
                <DialogDescription>{t('journals.createNewJournalDesc')}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    {t('journals.name')}*
                  </Label>
                  <Input
                    id="name"
                    value={newJournalData.name}
                    onChange={(e) => setNewJournalData({ ...newJournalData, name: e.target.value })}
                    className="col-span-3"
                    placeholder={t('journals.namePlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    {t('journals.description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={newJournalData.description}
                    onChange={(e) => setNewJournalData({ ...newJournalData, description: e.target.value })}
                    className="col-span-3"
                    placeholder={t('journals.descriptionPlaceholder')}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="icon" className="text-right">
                    {t('journals.icon')}
                  </Label>
                  <Select
                    value={newJournalData.icon}
                    onValueChange={(value) => setNewJournalData({ ...newJournalData, icon: value })}
                  >
                    <SelectTrigger id="icon" className="col-span-3">
                      <SelectValue placeholder={t('journals.selectIcon')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">
                        <div className="flex items-center">
                          <BarChart className="mr-2 h-4 w-4" /> {t('journals.icons.chart')}
                        </div>
                      </SelectItem>
                      <SelectItem value="trending-up">
                        <div className="flex items-center">
                          <TrendingUp className="mr-2 h-4 w-4" /> {t('journals.icons.trendingUp')}
                        </div>
                      </SelectItem>
                      <SelectItem value="activity">
                        <div className="flex items-center">
                          <Activity className="mr-2 h-4 w-4" /> {t('journals.icons.activity')}
                        </div>
                      </SelectItem>
                      <SelectItem value="globe">
                        <div className="flex items-center">
                          <Globe className="mr-2 h-4 w-4" /> {t('journals.icons.globe')}
                        </div>
                      </SelectItem>
                      <SelectItem value="bitcoin">
                        <div className="flex items-center">
                          <Bitcoin className="mr-2 h-4 w-4" /> {t('journals.icons.bitcoin')}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    {t('journals.color')}
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <input
                      type="color"
                      id="color"
                      value={newJournalData.color}
                      onChange={(e) => setNewJournalData({ ...newJournalData, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={newJournalData.color}
                      onChange={(e) => setNewJournalData({ ...newJournalData, color: e.target.value })}
                      className="ml-2 flex-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="initialCapital" className="text-right">
                    {t('journals.initialCapital')}
                  </Label>
                  <Input
                    id="initialCapital"
                    type="number"
                    value={newJournalData.initialCapital}
                    onChange={(e) => setNewJournalData({ ...newJournalData, initialCapital: Number(e.target.value) })}
                    className="col-span-3"
                    placeholder={t('journals.initialCapitalPlaceholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateJournal}>
                  {t('journals.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('journals.searchJournals')}
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select defaultValue="newest">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('journals.sort')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t('journals.sortNewest')}</SelectItem>
              <SelectItem value="oldest">{t('journals.sortOldest')}</SelectItem>
              <SelectItem value="name_asc">{t('journals.sortNameAsc')}</SelectItem>
              <SelectItem value="name_desc">{t('journals.sortNameDesc')}</SelectItem>
              <SelectItem value="most_trades">{t('journals.sortMostTrades')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" aria-label={t('journals.filterButton')}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">{t('journals.allJournals')}</TabsTrigger>
          <TabsTrigger value="active">{t('journals.activeJournals')}</TabsTrigger>
          <TabsTrigger value="templates">{t('journals.templates')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {filteredJournals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">{t('journals.noJournalsFound')}</h3>
              <p className="text-muted-foreground mt-1 mb-4">{t('journals.noJournalsFoundDesc')}</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> {t('journals.createFirst')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJournals.map((journal) => {
                const stats = getJournalStatsInfo(journal);
                const isCurrentJournal = journal.id === currentJournalId;
                
                return (
                  <Card 
                    key={journal.id} 
                    className={`overflow-hidden transition-all hover:shadow-md ${
                      isCurrentJournal ? 'border-primary border-2' : ''
                    }`}
                    style={{ borderTopColor: journal.color, borderTopWidth: '4px' }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div 
                            className="p-2 rounded-md mr-3"
                            style={{ backgroundColor: `${journal.color}20` }}
                          >
                            {renderIcon(journal.icon || 'chart')}
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {journal.name}
                              {journal.isTemplate && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                                  {t('journals.template')}
                                </span>
                              )}
                              {journal.isDefault && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                                  {t('journals.default')}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {t('journals.created')}: {format(parseISO(journal.createdAt), 'MMM d, yyyy')}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('journals.actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleOpenEditDialog(journal)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('journals.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => handleDeleteJournal(journal.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('journals.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {journal.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {journal.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.trades')}</span>
                          <span className="font-medium">{stats.totalTrades}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.winRate')}</span>
                          <span className="font-medium">{stats.winRate}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.openTrades')}</span>
                          <span className="font-medium">{stats.openTrades}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.lastActivity')}</span>
                          <span className="font-medium">
                            {stats.lastActivity ? formatDistanceToNow(parseISO(stats.lastActivity), { addSuffix: true }) : t('journals.never')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      {isCurrentJournal ? (
                        <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                          <BarChart className="mr-2 h-4 w-4" />
                          {t('journals.viewDashboard')}
                        </Button>
                      ) : journal.isTemplate ? (
                        <Button className="w-full" onClick={() => handleCreateTemplateJournal(journal.name.toLowerCase().replace(/\s+/g, ''))}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t('journals.useTemplate')}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => handleSwitchJournal(journal.id)}>
                          <Zap className="mr-2 h-4 w-4" />
                          {t('journals.switchTo')}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {filteredJournals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium">{t('journals.noActiveJournals')}</h3>
              <p className="text-muted-foreground mt-1 mb-4">{t('journals.noActiveJournalsDesc')}</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> {t('journals.createJournal')}
              </Button>
            </div>
          ) : (
            // Same card grid as 'all' tab
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Content will be filtered by the useMemo */}
              {filteredJournals.map((journal) => {
                const stats = getJournalStatsInfo(journal);
                const isCurrentJournal = journal.id === currentJournalId;
                
                return (
                  <Card 
                    key={journal.id} 
                    className={`overflow-hidden transition-all hover:shadow-md ${
                      isCurrentJournal ? 'border-primary border-2' : ''
                    }`}
                    style={{ borderTopColor: journal.color, borderTopWidth: '4px' }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div 
                            className="p-2 rounded-md mr-3"
                            style={{ backgroundColor: `${journal.color}20` }}
                          >
                            {renderIcon(journal.icon || 'chart')}
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {journal.name}
                              {journal.isTemplate && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                                  {t('journals.template')}
                                </span>
                              )}
                              {journal.isDefault && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                                  {t('journals.default')}
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {t('journals.created')}: {format(parseISO(journal.createdAt), 'MMM d, yyyy')}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('journals.actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer"
                              onClick={() => handleOpenEditDialog(journal)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              {t('journals.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => handleDeleteJournal(journal.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('journals.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {journal.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {journal.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.trades')}</span>
                          <span className="font-medium">{stats.totalTrades}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.winRate')}</span>
                          <span className="font-medium">{stats.winRate}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.openTrades')}</span>
                          <span className="font-medium">{stats.openTrades}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{t('journals.lastActivity')}</span>
                          <span className="font-medium">
                            {stats.lastActivity ? formatDistanceToNow(parseISO(stats.lastActivity), { addSuffix: true }) : t('journals.never')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      {isCurrentJournal ? (
                        <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard')}>
                          <BarChart className="mr-2 h-4 w-4" />
                          {t('journals.viewDashboard')}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" onClick={() => handleSwitchJournal(journal.id)}>
                          <Zap className="mr-2 h-4 w-4" />
                          {t('journals.switchTo')}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Template cards */}
            {filteredJournals.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center col-span-3">
                <BookOpenText className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">{t('journals.noTemplatesFound')}</h3>
                <p className="text-muted-foreground mt-1 mb-4">{t('journals.noTemplatesFoundDesc')}</p>
              </div>
            ) : (
              // Filter to only show template journals
              filteredJournals.map((journal) => {
                return (
                  <Card 
                    key={journal.id} 
                    className="overflow-hidden transition-all hover:shadow-md"
                    style={{ borderTopColor: journal.color, borderTopWidth: '4px' }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div 
                            className="p-2 rounded-md mr-3"
                            style={{ backgroundColor: `${journal.color}20` }}
                          >
                            {renderIcon(journal.icon || 'chart')}
                          </div>
                          <div>
                            <CardTitle className="text-lg flex items-center">
                              {journal.name}
                              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                                {t('journals.template')}
                              </span>
                            </CardTitle>
                          </div>
                        </div>
                      </div>
                      {journal.description && (
                        <CardDescription className="mt-2">
                          {journal.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-3">
                      {journal.settings && (
                        <div className="space-y-2 text-sm">
                          {journal.settings.currency && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('journals.currency')}</span>
                              <span className="font-medium">{journal.settings.currency}</span>
                            </div>
                          )}
                          {journal.settings.initialCapital && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('journals.initialCapital')}</span>
                              <span className="font-medium">{journal.settings.initialCapital.toLocaleString()}</span>
                            </div>
                          )}
                          {journal.settings.riskPercentage && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('journals.riskPercentage')}</span>
                              <span className="font-medium">{journal.settings.riskPercentage}%</span>
                            </div>
                          )}
                          {journal.settings.tradingHours && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{t('journals.tradingHours')}</span>
                              <span className="font-medium">
                                {journal.settings.tradingHours.start} - {journal.settings.tradingHours.end}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-2">
                      <Button className="w-full" onClick={() => handleCreateTemplateJournal(journal.name.toLowerCase().replace(/\s+/g, ''))}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('journals.useTemplate')}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('journals.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('journals.confirmDeleteDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('journals.warningTitle')}</AlertTitle>
              <AlertDescription>
                {t('journals.warningDesc')}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('journals.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Journal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('journals.editJournal')}</DialogTitle>
            <DialogDescription>{t('journals.editJournalDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editName" className="text-right">
                {t('journals.name')}*
              </Label>
              <Input
                id="editName"
                value={editJournalData.name}
                onChange={(e) => setEditJournalData({ ...editJournalData, name: e.target.value })}
                className="col-span-3"
                placeholder={t('journals.namePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDescription" className="text-right">
                {t('journals.description')}
              </Label>
              <Textarea
                id="editDescription"
                value={editJournalData.description}
                onChange={(e) => setEditJournalData({ ...editJournalData, description: e.target.value })}
                className="col-span-3"
                placeholder={t('journals.descriptionPlaceholder')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editIcon" className="text-right">
                {t('journals.icon')}
              </Label>
              <Select
                value={editJournalData.icon}
                onValueChange={(value) => setEditJournalData({ ...editJournalData, icon: value })}
              >
                <SelectTrigger id="editIcon" className="col-span-3">
                  <SelectValue placeholder={t('journals.selectIcon')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chart">
                    <div className="flex items-center">
                      <BarChart className="mr-2 h-4 w-4" /> {t('journals.icons.chart')}
                    </div>
                  </SelectItem>
                  <SelectItem value="trending-up">
                    <div className="flex items-center">
                      <TrendingUp className="mr-2 h-4 w-4" /> {t('journals.icons.trendingUp')}
                    </div>
                  </SelectItem>
                  <SelectItem value="activity">
                    <div className="flex items-center">
                      <Activity className="mr-2 h-4 w-4" /> {t('journals.icons.activity')}
                    </div>
                  </SelectItem>
                  <SelectItem value="globe">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4" /> {t('journals.icons.globe')}
                    </div>
                  </SelectItem>
                  <SelectItem value="bitcoin">
                    <div className="flex items-center">
                      <Bitcoin className="mr-2 h-4 w-4" /> {t('journals.icons.bitcoin')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editColor" className="text-right">
                {t('journals.color')}
              </Label>
              <div className="col-span-3 flex items-center">
                <input
                  type="color"
                  id="editColor"
                  value={editJournalData.color}
                  onChange={(e) => setEditJournalData({ ...editJournalData, color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <Input
                  value={editJournalData.color}
                  onChange={(e) => setEditJournalData({ ...editJournalData, color: e.target.value })}
                  className="ml-2 flex-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editInitialCapital" className="text-right">
                {t('journals.initialCapital')}
              </Label>
              <Input
                id="editInitialCapital"
                type="number"
                value={editJournalData.initialCapital}
                onChange={(e) => setEditJournalData({ ...editJournalData, initialCapital: Number(e.target.value) })}
                className="col-span-3"
                placeholder={t('journals.initialCapitalPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleUpdateJournal}>
              {t('journals.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}