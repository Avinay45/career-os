import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { getMockSupabaseClient } from './mock-supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                      process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-project');

// Lazy instantiation proxy using @supabase/ssr in browser and standard client in Node.js
let supabaseInstance: any = null;

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    if (!supabaseInstance) {
      if (isPlaceholder) {
        supabaseInstance = getMockSupabaseClient();
      } else if (typeof window !== 'undefined') {
        supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
      } else {
        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
      }
    }
    return supabaseInstance[prop];
  }
});

/**
 * Creates a Supabase client with the user's specific access token (auth token).
 */
export const getSupabaseClient = (authToken?: string) => {
  if (authToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });
  }
  return supabase;
};

/**
 * Supabase Admin client using service_role key.
 * Used strictly for system tasks, background runs, or administrative operations.
 */
export const getSupabaseAdmin = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

