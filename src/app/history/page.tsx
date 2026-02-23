'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ExternalLink,
  Download,
  Loader2,
  Filter,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/use-i18n';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ALL_MODELS } from '@/lib/kie-models';
import type { VideoTask, VideoStatus } from '@/types/video';

async function fetchTasks(filters: {
  status?: string;
  model?: string;
  page?: number;
  limit?: number;
}): Promise<{ tasks: VideoTask[]; total: number }> {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.model && filters.model !== 'all') params.set('model', filters.model);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/video/tasks?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

const STATUS_OPTIONS: { value: string; label_en: string; label_cn: string }[] = [
  { value: 'all', label_en: 'All', label_cn: '全部' },
  { value: 'pending', label_en: 'Pending', label_cn: '等待中' },
  { value: 'processing', label_en: 'Processing', label_cn: '处理中' },
  { value: 'completed', label_en: 'Completed', label_cn: '已完成' },
  { value: 'failed', label_en: 'Failed', label_cn: '失败' },
];

function formatDate(ts: number): string {
  if (!ts) return '-';
  // Handle both seconds and milliseconds timestamps
  const ms = ts < 1e12 ? ts * 1000 : ts;
  return new Date(ms).toLocaleString();
}

function getModelLabel(modelKey: string): string {
  const found = ALL_MODELS.find((m) => m.value === modelKey);
  return found?.label ?? modelKey;
}

export default function HistoryPage() {
  const { t, locale } = useI18n();
  const [statusFilter, setStatusFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const filters = useMemo(
    () => ({
      status: statusFilter,
      model: modelFilter,
      page,
      limit,
    }),
    [statusFilter, modelFilter, page]
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetchTasks(filters),
  });

  const tasks = data?.tasks || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('history.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'cn'
            ? '查看和管理过去的视频生成任务'
            : 'View and manage past video generation tasks'}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {locale === 'cn' ? '筛选' : 'Filters'}
            </span>
          </div>
          <div className="flex flex-1 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('history.filter_status')}</label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {locale === 'cn' ? opt.label_cn : opt.label_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">{t('history.filter_model')}</label>
              <Select
                value={modelFilter}
                onValueChange={(v) => {
                  setModelFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {locale === 'cn' ? '全部' : 'All'}
                  </SelectItem>
                  {ALL_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {total > 0 && (
            <div className="flex items-end">
              <span className="text-xs text-muted-foreground">
                {total} {locale === 'cn' ? '条记录' : 'tasks'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-destructive">
              {locale === 'cn' ? '加载失败' : 'Failed to load tasks'}
            </p>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <EmptyState message={t('history.no_tasks')} />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 py-4">
                {/* Prompt and metadata */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.prompt}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {getModelLabel(task.model)}
                    </Badge>
                    <StatusBadge status={task.status} />
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDate(task.created_at)}
                    </span>
                    {task.aspect_ratio && (
                      <span className="text-[10px] text-muted-foreground">
                        {task.aspect_ratio}
                      </span>
                    )}
                    {task.duration_seconds && (
                      <span className="text-[10px] text-muted-foreground">
                        {task.duration_seconds}s
                      </span>
                    )}
                  </div>
                  {task.error_message && (
                    <p className="text-xs text-destructive mt-1 truncate">
                      {task.error_message}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {task.status === 'completed' && task.result_url && (
                    <>
                      <Button variant="outline" size="sm" asChild>
                        <a href={task.result_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          {locale === 'cn' ? '查看' : 'View'}
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={task.result_url} download>
                          <Download className="h-3 w-3 mr-1" />
                          {t('video.download')}
                        </a>
                      </Button>
                    </>
                  )}
                  {(task.status === 'pending' || task.status === 'processing') && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {locale === 'cn' ? '上一页' : 'Previous'}
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {locale === 'cn' ? '下一页' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  );
}
