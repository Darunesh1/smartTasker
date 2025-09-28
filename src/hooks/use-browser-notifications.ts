'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { onTasksSnapshot, updateUserNotificationPreference, getUserNotificationPreference } from '@/lib/firestore';
import type { Task } from '@/types/task';

export type NotificationPermission = 'default' | 'granted' | 'denied';

// Store scheduled notification timers
const scheduledNotifications = new Map<string, number>();

function scheduleNotification(task: Task) {
    // Clear any existing notification for this task
    clearScheduledNotification(task.id);

    const dueDate = task.dueDate.toDate();
    const now = new Date();
    const timeToDue = dueDate.getTime() - now.getTime();

    // Only schedule for future, non-completed tasks
    if (timeToDue > 0 && !task.completed) {
        const timeoutId = window.setTimeout(() => {
            new Notification(`Task Reminder: ${task.title}`, {
                body: `Your task is due now.`,
                tag: task.id, // Use task ID as tag to prevent duplicates if scheduled multiple times
            });
            scheduledNotifications.delete(task.id);
        }, timeToDue);

        scheduledNotifications.set(task.id, timeoutId);
    }
}

function clearScheduledNotification(taskId: string) {
    if (scheduledNotifications.has(taskId)) {
        clearTimeout(scheduledNotifications.get(taskId));
        scheduledNotifications.delete(taskId);
    }
}

export function useBrowserNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tasksRef = useRef<Task[]>([]);

  const updateSubscriptionStatus = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
        if ('Notification' in window) {
            const currentPermission = Notification.permission;
            setPermission(currentPermission);

            if (currentPermission === 'granted') {
                const preference = await getUserNotificationPreference(user.uid);
                setIsSubscribed(preference);
            } else {
                setIsSubscribed(false);
                await updateUserNotificationPreference(user.uid, false);
            }
        }
    } catch (error) {
        console.error("Error checking subscription status:", error);
        setIsSubscribed(false);
    } finally {
        setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    updateSubscriptionStatus();
  }, [updateSubscriptionStatus]);

  const scheduleAllTaskNotifications = useCallback(() => {
    if (isSubscribed) {
      tasksRef.current.forEach(scheduleNotification);
    }
  }, [isSubscribed]);

  const clearAllTaskNotifications = () => {
    tasksRef.current.forEach(task => clearScheduledNotification(task.id));
  };
  
  // Listen to task changes to schedule/unschedule notifications
  useEffect(() => {
    if (user) {
      const unsubscribe = onTasksSnapshot(user.uid, (newTasks) => {
        tasksRef.current = newTasks;
        if (isSubscribed) {
          // Re-schedule all notifications on task changes
          clearAllTaskNotifications();
          scheduleAllTaskNotifications();
        }
      });
      return () => unsubscribe();
    }
  }, [user, isSubscribed, scheduleAllTaskNotifications]);

  // Handle subscription changes
  useEffect(() => {
      if (isSubscribed) {
          scheduleAllTaskNotifications();
      } else {
          clearAllTaskNotifications();
      }
      return () => clearAllTaskNotifications();
  }, [isSubscribed, scheduleAllTaskNotifications]);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission === 'granted') {
            if (user) {
                await updateUserNotificationPreference(user.uid, true);
                setIsSubscribed(true);
                toast({ title: "Notifications Enabled", description: "Reminders will be scheduled for your tasks." });
            }
        } else {
            toast({ variant: 'destructive', title: "Permission Denied", description: "You will not receive notifications." });
        }
    } catch (error) {
        console.error("Error requesting notification permission:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  const toggleSubscription = useCallback(async (enabled: boolean) => {
    if (!user || permission !== 'granted') return;
    setIsLoading(true);
    try {
        await updateUserNotificationPreference(user.uid, enabled);
        setIsSubscribed(enabled);
        if (enabled) {
            toast({ title: "Notifications Enabled", description: "Task reminders will now be shown." });
        } else {
            toast({ title: "Notifications Disabled", description: "Task reminders will not be shown." });
        }
    } catch (error) {
        console.error("Error updating subscription preference:", error);
    } finally {
        setIsLoading(false);
    }
  }, [user, permission, toast]);


  return { permission, isSubscribed, isLoading, requestPermission, toggleSubscription };
}
