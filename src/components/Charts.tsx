// Lightweight SVG chart components — no external chart library dependency.

export function DonutChart({
  segments,
  size = 180,
  thickness = 28,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-ink-800/50"
        />
        {segments.map((seg, i) => {
          const len = (seg.value / total) * circumference;
          const dash = `${len} ${circumference - len}`;
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease-out, stroke-dashoffset 0.8s ease-out' }}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold text-ink-100">{centerValue}</span>}
          {centerLabel && <span className="text-xs text-ink-400 mt-0.5">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

export function BarChart({
  data,
  height = 200,
  color = '#3b82f6',
  formatValue,
}: {
  data: { label: string; value: number; sub?: number }[];
  height?: number;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 40);
        const subH = d.sub !== undefined ? (d.sub / max) * (height - 40) : 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2 group">
            <div className="relative flex-1 flex items-end w-full justify-center">
              <div
                className="w-full max-w-[36px] rounded-t-lg transition-all duration-500 group-hover:opacity-80"
                style={{ height: `${h}px`, background: color }}
              />
              {d.sub !== undefined && (
                <div
                  className="absolute bottom-0 w-full max-w-[36px] rounded-t-lg transition-all duration-500 opacity-60"
                  style={{ height: `${subH}px`, background: '#f43f5e' }}
                />
              )}
              <span className="absolute -top-6 text-xs font-medium text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatValue ? formatValue(d.value) : d.value}
              </span>
            </div>
            <span className="text-xs text-ink-400 truncate">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HorizontalBarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number; color?: string }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0.001);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-ink-300 w-40 truncate text-right">{d.label}</span>
          <div className="flex-1 h-6 bg-ink-800/50 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-700 ease-out"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color || 'linear-gradient(to right, #3b82f6, #06b6d4)',
              }}
            />
          </div>
          <span className="text-sm font-medium text-ink-200 w-16 text-right">
            {formatValue ? formatValue(d.value) : d.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LineChart({
  data,
  height = 200,
  color = '#3b82f6',
  fillOpacity = 0.15,
  formatValue,
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  fillOpacity?: number;
  formatValue?: (v: number) => string;
}) {
  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = innerW / Math.max(1, data.length - 1);

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points[points.length - 1]?.x || 0} ${padding.top + innerH} L ${points[0]?.x || 0} ${padding.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={padding.left}
          x2={width - padding.right}
          y1={padding.top + innerH * t}
          y2={padding.top + innerH * t}
          stroke="currentColor"
          strokeWidth={1}
          className="text-ink-800/40"
        />
      ))}
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i} className="group">
          <circle cx={p.x} cy={p.y} r={4} fill={color} className="transition-all group-hover:r-6" />
          <text x={p.x} y={padding.top + innerH + 20} textAnchor="middle" className="fill-ink-400 text-[10px]">
            {p.label}
          </text>
          <text x={p.x} y={p.y - 10} textAnchor="middle" className="fill-ink-200 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
            {formatValue ? formatValue(p.value) : p.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function GaugeChart({
  value,
  max = 100,
  size = 200,
  label,
  color,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  color?: string;
}) {
  const pct = Math.min(1, value / max);
  const radius = size / 2 - 20;
  const circumference = Math.PI * radius; // semicircle
  const filled = pct * circumference;
  const autoColor = pct >= 0.8 ? '#f43f5e' : pct >= 0.6 ? '#f59e0b' : pct >= 0.35 ? '#eab308' : '#10b981';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        <path
          d={`M 20 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={14}
          className="text-ink-800/50"
          strokeLinecap="round"
        />
        <path
          d={`M 20 ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2}`}
          fill="none"
          stroke={color || autoColor}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
        />
        <text x={size / 2} y={size / 2 - 10} textAnchor="middle" className="fill-ink-100 font-bold" style={{ fontSize: 32 }}>
          {Math.round(value)}
        </text>
        {label && (
          <text x={size / 2} y={size / 2 + 20} textAnchor="middle" className="fill-ink-400" style={{ fontSize: 12 }}>
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
