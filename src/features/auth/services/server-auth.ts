import { createSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Validates the current user session against the Supabase Auth API
 * using the cookies present in the request.
 * 
 * Throws an error if the user is unauthenticated or has an invalid session.
 * Returns the verified user object and the authenticated request client.
 */
export async function authenticateUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized access. Please log in.');
  }

  return { user, supabase };
}
