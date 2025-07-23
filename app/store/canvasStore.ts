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
  saveCanvas: (key: string, data: CanvasData, notify?: (msg: string) => void) => Promise<void>;
  deleteCanvas: (key: string, notify?: (msg: string) => void) => Promise<void>;
  renameCanvas: (key: string, newName: string, notify?: (msg: string) => void) => Promise<void>;
  pinCanvas: (key: string, notify?: (msg: string) => void) => Promise<void>;
  unpinCanvas: (key: string, notify?: (msg: string) => void) => Promise<void>;
  createCanvas: (key: string, name: string, notify?: (msg: string) => void) => Promise<void>;
  hydrateFromServer: (onError?: (msg: string) => void) => Promise<void>;
};

const now = () => new Date().toISOString();

/**
 * Runs an optimistic update, calls an async API, and rolls back on error.
 * @param optimisticUpdate - function to update Zustand state optimistically
 * @param apiCall - async function to call the API
 * @param rollback - function to restore previous Zustand state
 * @param notify - function to show error notification
 */
async function runOptimisticUpdate<T>(
  optimisticUpdate: () => void,
  apiCall: () => Promise<T>,
  rollback: () => void,
  notify?: (msg: string) => void
) {
  optimisticUpdate();
  try {
    await apiCall();
  } catch (e: any) {
    rollback();
    if (notify) notify(e.message || "Something went wrong");
  }
}

/**
 * Converts normalized DB data to Zustand canvas store shape.
 * @param dbData { canvases: DBCanvas[], meta: DBCanvasMeta[] }
 * @returns Zustand store shape
 */
function shapeDBToZustandCanvas(dbData: {
  canvases: Array<{ id: string; nodes: any[]; edges: any[] }>,
  meta: Array<{ canvasId: string; name: string; pinned: boolean; updatedAt: string }>,
  currentKey?: string,
}) {
  const canvases: Record<string, CanvasData> = {};
  for (const c of dbData.canvases) {
    canvases[c.id] = { nodes: c.nodes, edges: c.edges };
  }
  const canvasesMeta: Record<string, CanvasMeta> = {};
  for (const m of dbData.meta) {
    canvasesMeta[m.canvasId] = {
      name: m.name,
      pinned: m.pinned,
      updatedAt: m.updatedAt,
    };
  }
  return {
    canvases,
    canvasesMeta,
    currentKey: dbData.currentKey || Object.keys(canvases)[0] || 'default',
  };
}

export const useCanvasStore = create<CanvasStore>()(
  persist(
    (set, get) => ({
      canvases: { default: { nodes: [], edges: [] } },
      canvasesMeta: { default: { name: 'Default', pinned: false, updatedAt: now() } },
      currentKey: 'default',
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
      saveCanvas: async (key, data, notify) => {
        const prevCanvases = get().canvases;
        const prevMeta = get().canvasesMeta;
        await runOptimisticUpdate(
          () => set((state) => ({
            canvases: { ...state.canvases, [key]: data },
            canvasesMeta: {
              ...state.canvasesMeta,
              [key]: {
                ...(state.canvasesMeta[key] || { name: key, pinned: false }),
                updatedAt: now(),
              },
            },
          })),
          () => fetch(`/api/canvases/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data }),
          }),
          () => set({ canvases: prevCanvases, canvasesMeta: prevMeta }),
          notify
        );
      },
      deleteCanvas: async (key, notify) => {
        const prevCanvases = get().canvases;
        const prevMeta = get().canvasesMeta;
        const prevCurrentKey = get().currentKey;
        await runOptimisticUpdate(
          () => set((state) => {
            const { [key]: _, ...rest } = state.canvases;
            const { [key]: __, ...restMeta } = state.canvasesMeta;
            const keys = Object.keys(rest);
            return {
              canvases: rest,
              canvasesMeta: restMeta,
              currentKey: keys[0] || 'default',
            };
          }),
          () => fetch(`/api/canvases/${key}`, { method: 'DELETE' }),
          () => set({ canvases: prevCanvases, canvasesMeta: prevMeta, currentKey: prevCurrentKey }),
          notify
        );
      },
      renameCanvas: async (key, newName, notify) => {
        const prevMeta = get().canvasesMeta;
        await runOptimisticUpdate(
          () => set((state) => ({
            canvasesMeta: {
              ...state.canvasesMeta,
              [key]: {
                ...state.canvasesMeta[key],
                name: newName,
                updatedAt: now(),
              },
            },
          })),
          () => fetch(`/api/canvases/${key}/rename`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName }),
          }),
          () => set({ canvasesMeta: prevMeta }),
          notify
        );
      },
      pinCanvas: async (key, notify) => {
        const prevMeta = get().canvasesMeta;
        await runOptimisticUpdate(
          () => set((state) => ({
            canvasesMeta: {
              ...state.canvasesMeta,
              [key]: {
                ...state.canvasesMeta[key],
                pinned: true,
                updatedAt: now(),
              },
            },
          })),
          () => fetch(`/api/canvases/${key}/pin`, { method: 'POST' }),
          () => set({ canvasesMeta: prevMeta }),
          notify
        );
      },
      unpinCanvas: async (key, notify) => {
        const prevMeta = get().canvasesMeta;
        await runOptimisticUpdate(
          () => set((state) => ({
            canvasesMeta: {
              ...state.canvasesMeta,
              [key]: {
                ...state.canvasesMeta[key],
                pinned: false,
                updatedAt: now(),
              },
            },
          })),
          () => fetch(`/api/canvases/${key}/pin`, { method: 'DELETE' }),
          () => set({ canvasesMeta: prevMeta }),
          notify
        );
      },
      createCanvas: async (key, name, notify) => {
        const prevCanvases = get().canvases;
        const prevMeta = get().canvasesMeta;
        const prevCurrentKey = get().currentKey;
        await runOptimisticUpdate(
          () => set((state) => ({
            canvases: { ...state.canvases, [key]: { nodes: [], edges: [] } },
            canvasesMeta: {
              ...state.canvasesMeta,
              [key]: { name, pinned: false, updatedAt: now() },
            },
            currentKey: key,
          })),
          () => fetch(`/api/canvases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, name }),
          }),
          () => set({ canvases: prevCanvases, canvasesMeta: prevMeta, currentKey: prevCurrentKey }),
          notify
        );
      },
      hydrateFromServer: async (onError?: (msg: string) => void) => {
        try {
          console.log('🎨 Fetching canvases from /api/canvases...');
          const res = await fetch('/api/canvases');
          if (!res.ok) throw new Error('Failed to fetch canvases');
          const data = await res.json();
          console.log('🎨 Raw canvas data from API:', data);
          
          const shaped = shapeDBToZustandCanvas(data);
          console.log('🎨 Shaped canvas data for Zustand:', shaped);
          
          // Replace entire state with server data, keeping only UI preferences
          set((state) => {
            const newState = {
              ...shaped, // Server data takes precedence
            };
            console.log('🎨 Setting new canvas state from server:', {
              canvasesCount: Object.keys(newState.canvases).length,
              currentKey: newState.currentKey,
              canvasKeys: Object.keys(newState.canvases)
            });
            return newState;
          });
        } catch (e: any) {
          console.error('❌ Error in canvas hydrateFromServer:', e);
          if (onError) onError(e.message || 'Failed to sync canvases');
        }
      },
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