import type { Timestamp } from 'firebase/firestore';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low' | 'Very Low';

export type Category = 'Work' | 'Personal' | 'Health' | 'Study';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  priority: Priority;
  category: Category;
  userId: string;
  createdAt: Timestamp;
  completed: boolean;
}
