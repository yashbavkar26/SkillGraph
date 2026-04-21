import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RecruiterSearchRequestSchema,
  type RecruiterSearchRequest,
} from '../../types/recruiter/search';
import { normalizeDelimitedList } from '../api/client';

type SearchFormProps = {
  initialRecruiterId?: string;
  loading: boolean;
  availableSkills: Array<{ id: string; name: string }>;
  onSubmit: (request: RecruiterSearchRequest, recruiterId: string) => Promise<void>;
};

type FormState = {
  query: string;
  skillQuery: string;
  topK: string;
  industries: string;
  projectTypes: string;
  minFitScore: string;
};

const initialState = (): FormState => ({
  query: '',
  skillQuery: '',
  topK: '5',
  industries: '',
  projectTypes: '',
  minFitScore: '',
});

function rankSkillsByQuery(
  skillQuery: string,
  availableSkills: Array<{ id: string; name: string }>
): Array<{ id: string; name: string }> {
  const query = skillQuery.trim().toLowerCase();
  if (!query) return [];

  return [...availableSkills]
    .map((skill) => {
      const name = skill.name.toLowerCase();
      let score = 0;
      if (name === query) score += 10;
      if (name.startsWith(query)) score += 6;
      if (name.includes(query)) score += 4;
      for (const token of query.split(/\s+/)) {
        if (token && name.includes(token)) score += 1;
      }
      return { skill, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .map((row) => row.skill);
}

function buildRequest(state: FormState, requiredSkillIds: string[]): RecruiterSearchRequest {
  return RecruiterSearchRequestSchema.parse({
    query: state.query.trim() || undefined,
    topK: Number(state.topK),
    includeExplanation: true,
    filters: {
      industries: normalizeDelimitedList(state.industries),
      projectTypes: normalizeDelimitedList(state.projectTypes),
      requiredSkillIds,
      minFitScore: state.minFitScore === '' ? undefined : Number(state.minFitScore),
    },
  });
}

const SearchForm: React.FC<SearchFormProps> = ({
  initialRecruiterId = '',
  loading,
  availableSkills,
  onSubmit,
}) => {
  const [form, setForm] = useState<FormState>(initialState());
  const [error, setError] = useState('');
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const lastAutoSearchSignature = useRef('');

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const rankedSkillSuggestions = useMemo(
    () => rankSkillsByQuery(form.skillQuery, availableSkills).slice(0, 8),
    [form.skillQuery, availableSkills]
  );

  const selectedSkills = useMemo(
    () => selectedSkillIds
      .map((id) => availableSkills.find((skill) => skill.id === id))
      .filter((skill): skill is { id: string; name: string } => Boolean(skill)),
    [selectedSkillIds, availableSkills]
  );

  const selectSkill = (skillId: string) => {
    setSelectedSkillIds((current) => (current.includes(skillId) ? current : [...current, skillId]));
    setForm((current) => ({ ...current, skillQuery: '' }));
    setError('');
  };

  const removeSelectedSkill = (skillId: string) => {
    setSelectedSkillIds((current) => current.filter((id) => id !== skillId));
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    try {
      const recruiterId = initialRecruiterId.trim();
      const request = buildRequest(form, selectedSkillIds);

      if (!request.query && (request.filters.requiredSkillIds?.length ?? 0) === 0) {
        setError('Type a skill name or add a role brief to start searching.');
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
    setForm(initialState());
    setSelectedSkillIds([]);
    lastAutoSearchSignature.current = '';
  };

  useEffect(() => {
    const recruiterId = initialRecruiterId.trim();
    if (!recruiterId || loading) return;

    const candidateIds = rankedSkillSuggestions.slice(0, 5).map((skill) => skill.id);
    const autoSkillIds =
      selectedSkillIds.length > 0
        ? selectedSkillIds
        : candidateIds.slice(0, 1);

    if (form.skillQuery.trim().length < 2 && autoSkillIds.length === 0) {
      return;
    }

    const signature = JSON.stringify({
      query: form.query.trim(),
      topK: form.topK,
      industries: form.industries,
      projectTypes: form.projectTypes,
      minFitScore: form.minFitScore,
      autoSkillIds,
    });

    if (lastAutoSearchSignature.current === signature) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const request = buildRequest(form, autoSkillIds);
        if (!request.query && (request.filters.requiredSkillIds?.length ?? 0) === 0) {
          return;
        }
        lastAutoSearchSignature.current = signature;
        await onSubmit(request, recruiterId);
      } catch (submitError) {
        setError(
          submitError instanceof Error ? submitError.message : 'Review the search inputs.'
        );
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [
    form,
    initialRecruiterId,
    loading,
    onSubmit,
    rankedSkillSuggestions,
    selectedSkillIds,
  ]);

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-form__header">
        <div>
          <p className="eyebrow">Recruiter Search</p>
          <h1>Find talent with explainable fit, not keyword luck.</h1>
        </div>
        <p className="search-form__lede">
          Type a skill name and the graph updates instantly with best matching candidates.
          You can add multiple skills without using raw UUIDs.
        </p>
      </div>

      <div className="search-form__grid">
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
          <span>Skill name (live search)</span>
          <input
            type="text"
            value={form.skillQuery}
            onChange={(event) => updateField('skillQuery', event.target.value)}
            placeholder="e.g. GraphQL, Neo4j, Recommendation Systems"
            autoComplete="off"
          />
        </label>

        {selectedSkills.length > 0 ? (
          <div className="field field--full">
            <span>Selected skills</span>
            <div className="tag-row">
              {selectedSkills.map((skill) => (
                <button
                  key={skill.id}
                  type="button"
                  className="tag"
                  onClick={() => removeSelectedSkill(skill.id)}
                  title="Click to remove skill"
                >
                  {skill.name} x
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {form.skillQuery.trim().length > 0 ? (
          <div className="field field--full">
            <span>Suggestions</span>
            <div className="tag-row">
              {rankedSkillSuggestions.length > 0 ? (
                rankedSkillSuggestions.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className="tag tag--muted"
                    onClick={() => selectSkill(skill.id)}
                  >
                    {skill.name}
                  </button>
                ))
              ) : (
                <span className="subtle-copy">No matching skills found.</span>
              )}
            </div>
          </div>
        ) : null}

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
