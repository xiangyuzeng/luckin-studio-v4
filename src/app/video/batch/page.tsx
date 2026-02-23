'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Play,
  Download,
  Loader2,
  Trash2,
  Square,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/hooks/use-i18n';
import { useBatchStore, type BatchItem } from '@/stores/batch-store';
import { toast } from 'sonner';

const processBatch = async () => {
  const store = useBatchStore.getState();
  const pending = store.items.filter((i) => i.status === 'pending' && i.prompt.trim());

  for (let i = 0; i < pending.length; i += store.concurrency) {
    if (!useBatchStore.getState().isRunning) break;
    const chunk = pending.slice(i, i + store.concurrency);
    await Promise.all(
      chunk.map(async (item) => {
        try {
          // Upload image
          useBatchStore.getState().updateItem(item.id, { status: 'uploading' });
          const formData = new FormData();
          formData.append('file', item.file);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error('Upload failed');
          const { url } = await uploadRes.json();

          // Generate video
          useBatchStore.getState().updateItem(item.id, { status: 'generating', progress: 30 });
          const currentStore = useBatchStore.getState();
          const genRes = await fetch('/api/video/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: currentStore.model,
              prompt: item.prompt,
              aspectRatio: currentStore.aspectRatio,
              duration: currentStore.duration,
              inputImageUrl: url,
            }),
          });
          if (!genRes.ok) throw new Error('Generation failed');
          const { taskId } = await genRes.json();
          useBatchStore.getState().updateItem(item.id, { taskId, progress: 60 });

          // Poll for completion
          let attempts = 0;
          while (attempts < 120) {
            await new Promise((r) => setTimeout(r, 5000));
            const statusRes = await fetch(`/api/video/status/${taskId}`);
            if (!statusRes.ok) break;
            const status = await statusRes.json();
            if (status.status === 'completed') {
              useBatchStore
                .getState()
                .updateItem(item.id, { status: 'completed', resultUrl: status.resultUrl, progress: 100 });
              break;
            }
            if (status.status === 'failed') {
              useBatchStore.getState().updateItem(item.id, { status: 'failed', progress: 0 });
              break;
            }
            useBatchStore
              .getState()
              .updateItem(item.id, { progress: Math.min(90, 60 + attempts) });
            attempts++;
          }
        } catch {
          useBatchStore.getState().updateItem(item.id, { status: 'failed', progress: 0 });
        }
      })
    );
  }
  useBatchStore.getState().setIsRunning(false);
};

export default function BatchPage() {
  const { t, locale } = useI18n();

  const items = useBatchStore((s) => s.items);
  const model = useBatchStore((s) => s.model);
  const aspectRatio = useBatchStore((s) => s.aspectRatio);
  const duration = useBatchStore((s) => s.duration);
  const concurrency = useBatchStore((s) => s.concurrency);
  const isRunning = useBatchStore((s) => s.isRunning);
  const addItems = useBatchStore((s) => s.addItems);
  const removeItem = useBatchStore((s) => s.removeItem);
  const updateItem = useBatchStore((s) => s.updateItem);
  const setModel = useBatchStore((s) => s.setModel);
  const setAspectRatio = useBatchStore((s) => s.setAspectRatio);
  const setDuration = useBatchStore((s) => s.setDuration);
  const setConcurrency = useBatchStore((s) => s.setConcurrency);
  const setIsRunning = useBatchStore((s) => s.setIsRunning);
  const clearAll = useBatchStore((s) => s.clearAll);

  const [isDragging, setIsDragging] = useState(false);
  const [isAutoPrompting, setIsAutoPrompting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const overallProgress =
    items.length > 0
      ? Math.round(items.reduce((sum, i) => sum + i.progress, 0) / items.length)
      : 0;

  const handleFilesAdd = useCallback(
    (files: FileList | File[]) => {
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        toast.error(locale === 'cn' ? '请选择图片文件' : 'Please select image files');
        return;
      }
      const newItems: BatchItem[] = imageFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        prompt: '',
        status: 'pending' as const,
        progress: 0,
      }));
      addItems(newItems);
    },
    [addItems, locale]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFilesAdd(e.dataTransfer.files);
      }
    },
    [handleFilesAdd]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleAutoPrompts = async () => {
    const needPrompt = items.filter((i) => !i.prompt.trim());
    if (needPrompt.length === 0) {
      toast.info(locale === 'cn' ? '所有项目都已有提示词' : 'All items already have prompts');
      return;
    }

    setIsAutoPrompting(true);
    let successCount = 0;

    for (const item of needPrompt) {
      try {
        // Upload the image to get a URL for the polish API
        const formData = new FormData();
        formData.append('file', item.file);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!uploadRes.ok) continue;
        const { url } = await uploadRes.json();

        const res = await fetch('/api/prompts/polish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Describe this image for video generation',
            imageUrl: url,
            modelHint: model.startsWith('kling') ? 'kling' : 'sora',
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        updateItem(item.id, { prompt: data.polished });
        successCount++;
      } catch {
        // Continue with next item
      }
    }

    setIsAutoPrompting(false);
    toast.success(
      locale === 'cn'
        ? `已为 ${successCount} 个项目生成提示词`
        : `Generated prompts for ${successCount} items`
    );
  };

  const handleStart = () => {
    const ready = items.filter((i) => i.status === 'pending' && i.prompt.trim());
    if (ready.length === 0) {
      toast.error(
        locale === 'cn'
          ? '没有可处理的项目（需要提示词）'
          : 'No items ready to process (prompts required)'
      );
      return;
    }
    setIsRunning(true);
    processBatch();
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('batch.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('batch.subtitle')}</p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center p-10 rounded-lg border-2 border-dashed
              cursor-pointer transition-colors
              ${isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              {locale === 'cn'
                ? '拖拽多张图片到此处，或点击选择'
                : 'Drag & drop multiple images here, or click to select'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, WebP</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesAdd(e.target.files);
              }
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>

      {/* Settings Bar */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {locale === 'cn' ? '批量设置' : 'Batch Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('video.model')}</label>
              <div className="flex gap-2">
                <Button
                  variant={model === 'sora2' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setModel('sora2')}
                  disabled={isRunning}
                >
                  Sora 2
                </Button>
                <Button
                  variant={model === 'kling26' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setModel('kling26')}
                  disabled={isRunning}
                >
                  Kling 2.6
                </Button>
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('video.aspect_ratio')}</label>
              <div className="flex gap-2">
                {['16:9', '9:16', '1:1'].map((ratio) => (
                  <Button
                    key={ratio}
                    variant={aspectRatio === ratio ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAspectRatio(ratio)}
                    disabled={isRunning}
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
                {[5, 10, 15].map((d) => (
                  <Button
                    key={d}
                    variant={duration === d ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDuration(d)}
                    disabled={isRunning}
                    className="min-w-[60px]"
                  >
                    {d}s
                  </Button>
                ))}
              </div>
            </div>

            {/* Concurrency */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {locale === 'cn' ? '并发数' : 'Concurrency'}
              </label>
              <div className="flex gap-2">
                {([1, 3, 5] as const).map((c) => (
                  <Button
                    key={c}
                    variant={concurrency === c ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConcurrency(c)}
                    disabled={isRunning}
                    className="min-w-[60px]"
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoPrompts}
                disabled={isRunning || isAutoPrompting}
              >
                {isAutoPrompting ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {locale === 'cn' ? '生成中...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1" />
                    {locale === 'cn' ? '自动生成全部提示词' : 'Auto-generate all prompts'}
                  </>
                )}
              </Button>
              {isRunning ? (
                <Button variant="destructive" size="sm" onClick={handleStop}>
                  <Square className="h-3 w-3 mr-1" />
                  {locale === 'cn' ? '停止' : 'Stop'}
                </Button>
              ) : (
                <Button size="sm" onClick={handleStart}>
                  <Play className="h-3 w-3 mr-1" />
                  {locale === 'cn' ? '开始批量处理' : 'Start Batch'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isRunning}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {locale === 'cn' ? '清空' : 'Clear All'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Progress */}
      {items.length > 0 && isRunning && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {locale === 'cn' ? '总体进度' : 'Overall Progress'}
              </span>
              <span className="text-sm text-muted-foreground">
                {completedCount}/{items.length} ({overallProgress}%)
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Items Grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge
                    variant={
                      item.status === 'completed'
                        ? 'default'
                        : item.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {item.status === 'pending' && (locale === 'cn' ? '待处理' : 'Pending')}
                    {item.status === 'uploading' && (locale === 'cn' ? '上传中' : 'Uploading')}
                    {item.status === 'generating' && (locale === 'cn' ? '生成中' : 'Generating')}
                    {item.status === 'completed' && (locale === 'cn' ? '已完成' : 'Completed')}
                    {item.status === 'failed' && (locale === 'cn' ? '失败' : 'Failed')}
                  </Badge>
                </div>
                {(item.status === 'uploading' || item.status === 'generating') && (
                  <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
                    <Progress value={item.progress} className="h-1.5" />
                  </div>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <Textarea
                  placeholder={locale === 'cn' ? '输入提示词...' : 'Enter prompt...'}
                  value={item.prompt}
                  onChange={(e) => updateItem(item.id, { prompt: e.target.value })}
                  rows={2}
                  className="resize-none text-xs"
                  disabled={item.status !== 'pending'}
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {item.status === 'completed' && item.resultUrl && (
                      <>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <a href={item.resultUrl} target="_blank" rel="noopener noreferrer">
                            <Play className="h-3 w-3 mr-1" />
                            {locale === 'cn' ? '查看' : 'View'}
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <a href={item.resultUrl} download>
                            <Download className="h-3 w-3 mr-1" />
                            {locale === 'cn' ? '下载' : 'Download'}
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                    disabled={isRunning && (item.status === 'uploading' || item.status === 'generating')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {locale === 'cn' ? '暂无批量任务' : 'No batch items yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'cn'
                ? '拖拽图片到上方区域开始批量处理'
                : 'Drag images to the upload zone above to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
