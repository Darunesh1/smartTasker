import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, Priority } from '@/types/task';

const tasksCollection = collection(db, 'tasks');

// Get tasks for a user
export async function getTasks(userId: string): Promise<Task[]> {
  const q = query(tasksCollection, where('userId', '==', userId), orderBy('dueDate', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

// Subscribe to task updates
export function onTasksSnapshot(userId: string, callback: (tasks: Task[]) => void) {
  const q = query(tasksCollection, where('userId', '==', userId), orderBy('dueDate', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    
    const priorityOrder: Record<Priority, number> = { 'High': 3, 'Medium': 2, 'Low': 1 };
    tasks.sort((a, b) => {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        
        if (a.dueDate && b.dueDate) {
            return a.dueDate.toMillis() - b.dueDate.toMillis();
        }
        return 0;
    });

    callback(tasks);
  });
}


// Add a new task
export async function addTask(
  userId: string,
  task: { title: string; description: string | undefined; dueDate: Date; priority: Priority }
) {
  await addDoc(tasksCollection, {
    ...task,
    userId,
    completed: false,
    createdAt: serverTimestamp(),
    dueDate: Timestamp.fromDate(task.dueDate),
  });
}

// Update a task
export async function updateTask(taskId: string, updates: Partial<Omit<Task, 'id'>>) {
  const taskDoc = doc(db, 'tasks', taskId);
  await updateDoc(taskDoc, updates);
}

export async function toggleTaskCompletion(taskId: string, completed: boolean) {
    const taskDoc = doc(db, 'tasks', taskId);
    await updateDoc(taskDoc, { completed });
}


// Delete a task
export async function deleteTask(taskId: string) {
  const taskDoc = doc(db, 'tasks', taskId);
  await deleteDoc(taskDoc);
}
