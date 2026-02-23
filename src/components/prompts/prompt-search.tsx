'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/hooks/use-i18n';

interface PromptSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function PromptSearch({ value, onChange }: PromptSearchProps) {
  const { t } = useI18n();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('prompts.search')}
        className="pl-9"
      />
    </div>
  );
}
