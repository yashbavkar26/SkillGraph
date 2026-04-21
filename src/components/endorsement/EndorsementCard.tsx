import React, { useState } from 'react';

export interface EndorsementCardData {
  id: string;
  endorserName: string;
  skillName: string;
  timestamp: string;
  comment?: string;
}

interface EndorsementCardProps {
  endorsement: EndorsementCardData;
  recipientId: string;
  skillId: string;
  alreadyEndorsed?: boolean;
  onCreated?: (payload: Record<string, unknown>) => void;
  onError?: (message: string) => void;
}

type EndorsementResponse = {
  error?: string;
} & Record<string, unknown>;

const EndorsementCard: React.FC<EndorsementCardProps> = ({
  endorsement,
  recipientId,
  skillId,
  alreadyEndorsed = true,
  onCreated,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const requestEndorsement = async () => {
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/endorse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          skillId,
          comment: comment || undefined,
        }),
      });
      const data = (await response.json()) as EndorsementResponse;
      if (!response.ok) {
        setStatus('error');
        setErrorMessage(data.error ?? 'Failed to create endorsement');
        onError?.(data.error ?? 'Failed to create endorsement');
      } else {
        setStatus('success');
        onCreated?.(data);
      }
    } catch (_error) {
      setStatus('error');
      setErrorMessage('Network error while creating endorsement');
      onError?.('Network error while creating endorsement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '0.75rem' }}>
      <p>
        <strong>{endorsement.endorserName}</strong> endorsed you for{' '}
        <strong>{endorsement.skillName}</strong>
      </p>
      {endorsement.comment ? <p>{endorsement.comment}</p> : null}
      <small>{new Date(endorsement.timestamp).toLocaleString()}</small>

      {!alreadyEndorsed ? (
        <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add an optional comment"
            disabled={loading}
          />
          <button type="button" onClick={requestEndorsement} disabled={loading}>
            {loading ? 'Submitting...' : 'Endorse this skill'}
          </button>
          {status === 'success' ? <small style={{ color: 'green' }}>Endorsement submitted.</small> : null}
          {status === 'error' ? <small style={{ color: 'red' }}>{errorMessage}</small> : null}
        </div>
      ) : null}
    </section>
  );
};

export default EndorsementCard;

