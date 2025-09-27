
"use client";

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { app } from '@/lib/firebase';
import { saveFcmToken, deleteFcmTokenForUser, updateUserNotificationPreference, getUserNotificationPreference } from '@/lib/firestore';

export type FcmPermission = 'default' | 'granted' | 'denied';

// Function to clear the Firebase messaging IndexedDB
async function clearFcmIndexedDb(): Promise<void> {
    console.log("Attempting to clear Firebase Messaging IndexedDB...");
    try {
        const dbDeleteRequest = window.indexedDB.deleteDatabase('firebase-messaging-database');
        
        return new Promise((resolve, reject) => {
            dbDeleteRequest.onsuccess = () => {
                console.log("Successfully cleared Firebase Messaging IndexedDB.");
                resolve();
            };
            dbDeleteRequest.onerror = (event) => {
                console.error("Error clearing Firebase Messaging IndexedDB:", event);
                reject(new Error("Could not clear IndexedDB."));
            };
            dbDeleteRequest.onblocked = () => {
                console.warn("Clearing Firebase Messaging IndexedDB is blocked. Please close other tabs with this app open.");
                reject(new Error("IndexedDB deletion is blocked."));
            };
        });
    } catch (error) {
        console.error("Exception while trying to clear IndexedDB:", error);
        return Promise.reject(error);
    }
}

export function useFcm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<FcmPermission>('default');
  const [isTokenLoading, setIsTokenLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscriptionStatus = useCallback(async () => {
    if (!user) {
        setIsTokenLoading(false);
        return;
    };
    setIsTokenLoading(true);
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const currentPermission = Notification.permission;
        setPermission(currentPermission);

        if (currentPermission === 'granted') {
          const preference = await getUserNotificationPreference(user.uid);
          setIsSubscribed(preference);
        } else {
          setIsSubscribed(false);
          // If permission is not granted, ensure preference is false in DB
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
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Foreground message received.', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => unsubscribeOnMessage();
  }, [user, toast, isSubscribed]);

  // Cleanup token on user logout
  useEffect(() => {
    if (!user) {
      // User logged out, but we don't have the UID to clean up the token.
      // The `unsubscribe` function is the best place to handle this.
      // If a user logs out, the component should unmount and `unsubscribe` should be called if needed.
    }
  }, [user]);
  
  const getFcmToken = useCallback(async (retry = true): Promise<string | null> => {
    try {
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY });
      return token || null;
    } catch (error: any) {
      console.error('An error occurred while retrieving token. ', error);
      // Check for the specific IndexedDB error
      if (retry && (error.code === 'messaging/token-subscribe-failed' || error.code === 'messaging/failed-serviceworker-registration')) {
        console.log("Token retrieval failed, possibly due to corrupted IndexedDB. Clearing and retrying...");
        toast({
            variant: "destructive",
            title: "Notification Error",
            description: "Fixing a temporary issue with notifications. Retrying...",
        });
        await clearFcmIndexedDb();
        return getFcmToken(false); // Retry once
      } else {
        toast({
          variant: 'destructive',
          title: "Could not get notification token",
          description: error.message || 'An unknown error occurred.',
        });
        return null;
      }
    }
  }, [toast]);

  const requestPermissionAndSubscribe = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window) || !user) {
      return;
    }
    setIsTokenLoading(true);
    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        const token = await getFcmToken();
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
        checkSubscriptionStatus();
    }
  }, [user, toast, checkSubscriptionStatus, getFcmToken]);

  const unsubscribe = useCallback(async () => {
     if (!user) return;
     setIsTokenLoading(true);
     try {
        await updateUserNotificationPreference(user.uid, false);
        // This will also trigger deletion from the backend via the firestore function.
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
