'use client';

import { useState } from 'react';
import { Sparkles, Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';
import { toast } from 'sonner';

interface PromptPolishButtonProps {
  prompt: string;
  onPolished: (newPrompt: string) => void;
  imageUrl?: string;
  modelHint?: 'sora' | 'kling' | 'veo' | 'image';
  disabled?: boolean;
}

export function PromptPolishButton({
  prompt,
  onPolished,
  imageUrl,
  modelHint,
  disabled,
}: PromptPolishButtonProps) {
  const { locale } = useI18n();
  const [isPolishing, setIsPolishing] = useState(false);
  const [previousPrompt, setPreviousPrompt] = useState<string | null>(null);

  const handlePolish = async () => {
    if (!prompt.trim()) {
      toast.error(locale === 'cn' ? '请先输入提示词' : 'Please enter a prompt first');
      return;
    }

    setIsPolishing(true);
    try {
      const res = await fetch('/api/prompts/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          modelHint,
          imageUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Polish failed');
      }

      const data = await res.json();
      setPreviousPrompt(prompt);
      onPolished(data.polished);
      toast.success(locale === 'cn' ? '提示词已优化' : 'Prompt polished');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Polish failed');
    } finally {
      setIsPolishing(false);
    }
  };

  const handleUndo = () => {
    if (previousPrompt !== null) {
      onPolished(previousPrompt);
      setPreviousPrompt(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePolish}
        disabled={disabled || isPolishing || !prompt.trim()}
        className="h-7 text-xs gap-1"
      >
        {isPolishing ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            {locale === 'cn' ? '润色中...' : 'Polishing...'}
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3" />
            {locale === 'cn' ? '✨ AI 润色' : '✨ Polish'}
          </>
        )}
      </Button>
      {previousPrompt !== null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          className="h-7 text-xs gap-1 text-muted-foreground"
        >
          <Undo2 className="h-3 w-3" />
          {locale === 'cn' ? '撤销' : 'Undo'}
        </Button>
      )}
    </div>
  );
}
