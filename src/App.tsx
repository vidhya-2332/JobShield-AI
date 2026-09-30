import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { useRouter } from './lib/router';
import { Sidebar, TopNav } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { UploadPage } from './pages/UploadPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelPage } from './pages/ModelPage';
import { SettingsPage } from './pages/SettingsPage';
import { Spinner } from './components/ui';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Overview of your fraud detection activity' },
  analyze: { title: 'Analyze Job', subtitle: 'Run AI-powered fraud detection on a job posting' },
  upload: { title: 'Upload CSV', subtitle: 'Batch analyze multiple job postings' },
  analytics: { title: 'Analytics', subtitle: 'Interactive fraud trends and statistics' },
  reports: { title: 'Reports', subtitle: 'Download PDF and CSV reports' },
  history: { title: 'Prediction History', subtitle: 'View all past predictions' },
  model: { title: 'Model Performance', subtitle: 'ML model metrics and feature importance' },
  settings: { title: 'Settings', subtitle: 'Manage your account and preferences' },
};

function AppContent() {
  const { user, loading } = useAuth();
  const { route, navigate } = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size={32} />
          <p className="text-sm text-ink-400">Loading JobShield AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const meta = PAGE_META[route] || PAGE_META.dashboard;

  return (
    <div className="min-h-screen">
      <Sidebar route={route} navigate={navigate} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
        <TopNav title={meta.title} subtitle={meta.subtitle} />
        <main className="p-6 max-w-[1600px] mx-auto">
          <div key={route} className="animate-fade-in">
            {route === 'dashboard' && <DashboardPage navigate={navigate} />}
            {route === 'analyze' && <AnalyzePage />}
            {route === 'upload' && <UploadPage />}
            {route === 'analytics' && <AnalyticsPage />}
            {route === 'reports' && <ReportsPage navigate={navigate} />}
            {route === 'history' && <HistoryPage navigate={navigate} />}
            {route === 'model' && <ModelPage />}
            {route === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
