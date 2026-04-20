# Domain Research: SkillGraph

## 1. Graph Database Design for Micro-skills
To represent micro-skills and their relationships (e.g., "is a sub-skill of", "is demonstrated by", "is used with"), a graph database is essential.

### Recommended Technologies:
- **Neo4j**: Industry standard, strong Cypher query language, excellent community support.
- **ArangoDB**: Multi-model (document + graph), good for flexible skill schemas.
- **AWS Neptune**: Managed service, highly scalable for cloud-native applications.

### Schema Considerations:
- **Nodes**: `User`, `Skill`, `Project`, `Endorsement`, `Evidence`.
- **Edges**: 
    - `(User)-[:HAS_SKILL {level, evidence_link}]->(Skill)`
    - `(Skill)-[:SUB_SKILL_OF]->(Skill)`
    - `(User)-[:ENDORSED {context, timestamp}]->(Skill)`
    - `(Project)-[:DEMONSTRATES]->(Skill)`

## 2. Similarity-Search & Matching Beyond Cosine Distance
Traditional vector similarity (cosine) often fails to capture the structural context of a graph.

### Advanced Approaches:
- **Node Embeddings (Node2Vec, DeepWalk)**: Capture structural roles of nodes in the graph. A user with a similar "topology" of skills is a good match.
- **Graph Neural Networks (GNNs)**: Use message passing to learn embeddings that incorporate neighbor information (e.g., if your peers have Skill X, you are likely proficient in Skill X).
- **Personalized PageRank (PPR)**: Measure the "influence" or "closeness" of a skill to a user within their local subgraph.
- **Jaccard Similarity**: Useful for comparing sets of skills/projects directly.

## 3. Reputation & Sybil Resistance (Endorsement Collusion)
To prevent "friend clusters" from inflating skills, we need structural solutions.

### Mitigation Strategies:
- **EigenTrust Algorithm**: A reputation system where trust is propagated through the graph. A node's reputation depends on the reputation of the nodes that endorse it.
- **Contextual Weighting**: Endorsements from users with high "reputation" in a specific skill domain carry more weight.
- **Relationship-Awareness**: Weight endorsements higher if the endorser and the endorsed have a history of verified interaction (e.g., worked on the same project).
- **Anomaly Detection**: Identifying clusters of highly interconnected nodes that only endorse each other (detecting Sybil attacks).
