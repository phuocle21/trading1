"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';
// Sử dụng định nghĩa Playbook từ types/index.ts thay vì định nghĩa lại
import { Playbook } from '@/types';

// Define the context interface
interface PlaybookContextType {
  playbooks: Playbook[];
  loading: boolean;
  error: string | null;
  fetchPlaybooks: () => Promise<void>;
  addPlaybook: (playbook: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Playbook | null>;
  updatePlaybook: (playbook: Playbook) => Promise<Playbook | null>;
  deletePlaybook: (id: string) => Promise<boolean>;
  getPlaybookById: (id: string) => Playbook | undefined;
  isAuthReady: boolean;
}

// Create the context
const PlaybookContext = createContext<PlaybookContextType | undefined>(undefined);

// Create a provider component
export function PlaybookProvider({ children }: { children: ReactNode }) {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useLanguage();
  const { currentUser: user, loading: authLoading } = useAuth();
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Đợi cho quá trình xác thực hoàn tất
  useEffect(() => {
    if (!authLoading) {
      setIsAuthReady(true);
      if (user) {
        console.log("Auth ready, user ID:", user.id);
      } else {
        console.log("Auth ready, no user logged in");
      }
    }
  }, [authLoading, user]);

  // Fetch all playbooks for the current user
  const fetchPlaybooks = async () => {
    if (authLoading) {
      console.log("Auth loading, delaying fetchPlaybooks");
      return; // Đợi cho đến khi trạng thái xác thực được xác định
    }

    if (!user?.id) {
      console.log("No user found, clearing playbooks");
      setPlaybooks([]);
      setLoading(false);
      return;
    }

    console.log("Fetching playbooks for user ID:", user.id);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/playbooks?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      setPlaybooks(data.playbooks || []);
      console.log("Playbooks fetched successfully:", data.playbooks?.length || 0);
    } catch (err) {
      console.error('Failed to fetch playbooks:', err);
      setError('Failed to fetch playbooks');
    } finally {
      setLoading(false);
    }
  };

  // Add a new playbook
  const addPlaybook = async (playbookData: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (authLoading) {
      console.log("Auth still loading, can't add playbook yet");
      toast({
        title: t('error'),
        description: t('errors.waitingForAuth'),
        variant: 'destructive',
      });
      return null;
    }

    if (!user?.id) {
      console.log("No user ID found when trying to add playbook");
      toast({
        title: t('error'),
        description: t('errors.notLoggedIn'),
        variant: 'destructive',
      });
      return null;
    }

    console.log("Adding playbook for user ID:", user.id);
    try {
      const response = await fetch('/api/playbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          playbook: playbookData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      const newPlaybook = data.playbook;
      
      setPlaybooks(prevPlaybooks => [...prevPlaybooks, newPlaybook]);
      
      toast({
        title: t('playbooks.playbookCreated'),
        description: t('playbooks.playbookCreatedDesc').replace('{name}', newPlaybook.name),
      });
      
      console.log("Playbook added successfully:", newPlaybook.id);
      return newPlaybook;
    } catch (err) {
      console.error('Failed to add playbook:', err);
      toast({
        title: t('error'),
        description: t('errors.failedToCreatePlaybook'),
        variant: 'destructive',
      });
      return null;
    }
  };

  // Update an existing playbook
  const updatePlaybook = async (playbook: Playbook) => {
    if (authLoading) {
      toast({
        title: t('error'),
        description: t('errors.waitingForAuth'),
        variant: 'destructive',
      });
      return null;
    }

    if (!user?.id) {
      toast({
        title: t('error'),
        description: t('errors.notLoggedIn'),
        variant: 'destructive',
      });
      return null;
    }

    try {
      const response = await fetch('/api/playbooks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          playbook
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const updatedPlaybook = data.playbook;
      
      setPlaybooks(prevPlaybooks => 
        prevPlaybooks.map(p => p.id === updatedPlaybook.id ? updatedPlaybook : p)
      );
      
      toast({
        title: t('playbooks.playbookUpdated'),
        description: t('playbooks.playbookUpdatedDesc').replace('{name}', updatedPlaybook.name),
      });
      
      return updatedPlaybook;
    } catch (err) {
      console.error('Failed to update playbook:', err);
      toast({
        title: t('error'),
        description: t('errors.failedToUpdatePlaybook'),
        variant: 'destructive',
      });
      return null;
    }
  };

  // Delete a playbook
  const deletePlaybook = async (id: string) => {
    if (authLoading) {
      toast({
        title: t('error'),
        description: t('errors.waitingForAuth'),
        variant: 'destructive',
      });
      return false;
    }

    if (!user?.id) {
      toast({
        title: t('error'),
        description: t('errors.notLoggedIn'),
        variant: 'destructive',
      });
      return false;
    }

    try {
      const response = await fetch(`/api/playbooks?userId=${user.id}&playbookId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      setPlaybooks(prevPlaybooks => prevPlaybooks.filter(p => p.id !== id));
      
      toast({
        title: t('playbooks.playbookDeleted'),
        description: t('playbooks.playbookDeletedDesc'),
      });
      
      return true;
    } catch (err) {
      console.error('Failed to delete playbook:', err);
      toast({
        title: t('error'),
        description: t('errors.failedToDeletePlaybook'),
        variant: 'destructive',
      });
      return false;
    }
  };

  // Get a playbook by ID
  const getPlaybookById = (id: string) => {
    return playbooks.find(playbook => playbook.id === id);
  };

  // Fetch playbooks on mount and when user changes
  useEffect(() => {
    if (isAuthReady) {
      console.log("Auth is ready, fetching playbooks");
      fetchPlaybooks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, user?.id]); // Re-run when auth is ready or user changes

  // Create the context value
  const contextValue: PlaybookContextType = {
    playbooks,
    loading,
    error,
    fetchPlaybooks,
    addPlaybook,
    updatePlaybook,
    deletePlaybook,
    getPlaybookById,
    isAuthReady
  };

  return (
    <PlaybookContext.Provider value={contextValue}>
      {children}
    </PlaybookContext.Provider>
  );
}

// Custom hook to use the Playbook context
export function usePlaybooks() {
  const context = useContext(PlaybookContext);
  if (context === undefined) {
    throw new Error('usePlaybooks must be used within a PlaybookProvider');
  }
  return context;
}