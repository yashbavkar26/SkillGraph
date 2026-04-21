import React, { useState } from 'react';
import type {
  RecruiterSearchCandidate,
  RecruiterSearchRequest,
  RecruiterSearchResponse,
} from '../types/recruiter/search';
import { searchRecruiterCandidates } from './api/client';
import SearchForm from './components/SearchForm';
import ResultsList from './components/ResultsList';
import ExplanationPanel from './components/ExplanationPanel';

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

const App: React.FC = () => {
  const [response, setResponse] = useState<RecruiterSearchResponse | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = async (
    request: RecruiterSearchRequest,
    recruiterId: string
  ): Promise<void> => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const nextResponse = await searchRecruiterCandidates(request, { recruiterId });
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
      <div className="recruiter-shell__layout">
        <SearchForm
          initialRecruiterId="00000000-0000-4000-8000-000000000003"
          loading={loading}
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
          <section className="results-grid">
            <ResultsList
              candidates={response.candidates}
              selectedCandidateId={selectedCandidateId}
              scoreVersion={response.scoreVersion}
              onSelectCandidate={setSelectedCandidateId}
            />
            <ExplanationPanel candidate={selectedCandidate} />
          </section>
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

export default App;
