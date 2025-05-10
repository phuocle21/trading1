"use client";

import { TradeForm } from '@/components/trade/TradeForm';
import { useJournals } from '@/contexts/JournalContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Trade } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function EditTradePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { getCurrentJournal, isLoading: journalLoading } = useJournals();
  const [tradeToEdit, setTradeToEdit] = useState<Trade | undefined>(undefined);
  const [notFound, setNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTradeData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Tải giao dịch trực tiếp từ API để đảm bảo đồng bộ với trang lịch sử giao dịch
        const response = await fetch('/api/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        
        const data = await response.json();
        if (data.trades && Array.isArray(data.trades)) {
          const foundTrade = data.trades.find(trade => trade.id === id);
          if (foundTrade) {
            setTradeToEdit(foundTrade);
          } else {
            // Nếu không tìm thấy trong API, hãy thử tìm trong context nhật ký (dự phòng)
            const currentJournal = getCurrentJournal();
            const journalTrades = currentJournal?.trades || [];
            const journalTrade = journalTrades.find(trade => trade.id === id);
            
            if (journalTrade) {
              setTradeToEdit(journalTrade);
            } else {
              setNotFound(true);
            }
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading trade data:', error);
        
        // Dự phòng: Nếu API thất bại, hãy thử tìm trong context nhật ký
        const currentJournal = getCurrentJournal();
        const journalTrades = currentJournal?.trades || [];
        const journalTrade = journalTrades.find(trade => trade.id === id);
        
        if (journalTrade) {
          setTradeToEdit(journalTrade);
        } else {
          setNotFound(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [id, getCurrentJournal]);

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
        <h2 className="text-2xl font-semibold text-destructive">Không tìm thấy giao dịch</h2>
        <p className="text-muted-foreground">Giao dịch bạn đang cố gắng chỉnh sửa không tồn tại.</p>
        <Button onClick={() => router.push('/history')} className="mt-4">Quay lại Lịch sử giao dịch</Button>
      </div>
    );
  }
  
  if (!tradeToEdit) {
    return <div className="container mx-auto py-10 text-center">Đang chuẩn bị biểu mẫu...</div>;
  }

  return (
    <div className="container mx-auto py-4">
      <TradeForm initialData={tradeToEdit} isEditMode={true} />
    </div>
  );
}
