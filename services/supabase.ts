
import { createClient } from '@supabase/supabase-js';

// Função para obter variáveis de ambiente de forma segura no navegador
const getEnvVar = (key: string): string => {
  try {
    // Tenta acessar via process.env (injetado por bundlers) ou window.process
    const env = (window as any).process?.env || (typeof process !== 'undefined' ? process.env : {});
    return env[key] || "";
  } catch {
    return "";
  }
};

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.length > 10);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
