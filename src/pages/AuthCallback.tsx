import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { authError } from '@/lib/auth-errors';

let exchange: Promise<unknown> | null = null;
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));
      if (params.get('error_description') || hash.get('error_description')) throw new Error(params.get('error_description') || hash.get('error_description') || 'This link could not be opened.');
      const code = params.get('code');
      if (code) { exchange ??= supabase.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) throw error; }); await exchange; }
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error('This link is expired or has already been used. Please sign in or request a new link.');
      if (active) navigate(hash.get('type') === 'recovery' || sessionStorage.getItem('bloom-recovery') === 'yes' ? '/reset-password' : '/', { replace: true });
    };
    run().catch(e => { if (active) setError(authError(e)); });
    return () => { active = false; };
  }, [navigate]);
  return <div className="flex min-h-screen items-center justify-center p-6"><div className="bloom-card max-w-md p-8 text-center"><h1 className="font-display text-3xl">Opening your sanctuary…</h1>{error && <><p role="alert" className="mt-4 text-sm leading-6">{error}</p><Link to="/login" className="mt-5 block text-primary underline">Back to sign in</Link></>}</div></div>;
}
