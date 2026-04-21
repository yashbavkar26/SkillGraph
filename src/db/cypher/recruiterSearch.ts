export const RECRUITER_SEARCH = `
MATCH (recruiter:User {id: $recruiterId})
MATCH (candidate:User)
WHERE candidate.id <> recruiter.id
  AND (
    size($industriesLower) = 0 OR
    any(industry IN coalesce(candidate.industries, [])
      WHERE toLower(toString(industry)) IN $industriesLower)
  )
  AND (
    size($projectTypesLower) = 0 OR
    any(projectType IN coalesce(candidate.projectTypes, [])
      WHERE toLower(toString(projectType)) IN $projectTypesLower)
  )
OPTIONAL MATCH (candidate)-[hasSkill:HAS_SKILL]->(skill:Skill)
WITH recruiter, candidate,
  collect(DISTINCT toString(skill.id)) AS candidateSkillIds,
  coalesce(sum(toFloat(hasSkill.proficiency)), 0.0) AS proficiencySum
OPTIONAL MATCH (candidate)-[:HAS_EVIDENCE]->(e:Evidence)
WITH recruiter, candidate, candidateSkillIds, proficiencySum, count(DISTINCT e) AS evidenceCount
OPTIONAL MATCH (:User)-[:ENDORSED]->(endorsement:Endorsement)-[:TO_USER]->(candidate)
WITH recruiter, candidate, candidateSkillIds, proficiencySum, evidenceCount, count(DISTINCT endorsement) AS endorsementCount
WITH candidate, candidateSkillIds, proficiencySum, evidenceCount, endorsementCount,
  [skillId IN $requiredSkillIds WHERE skillId IN candidateSkillIds] AS matchedSkillIds
WITH candidate, matchedSkillIds, proficiencySum, evidenceCount, endorsementCount,
  toFloat(size(matchedSkillIds)) AS matchedSkillCount,
  CASE
    WHEN size($requiredSkillIds) = 0 THEN 0.0
    ELSE toFloat(size(matchedSkillIds)) / toFloat(size($requiredSkillIds))
  END AS skillCoverage
WHERE size($requiredSkillIds) = 0 OR size(matchedSkillIds) > 0
RETURN
  toString(candidate.id) AS candidateId,
  coalesce(toString(candidate.name), 'Unknown Candidate') AS displayName,
  [industry IN coalesce(candidate.industries, []) | toString(industry)] AS industries,
  [projectType IN coalesce(candidate.projectTypes, []) | toString(projectType)] AS projectTypes,
  matchedSkillIds,
  matchedSkillCount,
  evidenceCount,
  endorsementCount,
  proficiencySum,
  skillCoverage AS graphSimilarity
ORDER BY matchedSkillCount DESC, endorsementCount DESC, evidenceCount DESC, candidateId ASC
LIMIT $topK
`;

