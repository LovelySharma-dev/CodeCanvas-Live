import { createClient } from "@insforge/sdk";

export const INSFORGE_BASE_URL = import.meta.env.VITE_INSFORGE_BASE_URL;
export const INSFORGE_ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY;

export const insforge = createClient({
  baseUrl: INSFORGE_BASE_URL,
  anonKey: INSFORGE_ANON_KEY,
});
