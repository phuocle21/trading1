import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
  valueClassName?: string;
}

export function StatCard({ title, value, icon: Icon, isLoading, valueClassName }: StatCardProps) {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-3/4 sm:h-8" />
        ) : (
          <div className={`text-xl sm:text-2xl font-bold ${valueClassName || 'text-foreground'}`}>
            {value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

