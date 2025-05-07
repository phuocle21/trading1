"use client";

import { TradeForm } from '@/components/trade/TradeForm';
import { useTrades } from '@/contexts/TradeContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a Skeleton component

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { trades, isLoading } = useTrades();
  const [tradeToEdit, setTradeToEdit] = useState<Trade | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!isLoading && id) {
      const foundTrade = trades.find(trade => trade.id === id);
      if (foundTrade) {
        setTradeToEdit(foundTrade);
      } else {
        setNotFound(true);
        // Optionally redirect or show a more prominent "not found" message
        // router.push('/history'); // Example redirect
      }
    }
  }, [id, trades, isLoading, router]);

  if (isLoading || (id && !tradeToEdit && !notFound)) {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
               <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
           <div className="flex justify-between pt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-semibold text-destructive">Trade Not Found</h2>
        <p className="text-muted-foreground">The trade you are trying to edit does not exist.</p>
        <Button onClick={() => router.push('/history')} className="mt-4">Go to Trade History</Button>
      </div>
    );
  }
  
  if (!tradeToEdit) {
     // This case should ideally be covered by isLoading or notFound, but as a fallback:
    return <div className="container mx-auto py-10 text-center">Preparing form...</div>;
  }

  return (
    <div className="container mx-auto py-4">
      <TradeForm initialData={tradeToEdit} isEditMode={true} />
    </div>
  );
}
