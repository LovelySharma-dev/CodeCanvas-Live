import { createClient } from '@insforge/sdk';

export const INSFORGE_BASE_URL = import.meta.env.VITE_INSFORGE_BASE_URL || 'https://d7fwbe73.ap-southeast.insforge.app';
export const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY || 'ik_631989c04f450a1cf7ec7997cfdc92ed';

export const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY
});
