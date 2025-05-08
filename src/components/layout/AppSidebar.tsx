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
  HelpCircle,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = (t: (key: string) => string) => [
  { href: "/dashboard", label: t('sidebar.dashboard'), icon: LayoutDashboard },
  { href: "/history", label: t('sidebar.tradeHistory'), icon: History },
  { href: "/add-trade", label: t('sidebar.addNewTrade'), icon: PlusCircle },
  { href: "/playbooks", label: t('sidebar.playbooks'), icon: BookOpenText },
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
      <SidebarHeader className="p-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
          <BarChartBig className="h-7 w-7 text-sidebar-primary" />
          <span className="text-xl font-semibold group-data-[collapsible=icon]:hidden">
            {t('app.name')}
          </span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:right-3 group-data-[collapsible=icon]:top-4 hidden md:flex"
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
      <SidebarContent>
        <SidebarMenu>
          {navItems(t).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={item.label}
                className={cn(
                  "justify-start",
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
        
        <div className="mt-4 px-3 pt-4 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
          <h3 className="mb-2 text-xs font-medium text-sidebar-foreground/70 px-2">{t('sidebar.support')}</h3>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t('sidebar.helpDocumentation')}
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">{t('sidebar.helpCenter')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={t('sidebar.settings')}
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Settings className="h-5 w-5" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">{t('sidebar.settings')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/70 text-center">
          &copy; {new Date().getFullYear()} {t('app.name')}
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
