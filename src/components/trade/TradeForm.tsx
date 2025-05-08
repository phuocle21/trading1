"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import type { Trade } from '@/types';
import { useTrades } from '@/contexts/TradeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Info, AlertCircle, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';

const tradeFormSchema = z.object({
  entryDate: z.date({ required_error: "Entry date is required." }),
  entryTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)").optional().nullable(),
  exitDate: z.date().optional().nullable(),
  exitTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid time (HH:MM)").optional().nullable(),
  stockSymbol: z.string().min(1, "Stock symbol is required.").max(10, "Symbol too long.").toUpperCase(),
  tradeType: z.enum(['buy', 'sell'], { required_error: "Trade type is required." }),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  entryPrice: z.coerce.number().positive("Entry price must be positive."),
  exitPrice: z.coerce.number().positive("Exit price must be positive.").optional().nullable(),
  stopLoss: z.coerce.number().positive("Stop loss must be positive.").optional().nullable(),
  takeProfit: z.coerce.number().positive("Take profit must be positive.").optional().nullable(),
  fees: z.coerce.number().min(0, "Fees cannot be negative.").optional().nullable(),
  setup: z.string().optional().nullable(),
  risk: z.enum(['low', 'medium', 'high']).optional().nullable(),
  mood: z.enum(['calm', 'excited', 'anxious', 'confident', 'unsure']).optional().nullable(),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  notes: z.string().max(500, "Notes too long.").optional().nullable(),
}).refine(data => {
  if (data.exitDate && !data.exitPrice) {
    return false; 
  }
  if (data.exitPrice && !data.exitDate) {
    return false; 
  }
  if (data.exitDate && data.entryDate > data.exitDate) {
    return false; 
  }
  return true;
}, {
  message: "Exit price is required if exit date is set, exit date is required if exit price is set, or entry date cannot be after exit date.",
  path: ["exitPrice"], 
});

type TradeFormValues = z.infer<typeof tradeFormSchema>;

interface TradeFormProps {
  initialData?: Trade;
  isEditMode?: boolean;
}

export function TradeForm({ initialData, isEditMode = false }: TradeFormProps) {
  const { addTrade, updateTrade } = useTrades();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: initialData
      ? { 
          ...initialData,
          entryDate: new Date(initialData.entryDate),
          entryTime: initialData.entryTime || null,
          exitDate: initialData.exitDate ? new Date(initialData.exitDate) : null,
          exitTime: initialData.exitTime || null,
          stockSymbol: initialData.stockSymbol || '',
          stopLoss: initialData.stopLoss ?? null,
          takeProfit: initialData.takeProfit ?? null,
          fees: initialData.fees ?? null, 
          setup: initialData.setup ?? null,
          risk: initialData.risk ?? null,
          mood: initialData.mood ?? null,
          rating: initialData.rating ?? null,
          notes: initialData.notes ?? null, 
          exitPrice: initialData.exitPrice ?? null,
        }
      : { 
          entryDate: new Date(),
          entryTime: format(new Date(), 'HH:mm'),
          exitDate: null,
          exitTime: null,
          stockSymbol: '', 
          tradeType: 'buy', 
          quantity: undefined, 
          entryPrice: undefined, 
          exitPrice: null, 
          stopLoss: null,
          takeProfit: null,
          fees: null, 
          setup: null,
          risk: null,
          mood: null,
          rating: null,
          notes: null, 
        },
  });

  const onSubmit: SubmitHandler<TradeFormValues> = (data) => {
    const tradePayload = {
      ...data,
      entryDate: data.entryDate.toISOString().split('T')[0], 
      exitDate: data.exitDate ? data.exitDate.toISOString().split('T')[0] : undefined,
      fees: data.fees ?? 0, 
      notes: data.notes || undefined,
      exitPrice: data.exitPrice ?? undefined,
      entryTime: data.entryTime || undefined,
      exitTime: data.exitTime || undefined,
      stopLoss: data.stopLoss ?? undefined,
      takeProfit: data.takeProfit ?? undefined,
      setup: data.setup || undefined,
      risk: data.risk || undefined,
      mood: data.mood || undefined,
      rating: data.rating ?? undefined,
    };

    if (isEditMode && initialData) {
      updateTrade({ ...initialData, ...tradePayload });
      toast({ title: t('tradeForm.tradeUpdated'), description: t('tradeForm.tradeUpdatedDesc') });
    } else {
      addTrade(tradePayload as Omit<Trade, 'id'>);
      toast({ title: t('tradeForm.tradeAdded'), description: t('tradeForm.tradeAddedDesc') });
    }
    router.push('/history');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto shadow-lg border-t-4 border-t-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold text-primary">
              {isEditMode ? t('tradeForm.title.edit') : t('tradeForm.title.add')}
            </CardTitle>
            <CardDescription>
              {t('tradeForm.description')}
            </CardDescription>
          </div>
          {!isEditMode && (
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('tradeForm.back')}
            </Button>
          )}
        </div>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs defaultValue="trade-details" className="w-full">
            <div className="px-6">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="trade-details">{t('tradeForm.tabs.details')}</TabsTrigger>
                <TabsTrigger value="trade-psychology">{t('tradeForm.tabs.psychology')}</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="trade-details" className="mt-4">
              <CardContent className="space-y-6">
                <div className="bg-accent/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t('tradeForm.detailsDescription')}</p>
                </div>
              
                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.stockInfo')}</h3>
                  <FormField
                    control={form.control}
                    name="stockSymbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.stockSymbol')}*</FormLabel>
                        <FormControl>
                          <Input placeholder={t('tradeForm.stockSymbolPlaceholder')} {...field} value={field.value || ''} className="font-medium" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tradeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.tradeDirection')}*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('tradeForm.selectTradeType')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="buy">{t('tradeForm.buyLong')}</SelectItem>
                            <SelectItem value="sell">{t('tradeForm.sellShort')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.entryInfo')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="entryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.entryDate')}*</FormLabel>
                          <DatePicker 
                              date={field.value} 
                              setDate={(date) => field.onChange(date)} 
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entryTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.entryTime')}</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                value={field.value || ''}
                                placeholder="HH:MM"
                              />
                            </FormControl>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" type="button">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">{t('tradeForm.whyTrackTime')}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {t('tradeForm.timeTrackingBenefits')}
                                  </p>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.quantity')}*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder={t('tradeForm.quantityPlaceholder')} 
                              {...field}
                              value={field.value ?? ''} 
                              onChange={e => {
                                const val = e.target.value;
                                field.onChange(val === '' ? undefined : parseFloat(val));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="entryPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.entryPrice')}*</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder={t('tradeForm.pricePlaceholder')} 
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                 const val = e.target.value;
                                 field.onChange(val === '' ? undefined : parseFloat(val));
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.exitInfo')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="exitDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.exitDate')}</FormLabel>
                          <DatePicker 
                            date={field.value || undefined} 
                            setDate={(date) => field.onChange(date)} 
                            placeholder={t('tradeForm.pickExitDate')}
                            disabled={(date) => form.getValues("entryDate") ? date < form.getValues("entryDate") : false}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exitTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.exitTime')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              {...field} 
                              value={field.value || ''}
                              placeholder="HH:MM"
                              disabled={!form.watch("exitDate")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="exitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.exitPrice')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={t('tradeForm.pricePlaceholder')} 
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => {
                               const val = e.target.value;
                               field.onChange(val === '' ? null : parseFloat(val));
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.riskManagement')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="stopLoss"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.stopLossPrice')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder={t('tradeForm.pricePlaceholder')} 
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                 const val = e.target.value;
                                 field.onChange(val === '' ? null : parseFloat(val));
                              }}
                            />
                          </FormControl>
                          <FormDescription>{t('tradeForm.stopLossDesc')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="takeProfit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.takeProfitPrice')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder={t('tradeForm.pricePlaceholder')} 
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                 const val = e.target.value;
                                 field.onChange(val === '' ? null : parseFloat(val));
                              }}
                            />
                          </FormControl>
                          <FormDescription>{t('tradeForm.takeProfitDesc')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fees"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.tradingFees')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder={t('tradeForm.feesPlaceholder')} 
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => {
                               const val = e.target.value;
                               field.onChange(val === '' ? null : parseFloat(val));
                            }}
                          />
                        </FormControl>
                        <FormDescription>{t('tradeForm.feesDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </TabsContent>

            <TabsContent value="trade-psychology" className="mt-4">
              <CardContent className="space-y-6">
                <div className="bg-accent/20 rounded-lg p-4 flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-sm text-muted-foreground">{t('tradeForm.psychologyDescription')}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.tradingSetup')}</h3>

                  <FormField
                    control={form.control}
                    name="setup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.setupPattern')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('tradeForm.selectPattern')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakout">{t('tradeForm.patterns.breakout')}</SelectItem>
                            <SelectItem value="pullback">{t('tradeForm.patterns.pullback')}</SelectItem>
                            <SelectItem value="trend_following">{t('tradeForm.patterns.trendFollowing')}</SelectItem>
                            <SelectItem value="reversal">{t('tradeForm.patterns.reversal')}</SelectItem>
                            <SelectItem value="gap_fill">{t('tradeForm.patterns.gapFill')}</SelectItem>
                            <SelectItem value="support_resistance">{t('tradeForm.patterns.supportResistance')}</SelectItem>
                            <SelectItem value="earnings_play">{t('tradeForm.patterns.earningsPlay')}</SelectItem>
                            <SelectItem value="news_event">{t('tradeForm.patterns.newsEvent')}</SelectItem>
                            <SelectItem value="other">{t('tradeForm.patterns.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t('tradeForm.setupDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="risk"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.riskLevel')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('tradeForm.selectRiskLevel')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">{t('tradeForm.riskLevels.low')}</SelectItem>
                            <SelectItem value="medium">{t('tradeForm.riskLevels.medium')}</SelectItem>
                            <SelectItem value="high">{t('tradeForm.riskLevels.high')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t('tradeForm.riskLevelDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.psychology')}</h3>

                  <FormField
                    control={form.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.yourMood')}</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('tradeForm.howWereYouFeeling')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="calm">{t('tradeForm.moods.calm')}</SelectItem>
                            <SelectItem value="excited">{t('tradeForm.moods.excited')}</SelectItem>
                            <SelectItem value="anxious">{t('tradeForm.moods.anxious')}</SelectItem>
                            <SelectItem value="confident">{t('tradeForm.moods.confident')}</SelectItem>
                            <SelectItem value="unsure">{t('tradeForm.moods.unsure')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>{t('tradeForm.moodDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.qualityRating')}</FormLabel>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button 
                              key={rating}
                              type="button"
                              variant={field.value === rating ? "default" : "outline"}
                              className={`px-3 py-1 h-9 flex-1 ${field.value === rating ? 'bg-primary text-primary-foreground' : ''}`}
                              onClick={() => field.onChange(rating)}
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                        <FormDescription>{t('tradeForm.ratingDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('tradeForm.tradeNotes')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('tradeForm.notesPlaceholder')} 
                            className="h-32"
                            {...field} 
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>{t('tradeForm.notesDesc')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </TabsContent>
          </Tabs>

          <CardFooter className="flex flex-col space-y-2 pt-6 sm:flex-row sm:justify-between sm:space-y-0 items-stretch sm:items-center border-t mt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> {t('tradeForm.cancel')}
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> {isEditMode ? t('tradeForm.saveChanges') : t('tradeForm.addTrade')}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
