import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Label } from '../components/ui/Base';
import { LogIn, ShieldCheck, Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading, error: storeError, forgotPassword } = useStore();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isForgotMode, setIsForgotMode] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotStatus, setForgotStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
    <div className="min-h-screen bg-ns-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-ns-card ns-panel-shadow-lg overflow-hidden border border-ns-border">
        <div className="ns-header-bar px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 border border-white/25 rounded-ns-md mb-3">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">NetSuite Forms</h1>
          <p className="text-sm text-white/70 mt-1">
            {isForgotMode ? 'Password recovery' : 'Sign in to your account'}
          </p>
        </div>

        <div className="p-8">
          {!isForgotMode ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {currentError && (
                <div className="p-3 bg-status-rejected-bg border border-status-rejected/20 text-status-rejected text-sm rounded-ns-md">
                  {currentError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-ns-text-muted" size={16} />
                  <Input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label>Password</Label>
                  <button
                    type="button"
                    onClick={() => setIsForgotMode(true)}
                    className="text-xs font-medium text-ns-blue hover:text-ns-blue-dark hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <button
                type="button"
                onClick={() => setIsForgotMode(false)}
                className="flex items-center gap-2 text-xs font-medium text-ns-text-muted hover:text-ns-blue mb-2"
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>

              <div className="pb-2">
                <h2 className="text-base font-semibold text-ns-text">Reset password</h2>
                <p className="text-sm text-ns-text-muted mt-1">Enter your email to receive a reset link.</p>
              </div>

              {forgotStatus && (
                <div
                  className={`p-4 rounded-ns-md flex items-start gap-3 border ${
                    forgotStatus.type === 'success'
                      ? 'bg-status-approved-bg border-status-approved/20 text-status-approved'
                      : 'bg-status-rejected-bg border-status-rejected/20 text-status-rejected'
                  }`}
                >
                  {forgotStatus.type === 'success' ? <CheckCircle2 size={18} /> : <LogIn size={18} />}
                  <p className="text-sm font-medium">{forgotStatus.message}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full gap-2">
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          )}
        </div>

        <div className="bg-ns-page-bg px-8 py-3 border-t border-ns-border flex justify-between items-center text-xs text-ns-text-muted">
          <span>Protected sign-in</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-status-approved rounded-full" />
            All systems available
          </span>
        </div>
      </div>
    </div>
  );
}
