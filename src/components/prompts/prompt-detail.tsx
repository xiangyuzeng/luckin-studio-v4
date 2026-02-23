'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CopyButton } from '@/components/shared/copy-button';
import { Camera, Sun, Clock, Scissors, Video, MapPin, Music } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { usePromptStore } from '@/stores/prompt-store';

interface PromptDetailProps {
  prompt: any;
  open: boolean;
  onClose: () => void;
}

export function PromptDetail({ prompt, open, onClose }: PromptDetailProps) {
  const router = useRouter();
  const { locale } = useAppStore();
  const { setEditingPrompt } = usePromptStore();

  if (!prompt) return null;

  const title = locale === 'cn' ? prompt.title_cn : prompt.title_en;
  const shotList = Array.isArray(prompt.shot_list) ? prompt.shot_list : [];
  const negativePrompts = Array.isArray(prompt.negative_prompts) ? prompt.negative_prompts : [];
  const keywords = Array.isArray(prompt.keywords) ? prompt.keywords : [];

  const handleUseInVeo = () => {
    setEditingPrompt(prompt.description);
    onClose();
    router.push('/video/veo');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{title}</span>
            <Badge variant="outline" className="text-xs">{prompt.category}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Full prompt */}
        <div className="relative bg-muted rounded-lg p-4 text-sm">
          <CopyButton text={prompt.description} className="absolute top-2 right-2" />
          <p className="pr-10 whitespace-pre-wrap">{prompt.description}</p>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {prompt.camera && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Camera className="h-4 w-4 shrink-0" />
              <span>{prompt.camera}</span>
            </div>
          )}
          {prompt.lighting && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sun className="h-4 w-4 shrink-0" />
              <span>{prompt.lighting}</span>
            </div>
          )}
          {prompt.setting && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{prompt.setting}</span>
            </div>
          )}
          {prompt.audio && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Music className="h-4 w-4 shrink-0" />
              <span>{prompt.audio}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{prompt.duration_seconds}s · {prompt.aspect_ratio}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Scissors className="h-4 w-4 shrink-0" />
            <span>{shotList.length} shots · {prompt.focus || 'Deep focus'}</span>
          </div>
        </div>

        {/* Shot list timeline */}
        {shotList.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Shot List</h4>
            <div className="space-y-2">
              {shotList.map((shot: any, i: number) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 text-xs font-mono text-muted-foreground w-24">
                    {shot.tStart} – {shot.tEnd}
                  </span>
                  <span className="text-muted-foreground">{shot.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Negative prompts */}
        {negativePrompts.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Negative Prompts</h4>
            <div className="flex flex-wrap gap-1">
              {negativePrompts.map((np: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">
                  {np}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Keywords</h4>
            <div className="flex flex-wrap gap-1">
              {keywords.map((kw: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {kw}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleUseInVeo} className="flex-1">
            <Video className="h-4 w-4 mr-2" />
            Use in VEO
          </Button>
          <CopyButton text={prompt.description} className="border" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
