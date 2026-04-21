/**
 * Core graph entity type definitions for SkillGraph.
 *
 * These are the building blocks of the micro-skills graph:
 * - User: talent with a skill graph
 * - Skill: a discrete, verifiable capability
 * - Relationship: a directed edge connecting User to Skill
 */

export interface User {
  /** UUID surrogate key — stable identifier */
  id: string;
  /** Unique email address — used for identity */
  email: string;
  /** Display name */
  name: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}

export interface Skill {
  /** UUID surrogate key */
  id: string;
  /** Canonical skill name — must be unique in the graph */
  name: string;
  /** Optional category (e.g., "programming", "leadership") */
  category?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}

/**
 * Represents a `(:User)-[:HAS_SKILL]->(:Skill)` edge in the graph.
 */
export interface UserSkillRelationship {
  /** The User node id */
  userId: string;
  /** The Skill node id */
  skillId: string;
  /**
   * Self-reported proficiency level.
   * 1 = Beginner, 2 = Intermediate, 3 = Advanced, 4 = Expert
   */
  proficiency?: 1 | 2 | 3 | 4;
  /** ISO 8601 timestamp when the relationship was created */
  createdAt: string;
}

/** Paginated list result shape */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
