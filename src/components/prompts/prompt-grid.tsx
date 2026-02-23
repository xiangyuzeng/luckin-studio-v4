'use client';

import { PromptCard } from './prompt-card';

interface PromptGridProps {
  prompts: any[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export function PromptGrid({ prompts, selectedId, onSelect }: PromptGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          isSelected={selectedId === prompt.id}
          onClick={() => onSelect?.(prompt.id)}
        />
      ))}
    </div>
  );
}
