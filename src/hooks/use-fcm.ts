"use client";

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/auth-provider';
import { app } from '@/lib/firebase';
import { saveFcmToken } from '@/lib/firestore';

export function useFcm() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !app) {
      return;
    }

    const messaging = getMessaging(app);

    const requestPermission = async () => {
      try {
        await Notification.requestPermission();
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FCM_VAPID_KEY });
        
        if (token && user) {
          await saveFcmToken(user.uid, token);
          console.log('FCM token saved:', token);
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    if(user) {
        requestPermission();
    }

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
}
