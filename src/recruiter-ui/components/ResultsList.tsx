import React from 'react';
import type { RecruiterSearchCandidate } from '../../types/recruiter/search';

type ResultsListProps = {
  candidates: RecruiterSearchCandidate[];
  selectedCandidateId: string | null;
  scoreVersion: string | null;
  onSelectCandidate: (candidateId: string) => void;
};

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const ResultsList: React.FC<ResultsListProps> = ({
  candidates,
  selectedCandidateId,
  scoreVersion,
  onSelectCandidate,
}) => {
  return (
    <section className="results-panel" aria-labelledby="results-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Ranked Candidates</p>
          <h2 id="results-heading">Shortlist</h2>
        </div>
        <p className="panel-heading__meta">
          {candidates.length} results
          {scoreVersion ? ` • score ${scoreVersion}` : ''}
        </p>
      </div>

      <div className="results-list" role="list">
        {candidates.map((candidate, index) => {
          const selected = candidate.candidateId === selectedCandidateId;
          const primaryReason = candidate.explanationAtoms[0];

          return (
            <button
              key={candidate.candidateId}
              type="button"
              className={`candidate-card${selected ? ' candidate-card--selected' : ''}`}
              onClick={() => onSelectCandidate(candidate.candidateId)}
              aria-pressed={selected}
            >
              <div className="candidate-card__top">
                <div>
                  <p className="candidate-card__rank">#{index + 1}</p>
                  <h3>{candidate.displayName}</h3>
                </div>
                <div className="candidate-card__score">
                  <span>{toPercent(candidate.fitScore)}</span>
                  <small>fit</small>
                </div>
              </div>

              <p className="candidate-card__reason">
                {primaryReason?.label}: {primaryReason?.value}
              </p>

              <div className="tag-row">
                {candidate.industries.map((industry) => (
                  <span key={`${candidate.candidateId}-${industry}`} className="tag">
                    {industry}
                  </span>
                ))}
                {candidate.projectTypes.map((projectType) => (
                  <span key={`${candidate.candidateId}-${projectType}`} className="tag tag--muted">
                    {projectType}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ResultsList;
