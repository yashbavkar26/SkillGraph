class GraphUser {
  const GraphUser({
    required this.id,
    required this.email,
    required this.name,
    this.role,
    required this.createdAt,
  });

  final String id;
  final String email;
  final String name;
  final String? role;
  final String createdAt;

  factory GraphUser.fromJson(Map<String, dynamic> json) {
    return GraphUser(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      role: json['role'] as String?,
      createdAt: json['createdAt'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'name': name,
    if (role != null) 'role': role,
    'createdAt': createdAt,
  };
}

String _readString(
  Map<String, dynamic> json,
  String key, {
  String fallback = '',
}) {
  final value = json[key];
  if (value == null) return fallback;
  return value.toString();
}

double _readDouble(
  Map<String, dynamic> json,
  String key, {
  double fallback = 0,
}) {
  final value = json[key];
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

class LoginResponse {
  const LoginResponse({required this.user, required this.isNewUser});

  final GraphUser user;
  final bool isNewUser;

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      user: GraphUser.fromJson(json['user'] as Map<String, dynamic>),
      isNewUser: json['isNewUser'] as bool? ?? false,
    );
  }
}

class GraphSkill {
  const GraphSkill({
    required this.id,
    required this.name,
    this.category,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String? category;
  final String createdAt;

  factory GraphSkill.fromJson(Map<String, dynamic> json) {
    return GraphSkill(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String?,
      createdAt: json['createdAt'] as String,
    );
  }
}

class UserSkillLink {
  const UserSkillLink({
    required this.userId,
    required this.skillId,
    this.proficiency,
    required this.createdAt,
  });

  final String userId;
  final String skillId;
  final int? proficiency;
  final String createdAt;

  factory UserSkillLink.fromJson(Map<String, dynamic> json) {
    return UserSkillLink(
      userId: json['userId'] as String,
      skillId: json['skillId'] as String,
      proficiency: (json['proficiency'] as num?)?.toInt(),
      createdAt: json['createdAt'] as String,
    );
  }
}

class HealthResponse {
  const HealthResponse({required this.status, required this.timestamp});

  final String status;
  final String timestamp;

  factory HealthResponse.fromJson(Map<String, dynamic> json) {
    return HealthResponse(
      status: _readString(json, 'status', fallback: 'unknown'),
      timestamp: _readString(json, 'timestamp'),
    );
  }
}

class SkillHistoryEvent {
  const SkillHistoryEvent({
    required this.id,
    required this.type,
    required this.detail,
    required this.timestamp,
  });

  final String id;
  final String type;
  final String detail;
  final String timestamp;

  factory SkillHistoryEvent.fromJson(Map<String, dynamic> json) {
    return SkillHistoryEvent(
      id: _readString(json, 'id'),
      type: _readString(json, 'type'),
      detail: _readString(json, 'detail'),
      timestamp: _readString(json, 'timestamp'),
    );
  }
}

class EvidenceRecord {
  const EvidenceRecord({
    required this.id,
    required this.userId,
    required this.skillId,
    required this.url,
    required this.type,
    required this.metadata,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final String skillId;
  final String url;
  final String type;
  final Map<String, dynamic> metadata;
  final String createdAt;

  factory EvidenceRecord.fromJson(Map<String, dynamic> json) {
    final rawMetadata = json['metadata'];
    return EvidenceRecord(
      id: _readString(json, 'id'),
      userId: _readString(json, 'userId'),
      skillId: _readString(json, 'skillId'),
      url: _readString(json, 'url'),
      type: _readString(json, 'type'),
      metadata: rawMetadata is Map<String, dynamic>
          ? rawMetadata
          : const <String, dynamic>{},
      createdAt: _readString(json, 'createdAt'),
    );
  }
}

class EndorsementSkill {
  const EndorsementSkill({required this.id, required this.name, this.category});

  final String id;
  final String name;
  final String? category;

  factory EndorsementSkill.fromJson(Map<String, dynamic> json) {
    return EndorsementSkill(
      id: _readString(json, 'id'),
      name: _readString(json, 'name'),
      category: json['category'] as String?,
    );
  }
}

class EndorsementRecord {
  const EndorsementRecord({
    required this.id,
    required this.endorserId,
    required this.recipientId,
    required this.skillId,
    required this.timestamp,
    this.comment,
    required this.weight,
    required this.riskFlags,
    this.skill,
  });

  final String id;
  final String endorserId;
  final String recipientId;
  final String skillId;
  final String timestamp;
  final String? comment;
  final double weight;
  final List<String> riskFlags;
  final EndorsementSkill? skill;

  factory EndorsementRecord.fromJson(Map<String, dynamic> json) {
    final rawRiskFlags = json['riskFlags'];
    final rawSkill = json['skill'];
    return EndorsementRecord(
      id: _readString(json, 'id'),
      endorserId: _readString(json, 'endorserId'),
      recipientId: _readString(json, 'recipientId'),
      skillId: _readString(json, 'skillId'),
      timestamp: _readString(json, 'timestamp'),
      comment: json['comment'] as String?,
      weight: _readDouble(json, 'weight', fallback: 1),
      riskFlags: rawRiskFlags is List
          ? rawRiskFlags.map((flag) => flag.toString()).toList()
          : const <String>[],
      skill: rawSkill is Map<String, dynamic>
          ? EndorsementSkill.fromJson(rawSkill)
          : null,
    );
  }
}

class AssessmentRecord {
  const AssessmentRecord({
    required this.id,
    required this.userId,
    required this.skillId,
    required this.score,
    required this.timestamp,
    required this.source,
    required this.createdAt,
  });

  final String id;
  final String userId;
  final String skillId;
  final double score;
  final String timestamp;
  final String source;
  final String createdAt;

  factory AssessmentRecord.fromJson(Map<String, dynamic> json) {
    return AssessmentRecord(
      id: _readString(json, 'id'),
      userId: _readString(json, 'userId'),
      skillId: _readString(json, 'skillId'),
      score: _readDouble(json, 'score'),
      timestamp: _readString(json, 'timestamp'),
      source: _readString(json, 'source'),
      createdAt: _readString(json, 'createdAt'),
    );
  }
}

class RecruiterExplanationAtom {
  const RecruiterExplanationAtom({
    required this.type,
    required this.label,
    required this.value,
    required this.contribution,
  });

  final String type;
  final String label;
  final String value;
  final double contribution;

  factory RecruiterExplanationAtom.fromJson(Map<String, dynamic> json) {
    return RecruiterExplanationAtom(
      type: _readString(json, 'type'),
      label: _readString(json, 'label'),
      value: _readString(json, 'value'),
      contribution: _readDouble(json, 'contribution'),
    );
  }
}

class RecruiterCandidateResult {
  const RecruiterCandidateResult({
    required this.candidateId,
    required this.displayName,
    required this.fitScore,
    required this.scoreVersion,
    required this.explanationAtoms,
    required this.matchedSkillIds,
    required this.industries,
    required this.projectTypes,
  });

  final String candidateId;
  final String displayName;
  final double fitScore;
  final String scoreVersion;
  final List<RecruiterExplanationAtom> explanationAtoms;
  final List<String> matchedSkillIds;
  final List<String> industries;
  final List<String> projectTypes;

  factory RecruiterCandidateResult.fromJson(Map<String, dynamic> json) {
    final rawAtoms = json['explanationAtoms'];
    final rawMatchedSkillIds = json['matchedSkillIds'];
    final rawIndustries = json['industries'];
    final rawProjectTypes = json['projectTypes'];

    return RecruiterCandidateResult(
      candidateId: _readString(json, 'candidateId'),
      displayName: _readString(json, 'displayName'),
      fitScore: _readDouble(json, 'fitScore'),
      scoreVersion: _readString(json, 'scoreVersion'),
      explanationAtoms: rawAtoms is List
          ? rawAtoms
                .whereType<Map<String, dynamic>>()
                .map(RecruiterExplanationAtom.fromJson)
                .toList()
          : const <RecruiterExplanationAtom>[],
      matchedSkillIds: rawMatchedSkillIds is List
          ? rawMatchedSkillIds.map((id) => id.toString()).toList()
          : const <String>[],
      industries: rawIndustries is List
          ? rawIndustries.map((i) => i.toString()).toList()
          : const <String>[],
      projectTypes: rawProjectTypes is List
          ? rawProjectTypes.map((p) => p.toString()).toList()
          : const <String>[],
    );
  }
}

class RecruiterSearchResponse {
  const RecruiterSearchResponse({
    required this.scoreVersion,
    required this.tookMs,
    required this.total,
    required this.candidates,
  });

  final String scoreVersion;
  final int tookMs;
  final int total;
  final List<RecruiterCandidateResult> candidates;

  factory RecruiterSearchResponse.fromJson(Map<String, dynamic> json) {
    final rawCandidates = json['candidates'];
    return RecruiterSearchResponse(
      scoreVersion: _readString(json, 'scoreVersion'),
      tookMs: (json['tookMs'] as num?)?.toInt() ?? 0,
      total: (json['total'] as num?)?.toInt() ?? 0,
      candidates: rawCandidates is List
          ? rawCandidates
                .whereType<Map<String, dynamic>>()
                .map(RecruiterCandidateResult.fromJson)
                .toList()
          : const <RecruiterCandidateResult>[],
    );
  }
}
