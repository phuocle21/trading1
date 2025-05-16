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
        ? (trade.exitPrice - trade.entryPrice) * trade.quantity
        : (trade.entryPrice - trade.exitPrice) * trade.quantity)
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
  
  // Chuyển đổi tâm trạng sang tiếng Việt
  const translateMood = (mood: string): string => {
    const moodTranslations: Record<string, string> = {
      'calm': 'Bình tĩnh',
      'excited': 'Phấn khích',
      'anxious': 'Lo lắng',
      'confident': 'Tự tin',
      'unsure': 'Không chắc chắn/Do dự',
      'greedy': 'Tham lam',
      'fearful': 'Sợ hãi',
      'tired': 'Mệt mỏi',
      'confused': 'Bối rối'
    };
    
    return moodTranslations[mood.toLowerCase()] || mood;
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="pb-4 border-b mb-4">
            <DialogTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xl sm:text-2xl mb-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-2xl sm:text-3xl">{trade.symbol}</span>
                <span>
                  {trade.tradeType === 'buy' ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs sm:text-sm px-2 py-1">
                      <TrendingUp className="mr-1 h-4 w-4" /> Mua
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-200 text-xs sm:text-sm px-2 py-1">
                      <TrendingDown className="mr-1 h-4 w-4" /> Bán
                    </Badge>
                  )}
                </span>
              </div>
              {profitOrLoss !== null && (
                <span className={`sm:ml-auto ${profitColor} font-bold text-xl sm:text-3xl`}>
                  {formatCurrency(profitOrLoss)}
                </span>
              )}
            </DialogTitle>
            <div className="flex flex-wrap gap-2 sm:gap-4 items-center text-sm text-muted-foreground">
              <div className="flex items-center bg-accent/20 rounded-full px-3 py-1.5 shadow-sm">
                <Calendar className="h-3.5 w-3.5 mr-2 text-primary/70" />
                <span className="font-medium">{trade.entryDate && formatDate(trade.entryDate)}</span>
                {trade.entryTime && (
                  <span className="flex items-center ml-2 border-l border-muted pl-2">
                    <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                    {trade.entryTime}
                  </span>
                )}
              </div>
              
              {trade.exitDate && (
                <>
                  <div className="flex items-center text-muted-foreground">
                    <span className="font-medium px-1">→</span>
                  </div>
                  <div className="flex items-center bg-accent/20 rounded-full px-3 py-1.5 shadow-sm">
                    <Calendar className="h-3.5 w-3.5 mr-2 text-primary/70" />
                    <span className="font-medium">{formatDate(trade.exitDate)}</span>
                    {trade.exitTime && (
                      <span className="flex items-center ml-2 border-l border-muted pl-2">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-primary/70" />
                        {trade.exitTime}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Column 1: Thông tin giao dịch chính */}
              <div className="space-y-4 bg-accent/5 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <span className="w-1.5 h-5 bg-primary rounded-full mr-2 inline-block"></span>
                  Thông tin giao dịch
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Số lượng</h3>
                    <p className="text-lg font-medium">{trade.quantity}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Giá mở lệnh</h3>
                    <p className="text-lg font-medium">{formatCurrency(trade.entryPrice)}</p>
                  </div>
                </div>
                
                {trade.exitPrice && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Giá đóng lệnh</h3>
                    <p className="text-lg font-medium">{formatCurrency(trade.exitPrice)}</p>
                  </div>
                )}
              </div>
              
              {/* Column 2: Thông tin bổ sung */}
              <div className="space-y-4 bg-accent/5 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <span className="w-1.5 h-5 bg-blue-500 rounded-full mr-2 inline-block"></span>
                  Thông tin bổ sung
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {trade.playbook && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Chiến lược</h3>
                      <Badge variant="outline" className="mt-1 px-2.5 py-1 text-sm">
                        {selectedPlaybook ? selectedPlaybook.name : trade.playbook}
                      </Badge>
                    </div>
                  )}
                  
                  {trade.risk && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Mức độ rủi ro</h3>
                      <Badge 
                        variant="outline" 
                        className={`capitalize px-2.5 py-1 text-sm ${
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {trade.mood && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Tâm trạng</h3>
                      <Badge variant="outline" className="px-2.5 py-1 text-sm">{translateMood(trade.mood)}</Badge>
                    </div>
                  )}
                  
                  {trade.rating && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Đánh giá</h3>
                      <div className="mt-1">
                        {renderRating(trade.rating)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ghi chú */}
            {trade.notes && (
              <div className="bg-accent/5 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <span className="w-1.5 h-5 bg-gray-500 rounded-full mr-2 inline-block"></span>
                  Ghi chú
                </h3>
                <div className="bg-white/50 dark:bg-black/10 rounded-lg p-4 whitespace-pre-wrap shadow-inner border border-muted/30">
                  {trade.notes}
                </div>
              </div>
            )}
            
            {/* Ảnh chụp màn hình */}
            {trade.screenshots && trade.screenshots.length > 0 && (
              <div className="bg-accent/5 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                  <span className="w-1.5 h-5 bg-indigo-500 rounded-full mr-2 inline-block"></span>
                  Ảnh chụp màn hình
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {trade.screenshots.map((image, index) => (
                    <div 
                      key={index} 
                      className="relative aspect-video rounded-md overflow-hidden border border-muted cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
                      onClick={() => handleImageClick(image, index)}
                    >
                      <img 
                        src={image} 
                        alt={`Screenshot ${index + 1}`} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-black/60 p-2 rounded-full">
                          <ImageIcon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="w-full sm:w-auto px-6">
                Đóng
              </Button>
            </DialogClose>
            <Button 
              onClick={() => router.push(`/edit-trade/${trade.id}`)} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto"
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
