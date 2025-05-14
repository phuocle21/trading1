"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, CheckCircle, XCircle, UserCog, UserX } from "lucide-react";

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, getUsersList, updateUserAdmin, approveUser, deleteUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

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

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
      
      toast({
        title: "Đã xóa người dùng",
        description: "Người dùng và tất cả dữ liệu liên quan đã được xóa thành công.",
        variant: "default",
      });
      setUserToDelete(null);
    } catch (error) {
      console.error(error);
      
      // Kiểm tra lỗi cụ thể và hiển thị thông báo phù hợp
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi.";
      let retryButton = false;
      
      // Nếu lỗi liên quan đến khóa ngoại, thêm nút thử lại
      if (errorMessage.includes("dữ liệu liên kết") || errorMessage.includes("foreign key")) {
        retryButton = true;
      }
      
      toast({
        title: "Không thể xóa người dùng",
        description: (
          <div>
            <p>{errorMessage}</p>
            {retryButton && (
              <Button 
                className="mt-2 bg-amber-500 hover:bg-amber-600" 
                size="sm"
                onClick={() => handleDeleteUser(userId)}
              >
                Thử lại việc xóa
              </Button>
            )}
          </div>
        ),
        variant: "destructive",
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
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
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
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
  
  const renderMobileUserCard = (user: User) => {
    return (
      <Card key={user.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">{user.email}</CardTitle>
            {user.email !== "mrtinanpha@gmail.com" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                    <div>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{user.email}</span>?
                      </AlertDialogDescription>
                      <div className="mt-2 text-red-500 text-sm">Lưu ý: Tất cả dữ liệu của người dùng này sẽ bị xóa, bao gồm:</div>
                      <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                        <li>Nhật ký giao dịch</li>
                        <li>Lịch sử giao dịch</li>
                        <li>Playbooks</li>
                        <li>Các dữ liệu khác</li>
                      </ul>
                      <div className="mt-2 text-sm text-muted-foreground">Hành động này không thể hoàn tác!</div>
                    </div>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Xác nhận xóa
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <CardDescription className="flex justify-between">
            <span>Đăng ký: {new Date(user.createdAt).toLocaleDateString()}</span>
            <span>Đăng nhập: {new Date(user.lastLogin).toLocaleDateString()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2 space-y-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Trạng thái</p>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={`px-3 py-1 flex items-center gap-1 ${user.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                {user.isApproved ? (
                  <>
                    <CheckCircle className="h-3 w-3" />
                    <span>Đã phê duyệt</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3" />
                    <span>Chờ duyệt</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Quyền Admin</p>
            <div className="flex items-center space-x-2">
              <Badge variant={user.isAdmin ? "default" : "outline"} className="px-3 py-1 flex items-center gap-1">
                {user.isAdmin ? (
                  <>
                    <UserCog className="h-3 w-3" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-3 w-3" />
                    <span>Người dùng</span>
                  </>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
        {user.email !== "mrtinanpha@gmail.com" && (
          <CardFooter className="flex flex-row justify-end gap-2 pt-0">
            <Button 
              variant={user.isApproved ? "destructive" : "default"} 
              size="sm"
              className={`flex items-center gap-1 ${!user.isApproved ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
              onClick={() => handleToggleApproval(user.id, user.isApproved)}
            >
              {user.isApproved ? (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Hủy phê duyệt</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Phê duyệt</span>
                </>
              )}
            </Button>
            <Button 
              variant={user.isAdmin ? "destructive" : "outline"} 
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
            >
              {user.isAdmin ? (
                <>
                  <UserX className="h-4 w-4" />
                  <span>Thu hồi quyền</span>
                </>
              ) : (
                <>
                  <UserCog className="h-4 w-4" />
                  <span>Cấp quyền</span>
                </>
              )}
            </Button>
          </CardFooter>
        )}
        {user.email === "mrtinanpha@gmail.com" && (
          <CardFooter className="pt-0">
            <span className="text-sm text-muted-foreground w-full text-center">Admin chính</span>
          </CardFooter>
        )}
      </Card>
    );
  };

  const renderDesktopTable = () => {
    return (
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[250px]">Email</TableHead>
              <TableHead className="w-[120px]">Ngày đăng ký</TableHead>
              <TableHead className="w-[120px]">Đăng nhập gần đây</TableHead>
              <TableHead className="w-[150px]">Trạng thái</TableHead>
              <TableHead className="w-[150px]">Quyền Admin</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={user.isApproved ? "default" : "outline"} className={`px-3 py-1 flex items-center gap-1 ${user.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {user.isApproved ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        <span>Đã phê duyệt</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        <span>Chờ duyệt</span>
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isAdmin ? "default" : "outline"} className="px-3 py-1 flex items-center gap-1">
                    {user.isAdmin ? (
                      <>
                        <UserCog className="h-3 w-3" />
                        <span>Admin</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-3 w-3" />
                        <span>Người dùng</span>
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {user.email === "mrtinanpha@gmail.com" ? (
                    <span className="text-sm text-muted-foreground">Admin chính</span>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant={user.isApproved ? "destructive" : "default"} 
                        size="sm"
                        className={`flex items-center gap-1 ${!user.isApproved ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
                        onClick={() => handleToggleApproval(user.id, user.isApproved)}
                      >                      {user.isApproved ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          <span>Hủy duyệt</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Phê duyệt</span>
                        </>
                      )}
                    </Button>
                    <Button 
                      variant={user.isAdmin ? "destructive" : "outline"} 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                    >
                        {user.isAdmin ? (
                          <>
                            <UserX className="h-4 w-4" />
                            <span>Thu hồi quyền</span>
                          </>
                        ) : (
                          <>
                            <UserCog className="h-4 w-4" />
                            <span>Cấp quyền</span>
                          </>
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <div>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{user.email}</span>?
                              </AlertDialogDescription>
                              <div className="mt-2 text-red-500 text-sm">Lưu ý: Tất cả dữ liệu của người dùng này sẽ bị xóa, bao gồm:</div>
                              <ul className="list-disc pl-5 mt-1 text-sm text-muted-foreground">
                                <li>Nhật ký giao dịch</li>
                                <li>Lịch sử giao dịch</li>
                                <li>Playbooks</li>
                                <li>Các dữ liệu khác</li>
                              </ul>
                              <div className="mt-2 text-sm text-muted-foreground">Hành động này không thể hoàn tác!</div>
                            </div>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteUser(user.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Xác nhận xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Không tìm thấy người dùng nào</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container px-4 sm:px-6 mx-auto max-w-6xl py-6 sm:py-10">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Trang Quản trị</h1>
        <Button 
          onClick={() => router.push("/dashboard")} 
          variant="outline" 
          className="mt-2 sm:mt-0"
        >
          Quay lại Dashboard
        </Button>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-xl">Quản lý người dùng</CardTitle>
          <CardDescription>
            Quản lý tài khoản và quyền của người dùng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? (
            <div className="text-center py-8 flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary/30 rounded-full border-t-primary mb-4"></div>
              <p>Đang tải danh sách người dùng...</p>
            </div>
          ) : (
            <>
              {isMobile ? (
                <div className="space-y-4">
                  {users.map(renderMobileUserCard)}
                  {users.length === 0 && (
                    <p className="text-center py-8">Không tìm thấy người dùng nào</p>
                  )}
                </div>
              ) : (
                renderDesktopTable()
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}