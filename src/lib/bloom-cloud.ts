import { supabase } from '@/integrations/supabase/client';
import type { Envelope } from './bloom-vault';

export class VaultConflict extends Error {
  constructor() { super('Another device has newer changes. Your local writing is safe. Export a backup, then load the cloud version before continuing.'); }
}
export async function checkAccess() {
  const { data, error } = await supabase.rpc('bloom_has_access');
  if (error) throw new Error('Could not verify private account access. Please check your connection and retry.');
  return data === true;
}
export async function cloudVault(userId: string): Promise<{ envelope: Envelope; revision: number } | null> {
  const { data, error } = await supabase.from('bloom_vaults').select('envelope, revision').eq('user_id', userId).maybeSingle();
  if (error) throw new Error('Could not load your cloud sanctuary. Please check your connection and retry.');
  return data ? { envelope: data.envelope as Envelope, revision: Number(data.revision) } : null;
}
export async function saveCloud(userId: string, envelope: Envelope, baseRevision: number) {
  if (baseRevision === 0) {
    const { error } = await supabase.from('bloom_vaults').insert({ user_id: userId, envelope, revision: 1 });
    if (error?.code === '23505') throw new VaultConflict();
    if (error) throw new Error('Saved on this device, but cloud sync failed. Retry when connected.');
    return 1;
  }
  const { data, error } = await supabase.from('bloom_vaults').update({ envelope, revision: baseRevision + 1, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('revision', baseRevision).select('revision');
  if (error) throw new Error('Saved on this device, but cloud sync failed. Retry when connected.');
  if (!data?.length) throw new VaultConflict();
  return Number(data[0].revision);
}
