
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, Trash2 } from 'lucide-react';
import { parseRoutine, type ParsedTask } from '@/ai/flows/routine-parser-flow';
import { Card, CardContent } from '../ui/card';
import { useAuth } from '../auth/auth-provider';
import { batchAddTask } from '@/lib/firestore';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import type { Priority } from '@/types/task';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

interface EditableParsedTask extends ParsedTask {
    id: string;
}

const priorityBadgeVariants: Record<Priority, "destructive" | "default" | "secondary" | "outline"> = {
    Critical: "destructive",
    High: "destructive",
    Medium: "default",
    Low: "secondary",
    'Very Low': "outline"
} as const;

export default function RoutinePlannerDialog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [routineText, setRoutineText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedTasks, setParsedTasks] = useState<EditableParsedTask[]>([]);
  const [view, setView] = useState<'input' | 'preview'>('input');

  const handleParseRoutine = async () => {
    if (routineText.trim().length < 20) {
      toast({
        variant: 'destructive',
        title: 'Routine too short',
        description: 'Please describe your routine in more detail.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const now = new Date();
      // Format date for the AI to understand, including timezone.
      const currentDateString = now.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            timeZoneName: 'short',
        });
        
      const result = await parseRoutine({
        routineDescription: routineText,
        currentDate: currentDateString,
      });

      if (result.tasks && result.tasks.length > 0) {
        const validTasks = result.tasks
            .map(task => ({...task, id: uuidv4()}))
            .filter(task => new Date(task.dueDate) > now); // Ensure all dates are in the future

        if (validTasks.length < result.tasks.length) {
            toast({
                variant: 'destructive',
                title: 'AI Parsing Issue',
                description: 'Some tasks with past due dates were ignored. Please check your routine description.',
            })
        }
        
        setParsedTasks(validTasks);
        if (validTasks.length > 0) {
            setView('preview');
        } else {
            toast({
                variant: 'destructive',
                title: 'Parsing Failed',
                description: 'The AI could not identify any future tasks. Please try rephrasing your routine.',
            });
        }
      } else {
        toast({
            variant: 'destructive',
            title: 'Parsing Failed',
            description: 'The AI could not identify any tasks. Please try rephrasing your routine.',
        });
      }
    } catch (error) {
      console.error('Routine parsing error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Parsing Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBatchCreateTasks = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Not Authenticated', description: 'You must be logged in to create tasks.' });
        return;
    }
    if (parsedTasks.length === 0) {
        toast({ variant: 'destructive', title: 'No Tasks', description: 'There are no tasks to create.' });
        return;
    }
    setIsLoading(true);
    try {
        const tasksToCreate = parsedTasks.map(task => {
            return {
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                category: task.category,
                dueDate: new Date(task.dueDate), // Use the date from AI
            };
        });

        await batchAddTask(user.uid, tasksToCreate);
        toast({
            title: 'Tasks Created!',
            description: `${tasksToCreate.length} tasks have been added to your list.`,
        });
        resetAndClose();

    } catch (error) {
        console.error("Error creating batch tasks:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not create tasks. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  }

  const handleDeleteTask = (id: string) => {
    setParsedTasks(currentTasks => currentTasks.filter(task => task.id !== id));
  }

  const handleUpdateTask = (id: string, field: keyof ParsedTask, value: string | number) => {
    setParsedTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === id ? { ...task, [field]: value } : task
      )
    );
  };
  
  const resetAndClose = () => {
    setRoutineText('');
    setParsedTasks([]);
    setView('input');
    setIsOpen(false);
  }
  
  const totalDuration = parsedTasks.reduce((acc, task) => acc + (task.duration || 0), 0);
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Wand2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Plan My Day with AI</h3>
                        <p className="text-sm text-muted-foreground">Convert your routine into tasks automatically.</p>
                    </div>
                </div>
            </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl max-h-[90vh] flex flex-col">
        {view === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-6 w-6 text-primary" />
                Smart Routine Planner
              </DialogTitle>
              <DialogDescription>
                Describe your daily routine in plain text, and our AI will break it down into manageable tasks for you.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Textarea
                placeholder="e.g., Tomorrow morning, I'll go for a 45-minute run, then I have a 9am project sync meeting. I need to spend 2 hours preparing the quarterly report..."
                value={routineText}
                onChange={(e) => setRoutineText(e.target.value)}
                className="min-h-[200px] text-base"
                maxLength={1000}
              />
              <p className="text-sm text-right text-muted-foreground">{routineText.length} / 1000</p>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleParseRoutine} disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Parse with AI
                </Button>
            </DialogFooter>
          </>
        )}
        {view === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle>AI Generated Tasks</DialogTitle>
              <DialogDescription>
                Review and edit the tasks generated by the AI. When you're ready, add them to your task list.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 flex-1 min-h-0">
                <div className="flex justify-between items-center mb-4 px-1">
                    <p className="font-medium">{parsedTasks.length} tasks found</p>
                    {totalDuration > 0 && <p className="text-sm text-muted-foreground">
                        Total estimated time: {totalHours > 0 && `${totalHours}h `}{totalMinutes > 0 && `${totalMinutes}m`}
                    </p>}
                </div>
                <ScrollArea className="h-[400px] pr-4">
                   <div className="space-y-3">
                    {parsedTasks.map((task, index) => (
                        <Card key={task.id}>
                            <CardContent className="p-3 flex items-start gap-3">
                               <span className="text-lg font-bold text-muted-foreground pt-1">{index+1}.</span>
                               <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        value={task.title}
                                        onChange={(e) => handleUpdateTask(task.id, 'title', e.target.value)}
                                        className="w-full font-semibold bg-transparent border-b border-transparent focus:border-input focus:outline-none"
                                    />
                                    <textarea
                                        value={task.description || ''}
                                        onChange={(e) => handleUpdateTask(task.id, 'description', e.target.value)}
                                        className="w-full text-sm text-muted-foreground bg-transparent border-b border-transparent focus:border-input focus:outline-none resize-none"
                                        rows={1}
                                    />
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge variant={priorityBadgeVariants[task.priority]}>{task.priority}</Badge>
                                        <Badge variant="secondary">{task.category}</Badge>
                                        {task.duration && <Badge variant="outline">{task.duration} mins</Badge>}
                                        <Badge variant="outline">{format(new Date(task.dueDate), 'p')}</Badge>
                                    </div>
                               </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteTask(task.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                   </div>
                </ScrollArea>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setView('input')}>Back</Button>
                <Button onClick={handleBatchCreateTasks} disabled={isLoading}>
                    {isLoading && <Loader2 className="animate-spin" />}
                    Add {parsedTasks.length} Tasks
                </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
