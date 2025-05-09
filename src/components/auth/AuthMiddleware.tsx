"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Routes that don't require authentication
const publicRoutes = ["/auth/login"];

export default function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { currentUser, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip redirect during loading to prevent flashes
    if (loading) return;

    // Check if the current route is a public route
    const isPublicRoute = publicRoutes.some(route => pathname === route);

    // If not logged in and not on a public route, redirect to login
    if (!currentUser && !isPublicRoute) {
      router.push("/auth/login");
    }
  }, [currentUser, loading, pathname, router]);

  // While authenticating, show a simple loading message
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Đang tải...</h2>
          <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  // Kiểm tra nếu người dùng là admin và chưa được phê duyệt, tự động coi như đã được phê duyệt
  // Admin luôn có thể truy cập bất kể trạng thái phê duyệt
  if (currentUser && currentUser.isAdmin) {
    return <>{children}</>;
  }

  // If user is logged in but not approved, show waiting for approval message
  if (currentUser && !currentUser.isApproved && !publicRoutes.some(route => pathname === route)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Chờ phê duyệt</CardTitle>
            <CardDescription>
              Tài khoản của bạn đang chờ được quản trị viên phê duyệt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Cảm ơn bạn đã đăng ký. Tài khoản của bạn hiện đang chờ được phê duyệt trước khi bạn có thể truy cập đầy đủ vào ứng dụng.
            </p>
            <p>
              Vui lòng gửi email tới <span className="text-blue-500 font-medium">mrtinanpha@gmail.com</span> để được cấp quyền truy cập.
            </p>
            <Button 
              className="w-full" 
              onClick={async () => {
                await signOut();
                router.push("/auth/login");
              }}
              variant="outline"
            >
              Đăng xuất
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is logged in or on a public route, render the children
  if ((currentUser && currentUser.isApproved) || publicRoutes.some(route => pathname === route)) {
    return <>{children}</>;
  }

  // Otherwise, render nothing (will redirect via useEffect)
  return null;
}