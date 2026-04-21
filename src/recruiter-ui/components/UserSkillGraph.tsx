import React from 'react';
import type { UserSkillLink } from '../api/client';

type UserSkillGraphProps = {
  userName: string;
  userId: string;
  skills: UserSkillLink[];
  skillNamesById: Record<string, string>;
  eyebrowLabel?: string;
  title?: string;
  metaLabel?: string;
};

type PositionedSkill = {
  skillId: string;
  name: string;
  createdAt: string;
  x: number;
  y: number;
  radius: number;
};

const WIDTH = 860;
const HEIGHT = 480;

function toTimestamp(iso: string): number {
  const ts = Date.parse(iso);
  return Number.isNaN(ts) ? 0 : ts;
}

function radiusForRecency(createdAt: string, minTs: number, maxTs: number): number {
  const createdTs = toTimestamp(createdAt);
  if (maxTs <= minTs) {
    return 28;
  }
  const ratio = (createdTs - minTs) / (maxTs - minTs);
  return 18 + ratio * 24;
}

const UserSkillGraph: React.FC<UserSkillGraphProps> = ({
  userName,
  userId,
  skills,
  skillNamesById,
  eyebrowLabel = 'My Skill Graph',
  title = 'All Linked Skills',
  metaLabel = 'Newer skills = larger nodes',
}) => {
  const sortedSkills = [...skills].sort(
    (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt)
  );

  const minTs = sortedSkills.length > 0 ? toTimestamp(sortedSkills[0].createdAt) : 0;
  const maxTs =
    sortedSkills.length > 0 ? toTimestamp(sortedSkills[sortedSkills.length - 1].createdAt) : 0;

  const placed: PositionedSkill[] = sortedSkills.map((link, index) => {
    const angle = (index / Math.max(sortedSkills.length, 1)) * Math.PI * 2;
    const orbitX = WIDTH / 2;
    const orbitY = HEIGHT / 2 + 14;
    const orbitRadiusX = 290;
    const orbitRadiusY = 150;
    return {
      skillId: link.skillId,
      name: skillNamesById[link.skillId] ?? link.skillId,
      createdAt: link.createdAt,
      x: orbitX + Math.cos(angle) * orbitRadiusX,
      y: orbitY + Math.sin(angle) * orbitRadiusY,
      radius: radiusForRecency(link.createdAt, minTs, maxTs),
    };
  });

  return (
    <section className="results-panel graph-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">{eyebrowLabel}</p>
          <h2>{title}</h2>
        </div>
        <p className="panel-heading__meta">{metaLabel}</p>
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="User skill graph with node size based on recency"
        className="search-graph user-skill-graph"
      >
        <g>
          <circle cx={WIDTH / 2} cy={HEIGHT / 2} r={48} className="node node--role" />
          <text x={WIDTH / 2} y={HEIGHT / 2 - 2} textAnchor="middle" className="node-label node-label--title">
            {userName.slice(0, 18)}
          </text>
          <text x={WIDTH / 2} y={HEIGHT / 2 + 15} textAnchor="middle" className="node-label">
            {userId.slice(0, 8)}
          </text>
        </g>

        {placed.map((skill) => (
          <g key={skill.skillId}>
            <line
              x1={WIDTH / 2}
              y1={HEIGHT / 2}
              x2={skill.x}
              y2={skill.y}
              className="edge edge--candidate-skill"
            />
            <circle cx={skill.x} cy={skill.y} r={skill.radius} className="node node--skill user-skill-node" />
            <text x={skill.x} y={skill.y - 3} textAnchor="middle" className="node-label node-label--title">
              {skill.name.slice(0, 16)}
            </text>
            <text x={skill.x} y={skill.y + 13} textAnchor="middle" className="node-label">
              {new Date(skill.createdAt).toLocaleDateString()}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
};

export default UserSkillGraph;
