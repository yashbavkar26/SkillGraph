# Requirements: SkillGraph

## 1. Functional Requirements

### 1.1 Talent Portal (User-Facing)
- **FR-1: Skill Graph Management**: Users must be able to add, remove, and organize micro-skills in a visual or structured way.
- [x] **FR-2: Evidence Linking**: Users must be able to link external artifacts (GitHub repos, portfolio sites, certificates) as evidence for specific skills.
- **FR-3: Endorsement Request**: Users must be able to request endorsements from peers or project collaborators.
- **FR-4: Skill Evolution Tracking**: The system must maintain a history of skill growth and changes over time.

### 1.2 Recruiter Search Engine (Recruiter-Facing)
- **FR-5: Advanced Skill Search**: Recruiters must be able to search for candidates based on specific skill sets and proficiency levels.
- **FR-6: Explainable Fit Scores**: The search engine must provide a 'fit score' for each candidate and explain *why* they are a match (e.g., "Candidate has 3 projects demonstrating Skill X and 2 peer endorsements in Skill Y").
- **FR-7: Contextual Filtering**: Recruiters must be able to filter by industry, project type, or specific combinations of skills.

### 1.3 Verification Layer
- **FR-8: Peer Endorsements**: A mechanism for users to endorse others, with weight determined by the endorser's own reputation.
- **FR-9: Automated Assessment Integration**: Ability to ingest results from external skill assessments (e.g., coding challenges).
- [x] **FR-10: Artifact Verification**: A workflow for reviewing linked artifacts to validate claims.

## 2. Non-Functional Requirements

### 2.1 Performance
- **NFR-1: Search Latency**: Similarity search and fit score calculation must return results within < 500ms.
- **NFR-2: Graph Query Efficiency**: Complex graph traversals for reputation calculation must be optimized.

### 2.2 Scalability
- **NFR-3: Data Volume**: The system must scale to support millions of users, skills, and relationships.
- **NFR-4: Concurrency**: The system must handle high volumes of concurrent read/write operations.

### 2.3 Reliability & Security
- **NFR-5: Data Integrity**: The skill graph must maintain strict consistency for endorsements and reputation.
- **NFR-6: Privacy**: User skill data and personal information must be protected according to GDPR/CCPA standards.

## 3. Technical Constraints
- **TC-1: Graph Backend**: Must use a specialized graph database (e.g., Neo4j, ArangoDB).
- **TC-2: Search Engine**: Must implement advanced similarity search (e.g., GNNs or Node2Vec).
