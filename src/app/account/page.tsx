"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser, changePassword, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Chưa đăng nhập</CardTitle>
            <CardDescription>
              Vui lòng đăng nhập để truy cập cài đặt tài khoản của bạn.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              Đi đến trang đăng nhập
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Mật khẩu không khớp",
        description: "Mật khẩu mới và xác nhận mật khẩu phải giống nhau.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Mật khẩu quá ngắn",
        description: "Mật khẩu phải có ít nhất 6 ký tự.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({
        title: "Đã cập nhật mật khẩu",
        description: "Mật khẩu của bạn đã được thay đổi thành công.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Không thể cập nhật mật khẩu",
        description: error instanceof Error 
          ? error.message 
          : "Vui lòng kiểm tra mật khẩu hiện tại và thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-6">Tài khoản của tôi</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin tài khoản</CardTitle>
            <CardDescription>
              Chi tiết tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium">Email</div>
                <div>{currentUser.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Loại tài khoản</div>
                <div>{currentUser.isAdmin ? "Quản trị viên" : "Người dùng"}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Tài khoản được tạo</div>
                <div>{new Date(currentUser.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Đăng nhập gần đây</div>
                <div>{new Date(currentUser.lastLogin).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              Đăng xuất
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Đổi mật khẩu</CardTitle>
            <CardDescription>
              Cập nhật mật khẩu của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Mật khẩu hiện tại
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Mật khẩu mới
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Xác nhận mật khẩu mới
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}