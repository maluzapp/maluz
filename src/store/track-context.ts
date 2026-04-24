import { create } from 'zustand';

interface TrackContextState {
  /** Quando definido, indica que a próxima sessão está vinculada a um nó da trilha. */
  pendingNodeId: string | null;
  pendingTrackId: string | null;
  setPendingNode: (trackId: string, nodeId: string) => void;
  clearPendingNode: () => void;
}

export const useTrackContext = create<TrackContextState>((set) => ({
  pendingNodeId: null,
  pendingTrackId: null,
  setPendingNode: (trackId, nodeId) => set({ pendingTrackId: trackId, pendingNodeId: nodeId }),
  clearPendingNode: () => set({ pendingTrackId: null, pendingNodeId: null }),
}));
