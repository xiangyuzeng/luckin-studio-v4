'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/hooks/use-i18n';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { useAppStore } from '@/stores/app-store';
import { ALL_MODELS, type ModelKey } from '@/lib/kie-models';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type AspectRatio = '9:16' | '16:9' | '1:1';
type Duration = '5' | '8' | '15';

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const setLocale = useAppStore((s) => s.setLocale);

  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [defaultModel, setDefaultModel] = useState<string>('veo3');
  const [defaultRatio, setDefaultRatio] = useState<AspectRatio>('9:16');
  const [defaultDuration, setDefaultDuration] = useState<Duration>('8');
  const [language, setLanguage] = useState<'en' | 'cn'>(locale);

  // Load settings on mount
  useEffect(() => {
    if (settings) {
      setApiKey(settings.kie_api_key || '');
      setOpenaiApiKey(settings.openai_api_key || '');
      setGeminiApiKey(settings.gemini_api_key || '');
      setDefaultModel(settings.default_model || 'veo3');
      setDefaultRatio((settings.default_aspect_ratio as AspectRatio) || '9:16');
      setDefaultDuration((settings.default_duration as Duration) || '8');
      setLanguage((settings.locale as 'en' | 'cn') || 'en');
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        kie_api_key: apiKey,
        openai_api_key: openaiApiKey,
        gemini_api_key: geminiApiKey,
        default_model: defaultModel,
        default_aspect_ratio: defaultRatio,
        default_duration: defaultDuration,
        locale: language,
      });

      // Update app-level locale
      setLocale(language);

      toast.success(t('settings.saved'));
    } catch {
      toast.error(locale === 'cn' ? '保存失败' : 'Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {locale === 'cn' ? '配置应用偏好和默认设置' : 'Configure application preferences and defaults'}
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {locale === 'cn' ? '配置应用偏好和默认设置' : 'Configure application preferences and defaults'}
        </p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.api_key')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="kie-xxxxxxxxxxxx"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'cn'
                ? '用于 KIE.AI 视频生成网关的全局 API 密钥'
                : 'Global API key used for the KIE.AI video generation gateway'}
            </p>
          </CardContent>
        </Card>

        {/* OpenAI API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.openai_api_key')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showOpenaiKey ? 'text' : 'password'}
                  value={openaiApiKey}
                  onChange={(e) => setOpenaiApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                >
                  {showOpenaiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'cn'
                ? '用于 AI 提示词生成，可选 (优先级最高)'
                : 'For AI prompt generation, optional (highest priority)'}
            </p>
          </CardContent>
        </Card>

        {/* Gemini API Key */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.gemini_api_key')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIza..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'cn'
                ? '用于 AI 提示词生成，可选 (第二优先级)'
                : 'For AI prompt generation, optional (second priority)'}
            </p>
          </CardContent>
        </Card>

        {/* Default Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.default_model')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                    <span className="text-muted-foreground ml-2 text-xs">({m.engine})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'cn'
                ? '新建视频生成任务时使用的默认模型'
                : 'Default model used when creating new video generation tasks'}
            </p>
          </CardContent>
        </Card>

        {/* Default Aspect Ratio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.default_ratio')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((ratio) => (
                <Button
                  key={ratio}
                  variant={defaultRatio === ratio ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDefaultRatio(ratio)}
                  className="min-w-[60px]"
                >
                  {ratio}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {locale === 'cn'
                ? '9:16 适合短视频平台，16:9 适合横屏播放'
                : '9:16 for short-form platforms, 16:9 for landscape playback'}
            </p>
          </CardContent>
        </Card>

        {/* Default Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.default_duration')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {(['5', '8', '15'] as Duration[]).map((d) => (
                <Button
                  key={d}
                  variant={defaultDuration === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDefaultDuration(d)}
                  className="min-w-[60px]"
                >
                  {d}s
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settings.language')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
                className="min-w-[80px]"
              >
                English
              </Button>
              <Button
                variant={language === 'cn' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('cn')}
                className="min-w-[80px]"
              >
                中文
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            size="lg"
            className="min-w-[160px]"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('settings.save')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
