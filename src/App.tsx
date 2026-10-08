import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PrivateBloom, SessionContextProvider } from '@/components/bloom/SessionContext';
import Index from './pages/Index';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}><TooltipProvider><Toaster/><Sonner/><BrowserRouter><SessionContextProvider><Routes>
  <Route path="/" element={<PrivateBloom><Index/></PrivateBloom>}/>
  <Route path="/login" element={<Login/>}/>
  <Route path="/auth/callback" element={<AuthCallback/>}/>
  <Route path="/reset-password" element={<ResetPassword/>}/>
  <Route path="*" element={<NotFound/>}/>
</Routes></SessionContextProvider></BrowserRouter></TooltipProvider></QueryClientProvider>;
export default App;
