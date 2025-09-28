
'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/header';
import { useAuth } from '@/components/auth/auth-provider';
import { onTasksSnapshot } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import type { Task, Priority, Category } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, Pie, PieChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { isPast, isFuture, isToday, differenceInDays } from 'date-fns';

const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];
const categories: Category[] = ['Work', 'Personal', 'Health', 'Study'];

const PRIORITY_COLORS: Record<Priority, string> = {
  'Critical': '#ef4444',
  'High': '#f97316',
  'Medium': '#3b82f6',
  'Low': '#34d399',
  'Very Low': '#9ca3af',
};

const CATEGORY_COLORS: Record<Category, string> = {
    'Work': '#3b82f6',
    'Personal': '#16a34a',
    'Health': '#ec4899',
    'Study': '#8b5cf6',
};


export default function AnalyticsPage() {
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

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const overdueTasks = tasks.filter(t => !t.completed && isPast(t.dueDate.toDate()) && !isToday(t.dueDate.toDate())).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const priorityDistribution = priorities.map(p => ({
        name: p,
        value: tasks.filter(t => t.priority === p).length
    }));
    
    const categoryDistribution = categories.map(c => ({
        name: c,
        value: tasks.filter(t => t.category === c).length
    }));

    const completionOverTime = tasks.reduce((acc, task) => {
        if(task.completed) {
            const completionDate = task.dueDate.toDate().toISOString().split('T')[0];
            acc[completionDate] = (acc[completionDate] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const completionTrend = Object.entries(completionOverTime)
        .map(([date, count]) => ({ date, count }))
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    return {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        priorityDistribution,
        categoryDistribution,
        completionTrend
    };
  }, [tasks]);
  
  if (loading || !user) {
    return null; 
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6 font-headline">Analytics Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
                <CardHeader><CardTitle>Total Tasks</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.totalTasks}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Completed</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.completedTasks}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Pending</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.pendingTasks}</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Completion Rate</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{stats.completionRate.toFixed(1)}%</p></CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Task Priorities</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={stats.priorityDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {stats.priorityDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as Priority]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Task Categories</CardTitle>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.categoryDistribution} layout="vertical">
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={80} />
                            <Tooltip cursor={{fill: 'rgba(200, 200, 200, 0.2)'}}/>
                            <Bar dataKey="value" name="Tasks">
                                {stats.categoryDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Completion Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.completionTrend}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#8884d8" name="Tasks Completed" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
