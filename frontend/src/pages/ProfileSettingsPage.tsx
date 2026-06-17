import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import CustomerLayout from '../components/layout/CustomerLayout';
import { PageHeader, Card, CardHeader } from '../components/admin';
import { Button, Input, Label } from '../components/ui/Base';
import { cn } from '../lib/utils';
import { Lock, User, Mail, Building, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user, changePassword } = useStore();
  const [oldPassword, setOldPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [status, setStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const Layout = user?.role === 'super_admin' || user?.role === 'client_admin' ? AdminLayout : CustomerLayout;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters' });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    const success = await changePassword(oldPassword, newPassword);
    if (success) {
      setStatus({ type: 'success', message: 'Password changed successfully' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatus({ type: 'error', message: 'Failed to change password. Please check your old password.' });
    }
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader title="Profile settings" subtitle="Manage your account information and security." />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-ns-blue-soft border border-ns-border flex items-center justify-center text-ns-blue mb-4">
                  <User size={40} />
                </div>
                <h2 className="text-base font-semibold text-ns-text">{user?.name}</h2>
                <p className="text-xs font-medium text-ns-blue uppercase tracking-wide mt-1">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>

              <div className="mt-6 space-y-4 pt-6 border-t border-ns-border">
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-ns-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ns-text-muted uppercase">Email</p>
                    <p className="text-sm font-medium text-ns-text truncate">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Building size={16} className="text-ns-text-muted flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ns-text-muted uppercase">Company</p>
                    <p className="text-sm font-medium text-ns-text truncate">{user?.companyName || 'Platform administrator'}</p>
                  </div>
                </div>

                {user?.jobTitle && (
                  <div className="flex items-center gap-3">
                    <Briefcase size={16} className="text-ns-text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-ns-text-muted uppercase">Job title</p>
                      <p className="text-sm font-medium text-ns-text truncate">{user?.jobTitle}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="p-5 border-b border-ns-border">
                <CardHeader title="Change password" subtitle="Update your account password" />
              </div>

              <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
                {status && (
                  <div
                    className={cn(
                      'p-4 rounded-ns-md flex items-start gap-3 border text-sm',
                      status.type === 'success'
                        ? 'bg-status-approved-bg border-status-approved/20 text-status-approved'
                        : 'bg-status-rejected-bg border-status-rejected/20 text-status-rejected',
                    )}
                  >
                    {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <p className="font-medium">{status.message}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>New password</Label>
                    <Input
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirm new password</Label>
                    <Input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-ns-border flex justify-end">
                  <Button type="submit" disabled={isSubmitting} className="gap-2">
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Lock size={16} />
                    )}
                    {isSubmitting ? 'Updating…' : 'Update password'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
