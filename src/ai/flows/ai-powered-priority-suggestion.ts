'use server';

/**
 * @fileOverview AI-powered priority suggestion flow.
 *
 * This file defines a Genkit flow that suggests task priorities based on task descriptions.
 * It exports:
 * - `suggestTaskPriority`: The function to call to get a priority suggestion.
 * - `PrioritySuggestionInput`: The input type for the `suggestTaskPriority` function.
 * - `PrioritySuggestionOutput`: The output type for the `suggestTaskPriority` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrioritySuggestionInputSchema = z.object({
  taskDescription: z
    .string()
    .describe('The description of the task for which a priority is to be suggested.'),
});
export type PrioritySuggestionInput = z.infer<typeof PrioritySuggestionInputSchema>;

const PrioritySuggestionOutputSchema = z.object({
  suggestedPriority: z
    .enum(['Critical', 'High', 'Medium', 'Low', 'Very Low'])
    .describe('The suggested priority for the task: Critical, High, Medium, Low, or Very Low.'),
  explanation: z
    .string()
    .describe('Explanation of why the task was assigned the suggested priority.'),
});
export type PrioritySuggestionOutput = z.infer<typeof PrioritySuggestionOutputSchema>;

export async function suggestTaskPriority(
  input: PrioritySuggestionInput
): Promise<PrioritySuggestionOutput> {
  return suggestTaskPriorityFlow(input);
}

const prioritySuggestionPrompt = ai.definePrompt({
  name: 'prioritySuggestionPrompt',
  input: {schema: PrioritySuggestionInputSchema},
  output: {schema: PrioritySuggestionOutputSchema},
  prompt: `You are a task management expert. Your job is to suggest a priority for a task based on its description. The available priorities are: Critical, High, Medium, Low, Very Low.

Task Description: {{{taskDescription}}}

Considerations for determining the task's priority:
- Urgency: How quickly does the task need to be completed?
- Importance: How critical is the task to overall goals?
- Impact: What is the impact of not completing the task?

Based on these considerations, provide a suggested priority and a brief explanation.
`,
});

const suggestTaskPriorityFlow = ai.defineFlow(
  {
    name: 'suggestTaskPriorityFlow',
    inputSchema: PrioritySuggestionInputSchema,
    outputSchema: PrioritySuggestionOutputSchema,
  },
  async input => {
    const {output} = await prioritySuggestionPrompt(input);
    return output!;
  }
);
