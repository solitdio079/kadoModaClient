import { create } from 'zustand';

interface Session {
  token: string | null;
  email: string | null;
  setSession: (token: string, email: string) => void;
  logout: () => void;
}
// Memory only: credentials/tokens are never saved in the source or browser storage.
export const useSession = create<Session>(set => ({
  token: null, email: null,
  setSession: (token, email) => set({ token, email }),
  logout: () => set({ token: null, email: null }),
}));
