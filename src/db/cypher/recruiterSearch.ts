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
OPTIONAL MATCH (:User)-[:ENDORSED]->(endorsement:Endorsement)-[:FOR_SKILL]->(endorsedSkill:Skill)
WHERE EXISTS { MATCH (endorsement)-[:TO_USER]->(candidate) }
WITH recruiter, candidate, candidateSkillIds, proficiencySum, evidenceCount,
  count(DISTINCT endorsement) AS endorsementCount,
  coalesce(sum(
    CASE
      WHEN endorsement.riskFlagsJson CONTAINS 'reciprocal-same-skill' THEN coalesce(toFloat(endorsement.weight), 1.0) * 0.35
      ELSE coalesce(toFloat(endorsement.weight), 1.0)
    END
  ), 0.0) AS weightedEndorsementScore,
  count(DISTINCT toString(endorsement.endorserId)) AS uniqueEndorserCount,
  collect(DISTINCT toString(endorsedSkill.id)) AS endorsedSkillIds
WITH candidate, candidateSkillIds, endorsedSkillIds, proficiencySum, evidenceCount, endorsementCount, weightedEndorsementScore, uniqueEndorserCount,
  [skillId IN $requiredSkillIds WHERE skillId IN candidateSkillIds] AS matchedDirectSkillIds,
  [skillId IN $requiredSkillIds WHERE skillId IN endorsedSkillIds] AS matchedEndorsedSkillIds
WITH candidate, candidateSkillIds, matchedDirectSkillIds, matchedEndorsedSkillIds, proficiencySum, evidenceCount, endorsementCount, weightedEndorsementScore, uniqueEndorserCount,
  matchedDirectSkillIds + [skillId IN matchedEndorsedSkillIds WHERE NOT skillId IN matchedDirectSkillIds] AS matchedSignalSkillIds
WITH candidate, candidateSkillIds, matchedSignalSkillIds, matchedEndorsedSkillIds, proficiencySum, evidenceCount, endorsementCount, weightedEndorsementScore, uniqueEndorserCount,
  toFloat(size(matchedSignalSkillIds)) AS matchedSkillCount,
  toFloat(size(matchedEndorsedSkillIds)) AS matchedEndorsedSkillCount,
  toFloat(size(candidateSkillIds)) AS candidateSkillCount,
  CASE
    WHEN size($requiredSkillIds) = 0 THEN 0.0
    ELSE toFloat(size(matchedSignalSkillIds)) / toFloat(size($requiredSkillIds))
  END AS skillCoverage,
  CASE
    WHEN size($requiredSkillIds) = 0 THEN 0.0
    ELSE toFloat(size(matchedEndorsedSkillIds)) / toFloat(size($requiredSkillIds))
  END AS endorsementCoverage,
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
  matchedSignalSkillIds AS matchedSkillIds,
  matchedSkillCount,
  matchedEndorsedSkillCount,
  candidateSkillCount,
  evidenceCount,
  endorsementCount,
  weightedEndorsementScore,
  uniqueEndorserCount,
  proficiencySum,
  CASE
    WHEN size($industriesLower) = 0 AND size($projectTypesLower) = 0 THEN
      CASE
        WHEN size($requiredSkillIds) = 0 THEN CASE WHEN candidateSkillCount = 0 AND endorsementCount > 0 THEN 0.65 ELSE 0.0 END
        ELSE CASE WHEN skillCoverage >= endorsementCoverage THEN skillCoverage ELSE endorsementCoverage END
      END
    WHEN size($industriesLower) = 0 THEN projectCoverage
    WHEN size($projectTypesLower) = 0 THEN industryCoverage
    ELSE (industryCoverage + projectCoverage) / 2.0
  END AS graphSimilarity
ORDER BY
  (
    matchedSkillCount +
    (matchedEndorsedSkillCount * 0.42) +
    (weightedEndorsementScore * 0.18) +
    (toFloat(uniqueEndorserCount) * 0.08) +
    (CASE WHEN candidateSkillCount = 0 AND weightedEndorsementScore > 0 THEN 0.85 ELSE 0.0 END)
  ) DESC,
  endorsementCount DESC,
  evidenceCount DESC,
  candidateId ASC
LIMIT toInteger($candidatePoolSize)
`;
