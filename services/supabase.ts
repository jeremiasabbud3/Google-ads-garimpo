
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const env = (window as any).process?.env || (typeof process !== 'undefined' ? process.env : {});
    return env[key] || "";
  } catch {
    return "";
  }
};

const url = getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(url && key && url.length > 5);

let supabaseInstance = null;
if (isSupabaseConfigured) {
  try {
    supabaseInstance = createClient(url, key);
  } catch (e) {
    console.warn("Erro ao instanciar Supabase:", e);
  }
}

export const supabase = supabaseInstance;
