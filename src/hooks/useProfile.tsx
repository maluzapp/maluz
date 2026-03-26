import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProfileState {
  activeProfileId: string | null;
  setActiveProfile: (id: string | null) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfileId: null,
      setActiveProfile: (id) => set({ activeProfileId: id }),
    }),
    { name: 'active-profile' }
  )
);
