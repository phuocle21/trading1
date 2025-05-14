"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// User type definition
export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: number;
  lastLogin: number;
}

// Authentication context type
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  getUsersList: () => Promise<User[]>;
  updateUserAdmin: (userId: string, isAdmin: boolean) => Promise<void>;
  approveUser: (userId: string, isApproved: boolean) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current user from server on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Thử tải thông tin người dùng từ API
        const response = await fetch('/api/user?path=current');
        
        // Kiểm tra xem server có trả về lỗi không
        if (!response.ok) {
          console.error(`Failed to load current user: Server responded with status ${response.status}`);
          setLoading(false);
          return;
        }
        
        // Kiểm tra content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Failed to load current user: Response is not JSON');
          console.error('Content-Type:', contentType);
          // Hiển thị nội dung phản hồi để gỡ lỗi
          try {
            const textResponse = await response.text();
            console.error('Response content:', textResponse);
          } catch (error) {
            console.error('Could not read response text:', error);
          }
          setLoading(false);
          return;
        }
        
        // Phân tích JSON
        try {
          const data = await response.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        } catch (jsonError) {
          console.error('Failed to parse JSON response:', jsonError);
        }
      } catch (error) {
        console.error("Failed to load current user:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // User registration
  const signUp = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      console.log(`Attempting to sign up user: ${email}`);
      
      // Sửa đường dẫn API
      const response = await fetch('/api/user?path=signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      // Kiểm tra content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`API returned non-JSON response: ${contentType}`);
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error("Server error: Received HTML instead of JSON. Please check server logs.");
      }

      if (!response.ok) {
        let errorMessage = "Failed to sign up";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        throw new Error("Invalid response from server. Please try again later.");
      }
      
      if (!data.user) {
        console.error("No user data in response:", data);
        throw new Error("Invalid response format from server");
      }
      
      console.log(`User signed up successfully: ${data.user.email}`);
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // User login
  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      console.log(`Attempting to sign in user: ${email}`);
      
      // Thay đổi đường dẫn từ /api/user/signin thành /api/user với path=signin
      const response = await fetch('/api/user?path=signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      // Kiểm tra content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`API returned non-JSON response: ${contentType}`);
        // Lấy và log nội dung text để debug
        const text = await response.text();
        console.error('Response text:', text);
        throw new Error("Server error: Received HTML instead of JSON. Please check server logs.");
      }

      if (!response.ok) {
        let errorMessage = "Invalid email or password";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          console.error("Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Failed to parse JSON response:", error);
        throw new Error("Invalid response from server. Please try again later.");
      }
      
      if (!data.user) {
        console.error("No user data in response:", data);
        throw new Error("Invalid response format from server");
      }
      
      console.log(`User signed in successfully: ${data.user.email}`);
      setCurrentUser(data.user);
      return data.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // User logout
  const signOut = async (): Promise<void> => {
    try {
      // Sửa đường dẫn API
      await fetch('/api/user?path=signout', {
        method: 'POST'
      });
      setCurrentUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error("No user is signed in");
    }
    
    // Sửa đường dẫn API
    const response = await fetch('/api/user?path=change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        currentPassword, 
        newPassword 
      })
    });

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType}`);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error("Server error: Received HTML instead of JSON.");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to change password");
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    // Sửa đường dẫn API
    const response = await fetch('/api/user?path=reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType}`);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error("Server error: Received HTML instead of JSON.");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to reset password");
    }
    
    // In a real app, an email would be sent with reset instructions
    throw new Error("If this email exists in our system, password reset instructions have been sent.");
  };

  // Get all users (admin only)
  const getUsersList = async (): Promise<User[]> => {
    if (!currentUser?.isAdmin) {
      throw new Error("Permission denied: Only admins can access user list");
    }

    // Sửa đường dẫn API
    const response = await fetch('/api/user?path=list');
    
    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType}`);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error("Server error: Received HTML instead of JSON.");
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get users list");
    }

    const data = await response.json();
    return data.users;
  };

  // Update user admin status (admin only)
  const updateUserAdmin = async (userId: string, isAdmin: boolean): Promise<void> => {
    if (!currentUser?.isAdmin) {
      throw new Error("Permission denied: Only admins can update user status");
    }

    // Sửa đường dẫn API
    const response = await fetch('/api/user?path=update-admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, isAdmin })
    });

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType}`);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error("Server error: Received HTML instead of JSON.");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update user admin status");
    }
  };

  // Approve user (admin only)
  const approveUser = async (userId: string, isApproved: boolean): Promise<void> => {
    if (!currentUser?.isAdmin) {
      throw new Error("Permission denied: Only admins can approve users");
    }

    // Sửa đường dẫn API
    const response = await fetch('/api/user?path=approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, isApproved })
    });

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType}`);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error("Server error: Received HTML instead of JSON.");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to approve user");
    }
  };

  // Delete user (admin only)
  const deleteUser = async (userId: string): Promise<void> => {
    if (!currentUser?.isAdmin) {
      throw new Error("Permission denied: Only admins can delete users");
    }

    const response = await fetch('/api/user?path=delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`API returned non-JSON response: ${contentType}`);
      const text = await response.text();
      console.error('Response text:', text);
      throw new Error("Server error: Received HTML instead of JSON.");
    }

    if (!response.ok) {
      const error = await response.json();
      console.error("Error deleting user:", error);
      
      // Kiểm tra chi tiết lỗi để hiển thị thông báo phù hợp
      if (error.details && (
        error.details.includes("foreign key constraint") ||
        error.details.includes("still referenced")
      )) {
        throw new Error("Không thể xóa người dùng vì vẫn còn dữ liệu liên quan. Vui lòng thử lại.");
      }
      
      throw new Error(error.error || "Failed to delete user");
    }
  };

  const value = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    changePassword,
    resetPassword,
    getUsersList,
    updateUserAdmin,
    approveUser,
    deleteUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}