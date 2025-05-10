// components/ui/theme-toggle-button.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Hiển thị component chỉ khi đã chạy ở phía client
  // Tránh hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Button 
      variant="ghost" 
      className={cn(
        "w-full flex justify-between items-center px-3 py-2 rounded-md border border-sidebar-border/50",
        "hover:bg-sidebar-accent/15 hover:border-sidebar-accent/40 transition-all",
        "text-sidebar-foreground/80 hover:text-sidebar-foreground",
        "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
      )}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          <span className="text-sm group-data-[collapsible=icon]:hidden">Chế độ sáng</span>
          <div className="ml-auto group-data-[collapsible=icon]:hidden">
            <div className="w-8 h-4 bg-sidebar-accent/30 rounded-full relative">
              <div className="absolute h-3 w-3 rounded-full bg-sidebar-foreground left-4 top-0.5 transition-all"></div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          <span className="text-sm group-data-[collapsible=icon]:hidden">Chế độ tối</span>
          <div className="ml-auto group-data-[collapsible=icon]:hidden">
            <div className="w-8 h-4 bg-sidebar-accent/30 rounded-full relative">
              <div className="absolute h-3 w-3 rounded-full bg-sidebar-foreground left-1 top-0.5 transition-all"></div>
            </div>
          </div>
        </>
      )}
    </Button>
  );
}