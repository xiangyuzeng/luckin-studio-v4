'use client';

import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';

const categories = [
  { value: 'all', label_en: 'All', label_cn: '全部' },
  { value: 'coffee', label_en: 'Coffee', label_cn: '咖啡' },
  { value: 'specialty', label_en: 'Specialty', label_cn: '特调' },
  { value: 'food', label_en: 'Food', label_cn: '美食' },
  { value: 'pairing', label_en: 'Pairing', label_cn: '搭配' },
  { value: 'store', label_en: 'Store', label_cn: '门店' },
  { value: 'seasonal', label_en: 'Seasonal', label_cn: '季节' },
  { value: 'lifestyle', label_en: 'Lifestyle', label_cn: '生活方式' },
  { value: 'advanced', label_en: 'Advanced', label_cn: '高级' },
];

interface PromptFilterProps {
  selected: string;
  onSelect: (category: string) => void;
  counts?: Record<string, number>;
}

export function PromptFilter({ selected, onSelect, counts }: PromptFilterProps) {
  const { locale } = useAppStore();

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const label = locale === 'cn' ? cat.label_cn : cat.label_en;
        const count = cat.value === 'all' ? counts?.total : counts?.[cat.value];
        const isActive = selected === cat.value;

        return (
          <button
            key={cat.value}
            onClick={() => onSelect(cat.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-all',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
            )}
          >
            {label}
            {count !== undefined && (
              <span className={cn(
                'text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                isActive ? 'bg-white/20' : 'bg-background'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
