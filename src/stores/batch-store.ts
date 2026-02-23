import { create } from 'zustand';

export interface BatchItem {
  id: string;
  file: File;
  preview: string;
  prompt: string;
  status: 'pending' | 'uploading' | 'generating' | 'completed' | 'failed';
  taskId?: string;
  resultUrl?: string;
  progress: number;
}

interface BatchState {
  items: BatchItem[];
  model: string;
  aspectRatio: string;
  duration: number;
  concurrency: 1 | 3 | 5;
  isRunning: boolean;
  addItems: (items: BatchItem[]) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, update: Partial<BatchItem>) => void;
  setModel: (model: string) => void;
  setAspectRatio: (ratio: string) => void;
  setDuration: (duration: number) => void;
  setConcurrency: (c: 1 | 3 | 5) => void;
  setIsRunning: (running: boolean) => void;
  clearAll: () => void;
}

export const useBatchStore = create<BatchState>()((set) => ({
  items: [],
  model: 'sora2',
  aspectRatio: '16:9',
  duration: 10,
  concurrency: 3,
  isRunning: false,
  addItems: (newItems) => set((s) => ({ items: [...s.items, ...newItems] })),
  removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
  updateItem: (id, update) =>
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...update } : i)),
    })),
  setModel: (model) => set({ model }),
  setAspectRatio: (aspectRatio) => set({ aspectRatio }),
  setDuration: (duration) => set({ duration }),
  setConcurrency: (concurrency) => set({ concurrency }),
  setIsRunning: (isRunning) => set({ isRunning }),
  clearAll: () => set({ items: [], isRunning: false }),
}));
