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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Sparkles } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '../auth/auth-provider';
import { addTask } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Priority } from '@/types/task';
import { suggestTaskPriority } from '@/ai/flows/ai-powered-priority-suggestion';
import { Card, CardContent } from '../ui/card';

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  description: z.string().optional(),
  dueDate: z.date(),
  priority: z.enum(['Low', 'Medium', 'High']),
});

type TaskFormValues = z.infer<typeof formSchema>;

const priorities: Priority[] = ['Low', 'Medium', 'High'];

export default function TaskForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: new Date(),
      priority: 'Medium',
    },
  });

  async function onSubmit(values: TaskFormValues) {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a task.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addTask(user.uid, values);
      toast({
        title: 'Task Created',
        description: 'Your new task has been added successfully.',
      });
      form.reset({ title: '', description: '', dueDate: new Date(), priority: 'Medium' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error creating task',
        description: 'There was a problem saving your task. Please try again.',
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


  return (
    <Card>
      <CardContent className="pt-6">
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || isSuggesting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Task
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
