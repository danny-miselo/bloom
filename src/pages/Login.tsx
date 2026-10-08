import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Navigate } from 'react-router-dom';
import { Flower2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { approvedEmail, useSession } from '@/components/bloom/SessionContext';
import { authError } from '@/lib/auth-errors';

export default function Login() {
  const { session, loading, recovery, error } = useSession();
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [email, setEmail] = useState('');
  const [reset, setReset] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  if (recovery) return <Navigate to="/reset-password" replace/>;
  if (session && !loading) return <Navigate to="/" replace/>;
  return <div className="min-h-screen bg-[var(--cream)] px-6 py-10"><div className="mx-auto max-w-5xl"><div className="mb-10 flex items-center gap-2 text-primary"><Flower2 size={30} strokeWidth={1.2}/><span className="font-display text-4xl">bloom.</span></div><main className="grid gap-8 md:grid-cols-2 md:items-center"><section className="relative min-h-[320px] overflow-hidden rounded-[2rem] bg-[#f1e8df] p-8 sm:p-12"><img src="/assets/bloom-botanical.png" alt="Roses and sage leaves" className="absolute inset-0 h-full w-full object-cover"/><div className="relative max-w-xs"><span className="eyebrow text-primary">MADE WITH LOVE, FOR PHILILE</span><h1 className="mt-6 font-display text-5xl">Your own<br/>little world.</h1><p className="mt-6 text-sm leading-7">Hi there beautiful, You look gorgeous today. Remember Bigger Dreams, Same Girl.</p></div></section><section className="bloom-card p-6 sm:p-8"><span className="eyebrow">PRIVATE ACCOUNT ACCESS</span><h2 className="mb-3 mt-3 font-display text-3xl">Come on in, lovely.</h2><p className="mb-5 text-xs leading-6 text-muted-foreground">Use your account password to sign in. Your separate sanctuary password unlocks your encrypted words and photos. Access is currently reserved for the approved testing email.</p>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {reset ? <form className="space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(''); try { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: new URL('/reset-password', window.location.origin).href }); if (error) throw error; setMessage('If this account exists, a reset link will arrive by email.'); } catch (e) { setMessage(authError(e)); } finally { setBusy(false); } }}><label className="block text-sm">Account email<input required type="email" className="bloom-input mt-2" value={email} onChange={e => setEmail(e.target.value)}/></label><Button disabled={busy} className="w-full rounded-full">{busy ? 'Sending…' : 'Send password reset link'}</Button><button type="button" className="text-xs text-primary" onClick={() => { setReset(false); setMessage(''); }}>Back to sign in</button>{message && <p role="status" className="text-sm leading-6">{message}</p>}</form> : <><Auth key={view} supabaseClient={supabase} redirectTo={new URL('/auth/callback', window.location.origin).href} providers={[]} view={view} showLinks={false} theme="light" appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: '#A95168', brandAccent: '#8f4559', inputText: '#4a4038', inputLabelText: '#72665c', inputBackground: '#fffdf8', inputBorder: '#e4d7ce' }, radii: { borderRadiusButton: '24px', buttonBorderRadius: '24px', inputBorderRadius: '12px' }, fonts: { bodyFontFamily: 'DM Sans, sans-serif', buttonFontFamily: 'DM Sans, sans-serif', inputFontFamily: 'DM Sans, sans-serif', labelFontFamily: 'DM Sans, sans-serif' } } } }}/><div className="mt-4 flex flex-wrap justify-between gap-3 text-xs text-primary"><button onClick={() => setView(view === 'sign_in' ? 'sign_up' : 'sign_in')}>{view === 'sign_in' ? 'First visit? Create your account' : 'Already have an account? Sign in'}</button><button onClick={() => setReset(true)}>Forgot account password?</button></div></>}
      <div className="mt-6 flex gap-2 border-t border-border pt-5 text-xs leading-6 text-muted-foreground"><ShieldCheck size={18} className="mt-1 shrink-0 text-[var(--sage-dark)]"/><p>Email verification is required. Only {approvedEmail} can access the cloud vault. Creating another account does not grant access.</p></div>
    </section></main><p className="mt-10 text-center font-display text-lg italic text-muted-foreground">You are worth everything. You are loved. You are supported. You are Everything.</p></div></div>;
}
