'use server';
/**
 * @fileOverview A flow to send a test notification to a user.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFcmTokenForUser, sendNotification, getUserNotificationPreference} from '@/lib/fcm-server';

const TestNotificationInputSchema = z.object({
  userId: z.string().describe('The ID of the user to send the notification to.'),
});
export type TestNotificationInput = z.infer<typeof TestNotificationInputSchema>;

export async function sendTestNotification(
  input: TestNotificationInput
): Promise<void> {
  return sendTestNotificationFlow(input);
}

const sendTestNotificationFlow = ai.defineFlow(
  {
    name: 'sendTestNotificationFlow',
    inputSchema: TestNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({userId}) => {
    console.log(`Sending test notification to user ${userId}`);

    const preference = await getUserNotificationPreference(userId);
    if (!preference) {
      console.log(`User ${userId} has not enabled notifications. Aborting.`);
      throw new Error('Notifications are not enabled for this user.');
    }

    const token = await getFcmTokenForUser(userId);
    if (token) {
      await sendNotification(token, {
        title: 'Test Notification',
        body: 'This is a test notification from SmartTasker!',
      });
      console.log(`Test notification sent to user ${userId}`);
    } else {
      console.warn(`No FCM token found for user ${userId}`);
      throw new Error('No FCM token found for this user.');
    }
  }
);
