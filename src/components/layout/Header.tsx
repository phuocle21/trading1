"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, PlusCircle, Bell, User, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getPageTitle = (pathname: string, t: (key: string) => string): string => {
  if (pathname === "/dashboard") return t('dashboard.title');
  if (pathname === "/history") return t('tradeHistory.title');
  if (pathname === "/add-trade") return t('tradeForm.title.add');
  if (pathname.startsWith("/edit-trade/")) return t('tradeForm.title.edit');
  if (pathname === "/playbooks") return t('playbooks.title');
  if (pathname === "/account") return "Tài khoản của tôi"; // Đã Việt hóa
  if (pathname === "/admin") return "Bảng quản trị"; // Đã Việt hóa
  return t('app.name');
};

export function Header() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { currentUser, signOut } = useAuth();
  const pageTitle = getPageTitle(pathname, t);
  const { openMobile, setOpenMobile } = useSidebar();

  const toggleMobileMenu = () => {
    setOpenMobile(!openMobile);
  };

  // Generate avatar initials from email
  const getInitials = () => {
    if (!currentUser?.email) return "?";
    return currentUser.email
      .split('@')[0]
      .split(/[^a-zA-Z]/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/auth/login";
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
        {/* Đã loại bỏ Language Selector */}

        {/* Notification button - Mobile only shows icon */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium h-4 w-4 flex items-center justify-center rounded-full">2</span>
          <span className="sr-only">Thông báo</span>
        </Button>

        {/* Add Trade button - desktop version */}
        {pathname !== "/add-trade" && (
          <Button asChild size="sm" className="hidden sm:flex gap-1">
            <Link href="/add-trade">
              <PlusCircle className="h-4 w-4" />
              {t('button.addTrade')}
            </Link>
          </Button>
        )}
        
        {/* Add Trade button - mobile version (icon only) */}
        {pathname !== "/add-trade" && (
          <Button asChild variant="ghost" size="icon" className="sm:hidden h-9 w-9">
            <Link href="/add-trade">
              <PlusCircle className="h-5 w-5" />
              <span className="sr-only">{t('button.addTrade')}</span>
            </Link>
          </Button>
        )}

        {/* User avatar and dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {currentUser ? getInitials() : "?"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {currentUser ? (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{currentUser.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentUser.isAdmin ? "Quản trị viên" : "Người dùng"}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer flex w-full">
                    <User className="mr-2 h-4 w-4" />
                    Tài khoản của tôi
                  </Link>
                </DropdownMenuItem>
                {currentUser.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer flex w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      Bảng quản trị
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/auth/login" className="cursor-pointer flex w-full">
                  <User className="mr-2 h-4 w-4" />
                  Đăng nhập
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
