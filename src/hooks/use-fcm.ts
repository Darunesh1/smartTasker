"use client";

import { useEffect, useState, useCallback } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { app } from '@/lib/firebase';
import { saveFcmToken } from '@/lib/firestore';

export type FcmPermission = 'default' | 'granted' | 'denied';

export function useFcm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<FcmPermission>('default');
  const [isTokenLoading, setIsTokenLoading] = useState(true);

  const checkPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    setIsTokenLoading(false);
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (typeof window === 'undefined' || !app || !user) {
      return;
    }

    const messaging = getMessaging(app);

    const setupFCM = async () => {
      if (Notification.permission === 'granted') {
        setIsTokenLoading(true);
        try {
          const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY });
          if (currentToken) {
            await saveFcmToken(user.uid, currentToken);
            console.log('FCM token saved:', currentToken);
          } else {
            console.log('No registration token available.');
          }
        } catch (error) {
          console.error('An error occurred while retrieving token.', error);
        } finally {
          setIsTokenLoading(false);
        }
      }
    };
    
    setupFCM();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received.', payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [user, toast]);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    setIsTokenLoading(true);
    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted' && user) {
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY });
        if (token) {
          await saveFcmToken(user.uid, token);
          console.log('FCM token saved after permission grant:', token);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
        setIsTokenLoading(false);
    }
  }, [user]);

  return { permission, requestPermission, isTokenLoading };
}
