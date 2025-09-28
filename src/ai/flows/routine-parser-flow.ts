
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
  duration: z.number().describe('The estimated duration of the task in minutes.').optional(),
  dueDate: z.string().describe("The exact due date and time for the task in ISO 8601 format (e.g., '2025-09-28T14:30:00.000Z'). This must be in the future relative to the current date provided."),
});

export type ParsedTask = z.infer<typeof ParsedTaskSchema>;

// Input schema for the flow
const RoutineParsingInputSchema = z.object({
  routineDescription: z
    .string()
    .describe('The natural language description of the daily routine.'),
  currentDate: z.string().describe("The current date and time in a readable format (e.g., 'Sunday, September 28, 2025, 12:10 PM IST') to provide context for date/time parsing."),
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
  prompt: `You are an expert at parsing daily routines and converting them into a structured list of tasks with future due dates.

Current date and time is: {{{currentDate}}}

IMPORTANT RULES:
1.  **ALL due dates MUST be in the future** relative to the current date and time provided.
2.  If the user mentions a specific time (e.g., "9am meeting"), use that exact time. If that time has already passed today, schedule it for the same time tomorrow.
3.  If the routine seems to be for "today" but the current time is after 6 PM, schedule the tasks for tomorrow.
4.  For general tasks without a specific time, distribute them logically throughout the day, starting from after the current time.
5.  Respect the logical sequence of tasks (e.g., breakfast before lunch).
6.  The 'dueDate' you return MUST be a full ISO 8601 UTC string (e.g., '2025-09-28T09:00:00.000Z').

For each task, provide:
-   **title**: A clear and concise title.
-   **description**: A short, optional description.
-   **priority**: Assign a priority. Meetings/work are 'High' or 'Critical'. Chores are 'Medium'. Leisure is 'Low'.
-   **category**: Categorize as 'Work', 'Personal', 'Health', or 'Study'.
-   **duration**: Estimate duration in minutes (optional).
-   **dueDate**: The calculated future due date and time in ISO 8601 format.

User's Routine:
"{{{routineDescription}}}"

Generate a list of tasks based on this routine, following all rules.
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
