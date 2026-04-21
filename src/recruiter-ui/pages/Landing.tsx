import React from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import HeroGraph from '../components/HeroGraph';

type LandingProps = {
  userName: string;
  onLogout: () => void;
};

const Landing: React.FC<LandingProps> = ({ userName, onLogout }) => {
  return (
    <main className="landing-root">
      <section className="landing-hero">
        <div className="landing-hero__bg" aria-hidden="true">
          <HeroGraph />
          <div className="landing-hero__grid" />
        </div>

        <header className="landing-nav recruiter-shell">
          <div className="landing-brand">
            <span className="landing-brand__dot" />
            <span>
              Skill<span className="landing-brand__accent">Graph</span>
            </span>
          </div>

          <div className="landing-nav__actions">
            <span className="tag">Signed in as {userName}</span>
            <button type="button" className="button button--ghost" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="recruiter-shell landing-hero__content">
          <p className="eyebrow">Live skill intelligence platform</p>
          <h1 className="landing-title">
            Your skills.
            <br />
            <span className="landing-title__accent">Mapped. Verified. Alive.</span>
          </h1>
          <p className="landing-subtitle subtle-copy">
            SkillGraph replaces the static resume with a dynamic, verifiable graph of
            micro-skills and evidence signals for candidates and recruiters.
          </p>

          <div className="landing-stats">
            <article>
              <strong>4.2M</strong>
              <span>verified nodes</span>
            </article>
            <article>
              <strong>218k</strong>
              <span>graphs built</span>
            </article>
            <article>
              <strong>94%</strong>
              <span>recruiter precision</span>
            </article>
          </div>
        </div>
      </section>

      <section className="recruiter-shell landing-actions">
        <div className="landing-cards">
          <Link to="/candidate" className="landing-card-link">
            <article className="panel landing-card">
              <div className="landing-card__icon">
                <UserPlus size={34} />
              </div>
              <p className="eyebrow">Candidate Portal</p>
              <h2>I am a Candidate</h2>
              <p className="subtle-copy">
                Build your graph, attach proof, and make your skills discoverable with
                explainable signals.
              </p>
              <span className="button button--primary">Build My Graph</span>
            </article>
          </Link>

          <Link to="/recruiter" className="landing-card-link">
            <article className="panel landing-card">
              <div className="landing-card__icon landing-card__icon--secondary">
                <Search size={34} />
              </div>
              <p className="eyebrow">Recruiter Console</p>
              <h2>I am a Recruiter</h2>
              <p className="subtle-copy">
                Query the graph, inspect fit explanations, and shortlist top candidates in
                real time.
              </p>
              <span className="button button--ghost">Search Talent</span>
            </article>
          </Link>
        </div>

        <div className="landing-process">
          <article className="panel landing-process__card">
            <p className="eyebrow">01 Build</p>
            <h3>Construct a living graph</h3>
            <p className="subtle-copy">
              Every project, endorsement, and skill link becomes connected signal instead of
              isolated resume text.
            </p>
          </article>
          <article className="panel landing-process__card">
            <p className="eyebrow">02 Verify</p>
            <h3>Trust by evidence</h3>
            <p className="subtle-copy">
              Artifact-backed nodes and peer endorsement trails increase confidence in every
              recommendation.
            </p>
          </article>
          <article className="panel landing-process__card">
            <p className="eyebrow">03 Match</p>
            <h3>Explain every score</h3>
            <p className="subtle-copy">
              Recruiter fit percentages are transparent, traceable, and grounded in graph
              facts.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default Landing;
