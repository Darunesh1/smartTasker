'use server';
/**
 * @fileOverview A flow to send task reminders to users.
 * This flow checks for tasks that are due soon and sends a notification to the user.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {
  getFcmTokenForUser,
  sendNotification,
  getUserNotificationPreference,
} from '@/lib/fcm-server';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {db} from '@/lib/firebase';
import type {Task} from '@/types/task';
import {formatDistanceToNow} from 'date-fns';

export async function sendTaskReminders(): Promise<void> {
  return sendTaskRemindersFlow();
}

const sendTaskRemindersFlow = ai.defineFlow(
  {
    name: 'sendTaskRemindersFlow',
    outputSchema: z.void(),
  },
  async () => {
    console.log('Starting sendTaskRemindersFlow...');

    const now = Timestamp.now();
    const in24Hours = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);

    const tasksRef = collection(db, 'tasks');
    const q = query(
      tasksRef,
      where('completed', '==', false),
      where('reminderSent', '!=', true),
      where('dueDate', '>=', now),
      where('dueDate', '<=', in24Hours)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      console.log('No tasks found needing reminders.');
      return;
    }

    console.log(`Found ${querySnapshot.size} tasks that need reminders.`);

    const reminderPromises = querySnapshot.docs.map(async taskDoc => {
      const task = {id: taskDoc.id, ...taskDoc.data()} as Task;

      const userHasNotificationsEnabled = await getUserNotificationPreference(
        task.userId
      );
      if (!userHasNotificationsEnabled) {
        console.log(
          `User ${task.userId} has notifications disabled. Skipping.`
        );
        return;
      }

      const token = await getFcmTokenForUser(task.userId);
      if (token) {
        const dueDate = task.dueDate.toDate();
        const timeToDue = formatDistanceToNow(dueDate, {addSuffix: true});

        console.log(
          `Sending reminder for task "${task.title}" to user ${task.userId}`
        );
        await sendNotification(token, {
          title: 'Task Reminder',
          body: `Your task "${task.title}" is due ${timeToDue}.`,
        });

        // Mark the task as having had a reminder sent
        const taskRef = doc(db, 'tasks', task.id);
        await updateDoc(taskRef, {reminderSent: true});
      } else {
        console.warn(`No FCM token found for user ${task.userId}`);
      }
    });

    await Promise.all(reminderPromises);
    console.log('Finished processing task reminders.');
  }
);
