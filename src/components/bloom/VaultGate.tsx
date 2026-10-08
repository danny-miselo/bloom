import { useState } from "react";
import { Flower2, ArrowRight, LockKeyhole, ShieldCheck, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Vault } from "@/hooks/use-bloom-vault";

export default function VaultGate({ vault }: { vault: Vault }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [backup, setBackup] = useState<unknown>(null);
  const restoring = backup !== null;
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!vault.exists && !restoring && password !== confirmation) { setError("Those passwords don't match yet."); return; }
    setBusy(true);
    try {
      if (restoring) await vault.restore(backup, password);
      else if (vault.exists) await vault.unlock(password);
      else await vault.create(password);
    } catch { setError(vault.exists || restoring ? "Could not unlock. Check your password and backup file, then try again." : "Could not create your vault. Please allow browser storage and try again."); }
    finally { setBusy(false); }
  }
  return <div className="min-h-screen bg-[var(--cream)]">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 sm:px-12"><div className="flex items-center gap-2 text-primary"><Flower2 size={30} strokeWidth={1.3}/><span className="font-display text-4xl">bloom<span className="text-[var(--gold)]">.</span></span></div><span className="flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole size={13}/> A little world, just for you</span></header>
    <main className="mx-auto grid max-w-6xl gap-10 px-6 pb-12 pt-7 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-16 md:pt-12">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#f1e8df] px-8 py-12 sm:px-12 sm:py-20"><img src="/assets/bloom-botanical.png" alt="Delicate roses and sage leaves" className="absolute inset-0 h-full w-full object-cover object-right opacity-80"/><div className="relative max-w-xs"><span className="eyebrow text-primary">MADE WITH LOVE, FOR PHILILE</span><h1 className="mt-6 font-display text-5xl leading-[1.1] sm:text-6xl">Your own<br/>little world.</h1><p className="mt-6 text-sm leading-7 text-[var(--ink-soft)]">Somewhere to write, dream, create<br/>and become. Somewhere to be you.</p><div className="mt-14 flex items-center gap-2 text-primary"><Sparkles size={16}/><span className="font-display text-xl italic">Bigger dreams. Same girl.</span></div></div></div>
      <section className="mx-auto w-full max-w-sm"><span className="eyebrow">YOUR PRIVATE SANCTUARY</span><h2 className="mt-3 font-display text-4xl">Hi there, beautiful.</h2><p className="mb-7 mt-3 text-sm leading-7 text-muted-foreground">You look gorgeous today. Remember Bigger Dreams, Same Girl.</p>
        {vault.loading ? <p className="py-8">Opening your sanctuary…</p> : <form onSubmit={submit} className="space-y-4"><label className="block text-sm">{restoring ? "Your backup’s password" : vault.exists ? "Your sanctuary password" : "Create your sanctuary password"}<input autoFocus className="bloom-input mt-2" type="password" autoComplete={vault.exists ? "current-password" : "new-password"} minLength={vault.exists || restoring ? 1 : 10} required value={password} onChange={e => setPassword(e.target.value)} placeholder="A secret, just for you"/></label>{!vault.exists && !restoring && <><label className="block text-sm">Confirm password<input className="bloom-input mt-2" type="password" autoComplete="new-password" minLength={10} required value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Your secret, once more"/></label><p className="text-xs leading-5 text-muted-foreground">Use at least 10 characters. Keep this password safe: it cannot be reset, and without it your encrypted writing cannot be recovered.</p></>}
          {(error || vault.error) && <p role="alert" className="rounded-xl bg-rose-100 p-3 text-sm text-rose-900">{error || vault.error}</p>}
          <Button disabled={busy} className="h-12 w-full rounded-full shadow-sm">{busy ? "Opening…" : restoring ? "Restore my sanctuary" : vault.exists ? "Come on in" : "Create my little world"}<ArrowRight className="ml-2 h-4 w-4"/></Button>
        </form>}
        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 text-xs text-muted-foreground"><Upload size={14}/> Restore an encrypted Bloom backup<input type="file" accept=".json" className="sr-only" onChange={async e => { try { const file = e.target.files?.[0]; if (file) { if (file.size > 100 * 1024 * 1024) throw new Error(); setBackup(JSON.parse(await file.text())); setError(""); } } catch { setError("Please choose a valid Bloom backup file under 100 MB."); } }}/></label>{restoring && <button onClick={() => setBackup(null)} className="mt-2 w-full text-xs text-primary">Cancel restore</button>}
        <div className="mt-8 flex gap-3 border-t border-border pt-5 text-xs leading-6 text-muted-foreground"><ShieldCheck className="mt-1 shrink-0 text-[var(--sage)]" size={20}/><p>Encrypted and kept on this device. No account, no cloud, no sharing. Back up regularly; clearing browser data will remove your vault. Device sync is not enabled.</p></div>
      </section>
    </main><footer className="px-6 pb-8 text-center font-display text-lg italic text-muted-foreground">You are worth everything. You are loved. You are supported. You are Everything.</footer>
  </div>;
}
