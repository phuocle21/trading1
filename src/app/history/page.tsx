"use client";

import { TradeHistoryTable } from '@/components/trade/TradeHistoryTable';
import { JournalHeader } from '@/components/ui/journal-header';
import { HistoryIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HistoryPage() {
  const { t } = useLanguage();
  
  return (
    <div className="w-full overflow-hidden px-2 sm:px-4 md:px-6">
      <JournalHeader 
        title={t('tradeHistory.title') || "Lịch sử giao dịch"}
        description={t('tradeHistory.description') || "Xem và quản lý tất cả giao dịch của bạn"}
        icon={<HistoryIcon className="h-6 w-6 text-primary" />}
      />
      <div className="w-full overflow-hidden mt-4">
        <TradeHistoryTable />
      </div>
    </div>
  );
}
