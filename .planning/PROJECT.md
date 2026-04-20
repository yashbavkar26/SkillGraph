# Project: SkillGraph

## Vision
SkillGraph replaces the static CV with a dynamic, verifiable graph of micro-skills — a living profile that grows with every project, peer endorsement, and completed challenge. The goal is to connect talent to opportunity through explainable fit, not keyword luck.

## Core Concepts
- **Micro-skills Graph**: A dynamic graph representing individual skills.
- **Talent Portal**: Where individuals build, evidence, and evolve their skill graph.
- **Recruiter Search Engine**: A search tool with transparent 'fit scores' that explain the 'why' behind the ranking.
- **Verification Layer**: Peer endorsements, automated assessments, or linked artefacts to add weight to nodes.

## Key Engineering Challenges
- **Graph Database Design**: Designing the structure for micro-skills and relationships.
- **Similarity-Search Algorithms**: Going beyond cosine distance to find better matches.
- **Reputation Engine**: Weighting endorsements by context, relationship, and recency.
- **Cold Start Problem**: Generating meaningful matches for users with no prior graph data.
- **Endorsement Collusion**: Preventing clusters of friends from inflating meaningful matches.

## Target Users
- **Talent**: Individuals seeking to showcase their true capabilities.
- **Recruiters**: Professionals seeking explainable and verifiable talent matches.
