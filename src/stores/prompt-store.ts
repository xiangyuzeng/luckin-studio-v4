import { create } from 'zustand';

interface PromptState {
  editingPrompt: string;
  selectedPromptId: string | null;
  setEditingPrompt: (text: string) => void;
  selectPrompt: (id: string | null) => void;
  clearEditor: () => void;
}

export const usePromptStore = create<PromptState>()((set) => ({
  editingPrompt: '',
  selectedPromptId: null,

  setEditingPrompt: (text) => set({ editingPrompt: text }),

  selectPrompt: (id) => set({ selectedPromptId: id }),

  clearEditor: () =>
    set({
      editingPrompt: '',
      selectedPromptId: null,
    }),
}));
