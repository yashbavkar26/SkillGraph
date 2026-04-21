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
  END AS skillCoverage,
  CASE
    WHEN size($industriesLower) = 0 THEN 0.0
    ELSE toFloat(size([
      industry IN $industriesLower
      WHERE any(candidateIndustry IN coalesce(candidate.industries, [])
        WHERE toLower(toString(candidateIndustry)) = industry)
    ])) / toFloat(size($industriesLower))
  END AS industryCoverage,
  CASE
    WHEN size($projectTypesLower) = 0 THEN 0.0
    ELSE toFloat(size([
      projectType IN $projectTypesLower
      WHERE any(candidateProjectType IN coalesce(candidate.projectTypes, [])
        WHERE toLower(toString(candidateProjectType)) = projectType)
    ])) / toFloat(size($projectTypesLower))
  END AS projectCoverage
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
  CASE
    WHEN size($industriesLower) = 0 AND size($projectTypesLower) = 0 THEN skillCoverage
    WHEN size($industriesLower) = 0 THEN projectCoverage
    WHEN size($projectTypesLower) = 0 THEN industryCoverage
    ELSE (industryCoverage + projectCoverage) / 2.0
  END AS graphSimilarity
ORDER BY matchedSkillCount DESC, endorsementCount DESC, evidenceCount DESC, candidateId ASC
LIMIT $topK
`;
