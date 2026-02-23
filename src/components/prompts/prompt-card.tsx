'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, Scissors } from 'lucide-react';
import { useAppStore } from '@/stores/app-store';
import { cn } from '@/lib/utils';

interface PromptCardProps {
  prompt: {
    id: string;
    category: string;
    title_en: string;
    title_cn: string;
    description: string;
    camera: string | null;
    duration_seconds: number;
    cuts: number;
    shot_list: { tStart: string; tEnd: string; desc: string }[];
  };
  onClick?: () => void;
  isSelected?: boolean;
}

const categoryColors: Record<string, string> = {
  coffee: 'bg-amber-100 text-amber-700',
  specialty: 'bg-purple-100 text-purple-700',
  food: 'bg-orange-100 text-orange-700',
  pairing: 'bg-pink-100 text-pink-700',
  store: 'bg-blue-100 text-blue-700',
  seasonal: 'bg-green-100 text-green-700',
  lifestyle: 'bg-cyan-100 text-cyan-700',
  advanced: 'bg-red-100 text-red-700',
};

export function PromptCard({ prompt, onClick, isSelected }: PromptCardProps) {
  const { locale } = useAppStore();
  const title = locale === 'cn' ? prompt.title_cn : prompt.title_en;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold line-clamp-2 leading-tight">{title}</h3>
          <Badge variant="outline" className={cn('text-[10px] shrink-0', categoryColors[prompt.category])}>
            {prompt.category}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
          {prompt.description}
        </p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {prompt.camera && (
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{prompt.camera}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {prompt.duration_seconds}s
          </span>
          <span className="flex items-center gap-1">
            <Scissors className="h-3 w-3" />
            {prompt.shot_list?.length || prompt.cuts} shots
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
