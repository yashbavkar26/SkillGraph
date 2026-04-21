import React, { useEffect, useState } from 'react';
import type {
  RecruiterSearchCandidate,
  RecruiterSearchRequest,
  RecruiterSearchResponse,
} from '../../types/recruiter/search';
import {
  fetchAllSkills,
  fetchEndorsementsForUser,
  fetchEvidenceForUser,
  fetchSkillById,
  fetchSkillHistory,
  fetchUserSkillLinks,
  searchRecruiterCandidates,
  type EndorsementWithSkill,
  type SkillHistoryEvent,
  type UserSkillLink,
} from '../api/client';
import SearchForm from '../components/SearchForm';
import ResultsList from '../components/ResultsList';
import ExplanationPanel from '../components/ExplanationPanel';
import SearchGraph from '../components/SearchGraph';
import TopCandidateSkillGraph from '../components/TopCandidateSkillGraph';
import { Link } from 'react-router-dom';
import type { Skill } from '../../types/graph';

function findSelectedCandidate(
  response: RecruiterSearchResponse | null,
  selectedCandidateId: string | null
): RecruiterSearchCandidate | null {
  if (!response || !selectedCandidateId) {
    return null;
  }
  return (
    response.candidates.find((candidate) => candidate.candidateId === selectedCandidateId) ??
    null
  );
}

type RecruiterPortalProps = {
  recruiterId?: string;
};

const RecruiterPortal: React.FC<RecruiterPortalProps> = ({ recruiterId = '' }) => {
  const [response, setResponse] = useState<RecruiterSearchResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<RecruiterSearchRequest | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Array<{ id: string; name: string }>>([]);
  const [skillNamesById, setSkillNamesById] = useState<Record<string, string>>({});
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any[]>([]);
  const [selectedEndorsements, setSelectedEndorsements] = useState<EndorsementWithSkill[]>([]);
  const [selectedCandidateSkills, setSelectedCandidateSkills] = useState<UserSkillLink[]>([]);
  const [topCandidateSkills, setTopCandidateSkills] = useState<UserSkillLink[]>([]);
  const [candidateSkillLinksByCandidateId, setCandidateSkillLinksByCandidateId] = useState<
    Record<string, UserSkillLink[]>
  >({});
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [skillSnapshots, setSkillSnapshots] = useState<Array<{ skill: Skill; history: SkillHistoryEvent[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadSkillNames = async () => {
      try {
        const skills = await fetchAllSkills();
        setAvailableSkills(skills);
        setSkillNamesById(
          Object.fromEntries(
            skills.map((skill: { id: string; name: string }) => [skill.id, skill.name])
          )
        );
      } catch (skillLoadError) {
        console.error('Failed to load skill labels for graph view', skillLoadError);
      }
    };

    void loadSkillNames();
  }, []);

  useEffect(() => {
    const loadSelectedCandidateSignals = async () => {
      if (!selectedCandidateId) {
        setSelectedEvidence([]);
        setSelectedEndorsements([]);
        setSelectedCandidateSkills([]);
        return;
      }

      setVerificationLoading(true);
      try {
        const [evidence, endorsements, linkedSkills] = await Promise.all([
          fetchEvidenceForUser(selectedCandidateId),
          fetchEndorsementsForUser(selectedCandidateId),
          fetchUserSkillLinks(selectedCandidateId),
        ]);
        setSelectedEvidence(evidence);
        setSelectedEndorsements(endorsements);
        setSelectedCandidateSkills(linkedSkills);
      } catch (verificationError) {
        console.error('Failed to load candidate verification signals', verificationError);
        setSelectedEvidence([]);
        setSelectedEndorsements([]);
        setSelectedCandidateSkills([]);
      } finally {
        setVerificationLoading(false);
      }
    };

    void loadSelectedCandidateSignals();
  }, [selectedCandidateId]);

  useEffect(() => {
    const loadCandidateSkillsForGraph = async () => {
      if (!response || response.candidates.length === 0) {
        setCandidateSkillLinksByCandidateId({});
        return;
      }

      try {
        const entries = await Promise.all(
          response.candidates.map(async (candidate) => {
            const links = await fetchUserSkillLinks(candidate.candidateId);
            return [candidate.candidateId, links] as const;
          })
        );
        setCandidateSkillLinksByCandidateId(Object.fromEntries(entries));
      } catch (error) {
        console.error('Failed to load candidate skills for graph', error);
        setCandidateSkillLinksByCandidateId({});
      }
    };

    void loadCandidateSkillsForGraph();
  }, [response]);

  useEffect(() => {
    const topCandidateId = response?.candidates[0]?.candidateId;
    if (!topCandidateId) {
      setTopCandidateSkills([]);
      return;
    }

    const loadTopCandidateSkills = async () => {
      try {
        const links = await fetchUserSkillLinks(topCandidateId);
        setTopCandidateSkills(links);
      } catch (error) {
        console.error('Failed to load top candidate skill graph', error);
        setTopCandidateSkills([]);
      }
    };

    void loadTopCandidateSkills();
  }, [response]);

  useEffect(() => {
    const loadRequiredSkillSnapshots = async () => {
      const requiredSkillIds = lastRequest?.filters?.requiredSkillIds ?? [];
      if (requiredSkillIds.length === 0) {
        setSkillSnapshots([]);
        return;
      }

      try {
        const snapshots = await Promise.all(
          requiredSkillIds.slice(0, 5).map(async (skillId) => {
            const [skill, history] = await Promise.all([
              fetchSkillById(skillId),
              fetchSkillHistory(skillId),
            ]);
            return { skill, history };
          })
        );
        setSkillSnapshots(snapshots);
      } catch (skillSnapshotError) {
        console.error('Failed to load required skill snapshots', skillSnapshotError);
        setSkillSnapshots([]);
      }
    };

    void loadRequiredSkillSnapshots();
  }, [lastRequest]);

  const handleSearch = async (
    request: RecruiterSearchRequest,
    recruiterId: string
  ): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const nextResponse = await searchRecruiterCandidates(request, { recruiterId });
      setLastRequest(request);
      setResponse(nextResponse);
      setSelectedCandidateId(nextResponse.candidates[0]?.candidateId ?? null);
      setSuccessMessage(
        nextResponse.total > 0
          ? `Showing ${nextResponse.total} ranked candidates in ${nextResponse.tookMs} ms.`
          : 'No matches found for that search. Adjust the filters and try again.'
      );
    } catch (searchError) {
      setResponse(null);
      setSelectedCandidateId(null);
      setError(
        searchError instanceof Error
          ? searchError.message
          : 'Search is temporarily unavailable.'
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCandidate = findSelectedCandidate(response, selectedCandidateId);

  return (
    <main className="recruiter-shell">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--accent-strong)', textDecoration: 'none', fontWeight: 'bold' }}>
          &larr; Back to Home
        </Link>
      </div>
      <div className="recruiter-shell__layout">
        <SearchForm
          initialRecruiterId={recruiterId}
          loading={loading}
          availableSkills={availableSkills}
          onSubmit={handleSearch}
        />

        <section className="panel recruiter-shell__summary">
          <div className="empty-state">
            <p className="eyebrow">Search Posture</p>
            <h2>Readable, safe, and explainable by default.</h2>
            <p className="subtle-copy">
              The UI keeps recruiter-facing messaging concise, disables duplicate submits
              while a request is active, and shows only allowlisted explanation fields from
              the backend contract.
            </p>
          </div>
          <div className="empty-state">
            {error ? (
              <p className="inline-message inline-message--error" role="alert">
                {error}
              </p>
            ) : (
              <p className="inline-message inline-message--success" aria-live="polite">
                {successMessage || 'Run a search to generate a ranked shortlist.'}
              </p>
            )}
          </div>
        </section>

        {response ? (
          <>
            <SearchGraph
              response={response}
              request={lastRequest}
              selectedCandidateId={selectedCandidateId}
              onSelectCandidate={setSelectedCandidateId}
              skillNamesById={skillNamesById}
              candidateSkillLinksByCandidateId={candidateSkillLinksByCandidateId}
            />
            <section className="results-grid">
              <ResultsList
                candidates={response.candidates}
                selectedCandidateId={selectedCandidateId}
                scoreVersion={response.scoreVersion}
                onSelectCandidate={setSelectedCandidateId}
              />
              <ExplanationPanel candidate={selectedCandidate} />
            </section>

            <section className="results-grid">
              {response.candidates[0] ? (
                <TopCandidateSkillGraph
                  candidateName={response.candidates[0].displayName}
                  candidateId={response.candidates[0].candidateId}
                  skills={topCandidateSkills}
                  requiredSkillIds={lastRequest?.filters?.requiredSkillIds ?? []}
                  skillNamesById={skillNamesById}
                />
              ) : null}

              <section className="results-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Candidate Signals</p>
                    <h2>Verification Snapshot</h2>
                  </div>
                  <p className="panel-heading__meta">
                    {verificationLoading ? 'Loading...' : `${selectedEvidence.length} evidence, ${selectedEndorsements.length} endorsements`}
                  </p>
                </div>

                {selectedCandidateId ? (
                  <div className="results-list">
                    <article className="explanation-card">
                      <h3>Evidence</h3>
                      <p className="subtle-copy">
                        {selectedEvidence.length === 0 ? 'No evidence found for this candidate.' : 'Latest linked evidence:'}
                      </p>
                      <div className="tag-row">
                        {selectedEvidence.slice(0, 6).map((item, idx) => (
                          <span key={`${item.id ?? idx}`} className="tag">{item.type ?? 'evidence'}</span>
                        ))}
                      </div>
                    </article>
                    <article className="explanation-card">
                      <h3>Endorsements</h3>
                      <p className="subtle-copy">
                        {selectedEndorsements.length === 0 ? 'No endorsements found for this candidate.' : 'Latest received endorsements:'}
                      </p>
                      <div className="tag-row">
                        {selectedEndorsements.slice(0, 6).map((endorsement) => (
                          <span key={endorsement.id} className="tag">
                            {endorsement.skill?.name ?? endorsement.skillId}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p className="subtle-copy">Select a candidate to inspect evidence and endorsement signals.</p>
                  </div>
                )}
              </section>

              <section className="explanation-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">Required Skills</p>
                    <h2>Skill Context</h2>
                  </div>
                  <p className="panel-heading__meta">{skillSnapshots.length} tracked</p>
                </div>
                {skillSnapshots.length === 0 ? (
                  <p className="subtle-copy">Run a search with required skill ids to view skill details and history.</p>
                ) : (
                  <div className="explanation-list">
                    {skillSnapshots.map((snapshot) => (
                      <article key={snapshot.skill.id} className="explanation-card">
                        <div className="explanation-card__top">
                          <h3>{snapshot.skill.name}</h3>
                          <span>{snapshot.skill.category || 'uncategorized'}</span>
                        </div>
                        <p className="subtle-copy">
                          {snapshot.history.length} timeline events found.
                        </p>
                        <div className="tag-row">
                          {snapshot.history.slice(0, 3).map((event) => (
                            <span key={event.id} className="tag tag--muted">{event.type}</span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </section>
          </>
        ) : (
          <section className="results-grid">
            <section className="results-panel">
              <div className="empty-state">
                <p className="eyebrow">Awaiting Search</p>
                <h2>No shortlist yet</h2>
                <p className="subtle-copy">
                  Start with a role brief and one or more required skill ids to inspect a
                  ranked candidate list.
                </p>
              </div>
            </section>
            <ExplanationPanel candidate={null} />
          </section>
        )}
      </div>
    </main>
  );
};

export default RecruiterPortal;
