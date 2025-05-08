"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

// Routes that don't require authentication
const publicRoutes = ["/auth/login"];

export default function AuthMiddleware({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
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

  // If user is logged in or on a public route, render the children
  if (currentUser || publicRoutes.some(route => pathname === route)) {
    return <>{children}</>;
  }

  // Otherwise, render nothing (will redirect via useEffect)
  return null;
}