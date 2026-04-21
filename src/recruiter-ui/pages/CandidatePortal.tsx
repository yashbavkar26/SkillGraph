import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registerCandidate, fetchAllSkills, addSkillToCandidate } from '../api/client';

const CandidatePortal: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [proficiency, setProficiency] = useState(3);
  const [mySkills, setMySkills] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchAllSkills().then(setSkills).catch(console.error);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const user = await registerCandidate(name, email);
      setUserId(user.id);
      setMessage({ text: `Welcome ${user.name}! You are registered.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Registration failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !selectedSkill) return;
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await addSkillToCandidate(userId, selectedSkill, proficiency);
      const skillName = skills.find(s => s.id === selectedSkill)?.name;
      setMySkills([...mySkills, { id: selectedSkill, name: skillName, proficiency }]);
      setMessage({ text: `Skill added successfully!`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add skill', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="recruiter-shell">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--accent-strong)', textDecoration: 'none', fontWeight: 'bold' }}>
          &larr; Back to Home
        </Link>
      </div>
      <div className="recruiter-shell__layout">
        
        {!userId ? (
          <section className="search-form">
            <div className="search-form__header">
              <div>
                <p className="eyebrow">Talent Portal</p>
                <h2>Create Your Profile</h2>
                <p className="search-form__lede">
                  Register yourself to the graph so recruiters can discover your verified skills.
                </p>
              </div>
            </div>
            <form onSubmit={handleRegister} className="search-form__grid">
              <div className="field">
                <span>Full Name</span>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="e.g. Ada Lovelace"
                />
              </div>
              <div className="field">
                <span>Email Address</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="e.g. ada@example.com"
                />
              </div>
              <div className="search-form__actions field--full">
                <button type="submit" className="button button--primary" disabled={loading}>
                  {loading ? 'Registering...' : 'Register to SkillGraph'}
                </button>
              </div>
            </form>
            {message.text && (
              <p className={`inline-message inline-message--${message.type}`}>
                {message.text}
              </p>
            )}
          </section>
        ) : (
          <div className="results-grid">
            <section className="search-form">
              <div className="search-form__header">
                <div>
                  <p className="eyebrow">Your Skills</p>
                  <h2>Add Skills to Your Graph</h2>
                  <p className="search-form__lede">
                    Link yourself to specific micro-skills.
                  </p>
                </div>
              </div>
              <form onSubmit={handleAddSkill} className="search-form__grid">
                <div className="field field--full">
                  <span>Select a Skill</span>
                  <select 
                    value={selectedSkill} 
                    onChange={(e) => setSelectedSkill(e.target.value)} 
                    required
                  >
                    <option value="">-- Choose a skill --</option>
                    {skills.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field field--full">
                  <span>Proficiency (1-4)</span>
                  <input 
                    type="number" 
                    min="1" 
                    max="4" 
                    value={proficiency} 
                    onChange={(e) => setProficiency(parseInt(e.target.value))} 
                    required 
                  />
                </div>
                <div className="search-form__actions field--full">
                  <button type="submit" className="button button--primary" disabled={loading || !selectedSkill}>
                    {loading ? 'Adding...' : 'Link Skill'}
                  </button>
                </div>
              </form>
              {message.text && (
                <p className={`inline-message inline-message--${message.type}`}>
                  {message.text}
                </p>
              )}
            </section>
            
            <section className="explanation-panel">
              <div className="explanation-card__top">
                <h3>My Current Graph</h3>
              </div>
              <div className="explanation-summary">
                {mySkills.length === 0 ? 'No skills linked yet.' : 'You have linked the following skills:'}
              </div>
              <div className="tag-row">
                {mySkills.map((s, i) => (
                  <span key={i} className="tag">
                    {s.name} (Lvl {s.proficiency})
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '2rem' }}>
                <p className="subtle-copy">Your unique User ID: <br/><strong>{userId}</strong></p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
};

export default CandidatePortal;
