
import { createClient } from '@supabase/supabase-js';

// Função segura para obter variáveis de ambiente sem quebrar se o objeto 'process' não existir
const getEnv = (key: string): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key] || '';
    }
    return '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

// Só inicializa se houver dados válidos e as strings não forem apenas espaços
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.trim() !== '');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
