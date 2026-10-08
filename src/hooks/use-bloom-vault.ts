import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/bloom/SessionContext';
import { initialData, type BloomData } from '@/lib/bloom-types';
import { decrypt, deriveKey, encrypt, readVault, envelopeSchema, type Envelope } from '@/lib/bloom-vault';
import { readCache, writeCache, type VaultCache } from '@/lib/bloom-cache';
import { checkAccess, cloudVault, saveCloud, VaultConflict } from '@/lib/bloom-cloud';

export function useBloomVault() {
  const { session } = useSession();
  const userId = session!.user.id;
  const [data, setData] = useState<BloomData | null>(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<'checking' | 'allowed' | 'denied' | 'error'>('checking');
  const [legacy, setLegacy] = useState(false);
  const [status, setStatus] = useState('Synced privately');
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const key = useRef<CryptoKey | null>(null);
  const salt = useRef<number[]>([]);
  const latest = useRef<BloomData | null>(null);
  const cache = useRef<VaultCache | null>(null);
  const base = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);
  const savedRevision = useRef(0);
  const ready = useRef(false);
  const mounted = useRef(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialize = async () => {
    setLoading(true); setError(''); ready.current = false;
    try {
      if (!await checkAccess()) { setAccess('denied'); return; }
      setAccess('allowed');
      const [remote, local, old] = await Promise.all([cloudVault(userId), readCache(userId), readVault()]);
      if (!mounted.current) return;
      setLegacy(!!old);
      const selected = local?.pending ? local : remote ? { envelope: envelopeSchema.parse(remote.envelope), baseRevision: remote.revision, pending: false } : local;
      if (local?.pending && (remote?.revision || 0) !== local.baseRevision) {
        setConflict(true); setError(new VaultConflict().message);
      } else setConflict(false);
      cache.current = selected; base.current = selected?.baseRevision || 0;
      setExists(!!selected); ready.current = true;
      if (selected && !selected.pending) await writeCache(userId, selected);
    } catch (e) { if (mounted.current) { setAccess('error'); setError((e as Error).message); } }
    finally { if (mounted.current) setLoading(false); }
  };
  useEffect(() => {
    mounted.current = true; initialize();
    return () => { mounted.current = false; if (debounce.current) clearTimeout(debounce.current); };
  }, [userId]);
  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => { if (savedRevision.current !== revision.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, []);
  async function uploadPending() {
    const pending = cache.current;
    if (!pending?.pending) return;
    try {
      const nextBase = await saveCloud(userId, pending.envelope, pending.baseRevision);
      base.current = nextBase;
      const synced = { ...pending, baseRevision: nextBase, pending: false };
      cache.current = synced;
      await writeCache(userId, synced);
      if (mounted.current) { setConflict(false); setError(''); setStatus('Synced privately'); }
    } catch (e) {
      if (mounted.current) { setConflict(e instanceof VaultConflict); setStatus('Saved on device · sync needed'); setError((e as Error).message); }
    }
  }
  async function sync() {
    if (debounce.current) clearTimeout(debounce.current);
    queue.current = queue.current.catch(() => {}).then(uploadPending);
    await queue.current;
  }
  async function unlock(password: string) {
    if (!ready.current || !cache.current) throw new Error('Reload your cloud vault before unlocking.');
    if (!cache.current.pending) {
      const remote = await cloudVault(userId);
      if (!remote) throw new Error('The cloud vault was not found. Reload or restore a backup.');
      const refreshed = { envelope: envelopeSchema.parse(remote.envelope), baseRevision: remote.revision, pending: false };
      await writeCache(userId, refreshed);
      cache.current = refreshed; base.current = remote.revision;
    }
    const result = await decrypt(cache.current.envelope, password);
    key.current = result.key; salt.current = result.envelope.salt; latest.current = result.data;
    setData(result.data); setStatus(cache.current.pending ? 'Saved on device · sync needed' : 'Synced privately');
    if (cache.current.pending && !conflict) await sync();
  }
  async function adopt(envelope: Envelope, password: string) {
    if (!ready.current) throw new Error('Verify account access and load your vault first.');
    await queue.current;
    // Check the current cloud revision again before explicitly replacing a vault.
    const remote = await cloudVault(userId);
    if ((remote?.revision || 0) !== base.current) throw new VaultConflict();
    const result = await decrypt(envelope, password);
    const pending = { envelope, baseRevision: base.current, pending: true };
    await writeCache(userId, pending);
    cache.current = pending; key.current = result.key; salt.current = envelope.salt; latest.current = result.data;
    revision.current = 0; savedRevision.current = 0;
    setData(result.data); setExists(true); setConflict(false); setError('');
    await sync();
  }
  async function create(password: string) {
    if (!ready.current || cache.current || await cloudVault(userId)) throw new Error('A vault already exists or could not be checked. Reload and unlock it instead.');
    const newSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)));
    const newKey = await deriveKey(password, newSalt);
    await adopt(await encrypt(initialData(), newKey, newSalt), password);
  }
  function update(transform: (current: BloomData) => BloomData) {
    if (!latest.current || !key.current) return;
    const next = transform(latest.current);
    latest.current = next; setData(next); setStatus('Saving on device…');
    const currentRevision = ++revision.current;
    const currentKey = key.current, currentSalt = salt.current;
    queue.current = queue.current.catch(() => {}).then(async () => {
      if (currentRevision !== revision.current) return;
      const envelope = await encrypt(next, currentKey, currentSalt);
      const pending = { envelope, baseRevision: base.current, pending: true };
      await writeCache(userId, pending);
      cache.current = pending; savedRevision.current = currentRevision;
      if (mounted.current && revision.current === currentRevision) setStatus('Saved on device · syncing…');
    }).catch(e => { if (mounted.current) { setStatus('Not saved — please back up'); setError((e as Error).message); } });
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { if (mounted.current) void sync(); }, 1400);
  }
  useEffect(() => {
    const retry = () => { if (key.current && mounted.current) void sync(); };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [userId]);
  async function backup(): Promise<Envelope> {
    await queue.current;
    if (latest.current && key.current) return encrypt(latest.current, key.current, salt.current);
    if (cache.current) return cache.current.envelope;
    throw new Error('No vault is available to back up.');
  }
  async function lock() {
    await sync();
    if (revision.current !== savedRevision.current) throw new Error("Your latest changes aren't saved locally. Export a backup before locking.");
    key.current = null; latest.current = null; setData(null);
  }
  async function restore(value: unknown, password: string) { await adopt(envelopeSchema.parse(value), password); }
  async function importLegacy(password: string) {
    if (cache.current || await cloudVault(userId)) throw new Error('A cloud vault already exists. Export and restore your original vault manually if you want to replace it.');
    const old = await readVault();
    if (!old) throw new Error('No original device-local vault was found.');
    await adopt(old, password);
  }
  async function loadCloud() {
    await queue.current;
    if (revision.current !== savedRevision.current) throw new Error('Save or back up your unsaved writing first.');
    const remote = await cloudVault(userId);
    if (!remote) throw new Error('No cloud version exists yet. Retry sync instead.');
    const next = { envelope: envelopeSchema.parse(remote.envelope), baseRevision: remote.revision, pending: false };
    await writeCache(userId, next);
    cache.current = next; base.current = remote.revision;
    key.current = null; latest.current = null; setData(null); setExists(true); setConflict(false); setError(''); setStatus('Synced privately');
  }
  return { data, exists, loading, access, legacy, status, error, conflict, unlock, create, update, backup, lock, restore, importLegacy, sync, loadCloud, reload: initialize };
}
export type Vault = ReturnType<typeof useBloomVault>;
