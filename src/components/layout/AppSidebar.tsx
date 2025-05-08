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
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen
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
      <SidebarHeader className="px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <BarChartBig className="h-7 w-7 text-sidebar-primary" />
          <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
            {t('app.name')}
          </span>
        </Link>
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
                      : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto"
                  )}
                  onClick={() => handleMenuItemClick(item.href)}
                >
                  <item.icon className="h-5 w-5 group-data-[collapsible=icon]:mx-auto" />
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
                      : "bg-sidebar-accent/10 hover:bg-sidebar-accent/20",
                    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mx-auto"
                  )}
                  onClick={() => handleMenuItemClick(item.href)}
                >
                  <item.icon className="h-5 w-5 group-data-[collapsible=icon]:mx-auto" />
                  <span className="group-data-[collapsible=icon]:hidden ml-2 font-medium">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="flex flex-col gap-3 p-3 border-t border-sidebar-border group-data-[collapsible=icon]:p-2">
        <Button 
          variant="ghost" 
          className={cn(
            "hidden md:flex w-full justify-between items-center px-3 py-2 rounded-md border border-sidebar-border/50",
            "hover:bg-sidebar-accent/15 hover:border-sidebar-accent/40 transition-all",
            "text-sidebar-foreground/80 hover:text-sidebar-foreground",
            "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          )}
          onClick={() => setOpen(!open)}
        >
          {state === "expanded" ? (
            <>
              <PanelLeftClose className="h-4 w-4 mr-2" />
              <span className="text-sm">{t('sidebar.collapseSidebar')}</span>
              <ChevronLeft className="h-4 w-4 ml-auto" />
            </>
          ) : (
            <div className="mx-auto flex items-center justify-center">
              <PanelLeftOpen className="h-4 w-4" />
            </div>
          )}
        </Button>
        
        <p className="text-xs text-sidebar-foreground/70 text-center">
          &copy; {new Date().getFullYear()} {t('app.name')}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
