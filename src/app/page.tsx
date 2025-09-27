'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/header';
import TaskForm from '@/components/tasks/task-form';
import TaskList from '@/components/tasks/task-list';
import type { Task } from '@/types/task';
import { onTasksSnapshot } from '@/lib/firestore';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const unsubscribe = onTasksSnapshot(user.uid, (newTasks) => {
        setTasks(newTasks);
      });
      return () => unsubscribe();
    }
  }, [user]);

  if (loading || !user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <div className="flex-1 container mx-auto p-4 md:p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold mb-4 font-headline">Create Task</h2>
            <TaskForm />
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 font-headline">Your Tasks</h2>
            <TaskList tasks={tasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
