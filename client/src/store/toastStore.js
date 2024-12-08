import { create } from 'zustand';

export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), duration: 5000, ...toast }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  }))
}));