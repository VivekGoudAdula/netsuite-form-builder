import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Label } from '../components/ui/Base';
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading, error: storeError } = useStore();
  
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: 'error', message: 'Security token is missing or invalid.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setStatus({ type: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    const success = await resetPassword(token, newPassword);
    if (success) {
      setStatus({ type: 'success', message: 'Security key updated successfully. You can now authenticate.' });
      setTimeout(() => navigate('/'), 3000);
    } else {
      setStatus({ type: 'error', message: storeError || 'Failed to update security key. Link may be expired.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-ns-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-ns-navy/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden border border-ns-border relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-ns-navy p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-ns-blue" />
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ns-blue rounded-sm mb-4 shadow-xl">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Protocol</h1>
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">Establish New Credentials</p>
        </div>
        
        <div className="p-8">
          {status?.type === 'success' ? (
            <div className="text-center py-4 space-y-6 animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto border border-green-100">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-ns-navy">Key Reset Successful</h2>
                <p className="text-sm text-ns-text-muted">Your security credentials have been updated. Redirecting to access portal...</p>
              </div>
              <Button onClick={() => navigate('/')} className="w-full h-11 bg-ns-navy hover:bg-ns-navy/90 text-sm font-bold gap-2 uppercase tracking-widest">
                Return to Access <ArrowRight size={18} />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1 text-center pb-2">
                <h2 className="text-lg font-bold text-ns-navy">Credential Reset</h2>
                <p className="text-xs text-ns-text-muted">Establish a secure 8-character security key for your account.</p>
              </div>

              {status?.type === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-sm flex items-start gap-3 animate-in shake duration-300">
                  <AlertCircle size={18} className="shrink-0" />
                  <p className="text-sm font-medium">{status.message}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-ns-navy">New Security Key</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input 
                    type="password" 
                    placeholder="Min. 8 characters"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    className="h-11 pl-10 bg-ns-gray-bg border-ns-border focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-ns-navy">Confirm Security Key</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input 
                    type="password" 
                    placeholder="Verify security key"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    className="h-11 pl-10 bg-ns-gray-bg border-ns-border focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={isLoading || !token} className="w-full h-11 bg-ns-navy hover:bg-ns-navy/90 text-sm font-bold gap-2 shadow-lg shadow-ns-navy/20 uppercase tracking-widest">
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Finalize Reset
                  </>
                )}
              </Button>

              {!token && (
                <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-tighter">
                  Error: Access token is missing. Please use the link from your email.
                </p>
              )}
            </form>
          )}
        </div>
        
        <div className="bg-ns-gray-bg px-8 py-4 border-t border-ns-border flex justify-between items-center text-[9px] text-ns-text-muted font-bold uppercase tracking-widest">
          <span>Secure Protocol v2.5</span>
          <span className="flex items-center gap-1">
            <ShieldCheck size={10} className="text-green-500" />
            Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
