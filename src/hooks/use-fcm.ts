"use client";

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { app } from '@/lib/firebase';
import { saveFcmToken, deleteFcmToken, updateUserNotificationPreference, getUserNotificationPreference } from '@/lib/firestore';

export type FcmPermission = 'default' | 'granted' | 'denied';

export function useFcm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<FcmPermission>('default');
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) return;
    setIsTokenLoading(true);
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        if (currentPermission === 'granted') {
          const preference = await getUserNotificationPreference(user.uid);
          setIsSubscribed(preference);

          // If preference is true, ensure token exists
          if (preference) {
             const messaging = getMessaging(app);
             const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY });
             if (currentToken) {
                await saveFcmToken(user.uid, currentToken);
             } else {
                // This might happen if token was deleted from browser but preference is still true
                await updateUserNotificationPreference(user.uid, false);
                setIsSubscribed(false);
             }
          }
        } else {
          setIsSubscribed(false);
          // If permission is not granted, ensure preference is false
          await updateUserNotificationPreference(user.uid, false);
        }
      }
    } catch (error) {
        console.error("Error checking subscription status:", error);
        setIsSubscribed(false);
    } finally {
        setIsTokenLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);
  
  // Listen for changes in notification permission
  useEffect(() => {
    if (typeof window === 'undefined' || !('permissions' in navigator)) {
        return;
    }
    
    const permissionName = 'notifications' as PermissionName;
    const permissions = navigator.permissions;
    if (!permissions) return;
    
    permissions.query({ name: permissionName }).then((status) => {
        const handlePermissionChange = () => {
            setPermission(status.state);
            checkSubscriptionStatus();
        }
        status.onchange = handlePermissionChange;
        return () => {
            status.onchange = null;
        }
    });
  }, [checkSubscriptionStatus]);


  // Handle foreground messages
  useEffect(() => {
    if (typeof window === 'undefined' || !app || !user || !isSubscribed) {
      return;
    }
    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received.', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => unsubscribe();
  }, [user, toast, isSubscribed]);

  const requestPermissionAndSubscribe = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || !user) {
      return;
    }
    setIsTokenLoading(true);
    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY });
        if (token) {
          await saveFcmToken(user.uid, token);
          await updateUserNotificationPreference(user.uid, true);
          setIsSubscribed(true);
          console.log('FCM token saved and user subscribed:', token);
          toast({ title: "Notifications Enabled", description: "You will now receive task reminders." });
        }
      } else {
        await updateUserNotificationPreference(user.uid, false);
        setIsSubscribed(false);
        toast({ variant: 'destructive', title: "Permission Denied", description: "You will not receive notifications." });
      }
    } catch (error) {
      console.error('Error requesting permission or subscribing:', error);
      toast({ variant: 'destructive', title: "Error", description: "Could not enable notifications." });
    } finally {
        setIsTokenLoading(false);
        checkSubscriptionStatus(); // re-check state
    }
  }, [user, toast, checkSubscriptionStatus]);

  const unsubscribe = useCallback(async () => {
     if (!user) return;
     setIsTokenLoading(true);
     try {
        const messaging = getMessaging(app);
        // We don't need to get the token here, just update the preference
        await updateUserNotificationPreference(user.uid, false);
        setIsSubscribed(false);
        console.log('User unsubscribed.');
        toast({ title: "Notifications Disabled", description: "You will no longer receive task reminders." });
     } catch (error) {
        console.error('Error unsubscribing:', error);
        toast({ variant: 'destructive', title: "Error", description: "Could not disable notifications." });
     } finally {
        setIsTokenLoading(false);
     }
  }, [user, toast]);

  return { permission, isTokenLoading, isSubscribed, requestPermissionAndSubscribe, unsubscribe };
}
