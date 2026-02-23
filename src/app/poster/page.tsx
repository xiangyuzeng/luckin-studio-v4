'use client';

import { useState, useRef, useCallback } from 'react';
import { Image as ImageIcon, Upload, Download, Loader2, Sparkles, X, Type } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

type AspectRatio = '1:1' | '2:3' | '3:4' | '9:16' | '16:9';
type Resolution = '1024' | '2048' | '4096';

export default function PosterPage() {
  const { t, locale } = useI18n();

  const [productImage, setProductImage] = useState<File | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [bgImage, setBgImage] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);

  const [mainText, setMainText] = useState('');
  const [subText, setSubText] = useState('');
  const [extraText1, setExtraText1] = useState('');
  const [extraText2, setExtraText2] = useState('');
  const [extraText3, setExtraText3] = useState('');
  const [description, setDescription] = useState('');

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [resolution, setResolution] = useState<Resolution>('1024');
  const [batchCount, setBatchCount] = useState(1);

  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const productInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File, type: 'product' | 'bg') => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (type === 'product') {
      setProductImage(file);
      setProductPreview(url);
    } else {
      setBgImage(file);
      setBgPreview(url);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, type: 'product' | 'bg') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  }, [handleFileSelect]);

  const handleGenerate = async () => {
    if (!productImage) {
      toast.error(locale === 'cn' ? '请上传产品图片' : 'Please upload a product image');
      return;
    }

    setGenerating(true);
    try {
      const formData = new FormData();
      formData.append('productImage', productImage);
      if (bgImage) formData.append('backgroundImage', bgImage);
      formData.append('mainText', mainText);
      formData.append('subText', subText);
      formData.append('extraText1', extraText1);
      formData.append('extraText2', extraText2);
      formData.append('extraText3', extraText3);
      formData.append('description', description);
      formData.append('aspectRatio', aspectRatio);
      formData.append('resolution', resolution);
      formData.append('batchCount', String(batchCount));

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
      toast.success(locale === 'cn' ? '海报生成成功' : 'Poster generated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('poster.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('poster.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Image uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                {t('poster.product_image')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product image */}
              <div
                className="relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => productInputRef.current?.click()}
                onDrop={e => handleDrop(e, 'product')}
                onDragOver={e => e.preventDefault()}
              >
                {productPreview ? (
                  <div className="relative">
                    <img src={productPreview} alt="Product" className="max-h-40 mx-auto rounded" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-0 right-0"
                      onClick={e => { e.stopPropagation(); setProductImage(null); setProductPreview(null); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('poster.product_image_desc')}</p>
                  </>
                )}
                <input
                  ref={productInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'product')}
                />
              </div>

              {/* Background image */}
              <div>
                <p className="text-sm font-medium mb-2">{t('poster.background_image')}</p>
                <div
                  className="relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => bgInputRef.current?.click()}
                  onDrop={e => handleDrop(e, 'bg')}
                  onDragOver={e => e.preventDefault()}
                >
                  {bgPreview ? (
                    <div className="relative">
                      <img src={bgPreview} alt="Background" className="max-h-24 mx-auto rounded" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0"
                        onClick={e => { e.stopPropagation(); setBgImage(null); setBgPreview(null); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">{t('poster.background_image_desc')}</p>
                  )}
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0], 'bg')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                {locale === 'cn' ? '海报文字' : 'Poster Text'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">{t('poster.main_text')}</label>
                <Input value={mainText} onChange={e => setMainText(e.target.value)} placeholder="Luckin Coffee" />
              </div>
              <div>
                <label className="text-sm font-medium">{t('poster.sub_text')}</label>
                <Input value={subText} onChange={e => setSubText(e.target.value)} placeholder={locale === 'cn' ? '副标题' : 'Subtitle'} />
              </div>
              {[extraText1, extraText2, extraText3].map((val, i) => (
                <div key={i}>
                  <label className="text-sm font-medium">{t('poster.extra_text')} {i + 1}</label>
                  <Input
                    value={val}
                    onChange={e => {
                      const setters = [setExtraText1, setExtraText2, setExtraText3];
                      setters[i](e.target.value);
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('poster.description')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('poster.description_placeholder')}
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Config */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('poster.aspect_ratio')}</label>
                <div className="flex flex-wrap gap-2">
                  {(['1:1', '2:3', '3:4', '9:16', '16:9'] as AspectRatio[]).map(r => (
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
                <label className="text-sm font-medium">{t('poster.resolution')}</label>
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
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('poster.batch_count')}</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(n => (
                    <Button
                      key={n}
                      variant={batchCount === n ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setBatchCount(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !productImage}
            size="lg"
            className="w-full"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('poster.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('poster.generate')}
              </>
            )}
          </Button>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('poster.results')}</h2>
          {results.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t('poster.no_results')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((url, i) => (
                <Card key={i} className="overflow-hidden">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={`Poster ${i + 1}`} className="w-full object-cover" />
                  </a>
                  <CardContent className="p-3 flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <a href={url} download>
                        <Download className="h-3 w-3 mr-1" />
                        {t('poster.download')}
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
