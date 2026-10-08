import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/bloom/SessionContext';
import { authError } from '@/lib/auth-errors';

let exchange: Promise<unknown> | null = null;
export default function ResetPassword() {
  const { session, loading, finishRecovery } = useSession();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(!new URLSearchParams(window.location.search).has('code'));
  const navigate = useNavigate();
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;
    let active = true;
    exchange ??= supabase.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) throw error; });
    exchange.then(() => { if (active) { setReady(true); window.history.replaceState(null, '', '/reset-password'); } }).catch(e => { if (active) setError(authError(e)); });
    return () => { active = false; };
  }, []);
  return <div className="flex min-h-screen items-center justify-center px-6"><section className="bloom-card w-full max-w-md p-8"><span className="eyebrow">ACCOUNT RECOVERY</span><h1 className="mt-3 font-display text-3xl">A fresh little start.</h1><p className="mb-6 mt-3 text-xs leading-6 text-muted-foreground">This resets your account password, not the sanctuary password that encrypts your vault. The sanctuary password cannot be recovered.</p>{loading || !ready && !error ? <p>Checking your recovery link…</p> : session && ready ? <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setError(''); if (password !== confirm) { setError("Those passwords don't match."); return; } setBusy(true); try { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; finishRecovery(); navigate('/', { replace: true }); } catch (e) { setError(authError(e)); } finally { setBusy(false); } }}><label className="block text-sm">New account password<input type="password" autoComplete="new-password" minLength={10} required className="bloom-input mt-2" value={password} onChange={e => setPassword(e.target.value)}/></label><label className="block text-sm">Confirm password<input type="password" autoComplete="new-password" minLength={10} required className="bloom-input mt-2" value={confirm} onChange={e => setConfirm(e.target.value)}/></label><Button disabled={busy} className="w-full rounded-full">{busy ? 'Saving…' : 'Update account password'}</Button></form> : <p className="text-sm leading-6">Open the reset link from your email to update your password. If it has expired, request a new one.</p>}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<Link to="/login" onClick={() => { finishRecovery(); }} className="mt-5 block text-xs text-primary underline">Back to sign in</Link></section></div>;
}
