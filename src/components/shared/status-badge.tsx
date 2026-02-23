'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';

const statusConfig: Record<string, { className: string; labelKey: TranslationKey }> = {
  pending: { className: 'bg-yellow-100 text-yellow-700 border-yellow-200', labelKey: 'status.pending' },
  processing: { className: 'bg-blue-100 text-blue-700 border-blue-200', labelKey: 'status.processing' },
  completed: { className: 'bg-green-100 text-green-700 border-green-200', labelKey: 'status.completed' },
  failed: { className: 'bg-red-100 text-red-700 border-red-200', labelKey: 'status.failed' },
};

export function StatusBadge({ status }: { status: string }) {
  const { locale } = useAppStore();
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {t(config.labelKey, locale)}
    </Badge>
  );
}
