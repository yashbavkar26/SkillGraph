import React from 'react';
import type {
  RecruiterSearchRequest,
  RecruiterSearchResponse,
} from '../../types/recruiter/search';
import type { UserSkillLink } from '../api/client';

type SearchGraphProps = {
  response: RecruiterSearchResponse;
  request: RecruiterSearchRequest | null;
  selectedCandidateId: string | null;
  onSelectCandidate: (candidateId: string) => void;
  skillNamesById: Record<string, string>;
  candidateSkillLinksByCandidateId: Record<string, UserSkillLink[]>;
};

type SkillNode = {
  id: string;
  name: string;
  x: number;
  y: number;
};

function shortId(value: string): string {
  return value.slice(0, 8);
}

const WIDTH = 1040;
const HEIGHT = 620;

const SearchGraph: React.FC<SearchGraphProps> = ({
  response,
  request,
  selectedCandidateId,
  onSelectCandidate,
  skillNamesById,
  candidateSkillLinksByCandidateId,
}) => {
  const requiredSkillIds = request?.filters?.requiredSkillIds ?? [];
  const selectedSkillId = requiredSkillIds[0] ?? null;
  const skillNodes: SkillNode[] = requiredSkillIds.map((skillId, index) => ({
    id: skillId,
    name: skillNamesById[skillId] ?? `Skill ${shortId(skillId)}`,
    x: 170,
    y: 180 + index * 70,
  }));

  const candidatesForGraph = selectedSkillId
    ? response.candidates.filter((candidate) => candidate.matchedSkillIds.includes(selectedSkillId))
    : response.candidates;

  const candidateCount = Math.max(candidatesForGraph.length, 1);
  const candidateRadius = 260;
  const candidateCenterX = WIDTH / 2;
  const candidateCenterY = 390;
  const angleStart = Math.PI * 0.12;
  const angleEnd = Math.PI * 0.88;

  return (
    <section className="results-panel graph-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Eligible Candidates Graph</p>
          <h2>Role to All Eligible Candidates</h2>
        </div>
        <p className="panel-heading__meta">
          {candidatesForGraph.length} eligible candidates, {requiredSkillIds.length} requested skills
        </p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Graph view of recruiter search results"
        className="search-graph"
      >
        <g>
          <circle cx={WIDTH / 2} cy={110} r={56} className="node node--role" />
          <text x={WIDTH / 2} y={105} textAnchor="middle" className="node-label node-label--title">
            Role
          </text>
          <text x={WIDTH / 2} y={128} textAnchor="middle" className="node-label">
            {(request?.query?.trim() || 'Search brief').slice(0, 28)}
          </text>
        </g>

        {skillNodes.map((skill) => (
          <g key={skill.id}>
            <circle cx={skill.x} cy={skill.y} r={34} className="node node--skill" />
            <text x={skill.x} y={skill.y + 4} textAnchor="middle" className="node-label">
              {skill.name.slice(0, 16)}
            </text>
          </g>
        ))}

        {candidatesForGraph.map((candidate, index) => {
          const ratio = candidateCount === 1 ? 0.5 : index / (candidateCount - 1);
          const angle = angleStart + ratio * (angleEnd - angleStart);
          const x = candidateCenterX + Math.cos(angle) * candidateRadius;
          const y = candidateCenterY + Math.sin(angle) * 110;
          const isSelected = candidate.candidateId === selectedCandidateId;
          const candidateLinks = candidateSkillLinksByCandidateId[candidate.candidateId] ?? [];
          const additionalSkillIds = candidateLinks
            .map((link) => link.skillId)
            .filter((skillId) => !requiredSkillIds.includes(skillId))
            .slice(0, 4);

          return (
            <g key={candidate.candidateId}>
              <line
                x1={WIDTH / 2}
                y1={166}
                x2={x}
                y2={y - 28}
                className="edge edge--role-candidate"
                strokeWidth={Math.max(1.5, candidate.fitScore * 6)}
              />

              {skillNodes
                .filter((skill) => candidate.matchedSkillIds.includes(skill.id))
                .map((skill) => (
                  <line
                    key={`${candidate.candidateId}-${skill.id}`}
                    x1={x}
                    y1={y}
                    x2={skill.x + 26}
                    y2={skill.y + 8}
                    className="edge edge--candidate-skill"
                  />
                ))}

              {additionalSkillIds.map((skillId, addIndex) => {
                const deltaY = (addIndex - (additionalSkillIds.length - 1) / 2) * 46;
                const sx = x + 170;
                const sy = y + deltaY;
                return (
                  <g key={`${candidate.candidateId}-additional-${skillId}`}>
                    <line
                      x1={x + 32}
                      y1={y}
                      x2={sx - 26}
                      y2={sy}
                      className="edge edge--candidate-skill"
                    />
                    <circle cx={sx} cy={sy} r={22} className="node node--additional-skill" />
                    <text x={sx} y={sy + 4} textAnchor="middle" className="node-label">
                      {(skillNamesById[skillId] ?? shortId(skillId)).slice(0, 12)}
                    </text>
                  </g>
                );
              })}

              <circle
                cx={x}
                cy={y}
                r={isSelected ? 34 : 30}
                className={`node node--candidate${isSelected ? ' node--selected' : ''}`}
                onClick={() => onSelectCandidate(candidate.candidateId)}
              />
              <text x={x} y={y - 2} textAnchor="middle" className="node-label node-label--title">
                {candidate.displayName.slice(0, 14)}
              </text>
              <text x={x} y={y + 16} textAnchor="middle" className="node-label">
                {Math.round(candidate.fitScore * 100)}% fit
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
};

export default SearchGraph;
