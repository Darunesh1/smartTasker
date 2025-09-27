'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/header';
import TaskForm from '@/components/tasks/task-form';
import TaskList from '@/components/tasks/task-list';
import type { Task, Priority } from '@/types/task';
import { onTasksSnapshot } from '@/lib/firestore';
import FilterControls from '@/components/tasks/filter-controls';
import { isToday, isThisWeek, isFuture, isPast } from 'date-fns';

type FilterStatus = 'all' | 'past-due' | 'due-today' | 'due-this-week' | 'upcoming' | 'completed';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      console.log('Current user UID:', user.uid);
      const unsubscribe = onTasksSnapshot(user.uid, (newTasks) => {
        setTasks(newTasks);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const dueDate = task.dueDate.toDate();
      const isCompleted = task.completed;
      const isPastDue = !isCompleted && isPast(dueDate);

      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }

      // Status filter
      switch (filterStatus) {
        case 'past-due':
          return isPastDue;
        case 'due-today':
          return !isCompleted && isToday(dueDate);
        case 'due-this-week':
          // isThisWeek includes past days of the current week, so we also check if it's in the future or today
          return !isCompleted && isThisWeek(dueDate, { weekStartsOn: 1 }) && (isFuture(dueDate) || isToday(dueDate));
        case 'upcoming':
          return !isCompleted && isFuture(dueDate);
        case 'completed':
          return isCompleted;
        case 'all':
        default:
          return true;
      }
    });
  }, [tasks, filterStatus, filterPriority]);


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
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
              <h2 className="text-2xl font-bold font-headline">Your Tasks</h2>
              <FilterControls 
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                filterPriority={filterPriority}
                setFilterPriority={setFilterPriority}
                />
            </div>
            <TaskList tasks={filteredTasks} />
          </div>
        </div>
      </div>
    </div>
  );
}
