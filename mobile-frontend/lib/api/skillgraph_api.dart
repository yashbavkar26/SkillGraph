import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/graph_models.dart';

class SkillGraphApiException implements Exception {
  SkillGraphApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => 'SkillGraphApiException($statusCode): $message';
}

class SkillGraphApi {
  SkillGraphApi({http.Client? httpClient, String? baseUrl})
    : _client = httpClient ?? http.Client(),
      _baseUrl = AppConfig.normalizeBaseUrl(
        baseUrl ?? AppConfig.initialApiBaseUrl,
      );

  final http.Client _client;
  String _baseUrl;

  String get apiBaseUrl => _baseUrl;

  void setBaseUrl(String nextBaseUrl) {
    _baseUrl = AppConfig.normalizeBaseUrl(nextBaseUrl);
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    final suffix = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$_baseUrl$suffix').replace(queryParameters: query);
  }

  String _readErrorBody(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map && decoded['error'] is String) {
        return decoded['error'] as String;
      }
    } catch (_) {
      // Ignore non-JSON error payloads.
    }
    return 'Request failed (${response.statusCode})';
  }

  SkillGraphApiException _error(http.Response response) {
    return SkillGraphApiException(
      _readErrorBody(response),
      statusCode: response.statusCode,
    );
  }

  Future<Map<String, dynamic>> _decodeObject(http.Response response) async {
    final decoded = jsonDecode(response.body);
    if (decoded is Map<String, dynamic>) return decoded;
    throw SkillGraphApiException('Unexpected response shape');
  }

  Future<List<dynamic>> _decodeList(http.Response response) async {
    final decoded = jsonDecode(response.body);
    if (decoded is List<dynamic>) return decoded;
    throw SkillGraphApiException('Unexpected response shape');
  }

  Future<HealthResponse> fetchHealth() async {
    return HealthResponse(
      status: 'ok (mock)',
      timestamp: DateTime.now().toIso8601String(),
    );
  }

  Future<LoginResponse> login({
    required String email,
    required String role,
  }) async {
    // Dummy login: Accept any credentials
    return LoginResponse(
      user: GraphUser(
        id: 'user-dummy-123',
        email: email,
        name: 'Demo User',
        role: role,
        createdAt: DateTime.now().toIso8601String(),
      ),
      isNewUser: false,
    );
  }

  Future<LoginResponse> register({
    required String name,
    required String email,
    required String role,
  }) async {
    // Dummy register: Accept any credentials
    return LoginResponse(
      user: GraphUser(
        id: 'user-dummy-123',
        email: email,
        name: name,
        role: role,
        createdAt: DateTime.now().toIso8601String(),
      ),
      isNewUser: true,
    );
  }

  Future<GraphUser> createUser({
    required String name,
    required String email,
    String? role,
  }) async {
    return GraphUser(
      id: 'user-${DateTime.now().millisecondsSinceEpoch}',
      email: email,
      name: name,
      role: role,
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  Future<List<GraphUser>> searchUsers({
    String? query,
    String? role,
    int? limit,
  }) async {
    return [
      GraphUser(
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice Smith',
        role: 'Developer',
        createdAt: DateTime.now().toIso8601String(),
      ),
      GraphUser(
        id: 'user-2',
        email: 'bob@example.com',
        name: 'Bob Johnson',
        role: 'Designer',
        createdAt: DateTime.now().toIso8601String(),
      ),
    ];
  }

  Future<GraphUser> fetchUser(String userId) async {
    return GraphUser(
      id: userId,
      email: 'demo@skillgraph.ai',
      name: 'Demo User',
      role: 'Full Stack Developer',
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  Future<GraphSkill> createSkill({
    required String name,
    String? category,
  }) async {
    return GraphSkill(
      id: 'skill-${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      category: category,
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  Future<List<GraphSkill>> fetchAllSkills() async {
    return [
      GraphSkill(id: 's1', name: 'Flutter', category: 'Mobile', createdAt: '2024-01-01'),
      GraphSkill(id: 's2', name: 'TypeScript', category: 'Web', createdAt: '2024-01-01'),
      GraphSkill(id: 's3', name: 'Neo4j', category: 'Database', createdAt: '2024-01-01'),
      GraphSkill(id: 's4', name: 'Node.js', category: 'Backend', createdAt: '2024-01-01'),
      GraphSkill(id: 's5', name: 'React', category: 'Frontend', createdAt: '2024-01-01'),
    ];
  }

  Future<GraphSkill> fetchSkillById(String skillId) async {
    return GraphSkill(
      id: skillId,
      name: 'Sample Skill',
      category: 'General',
      createdAt: '2024-01-01',
    );
  }

  Future<List<SkillHistoryEvent>> fetchSkillHistory(String skillId) async {
    return [
      SkillHistoryEvent(
        id: 'h1',
        type: 'ENDORSEMENT',
        detail: 'Endorsed by Bob',
        timestamp: DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
      ),
      SkillHistoryEvent(
        id: 'h2',
        type: 'EVIDENCE',
        detail: 'Added GitHub Project',
        timestamp: DateTime.now().subtract(const Duration(days: 5)).toIso8601String(),
      ),
    ];
  }

  Future<List<UserSkillLink>> fetchUserSkillLinks(String userId) async {
    return [
      UserSkillLink(userId: userId, skillId: 's1', proficiency: 5, createdAt: '2024-01-01'),
      UserSkillLink(userId: userId, skillId: 's2', proficiency: 4, createdAt: '2024-01-01'),
    ];
  }

  Future<void> addUserSkill({
    required String userId,
    required String skillId,
    int proficiency = 3,
  }) async {
    // Do nothing in dummy mode
  }

  Future<EvidenceRecord> createEvidence({
    required String actorUserId,
    required String skillId,
    required String url,
    required String type,
    Map<String, dynamic>? metadata,
  }) async {
    return EvidenceRecord(
      id: 'ev-${DateTime.now().millisecondsSinceEpoch}',
      userId: actorUserId,
      skillId: skillId,
      url: url,
      type: type,
      metadata: metadata ?? {},
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  Future<List<EvidenceRecord>> fetchEvidenceForUser(String userId) async {
    return [
      EvidenceRecord(
        id: 'ev1',
        userId: userId,
        skillId: 's1',
        url: 'https://github.com/demo/project',
        type: 'github_repo',
        metadata: {'stars': 10},
        createdAt: '2024-01-10',
      ),
    ];
  }

  Future<EndorsementRecord> createEndorsement({
    required String endorserId,
    required String recipientId,
    required String skillId,
    String? comment,
  }) async {
    return EndorsementRecord(
      id: 'en-${DateTime.now().millisecondsSinceEpoch}',
      endorserId: endorserId,
      recipientId: recipientId,
      skillId: skillId,
      timestamp: DateTime.now().toIso8601String(),
      comment: comment,
      weight: 1.0,
      riskFlags: [],
    );
  }

  Future<List<EndorsementRecord>> fetchEndorsementsForUser(
    String userId,
  ) async {
    return [
      EndorsementRecord(
        id: 'en1',
        endorserId: 'user-2',
        recipientId: userId,
        skillId: 's1',
        timestamp: '2024-01-15',
        comment: 'Great work on the mobile app!',
        weight: 1.2,
        riskFlags: [],
        skill: const EndorsementSkill(id: 's1', name: 'Flutter'),
      ),
    ];
  }

  Future<AssessmentRecord> ingestAssessment({
    required String userId,
    required String skillId,
    required num score,
    required String timestamp,
    required String source,
  }) async {
    return AssessmentRecord(
      id: 'as-${DateTime.now().millisecondsSinceEpoch}',
      userId: userId,
      skillId: skillId,
      score: score.toDouble(),
      timestamp: timestamp,
      source: source,
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  Future<RecruiterSearchResponse> recruiterSearch({
    required String recruiterId,
    String? query,
    int topK = 10,
    List<String>? industries,
    List<String>? projectTypes,
    List<String>? requiredSkillIds,
    double? minFitScore,
    bool includeExplanation = true,
  }) async {
    return RecruiterSearchResponse(
      scoreVersion: 'v1-mock',
      tookMs: 12,
      total: 1,
      candidates: [
        RecruiterCandidateResult(
          candidateId: 'user-dummy-123',
          displayName: 'Demo User',
          fitScore: 0.95,
          scoreVersion: 'v1-mock',
          explanationAtoms: [
            RecruiterExplanationAtom(
              type: 'SKILL',
              label: 'Flutter',
              value: 'Expert',
              contribution: 0.6,
            ),
          ],
          matchedSkillIds: ['s1', 's2'],
          industries: industries ?? ['Tech'],
          projectTypes: projectTypes ?? ['Mobile'],
        ),
      ],
    );
  }

  void close() {
    _client.close();
  }
}
