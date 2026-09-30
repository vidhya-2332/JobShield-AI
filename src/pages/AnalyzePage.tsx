import { useState } from 'react';
import {
  ScanSearch, Building2, Globe, DollarSign, Briefcase, GraduationCap,
  MapPin, FileText, ListChecks, Gift, Image, Loader2, RotateCcw,
} from 'lucide-react';
import type { JobInput, PredictionResult } from '../ml/types';
import { predict } from '../ml/predict';
import { saveJobAndPrediction } from '../lib/data';
import { PredictionResultView } from '../components/PredictionResultView';
import { exportReport } from '../lib/export';

const EMPTY_JOB: JobInput = {
  title: '', company_name: '', company_profile: '', website: '', location: '',
  salary: 0, salary_currency: 'USD', employment_type: '', experience: '',
  education: '', description: '', requirements: '', benefits: '', questions: '',
  company_logo_url: '',
};

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Other'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Associate', 'Mid-Senior', 'Director', 'Executive', 'Not Specified'];
const EDUCATION_LEVELS = ['High School', 'Associate', 'Bachelor', 'Master', 'Doctorate', 'Not Specified'];

function Field({
  label, icon: Icon, children,
}: { label: string; icon: typeof Building2; children: React.ReactNode }) {
  return (
    <div>
      <label className="glass-label flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-ink-500" /> {label}
      </label>
      {children}
    </div>
  );
}

export function AnalyzePage() {
  const [job, setJob] = useState<JobInput>(EMPTY_JOB);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof JobInput>(key: K, value: JobInput[K]) {
    setJob((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAnalyze() {
    if (!job.title.trim() || !job.description.trim()) {
      setError('Job title and description are required.');
      return;
    }
    setError(null);
    setAnalyzing(true);
    // Simulate model inference time for UX feedback.
    await new Promise((r) => setTimeout(r, 600));
    const prediction = predict(job);
    const { mergedResult, error: saveErr } = await saveJobAndPrediction(job, prediction);
    if (saveErr) {
      console.error('Save failed:', saveErr);
      setError(`Analysis was computed locally, but saving to your account failed: ${saveErr}`);
    }
    setResult(mergedResult);
    setAnalyzing(false);
  }

  function handleReset() {
    setJob(EMPTY_JOB);
    setResult(null);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Store as a data URL — in production this would upload to Supabase Storage.
    const reader = new FileReader();
    reader.onload = () => update('company_logo_url', reader.result as string);
    reader.readAsDataURL(file);
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw className="w-4 h-4" /> Analyze Another Job
          </button>
        </div>
        <PredictionResultView
          result={result}
          job={job}
          onExport={() => exportReport(result, job)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-100">Manual Job Entry</h3>
            <p className="text-xs text-ink-400">Fill in the job posting details to run fraud detection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Job Title *" icon={Briefcase}>
            <input className="glass-input" value={job.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </Field>
          <Field label="Company Name" icon={Building2}>
            <input className="glass-input" value={job.company_name} onChange={(e) => update('company_name', e.target.value)} placeholder="e.g. Acme Corp" />
          </Field>
          <Field label="Company Website" icon={Globe}>
            <input className="glass-input" value={job.website} onChange={(e) => update('website', e.target.value)} placeholder="https://acme.com" />
          </Field>
          <Field label="Location" icon={MapPin}>
            <input className="glass-input" value={job.location} onChange={(e) => update('location', e.target.value)} placeholder="e.g. San Francisco, CA" />
          </Field>
          <Field label="Salary (annual)" icon={DollarSign}>
            <div className="flex gap-2">
              <input type="number" className="glass-input flex-1" value={job.salary || ''} onChange={(e) => update('salary', Number(e.target.value) || 0)} placeholder="e.g. 95000" />
              <select className="glass-input w-28" value={job.salary_currency} onChange={(e) => update('salary_currency', e.target.value)}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </Field>
          <Field label="Employment Type" icon={Briefcase}>
            <select className="glass-input" value={job.employment_type} onChange={(e) => update('employment_type', e.target.value)}>
              <option value="">Select type</option>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Experience" icon={Briefcase}>
            <select className="glass-input" value={job.experience} onChange={(e) => update('experience', e.target.value)}>
              <option value="">Select level</option>
              {EXPERIENCE_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Education" icon={GraduationCap}>
            <select className="glass-input" value={job.education} onChange={(e) => update('education', e.target.value)}>
              <option value="">Select level</option>
              {EDUCATION_LEVELS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <Field label="Company Profile" icon={Building2}>
            <textarea className="glass-input min-h-[80px] resize-y" value={job.company_profile} onChange={(e) => update('company_profile', e.target.value)} placeholder="Describe the company..." />
          </Field>
          <Field label="Job Description *" icon={FileText}>
            <textarea className="glass-input min-h-[120px] resize-y" value={job.description} onChange={(e) => update('description', e.target.value)} placeholder="Paste the full job description..." />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Requirements" icon={ListChecks}>
              <textarea className="glass-input min-h-[100px] resize-y" value={job.requirements} onChange={(e) => update('requirements', e.target.value)} placeholder="Required skills, experience..." />
            </Field>
            <Field label="Benefits" icon={Gift}>
              <textarea className="glass-input min-h-[100px] resize-y" value={job.benefits} onChange={(e) => update('benefits', e.target.value)} placeholder="Health insurance, PTO, etc." />
            </Field>
          </div>
          <Field label="Screening Questions" icon={FileText}>
            <textarea className="glass-input min-h-[60px] resize-y" value={job.questions} onChange={(e) => update('questions', e.target.value)} placeholder="Any screening questions asked..." />
          </Field>
          <Field label="Company Logo" icon={Image}>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="glass-input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary-500/20 file:text-primary-300 file:font-medium file:cursor-pointer" />
            {job.company_logo_url && (
              <div className="mt-2 flex items-center gap-2 text-xs text-success-300">
                <img src={job.company_logo_url} alt="logo" className="w-8 h-8 rounded-lg object-cover" />
                Logo uploaded
              </div>
            )}
          </Field>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-300 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary">
            {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><ScanSearch className="w-4 h-4" /> Run Detection</>}
          </button>
          <button onClick={handleReset} className="btn-secondary">
            <RotateCcw className="w-4 h-4" /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}
