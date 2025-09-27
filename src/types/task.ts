import type { Timestamp } from 'firebase/firestore';

export type Priority = 'Critical' | 'High' | 'Medium-High' | 'Medium' | 'Medium-Low' | 'Low' | 'Minimal';

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
