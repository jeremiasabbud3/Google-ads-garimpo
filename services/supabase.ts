
import { createClient } from '@supabase/supabase-js';

// Função segura para obter variáveis de ambiente
const getEnv = (key: string): string => {
  try {
    return (process.env as any)[key] || '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '');

// Só inicializa se houver dados válidos para não quebrar a aplicação
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
