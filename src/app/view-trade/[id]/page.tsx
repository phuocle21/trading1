"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useJournals } from '@/contexts/JournalContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlaybooks } from '@/contexts/PlaybookContext';
import { calculateProfitLoss, formatCurrency, formatDate } from '@/lib/trade-utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogClose, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Star, 
  ImageIcon, 
  X,
  Calendar,
  Clock
} from 'lucide-react';
import type { Trade } from '@/types';

export default function ViewTradePage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const router = useRouter();
  const { getCurrentJournal, isLoading: journalLoading } = useJournals();
  const { playbooks } = usePlaybooks();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [dialogImage, setDialogImage] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  useEffect(() => {
    const fetchTradeData = async () => {
      try {
        const currentJournal = await getCurrentJournal();
        if (!currentJournal) {
          setNotFound(true);
          return;
        }
        
        const journalTrades = currentJournal.trades || [];
        const journalTrade = journalTrades.find(trade => trade.id === id);
        
        if (journalTrade) {
          setTrade(journalTrade);
          if (journalTrade.screenshots && journalTrade.screenshots.length > 0) {
            setCurrentImages(journalTrade.screenshots);
          }
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error fetching trade:', error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTradeData();
  }, [id, getCurrentJournal]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-1/3" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (notFound) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy giao dịch</h1>
        <p className="mb-6 text-muted-foreground">
          Giao dịch bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <Button onClick={() => router.push('/history')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại lịch sử giao dịch
        </Button>
      </div>
    );
  }

  if (!trade) return null;

  const profitOrLoss = calculateProfitLoss(trade);
  
  const profitColor = profitOrLoss !== null
    ? (profitOrLoss > 0 ? "text-green-600" : profitOrLoss < 0 ? "text-red-600" : "text-foreground")
    : "";
  
  const selectedPlaybook = trade.playbook ? playbooks.find(p => p.id === trade.playbook) : null;
  
  // Render ratings as stars
  const renderRating = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>
      
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                {trade.symbol}
                <span className="ml-3">
                  {trade.tradeType === 'buy' ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <TrendingUp className="mr-1 h-4 w-4" /> Mua
                    </Badge>
                  ) : (
                    <Badge className="bg-red-50 text-red-700 border-red-200">
                      <TrendingDown className="mr-1 h-4 w-4" /> Bán
                    </Badge>
                  )}
                </span>
              </CardTitle>
              <CardDescription className="mt-1 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                {trade.entryDate && formatDate(trade.entryDate)}
                {trade.entryTime && (
                  <span className="flex items-center ml-3">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {trade.entryTime}
                  </span>
                )}
                {trade.exitDate && (
                  <span className="mx-2">→</span>
                )}
                {trade.exitDate && formatDate(trade.exitDate)}
                {trade.exitTime && (
                  <span className="flex items-center ml-3">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {trade.exitTime}
                  </span>
                )}
              </CardDescription>
            </div>
            
            {profitOrLoss !== null && (
              <div className={`text-xl md:text-2xl font-bold ${profitColor} mt-2 md:mt-0`}>
                {formatCurrency(profitOrLoss)}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Số lượng</h3>
                <p className="text-lg font-medium">{trade.quantity}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Giá mở lệnh</h3>
                <p className="text-lg font-medium">{formatCurrency(trade.entryPrice)}</p>
              </div>
              
              {trade.exitPrice && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Giá đóng lệnh</h3>
                  <p className="text-lg font-medium">{formatCurrency(trade.exitPrice)}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {trade.fees !== undefined && trade.fees > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Phí giao dịch</h3>
                  <p className="text-lg font-medium">{formatCurrency(trade.fees)}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {trade.playbook && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Chiến lược</h3>
                  <Badge variant="outline" className="mt-1">
                    {selectedPlaybook ? selectedPlaybook.name : trade.playbook}
                  </Badge>
                </div>
              )}
              
              {trade.risk && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Mức độ rủi ro</h3>
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
                    {trade.risk === 'low' 
                      ? 'Thấp' 
                      : trade.risk === 'medium' 
                        ? 'Trung bình' 
                        : 'Cao'}
                  </Badge>
                </div>
              )}
              
              {trade.mood && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Tâm trạng</h3>
                  <Badge variant="outline">{trade.mood}</Badge>
                </div>
              )}
              
              {trade.rating && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Đánh giá</h3>
                  {renderRating(trade.rating)}
                </div>
              )}
            </div>
          </div>
          
          {trade.notes && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ghi chú</h3>
              <div className="bg-accent/10 rounded-lg p-4 whitespace-pre-wrap">
                {trade.notes}
              </div>
            </div>
          )}
          
          {currentImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Ảnh chụp màn hình</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentImages.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-video rounded-md overflow-hidden border border-muted cursor-pointer group"
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setDialogImage(image);
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`Screenshot ${index + 1}`} 
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-6 flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-y-0 items-stretch sm:items-center">
          <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <Button 
            onClick={() => router.push(`/edit-trade/${trade.id}`)} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
          >
            <Edit3 className="mr-2 h-4 w-4" /> Chỉnh sửa giao dịch
          </Button>
        </CardFooter>
      </Card>
      
      {dialogImage && (
        <Dialog open={!!dialogImage} onOpenChange={() => setDialogImage(null)}>
          <DialogContent className="max-w-4xl">
            <DialogTitle className="sr-only">Ảnh chụp màn hình đã phóng to</DialogTitle>
            <div className="relative flex justify-center items-center">
              <img 
                src={dialogImage} 
                alt="Ảnh chụp màn hình đã phóng to" 
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-md" 
              />
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
    </div>
  );
}
