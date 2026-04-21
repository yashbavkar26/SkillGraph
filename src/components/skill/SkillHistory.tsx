import React, { useEffect, useState } from 'react';

export interface SkillHistoryEvent {
  id: string;
  type: 'level_change' | 'evidence_added' | 'endorsement_added' | string;
  detail: string;
  timestamp: string;
}

interface SkillHistoryProps {
  skillId: string;
}

const SkillHistory: React.FC<SkillHistoryProps> = ({ skillId }) => {
  const [events, setEvents] = useState<SkillHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/skills/${skillId}/history`);
        if (!response.ok) {
          setError('Unable to load skill history');
          return;
        }
        const data = await response.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (_e) {
        setError('Network error while loading history');
      } finally {
        setLoading(false);
      }
    };

    if (skillId) {
      void load();
    } else {
      setEvents([]);
      setLoading(false);
    }
  }, [skillId]);

  if (loading) {
    return <p>Loading history...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (events.length === 0) {
    return <p>No history events yet.</p>;
  }

  return (
    <ol style={{ display: 'grid', gap: '0.5rem' }}>
      {events.map((event) => (
        <li key={event.id} style={{ borderLeft: '3px solid #888', paddingLeft: '0.5rem' }}>
          <strong>{event.type}</strong>: {event.detail}
          <br />
          <small>{new Date(event.timestamp).toLocaleString()}</small>
        </li>
      ))}
    </ol>
  );
};

export default SkillHistory;

