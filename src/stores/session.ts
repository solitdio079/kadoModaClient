import { create } from 'zustand';
import type { Profile } from '../lib/admin';

interface Session {
  token: string | null;
  email: string | null;
  profile: Profile | null;
  setSession: (token: string, email: string, profile: Profile) => void;
  logout: () => void;
}
// Memory only: credentials/tokens are never saved in the source or browser storage.
export const useSession = create<Session>(set => ({
  token: null, email: null, profile: null,
  setSession: (token, email, profile) => set({ token, email, profile }),
  logout: () => set({ token: null, email: null, profile: null }),
}));
