'use client';

import { Play, Download, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/hooks/use-i18n';
import { useVideoStatus } from '@/hooks/use-video-generation';
import { useVideoStore, type VideoTaskState } from '@/stores/video-store';
import { StatusBadge } from '@/components/shared/status-badge';

interface TaskRowProps {
  task: VideoTaskState;
  modelLabel: string;
}

export function TaskRow({ task, modelLabel }: TaskRowProps) {
  const { locale } = useI18n();
  const removeTask = useVideoStore((s) => s.removeTask);

  // Poll status for non-terminal tasks
  useVideoStatus(
    task.status === 'pending' || task.status === 'processing' ? task.id : null
  );

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{task.prompt}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[10px]">
            {modelLabel}
          </Badge>
          <StatusBadge status={task.status} />
        </div>
        {(task.status === 'pending' || task.status === 'processing') && (
          <Progress value={task.progress} className="mt-2 h-1.5" />
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.status === 'completed' && task.resultUrl && (
          <>
            <Button variant="outline" size="sm" asChild>
              <a href={task.resultUrl} target="_blank" rel="noopener noreferrer">
                <Play className="h-3 w-3 mr-1" />
                {locale === 'cn' ? '查看' : 'View'}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={task.resultUrl} download>
                <Download className="h-3 w-3 mr-1" />
                {locale === 'cn' ? '下载' : 'Download'}
              </a>
            </Button>
          </>
        )}
        {(task.status === 'completed' || task.status === 'failed') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeTask(task.id)}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
        {(task.status === 'pending' || task.status === 'processing') && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
