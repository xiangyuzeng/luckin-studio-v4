'use client';

import { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Upload, Download, Loader2, Sparkles, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/hooks/use-i18n';
import { PromptPolishButton } from '@/components/shared/prompt-polish-button';
import { toast } from 'sonner';

type AspectRatio = '1:1' | '2:3' | '3:4' | '9:16' | '16:9' | '4:3';
type Resolution = '1024' | '2048' | '4096';

export default function CustomPage() {
  const { t, locale } = useI18n();

  const [refImage, setRefImage] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resolution, setResolution] = useState<Resolution>('1024');

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setRefImage(file);
    setRefPreview(url);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImage) {
      toast.error(locale === 'cn' ? '请输入提示词或上传参考图片' : 'Please enter a prompt or upload a reference image');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      if (refImage) formData.append('productImage', refImage);
      formData.append('description', prompt);
      formData.append('aspectRatio', aspectRatio);
      formData.append('resolution', resolution);
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
      setResults(prev => [...data.images, ...prev]);
      toast.success(locale === 'cn' ? '图片生成成功' : 'Image generated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('custom.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('custom.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Reference image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                {t('custom.reference_image')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                {refPreview ? (
                  <div className="relative">
                    <img src={refPreview} alt="Reference" className="max-h-40 mx-auto rounded" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={e => { e.stopPropagation(); setRefImage(null); setRefPreview(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('custom.reference_image_desc')}</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
              </div>
            </CardContent>
          </Card>

          {/* Prompt */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {t('custom.prompt')}
                </CardTitle>
                <PromptPolishButton prompt={prompt} onPolished={setPrompt} modelHint="image" />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder={t('custom.prompt_placeholder')}
                rows={8}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Config */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'cn' ? '宽高比' : 'Aspect Ratio'}</label>
                <div className="flex flex-wrap gap-2">
                  {(['1:1', '2:3', '3:4', '9:16', '16:9', '4:3'] as AspectRatio[]).map(r => (
                    <Button
                      key={r}
                      variant={aspectRatio === r ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAspectRatio(r)}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{locale === 'cn' ? '分辨率' : 'Resolution'}</label>
                <div className="flex gap-2">
                  {([['1024', '1K'], ['2048', '2K'], ['4096', '4K']] as [Resolution, string][]).map(([v, label]) => (
                    <Button
                      key={v}
                      variant={resolution === v ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setResolution(v)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={generating || (!prompt.trim() && !refImage)}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('custom.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('custom.generate')}
              </>
            )}
          </Button>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('custom.results')}</h2>
          {results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t('custom.no_results')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((url, i) => (
                <Card key={i} className="overflow-hidden">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Image ${i + 1}`} className="w-full object-cover" />
                  </a>
                  <CardContent className="p-3 flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <a href={url} download>
                        <Download className="h-3 w-3 mr-1" />
                        {locale === 'cn' ? '下载' : 'Download'}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
