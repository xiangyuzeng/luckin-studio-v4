'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Save, Video, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/hooks/use-i18n';
import { useGeneratePrompts, useCreatePrompt } from '@/hooks/use-prompts';
import { usePromptStore } from '@/stores/prompt-store';
import { PROMPT_CATEGORIES, type PromptCategory, type GeneratedPrompt } from '@/types/prompt';
import { toast } from 'sonner';

const COUNT_OPTIONS = [3, 5, 10, 20] as const;

export default function GeneratePage() {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [category, setCategory] = useState<PromptCategory>('coffee');
  const [brief, setBrief] = useState('');
  const [count, setCount] = useState<number>(5);
  const [results, setResults] = useState<GeneratedPrompt[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const generateMutation = useGeneratePrompts();
  const createPromptMutation = useCreatePrompt();
  const setEditingPrompt = usePromptStore((s) => s.setEditingPrompt);

  const handleGenerate = async () => {
    if (!brief.trim()) {
      toast.error('Please enter a creative brief');
      return;
    }

    try {
      const data = await generateMutation.mutateAsync({ category, brief, count });
      setResults(data.prompts);
      setSavedIds(new Set());
      toast.success(`Generated ${data.prompts.length} prompts`);
    } catch {
      toast.error('Failed to generate prompts');
    }
  };

  const handleSaveToLibrary = async (prompt: GeneratedPrompt, index: number) => {
    try {
      await createPromptMutation.mutateAsync({
        category,
        title_en: prompt.title_en,
        title_cn: prompt.title_cn,
        description: prompt.description,
        style: prompt.style,
        camera: prompt.camera,
        lighting: prompt.lighting,
        shot_list: prompt.shot_list,
        negative_prompts: prompt.negative_prompts,
        audio: prompt.audio,
        is_custom: true,
      });
      setSavedIds((prev) => new Set(prev).add(index));
      toast.success('Saved to library');
    } catch {
      toast.error('Failed to save prompt');
    }
  };

  const handleSendToVeo = (prompt: GeneratedPrompt) => {
    setEditingPrompt(prompt.description);
    router.push('/video/veo');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('generator.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'cn'
            ? '使用 AI 为瑞幸咖啡视频生成创意提示词'
            : 'Generate creative video prompts for Luckin Coffee with AI'}
        </p>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-primary" />
            {locale === 'cn' ? '生成配置' : 'Generation Settings'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('generator.category')}</label>
            <Select value={category} onValueChange={(v) => setCategory(v as PromptCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {locale === 'cn' ? cat.label_cn : cat.label_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brief */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('generator.brief')}</label>
            <Textarea
              placeholder={t('generator.brief_placeholder')}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('generator.count')}</label>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map((n) => (
                <Button
                  key={n}
                  variant={count === n ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCount(n)}
                  className="min-w-[48px]"
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !brief.trim()}
            className="w-full sm:w-auto"
            size="lg"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('generator.generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {t('generator.generate')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading State */}
      {generateMutation.isPending && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !generateMutation.isPending && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {locale === 'cn' ? '生成结果' : 'Generated Prompts'}
            </h2>
            <Badge variant="outline" className="text-xs">
              {results.length} {locale === 'cn' ? '条' : 'prompts'}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((prompt, index) => (
              <Card key={index} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold line-clamp-2">
                    {locale === 'cn' ? prompt.title_cn : prompt.title_en}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <p className="text-xs text-muted-foreground line-clamp-4 flex-1 mb-4">
                    {prompt.description}
                  </p>

                  {/* Meta badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {prompt.style && (
                      <Badge variant="outline" className="text-[10px]">
                        {prompt.style}
                      </Badge>
                    )}
                    {prompt.camera && (
                      <Badge variant="outline" className="text-[10px]">
                        {prompt.camera}
                      </Badge>
                    )}
                    {prompt.lighting && (
                      <Badge variant="outline" className="text-[10px]">
                        {prompt.lighting}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={savedIds.has(index) || createPromptMutation.isPending}
                      onClick={() => handleSaveToLibrary(prompt, index)}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {savedIds.has(index)
                        ? locale === 'cn'
                          ? '已保存'
                          : 'Saved'
                        : t('generator.save_to_library')}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleSendToVeo(prompt)}
                    >
                      <Video className="h-3 w-3 mr-1" />
                      {t('generator.send_to_veo')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
