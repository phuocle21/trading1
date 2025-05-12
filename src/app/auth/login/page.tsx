"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginMode) {
        await signIn(email, password);
        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng trở lại!",
        });
      } else {
        await signUp(email, password);
        toast({
          title: "Tạo tài khoản thành công",
          description: "Tài khoản của bạn đã được tạo thành công!",
        });
      }
      router.push("/journals"); // Chuyển hướng người dùng đến trang nhật ký thay vì dashboard
    } catch (error) {
      console.error(error);
      toast({
        title: "Xác thực thất bại",
        description: error instanceof Error ? error.message : "Vui lòng kiểm tra thông tin đăng nhập và thử lại.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Yêu cầu email",
        description: "Vui lòng nhập địa chỉ email của bạn.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await signIn(email, "dummy-password").catch(() => {
        // This will likely fail, but we're just checking if the email exists
        toast({
          title: "Hướng dẫn đặt lại mật khẩu",
          description: "Vui lòng liên hệ với quản trị viên để đặt lại mật khẩu.",
        });
      });
    } catch (error) {
      // Do nothing - we expect this to fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4 border border-border shadow-xl dark:shadow-primary/5">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{isLoginMode ? "Đăng nhập" : "Đăng ký"}</CardTitle>
          <CardDescription className="text-center">
            {isLoginMode
              ? "Nhập thông tin đăng nhập để truy cập vào tài khoản của bạn"
              : "Tạo tài khoản mới để bắt đầu"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-background border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Mật khẩu
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
                required
              />
            </div>

            {isLoginMode && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-accent hover:text-accent/80 hover:underline mt-1 block transition-colors"
              >
                Quên mật khẩu?
              </button>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors" 
              disabled={loading}
            >
              {loading
                ? "Đang xử lý..."
                : isLoginMode
                ? "Đăng nhập"
                : "Tạo tài khoản"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 mt-2">
          <div className="w-full h-px bg-border"></div>
          <Button
            variant="ghost"
            className="w-full hover:bg-secondary hover:text-secondary-foreground transition-colors"
            onClick={() => setIsLoginMode(!isLoginMode)}
          >
            {isLoginMode
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}