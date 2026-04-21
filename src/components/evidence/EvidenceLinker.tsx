import React, { useState } from 'react';
import { EvidenceType, type EvidenceInput } from '../../types/evidence';

interface Skill {
  id: string;
  name: string;
}

interface EvidenceLinkerProps {
  skills: Skill[];
  userId: string;
  onSuccess?: (evidence: Record<string, unknown>) => void;
  onError?: (error: string) => void;
}

type EvidenceResponse = {
  error?: string;
} & Record<string, unknown>;

const EvidenceLinker: React.FC<EvidenceLinkerProps> = ({ skills, userId, onSuccess, onError }) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [type, setType] = useState<EvidenceType>('github');
  const [metadata, setMetadata] = useState<{ description?: string; externalId?: string }>({});
  
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId || !url) {
      onError?.('Skill and URL are required');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    const payload: EvidenceInput = {
      skillId: selectedSkillId,
      url,
      type,
      metadata,
    };

    try {
      const response = await fetch('/api/evidence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId, // As per T-02-02 mitigation in API
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as EvidenceResponse;

      if (response.ok) {
        setStatus('success');
        setUrl('');
        setMetadata({});
        if (onSuccess) onSuccess(data);
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit evidence');
        if (onError) onError(data.error || 'Failed to submit evidence');
      }
    } catch (_err) {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
      if (onError) onError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="evidence-linker" style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Link Evidence</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="skill">Skill</label>
          <select
            id="skill"
            value={selectedSkillId}
            onChange={(e) => setSelectedSkillId(e.target.value)}
            disabled={loading}
            style={{ padding: '0.5rem' }}
          >
            <option value="">Select a skill</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="url">URL</label>
          <input
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            disabled={loading}
            required
            style={{ padding: '0.5rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as EvidenceType)}
            disabled={loading}
            style={{ padding: '0.5rem' }}
          >
            <option value="github">GitHub</option>
            <option value="portfolio">Portfolio</option>
            <option value="certificate">Certificate</option>
            <option value="article">Article</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="description">Description (Optional)</label>
          <input
            id="description"
            type="text"
            value={metadata.description || ''}
            onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
            disabled={loading}
            style={{ padding: '0.5rem' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '0.5rem', 
            backgroundColor: loading ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Evidence'}
        </button>

        {status === 'success' && <p style={{ color: 'green' }}>Evidence linked successfully!</p>}
        {status === 'error' && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </form>
    </div>
  );
};

export default EvidenceLinker;
