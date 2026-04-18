import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Label } from '../components/ui/Base';
import { LogIn, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useStore();
  const [email, setEmail] = React.useState('admin@example.com');
  const [password, setPassword] = React.useState('password123');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/dashboard');
      else navigate('/customer-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-sm shadow-xl overflow-hidden border border-ns-border">
        <div className="bg-ns-navy p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-ns-blue rounded-sm mb-4 shadow-lg">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NetSuite Form Builder</h1>
          <p className="text-white/60 text-sm mt-2">Enterprise Access Control System</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="h-11"
              />
            </div>
            
            <Button type="submit" className="w-full h-11 text-base font-bold gap-2">
              <LogIn size={20} />
              Authenticate
            </Button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-ns-border">
            <h3 className="text-xs font-bold text-ns-text-muted uppercase tracking-widest mb-4">Sample Credentials</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setEmail('admin@example.com'); setPassword('password123'); }}
                className="p-3 bg-ns-gray-bg border border-ns-border rounded-sm hover:border-ns-blue transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-ns-blue uppercase mb-1">
                  <ShieldCheck size={12} /> Admin
                </div>
                <p className="text-[11px] font-medium truncate">admin@example.com</p>
              </button>
              
              <button 
                onClick={() => { setEmail('hdfc_emp@example.com'); setPassword('password123'); }}
                className="p-3 bg-ns-gray-bg border border-ns-border rounded-sm hover:border-ns-blue transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase mb-1">
                  <User size={12} /> Customer
                </div>
                <p className="text-[11px] font-medium truncate">hdfc_emp@example.com</p>
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-ns-gray-bg px-8 py-4 border-t border-ns-border flex justify-between items-center text-[10px] text-ns-text-muted font-bold uppercase tracking-widest">
          <span>v2.1.0 Enterprise</span>
          <span>© 2024 Oracle NetSuite</span>
        </div>
      </div>
    </div>
  );
}
