'use server';
/**
 * @fileOverview A flow to send a test notification to a user.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFcmTokenForUser, sendNotification} from '@/lib/fcm-server';

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
    const token = await getFcmTokenForUser(userId);
    if (token) {
      await sendNotification(token, {
        title: 'Test Notification',
        body: 'This is a test notification from SmartTasker!',
      });
      console.log(`Test notification sent to user ${userId}`);
    } else {
      console.warn(`No FCM token found for user ${userId}`);
    }
  }
);
