import { useState, useRef } from 'react';
import {
  Upload, FileSpreadsheet, Download, Loader2,
  AlertTriangle, ShieldCheck, ShieldAlert,
} from 'lucide-react';
import type { JobInput, PredictionResult } from '../ml/types';
import { predict } from '../ml/predict';
import { exportCSV } from '../lib/export';
import { RiskBadge } from '../components/ui';

interface BatchRow {
  job: JobInput;
  result: PredictionResult;
}

const CSV_TEMPLATE = `title,company_name,company_profile,website,location,salary,salary_currency,employment_type,experience,education,description,requirements,benefits,questions
Senior Software Engineer,TechCorp Inc,We build cloud software,https://techcorp.com,San Francisco CA,150000,USD,Full-time,Mid-Senior,Bachelor,We are hiring a senior engineer to build scalable systems.,5+ years React and Node.js,Health insurance and 401k,What is your notice period?
Data Entry Clerk,,Work from home and earn easy money,,,50000,USD,Part-time,Entry Level,,Earn 50000 weekly no experience needed just apply today,,,,`;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function rowToJob(row: Record<string, string>): JobInput {
  return {
    title: row.title || row['Job Title'] || '',
    company_name: row.company_name || row['Company Name'] || row.company || '',
    company_profile: row.company_profile || row['Company Profile'] || '',
    website: row.website || row['Website'] || '',
    location: row.location || row['Location'] || '',
    salary: Number(row.salary || row['Salary'] || 0) || 0,
    salary_currency: row.salary_currency || row['Salary Currency'] || 'USD',
    employment_type: row.employment_type || row['Employment Type'] || '',
    experience: row.experience || row['Experience'] || '',
    education: row.education || row['Education'] || '',
    description: row.description || row['Description'] || '',
    requirements: row.requirements || row['Requirements'] || '',
    benefits: row.benefits || row['Benefits'] || '',
    questions: row.questions || row['Questions'] || '',
    company_logo_url: '',
  };
}

export function UploadPage() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setFileName(file.name);
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError('CSV is empty or has no data rows.');
        setLoading(false);
        return;
      }
      const jobs = parsed.map(rowToJob);
      const results = jobs.map((job) => ({ job, result: predict(job) }));
      setRows(results);
    } catch (err) {
      setError('Failed to parse CSV file. Please check the format.');
    }
    setLoading(false);
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jobshield_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExport() {
    exportCSV(rows, 'jobshield_batch_results.csv');
  }

  const fraudulent = rows.filter((r) => r.result.prediction === 'fraudulent').length;
  const genuine = rows.length - fraudulent;

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-100">Batch CSV Upload</h3>
            <p className="text-xs text-ink-400">Upload a CSV of job postings for batch fraud detection</p>
          </div>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center cursor-pointer hover:border-primary-500/40 hover:bg-primary-500/5 transition-all duration-300"
        >
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary-400 animate-spin" />
              <p className="text-sm text-ink-300">Analyzing batch...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-ink-200">
                  {fileName ? `Loaded: ${fileName}` : 'Click to upload a CSV file'}
                </p>
                <p className="text-xs text-ink-500 mt-1">Required columns: title, description (others optional)</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-error-500/10 border border-error-500/20 text-error-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button onClick={downloadTemplate} className="btn-secondary">
            <Download className="w-4 h-4" /> Download Template
          </button>
        </div>
      </div>

      {/* Results */}
      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs text-ink-400">Total Analyzed</p>
              <p className="text-2xl font-bold text-ink-100 mt-1">{rows.length}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-ink-400">Fraudulent</p>
              <p className="text-2xl font-bold text-error-300 mt-1">{fraudulent}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs text-ink-400">Genuine</p>
              <p className="text-2xl font-bold text-success-300 mt-1">{genuine}</p>
            </div>
            <div className="glass-card p-5 flex items-center justify-center">
              <button onClick={handleExport} className="btn-primary w-full">
                <Download className="w-4 h-4" /> Export Results
              </button>
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-ink-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3 font-medium">Job Title</th>
                    <th className="text-left px-4 py-3 font-medium">Company</th>
                    <th className="text-left px-4 py-3 font-medium">Prediction</th>
                    <th className="text-left px-4 py-3 font-medium">Risk Score</th>
                    <th className="text-left px-4 py-3 font-medium">Fraud %</th>
                    <th className="text-left px-4 py-3 font-medium">Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-ink-200 font-medium max-w-[200px] truncate">{row.job.title || '—'}</td>
                      <td className="px-4 py-3 text-ink-400 max-w-[150px] truncate">{row.job.company_name || '—'}</td>
                      <td className="px-4 py-3">
                        {row.result.prediction === 'fraudulent' ? (
                          <span className="flex items-center gap-1.5 text-error-300">
                            <ShieldAlert className="w-4 h-4" /> Fraudulent
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-success-300">
                            <ShieldCheck className="w-4 h-4" /> Genuine
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-ink-200">{row.result.riskScore}</span>
                        <span className="text-ink-500">/100</span>
                      </td>
                      <td className="px-4 py-3 text-ink-300">{(row.result.fraudProbability * 100).toFixed(1)}%</td>
                      <td className="px-4 py-3"><RiskBadge level={row.result.riskLevel} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
