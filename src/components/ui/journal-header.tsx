// src/components/ui/journal-header.tsx
"use client";

import { useJournals } from "@/contexts/JournalContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface JournalHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  showManageButton?: boolean;
}

export function JournalHeader({
  title,
  description,
  icon,
  showManageButton = true
}: JournalHeaderProps) {
  const { getCurrentJournal } = useJournals();
  const { t } = useLanguage();
  const currentJournal = getCurrentJournal();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      <div>
        <div className="flex items-center gap-2 mb-1 sm:mb-0">
          {icon}
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {title}
          </h1>
        </div>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        {currentJournal && (
          <Badge 
            variant="outline" 
            className="px-3 py-1 flex items-center gap-1.5 text-sm w-full sm:w-auto justify-center sm:justify-start"
            style={{
              backgroundColor: `${currentJournal.color}10`,
              borderColor: `${currentJournal.color}30`,
              color: currentJournal.color
            }}
          >
            <span className="font-normal">Đang sử dụng:</span>
            <span className="font-medium">{currentJournal.name}</span>
          </Badge>
        )}
        {showManageButton && (
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Link href="/journals">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">{t('dashboard.manageJournals')}</span>
              <span className="sm:hidden">Quản lý nhật ký</span>
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}