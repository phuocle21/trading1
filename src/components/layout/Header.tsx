"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Performance Dashboard";
  if (pathname === "/history") return "Trade History";
  if (pathname === "/add-trade") return "Add New Trade";
  if (pathname.startsWith("/edit-trade/")) return "Edit Trade";
  return "Trade Insights";
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 shadow-sm">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="flex-1 text-xl md:text-2xl font-semibold text-foreground">
        {pageTitle}
      </h1>
      {pathname !== "/add-trade" && (
         <Button asChild size="sm" className="ml-auto gap-1">
           <Link href="/add-trade">
             <PlusCircle className="h-4 w-4" />
             Add Trade
           </Link>
         </Button>
      )}
    </header>
  );
}
