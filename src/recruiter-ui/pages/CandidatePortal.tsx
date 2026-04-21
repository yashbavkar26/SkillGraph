import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  createEndorsement,
  createEvidence,
  createSkill,
  fetchEndorsementsForUser,
  fetchEvidenceForUser,
  fetchAllSkills,
  fetchUserById,
  searchUsers,
  addSkillToCandidate,
  fetchUserSkillLinks,
  type EndorsementWithSkill,
  type SearchableUser,
  type UserSkillLink,
} from '../api/client';
import type { User } from '../../types/graph';
import UserSkillGraph from '../components/UserSkillGraph';

function normalizeSkillName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+\s#.-]/g, ' ')
    .replace(/\s+/g, ' ');
}

type CandidatePortalProps = {
  userId: string;
  userName: string;
};

const CandidatePortal: React.FC<CandidatePortalProps> = ({ userId, userName }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [skillQuery, setSkillQuery] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [proficiency, setProficiency] = useState(3);
  const [mySkills, setMySkills] = useState<UserSkillLink[]>([]);
  const [evidenceList, setEvidenceList] = useState<any[]>([]);
  const [endorsements, setEndorsements] = useState<EndorsementWithSkill[]>([]);
  const [evidenceSkillId, setEvidenceSkillId] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState<'github' | 'portfolio' | 'certificate' | 'article' | 'other'>('github');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [endorsementRecipientQuery, setEndorsementRecipientQuery] = useState('');
  const [endorsementRecipientId, setEndorsementRecipientId] = useState('');
  const [endorsementSkillId, setEndorsementSkillId] = useState('');
  const [endorsementComment, setEndorsementComment] = useState('');
  const [recipientSuggestions, setRecipientSuggestions] = useState<SearchableUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const loadPageData = async () => {
      try {
        const [userProfile, allSkills, linkedSkills, userEvidence, userEndorsements] = await Promise.all([
          fetchUserById(userId),
          fetchAllSkills(),
          fetchUserSkillLinks(userId),
          fetchEvidenceForUser(userId),
          fetchEndorsementsForUser(userId),
        ]);
        setProfile(userProfile);
        setSkills(allSkills);
        setMySkills(linkedSkills);
        setEvidenceList(userEvidence);
        setEndorsements(userEndorsements);
      } catch (error) {
        console.error(error);
        setMessage({ text: 'Could not load your skill graph right now.', type: 'error' });
      }
    };

    void loadPageData();
  }, [userId]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedQuery = normalizeSkillName(skillQuery);
    if (!normalizedQuery) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      let skillIdToLink = selectedSkillId;

      if (!skillIdToLink) {
        const existingSkill = skills.find(
          (skill) => normalizeSkillName(skill.name) === normalizedQuery
        );

        if (existingSkill) {
          skillIdToLink = existingSkill.id;
        } else {
          const createdSkill = await createSkill(skillQuery.trim());
          setSkills((current) => [createdSkill, ...current]);
          skillIdToLink = createdSkill.id;
        }
      }

      const createdLink = await addSkillToCandidate(userId, skillIdToLink, proficiency);
      setMySkills((current) => {
        const existingIndex = current.findIndex((item) => item.skillId === skillIdToLink);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = { ...next[existingIndex], proficiency };
          return next;
        }
        return [...current, createdLink];
      });
      setSelectedSkillId('');
      setSkillQuery('');
      setMessage({ text: `Skill added successfully!`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add skill', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const matchedSkills = skillQuery.trim()
    ? skills
        .filter((skill) =>
          normalizeSkillName(skill.name).includes(normalizeSkillName(skillQuery))
        )
        .slice(0, 8)
    : [];

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceSkillId || !evidenceUrl) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const createdEvidence = await createEvidence(userId, {
        skillId: evidenceSkillId,
        url: evidenceUrl,
        type: evidenceType,
        metadata: { description: evidenceDescription },
      });
      setEvidenceList((current) => [createdEvidence, ...current]);
      setEvidenceUrl('');
      setEvidenceDescription('');
      setMessage({ text: 'Evidence linked successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add evidence', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEndorsement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endorsementRecipientId || !endorsementSkillId) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await createEndorsement(userId, {
        recipientId: endorsementRecipientId,
        skillId: endorsementSkillId,
        comment: endorsementComment,
      });
      setEndorsementComment('');
      setEndorsementRecipientId('');
      setEndorsementRecipientQuery('');
      setEndorsementSkillId('');
      setRecipientSuggestions([]);
      setMessage({ text: 'Endorsement sent successfully.', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to create endorsement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = endorsementRecipientQuery.trim();
    if (query.length < 2) {
      setRecipientSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers({ query, role: 'candidate', limit: 8 });
        setRecipientSuggestions(users.filter((user) => user.id !== userId));
      } catch {
        setRecipientSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [endorsementRecipientQuery, userId]);

  return (
    <main className="recruiter-shell">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--accent-strong)', textDecoration: 'none', fontWeight: 'bold' }}>
          &larr; Back to Home
        </Link>
      </div>
      <div className="recruiter-shell__layout">
        <UserSkillGraph
          userName={profile?.name ?? userName}
          userId={userId}
          skills={mySkills}
          skillNamesById={Object.fromEntries(skills.map((skill) => [skill.id, skill.name]))}
        />
        <div className="results-grid">
          <section className="search-form">
            <div className="search-form__header">
              <div>
                <p className="eyebrow">Talent Portal</p>
                <h2>Add Skills to Your Graph</h2>
                <p className="search-form__lede">
                  Signed in as {profile?.name ?? userName}. Link skills, add evidence, and track endorsements.
                </p>
              </div>
            </div>
            <form onSubmit={handleAddSkill} className="search-form__grid">
              <div className="field field--full">
                <span>Skill Name</span>
                <input
                  type="text"
                  value={skillQuery}
                  onChange={(e) => {
                    setSkillQuery(e.target.value);
                    setSelectedSkillId('');
                  }}
                  placeholder="Type a skill (e.g. Neo4j, TypeScript)"
                  required
                />
              </div>
              {skillQuery.trim() ? (
                <div className="field field--full">
                  <span>Matching Skills</span>
                  <div className="tag-row">
                    {matchedSkills.length > 0 ? (
                      matchedSkills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          className={`tag ${selectedSkillId === skill.id ? '' : 'tag--muted'}`}
                          onClick={() => {
                            setSelectedSkillId(skill.id);
                            setSkillQuery(skill.name);
                          }}
                        >
                          {skill.name}
                        </button>
                      ))
                    ) : (
                      <span className="subtle-copy">
                        No existing skill found. This will create a new canonical skill.
                      </span>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="field field--full">
                <span>Action</span>
                <p className="subtle-copy" style={{ margin: 0 }}>
                  {selectedSkillId
                    ? 'Existing skill selected. Submitting will link it to your profile.'
                    : 'Submitting will create the skill if it does not already exist, then link it.'}
                </p>
              </div>
              <div className="field field--full">
                <span>Proficiency (1-4)</span>
                <input 
                  type="number" 
                  min="1" 
                  max="4" 
                  value={proficiency} 
                  onChange={(e) => setProficiency(parseInt(e.target.value, 10))} 
                  required 
                />
              </div>
              <div className="search-form__actions field--full">
                <button type="submit" className="button button--primary" disabled={loading || !skillQuery.trim()}>
                  {loading ? 'Saving...' : 'Save Skill'}
                </button>
              </div>
            </form>
            {message.text && (
              <p className={`inline-message inline-message--${message.type}`}>
                {message.text}
              </p>
            )}

            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid rgba(55, 37, 15, 0.12)' }} />

            <h3>Add Evidence</h3>
            <form onSubmit={handleAddEvidence} className="search-form__grid">
              <div className="field field--full">
                <span>Skill</span>
                <select value={evidenceSkillId} onChange={(e) => setEvidenceSkillId(e.target.value)} required>
                  <option value="">-- Choose a linked skill --</option>
                  {mySkills.map((link) => (
                    <option key={link.skillId} value={link.skillId}>
                      {skills.find((skill) => skill.id === link.skillId)?.name ?? link.skillId}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field field--full">
                <span>Evidence URL</span>
                <input
                  type="url"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  required
                />
              </div>
              <div className="field">
                <span>Type</span>
                <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as typeof evidenceType)}>
                  <option value="github">github</option>
                  <option value="portfolio">portfolio</option>
                  <option value="certificate">certificate</option>
                  <option value="article">article</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div className="field">
                <span>Description</span>
                <input
                  type="text"
                  value={evidenceDescription}
                  onChange={(e) => setEvidenceDescription(e.target.value)}
                  placeholder="Brief proof note"
                />
              </div>
              <div className="search-form__actions field--full">
                <button type="submit" className="button button--ghost" disabled={loading || !evidenceSkillId || !evidenceUrl}>
                  {loading ? 'Saving...' : 'Attach Evidence'}
                </button>
              </div>
            </form>

            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid rgba(55, 37, 15, 0.12)' }} />

            <h3>Send Endorsement</h3>
            <form onSubmit={handleCreateEndorsement} className="search-form__grid">
              <div className="field field--full">
                <span>Find Candidate</span>
                <input
                  type="text"
                  value={endorsementRecipientQuery}
                  onChange={(e) => {
                    setEndorsementRecipientQuery(e.target.value);
                    setEndorsementRecipientId('');
                  }}
                  placeholder="Type candidate name or email"
                  required
                />
              </div>

              {recipientSuggestions.length > 0 ? (
                <div className="field field--full">
                  <span>Candidate Suggestions</span>
                  <div className="tag-row">
                    {recipientSuggestions.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        className={`tag ${endorsementRecipientId === candidate.id ? '' : 'tag--muted'}`}
                        onClick={() => {
                          setEndorsementRecipientId(candidate.id);
                          setEndorsementRecipientQuery(`${candidate.name} (${candidate.email})`);
                        }}
                      >
                        {candidate.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="field field--full">
                <span>Skill to Endorse</span>
                <select
                  value={endorsementSkillId}
                  onChange={(e) => setEndorsementSkillId(e.target.value)}
                  required
                >
                  <option value="">-- Choose a skill --</option>
                  {skills.slice(0, 250).map((skill) => (
                    <option key={skill.id} value={skill.id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field field--full">
                <span>Comment (optional)</span>
                <textarea
                  value={endorsementComment}
                  onChange={(e) => setEndorsementComment(e.target.value)}
                  rows={3}
                  placeholder="Share one concrete reason for your endorsement"
                />
              </div>

              <div className="search-form__actions field--full">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={loading || !endorsementRecipientId || !endorsementSkillId}
                >
                  {loading ? 'Submitting...' : 'Send Endorsement'}
                </button>
              </div>
            </form>
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
                  {skills.find((skill) => skill.id === s.skillId)?.name ?? s.skillId} (Lvl {s.proficiency ?? 'N/A'})
                </span>
              ))}
            </div>
            <div style={{ marginTop: '2rem' }}>
              <p className="subtle-copy">Your unique User ID: <br/><strong>{userId}</strong></p>
            </div>

            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid rgba(55, 37, 15, 0.12)' }} />

            <h3>My Evidence</h3>
            <div className="explanation-summary">
              {evidenceList.length === 0 ? 'No evidence linked yet.' : `${evidenceList.length} evidence item(s) linked.`}
            </div>
            <div className="results-list">
              {evidenceList.slice(0, 6).map((item, idx) => (
                <article key={`${item.id ?? idx}`} className="explanation-card">
                  <div className="explanation-card__top">
                    <h3>{item.type ?? 'evidence'}</h3>
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p style={{ wordBreak: 'break-all' }}>{item.url}</p>
                </article>
              ))}
            </div>

            <hr style={{ margin: '1.2rem 0', border: 'none', borderTop: '1px solid rgba(55, 37, 15, 0.12)' }} />

            <h3>Received Endorsements</h3>
            <div className="explanation-summary">
              {endorsements.length === 0 ? 'No endorsements yet.' : `${endorsements.length} endorsement(s) received.`}
            </div>
            {mySkills.length === 0 && endorsements.length > 0 ? (
              <p className="inline-message inline-message--success">
                You have no linked skill graph yet, but endorsements are already boosting your recruiter visibility.
              </p>
            ) : null}
            <div className="results-list">
              {endorsements.slice(0, 6).map((endorsement) => (
                <article key={endorsement.id} className="explanation-card">
                  <div className="explanation-card__top">
                    <h3>{endorsement.skill?.name ?? endorsement.skillId}</h3>
                    <span>{new Date(endorsement.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p>{endorsement.comment || 'No comment provided.'}</p>
                  <div className="tag-row">
                    <span className="tag tag--muted">
                      trust weight {Number(endorsement.weight ?? 1).toFixed(2)}
                    </span>
                    {(endorsement.riskFlags ?? []).slice(0, 2).map((flag) => (
                      <span key={`${endorsement.id}-${flag}`} className="tag tag--muted">
                        {flag}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default CandidatePortal;
