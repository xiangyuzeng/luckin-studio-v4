'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Video,
  Loader2,
  Shield,
  Upload,
  ImageIcon,
  X,
} from 'lucide-react';
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

export default function VeoImagePage() {
  const { t, locale } = useI18n();

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<VeoModel>('veo3');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [duration, setDuration] = useState<Duration>(8);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useVideoGenerate();
  const activeTasks = useVideoStore((s) => s.activeTasks);
  const clearCompleted = useVideoStore((s) => s.clearCompleted);

  const editingPrompt = usePromptStore((s) => s.editingPrompt);
  const clearEditor = usePromptStore((s) => s.clearEditor);

  useEffect(() => {
    if (editingPrompt) {
      setPrompt(editingPrompt);
      clearEditor();
    }
  }, [editingPrompt, clearEditor]);

  const taskList = Object.values(activeTasks).sort((a, b) => {
    const order = { processing: 0, pending: 1, completed: 2, failed: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4);
  });

  const hasCompletedTasks = taskList.some(
    (task) => task.status === 'completed' || task.status === 'failed'
  );

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(locale === 'cn' ? '请选择图片文件' : 'Please select an image file');
      return;
    }
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, [locale]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error(locale === 'cn' ? '请输入提示词' : 'Please enter a prompt');
      return;
    }
    if (!imageFile) {
      toast.error(locale === 'cn' ? '请上传参考图片' : 'Please upload a reference image');
      return;
    }

    try {
      setIsUploading(true);

      // Upload image first
      const formData = new FormData();
      formData.append('file', imageFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Image upload failed');
      }

      const { url: inputImageUrl } = await uploadRes.json();
      setIsUploading(false);

      await generateMutation.mutateAsync({
        model,
        prompt: prompt.trim(),
        aspectRatio,
        duration,
        inputImageUrl,
      });
      toast.success(locale === 'cn' ? '任务已提交' : 'Task submitted successfully');
    } catch (err) {
      setIsUploading(false);
      toast.error(
        err instanceof Error
          ? err.message
          : locale === 'cn'
            ? '生成失败'
            : 'Generation failed'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('video.veo_image_title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'cn'
            ? '上传参考图片，使用 VEO 3.1 生成视频'
            : 'Upload a reference image and generate video with VEO 3.1'}
        </p>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-5 w-5 text-primary" />
            {locale === 'cn' ? '图生视频配置' : 'Image-to-Video Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('video.upload_image')}</label>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Reference"
                  className="max-h-48 rounded-lg border object-contain"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={clearImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed
                  cursor-pointer transition-colors
                  ${isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                  }
                `}
              >
                <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {t('video.drag_drop')}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  PNG, JPG, WebP
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {/* Note about VEO image-to-video support */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700">
              {locale === 'cn'
                ? '注意：图生视频功能需要配置图片上传服务。VEO 3.1 目前主要支持文生视频模式，图生视频支持将在后续版本中完善。'
                : 'Note: Image-to-video requires the upload service to be configured. VEO 3.1 currently primarily supports text-to-video mode; image-to-video support will be improved in future updates.'}
            </p>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('video.prompt')}</label>
              <PromptPolishButton prompt={prompt} onPolished={setPrompt} modelHint="veo" imageUrl={imagePreview ?? undefined} />
            </div>
            <Textarea
              placeholder={t('video.prompt_placeholder')}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
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
            disabled={generateMutation.isPending || isUploading || !prompt.trim() || !imageFile}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {locale === 'cn' ? '上传图片中...' : 'Uploading image...'}
              </>
            ) : generateMutation.isPending ? (
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
            <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{t('video.no_tasks')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'cn'
                ? '上传图片并提交生成任务'
                : 'Upload an image and submit a generation task'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
