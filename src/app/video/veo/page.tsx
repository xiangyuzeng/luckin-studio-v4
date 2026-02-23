'use client';

import { useState, useEffect } from 'react';
import { Video, Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { useVideoGenerate } from '@/hooks/use-video-generation';
import { useVideoStore } from '@/stores/video-store';
import { usePromptStore } from '@/stores/prompt-store';
import { TaskRow } from '@/components/shared/task-row';
import { PromptPolishButton } from '@/components/shared/prompt-polish-button';
import { PromptExamples } from '@/components/shared/prompt-examples';
import { toast } from 'sonner';

type VeoModel = 'veo3' | 'veo3_fast';
type AspectRatio = '9:16' | '16:9' | '1:1';
type Duration = 5 | 8 | 15;

export default function VeoTextPage() {
  const { t, locale } = useI18n();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<VeoModel>('veo3');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [duration, setDuration] = useState<Duration>(8);

  const generateMutation = useVideoGenerate();
  const activeTasks = useVideoStore((s) => s.activeTasks);
  const clearCompleted = useVideoStore((s) => s.clearCompleted);

  // Pre-populate from prompt store
  const editingPrompt = usePromptStore((s) => s.editingPrompt);
  const clearEditor = usePromptStore((s) => s.clearEditor);

  useEffect(() => {
    if (editingPrompt) {
      setPrompt(editingPrompt);
      clearEditor();
    }
  }, [editingPrompt, clearEditor]);

  const taskList = Object.values(activeTasks).sort(
    (a, b) => {
      // Show processing/pending first, then completed/failed
      const order = { processing: 0, pending: 1, completed: 2, failed: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    }
  );

  const hasCompletedTasks = taskList.some(
    (t) => t.status === 'completed' || t.status === 'failed'
  );

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(locale === 'cn' ? '请输入提示词' : 'Please enter a prompt');
      return;
    }

    try {
      await generateMutation.mutateAsync({
        model,
        prompt: prompt.trim(),
        aspectRatio,
        duration,
      });
      toast.success(locale === 'cn' ? '任务已提交' : 'Task submitted successfully');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : locale === 'cn' ? '生成失败' : 'Generation failed'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('video.veo_title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'cn'
            ? '使用 Google VEO 3.1 从文本生成视频'
            : 'Generate videos from text prompts using Google VEO 3.1'}
        </p>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="h-5 w-5 text-primary" />
            {locale === 'cn' ? '视频配置' : 'Video Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('video.prompt')}</label>
              <PromptPolishButton prompt={prompt} onPolished={setPrompt} modelHint="veo" />
            </div>
            <Textarea
              placeholder={t('video.prompt_placeholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <PromptExamples category="video" onSelect={setPrompt} />
          </div>

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('video.model')}</label>
            <div className="flex gap-2">
              <Button
                variant={model === 'veo3' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModel('veo3')}
              >
                VEO 3.1
              </Button>
              <Button
                variant={model === 'veo3_fast' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setModel('veo3_fast')}
              >
                VEO 3.1 Fast
              </Button>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('video.aspect_ratio')}</label>
            <div className="flex gap-2">
              {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((ratio) => (
                <Button
                  key={ratio}
                  variant={aspectRatio === ratio ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAspectRatio(ratio)}
                  className="min-w-[60px]"
                >
                  {ratio}
                </Button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('video.duration')}</label>
            <div className="flex gap-2">
              {([5, 8, 15] as Duration[]).map((d) => (
                <Button
                  key={d}
                  variant={duration === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(d)}
                  className="min-w-[60px]"
                >
                  {d}s
                </Button>
              ))}
            </div>
          </div>

          {/* Brand Constraints */}
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {t('video.brand_constraints')}
            </Badge>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !prompt.trim()}
            className="w-full sm:w-auto"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('video.generating')}
              </>
            ) : (
              <>
                <Video className="h-4 w-4 mr-2" />
                {t('video.generate')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Tasks */}
      {taskList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('video.active_tasks')}</h2>
            {hasCompletedTasks && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                {locale === 'cn' ? '清除已完成' : 'Clear Completed'}
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {taskList.map((task) => (
              <TaskRow key={task.id} task={task} modelLabel={task.model === 'veo3' ? 'VEO 3.1' : 'VEO 3.1 Fast'} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {taskList.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t('video.no_tasks')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'cn'
                ? '提交生成任务后，进度将在此处显示'
                : 'Submit a generation task and track progress here'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
