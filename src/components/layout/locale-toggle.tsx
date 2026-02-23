'use client';

import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

export function LocaleToggle() {
  const { locale, setLocale } = useAppStore();

  return (
    <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 text-xs">
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'rounded-md px-2.5 py-1 transition-all',
          locale === 'en'
            ? 'bg-white text-foreground shadow-sm font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLocale('cn')}
        className={cn(
          'rounded-md px-2.5 py-1 transition-all',
          locale === 'cn'
            ? 'bg-white text-foreground shadow-sm font-medium'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        CN
      </button>
    </div>
  );
}
