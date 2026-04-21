import { createFileRoute } from "@tanstack/react-router";
import { HeroGraph } from "@/components/HeroGraph";
import { SkillGraphDemo } from "@/components/SkillGraphDemo";
import { FitScore } from "@/components/FitScore";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "SkillGraph — Beyond the résumé. Into the graph." },
      {
        name: "description",
        content:
          "SkillGraph replaces the static résumé with a dynamic, verifiable graph of micro-skills. Build, verify, and match talent through an explainable knowledge network.",
      },
      { property: "og:title", content: "SkillGraph — Your skills. Mapped. Verified. Alive." },
      {
        property: "og:description",
        content:
          "A living graph of verified skills replacing the static résumé. Explainable matching for the next generation of work.",
      },
    ],
  }),
});

const STEPS = [
  {
    n: "01",
    title: "Build",
    body: "Import history, link artefacts, and let the graph emerge. Every project becomes a constellation of micro-skills.",
    color: "var(--cyan)",
    icon: (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <circle cx="36" cy="12" r="3" />
        <circle cx="24" cy="28" r="4" />
        <circle cx="12" cy="40" r="3" />
        <circle cx="36" cy="40" r="3" />
        <path d="M12 15v0M12 15l11 11M36 15L25 26M14 38l9-7M34 38l-9-7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Verify",
    body: "Peer endorsements, automated assessments, and signed artefacts harden each node into trusted signal.",
    color: "var(--violet)",
    icon: (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M24 6l14 6v10c0 9-6 16-14 20-8-4-14-11-14-20V12l14-6z" />
        <path d="M17 24l5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Match",
    body: "Recruiters query the graph. The fit score is explainable, traceable, and impossible to fake.",
    color: "var(--magenta)",
    icon: (
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="18" cy="24" r="10" />
        <circle cx="30" cy="24" r="10" />
        <path d="M24 16v16" strokeLinecap="round" />
      </svg>
    ),
  },
];

const TRUST = [
  {
    label: "Peer Endorsements",
    metric: "12.4k",
    sub: "weighted by graph proximity",
    color: "var(--cyan)",
  },
  {
    label: "Automated Assessments",
    metric: "847",
    sub: "language-model proctored",
    color: "var(--violet)",
  },
  {
    label: "Linked Artefacts",
    metric: "3.1k",
    sub: "commits · papers · designs",
    color: "var(--magenta)",
  },
];

function Index() {
  return (
    <main className="relative min-h-screen">
      {/* Top nav */}
      <header className="absolute left-0 right-0 top-0 z-30 px-6 py-6 sm:px-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-7 w-7 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-primary glow-cyan" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Skill<span className="text-gradient">Graph</span>
            </span>
          </div>
          <div className="font-mono hidden items-center gap-8 text-xs uppercase tracking-widest text-muted-foreground md:flex">
            <a href="#how" className="hover:text-foreground transition-colors">How</a>
            <a href="#graph" className="hover:text-foreground transition-colors">Graph</a>
            <a href="#match" className="hover:text-foreground transition-colors">Match</a>
            <a href="#trust" className="hover:text-foreground transition-colors">Trust</a>
          </div>
          <button className="font-mono rounded-full border border-border bg-surface/60 px-4 py-2 text-xs uppercase tracking-widest backdrop-blur transition-all hover:border-primary hover:text-primary">
            Sign in
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative isolate flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          <HeroGraph />
        </div>
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32 sm:px-10">
          <div className="reveal reveal-1 font-mono mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-muted-foreground backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live · v3.2 · indexing 4.2M nodes
          </div>

          <h1 className="font-display reveal reveal-2 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl lg:text-[88px]">
            Your skills.
            <br />
            <span className="text-gradient">Mapped. Verified. Alive.</span>
          </h1>

          <p className="reveal reveal-3 mt-8 max-w-xl text-lg text-muted-foreground sm:text-xl">
            SkillGraph replaces the static résumé with a dynamic, verifiable graph of
            micro-skills — explainable matching for the next generation of work.
          </p>

          <div className="reveal reveal-4 mt-10 flex flex-wrap items-center gap-4">
            <button className="group relative overflow-hidden rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] glow-cyan">
              <span className="relative z-10 flex items-center gap-2">
                Build Your Graph
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
            <button className="font-mono rounded-full border border-border bg-surface/40 px-6 py-3.5 text-xs uppercase tracking-widest backdrop-blur transition-colors hover:border-primary hover:text-primary">
              See the demo →
            </button>
          </div>

          <div className="reveal reveal-5 font-mono mt-20 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-6 text-xs uppercase tracking-widest text-muted-foreground">
            <div>
              <div className="font-display text-2xl text-foreground">4.2M</div>
              <div className="mt-1">verified nodes</div>
            </div>
            <div>
              <div className="font-display text-2xl text-foreground">218k</div>
              <div className="mt-1">graphs built</div>
            </div>
            <div>
              <div className="font-display text-2xl text-foreground">94%</div>
              <div className="mt-1">recruiter precision</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative px-6 py-32 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            kicker="01 · Process"
            title="From signal to certainty"
            sub="Three movements turn scattered work into an explainable, queryable graph."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3" style={{ perspective: "1500px" }}>
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="card-3d glass group relative overflow-hidden rounded-2xl p-8"
              >
                <div
                  className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-60"
                  style={{ background: s.color }}
                />
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Step {s.n}
                </div>
                <div
                  className="mt-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-border"
                  style={{ color: s.color, background: "oklch(0.16 0.035 265 / 0.6)" }}
                >
                  {s.icon}
                </div>
                <h3 className="font-display mt-6 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GRAPH DEMO */}
      <section id="graph" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            kicker="02 · Live demo"
            title="A graph you can interrogate"
            sub="Click any node. Inspect weights, endorsements, and the sub-skills that compose it."
          />
          <div className="mt-14">
            <SkillGraphDemo />
          </div>
        </div>
      </section>

      {/* FIT SCORE */}
      <section id="match" className="relative px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            kicker="03 · Recruiter view"
            title="Explainable Fit Score"
            sub="No black box. Every percentage point traces back to a verified node — auditable, contestable, real."
          />
          <div className="mt-14">
            <FitScore />
          </div>
        </div>
      </section>

      {/* VERIFICATION */}
      <section id="trust" className="relative px-6 py-32 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            kicker="04 · Trust layer"
            title="Three signals, one verdict"
            sub="Each node carries provenance. Hover to see the weight indicator pulse with its source."
          />

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {TRUST.map((t) => (
              <div
                key={t.label}
                className="glass group relative overflow-hidden rounded-2xl p-8"
              >
                <div className="flex items-start justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t.label}
                  </div>
                  <div className="relative h-12 w-12">
                    <div
                      className="absolute inset-0 animate-node-pulse rounded-full"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${t.color}, oklch(0.18 0.04 265))`,
                      }}
                    />
                  </div>
                </div>
                <div className="font-display mt-6 text-5xl font-semibold text-gradient">
                  {t.metric}
                </div>
                <div className="font-mono mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {t.sub}
                </div>
                <div className="mt-6 h-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full w-3/4 rounded-full"
                    style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="glass relative mt-24 overflow-hidden rounded-3xl p-12 text-center sm:p-16">
            <div className="bg-grid absolute inset-0 opacity-40" />
            <div
              className="absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--cyan)" }}
            />
            <div
              className="absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
              style={{ background: "var(--violet)" }}
            />
            <div className="relative">
              <h2 className="font-display mx-auto max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">
                The résumé is dead.
                <br />
                <span className="text-gradient">Long live the graph.</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
                Join 218,000 builders, researchers, and operators mapping their craft.
              </p>
              <button className="group mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] glow-cyan">
                Build Your Graph
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border px-6 py-12 sm:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-primary/30 blur-md" />
                <span className="relative h-2 w-2 rounded-full bg-primary" />
              </span>
              <span className="font-display text-base font-semibold">SkillGraph</span>
            </div>
            <p className="font-mono mt-3 text-xs uppercase tracking-widest text-muted-foreground">
              Beyond the résumé. Into the graph.
            </p>
          </div>
          <div className="font-mono flex gap-6 text-[10px] uppercase tracking-widest text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Manifesto</a>
            <a href="#" className="hover:text-foreground transition-colors">Docs</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <span>© 2026</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function SectionHeader({
  kicker,
  title,
  sub,
}: {
  kicker: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
        {kicker}
      </div>
      <h2 className="font-display mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base text-muted-foreground sm:text-lg">{sub}</p>
    </div>
  );
}
