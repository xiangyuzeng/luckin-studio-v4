'use client';

import Link from 'next/link';
import { BookOpen, Sparkles, Video, Users, Activity, CheckCircle, Clapperboard, Layers, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { useQuery } from '@tanstack/react-query';
import type { TranslationKey } from '@/lib/i18n';
import type { LucideIcon } from 'lucide-react';

interface DashboardStats {
  totalPrompts: number;
  activeTasks: number;
  completedToday: number;
  totalAccounts: number;
}

interface UsageData {
  balance: number | null;
}

export default function DashboardPage() {
  const { t, locale } = useI18n();

  const statsQuery = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const usageQuery = useQuery({
    queryKey: ['usage'],
    queryFn: async (): Promise<UsageData> => {
      const res = await fetch('/api/usage');
      if (!res.ok) throw new Error('Failed to fetch usage');
      return res.json();
    },
    refetchInterval: 60000,
  });

  const stats = statsQuery.data;
  const usage = usageQuery.data;

  const statCards: { titleKey: TranslationKey; value: number | string; icon: LucideIcon; color: string }[] = [
    {
      titleKey: 'dashboard.total_prompts' as const,
      value: stats?.totalPrompts ?? '—',
      icon: BookOpen,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      titleKey: 'dashboard.active_tasks' as const,
      value: stats?.activeTasks ?? '—',
      icon: Activity,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      titleKey: 'dashboard.completed_today' as const,
      value: stats?.completedToday ?? '—',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    {
      titleKey: 'dashboard.accounts' as const,
      value: stats?.totalAccounts ?? '—',
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  // Conditionally add credits card if balance is available
  if (usage?.balance !== null && usage?.balance !== undefined) {
    statCards.push({
      titleKey: 'dashboard.credits' as const,
      value: usage.balance,
      icon: CreditCard,
      color: 'text-teal-600 bg-teal-50',
    });
  }

  const quickActions = [
    { labelKey: 'nav.prompt_library' as const, href: '/prompts', icon: BookOpen, desc: locale === 'cn' ? '浏览和管理视频提示词' : 'Browse and manage video prompts' },
    { labelKey: 'nav.ai_generator' as const, href: '/prompts/generate', icon: Sparkles, desc: locale === 'cn' ? 'AI 生成提示词' : 'Generate prompts with AI' },
    { labelKey: 'nav.veo_text' as const, href: '/video/veo', icon: Video, desc: locale === 'cn' ? 'VEO 文生视频' : 'Create videos with VEO' },
    { labelKey: 'nav.sora_text' as const, href: '/video/sora', icon: Clapperboard, desc: locale === 'cn' ? 'Sora 文生视频' : 'Create videos with Sora' },
    { labelKey: 'nav.kling_text' as const, href: '/video/kling', icon: Clapperboard, desc: locale === 'cn' ? 'Kling 文生视频' : 'Create videos with Kling' },
    { labelKey: 'nav.batch' as const, href: '/video/batch', icon: Layers, desc: locale === 'cn' ? '批量生产视频' : 'Batch video production' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground mt-1">
          Luckin Coffee AIGC Video Production Platform
        </p>
      </div>

      <div className={`grid gap-4 sm:grid-cols-2 ${statCards.length > 4 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.titleKey}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(stat.titleKey)}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.quick_actions')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.href} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{t(action.labelKey)}</h3>
                    <p className="text-sm text-muted-foreground truncate">{action.desc}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={action.href}>{locale === 'cn' ? '前往' : 'Go'}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">{t('dashboard.recent_activity')}</h2>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t('common.no_data')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
