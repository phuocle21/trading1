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
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

const tradeFormSchema = z.object({
  entryDate: z.date({ required_error: "Entry date is required." }),
  exitDate: z.date().optional().nullable(),
  stockSymbol: z.string().min(1, "Stock symbol is required.").max(10, "Symbol too long.").toUpperCase(),
  tradeType: z.enum(['buy', 'sell'], { required_error: "Trade type is required." }),
  quantity: z.coerce.number().positive("Quantity must be positive."),
  entryPrice: z.coerce.number().positive("Entry price must be positive."),
  exitPrice: z.coerce.number().positive("Exit price must be positive.").optional().nullable(),
  fees: z.coerce.number().min(0, "Fees cannot be negative.").optional().nullable(),
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
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: initialData
      ? { 
          ...initialData,
          entryDate: new Date(initialData.entryDate),
          exitDate: initialData.exitDate ? new Date(initialData.exitDate) : null,
          stockSymbol: initialData.stockSymbol || '',
          fees: initialData.fees ?? null, 
          notes: initialData.notes ?? null, 
          exitPrice: initialData.exitPrice ?? null,
        }
      : { 
          entryDate: new Date(),
          exitDate: null,
          stockSymbol: '', 
          tradeType: 'buy', 
          quantity: undefined, 
          entryPrice: undefined, 
          exitPrice: null, 
          fees: null, 
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
    };

    if (isEditMode && initialData) {
      updateTrade({ ...initialData, ...tradePayload });
      toast({ title: "Trade Updated", description: "Your trade has been successfully updated." });
    } else {
      addTrade(tradePayload as Omit<Trade, 'id'>); // Cast because ID is added in addTrade
      toast({ title: "Trade Added", description: "New trade successfully recorded." });
    }
    router.push('/history');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-primary">
          {isEditMode ? 'Edit Trade' : 'Add New Trade'}
        </CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Date</FormLabel>
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
                name="exitDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Date (Optional)</FormLabel>
                    <DatePicker 
                      date={field.value || undefined} 
                      setDate={(date) => field.onChange(date)} 
                      placeholder="Pick an exit date"
                      disabled={(date) => form.getValues("entryDate") ? date < form.getValues("entryDate") : false}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stockSymbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Symbol</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AAPL, MSFT" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tradeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trade Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trade type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="buy">Buy (Long)</SelectItem>
                        <SelectItem value="sell">Sell (Short)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 100" 
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="entryPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 150.25" 
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
                name="exitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exit Price (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 160.50" 
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
            
            <FormField
              control={form.control}
              name="fees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fees (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 5.00" 
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any notes about this trade..." 
                      {...field} 
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value === '' ? null : e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-6 sm:flex-row sm:justify-between sm:space-y-0 items-stretch sm:items-center">
            <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" /> {isEditMode ? 'Save Changes' : 'Add Trade'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
