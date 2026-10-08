import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { authError } from '@/lib/auth-errors';

export const approvedEmail = 'dannyraymiselo@gmail.com';
const Context = createContext<{ session: Session | null; loading: boolean; recovery: boolean; error: string; finishRecovery: () => void }>({ session: null, loading: true, recovery: false, error: '', finishRecovery: () => {} });
export function SessionContextProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(() => window.location.hash.includes('type=recovery') || sessionStorage.getItem('bloom-recovery') === 'yes');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next); setLoading(false);
      if (event === 'PASSWORD_RECOVERY') { setRecovery(true); sessionStorage.setItem('bloom-recovery', 'yes'); }
      if (event === 'SIGNED_OUT') { setError(''); setRecovery(false); sessionStorage.removeItem('bloom-recovery'); }
    });
    supabase.auth.getSession().then(({ data, error }) => { if (active) { if (error) setError(authError(error)); setSession(data.session); setLoading(false); } }).catch(e => { if (active) { setError(authError(e)); setLoading(false); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <Context.Provider value={{ session, loading, recovery, error, finishRecovery: () => { setRecovery(false); sessionStorage.removeItem('bloom-recovery'); } }}>{children}</Context.Provider>;
}
export const useSession = () => useContext(Context);
export function PrivateBloom({ children }: { children: React.ReactNode }) {
  const { session, loading, recovery } = useSession();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center font-display text-2xl text-primary">Opening your little world…</div>;
  if (recovery) return <Navigate to="/reset-password" replace/>;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
  return <div key={session.user.id}>{children}</div>;
}
