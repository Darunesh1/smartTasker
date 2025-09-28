
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
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, Priority, Category } from '@/types/task';

const tasksCollection = collection(db, 'tasks');
const fcmTokensCollection = collection(db, 'fcmTokens');
const usersCollection = collection(db, 'users');

// Get tasks for a user
export async function getTasks(userId: string): Promise<Task[]> {
  const q = query(tasksCollection, where('userId', '==', userId), orderBy('dueDate', 'asc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
}

// Subscribe to task updates
export function onTasksSnapshot(userId: string, callback: (tasks: Task[]) => void) {
  const q = query(tasksCollection, where('userId', '==', userId));
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id,
        ...data,
        // Ensure dueDate is a Timestamp, which it should be from Firestore
        dueDate: data.dueDate,
        createdAt: data.createdAt,
       } as Task;
    });
    
    const priorityOrder: Record<Priority, number> = { 
        'Critical': 5, 
        'High': 4, 
        'Medium': 3, 
        'Low': 2, 
        'Very Low': 1
    };
    
    tasks.sort((a, b) => {
        // 1. Sort by completion status (incomplete first)
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // 2. Sort by priority level (higher priority first)
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) {
            return priorityDiff;
        }
        
        // 3. Sort by due date (earliest first)
        if (a.dueDate && b.dueDate) {
            const dateA = a.dueDate.toMillis();
            const dateB = b.dueDate.toMillis();
            if (dateA !== dateB) {
                return dateA - dateB;
            }
        }
        
        // 4. Sort by creation date for ties (earliest first)
        if (a.createdAt && b.createdAt) {
            return a.createdAt.toMillis() - b.createdAt.toMillis();
        }

        return 0;
    });

    callback(tasks);
  });
}


// Add a new task
export async function addTask(
  userId: string,
  task: { title: string; description: string | undefined; dueDate: Date; priority: Priority, category: Category }
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
export async function updateTask(taskId: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt'>>) {
  const taskDoc = doc(db, 'tasks', taskId);
  const dataToUpdate = { ...updates };
  if (updates.dueDate instanceof Date) {
      dataToUpdate.dueDate = Timestamp.fromDate(updates.dueDate)
  }
  await updateDoc(taskDoc, dataToUpdate);
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

// Save FCM token
export async function saveFcmToken(userId: string, token: string) {
    const tokenDoc = doc(fcmTokensCollection, token);
    await setDoc(tokenDoc, { userId, createdAt: serverTimestamp() }, { merge: true });
}

// Delete FCM token for a user
export async function deleteFcmTokenForUser(userId: string) {
    console.log(`Querying tokens for user ${userId} to delete.`);
    const q = query(fcmTokensCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`Deleted ${querySnapshot.size} tokens for user ${userId}.`);
    }
}

// User notification preferences
export async function updateUserNotificationPreference(userId: string, enabled: boolean) {
    const userDoc = doc(usersCollection, userId);
    await setDoc(userDoc, { notificationsEnabled: enabled }, { merge: true });
    // If notifications are disabled, remove any existing FCM tokens for the user.
    if (!enabled) {
        await deleteFcmTokenForUser(userId);
    }
}

export async function getUserNotificationPreference(userId: string): Promise<boolean> {
    const userDoc = doc(usersCollection, userId);
    const docSnap = await getDoc(userDoc);
    if (docSnap.exists()) {
        return docSnap.data()?.notificationsEnabled === true;
    }
    return false; // Default to false if no setting is stored
}
