import React, { useState } from 'react';
import {
  RecruiterSearchRequestSchema,
  type RecruiterSearchRequest,
} from '../../types/recruiter/search';
import { normalizeDelimitedList } from '../api/client';

type SearchFormProps = {
  initialRecruiterId?: string;
  loading: boolean;
  onSubmit: (request: RecruiterSearchRequest, recruiterId: string) => Promise<void>;
};

type FormState = {
  recruiterId: string;
  query: string;
  topK: string;
  industries: string;
  projectTypes: string;
  requiredSkillIds: string;
  minFitScore: string;
};

const initialState = (recruiterId = ''): FormState => ({
  recruiterId,
  query: 'Senior graph engineer',
  topK: '5',
  industries: 'fintech',
  projectTypes: 'backend-platform',
  requiredSkillIds:
    '11111111-1111-4111-8111-111111111111,\n22222222-2222-4222-8222-222222222222',
  minFitScore: '0.25',
});

function buildRequest(state: FormState): RecruiterSearchRequest {
  return RecruiterSearchRequestSchema.parse({
    query: state.query.trim() || undefined,
    topK: Number(state.topK),
    includeExplanation: true,
    filters: {
      industries: normalizeDelimitedList(state.industries),
      projectTypes: normalizeDelimitedList(state.projectTypes),
      requiredSkillIds: normalizeDelimitedList(state.requiredSkillIds),
      minFitScore: state.minFitScore === '' ? undefined : Number(state.minFitScore),
    },
  });
}

const SearchForm: React.FC<SearchFormProps> = ({
  initialRecruiterId = '',
  loading,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(initialState(initialRecruiterId));
  const [error, setError] = useState('');

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const request = buildRequest(form);
      const recruiterId = form.recruiterId.trim();

      if (!recruiterId) {
        setError('Enter a recruiter id before running a search.');
        return;
      }

      if (!request.query && (request.filters.requiredSkillIds?.length ?? 0) === 0) {
        setError('Add a recruiter query or at least one required skill id.');
        return;
      }

      await onSubmit(request, recruiterId);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Review the search inputs.'
      );
    }
  };

  const handleReset = () => {
    setError('');
    setForm(initialState(initialRecruiterId));
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-form__header">
        <div>
          <p className="eyebrow">Recruiter Search</p>
          <h1>Find talent with explainable fit, not keyword luck.</h1>
        </div>
        <p className="search-form__lede">
          Combine role intent, market context, and required skill ids to rank candidates
          with a recruiter-safe explanation trail.
        </p>
      </div>

      <div className="search-form__grid">
        <label className="field">
          <span>Recruiter ID</span>
          <input
            type="text"
            value={form.recruiterId}
            onChange={(event) => updateField('recruiterId', event.target.value)}
            placeholder="00000000-0000-4000-8000-000000000003"
            autoComplete="off"
          />
        </label>

        <label className="field">
          <span>Top results</span>
          <select
            value={form.topK}
            onChange={(event) => updateField('topK', event.target.value)}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="25">25</option>
          </select>
        </label>

        <label className="field field--full">
          <span>Role or search brief</span>
          <textarea
            value={form.query}
            onChange={(event) => updateField('query', event.target.value)}
            placeholder="Senior graph engineer with fintech backend platform experience"
            rows={3}
          />
        </label>

        <label className="field">
          <span>Industries</span>
          <textarea
            value={form.industries}
            onChange={(event) => updateField('industries', event.target.value)}
            placeholder="fintech, healthcare"
            rows={3}
          />
        </label>

        <label className="field">
          <span>Project types</span>
          <textarea
            value={form.projectTypes}
            onChange={(event) => updateField('projectTypes', event.target.value)}
            placeholder="backend-platform, analytics"
            rows={3}
          />
        </label>

        <label className="field field--full">
          <span>Required skill IDs</span>
          <textarea
            value={form.requiredSkillIds}
            onChange={(event) => updateField('requiredSkillIds', event.target.value)}
            placeholder="One UUID per line or comma-separated"
            rows={4}
          />
        </label>

        <label className="field">
          <span>Minimum fit score</span>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={form.minFitScore}
            onChange={(event) => updateField('minFitScore', event.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="inline-message inline-message--error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="search-form__actions">
        <button type="submit" className="button button--primary" disabled={loading}>
          {loading ? 'Searching...' : 'Run Search'}
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={handleReset}
          disabled={loading}
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default SearchForm;
