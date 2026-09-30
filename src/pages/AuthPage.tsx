import { useState } from 'react';
import { Shield, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, fullName);
      if (err) setError(err);
      else setSuccess('Account created! You are now signed in.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px] animate-pulse-soft" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/15 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '1s' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-2xl shadow-primary-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-ink-100">JobShield AI</h1>
          <p className="text-sm text-ink-400 mt-1">Detect fraudulent job postings with AI</p>
        </div>

        <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-ink-800/50 rounded-xl mb-6">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'login' ? 'bg-primary-500/20 text-primary-300' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'register' ? 'bg-primary-500/20 text-primary-300' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="animate-fade-in">
                <label className="glass-label">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="glass-input pl-10"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="glass-label">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input pl-10"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="glass-label">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input pl-10"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-300 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-success-500/10 border border-success-500/20 text-success-300 text-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="text-center text-xs text-ink-500 mt-6">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccess(null); }}
              className="text-primary-400 hover:text-primary-300 font-medium"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-ink-600 mt-6">
          Protected by Supabase Auth · JWT sessions · Row-level security
        </p>
      </div>
    </div>
  );
}
