import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button, Input, Label } from '../components/ui/Base';
import { LogIn, ShieldCheck, User } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, isLoading, error: storeError } = useStore();
  const [email, setEmail] = React.useState('admin@netsuiteform.com');
  const [password, setPassword] = React.useState('Admin@123');
  const [errorSpace, setErrorSpace] = React.useState('');

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/dashboard');
      else navigate('/customer-dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (!success) {
      setErrorSpace('Authentication failed. Please check your credentials.');
    }
  };

  const currentError = storeError || errorSpace;

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
            {currentError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm">
                {currentError}
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
            
            <Button type="submit" disabled={isLoading} className="w-full h-11 text-base font-bold gap-2">
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  Authenticate
                </>
              )}
            </Button>
          </form>
          
        </div>
        
        <div className="bg-ns-gray-bg px-8 py-4 border-t border-ns-border flex justify-between items-center text-[10px] text-ns-text-muted font-bold uppercase tracking-widest">
          <span>v2.1.0 Enterprise</span>
          <span>© 2024 Oracle NetSuite</span>
        </div>
      </div>
    </div>
  );
}
