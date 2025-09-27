import type { Task } from '@/types/task';
import TaskCard from './task-card';
import { FileText } from 'lucide-react';

export default function TaskList({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg bg-card">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No tasks yet</h3>
        <p className="text-muted-foreground">Create your first task to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
