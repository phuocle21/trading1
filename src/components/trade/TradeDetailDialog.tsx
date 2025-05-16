"use client";

import { useState } from 'react';
import { usePlaybooks } from '@/contexts/PlaybookContext';
import { calculateProfitLoss, formatCurrency, formatDate } from '@/lib/trade-utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Edit3, 
  Star, 
  ImageIcon, 
  X,
  Calendar,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Trade } from '@/types';

interface TradeDetailDialogProps {
  trade: Trade | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradeDetailDialog({ trade, isOpen, onOpenChange }: TradeDetailDialogProps) {
  const router = useRouter();
  const { playbooks } = usePlaybooks();
  const [dialogImage, setDialogImage] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  if (!trade) return null;

  // Lấy thông tin playbook nếu có
  const selectedPlaybook = trade.playbook ? playbooks.find(p => p.id === trade.playbook) : null;
  
  // Tính lợi nhuận/lỗ
  const profitOrLoss = trade.exitPrice 
    ? (trade.tradeType === 'buy' 
        ? (trade.exitPrice - trade.entryPrice) * trade.quantity - (trade.fees || 0)
        : (trade.entryPrice - trade.exitPrice) * trade.quantity - (trade.fees || 0))
    : null;
  
  const profitColor = profitOrLoss !== null
    ? (profitOrLoss > 0 ? "text-green-600" : profitOrLoss < 0 ? "text-red-600" : "text-foreground")
    : "";
  
  // Hiển thị đánh giá dưới dạng sao
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

  // Xử lý khi người dùng click vào ảnh
  const handleImageClick = (image: string, index: number) => {
    if (trade?.screenshots) {
      setCurrentImages(trade.screenshots);
      setCurrentImageIndex(index);
      setDialogImage(image);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <span>{trade.symbol || trade.stockSymbol}</span>
              <span>
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
              {profitOrLoss !== null && (
                <span className={`ml-auto ${profitColor} font-bold`}>
                  {formatCurrency(profitOrLoss)}
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              {trade.entryDate && formatDate(trade.entryDate)}
              {trade.entryTime && (
                <span className="flex items-center ml-3">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {trade.entryTime}
                </span>
              )}
              {trade.exitDate && (
                <span className="mx-2">→</span>
              )}
              {trade.exitDate && formatDate(trade.exitDate)}
              {trade.exitTime && (
                <span className="flex items-center ml-3">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  {trade.exitTime}
                </span>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
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
                {trade.stopLoss && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Dừng lỗ</h3>
                    <p className="text-lg font-medium">{formatCurrency(trade.stopLoss)}</p>
                  </div>
                )}
                
                {trade.takeProfit && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Chốt lời</h3>
                    <p className="text-lg font-medium">{formatCurrency(trade.takeProfit)}</p>
                  </div>
                )}
                
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
            
            {trade.screenshots && trade.screenshots.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Ảnh chụp màn hình</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trade.screenshots.map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-video rounded-md overflow-hidden border border-muted cursor-pointer group"
                      onClick={() => handleImageClick(image, index)}
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
          </div>
          
          <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline">
                Đóng
              </Button>
            </DialogClose>
            <Button 
              onClick={() => router.push(`/edit-trade/${trade.id}`)} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Edit3 className="mr-2 h-4 w-4" /> Chỉnh sửa giao dịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {dialogImage && (
        <Dialog open={!!dialogImage} onOpenChange={(open) => !open && setDialogImage(null)}>
          <DialogContent className="max-w-4xl p-0">
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
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white border-0 hover:bg-black/70"
                  onClick={() => setDialogImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
              
              {currentImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {currentImages.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
