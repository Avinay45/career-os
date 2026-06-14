import { User as SupabaseUser } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  target_role: string | null;
  experience_level: 'entry' | 'mid' | 'senior' | 'lead' | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: SupabaseUser | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}
