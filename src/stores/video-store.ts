import { create } from 'zustand';

export interface VideoTaskState {
  id: string;
  kieTaskId: string;
  model: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl: string | null;
}

interface VideoState {
  activeTasks: Record<string, VideoTaskState>;
  addTask: (task: VideoTaskState) => void;
  updateTask: (id: string, update: Partial<VideoTaskState>) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
}

export const useVideoStore = create<VideoState>()((set) => ({
  activeTasks: {},

  addTask: (task) =>
    set((state) => ({
      activeTasks: {
        ...state.activeTasks,
        [task.id]: task,
      },
    })),

  updateTask: (id, update) =>
    set((state) => {
      const existing = state.activeTasks[id];
      if (!existing) return state;
      return {
        activeTasks: {
          ...state.activeTasks,
          [id]: { ...existing, ...update },
        },
      };
    }),

  removeTask: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.activeTasks;
      return { activeTasks: rest };
    }),

  clearCompleted: () =>
    set((state) => {
      const active: Record<string, VideoTaskState> = {};
      for (const [id, task] of Object.entries(state.activeTasks)) {
        if (task.status !== 'completed' && task.status !== 'failed') {
          active[id] = task;
        }
      }
      return { activeTasks: active };
    }),
}));
