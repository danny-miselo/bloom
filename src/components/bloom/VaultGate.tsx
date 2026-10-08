import { useState } from 'react';
import { Flower2, ArrowRight, LockKeyhole, ShieldCheck, Upload, Sparkles, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Vault } from '@/hooks/use-bloom-vault';
import { approvedEmail, useSession } from './SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { authError } from '@/lib/auth-errors';
import { download } from '@/lib/bloom-vault';

export default function VaultGate({ vault }: { vault: Vault }) {
  const { session } = useSession();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [backup, setBackup] = useState<unknown>(null);
  const [importing, setImporting] = useState(false);
  const restoring = backup !== null;
  async function action(run: () => Promise<unknown>) { setBusy(true); setError(''); try { await run(); } catch (e) { setError(authError(e)); } finally { setBusy(false); } }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!vault.exists && !restoring && !importing && password !== confirmation) { setError("Those passwords don't match yet."); return; }
    if (restoring && vault.exists && !window.confirm('Replace this account’s vault with the selected backup? Export your current vault first if you want to keep it.')) return;
    await action(async () => {
      try {
        if (restoring) await vault.restore(backup, password);
        else if (importing) await vault.importLegacy(password);
        else if (vault.exists) await vault.unlock(password);
        else await vault.create(password);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'OperationError') throw new Error('That sanctuary password could not unlock the vault. Check it and try again.');
        throw e;
      }
    });
  }
  const allowed = vault.access === 'allowed';
  return <div className="min-h-screen bg-[var(--cream)]"><header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-12"><div className="flex items-center gap-2 text-primary"><Flower2 size={30} strokeWidth={1.3}/><span className="font-display text-4xl">bloom<span className="text-[var(--gold)]">.</span></span></div><button className="text-xs text-primary" disabled={busy} onClick={() => action(async () => { await vault.lock(); const { error } = await supabase.auth.signOut(); if (error) throw error; })}>Sign out</button></header>
    <main className="mx-auto grid max-w-6xl gap-10 px-6 pb-12 pt-7 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-16 md:pt-12"><div className="relative overflow-hidden rounded-[2rem] bg-[#f1e8df] px-8 py-12 sm:px-12 sm:py-20"><img src="/assets/bloom-botanical.png" alt="Delicate roses and sage leaves" className="absolute inset-0 h-full w-full object-cover object-right opacity-80"/><div className="relative max-w-xs"><span className="eyebrow text-primary">MADE WITH LOVE, FOR PHILILE</span><h1 className="mt-6 font-display text-5xl leading-[1.1] sm:text-6xl">Your own<br/>little world.</h1><p className="mt-6 text-sm leading-7 text-[var(--ink-soft)]">Somewhere to write, dream, create<br/>and become. Somewhere to be you.</p><div className="mt-14 flex items-center gap-2 text-primary"><Sparkles size={16}/><span className="font-display text-xl italic">Bigger dreams. Same girl.</span></div></div></div>
    <section className="mx-auto w-full max-w-sm"><span className="eyebrow">YOUR PRIVATE SANCTUARY</span><h2 className="mt-3 font-display text-4xl">Hi there, beautiful.</h2><p className="mb-5 mt-3 break-words text-xs leading-6 text-muted-foreground">Signed in as {session?.user.email}. Your sanctuary password is separate from your account password.</p>
    {vault.loading ? <p className="py-8">Checking your private cloud sanctuary…</p> : !allowed ? <div className="rounded-2xl bg-[var(--blush)] p-5"><h3 className="font-display text-2xl">{vault.access === 'denied' ? 'A private invitation' : 'Connection needed'}</h3><p className="mt-3 text-sm leading-7">{vault.access === 'denied' ? `Cloud access is reserved for the verified account ${approvedEmail}. Sign out and use that account.` : vault.error}</p><Button variant="outline" className="mt-4 rounded-full" disabled={busy} onClick={() => action(vault.reload)}>Check again</Button></div> : <>
    {vault.conflict && <div className="mb-4 rounded-xl bg-rose-100 p-4 text-xs leading-6 text-rose-900"><p>{vault.error}</p><button disabled={busy} className="mt-2 flex items-center gap-2 underline" onClick={() => action(async () => download(new Blob([JSON.stringify(await vault.backup())], { type: 'application/json' }), 'bloom-conflict-backup.json'))}><Download size={13}/>Back up local changes</button><button disabled={busy} className="mt-3 block underline" onClick={() => { if (window.confirm('Have you saved a backup? Loading cloud replaces this account’s local pending changes.')) void action(vault.loadCloud); }}>Load cloud version</button></div>}
    <form onSubmit={submit} className="space-y-4"><label className="block text-sm">{restoring ? 'Your backup’s sanctuary password' : importing ? 'Your original device-vault password' : vault.exists ? 'Your sanctuary password' : 'Create your sanctuary password'}<input autoFocus className="bloom-input mt-2" type="password" autoComplete={vault.exists || importing || restoring ? 'current-password' : 'new-password'} minLength={vault.exists || restoring || importing ? 1 : 10} required value={password} onChange={e => setPassword(e.target.value)} placeholder="A secret, just for you"/></label>{!vault.exists && !restoring && !importing && <label className="block text-sm">Confirm sanctuary password<input className="bloom-input mt-2" type="password" autoComplete="new-password" minLength={10} required value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Your secret, once more"/></label>}
    <p className="text-xs leading-6 text-muted-foreground">Keep this password safe. It encrypts your words and photos and cannot be reset—even if you reset your account password.</p>
    {(error || vault.error && !vault.conflict) && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900">{error || vault.error}</p>}
    <Button disabled={busy} className="h-12 w-full rounded-full shadow-sm">{busy ? 'Opening…' : restoring ? 'Restore and sync this backup' : importing ? 'Import my original sanctuary' : vault.exists ? 'Come on in' : 'Create my little world'}<ArrowRight className="ml-2 h-4 w-4"/></Button></form>
    {vault.legacy && !vault.exists && !restoring && <button disabled={busy} className="mt-4 w-full rounded-xl border border-border p-3 text-xs text-primary" onClick={() => { setImporting(!importing); setPassword(''); }}>{importing ? 'Create a new vault instead' : 'Import the original vault from this browser'}</button>}
    {!busy && <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 text-xs text-muted-foreground"><Upload size={14}/>Restore an encrypted Bloom backup<input type="file" accept=".json" className="sr-only" onChange={async e => { try { const file = e.target.files?.[0]; if (file) { if (file.size > 100 * 1024 * 1024) throw new Error(); setBackup(JSON.parse(await file.text())); setImporting(false); setError(''); } } catch { setError('Choose a valid Bloom backup under 100 MB.'); } e.target.value = ''; }}/></label>}{restoring && <button disabled={busy} onClick={() => setBackup(null)} className="mt-2 w-full text-xs text-primary">Cancel restore</button>}
    </>}
    <div className="mt-8 flex gap-3 border-t border-border pt-5 text-xs leading-6 text-muted-foreground"><ShieldCheck className="mt-1 shrink-0 text-[var(--sage)]" size={20}/><p>Encrypted before cloud sync. Sign in with the same account and unlock with the same sanctuary password on another device. Wait for “Synced privately” before switching. The original local vault is not removed.</p></div></section></main><footer className="px-6 pb-8 text-center font-display text-lg italic text-muted-foreground">You are worth everything. You are loved. You are supported. You are Everything.</footer></div>;
}
