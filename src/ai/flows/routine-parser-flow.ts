'use server';

/**
 * @fileOverview AI-powered routine parser flow.
 *
 * This file defines a Genkit flow that parses a natural language description
 * of a daily routine and converts it into a list of structured tasks.
 *
 * It exports:
 * - `parseRoutine`: The main function to call for parsing a routine.
 * - `RoutineParsingInput`: The input type for the `parseRoutine` function.
 * - `RoutineParsingOutput`: The output type for the `parseRoutine` function.
 * - `ParsedTask`: The type for an individual task parsed from the routine.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {Priority, Category} from '@/types/task';

// The individual task schema that the AI will generate
const ParsedTaskSchema = z.object({
  title: z.string().describe('The concise title of the task.'),
  description: z.string().describe('A brief description of the task.').optional(),
  priority: z
    .enum(['Critical', 'High', 'Medium', 'Low', 'Very Low'])
    .describe('The priority of the task.'),
  category: z
    .enum(['Work', 'Personal', 'Health', 'Study'])
    .describe('The category that best fits the task.'),
  duration: z.number().describe('The estimated duration of the task in minutes.'),
});

export type ParsedTask = z.infer<typeof ParsedTaskSchema>;

// Input schema for the flow
const RoutineParsingInputSchema = z.object({
  routineDescription: z
    .string()
    .describe('The natural language description of the daily routine.'),
  currentDate: z.string().describe('The current date in ISO format (YYYY-MM-DD) to provide context for date/time parsing.'),
});
export type RoutineParsingInput = z.infer<typeof RoutineParsingInputSchema>;

// Output schema for the flow
const RoutineParsingOutputSchema = z.object({
  tasks: z.array(ParsedTaskSchema).describe('The list of structured tasks parsed from the routine description.'),
});
export type RoutineParsingOutput = z.infer<typeof RoutineParsingOutputSchema>;


export async function parseRoutine(
  input: RoutineParsingInput
): Promise<RoutineParsingOutput> {
  return routineParserFlow(input);
}


const routineParserPrompt = ai.definePrompt({
  name: 'routineParserPrompt',
  input: {schema: RoutineParsingInputSchema},
  output: {schema: RoutineParsingOutputSchema},
  prompt: `You are an expert at parsing daily routines and converting them into a structured list of tasks.
Analyze the user's routine description and extract individual, actionable tasks.

Today's date is: {{{currentDate}}}. Use this to resolve relative dates like "tomorrow".

For each task, provide:
1.  **title**: A clear and concise title.
2.  **description**: A short, optional description with relevant details.
3.  **priority**: Assign a priority ('Critical', 'High', 'Medium', 'Low', 'Very Low') based on the task's nature. Meetings and important work are 'High' or 'Critical'. Chores and personal care are 'Medium'. Leisure is 'Low'.
4.  **category**: Categorize the task as 'Work', 'Personal', 'Health', or 'Study'.
5.  **duration**: Estimate the duration in minutes. If not specified, make a reasonable guess (e.g., shower: 15 min, breakfast: 20 min, meeting: 60 min).

User's Routine:
"{{{routineDescription}}}"

Generate a list of tasks based on this routine.
`,
});

const routineParserFlow = ai.defineFlow(
  {
    name: 'routineParserFlow',
    inputSchema: RoutineParsingInputSchema,
    outputSchema: RoutineParsingOutputSchema,
  },
  async input => {
    const {output} = await routineParserPrompt(input);
    return output!;
  }
);
