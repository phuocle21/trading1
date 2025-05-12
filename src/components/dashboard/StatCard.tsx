import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: LucideIcon;
  isLoading?: boolean;
  valueClassName?: string;
  variant?: 'default' | 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo' | 'pink' | 'orange';
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  isLoading, 
  valueClassName,
  variant = 'default',
  className,
  ...props
}: StatCardProps) {
  const colorVariants = {
    default: {
      border: 'border-l-primary dark:border-l-primary',
      header: 'from-primary-50/70 to-transparent dark:from-primary-950/30',
      title: 'text-primary-700 dark:text-primary-400',
      icon: 'text-primary'
    },
    blue: {
      border: 'border-l-blue-500 dark:border-l-blue-600',
      header: 'from-blue-50/70 to-transparent dark:from-blue-950/30',
      title: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-500 dark:text-blue-400'
    },
    green: {
      border: 'border-l-green-500 dark:border-l-green-600',
      header: 'from-green-50/70 to-transparent dark:from-green-950/30',
      title: 'text-green-700 dark:text-green-400',
      icon: 'text-green-500 dark:text-green-400'
    },
    purple: {
      border: 'border-l-purple-500 dark:border-l-purple-600',
      header: 'from-purple-50/70 to-transparent dark:from-purple-950/30',
      title: 'text-purple-700 dark:text-purple-400',
      icon: 'text-purple-500 dark:text-purple-400'
    },
    amber: {
      border: 'border-l-amber-500 dark:border-l-amber-600',
      header: 'from-amber-50/70 to-transparent dark:from-amber-950/30',
      title: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-500 dark:text-amber-400'
    },
    red: {
      border: 'border-l-red-500 dark:border-l-red-600',
      header: 'from-red-50/70 to-transparent dark:from-red-950/30',
      title: 'text-red-700 dark:text-red-400',
      icon: 'text-red-500 dark:text-red-400'
    },
    indigo: {
      border: 'border-l-indigo-500 dark:border-l-indigo-600',
      header: 'from-indigo-50/70 to-transparent dark:from-indigo-950/30',
      title: 'text-indigo-700 dark:text-indigo-400',
      icon: 'text-indigo-500 dark:text-indigo-400'
    },
    pink: {
      border: 'border-l-pink-500 dark:border-l-pink-600',
      header: 'from-pink-50/70 to-transparent dark:from-pink-950/30',
      title: 'text-pink-700 dark:text-pink-400',
      icon: 'text-pink-500 dark:text-pink-400'
    },
    orange: {
      border: 'border-l-orange-500 dark:border-l-orange-600',
      header: 'from-orange-50/70 to-transparent dark:from-orange-950/30',
      title: 'text-orange-700 dark:text-orange-400',
      icon: 'text-orange-500 dark:text-orange-400'
    }
  };

  const variantStyles = colorVariants[variant];

  return (
    <Card 
      className={cn(
        "shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4", 
        variantStyles.border,
        className
      )}
      {...props}
    >
      <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r ${variantStyles.header}`}>
        <CardTitle className={`text-xs sm:text-sm font-medium ${variantStyles.title}`}>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${variantStyles.icon}`} />
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

