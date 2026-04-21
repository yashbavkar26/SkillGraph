import React, { useEffect, useState } from 'react';

interface SkillCard {
  id: string;
  name: string;
  category?: string;
}

interface SkillDashboardProps {
  onSelectSkill?: (skillId: string) => void;
}

const SkillDashboard: React.FC<SkillDashboardProps> = ({ onSelectSkill }) => {
  const [skills, setSkills] = useState<SkillCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('');

  const loadSkills = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/skills');
      if (!response.ok) {
        setError('Failed to load skills');
        return;
      }
      const data = await response.json();
      setSkills(Array.isArray(data) ? data : []);
    } catch (_error) {
      setError('Network error while loading skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSkills();
  }, []);

  const addSkill = async () => {
    if (!newSkillName.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSkillName.trim(),
          category: newSkillCategory.trim() || undefined,
        }),
      });
      if (response.ok) {
        setNewSkillName('');
        setNewSkillCategory('');
        setShowAddForm(false);
        await loadSkills();
      }
    } catch (_error) {
      setError('Could not add skill');
    }
  };

  if (loading) {
    return <p>Loading skills...</p>;
  }

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Skill Dashboard</h2>
        <button type="button" onClick={() => setShowAddForm((current) => !current)}>
          {showAddForm ? 'Cancel' : 'Add Skill'}
        </button>
      </header>

      {showAddForm ? (
        <div style={{ display: 'grid', gap: '0.5rem', border: '1px solid #ddd', padding: '0.75rem' }}>
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            placeholder="Skill name"
          />
          <input
            type="text"
            value={newSkillCategory}
            onChange={(e) => setNewSkillCategory(e.target.value)}
            placeholder="Category (optional)"
          />
          <button type="button" onClick={() => void addSkill()}>
            Save Skill
          </button>
        </div>
      ) : null}

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {skills.map((skill) => (
          <article
            key={skill.id}
            style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer' }}
            onClick={() => onSelectSkill?.(skill.id)}
          >
            <h3 style={{ margin: 0 }}>{skill.name}</h3>
            <p style={{ margin: '0.25rem 0 0' }}>{skill.category ?? 'Uncategorized'}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SkillDashboard;

