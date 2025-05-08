"use client";

import { useState } from "react";
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
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpenText, PlusCircle, Trash2, Edit, 
  Save, LayoutList, ArrowRightLeft, BarChart
} from "lucide-react";

// Define the form schema
const playBookFormSchema = z.object({
  name: z.string().min(2, {
    message: "Playbook name must be at least 2 characters.",
  }),
  strategy: z.string().min(5, {
    message: "Strategy description must be at least 5 characters.",
  }),
  timeframe: z.string().optional(),
  setupCriteria: z.string().min(1, {
    message: "Setup criteria is required.",
  }),
  entryTriggers: z.string().min(1, {
    message: "Entry trigger is required.",
  }),
  exitRules: z.string().min(1, {
    message: "Exit rules are required.",
  }),
  riskManagement: z.string().optional(),
  notes: z.string().optional(),
});

type PlaybookFormValues = z.infer<typeof playBookFormSchema>;

// Mock data for the playbooks
const mockPlaybooks = [
  {
    id: "1",
    name: "Trend Following Breakout",
    strategy: "Momentum strategy that captures breakouts from consolidation periods",
    timeframe: "Daily",
    setupCriteria: "Price in a consolidation pattern for at least 10 days with decreasing volume",
    entryTriggers: "Price breaks above the upper trendline or resistance with increased volume",
    exitRules: "Either a trailing stop at 2x ATR or when price closes below a 20-day moving average",
    riskManagement: "Risk 1% per trade, with position sizing calculated based on the distance to stop loss",
    notes: "Works best in trending markets, avoid during choppy or sideways markets",
    winRate: 62,
    avgProfit: 2.8,
    totalTrades: 48,
  },
  {
    id: "2",
    name: "Pullback Strategy",
    strategy: "Buy pullbacks in an established uptrend",
    timeframe: "4-hour",
    setupCriteria: "Stock in an uptrend with moving averages aligned (8EMA > 21EMA > 50SMA)",
    entryTriggers: "Price pulls back to the 21 EMA and shows a reversal candlestick pattern",
    exitRules: "Take profit at previous swing high or 3:1 reward:risk ratio",
    riskManagement: "Stop loss below the swing low of the pullback or below the 50 SMA",
    notes: "Confirm with RSI showing bullish divergence for better results",
    winRate: 58,
    avgProfit: 2.1,
    totalTrades: 65,
  },
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState(mockPlaybooks);
  const [activeTab, setActiveTab] = useState("list");
  const [editingPlaybook, setEditingPlaybook] = useState<any>(null);
  const { t } = useLanguage();

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

  function onSubmit(data: PlaybookFormValues) {
    if (editingPlaybook) {
      // Update existing playbook
      const updatedPlaybooks = playbooks.map(p => 
        p.id === editingPlaybook.id ? { ...p, ...data } : p
      );
      setPlaybooks(updatedPlaybooks);
      toast({
        title: t('playbooks.playbookUpdated'),
        description: t('playbooks.playbookUpdatedDesc').replace('{name}', data.name),
      });
    } else {
      // Add new playbook
      const newPlaybook = {
        id: Date.now().toString(),
        ...data,
        winRate: 0,
        avgProfit: 0,
        totalTrades: 0,
      };
      setPlaybooks([...playbooks, newPlaybook]);
      toast({
        title: t('playbooks.playbookCreated'),
        description: t('playbooks.playbookCreatedDesc').replace('{name}', data.name),
      });
    }
    
    // Reset form and go back to list view
    form.reset();
    setActiveTab("list");
    setEditingPlaybook(null);
  }

  function handleEdit(playbook: any) {
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

  function handleDelete(id: string) {
    const updatedPlaybooks = playbooks.filter(p => p.id !== id);
    setPlaybooks(updatedPlaybooks);
    toast({
      title: t('playbooks.playbookDeleted'),
      description: t('playbooks.playbookDeletedDesc'),
    });
  }

  function handleAddNew() {
    form.reset();
    setEditingPlaybook(null);
    setActiveTab("edit");
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
            <span className="sm:hidden">List</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-1">
            <BookOpenText className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">
              {editingPlaybook ? t('playbooks.editPlaybook') : t('playbooks.createPlaybook')}
            </span>
            <span className="sm:hidden">
              {editingPlaybook ? "Edit" : "Create"}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-6">
          {playbooks.length === 0 ? (
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
              {playbooks.map((playbook) => (
                <Card key={playbook.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{playbook.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {playbook.strategy}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">{t('playbooks.winRate')}</span>
                        <span className="text-lg">{playbook.winRate}%</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{t('playbooks.avgRR')}</span>
                        <span className="text-lg">{playbook.avgProfit}R</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{t('playbooks.timeframe')}</span>
                        <span>{playbook.timeframe || t('playbooks.na')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{t('playbooks.totalTrades')}</span>
                        <span>{playbook.totalTrades}</span>
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
                        >
                          <BarChart className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">{t('playbooks.stats')}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(playbook.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">{t('playbooks.delete')}</span>
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
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
                              <SelectItem value="1hour">{t('playbooks.timeframes.1hour')}</SelectItem>
                              <SelectItem value="4hour">{t('playbooks.timeframes.4hour')}</SelectItem>
                              <SelectItem value="Daily">{t('playbooks.timeframes.daily')}</SelectItem>
                              <SelectItem value="Weekly">{t('playbooks.timeframes.weekly')}</SelectItem>
                              <SelectItem value="Monthly">{t('playbooks.timeframes.monthly')}</SelectItem>
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

                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>

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
    </div>
  );
}