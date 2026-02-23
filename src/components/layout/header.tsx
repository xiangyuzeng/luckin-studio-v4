'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { LocaleToggle } from './locale-toggle';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

const pathNames: Record<string, TranslationKey> = {
  '/': 'nav.dashboard',
  '/prompts': 'nav.prompt_library',
  '/prompts/generate': 'nav.ai_generator',
  '/video/veo': 'nav.veo_text',
  '/video/veo/image': 'nav.veo_image',
  '/accounts': 'nav.accounts',
  '/history': 'history.title',
  '/settings': 'settings.title',
};

export function Header() {
  const pathname = usePathname();
  const { locale } = useAppStore();

  const segments = pathname.split('/').filter(Boolean);
  const pageTitle = pathNames[pathname] || 'nav.dashboard';

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('nav.dashboard', locale)}</span>
        {segments.length > 0 && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{t(pageTitle, locale)}</span>
          </>
        )}
      </div>
      <LocaleToggle />
    </header>
  );
}
