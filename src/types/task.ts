import type { Timestamp } from 'firebase/firestore';

export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  priority: Priority;
  userId: string;
  createdAt: Timestamp;
  completed: boolean;
}
