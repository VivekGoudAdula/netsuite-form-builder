import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Label } from '../components/ui/Base';
import { LogIn, ShieldCheck, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading, error: storeError, forgotPassword } = useStore();
  
  // Login State
  const [email, setEmail] = React.useState('admin@netsuiteform.com');
  const [password, setPassword] = React.useState('Admin@123');
  
  // Forgot Password State
  const [isForgotMode, setIsForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotStatus, setForgotStatus] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [errorSpace, setErrorSpace] = React.useState('');

  React.useEffect(() => {
    if (user) {
      if (user.role === 'super_admin' || user.role === 'client_admin') {
        navigate('/dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSpace('');
    const success = await login(email, password);
    if (!success) {
      setErrorSpace('Authentication failed. Please check your credentials.');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    const success = await forgotPassword(forgotEmail);
    if (success) {
      setForgotStatus({ type: 'success', message: 'If an account exists, a reset link has been sent.' });
    } else {
      setForgotStatus({ type: 'error', message: 'Failed to process request. Please try again.' });
    }
  };

  const currentError = storeError || errorSpace;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-ns-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-ns-navy/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md bg-white rounded-sm shadow-2xl overflow-hidden border border-ns-border relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-ns-navy p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-ns-blue" />
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ns-blue rounded-sm mb-4 shadow-xl transform transition-transform hover:scale-105 duration-300">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NetSuite Form Bridge</h1>
          <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mt-2">Enterprise Access Protocol</p>
        </div>
        
        <div className="p-8">
          {!isForgotMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm animate-in shake duration-300">
                  {currentError}
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-ns-navy">Personnel Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={16} />
                  <Input 
                    type="email" 
                    placeholder="Enter email address"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="h-11 pl-10 bg-ns-gray-bg border-ns-border focus:bg-white transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-ns-navy">Security Key</Label>
                  <button 
                    type="button" 
                    onClick={() => setIsForgotMode(true)}
                    className="text-[10px] font-bold text-ns-blue hover:underline uppercase tracking-widest"
                  >
                    Forgot?
                  </button>
                </div>
                <Input 
                  type="password" 
                  placeholder="Enter password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="h-11 bg-ns-gray-bg border-ns-border focus:bg-white transition-all"
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-ns-navy hover:bg-ns-navy/90 text-sm font-bold gap-2 shadow-lg shadow-ns-navy/20 uppercase tracking-widest">
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Authenticate
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <button 
                type="button" 
                onClick={() => setIsForgotMode(false)}
                className="flex items-center gap-2 text-[10px] font-bold text-ns-text-muted hover:text-ns-navy uppercase tracking-widest mb-2 transition-colors"
              >
                <ArrowLeft size={14} />
                Return to Access
              </button>
              
              <div className="space-y-2 text-center pb-2">
                <h2 className="text-lg font-bold text-ns-navy">Reset Protocol</h2>
                <p className="text-xs text-ns-text-muted">Enter your email to receive an authorization link.</p>
              </div>

              {forgotStatus && (
                <div className={`p-4 rounded-sm flex items-start gap-3 border ${
                  forgotStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {forgotStatus.type === 'success' ? <CheckCircle2 size={18} /> : <LogIn size={18} />}
                  <p className="text-sm font-medium">{forgotStatus.message}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-ns-navy">Personnel Email</Label>
                <Input 
                  type="email" 
                  placeholder="Enter email address"
                  value={forgotEmail} 
                  onChange={(e) => setForgotEmail(e.target.value)} 
                  required 
                  className="h-11 bg-ns-gray-bg border-ns-border focus:bg-white transition-all"
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full h-11 bg-ns-blue hover:bg-ns-blue/90 text-sm font-bold gap-2 shadow-lg shadow-ns-blue/20 uppercase tracking-widest">
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Send Link
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
        
        <div className="bg-ns-gray-bg px-8 py-4 border-t border-ns-border flex justify-between items-center text-[9px] text-ns-text-muted font-bold uppercase tracking-widest">
          <span>Secure Protocol v2.5</span>
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Operational
          </span>
        </div>
      </div>
    </div>
  );
}
