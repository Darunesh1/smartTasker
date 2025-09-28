'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateTask } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Priority, Task, Category } from '@/types/task';
import { suggestTaskPriority } from '@/ai/flows/ai-powered-priority-suggestion';
import { format, addHours, isToday, getHours, getMinutes } from 'date-fns';

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  description: z.string().optional(),
  date: z.string().refine(val => val, { message: 'Date is required' }),
  time: z.string().refine(val => val, { message: 'Time is required' }),
  priority: z.enum(['Critical', 'High', 'Medium', 'Low', 'Very Low']),
  category: z.enum(['Work', 'Personal', 'Health', 'Study']),
}).refine(data => {
    const selectedDateTime = new Date(`${data.date}T${data.time}`);
    return selectedDateTime > new Date();
}, {
    message: "Due date and time must be in the future.",
    path: ["time"],
});

type TaskFormValues = z.infer<typeof formSchema>;

const priorities: Priority[] = ['Critical', 'High', 'Medium', 'Low', 'Very Low'];
const categories: Category[] = ['Work', 'Personal', 'Health', 'Study'];

const toLocalTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

const getTodayString = () => format(new Date(), 'yyyy-MM-dd');

export default function EditTaskForm({ task, onFinished }: { task: Task, onFinished: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const dueDate = task.dueDate.toDate();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description,
      date: format(dueDate, 'yyyy-MM-dd'),
      time: toLocalTimeString(dueDate),
      priority: task.priority,
      category: task.category,
    },
    mode: 'onChange'
  });

  const watchedDate = form.watch('date');

  async function onSubmit(values: TaskFormValues) {
    setIsSubmitting(true);
    try {
      const newDueDate = new Date(`${values.date}T${values.time}`);
      await updateTask(task.id, { 
          title: values.title, 
          description: values.description, 
          dueDate: newDueDate, 
          priority: values.priority,
          category: values.category
      });
      toast({
        title: 'Task Updated',
        description: 'Your task has been updated successfully.',
      });
      onFinished();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error updating task',
        description: 'There was a problem saving your changes. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleSuggestPriority() {
    const description = form.getValues('description');
    if (!description || description.trim().length < 10) {
      toast({
        variant: 'destructive',
        title: 'Description too short',
        description: 'Please provide a longer description for an accurate suggestion.',
      });
      return;
    }

    setIsSuggesting(true);
    try {
      const result = await suggestTaskPriority({ taskDescription: description });
      form.setValue('priority', result.suggestedPriority);
      toast({
        title: 'AI Suggestion',
        description: `Priority set to ${result.suggestedPriority}. ${result.explanation}`,
      });
    } catch (error) {
      console.error('AI priority suggestion error:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not get a priority suggestion at this time.',
      });
    } finally {
      setIsSuggesting(false);
    }
  }

  const getMinTime = () => {
    if (watchedDate && isToday(new Date(watchedDate))) {
      const now = new Date();
      return toLocalTimeString(now);
    }
    return undefined;
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Finish project proposal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Add more details about the task..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
            <Button type="button" variant="outline" size="sm" onClick={handleSuggestPriority} disabled={isSuggesting || isSubmitting}>
                {isSuggesting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4 text-orange-500" />
                )}
                Suggest Priority with AI
            </Button>
            <FormDescription>
                Requires a description of at least 10 characters.
            </FormDescription>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" min={getTodayString()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Time</FormLabel>
                  <FormControl>
                    <Input type="time" min={getMinTime()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onFinished}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isSuggesting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
        </div>
      </form>
    </Form>
  );
}
