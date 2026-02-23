'use client';

import { useAppStore } from '@/stores/app-store';
import { t, type TranslationKey } from '@/lib/i18n';
import { useCallback } from 'react';

export function useI18n() {
  const locale = useAppStore((s) => s.locale);
  const translate = useCallback((key: TranslationKey) => t(key, locale), [locale]);
  return { t: translate, locale };
}
