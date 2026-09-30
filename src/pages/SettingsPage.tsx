import { useState } from 'react';
import { Settings as SettingsIcon, User, Mail, Lock, Palette, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { apiRequest } from '../lib/api';

export function SettingsPage() {
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [theme, setTheme] = useState(profile?.theme_preference || 'dark');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function handleSaveProfile() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: err } = await updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
      theme_preference: theme,
    });
    if (err) setError(err);
    else setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword() {
    setPwError(null);
    setPwSaved(false);
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwSaving(true);
    const { error: err } = await apiRequest('/change-password/', {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
    });
    if (err) setPwError(err);
    else {
      setPwSaved(true);
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwSaving(false);
    setTimeout(() => setPwSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-100">Profile Settings</h3>
            <p className="text-xs text-ink-400">Update your personal information</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="glass-label">Email (read-only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input className="glass-input pl-10 opacity-60" value={user?.email || ''} disabled />
            </div>
          </div>
          <div>
            <label className="glass-label">Full Name</label>
            <input className="glass-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="glass-label">Avatar URL</label>
            <input className="glass-input" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-300 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success-500/10 border border-success-500/20 text-success-300 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Profile saved successfully
            </div>
          )}

          <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {/* Theme section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-100">Appearance</h3>
            <p className="text-xs text-ink-400">Customize your interface theme</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-4 rounded-xl border transition-all ${
                theme === t
                  ? 'border-primary-500/40 bg-primary-500/10'
                  : 'border-white/10 bg-ink-800/40 hover:border-white/20'
              }`}
            >
              <div className={`w-full h-16 rounded-lg mb-2 ${t === 'dark' ? 'bg-ink-900' : 'bg-ink-100'}`} />
              <p className="text-sm font-medium text-ink-200 capitalize">{t} Mode</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-500 mt-3">Dark mode is currently the active production theme.</p>
      </div>

      {/* Password section */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning-500 to-warning-600 flex items-center justify-center">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-100">Change Password</h3>
            <p className="text-xs text-ink-400">Update your account password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="glass-label">New Password</label>
            <input type="password" className="glass-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <div>
            <label className="glass-label">Confirm Password</label>
            <input type="password" className="glass-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>

          {pwError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-300 text-sm">
              <AlertCircle className="w-4 h-4" /> {pwError}
            </div>
          )}
          {pwSaved && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success-500/10 border border-success-500/20 text-success-300 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Password updated successfully
            </div>
          )}

          <button onClick={handleChangePassword} disabled={pwSaving} className="btn-primary">
            {pwSaving ? 'Updating...' : <><Lock className="w-4 h-4" /> Update Password</>}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-5 h-5 text-ink-400" />
          <h3 className="text-base font-semibold text-ink-100">About JobShield AI</h3>
        </div>
        <div className="space-y-2 text-sm text-ink-400">
          <p><span className="text-ink-300">Version:</span> 1.0.0</p>
          <p><span className="text-ink-300">Model:</span> Hybrid v1 (Rule Engine + Logistic Regression + NLP)</p>
          <p><span className="text-ink-300">Backend:</span> Supabase (PostgreSQL + Auth + RLS)</p>
          <p><span className="text-ink-300">Dataset:</span> EMSCAD (Empirical Study of Employment Scams)</p>
        </div>
      </div>
    </div>
  );
}
