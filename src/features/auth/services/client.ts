import { supabase } from '@/lib/supabase';
import { Profile } from '../types';

/**
 * Sign in a user with email and password.
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * Sign up a new user with metadata (Full Name, Target Role) that will
 * trigger database profile sync via PostgreSQL triggers.
 */
export async function signUp(email: string, password: string, fullName: string, targetRole: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        target_role: targetRole,
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * Log out the currently authenticated user session.
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Fetches the user profile from the public.profiles database.
 */
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data as Profile;
}

/**
 * Triggers a password reset request email.
 */
export async function requestPasswordReset(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
  });
  if (error) throw error;
  return data;
}
