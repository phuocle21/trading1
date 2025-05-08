"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  History, 
  PlusCircle, 
  BarChartBig, 
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const mainNavItems = (t: (key: string) => string) => [
  { href: "/journals", label: t('sidebar.journals'), icon: BookOpen },
  { href: "/dashboard", label: t('sidebar.dashboard'), icon: LayoutDashboard },
  { href: "/history", label: t('sidebar.tradeHistory'), icon: History },
  { href: "/playbooks", label: t('sidebar.playbooks'), icon: BookOpenText },
];

const actionNavItems = (t: (key: string) => string) => [
  { href: "/add-trade", label: t('sidebar.addNewTrade'), icon: PlusCircle },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen, state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const mobileCheck = useIsMobile();
  const { t } = useLanguage();

  // Handle auto-closing menu on mobile when clicking an item
  const handleMenuItemClick = (href: string) => {
    if (isMobile || mobileCheck) {
      setOpenMobile(false);
    }
    if (pathname !== href) {
      router.push(href);
    }
  };

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile || mobileCheck) {
      setOpenMobile(false);
    }
  }, [pathname, isMobile, mobileCheck, setOpenMobile]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <BarChartBig className="h-7 w-7 text-sidebar-primary" />
          <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
            {t('app.name')}
          </span>
        </Link>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-sidebar-accent/10 border-sidebar-accent/20 hover:bg-sidebar-accent/20 hover:border-sidebar-accent/30 text-sidebar-foreground hidden md:flex"
          onClick={() => setOpen(!open)}
        >
          {state === "expanded" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="sr-only">
            {state === "expanded" ? t('sidebar.collapseSidebar') : t('sidebar.expandSidebar')}
          </span>
        </Button>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-1">
            {t('sidebar.mainNavigation')}
          </SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems(t).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                  tooltip={item.label}
                  className={cn(
                    "justify-start mb-1 font-medium",
                    (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)))
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => handleMenuItemClick(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden ml-2">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />
        
        {/* Quick Actions */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-1">
            {t('sidebar.quickActions')}
          </SidebarGroupLabel>
          <SidebarMenu>
            {actionNavItems(t).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  variant="outline"
                  className={cn(
                    "justify-start mb-1",
                    pathname === item.href
                      ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                      : "bg-sidebar-accent/10 hover:bg-sidebar-accent/20"
                  )}
                  onClick={() => handleMenuItemClick(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden ml-2 font-medium">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3 border-t border-sidebar-border group-data-[collapsible=icon]:p-2">
        <p className="text-xs text-sidebar-foreground/70 text-center">
          &copy; {new Date().getFullYear()} {t('app.name')}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
