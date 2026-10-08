import { z } from 'zod';
import { envelopeSchema } from './bloom-vault';

export const cacheSchema = z.object({ envelope: envelopeSchema, baseRevision: z.number().int().nonnegative(), pending: z.boolean() });
export type VaultCache = z.infer<typeof cacheSchema>;
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('bloom-private-vault', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('vault');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not open encrypted local storage.'));
  });
}
export async function readCache(userId: string): Promise<VaultCache | null> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('vault', 'readonly');
    const request = tx.objectStore('vault').get(`account:${userId}`);
    request.onsuccess = () => { try { resolve(request.result ? cacheSchema.parse(request.result) : null); } catch { reject(new Error('Your local cache could not be read. Restore a backup.')); } };
    request.onerror = () => reject(new Error('Could not read your local vault.'));
    tx.oncomplete = () => db.close();
  });
}
export async function writeCache(userId: string, cache: VaultCache) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('vault', 'readwrite');
    tx.objectStore('vault').put(cache, `account:${userId}`);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = tx.onabort = () => { db.close(); reject(new Error('Could not save on this device. Keep Bloom open and export a backup.')); };
  });
}
