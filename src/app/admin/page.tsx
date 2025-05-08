"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, getUsersList, updateUserAdmin, approveUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (currentUser?.isAdmin) {
          const usersList = await getUsersList();
          setUsers(usersList);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Không thể tải danh sách người dùng",
          description: error instanceof Error ? error.message : "Đã xảy ra lỗi.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser, getUsersList, toast]);

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      await updateUserAdmin(userId, !isCurrentlyAdmin);
      
      // Update local state after successful API call
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin: !isCurrentlyAdmin } : user
      ));
      
      toast({
        title: "Đã cập nhật người dùng",
        description: `Trạng thái quản trị viên của người dùng đã được ${!isCurrentlyAdmin ? "cấp" : "thu hồi"}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Không thể cập nhật người dùng",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi.",
        variant: "destructive",
      });
    }
  };

  const handleToggleApproval = async (userId: string, isCurrentlyApproved: boolean) => {
    try {
      await approveUser(userId, !isCurrentlyApproved);
      
      // Update local state after successful API call
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isApproved: !isCurrentlyApproved } : user
      ));
      
      toast({
        title: "Đã cập nhật trạng thái phê duyệt",
        description: `Người dùng đã được ${!isCurrentlyApproved ? "phê duyệt" : "hủy phê duyệt"}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Không thể cập nhật trạng thái phê duyệt",
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi.",
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Chưa đăng nhập</CardTitle>
            <CardDescription>
              Vui lòng đăng nhập để truy cập trang quản trị.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/auth/login")}>
              Đi đến trang đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>Từ chối truy cập</CardTitle>
            <CardDescription>
              Bạn không có quyền truy cập trang quản trị.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              Quay lại Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-6">Trang Quản trị</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Quản lý người dùng</CardTitle>
          <CardDescription>
            Quản lý tài khoản và quyền của người dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải danh sách người dùng...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Đăng nhập gần đây</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Quyền Admin</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={user.isApproved} 
                          onCheckedChange={() => handleToggleApproval(user.id, user.isApproved)}
                          disabled={user.email === "mrtinanpha@gmail.com"}
                        />
                        {user.isApproved ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Đã phê duyệt
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            Chờ duyệt
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={user.isAdmin} 
                          onCheckedChange={() => handleToggleAdmin(user.id, user.isAdmin)}
                          disabled={user.email === "mrtinanpha@gmail.com"}
                        />
                        <span>{user.isAdmin ? "Admin" : "Người dùng"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.email === "mrtinanpha@gmail.com" ? (
                        <span className="text-sm text-muted-foreground">Admin chính</span>
                      ) : (
                        <div className="flex flex-col space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleApproval(user.id, user.isApproved)}
                          >
                            {user.isApproved ? "Hủy phê duyệt" : "Phê duyệt"}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                          >
                            {user.isAdmin ? "Thu hồi quyền Admin" : "Cấp quyền Admin"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Không tìm thấy người dùng nào</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}