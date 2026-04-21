import React, { useEffect, useState } from 'react';
import EvidenceLinker from '../evidence/EvidenceLinker';
import EndorsementCard, { EndorsementCardData } from '../endorsement/EndorsementCard';
import SkillHistory from './SkillHistory';

interface SkillDetailProps {
  userId: string;
  skillId: string;
}

interface SkillDetailData {
  id: string;
  name: string;
  category?: string;
  proficiency?: number;
}

const SkillDetail: React.FC<SkillDetailProps> = ({ userId, skillId }) => {
  const [skill, setSkill] = useState<SkillDetailData | null>(null);
  const [endorsements, setEndorsements] = useState<EndorsementCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [skillRes, endorseRes] = await Promise.all([
          fetch(`/api/skills/${skillId}`),
          fetch(`/api/endorse/${userId}`),
        ]);

        if (skillRes.ok) {
          setSkill(await skillRes.json());
        } else {
          setSkill(null);
        }

        if (endorseRes.ok) {
          const raw = await endorseRes.json();
          const mapped = Array.isArray(raw)
            ? raw
                .filter((item: any) => item.skillId === skillId)
                .map((item: any) => ({
                  id: item.id,
                  endorserName: item.endorserId,
                  skillName: item.skill?.name ?? skill?.name ?? 'Skill',
                  timestamp: item.timestamp,
                  comment: item.comment,
                }))
            : [];
          setEndorsements(mapped);
        } else {
          setEndorsements([]);
        }
      } finally {
        setLoading(false);
      }
    };

    if (userId && skillId) {
      void load();
    }
  }, [userId, skillId, skill?.name]);

  if (loading) {
    return <p>Loading skill details...</p>;
  }

  if (!skill) {
    return <p>Skill not found.</p>;
  }

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <header>
        <h2>{skill.name}</h2>
        <p>Category: {skill.category ?? 'Uncategorized'}</p>
        <p>Current proficiency: {skill.proficiency ?? 'Unknown'}</p>
      </header>

      <section>
        <h3>Evidence</h3>
        <EvidenceLinker
          userId={userId}
          skills={[{ id: skill.id, name: skill.name }]}
          onSuccess={() => {
            // Intentionally light: list refresh is deferred to parent flow.
          }}
        />
      </section>

      <section>
        <h3>Endorsements</h3>
        {endorsements.length === 0 ? <p>No endorsements yet.</p> : null}
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {endorsements.map((endorsement) => (
            <EndorsementCard
              key={endorsement.id}
              endorsement={endorsement}
              recipientId={userId}
              skillId={skill.id}
              alreadyEndorsed
            />
          ))}
        </div>
      </section>

      <section>
        <h3>Skill Evolution</h3>
        <SkillHistory skillId={skill.id} />
      </section>
    </section>
  );
};

export default SkillDetail;

