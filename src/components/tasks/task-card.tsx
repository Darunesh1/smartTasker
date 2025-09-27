'use client';

import type { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { deleteTask, toggleTaskCompletion } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';

const priorityStyles = {
  Critical: 'border-l-4 border-red-500',
  High: 'border-l-4 border-accent',
  'Medium-High': 'border-l-4 border-orange-400',
  Medium: 'border-l-4 border-primary',
  'Medium-Low': 'border-l-4 border-sky-400',
  Low: 'border-l-4 border-secondary-foreground',
  Minimal: 'border-l-4 border-gray-400',
};

const priorityBadgeVariants = {
    Critical: "destructive",
    High: "destructive",
    'Medium-High': "default",
    Medium: "default",
    'Medium-Low': "secondary",
    Low: "secondary",
    Minimal: "outline"
} as const;


export default function TaskCard({ task }: { task: Task }) {
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting task' });
    }
  };

  const handleToggleCompletion = async () => {
    try {
        await toggleTaskCompletion(task.id, !task.completed);
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error updating task' });
    }
  }

  return (
    <Card className={cn('transition-all hover:shadow-md', priorityStyles[task.priority], task.completed && 'bg-muted/50')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-4">
            <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={handleToggleCompletion} aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`} />
            <CardTitle className={cn("text-lg", task.completed && 'line-through text-muted-foreground')}>{task.title}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={priorityBadgeVariants[task.priority] || 'secondary'}>{task.priority}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="sr-only">More options for task {task.title}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {task.description && <CardDescription className={cn('pt-2', task.completed && 'line-through text-muted-foreground')}>{task.description}</CardDescription>}
        <p className="text-sm text-muted-foreground mt-4">
          Due: {task.dueDate ? format(task.dueDate.toDate(), 'PPP, p') : 'No due date'}
        </p>
      </CardContent>
    </Card>
  );
}
