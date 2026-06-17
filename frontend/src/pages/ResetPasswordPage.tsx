import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Label } from '../components/ui/Base';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword, isLoading, error: storeError } = useStore();

  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!token) {
      setStatus({ type: 'error', message: 'Reset link is missing or invalid.' });
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
      setStatus({ type: 'success', message: 'Password updated successfully. Redirecting to sign in…' });
      setTimeout(() => navigate('/'), 3000);
    } else {
      setStatus({ type: 'error', message: storeError || 'Failed to update password. Link may be expired.' });
    }
  };

  return (
    <div className="min-h-screen bg-ns-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-ns-card ns-panel-shadow-lg overflow-hidden border border-ns-border">
        <div className="ns-header-bar px-8 py-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 border border-white/25 rounded-ns-md mb-3">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Reset password</h1>
          <p className="text-sm text-white/70 mt-1">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {status && (
            <div
              className={`p-4 rounded-ns-md flex items-start gap-3 border ${
                status.type === 'success'
                  ? 'bg-status-approved-bg border-status-approved/20 text-status-approved'
                  : 'bg-status-rejected-bg border-status-rejected/20 text-status-rejected'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Confirm password</Label>
            <Input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full gap-2">
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock size={18} />
                Update password
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-center text-xs font-medium text-ns-text-muted hover:text-ns-blue transition-colors"
          >
            Back to sign in
          </button>
        </form>

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
