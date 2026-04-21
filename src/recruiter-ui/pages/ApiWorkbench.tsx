import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createEndorsement,
  createEvidence,
  createSkill,
  fetchEndorsementsForUser,
  fetchEvidenceForUser,
  fetchHealth,
  fetchSkillById,
  fetchSkillHistory,
  fetchUserById,
  ingestAssessment,
  registerCandidate,
} from '../api/client';

type ApiWorkbenchProps = {
  currentUserId: string;
  currentUserName: string;
};

const ApiWorkbench: React.FC<ApiWorkbenchProps> = ({ currentUserId, currentUserName }) => {
  const [healthOutput, setHealthOutput] = useState('');

  const [createUserName, setCreateUserName] = useState('');
  const [createUserEmail, setCreateUserEmail] = useState('');
  const [createUserOutput, setCreateUserOutput] = useState('');

  const [lookupUserId, setLookupUserId] = useState(currentUserId);
  const [lookupUserOutput, setLookupUserOutput] = useState('');

  const [createSkillName, setCreateSkillName] = useState('');
  const [createSkillCategory, setCreateSkillCategory] = useState('');
  const [createSkillOutput, setCreateSkillOutput] = useState('');

  const [lookupSkillId, setLookupSkillId] = useState('');
  const [lookupSkillOutput, setLookupSkillOutput] = useState('');

  const [historySkillId, setHistorySkillId] = useState('');
  const [historyOutput, setHistoryOutput] = useState('');

  const [evidenceActorId, setEvidenceActorId] = useState(currentUserId);
  const [evidenceSkillId, setEvidenceSkillId] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceType, setEvidenceType] = useState<'github' | 'portfolio' | 'certificate' | 'article' | 'other'>('github');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceCreateOutput, setEvidenceCreateOutput] = useState('');

  const [evidenceQueryUserId, setEvidenceQueryUserId] = useState(currentUserId);
  const [evidenceQueryOutput, setEvidenceQueryOutput] = useState('');

  const [endorserId, setEndorserId] = useState(currentUserId);
  const [recipientId, setRecipientId] = useState('');
  const [endorsementSkillId, setEndorsementSkillId] = useState('');
  const [endorsementComment, setEndorsementComment] = useState('');
  const [endorseCreateOutput, setEndorseCreateOutput] = useState('');

  const [endorsementUserId, setEndorsementUserId] = useState(currentUserId);
  const [endorsementQueryOutput, setEndorsementQueryOutput] = useState('');

  const [assessmentUserId, setAssessmentUserId] = useState(currentUserId);
  const [assessmentSkillId, setAssessmentSkillId] = useState('');
  const [assessmentScore, setAssessmentScore] = useState('82');
  const [assessmentTimestamp, setAssessmentTimestamp] = useState(new Date().toISOString());
  const [assessmentSource, setAssessmentSource] = useState('automated-challenge');
  const [assessmentOutput, setAssessmentOutput] = useState('');

  const toPretty = (value: unknown): string => JSON.stringify(value, null, 2);

  const run = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      throw new Error(message);
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
        <section className="search-form">
          <div className="search-form__header">
            <div>
              <p className="eyebrow">API Workbench</p>
              <h1>Test every backend endpoint</h1>
            </div>
            <p className="search-form__lede">
              Signed in as {currentUserName}. This screen directly exercises endpoints not used in the core recruiter/candidate flow.
            </p>
          </div>
        </section>

        <section className="search-form">
          <h2>Health</h2>
          <div className="search-form__actions">
            <button
              className="button button--primary"
              onClick={() =>
                run(async () => {
                  const response = await fetchHealth();
                  setHealthOutput(toPretty(response));
                }).catch((e) => setHealthOutput(String(e)))
              }
            >
              GET /health
            </button>
          </div>
          {healthOutput ? <pre>{healthOutput}</pre> : null}
        </section>

        <section className="search-form">
          <h2>Users</h2>
          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await registerCandidate(createUserName, createUserEmail);
                setCreateUserOutput(toPretty(response));
              }).catch((e) => setCreateUserOutput(String(e)));
            }}
          >
            <label className="field">
              <span>Name</span>
              <input value={createUserName} onChange={(e) => setCreateUserName(e.target.value)} required />
            </label>
            <label className="field">
              <span>Email</span>
              <input type="email" value={createUserEmail} onChange={(e) => setCreateUserEmail(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--primary" type="submit">POST /api/users</button>
            </div>
          </form>
          {createUserOutput ? <pre>{createUserOutput}</pre> : null}

          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await fetchUserById(lookupUserId);
                setLookupUserOutput(toPretty(response));
              }).catch((e) => setLookupUserOutput(String(e)));
            }}
          >
            <label className="field field--full">
              <span>User ID</span>
              <input value={lookupUserId} onChange={(e) => setLookupUserId(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--ghost" type="submit">GET /api/users/:id</button>
            </div>
          </form>
          {lookupUserOutput ? <pre>{lookupUserOutput}</pre> : null}
        </section>

        <section className="search-form">
          <h2>Skills Admin</h2>
          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await createSkill(createSkillName, createSkillCategory);
                setCreateSkillOutput(toPretty(response));
              }).catch((e) => setCreateSkillOutput(String(e)));
            }}
          >
            <label className="field">
              <span>Skill Name</span>
              <input value={createSkillName} onChange={(e) => setCreateSkillName(e.target.value)} required />
            </label>
            <label className="field">
              <span>Category</span>
              <input value={createSkillCategory} onChange={(e) => setCreateSkillCategory(e.target.value)} />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--primary" type="submit">POST /api/skills</button>
            </div>
          </form>
          {createSkillOutput ? <pre>{createSkillOutput}</pre> : null}

          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await fetchSkillById(lookupSkillId);
                setLookupSkillOutput(toPretty(response));
              }).catch((e) => setLookupSkillOutput(String(e)));
            }}
          >
            <label className="field field--full">
              <span>Skill ID</span>
              <input value={lookupSkillId} onChange={(e) => setLookupSkillId(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--ghost" type="submit">GET /api/skills/:id</button>
            </div>
          </form>
          {lookupSkillOutput ? <pre>{lookupSkillOutput}</pre> : null}

          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await fetchSkillHistory(historySkillId);
                setHistoryOutput(toPretty(response));
              }).catch((e) => setHistoryOutput(String(e)));
            }}
          >
            <label className="field field--full">
              <span>Skill ID for History</span>
              <input value={historySkillId} onChange={(e) => setHistorySkillId(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--ghost" type="submit">GET /api/skills/:id/history</button>
            </div>
          </form>
          {historyOutput ? <pre>{historyOutput}</pre> : null}
        </section>

        <section className="search-form">
          <h2>Evidence</h2>
          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await createEvidence(evidenceActorId, {
                  skillId: evidenceSkillId,
                  url: evidenceUrl,
                  type: evidenceType,
                  metadata: { description: evidenceDescription },
                });
                setEvidenceCreateOutput(toPretty(response));
              }).catch((e) => setEvidenceCreateOutput(String(e)));
            }}
          >
            <label className="field">
              <span>Actor User ID (header)</span>
              <input value={evidenceActorId} onChange={(e) => setEvidenceActorId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Skill ID</span>
              <input value={evidenceSkillId} onChange={(e) => setEvidenceSkillId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Evidence URL</span>
              <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} required />
            </label>
            <label className="field">
              <span>Type</span>
              <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as typeof evidenceType)}>
                <option value="github">github</option>
                <option value="portfolio">portfolio</option>
                <option value="certificate">certificate</option>
                <option value="article">article</option>
                <option value="other">other</option>
              </select>
            </label>
            <label className="field field--full">
              <span>Description</span>
              <input value={evidenceDescription} onChange={(e) => setEvidenceDescription(e.target.value)} />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--primary" type="submit">POST /api/evidence</button>
            </div>
          </form>
          {evidenceCreateOutput ? <pre>{evidenceCreateOutput}</pre> : null}

          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await fetchEvidenceForUser(evidenceQueryUserId);
                setEvidenceQueryOutput(toPretty(response));
              }).catch((e) => setEvidenceQueryOutput(String(e)));
            }}
          >
            <label className="field field--full">
              <span>User ID</span>
              <input value={evidenceQueryUserId} onChange={(e) => setEvidenceQueryUserId(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--ghost" type="submit">GET /api/evidence/:userId</button>
            </div>
          </form>
          {evidenceQueryOutput ? <pre>{evidenceQueryOutput}</pre> : null}
        </section>

        <section className="search-form">
          <h2>Endorsements</h2>
          <p className="subtle-copy" style={{ marginBottom: '0.8rem' }}>
            Endorsements require three existing IDs: endorser user (`x-user-id` header), recipient user, and skill.
            Endorser and recipient must be different users.
          </p>
          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const normalizedEndorser = endorserId.trim();
                const normalizedRecipient = recipientId.trim();
                const normalizedSkill = endorsementSkillId.trim();
                if (normalizedEndorser === normalizedRecipient) {
                  throw new Error('Endorser and recipient must be different users');
                }

                const response = await createEndorsement(endorserId, {
                  recipientId: normalizedRecipient,
                  skillId: normalizedSkill,
                  comment: endorsementComment || undefined,
                });
                setEndorseCreateOutput(toPretty(response));
              }).catch((e) => setEndorseCreateOutput(String(e)));
            }}
          >
            <label className="field">
              <span>Endorser ID (header)</span>
              <input value={endorserId} onChange={(e) => setEndorserId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Recipient ID</span>
              <input value={recipientId} onChange={(e) => setRecipientId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Skill ID</span>
              <input value={endorsementSkillId} onChange={(e) => setEndorsementSkillId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Comment</span>
              <input value={endorsementComment} onChange={(e) => setEndorsementComment(e.target.value)} />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--primary" type="submit">POST /api/endorse</button>
            </div>
          </form>
          {endorseCreateOutput ? <pre>{endorseCreateOutput}</pre> : null}

          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await fetchEndorsementsForUser(endorsementUserId);
                setEndorsementQueryOutput(toPretty(response));
              }).catch((e) => setEndorsementQueryOutput(String(e)));
            }}
          >
            <label className="field field--full">
              <span>User ID</span>
              <input value={endorsementUserId} onChange={(e) => setEndorsementUserId(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--ghost" type="submit">GET /api/endorse/:userId</button>
            </div>
          </form>
          {endorsementQueryOutput ? <pre>{endorsementQueryOutput}</pre> : null}
        </section>

        <section className="search-form">
          <h2>Assessment Ingestion</h2>
          <form
            className="search-form__grid"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const response = await ingestAssessment({
                  userId: assessmentUserId,
                  skillId: assessmentSkillId,
                  score: Number(assessmentScore),
                  timestamp: assessmentTimestamp,
                  source: assessmentSource,
                });
                setAssessmentOutput(toPretty(response));
              }).catch((e) => setAssessmentOutput(String(e)));
            }}
          >
            <label className="field">
              <span>User ID</span>
              <input value={assessmentUserId} onChange={(e) => setAssessmentUserId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Skill ID</span>
              <input value={assessmentSkillId} onChange={(e) => setAssessmentSkillId(e.target.value)} required />
            </label>
            <label className="field">
              <span>Score (0-100)</span>
              <input type="number" min="0" max="100" value={assessmentScore} onChange={(e) => setAssessmentScore(e.target.value)} required />
            </label>
            <label className="field">
              <span>Timestamp (ISO)</span>
              <input value={assessmentTimestamp} onChange={(e) => setAssessmentTimestamp(e.target.value)} required />
            </label>
            <label className="field field--full">
              <span>Source</span>
              <input value={assessmentSource} onChange={(e) => setAssessmentSource(e.target.value)} required />
            </label>
            <div className="search-form__actions field--full">
              <button className="button button--primary" type="submit">POST /api/assessment/ingest</button>
            </div>
          </form>
          {assessmentOutput ? <pre>{assessmentOutput}</pre> : null}
        </section>
      </div>
    </main>
  );
};

export default ApiWorkbench;
