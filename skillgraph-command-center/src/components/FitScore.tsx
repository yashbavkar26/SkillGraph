const FACTORS = [
  { label: "Skill overlap", value: 38, color: "var(--cyan)" },
  { label: "Verified depth", value: 24, color: "var(--violet)" },
  { label: "Domain match", value: 14, color: "var(--magenta)" },
  { label: "Trajectory", value: 11, color: "var(--emerald)" },
];

export function FitScore() {
  const total = FACTORS.reduce((s, f) => s + f.value, 0);
  const C = 2 * Math.PI * 70;
  const offset = C - (total / 100) * C;

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-6 sm:p-8">
      <div className="bg-grid absolute inset-0 opacity-30" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-6">
          <div className="relative h-44 w-44 flex-shrink-0">
            <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
              <defs>
                <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.85 0.17 210)" />
                  <stop offset="100%" stopColor="oklch(0.7 0.22 290)" />
                </linearGradient>
              </defs>
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="oklch(0.25 0.04 265)"
                strokeWidth="10"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="url(#arc)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                style={{
                  filter: "drop-shadow(0 0 10px oklch(0.85 0.17 210 / 0.7))",
                  transition: "stroke-dashoffset 1.2s cubic-bezier(0.2,0.8,0.2,1)",
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-display text-5xl font-bold text-gradient">{total}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                fit score
              </div>
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Job · Senior Platform Engineer
            </div>
            <h3 className="font-display mt-1 text-2xl font-semibold">Lattice / Berlin</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Explainable match — every contribution traceable to a verified node in the
              candidate's graph.
            </p>
            <div className="mt-3 flex gap-2">
              <span
                className="font-mono rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-wider"
                style={{ color: "var(--cyan)" }}
              >
                ◉ strong match
              </span>
              <span className="font-mono rounded-full border border-border px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                top 4%
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Contributing factors
          </div>
          {FACTORS.map((f) => (
            <div key={f.label}>
              <div className="mb-1 flex justify-between text-xs">
                <span>{f.label}</span>
                <span className="font-mono" style={{ color: f.color }}>
                  +{f.value}
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(f.value / 40) * 100}%`,
                    background: f.color,
                    boxShadow: `0 0 10px ${f.color}`,
                  }}
                />
              </div>
            </div>
          ))}
          <div className="font-mono pt-2 text-[10px] leading-relaxed text-muted-foreground">
            * Computed from 312 verified signals across the candidate's skill graph.
          </div>
        </div>
      </div>
    </div>
  );
}
