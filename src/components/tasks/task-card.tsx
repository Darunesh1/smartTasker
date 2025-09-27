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
import { MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { deleteTask, toggleTaskCompletion } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EditTaskForm from './edit-task-form';
import { useState, useEffect } from 'react';

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
  const [isPastDue, setIsPastDue] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    const checkPastDue = () => {
      if (task.dueDate) {
        setIsPastDue(task.dueDate.toDate() < new Date());
      }
    };
    checkPastDue();
    // Check every minute
    const interval = setInterval(checkPastDue, 60000);
    return () => clearInterval(interval);
  }, [task.dueDate]);


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

  const isActionable = !task.completed && !isPastDue;

  const EditMenuItem = () => (
    <DropdownMenuItem
      onClick={() => setIsEditDialogOpen(true)}
      disabled={!isActionable}
      className="cursor-pointer"
    >
      <Pencil className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
  );

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <Card className={cn('transition-all hover:shadow-md', priorityStyles[task.priority], (task.completed || isPastDue) && 'bg-muted/50')}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-4">
              <Checkbox id={`task-${task.id}`} checked={task.completed} onCheckedChange={handleToggleCompletion} aria-label={`Mark task ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`} />
              <CardTitle className={cn("text-lg", (task.completed || (isPastDue && !task.completed)) && 'line-through text-muted-foreground', isPastDue && !task.completed && 'text-destructive')}>{task.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPastDue && !task.completed ? 'destructive' : (priorityBadgeVariants[task.priority] || 'secondary')}>{task.priority}</Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">More options for task {task.title}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isActionable ? (
                  <EditMenuItem />
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='w-full'>
                           <EditMenuItem />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cannot edit {task.completed ? 'completed' : 'past due'} tasks.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                <DropdownMenuItem onClick={handleDelete} className="text-destructive cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {task.description && <CardDescription className={cn('pt-2', (task.completed || (isPastDue && !task.completed)) && 'line-through text-muted-foreground')}>{task.description}</CardDescription>}
          <p className={cn("text-sm text-muted-foreground mt-4", isPastDue && !task.completed && 'text-destructive font-medium')}>
            Due: {task.dueDate ? format(task.dueDate.toDate(), 'PPP, p') : 'No due date'}
            {isPastDue && !task.completed && ' (Past due)'}
          </p>
        </CardContent>
      </Card>
      <DialogContent>
        <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <EditTaskForm task={task} onFinished={() => setIsEditDialogOpen(false)}/>
      </DialogContent>
    </Dialog>
  );
}