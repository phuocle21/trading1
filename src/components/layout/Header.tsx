"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, PlusCircle, Bell, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const getPageTitle = (pathname: string): string => {
  if (pathname === "/dashboard") return "Performance Dashboard";
  if (pathname === "/history") return "Trade History";
  if (pathname === "/add-trade") return "Add New Trade";
  if (pathname.startsWith("/edit-trade/")) return "Edit Trade";
  if (pathname === "/playbooks") return "Playbooks";
  return "Trade Insights";
};

export function Header() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const { openMobile, setOpenMobile } = useSidebar();

  const toggleMobileMenu = () => {
    setOpenMobile(!openMobile);
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 sm:h-16 items-center gap-4 border-b bg-background px-3 sm:px-6 shadow-sm">
      <button 
        onClick={toggleMobileMenu}
        className="flex md:hidden items-center justify-center w-9 h-9 rounded-full hover:bg-accent/50 transition-colors relative"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
        <span className={cn(
          "absolute inset-0 rounded-full border-2 border-primary/70 scale-0 transition-transform duration-300",
          openMobile && "scale-100 opacity-100"
        )} />
      </button>
      
      <h1 className="flex-1 text-lg sm:text-xl font-semibold text-foreground truncate">
        {pageTitle}
      </h1>
      
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Notification button - Mobile only shows icon */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium h-4 w-4 flex items-center justify-center rounded-full">2</span>
          <span className="sr-only">Notifications</span>
        </Button>

        {/* Add Trade button - desktop version */}
        {pathname !== "/add-trade" && (
          <Button asChild size="sm" className="hidden sm:flex gap-1">
            <Link href="/add-trade">
              <PlusCircle className="h-4 w-4" />
              Add Trade
            </Link>
          </Button>
        )}
        
        {/* Add Trade button - mobile version (icon only) */}
        {pathname !== "/add-trade" && (
          <Button asChild variant="ghost" size="icon" className="sm:hidden h-9 w-9">
            <Link href="/add-trade">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">Add Trade</span>
            </Link>
          </Button>
        )}

        {/* User avatar */}
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              TN
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}
