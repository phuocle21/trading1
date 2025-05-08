"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

// User type definition
export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const USER_STORAGE_KEY = 'trading_app_users';
const CURRENT_USER_KEY = 'trading_app_current_user';

// Simple encryption/decryption for password storage
const encryptPassword = (password: string): string => {
  // In a real app, you'd use a proper encryption library
  // This is a simple base64 encoding which is NOT secure for production
  return btoa(password);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize users array from localStorage
  const getUsers = (): Record<string, { email: string; password: string; isAdmin: boolean; createdAt: number; lastLogin: number }> => {
    if (typeof window === 'undefined') return {};
    
    const storedUsers = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUsers) {
      // Initialize with admin user if no users exist
      const adminUser = {
        "admin-uid": {
          email: "mrtinanpha@gmail.com",
          password: encryptPassword("Tin@123"),
          isAdmin: true,
          createdAt: Date.now(),
          lastLogin: Date.now()
        }
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
      return adminUser;
    }
    
    return JSON.parse(storedUsers);
  };

  // Save users to localStorage
  const saveUsers = (users: Record<string, any>) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  };

  // Load current user from localStorage on startup
  useEffect(() => {
    const loadUser = () => {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }
      
      const storedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Generate a unique ID (simplified version)
  const generateUserId = () => {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // User registration
  const signUp = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      // Check if email already exists
      const users = getUsers();
      const userExists = Object.values(users).some(user => user.email === email);
      
      if (userExists) {
        throw new Error("Email already in use");
      }

      // Create new user
      const userId = generateUserId();
      const newUser: User = {
        id: userId,
        email: email,
        isAdmin: false, // Only the predefined admin is admin
        createdAt: Date.now(),
        lastLogin: Date.now()
      };

      // Save the user with password
      users[userId] = {
        email: email,
        password: encryptPassword(password),
        isAdmin: newUser.isAdmin,
        createdAt: newUser.createdAt,
        lastLogin: newUser.lastLogin
      };
      saveUsers(users);

      // Set as current user
      setCurrentUser(newUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

      return newUser;
    } finally {
      setLoading(false);
    }
  };

  // User login
  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const users = getUsers();
      const userEntry = Object.entries(users).find(([_, user]) => user.email === email);

      if (!userEntry || userEntry[1].password !== encryptPassword(password)) {
        throw new Error("Invalid email or password");
      }

      const [userId, userData] = userEntry;
      
      // Update last login
      userData.lastLogin = Date.now();
      users[userId] = userData;
      saveUsers(users);

      // Create user object without password
      const user: User = {
        id: userId,
        email: userData.email,
        isAdmin: userData.isAdmin,
        createdAt: userData.createdAt,
        lastLogin: userData.lastLogin
      };

      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

      return user;
    } finally {
      setLoading(false);
    }
  };

  // User logout
  const signOut = async (): Promise<void> => {
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error("No user is signed in");
    }
    
    const users = getUsers();
    const userId = currentUser.id;
    const userData = users[userId];
    
    if (!userData || userData.password !== encryptPassword(currentPassword)) {
      throw new Error("Current password is incorrect");
    }
    
    userData.password = encryptPassword(newPassword);
    users[userId] = userData;
    saveUsers(users);
  };

  // Reset password (simplified - in a real app, you'd send an email)
  const resetPassword = async (email: string): Promise<void> => {
    const users = getUsers();
    const userFound = Object.values(users).some(user => user.email === email);
    
    if (!userFound) {
      throw new Error("No account found with this email");
    }
    
    // In a real app, send an email with reset instructions
    // For now, just throw a message that would typically be displayed to the user
    throw new Error("If this email exists in our system, password reset instructions have been sent.");
  };

  // Get all users (admin only)
  const getUsersList = async (): Promise<User[]> => {
    if (!currentUser?.isAdmin) {
      throw new Error("Permission denied: Only admins can access user list");
    }

    const users = getUsers();
    return Object.entries(users).map(([id, userData]) => ({
      id,
      email: userData.email,
      isAdmin: userData.isAdmin,
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin
    }));
  };

  // Update user admin status (admin only)
  const updateUserAdmin = async (userId: string, isAdmin: boolean): Promise<void> => {
    if (!currentUser?.isAdmin) {
      throw new Error("Permission denied: Only admins can update user status");
    }

    const users = getUsers();
    if (!users[userId]) {
      throw new Error("User not found");
    }

    // Don't allow changing the original admin's status
    if (users[userId].email === "mrtinanpha@gmail.com") {
      throw new Error("Cannot change status of the primary admin");
    }

    users[userId].isAdmin = isAdmin;
    saveUsers(users);
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
    updateUserAdmin
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