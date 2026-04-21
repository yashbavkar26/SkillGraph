import {
  RecruiterSearchRequestSchema,
  RecruiterSearchResponseSchema,
  type RecruiterSearchRequest,
  type RecruiterSearchResponse,
} from '../../types/recruiter/search';

const DEFAULT_RECRUITER_ID = '00000000-0000-4000-8000-000000000003';

type SearchClientOptions = {
  recruiterId?: string;
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
