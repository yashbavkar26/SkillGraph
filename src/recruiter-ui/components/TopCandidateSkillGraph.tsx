import React from 'react';
import type { UserSkillLink } from '../api/client';

type TopCandidateSkillGraphProps = {
  candidateName: string;
  candidateId: string;
  skills: UserSkillLink[];
  requiredSkillIds: string[];
  skillNamesById: Record<string, string>;
};

type SkillNode = {
  skillId: string;
  x: number;
  y: number;
  label: string;
  isRequired: boolean;
  ring: number;
};

const WIDTH = 960;
const HEIGHT = 520;

const TopCandidateSkillGraph: React.FC<TopCandidateSkillGraphProps> = ({
  candidateName,
  candidateId,
  skills,
  requiredSkillIds,
  skillNamesById,
}) => {
  const requiredSet = new Set(requiredSkillIds);
  const sortedSkills = [...skills].sort((a, b) => a.skillId.localeCompare(b.skillId));
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2 + 20;
  const maxPerRing = 12;
  const rings = Math.max(1, Math.ceil(sortedSkills.length / maxPerRing));
  const ringGapX = 75;
  const ringGapY = 42;
  const baseRadiusX = 180;
  const baseRadiusY = 90;

  const skillNodes: SkillNode[] = [];
  for (let ring = 0; ring < rings; ring += 1) {
    const start = ring * maxPerRing;
    const end = Math.min(start + maxPerRing, sortedSkills.length);
    const ringSkills = sortedSkills.slice(start, end);

    ringSkills.forEach((link, index) => {
      const angle = (index / Math.max(ringSkills.length, 1)) * Math.PI * 2;
      const radiusX = baseRadiusX + ring * ringGapX;
      const radiusY = baseRadiusY + ring * ringGapY;
      const x = centerX + Math.cos(angle) * radiusX;
      const y = centerY + Math.sin(angle) * radiusY;
      skillNodes.push({
        skillId: link.skillId,
        x,
        y,
        label: skillNamesById[link.skillId] ?? link.skillId,
        isRequired: requiredSet.has(link.skillId),
        ring,
      });
    });
  }

  const additionalCount = skillNodes.filter((node) => !node.isRequired).length;

  return (
    <section className="results-panel graph-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Top Candidate Graph</p>
          <h2>Best Match + Full Skill Set</h2>
        </div>
        <p className="panel-heading__meta">
          {skillNodes.length} total skills, {additionalCount} additional
        </p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Top candidate graph with requested and additional skills"
        className="search-graph"
      >
        <g>
          <circle cx={centerX} cy={centerY} r={58} className="node node--candidate node--selected" />
          <text x={centerX} y={centerY - 6} textAnchor="middle" className="node-label node-label--title">
            {candidateName.slice(0, 18)}
          </text>
          <text x={centerX} y={centerY + 14} textAnchor="middle" className="node-label">
            {candidateId.slice(0, 8)}
          </text>
        </g>

        {skillNodes.map((node) => (
          <g key={node.skillId}>
            <line
              x1={centerX}
              y1={centerY}
              x2={node.x}
              y2={node.y}
              className={node.isRequired ? 'edge edge--role-candidate' : 'edge edge--candidate-skill'}
              strokeWidth={node.isRequired ? 2.6 : 1.4}
            />
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isRequired ? 24 : 19}
              className={`node ${node.isRequired ? 'node--skill' : 'node--additional-skill'}`}
            />
            <text x={node.x} y={node.y - 2} textAnchor="middle" className="node-label node-label--title">
              {node.label.slice(0, 12)}
            </text>
            <text x={node.x} y={node.y + 14} textAnchor="middle" className="node-label">
              {node.isRequired ? 'requested' : 'additional'}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
};

export default TopCandidateSkillGraph;
