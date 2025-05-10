"use client";

import { TradeForm } from '@/components/trade/TradeForm';
import { JournalHeader } from '@/components/ui/journal-header';
import { PlusCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AddTradePage() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
      <JournalHeader 
        title="Thêm giao dịch mới"
        description="Tạo giao dịch mới cho nhật ký của bạn"
        icon={<PlusCircle className="h-6 w-6 text-primary" />}
      />
      <TradeForm />
    </div>
  );
}
