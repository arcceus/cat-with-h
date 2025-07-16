import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CanvasData = {
  nodes: any[];
  edges: any[];
};

export type CanvasMeta = {
  name: string;
  pinned: boolean;
  updatedAt: string;
};

export type CanvasStore = {
  canvases: Record<string, CanvasData>;
  canvasesMeta: Record<string, CanvasMeta>;
  currentKey: string;
  setCurrentKey: (key: string) => void;
  saveCanvas: (key: string, data: CanvasData) => void;
  deleteCanvas: (key: string) => void;
  renameCanvas: (key: string, newName: string) => void;
  pinCanvas: (key: string) => void;
  unpinCanvas: (key: string) => void;
  createCanvas: (key: string, name: string) => void;
};

const now = () => new Date().toISOString();

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set) => ({
      canvases: { default: { nodes: [], edges: [] } },
      canvasesMeta: { default: { name: 'Default', pinned: false, updatedAt: now() } },
      currentKey: 'Default',
      setCurrentKey: (key) => set((state) => ({
        currentKey: key,
        canvasesMeta: {
          ...state.canvasesMeta,
          [key]: {
            ...state.canvasesMeta[key],
            updatedAt: now(),
          },
        },
      })),
      saveCanvas: (key, data) =>
        set((state) => ({
          canvases: { ...state.canvases, [key]: data },
          canvasesMeta: {
            ...state.canvasesMeta,
            [key]: {
              ...(state.canvasesMeta[key] || { name: key, pinned: false }),
              updatedAt: now(),
            },
          },
        })),
      deleteCanvas: (key) =>
        set((state) => {
          const { [key]: _, ...rest } = state.canvases;
          const { [key]: __, ...restMeta } = state.canvasesMeta;
          const keys = Object.keys(rest);
          return {
            canvases: rest,
            canvasesMeta: restMeta,
            currentKey: keys[0] || 'default',
          };
        }),
      renameCanvas: (key, newName) =>
        set((state) => ({
          canvasesMeta: {
            ...state.canvasesMeta,
            [key]: {
              ...state.canvasesMeta[key],
              name: newName,
              updatedAt: now(),
            },
          },
        })),
      pinCanvas: (key) =>
        set((state) => ({
          canvasesMeta: {
            ...state.canvasesMeta,
            [key]: {
              ...state.canvasesMeta[key],
              pinned: true,
              updatedAt: now(),
            },
          },
        })),
      unpinCanvas: (key) =>
        set((state) => ({
          canvasesMeta: {
            ...state.canvasesMeta,
            [key]: {
              ...state.canvasesMeta[key],
              pinned: false,
              updatedAt: now(),
            },
          },
        })),
      createCanvas: (key, name) =>
        set((state) => ({
          canvases: { ...state.canvases, [key]: { nodes: [], edges: [] } },
          canvasesMeta: {
            ...state.canvasesMeta,
            [key]: { name, pinned: false, updatedAt: now() },
          },
          currentKey: key,
        })),
    }),
    {
      name: 'canvas-storage', // unique name for localStorage key
      partialize: (state) => ({
        canvases: state.canvases,
        canvasesMeta: state.canvasesMeta,
        currentKey: state.currentKey,
      }),
    }
  )
); 