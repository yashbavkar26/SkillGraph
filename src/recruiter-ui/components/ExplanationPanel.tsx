import React from 'react';
import type {
  RecruiterSearchCandidate,
  RecruiterSearchExplanationAtom,
} from '../../types/recruiter/search';

type ExplanationPanelProps = {
  candidate: RecruiterSearchCandidate | null;
};

const safeTypeLabels: Record<RecruiterSearchExplanationAtom['type'], string> = {
  matched_skills: 'Matched skills',
  evidence: 'Verified evidence',
  endorsement: 'Peer endorsement',
  graph_similarity: 'Graph similarity',
};

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ candidate }) => {
  if (!candidate) {
    return (
      <section className="explanation-panel explanation-panel--empty">
        <p className="eyebrow">Why This Match</p>
        <h2>Select a candidate</h2>
        <p>
          Choose a ranked result to inspect the explanation trail and compare contribution
          signals.
        </p>
      </section>
    );
  }

  return (
    <section className="explanation-panel" aria-labelledby="explanation-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Why This Match</p>
          <h2 id="explanation-heading">{candidate.displayName}</h2>
        </div>
        <p className="panel-heading__meta">{toPercent(candidate.fitScore)} fit</p>
      </div>

      <div className="explanation-summary">
        <p>
          This view shows only recruiter-safe explanation atoms from the approved API
          contract. Internal ids, raw graph data, and personal sensitive fields stay hidden.
        </p>
      </div>

      <div className="explanation-list">
        {candidate.explanationAtoms.map((atom) => (
          <article key={`${candidate.candidateId}-${atom.type}`} className="explanation-card">
            <div className="explanation-card__top">
              <h3>{safeTypeLabels[atom.type]}</h3>
              <span>{toPercent(atom.contribution)}</span>
            </div>
            <p>{atom.value}</p>
            <div className="meter" aria-hidden="true">
              <span style={{ width: toPercent(atom.contribution) }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ExplanationPanel;
