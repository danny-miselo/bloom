import { AuthApiError } from '@supabase/supabase-js';

export function authError(error: unknown): string {
  if (error instanceof AuthApiError) {
    if (error.status === 429) return 'Please wait a moment before trying again.';
    if (error.code === 'invalid_credentials') return 'That email and password do not match. Please try again.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
