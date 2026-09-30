import {
  LayoutDashboard, ScanSearch, Upload, BarChart3, FileText,
  History, Cpu, Settings, Shield, LogOut, Bell, Search, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import type { Route } from '../lib/router';
import { useState } from 'react';

const NAV_ITEMS: { route: Route; label: string; icon: typeof LayoutDashboard }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'analyze', label: 'Analyze Job', icon: ScanSearch },
  { route: 'upload', label: 'Upload CSV', icon: Upload },
  { route: 'analytics', label: 'Analytics', icon: BarChart3 },
  { route: 'reports', label: 'Reports', icon: FileText },
  { route: 'history', label: 'Prediction History', icon: History },
  { route: 'model', label: 'Model Performance', icon: Cpu },
  { route: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({
  route,
  navigate,
  collapsed,
  setCollapsed,
}: {
  route: Route;
  navigate: (r: Route) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const { profile, signOut } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col glass border-r border-white/5 transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold text-ink-100 leading-tight">JobShield</h1>
            <p className="text-[10px] text-ink-400 uppercase tracking-widest">AI Detection</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-ink-800 border border-white/10 flex items-center justify-center text-ink-400 hover:text-ink-100 hover:bg-ink-700 transition-all"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const active = route === item.route;
          const Icon = item.icon;
          return (
            <button
              key={item.route}
              onClick={() => navigate(item.route)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                active
                  ? 'bg-gradient-to-r from-primary-500/20 to-primary-500/5 text-primary-300 border border-primary-500/20'
                  : 'text-ink-400 hover:text-ink-100 hover:bg-white/5'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary-400" />
              )}
              <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary-400' : ''}`} />
              {!collapsed && <span className="animate-fade-in">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-3 py-4 border-t border-white/5">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-ink-100 truncate">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-xs text-ink-500 truncate">Free Plan</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={signOut}
            className="w-full mt-3 flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-400 hover:text-error-300 hover:bg-error-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}

export function TopNav({ title, subtitle }: { title: string; subtitle?: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="sticky top-0 z-20 h-16 glass border-b border-white/5 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-100">{title}</h2>
        {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          {searchOpen ? (
            <input
              autoFocus
              onBlur={() => setSearchOpen(false)}
              placeholder="Search jobs, predictions..."
              className="glass-input w-64 py-2 pl-9 text-sm"
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="btn-ghost"
            >
              <Search className="w-5 h-5" />
            </button>
          )}
          {searchOpen && <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />}
        </div>
        <button className="btn-ghost relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error-500" />
        </button>
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-semibold text-sm">
          U
        </div>
      </div>
    </header>
  );
}
