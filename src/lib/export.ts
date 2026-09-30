import type { PredictionResult, JobInput } from '../ml/types';

export function exportCSV(results: { job: JobInput; result: PredictionResult }[], filename = 'jobshield_results.csv') {
  const headers = [
    'Job Title', 'Company', 'Prediction', 'Fraud Probability', 'Risk Score',
    'Confidence', 'Rule Score', 'Risk Level', 'Triggered Rules', 'Date',
  ];
  const rows = results.map(({ job, result }) => [
    escapeCsv(job.title),
    escapeCsv(job.company_name),
    result.prediction,
    (result.fraudProbability * 100).toFixed(1) + '%',
    result.riskScore,
    (result.confidenceScore * 100).toFixed(0) + '%',
    result.ruleScore,
    result.riskLevel,
    escapeCsv(result.triggeredRules.map((r) => r.rule).join('; ')),
    new Date().toISOString(),
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csv, filename, 'text/csv');
}

export function exportReport(result: PredictionResult, job: JobInput) {
  // Generate a printable HTML report and open the print dialog (acts as PDF export).
  const html = buildReportHtml(result, job);
  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow popups to export the report.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 500);
}

function buildReportHtml(result: PredictionResult, job: JobInput): string {
  const isFraud = result.prediction === 'fraudulent';
  const color = isFraud ? '#f43f5e' : '#10b981';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>JobShield AI Report — ${escapeHtml(job.title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { display: flex; align-items: center; gap: 12px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #06b6d4); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 20px; }
  h1 { font-size: 20px; } .subtitle { color: #64748b; font-size: 13px; }
  .banner { padding: 24px; border-radius: 16px; background: ${color}15; border: 1px solid ${color}40; margin-bottom: 24px; }
  .banner h2 { color: ${color}; font-size: 24px; margin-bottom: 8px; }
  .banner p { color: #475569; font-size: 14px; line-height: 1.6; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .metric { padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; }
  .metric .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .metric .value { font-size: 22px; font-weight: 700; margin-top: 4px; }
  section { margin-bottom: 24px; }
  h3 { font-size: 14px; color: #334155; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .job-detail { display: grid; grid-template-columns: 150px 1fr; gap: 6px 16px; font-size: 13px; }
  .job-detail dt { color: #64748b; font-weight: 500; }
  .job-detail dd { color: #1e293b; }
  ul { list-style: none; }
  ul li { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; display: flex; gap: 8px; }
  ul li:before { content: '•'; color: ${color}; font-weight: bold; }
  .rules li:before { content: '✕'; color: #f43f5e; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">JS</div>
    <div>
      <h1>JobShield AI — Fraud Detection Report</h1>
      <div class="subtitle">Generated ${new Date().toLocaleString()} · Model: ${escapeHtml(result.modelUsed)}</div>
    </div>
  </div>

  <div class="banner">
    <h2>${isFraud ? 'Fraudulent' : 'Genuine'} — ${result.riskLevel.toUpperCase()} RISK</h2>
    <p>${escapeHtml(result.explanation)}</p>
  </div>

  <div class="metrics">
    <div class="metric"><div class="label">Risk Score</div><div class="value">${result.riskScore}/100</div></div>
    <div class="metric"><div class="label">Fraud Probability</div><div class="value">${(result.fraudProbability * 100).toFixed(1)}%</div></div>
    <div class="metric"><div class="label">Confidence</div><div class="value">${(result.confidenceScore * 100).toFixed(0)}%</div></div>
    <div class="metric"><div class="label">Rule Score</div><div class="value">${result.ruleScore}/100</div></div>
  </div>

  <section>
    <h3>Job Details</h3>
    <dl class="job-detail">
      <dt>Title</dt><dd>${escapeHtml(job.title)}</dd>
      <dt>Company</dt><dd>${escapeHtml(job.company_name)}</dd>
      <dt>Website</dt><dd>${escapeHtml(job.website) || '—'}</dd>
      <dt>Location</dt><dd>${escapeHtml(job.location) || '—'}</dd>
      <dt>Salary</dt><dd>${job.salary ? job.salary_currency + ' ' + job.salary.toLocaleString() : '—'}</dd>
      <dt>Employment</dt><dd>${escapeHtml(job.employment_type) || '—'}</dd>
      <dt>Experience</dt><dd>${escapeHtml(job.experience) || '—'}</dd>
      <dt>Education</dt><dd>${escapeHtml(job.education) || '—'}</dd>
    </dl>
  </section>

  <section>
    <h3>Triggered Rules (${result.triggeredRules.length})</h3>
    <ul class="rules">
      ${result.triggeredRules.length === 0
        ? '<li>No fraud rules triggered.</li>'
        : result.triggeredRules.map((r) => `<li><strong>${escapeHtml(r.rule.replace(/_/g, ' '))}</strong> (+${r.weight}) — ${escapeHtml(r.description)}</li>`).join('')}
    </ul>
  </section>

  <section>
    <h3>Top Feature Contributions</h3>
    <ul>
      ${result.featureContributions.slice(0, 8).map((c) => `<li>${escapeHtml(c.feature)} — impact: ${c.contribution.toFixed(3)} (${c.direction})</li>`).join('')}
    </ul>
  </section>

  <section>
    <h3>Safety Recommendations</h3>
    <ul>
      ${result.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
    </ul>
  </section>

  <div class="footer">
    JobShield AI · Hybrid Detection (Rule Engine + Logistic Regression + NLP) · This report is AI-generated and should be used as a screening aid, not definitive proof.
  </div>
</body>
</html>`;
}

function escapeCsv(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
