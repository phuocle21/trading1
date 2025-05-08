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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "Trade History", icon: History },
  { href: "/add-trade", label: "Add New Trade", icon: PlusCircle },
  { href: "/playbooks", label: "Playbooks", icon: BookOpenText },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { open, setOpen, state, openMobile, setOpenMobile, isMobile } = useSidebar();
  const mobileCheck = useIsMobile();

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
            Trade Insights
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
            {state === "expanded" ? "Collapse Sidebar" : "Expand Sidebar"}
          </span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
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
          <h3 className="mb-2 text-xs font-medium text-sidebar-foreground/70 px-2">SUPPORT</h3>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Help & Documentation"
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Help Center</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip="Settings"
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Settings className="h-5 w-5" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-sidebar-foreground/70 text-center">
          &copy; {new Date().getFullYear()} Trade Insights
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
