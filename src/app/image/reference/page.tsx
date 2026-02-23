'use client';

import { useState, useRef, useCallback } from 'react';
import { Grid2X2, Upload, Download, Loader2, X, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/hooks/use-i18n';
import { PromptPolishButton } from '@/components/shared/prompt-polish-button';
import { toast } from 'sonner';

type Mode = 4 | 10;
type AspectRatio = '1:1' | '2:3' | '3:4' | '9:16' | '16:9' | '4:3';
type Resolution = 1024 | 2048 | 4096;

export default function MultiImageReferencePage() {
  const { t, locale } = useI18n();

  const [mode, setMode] = useState<Mode>(4);
  const [images, setImages] = useState<(File | null)[]>(Array(4).fill(null));
  const [previews, setPreviews] = useState<(string | null)[]>(Array(4).fill(null));
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resolution, setResolution] = useState<Resolution>(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleModeChange = useCallback(
    (newMode: Mode) => {
      setMode(newMode);
      setImages((prev) => {
        if (newMode > prev.length) {
          return [...prev, ...Array(newMode - prev.length).fill(null)];
        }
        // Revoke URLs for removed slots
        for (let i = newMode; i < prev.length; i++) {
          const preview = previews[i];
          if (preview) URL.revokeObjectURL(preview);
        }
        return prev.slice(0, newMode);
      });
      setPreviews((prev) => {
        if (newMode > prev.length) {
          return [...prev, ...Array(newMode - prev.length).fill(null)];
        }
        return prev.slice(0, newMode);
      });
    },
    [previews]
  );

  const handleFileSelect = useCallback(
    (file: File, index: number) => {
      if (!file.type.startsWith('image/')) {
        toast.error(locale === 'cn' ? '请选择图片文件' : 'Please select an image file');
        return;
      }
      const preview = URL.createObjectURL(file);

      setImages((prev) => {
        const next = [...prev];
        next[index] = file;
        return next;
      });
      setPreviews((prev) => {
        const next = [...prev];
        if (next[index]) URL.revokeObjectURL(next[index]!);
        next[index] = preview;
        return next;
      });
    },
    [locale]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file, index);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setPreviews((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index]!);
      next[index] = null;
      return next;
    });
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = '';
    }
  }, []);

  const handleGenerate = async () => {
    const uploadedImages = images.filter((img): img is File => img !== null);
    if (uploadedImages.length === 0) {
      toast.error(locale === 'cn' ? '请至少上传一张参考图' : 'Please upload at least one reference image');
      return;
    }
    if (!prompt.trim()) {
      toast.error(locale === 'cn' ? '请输入描述' : 'Please enter a description');
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      images.forEach((img, idx) => {
        if (img) {
          formData.append(`referenceImage_${idx}`, img);
        }
      });
      formData.append('description', prompt.trim());
      formData.append('aspectRatio', aspectRatio);
      formData.append('resolution', String(resolution));
      formData.append('batchCount', '1');

      const res = await fetch('/api/poster/generate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      const urls: string[] = Array.isArray(data.urls)
        ? data.urls
        : data.url
          ? [data.url]
          : [];
      setResults(urls);
      toast.success(locale === 'cn' ? '生成完成' : 'Generation completed');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : locale === 'cn'
            ? '生成失败'
            : 'Generation failed'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const resolutionLabels: Record<Resolution, string> = {
    1024: '1K (1024)',
    2048: '2K (2048)',
    4096: '4K (4096)',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('image.reference_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('image.reference_subtitle')}</p>
      </div>

      {/* Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Grid2X2 className="h-5 w-5 text-primary" />
            {locale === 'cn' ? '参考图配置' : 'Reference Image Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'cn' ? '模式' : 'Mode'}
            </label>
            <div className="flex gap-2">
              <Button
                variant={mode === 4 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange(4)}
              >
                {locale === 'cn' ? '4 图模式' : '4 Images'}
              </Button>
              <Button
                variant={mode === 10 ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange(10)}
              >
                {locale === 'cn' ? '10 图模式' : '10 Images'}
              </Button>
            </div>
          </div>

          {/* Image Grid */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'cn' ? '参考图片' : 'Reference Images'}
            </label>
            <div
              className={`grid gap-3 ${
                mode === 4 ? 'grid-cols-2' : 'grid-cols-5'
              }`}
            >
              {Array.from({ length: mode }).map((_, index) => (
                <div key={index} className="relative">
                  {previews[index] ? (
                    <div className="relative aspect-square rounded-lg border overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previews[index]!}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ) : (
                    <div
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRefs.current[index]?.click()}
                      className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Upload className="h-5 w-5 text-muted-foreground/40 mb-1" />
                      <span className="text-[10px] text-muted-foreground/60">{index + 1}</span>
                    </div>
                  )}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file, index);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {locale === 'cn' ? '描述' : 'Description'}
              </label>
              <PromptPolishButton
                prompt={prompt}
                onPolished={setPrompt}
                modelHint="image"
              />
            </div>
            <Textarea
              placeholder={
                locale === 'cn'
                  ? '描述你想生成的图片风格和内容...'
                  : 'Describe the style and content you want to generate...'
              }
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'cn' ? '宽高比' : 'Aspect Ratio'}
            </label>
            <div className="flex flex-wrap gap-2">
              {(['1:1', '2:3', '3:4', '9:16', '16:9', '4:3'] as AspectRatio[]).map((ratio) => (
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

          {/* Resolution */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {locale === 'cn' ? '分辨率' : 'Resolution'}
            </label>
            <div className="flex gap-2">
              {([1024, 2048, 4096] as Resolution[]).map((res) => (
                <Button
                  key={res}
                  variant={resolution === res ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setResolution(res)}
                >
                  {resolutionLabels[res]}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !prompt.trim() ||
              images.every((img) => img === null)
            }
            className="w-full sm:w-auto"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {locale === 'cn' ? '生成中...' : 'Generating...'}
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4 mr-2" />
                {locale === 'cn' ? '生成图片' : 'Generate Image'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {locale === 'cn' ? '生成结果' : 'Generated Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((url, index) => (
                <div key={index} className="relative group rounded-lg border overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Generated ${index + 1}`}
                    className="w-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={url} download>
                        <Download className="h-3 w-3 mr-1" />
                        {locale === 'cn' ? '下载' : 'Download'}
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {results.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Grid2X2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {locale === 'cn' ? '暂无生成结果' : 'No generated results yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {locale === 'cn'
                ? '上传参考图片并提交生成任务'
                : 'Upload reference images and submit a generation task'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
