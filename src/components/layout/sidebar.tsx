'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Video,
  Image,
  Palette,
  Users,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Layers,
  Grid2X2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { t } from '@/lib/i18n';

const navSections = [
  {
    titleKey: 'nav.prompts' as const,
    items: [
      { href: '/prompts', labelKey: 'nav.prompt_library' as const, icon: BookOpen },
      { href: '/prompts/generate', labelKey: 'nav.ai_generator' as const, icon: Sparkles },
    ],
  },
  {
    titleKey: 'nav.image' as const,
    items: [
      { href: '/poster', labelKey: 'nav.product_poster' as const, icon: Image },
      { href: '/custom', labelKey: 'nav.custom_mode' as const, icon: Palette },
      { href: '/image/reference', labelKey: 'nav.multi_reference' as const, icon: Grid2X2 },
    ],
  },
  {
    titleKey: 'nav.video' as const,
    items: [
      { href: '/video/veo', labelKey: 'nav.veo_text' as const, icon: Video },
      { href: '/video/veo/image', labelKey: 'nav.veo_image' as const, icon: Image },
      { href: '/video/veo/frames', labelKey: 'nav.veo_frames' as const, icon: Layers },
      { href: '/video/sora', labelKey: 'nav.sora_text' as const, icon: Clapperboard },
      { href: '/video/sora/image', labelKey: 'nav.sora_image' as const, icon: Image },
      { href: '/video/kling', labelKey: 'nav.kling_text' as const, icon: Clapperboard },
      { href: '/video/kling/image', labelKey: 'nav.kling_image' as const, icon: Image },
      { href: '/video/batch', labelKey: 'nav.batch' as const, icon: Layers },
    ],
  },
  {
    titleKey: 'nav.manage' as const,
    items: [
      { href: '/accounts', labelKey: 'nav.accounts' as const, icon: Users },
      { href: '/history', labelKey: 'nav.history' as const, icon: History },
      { href: '/settings', labelKey: 'nav.settings' as const, icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, locale } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-border transition-all duration-200',
        sidebarOpen ? 'w-[280px]' : 'w-16'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
        {sidebarOpen ? (
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-[#0066CC] to-[#00A0E9] bg-clip-text text-transparent">
              瑞幸咖啡北美
            </span>
            <span className="text-xs text-muted-foreground">AI视频生产平台</span>
          </div>
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
            瑞幸
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-3 py-3">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all',
            pathname === '/'
              ? 'bg-primary text-white shadow-md shadow-primary/25'
              : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
          )}
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          {sidebarOpen && <span>{t('nav.dashboard', locale)}</span>}
        </Link>

        {navSections.map((section) => (
          <div key={section.titleKey} className="mt-5">
            {sidebarOpen && (
              <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(section.titleKey, locale)}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-all',
                      isActive
                        ? 'bg-primary text-white shadow-md shadow-primary/25'
                        : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {sidebarOpen && <span>{t(item.labelKey, locale)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border p-3">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
