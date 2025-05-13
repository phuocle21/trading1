"use client";

import type { SubmitHandler } from 'react-hook-form';
import { useForm, useWatch } from 'react-hook-form';
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
import type { Trade } from '@/types';
import { useJournals } from '@/contexts/JournalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlaybooks } from '@/contexts/PlaybookContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Info, AlertCircle, BookOpenText, Clock, ArrowRight, ImageIcon, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';

const tradeFormSchema = z.object({
  entryDateTime: z.date({ required_error: "Entry date and time is required." }),
  exitDateTime: z.date().optional().nullable(),
  stockSymbol: z.string().min(1, "Stock symbol is required.").max(10, "Symbol too long.").toUpperCase(),
  tradeType: z.enum(['buy', 'sell'], { required_error: "Trade type is required." }),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  entryPrice: z.coerce.number().positive("Entry price must be positive."),
  exitPrice: z.coerce.number().positive("Exit price must be positive.").optional().nullable(),
  stopLoss: z.coerce.number().positive("Stop loss must be positive.").optional().nullable(),
  takeProfit: z.coerce.number().positive("Take profit must be positive.").optional().nullable(),
  fees: z.coerce.number().min(0, "Fees cannot be negative.").optional().nullable(),
  playbook: z.string().optional().nullable(),
  risk: z.enum(['low', 'medium', 'high']).optional().nullable(),
  mood: z.enum(['calm', 'excited', 'anxious', 'confident', 'unsure']).optional().nullable(),
  rating: z.coerce.number().min(1).max(5).optional().nullable(),
  notes: z.string().max(500, "Notes too long.").optional().nullable(),
  screenshots: z.array(z.string()).optional().default([]),
}).refine(data => {
  if (data.exitDateTime && !data.exitPrice) {
    return false; 
  }
  if (data.exitPrice && !data.exitDateTime) {
    return false; 
  }
  if (data.exitDateTime && data.entryDateTime > data.exitDateTime) {
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

interface Playbook {
  id: string;
  name: string;
  strategy: string;
  timeframe?: string;
  setupCriteria: string;
  entryTriggers: string;
  exitRules: string;
  riskManagement?: string;
  notes?: string;
  winRate: number;
  avgProfit: number;
  totalTrades: number;
}

export function TradeForm({ initialData, isEditMode = false }: TradeFormProps) {
  const { currentJournalId, addTradeToJournal, updateTradeInJournal } = useJournals();
  const { playbooks } = usePlaybooks();
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [dialogImage, setDialogImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertInitialData = useCallback((data: Trade): Partial<TradeFormValues> => {
    let entryDateTime: Date | null = null;
    let exitDateTime: Date | null = null;

    if (data.entryDate) {
      entryDateTime = new Date(data.entryDate);
      if (data.entryTime) {
        const [hours, minutes] = data.entryTime.split(':').map(Number);
        entryDateTime.setHours(hours, minutes);
      } else {
        entryDateTime.setHours(0, 0, 0, 0);
      }
    }

    if (data.exitDate) {
      exitDateTime = new Date(data.exitDate);
      if (data.exitTime) {
        const [hours, minutes] = data.exitTime.split(':').map(Number);
        exitDateTime.setHours(hours, minutes);
      } else {
        exitDateTime.setHours(0, 0, 0, 0);
      }
    }

    return {
      entryDateTime: entryDateTime,
      exitDateTime: exitDateTime,
      stockSymbol: data.symbol || '',
      tradeType: data.tradeType,
      quantity: data.quantity,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice ?? null,
      stopLoss: data.stopLoss ?? null,
      takeProfit: data.takeProfit ?? null,
      fees: data.fees ?? null,
      playbook: data.playbook ?? null,
      risk: data.risk ?? null,
      mood: data.mood ?? null,
      rating: data.rating ?? null,
      notes: data.notes ?? null,
      screenshots: data.screenshots ?? [],
    };
  }, []);

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: initialData
      ? convertInitialData(initialData)
      : { 
          entryDateTime: new Date(),
          exitDateTime: null,
          stockSymbol: '', 
          tradeType: 'buy', 
          quantity: undefined, 
          entryPrice: undefined, 
          exitPrice: null, 
          stopLoss: null,
          takeProfit: null,
          fees: null,
          playbook: null,
          risk: null,
          mood: null,
          rating: null,
          notes: null,
          screenshots: [], 
        },
  });

  const selectedPlaybook = useWatch({
    control: form.control,
    name: "playbook",
  });

  const screenshots = useWatch({
    control: form.control,
    name: "screenshots",
  });

  useEffect(() => {
    if (screenshots) {
      setPreviewImages(screenshots);
    }
  }, [screenshots]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                if (event.target?.result) {
                  const imageDataUrl = event.target.result.toString();
                  
                  const currentScreenshots = form.getValues("screenshots") || [];
                  form.setValue("screenshots", [...currentScreenshots, imageDataUrl]);
                  setPreviewImages(prev => [...prev, imageDataUrl]);
                  
                  toast({ 
                    title: t('tradeForm.screenshotAdded'),
                    description: t('tradeForm.screenshotAddedDesc')
                  });
                }
              };
              reader.readAsDataURL(file);
              
              if (document.activeElement?.tagName !== 'TEXTAREA' && 
                  document.activeElement?.tagName !== 'INPUT') {
                e.preventDefault();
              }
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [form, t, toast]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          if (event.target?.result) {
            const imageDataUrl = event.target.result.toString();
            
            const currentScreenshots = form.getValues("screenshots") || [];
            form.setValue("screenshots", [...currentScreenshots, imageDataUrl]);
            setPreviewImages(prev => [...prev, imageDataUrl]);
          }
        };
        
        reader.readAsDataURL(files[i]);
      }
      
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const currentScreenshots = [...(form.getValues("screenshots") || [])];
    currentScreenshots.splice(index, 1);
    form.setValue("screenshots", currentScreenshots);
    setPreviewImages(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
    
    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image') !== -1) {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            if (event.target?.result) {
              const imageDataUrl = event.target.result.toString();
              
              const currentScreenshots = form.getValues("screenshots") || [];
              form.setValue("screenshots", [...currentScreenshots, imageDataUrl]);
              setPreviewImages(prev => [...prev, imageDataUrl]);
            }
          };
          
          reader.readAsDataURL(files[i]);
        }
      }
    }
  };

  const convertFormData = (data: TradeFormValues): Partial<Trade> => {
    const entryDate = data.entryDateTime.toISOString().split('T')[0];
    const entryTime = format(data.entryDateTime, 'HH:mm');

    let exitDate: string | undefined = undefined;
    let exitTime: string | undefined = undefined;
    
    if (data.exitDateTime) {
      exitDate = data.exitDateTime.toISOString().split('T')[0];
      exitTime = format(data.exitDateTime, 'HH:mm');
    }

    return {
      entryDate,
      entryTime,
      exitDate,
      exitTime,
      symbol: data.stockSymbol,
      tradeType: data.tradeType,
      quantity: data.quantity,
      entryPrice: data.entryPrice,
      exitPrice: data.exitPrice ?? undefined,
      stopLoss: data.stopLoss ?? undefined,
      takeProfit: data.takeProfit ?? undefined,
      fees: data.fees ?? 0,
      playbook: data.playbook || undefined,
      risk: data.risk || undefined,
      mood: data.mood || undefined,
      rating: data.rating ?? undefined,
      notes: data.notes || undefined,
      screenshots: data.screenshots || [],
      journalId: currentJournalId, // Thêm trường journalId để đảm bảo giao dịch được gán với nhật ký đúng
    };
  };

  const onSubmit: SubmitHandler<TradeFormValues> = async (data) => {
    if (!currentJournalId) {
      toast({ 
        title: "Chưa có nhật ký giao dịch",
        description: "Vui lòng tạo nhật ký giao dịch trước khi thêm giao dịch mới",
        variant: "destructive" 
      });
      return;
    }

    try {
      const tradePayload = convertFormData(data);
      
      if (isEditMode && initialData) {
        await updateTradeInJournal(currentJournalId, { ...initialData, ...tradePayload });
        toast({ title: t('tradeForm.tradeUpdated'), description: t('tradeForm.tradeUpdatedDesc') });
      } else {
        await addTradeToJournal(currentJournalId, tradePayload as Omit<Trade, 'id'>);
        toast({ title: t('tradeForm.tradeAdded'), description: t('tradeForm.tradeAddedDesc') });
      }
      
      // Thêm một chút delay để đảm bảo dữ liệu được lưu trữ đầy đủ trước khi chuyển hướng
      setTimeout(() => {
        router.push('/history');
      }, 300);
    } catch (error) {
      console.error('Error submitting trade:', error);
      toast({ 
        title: "Lỗi khi lưu giao dịch", 
        description: "Đã xảy ra lỗi khi lưu giao dịch, vui lòng thử lại sau",
        variant: "destructive" 
      });
    }
  };

  const selectedPlaybookDetails = playbooks.find(p => p.id === selectedPlaybook);

  return (
    <Card className="w-full max-w-screen-2xl mx-auto shadow-lg border-t-4 border-t-primary">
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
          <CardContent className="space-y-6">
            <div className="bg-accent/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">{t('tradeForm.detailsDescription')}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1400px] mx-auto">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-accent/10 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium flex items-center">
                    <Info className="mr-2 h-4 w-4" />
                    {t('tradeForm.stockInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                </div>

                <div className="bg-accent/10 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium flex items-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('tradeForm.entryInfo')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="entryDateTime"
                      render={({ field }) => (
                        <FormItem className="col-span-1 md:col-span-1">
                          <FormLabel>{t('tradeForm.entryDateTime')}*</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''} 
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) {
                                  field.onChange(new Date(value));
                                }
                              }}
                              className="w-full text-left focus-visible:ring-1 focus-visible:ring-primary"
                            />
                          </FormControl>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t('tradeForm.dateTimeDescription')}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              className="w-full"
                              inputMode="decimal"
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
                              className="w-full"
                              inputMode="decimal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium flex items-center">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {t('tradeForm.exitInfo')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="exitDateTime"
                      render={({ field }) => (
                        <FormItem className="col-span-1">
                          <FormLabel>{t('tradeForm.exitDateTime')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''} 
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value) {
                                  field.onChange(new Date(value));
                                } else {
                                  field.onChange(null);
                                }
                              }}
                              className="w-full text-left"
                            />
                          </FormControl>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {t('tradeForm.dateTimeDescription')}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                 field.onChange(val === '' ? undefined : parseFloat(val));
                              }}
                              className="w-full text-left"
                              inputMode="decimal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    {t('tradeForm.riskManagement')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              className="w-full text-left"
                              inputMode="decimal"
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
                              className="w-full text-left"
                              inputMode="decimal"
                            />
                          </FormControl>
                          <FormDescription>{t('tradeForm.takeProfitDesc')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              className="w-full text-left"
                              inputMode="decimal"
                            />
                          </FormControl>
                          <FormDescription>{t('tradeForm.feesDesc')}</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 space-y-4">
                  <h3 className="text-base font-medium flex items-center">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {t('tradeForm.screenshots') || 'Ảnh chụp màn hình'}
                  </h3>
                  
                  <div 
                    className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                      multiple 
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t('tradeForm.dropImageHere') || 'Kéo thả hình ảnh vào đây'}</p>
                        <p className="text-xs text-muted-foreground">{t('tradeForm.orClickToUpload') || 'hoặc nhấp để tải lên'}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {t('tradeForm.pasteScreenshot') || 'Bạn cũng có thể sử dụng Ctrl+V (hoặc Cmd+V) để dán trực tiếp ảnh chụp màn hình'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {previewImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                      {previewImages.map((image, index) => (
                        <div key={index} className="relative group rounded-md overflow-hidden border border-muted">
                          <div className="relative aspect-video">
                            <img 
                              src={image} 
                              alt={`Screenshot ${index + 1}`}
                              className="object-cover w-full h-full cursor-pointer"
                              onClick={() => setDialogImage(image)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-accent/10 rounded-lg p-4">
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center">
                      <BookOpenText className="mr-2 h-4 w-4" />
                      {t('tradeForm.strategyAndPsychology')}
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="playbook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('tradeForm.selectPlaybook')}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('tradeForm.choosePlaybook')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {playbooks.map((playbook) => (
                                <SelectItem key={playbook.id} value={playbook.id}>
                                  {playbook.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {t('tradeForm.playbookDescription')}
                            {selectedPlaybookDetails && (
                              <Button
                                type="button"
                                variant="link"
                                className="p-0 h-auto text-xs text-primary"
                                onClick={() => router.push(`/playbooks?view=${selectedPlaybookDetails.id}`)}
                              >
                                {t('tradeForm.viewSelectedPlaybook')}
                              </Button>
                            )}
                          </FormDescription>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-base font-medium">{t('tradeForm.tradeNotes')}</h3>
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea 
                            placeholder={t('tradeForm.notesPlaceholder')} 
                            className="h-56"
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
              </div>
            </div>
          </CardContent>

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

      {dialogImage && (
        <Dialog open={!!dialogImage} onOpenChange={() => setDialogImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogTitle className="sr-only">{t('tradeForm.zoomedScreenshot')}</DialogTitle>
            <div className="relative">
              <img src={dialogImage} alt="Zoomed Screenshot" className="w-full h-auto rounded-md" />
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="absolute top-2 right-2 p-1 rounded-full"
                  onClick={() => setDialogImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
