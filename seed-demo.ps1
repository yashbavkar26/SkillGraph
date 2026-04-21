param(
  [string]$BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'

function Post-Json {
  param(
    [Parameter(Mandatory = $true)][string]$Uri,
    [Parameter(Mandatory = $true)][hashtable]$Body,
    [hashtable]$Headers
  )

  $json = $Body | ConvertTo-Json -Depth 8
  if ($Headers) {
    return Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -ContentType 'application/json' -Body $json
  }
  return Invoke-RestMethod -Method Post -Uri $Uri -ContentType 'application/json' -Body $json
}

try {
  $health = Invoke-RestMethod -Method Get -Uri "$BaseUrl/health"
  Write-Host "Health status: $($health.status)"

  $stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()

  $recruiter = Post-Json -Uri "$BaseUrl/api/users" -Body @{
    email = "recruiter+$stamp@example.com"
    name = "Recruiter $stamp"
  }

  $candidate = Post-Json -Uri "$BaseUrl/api/users" -Body @{
    email = "candidate+$stamp@example.com"
    name = "Candidate $stamp"
  }

  $endorser = Post-Json -Uri "$BaseUrl/api/users" -Body @{
    email = "peer+$stamp@example.com"
    name = "Peer $stamp"
  }

  $skill1 = Post-Json -Uri "$BaseUrl/api/skills" -Body @{
    name = "TypeScript-$stamp"
    category = 'backend'
  }

  $skill2 = Post-Json -Uri "$BaseUrl/api/skills" -Body @{
    name = "Neo4j-$stamp"
    category = 'database'
  }

  Post-Json -Uri "$BaseUrl/api/relationships" -Body @{
    userId = $candidate.id
    skillId = $skill1.id
    proficiency = 4
  } | Out-Null

  Post-Json -Uri "$BaseUrl/api/relationships" -Body @{
    userId = $candidate.id
    skillId = $skill2.id
    proficiency = 3
  } | Out-Null

  Post-Json -Uri "$BaseUrl/api/evidence" -Headers @{ 'x-user-id' = $candidate.id } -Body @{
    skillId = $skill1.id
    url = "https://github.com/example/skillgraph-$stamp"
    type = 'github'
    metadata = @{ title = "SkillGraph Demo $stamp" }
  } | Out-Null

  Post-Json -Uri "$BaseUrl/api/endorse" -Headers @{ 'x-user-id' = $endorser.id } -Body @{
    recipientId = $candidate.id
    skillId = $skill1.id
    comment = "Great work $stamp"
  } | Out-Null

  $result = Post-Json -Uri "$BaseUrl/api/recruiter/search" -Headers @{ 'x-user-id' = $recruiter.id } -Body @{
    query = 'Graph engineer'
    topK = 10
    includeExplanation = $true
    filters = @{
      requiredSkillIds = @($skill1.id, $skill2.id)
      minFitScore = 0.1
    }
  }

  Write-Host "Recruiter ID: $($recruiter.id)"
  Write-Host "Candidate ID: $($candidate.id)"
  Write-Host "Endorser ID: $($endorser.id)"
  Write-Host "Skill 1 ID: $($skill1.id)"
  Write-Host "Skill 2 ID: $($skill2.id)"
  Write-Host "Search total: $($result.total)"

  if ($result.total -gt 0 -and $result.candidates.Count -gt 0) {
    $top = $result.candidates[0]
    Write-Host "Top candidate: $($top.displayName) ($($top.candidateId)) fit=$($top.fitScore)"
  }
}
catch {
  Write-Host 'Request failed.'
  Write-Host $_.Exception.Message

  if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
    Write-Host 'API error body:'
    Write-Host $_.ErrorDetails.Message
  }

  exit 1
}
