import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
    '';
  const supabaseKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    '';

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
