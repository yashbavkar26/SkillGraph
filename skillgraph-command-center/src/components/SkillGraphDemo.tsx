import { useState } from "react";

type SkillNode = {
  id: string;
  label: string;
  category: "engineering" | "design" | "data" | "leadership";
  x: number;
  y: number;
  weight: number;
  endorsements: number;
  subskills: string[];
};

const CATEGORY_COLOR: Record<SkillNode["category"], string> = {
  engineering: "var(--cyan)",
  design: "var(--magenta)",
  data: "var(--violet)",
  leadership: "var(--emerald)",
};

const NODES: SkillNode[] = [
  {
    id: "ts",
    label: "TypeScript",
    category: "engineering",
    x: 50,
    y: 50,
    weight: 92,
    endorsements: 47,
    subskills: ["Generics", "Type Inference", "Module Federation"],
  },
  {
    id: "react",
    label: "React",
    category: "engineering",
    x: 24,
    y: 32,
    weight: 88,
    endorsements: 63,
    subskills: ["Hooks", "Suspense", "Server Components"],
  },
  {
    id: "sys",
    label: "System Design",
    category: "engineering",
    x: 78,
    y: 30,
    weight: 81,
    endorsements: 29,
    subskills: ["CAP", "Event Sourcing", "Sharding"],
  },
  {
    id: "ds",
    label: "Data Modeling",
    category: "data",
    x: 80,
    y: 70,
    weight: 76,
    endorsements: 22,
    subskills: ["Star Schema", "Normalization", "OLAP"],
  },
  {
    id: "ml",
    label: "ML Ops",
    category: "data",
    x: 60,
    y: 82,
    weight: 64,
    endorsements: 14,
    subskills: ["Feature Stores", "Drift Detection", "MLflow"],
  },
  {
    id: "ux",
    label: "UX Research",
    category: "design",
    x: 18,
    y: 70,
    weight: 71,
    endorsements: 18,
    subskills: ["Diary Studies", "Cog. Walkthrough", "JTBD"],
  },
  {
    id: "lead",
    label: "Tech Lead",
    category: "leadership",
    x: 38,
    y: 14,
    weight: 84,
    endorsements: 31,
    subskills: ["Mentoring", "Roadmaps", "Hiring"],
  },
];

const EDGES: [string, string][] = [
  ["ts", "react"],
  ["ts", "sys"],
  ["ts", "ds"],
  ["react", "ux"],
  ["react", "lead"],
  ["sys", "ds"],
  ["ds", "ml"],
  ["lead", "sys"],
  ["ts", "ml"],
];

export function SkillGraphDemo() {
  const [active, setActive] = useState<string>("ts");
  const activeNode = NODES.find((n) => n.id === active)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="glass relative aspect-[4/3] overflow-hidden rounded-2xl">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          {EDGES.map(([a, b], i) => {
            const na = NODES.find((n) => n.id === a)!;
            const nb = NODES.find((n) => n.id === b)!;
            const isActive = active === a || active === b;
            return (
              <line
                key={i}
                x1={na.x}
                y1={na.y}
                x2={nb.x}
                y2={nb.y}
                stroke={isActive ? "oklch(0.85 0.17 210)" : "oklch(0.85 0.17 210 / 0.25)"}
                strokeWidth={isActive ? 0.4 : 0.2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
        {NODES.map((n) => {
          const isActive = n.id === active;
          const size = 14 + (n.weight / 100) * 22;
          return (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{
                left: `${n.x}%`,
                top: `${n.y}%`,
                width: size,
                height: size,
              }}
              aria-label={n.label}
            >
              <span
                className="block h-full w-full rounded-full transition-transform duration-300"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${CATEGORY_COLOR[n.category]}, oklch(0.2 0.04 265) 130%)`,
                  boxShadow: isActive
                    ? `0 0 0 2px ${CATEGORY_COLOR[n.category]}, 0 0 32px ${CATEGORY_COLOR[n.category]}`
                    : `0 0 18px ${CATEGORY_COLOR[n.category]}55`,
                  transform: isActive ? "scale(1.25)" : "scale(1)",
                }}
              />
              <span
                className="font-mono pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-wider"
                style={{ color: isActive ? CATEGORY_COLOR[n.category] : "oklch(0.7 0.03 255)" }}
              >
                {n.label}
              </span>
            </button>
          );
        })}

        <div className="font-mono absolute bottom-3 left-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          ◍ live · graph_v3.2
        </div>
      </div>

      <div className="glass flex flex-col gap-5 rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Node · {activeNode.category}
            </div>
            <h3 className="font-display mt-1 text-2xl font-semibold">{activeNode.label}</h3>
          </div>
          <div
            className="h-10 w-10 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${CATEGORY_COLOR[activeNode.category]}, oklch(0.2 0.04 265))`,
              boxShadow: `0 0 24px ${CATEGORY_COLOR[activeNode.category]}88`,
            }}
          />
        </div>

        <div>
          <div className="font-mono mb-2 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Weight</span>
            <span style={{ color: CATEGORY_COLOR[activeNode.category] }}>
              {activeNode.weight}/100
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${activeNode.weight}%`,
                background: `linear-gradient(90deg, ${CATEGORY_COLOR[activeNode.category]}, oklch(0.96 0.01 250))`,
                boxShadow: `0 0 12px ${CATEGORY_COLOR[activeNode.category]}`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-surface/50 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Endorsements
            </div>
            <div className="font-display mt-1 text-2xl">{activeNode.endorsements}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface/50 p-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Connections
            </div>
            <div className="font-display mt-1 text-2xl">
              {EDGES.filter(([a, b]) => a === active || b === active).length}
            </div>
          </div>
        </div>

        <div>
          <div className="font-mono mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">
            Sub-skills
          </div>
          <div className="flex flex-wrap gap-2">
            {activeNode.subskills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs"
                style={{ color: CATEGORY_COLOR[activeNode.category] }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
