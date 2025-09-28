'use server';
import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App, cert, ServiceAccount } from 'firebase-admin/app';

let adminApp: App;

// Check if we are in a Vercel production environment
const isProduction = process.env.VERCEL_ENV === 'production';

if (!getApps().length) {
  if (isProduction && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    // For production, use service account credentials from environment variables
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    };
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    // For local development, rely on default credentials or application default credentials
    // This assumes you've run `gcloud auth application-default login` or have the service account file path in GOOGLE_APPLICATION_CREDENTIALS
    adminApp = initializeApp();
  }
} else {
  adminApp = getApps()[0];
}

const db = getFirestore(adminApp);
const messaging = getMessaging(adminApp);

export async function getFcmTokenForUser(userId: string): Promise<string | null> {
  const tokensSnapshot = await db.collection('fcmTokens').where('userId', '==', userId).limit(1).get();
  if (tokensSnapshot.empty) {
    return null;
  }
  return tokensSnapshot.docs[0].id;
}

export async function getUserNotificationPreference(userId: string): Promise<boolean> {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
        return userDoc.data()?.notificationsEnabled === true;
    }
    return false; // Default to false if no setting found
}

export async function sendNotification(token: string, payload: { title: string; body: string }) {
  const message = {
    token: token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
  };

  try {
    const response = await messaging.send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
    // Potentially handle token cleanup if it's invalid
    if ((error as any).code === 'messaging/registration-token-not-registered') {
        await db.collection('fcmTokens').doc(token).delete();
        console.log('Removed invalid FCM token:', token);
    }
  }
}
