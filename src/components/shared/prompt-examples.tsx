'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/use-i18n';

type ExampleCategory = 'video' | 'sora' | 'kling' | 'image' | 'frames';

interface PromptExamplesProps {
  category: ExampleCategory;
  onSelect: (prompt: string) => void;
}

const examples: Record<ExampleCategory, { en: string; cn: string; label: string }[]> = {
  video: [
    {
      label: 'Latte Art',
      en: 'A barista pours steamed milk into a Luckin Coffee latte, creating intricate latte art. Close-up macro shot, warm golden morning light, steam rising gently. The camera slowly pulls back to reveal the full cup on a marble countertop.',
      cn: '咖啡师将蒸奶倒入瑞幸咖啡拿铁中，创造精致的拿铁拉花。微距特写镜头，温暖的金色晨光，蒸汽缓缓升起。镜头缓慢拉远，展示大理石台面上的完整杯子。',
    },
    {
      label: 'Product Reveal',
      en: 'A premium Luckin Coffee cup rotates slowly on a reflective dark surface. Dramatic side lighting highlights condensation droplets. Camera orbits 180 degrees around the cup, revealing the brand logo.',
      cn: '一杯精品瑞幸咖啡在反光的深色台面上缓慢旋转。戏剧性的侧光照亮水珠凝结。镜头绕杯子旋转180度，展示品牌标志。',
    },
    {
      label: 'Seasonal Drink',
      en: 'A festive seasonal coffee drink with whipped cream and caramel drizzle sits on a wooden table. Autumn leaves gently fall in the background. Soft warm lighting, shallow to deep focus pull. The drink sparkles with golden highlights.',
      cn: '一杯带有奶油和焦糖淋酱的节日季节限定咖啡放在木桌上。秋叶在背景中轻轻飘落。柔和温暖的灯光，浅焦到深焦的拉动。饮品闪耀着金色光芒。',
    },
  ],
  sora: [
    {
      label: 'Coffee Journey',
      en: 'Cinematic tracking shot following a single coffee bean from a burlap sack, through a premium grinder, into a gleaming espresso machine, and finally pouring as rich espresso into a Luckin branded cup. Each transition is smooth and continuous. 20 seconds, professional lighting throughout.',
      cn: '电影级跟踪镜头，跟随一颗咖啡豆从麻袋中出发，经过精品研磨机，进入闪亮的浓缩咖啡机，最终以浓郁的意式浓缩倒入瑞幸品牌杯中。每个过渡都流畅连续。20秒，全程专业灯光。',
    },
    {
      label: 'Store Atmosphere',
      en: 'A sweeping dolly shot moves through an elegant Luckin Coffee store interior. Morning light streams through floor-to-ceiling windows. The camera glides past the coffee bar, pastry display, and cozy seating areas. Warm tones, premium ambiance, 15-second continuous take.',
      cn: '一个流畅的推轨镜头穿过优雅的瑞幸咖啡店内部。晨光透过落地窗照射进来。镜头滑过咖啡吧台、糕点展示柜和温馨的座位区。暖色调，高端氛围，15秒连续镜头。',
    },
  ],
  kling: [
    {
      label: 'Pour & Steam',
      en: 'Close-up of hot coffee being poured from a carafe into a transparent glass. Steam rises dramatically. Camera slowly pans up following the steam. Professional studio lighting, dark background.',
      cn: '热咖啡从咖啡壶倒入透明玻璃杯的特写。蒸汽戏剧性地升起。镜头缓慢向上平移跟随蒸汽。专业摄影棚灯光，深色背景。',
    },
    {
      label: 'Iced Coffee',
      en: 'Ice cubes drop in slow motion into a glass of iced Luckin coffee, creating beautiful amber splashes. The camera catches the splash at its peak. Backlit with blue accent light, crisp and refreshing mood.',
      cn: '冰块以慢动作落入一杯瑞幸冰咖啡中，创造美丽的琥珀色飞溅。镜头捕捉飞溅的巅峰瞬间。蓝色强调光背光照明，清爽清新的氛围。',
    },
  ],
  image: [
    {
      label: 'Product Shot',
      en: 'Professional product photography of a Luckin Coffee cup on a clean white marble surface. Soft studio lighting, minimal composition, premium luxury aesthetic. Blue accent elements.',
      cn: '瑞幸咖啡杯在洁白大理石台面上的专业产品摄影。柔和的摄影棚灯光，极简构图，高端奢华美学。蓝色点缀元素。',
    },
    {
      label: 'Lifestyle Scene',
      en: 'A cozy café corner with a Luckin coffee and a croissant on a rustic wooden table. Morning sunlight creates warm shadows. Overhead flat-lay composition, minimal styling, Luckin blue accent napkin.',
      cn: '温馨的咖啡角落，瑞幸咖啡和牛角包放在质朴的木桌上。晨光投射出温暖的阴影。俯拍平铺构图，极简布置，瑞幸蓝色点缀餐巾。',
    },
  ],
  frames: [
    {
      label: 'Cup Reveal',
      en: 'The scene transitions from an empty marble countertop to a beautifully presented Luckin Coffee cup with steam rising. Smooth zoom-in motion, the cup materializes elegantly.',
      cn: '场景从空荡荡的大理石台面过渡到一杯蒸汽升腾的精美瑞幸咖啡。平滑的推进运动，咖啡杯优雅地出现。',
    },
    {
      label: 'Season Change',
      en: 'A Luckin Coffee cup surrounded by fresh spring cherry blossoms transitions smoothly to the same cup surrounded by warm autumn maple leaves. The lighting shifts from cool to warm tones.',
      cn: '一杯被新鲜春季樱花环绕的瑞幸咖啡平滑过渡到同一杯被温暖秋季枫叶环绕。灯光从冷色调转变为暖色调。',
    },
  ],
};

export function PromptExamples({ category, onSelect }: PromptExamplesProps) {
  const { locale } = useI18n();
  const items = examples[category] || examples.video;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
      {items.map((item) => (
        <Button
          key={item.label}
          variant="outline"
          size="sm"
          className="shrink-0 text-xs h-7"
          onClick={() => onSelect(locale === 'cn' ? item.cn : item.en)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
