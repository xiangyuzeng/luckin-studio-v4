'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Prompt, PromptFilters, GeneratedPrompt, PromptCategory } from '@/types/prompt';

async function fetchPrompts(filters: PromptFilters = {}): Promise<{ prompts: Prompt[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.search) params.set('search', filters.search);
  if (filters.custom !== undefined) params.set('custom', String(filters.custom));
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/prompts?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch prompts');
  return res.json();
}

async function generatePrompts(data: {
  category: PromptCategory;
  brief: string;
  count: number;
}): Promise<{ prompts: GeneratedPrompt[] }> {
  const res = await fetch('/api/prompts/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to generate prompts');
  return res.json();
}

async function createPrompt(data: Partial<Prompt>): Promise<Prompt> {
  const res = await fetch('/api/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create prompt');
  return res.json();
}

export function usePrompts(filters: PromptFilters = {}) {
  return useQuery({
    queryKey: ['prompts', filters],
    queryFn: () => fetchPrompts(filters),
  });
}

export function useGeneratePrompts() {
  return useMutation({
    mutationFn: generatePrompts,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
  });
}
