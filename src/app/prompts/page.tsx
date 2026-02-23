'use client';

import { useState, useMemo } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { usePrompts } from '@/hooks/use-prompts';
import { PromptFilter } from '@/components/prompts/prompt-filter';
import { PromptSearch } from '@/components/prompts/prompt-search';
import { PromptGrid } from '@/components/prompts/prompt-grid';
import { PromptDetail } from '@/components/prompts/prompt-detail';
import { EmptyState } from '@/components/shared/empty-state';
import type { PromptCategory, PromptFilters } from '@/types/prompt';

export default function PromptsPage() {
  const { t } = useI18n();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filters: PromptFilters = useMemo(() => ({
    category: category === 'all' ? undefined : category as PromptCategory,
    search: search || undefined,
    limit: 225,
  }), [category, search]);

  const { data, isLoading } = usePrompts(filters);
  const prompts = data?.prompts || [];

  // Count prompts per category
  const { data: allData } = usePrompts({ limit: 225 });
  const counts = useMemo(() => {
    const all = allData?.prompts || [];
    const c: Record<string, number> = { total: all.length };
    for (const p of all) {
      c[p.category] = (c[p.category] || 0) + 1;
    }
    return c;
  }, [allData]);

  const selectedPrompt = prompts.find((p: any) => p.id === selectedId) || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('prompts.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {counts.total || 225} prompt templates for Luckin Coffee video production
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <PromptSearch value={search} onChange={setSearch} />
        </div>
      </div>

      <PromptFilter selected={category} onSelect={setCategory} counts={counts} />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <EmptyState message={t('prompts.no_results')} />
      ) : (
        <PromptGrid
          prompts={prompts}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        />
      )}

      <PromptDetail
        prompt={selectedPrompt}
        open={!!selectedPrompt}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
