import {
  RecruiterSearchRequestSchema,
  RecruiterSearchResponseSchema,
  type RecruiterSearchRequest,
  type RecruiterSearchResponse,
} from '../../types/recruiter/search';
import type { User } from '../../types/graph';

const DEFAULT_RECRUITER_ID = '00000000-0000-4000-8000-000000000003';
const AUTH_STORAGE_KEY = 'skillgraph.auth.user';

type SearchClientOptions = {
  recruiterId?: string;
};

export type UserRole = 'candidate' | 'recruiter';

export type LoginResponse = {
  user: User;
  isNewUser: boolean;
};

export type SkillHistoryEvent = {
  id: string;
  type: string;
  detail: string;
  timestamp: string;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
};

export type EndorsementWithSkill = {
  id: string;
  endorserId: string;
  recipientId: string;
  skillId: string;
  timestamp: string;
  comment?: string;
  weight?: number;
  riskFlags?: string[];
  skill?: {
    id: string;
    name: string;
    category?: string;
  };
};

export type UserSkillLink = {
  userId: string;
  skillId: string;
  proficiency?: number;
  createdAt: string;
};

export type SearchableUser = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  createdAt: string;
};

function toUserSafeErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Review the search inputs and try again.';
    case 401:
      return 'Recruiter access is missing. Add a recruiter id before searching.';
    case 413:
      return 'That search is too broad for one request. Trim the filters and try again.';
    default:
      return 'Search is temporarily unavailable. Please try again in a moment.';
  }
}

export function normalizeDelimitedList(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function searchRecruiterCandidates(
  request: RecruiterSearchRequest,
  options: SearchClientOptions = {}
): Promise<RecruiterSearchResponse> {
  const parsedRequest = RecruiterSearchRequestSchema.parse(request);
  const response = await fetch('/api/recruiter/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': options.recruiterId ?? DEFAULT_RECRUITER_ID,
    },
    body: JSON.stringify(parsedRequest),
  });

  if (!response.ok) {
    throw new Error(toUserSafeErrorMessage(response.status));
  }

  const body = await response.json();
  return RecruiterSearchResponseSchema.parse(body);
}

export async function registerCandidate(name: string, email: string): Promise<any> {
  return registerUser({ name, email, role: 'candidate' }).then((result) => result.user);
}

export async function registerUser(input: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<LoginResponse> {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: input.name, email: input.email, role: input.role }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to register');
  }
  return response.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch('/health');
  if (!response.ok) throw new Error('Failed to fetch health');
  return response.json();
}

export async function loginWithEmail(email: string): Promise<LoginResponse> {
  return loginUser({ email, role: 'candidate' });
}

export async function loginUser(input: { email: string; role: UserRole }): Promise<LoginResponse> {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: input.email, role: input.role }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to log in');
  }

  return response.json();
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as User;
    if (!parsed.id || !parsed.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function fetchAllSkills(): Promise<any[]> {
  const response = await fetch('/api/skills');
  if (!response.ok) throw new Error('Failed to fetch skills');
  return response.json();
}

export async function createSkill(name: string, category?: string): Promise<any> {
  const response = await fetch('/api/skills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, category: category?.trim() || undefined }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create skill');
  }
  return response.json();
}

export async function fetchSkillById(skillId: string): Promise<any> {
  const response = await fetch(`/api/skills/${encodeURIComponent(skillId)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch skill');
  }
  return response.json();
}

export async function fetchSkillHistory(skillId: string): Promise<SkillHistoryEvent[]> {
  const response = await fetch(`/api/skills/${encodeURIComponent(skillId)}/history`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch skill history');
  }
  return response.json();
}

export async function addSkillToCandidate(userId: string, skillId: string, proficiency: number = 3): Promise<any> {
  const response = await fetch('/api/relationships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, skillId, proficiency }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to add skill');
  }
  return response.json();
}

export async function fetchUserSkillLinks(userId: string): Promise<UserSkillLink[]> {
  const response = await fetch(`/api/relationships/users/${encodeURIComponent(userId)}/skills`);
  if (!response.ok) throw new Error('Failed to fetch user skills');
  return response.json();
}

export async function fetchUserById(userId: string): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch user');
  }
  return response.json();
}

export async function searchUsers(input: {
  query?: string;
  role?: UserRole;
  limit?: number;
}): Promise<SearchableUser[]> {
  const params = new URLSearchParams();
  if (input.query?.trim()) {
    params.set('query', input.query.trim());
  }
  if (input.role) {
    params.set('role', input.role);
  }
  if (typeof input.limit === 'number' && Number.isFinite(input.limit)) {
    params.set('limit', String(Math.trunc(input.limit)));
  }

  const querySuffix = params.toString() ? `?${params.toString()}` : '';
  const response = await fetch(`/api/users${querySuffix}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch users');
  }

  return response.json();
}

export async function createEvidence(
  actorUserId: string,
  payload: {
    skillId: string;
    url: string;
    type: 'github' | 'portfolio' | 'certificate' | 'article' | 'other';
    metadata: Record<string, unknown>;
  }
): Promise<any> {
  const response = await fetch('/api/evidence', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': actorUserId,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create evidence');
  }
  return response.json();
}

export async function fetchEvidenceForUser(userId: string): Promise<any[]> {
  const response = await fetch(`/api/evidence/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch evidence');
  }
  return response.json();
}

export async function createEndorsement(
  endorserId: string,
  payload: {
    recipientId: string;
    skillId: string;
    comment?: string;
  }
): Promise<any> {
  const normalizedEndorserId = endorserId.trim();
  const normalizedRecipientId = payload.recipientId.trim();
  const normalizedSkillId = payload.skillId.trim();
  const normalizedComment = payload.comment?.trim() || undefined;

  const response = await fetch('/api/endorse', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': normalizedEndorserId,
    },
    body: JSON.stringify({
      recipientId: normalizedRecipientId,
      skillId: normalizedSkillId,
      comment: normalizedComment,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create endorsement');
  }
  return response.json();
}

export async function fetchEndorsementsForUser(userId: string): Promise<EndorsementWithSkill[]> {
  const response = await fetch(`/api/endorse/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch endorsements');
  }
  return response.json();
}

export async function ingestAssessment(payload: {
  userId: string;
  skillId: string;
  score: number;
  timestamp: string;
  source: string;
}): Promise<any> {
  const response = await fetch('/api/assessment/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to ingest assessment');
  }
  return response.json();
}
