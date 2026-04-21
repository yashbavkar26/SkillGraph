import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Search } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <main className="recruiter-shell" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--accent-strong)', marginBottom: '1rem' }}>SkillGraph</h1>
        <p className="subtle-copy" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          A unified digital system for connecting verified talent with the right opportunities based on a dynamic graph of micro-skills.
        </p>
      </div>

      <div className="search-form__grid" style={{ width: '100%', maxWidth: '900px', gap: '2rem' }}>
        
        <Link to="/candidate" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="panel" style={{ padding: '3rem 2rem', textAlign: 'center', transition: 'transform 0.2s ease', cursor: 'pointer', height: '100%' }}>
            <div style={{ background: 'var(--accent-soft)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-strong)' }}>
              <UserPlus size={40} />
            </div>
            <h2>I am a Candidate</h2>
            <p className="subtle-copy" style={{ margin: '1rem auto' }}>
              Register yourself to the portal, add your skills to the graph, and get discovered by top recruiters.
            </p>
            <span className="button button--primary" style={{ display: 'inline-block', marginTop: '1rem' }}>Register Now</span>
          </div>
        </Link>

        <Link to="/recruiter" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="panel" style={{ padding: '3rem 2rem', textAlign: 'center', transition: 'transform 0.2s ease', cursor: 'pointer', height: '100%' }}>
            <div style={{ background: 'rgba(31, 107, 92, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--success)' }}>
              <Search size={40} />
            </div>
            <h2>I am a Recruiter</h2>
            <p className="subtle-copy" style={{ margin: '1rem auto' }}>
              Search the verifiable skill graph to find the perfect candidates for your open roles.
            </p>
            <span className="button button--ghost" style={{ display: 'inline-block', marginTop: '1rem', border: '1px solid var(--accent-strong)' }}>Search Graph</span>
          </div>
        </Link>

      </div>
    </main>
  );
};

export default Landing;
