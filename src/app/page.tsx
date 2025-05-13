"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Chuyển hướng tự động đến trang nhật ký khi trang chủ được tải
    router.push("/journals");
  }, [router]);
  
  // Trang này sẽ không hiển thị gì cả vì đã được chuyển hướng
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Đang chuyển hướng...</p>
    </div>
  );
}
