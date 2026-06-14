import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getMockSupabaseClient } from './mock-supabase';

/**
 * Creates a request-scoped Supabase client for Next.js Server Components,
 * Server Actions, and Route Handlers. Automatically parses and updates cookies.
 */
export async function createSupabaseServerClient() {
  if ((globalThis as any).__mockSupabaseClient) {
    return (globalThis as any).__mockSupabaseClient;
  }
  const cookieStore = await cookies();

  const isPlaceholder = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                        process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder-project');

  if (isPlaceholder) {
    return getMockSupabaseClient(cookieStore);
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // The `set` method might be called inside a Server Component
            // which doesn't support setting headers. We catch and ignore.
          }
        },
      },
    }
  );
}
