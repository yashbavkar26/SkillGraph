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
    final response = await _client.get(_uri('/health'));
    if (response.statusCode != 200) throw _error(response);
    return HealthResponse.fromJson(await _decodeObject(response));
  }

  Future<LoginResponse> login({
    required String email,
    required String role,
  }) async {
    final response = await _client.post(
      _uri('/api/users/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'role': role}),
    );
    if (response.statusCode != 200) throw _error(response);
    return LoginResponse.fromJson(await _decodeObject(response));
  }

  Future<LoginResponse> register({
    required String name,
    required String email,
    required String role,
  }) async {
    final response = await _client.post(
      _uri('/api/users/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'role': role}),
    );
    if (response.statusCode != 200) throw _error(response);
    return LoginResponse.fromJson(await _decodeObject(response));
  }

  Future<GraphUser> createUser({
    required String name,
    required String email,
    String? role,
  }) async {
    final response = await _client.post(
      _uri('/api/users/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'role': role ?? 'candidate'}),
    );
    if (response.statusCode != 200) throw _error(response);
    final body = await _decodeObject(response);
    return GraphUser.fromJson(body['user'] as Map<String, dynamic>);
  }

  Future<List<GraphUser>> searchUsers({
    String? query,
    String? role,
    int? limit,
  }) async {
    final queryParams = <String, String>{};
    if (query != null) queryParams['query'] = query;
    if (role != null) queryParams['role'] = role;
    if (limit != null) queryParams['limit'] = limit.toString();

    final response = await _client.get(_uri('/api/users', queryParams));
    if (response.statusCode != 200) throw _error(response);
    final list = await _decodeList(response);
    return list.map((e) => GraphUser.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<GraphUser> fetchUser(String userId) async {
    final response = await _client.get(_uri('/api/users/${Uri.encodeComponent(userId)}'));
    if (response.statusCode != 200) throw _error(response);
    return GraphUser.fromJson(await _decodeObject(response));
  }

  /// Administrative user creation (POST /api/users)
  Future<GraphUser> createNewUser({
    required String name,
    required String email,
    String? role,
  }) async {
    final response = await _client.post(
      _uri('/api/users'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'role': role}),
    );
    if (response.statusCode != 201) throw _error(response);
    return GraphUser.fromJson(await _decodeObject(response));
  }

  Future<GraphSkill> createSkill({
    required String name,
    String? category,
  }) async {
    final response = await _client.post(
      _uri('/api/skills'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'category': category}),
    );
    if (response.statusCode != 200) throw _error(response);
    return GraphSkill.fromJson(await _decodeObject(response));
  }

  Future<List<GraphSkill>> fetchAllSkills() async {
    final response = await _client.get(_uri('/api/skills'));
    if (response.statusCode != 200) throw _error(response);
    final list = await _decodeList(response);
    return list.map((e) => GraphSkill.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<GraphSkill> fetchSkillById(String skillId) async {
    final response = await _client.get(_uri('/api/skills/${Uri.encodeComponent(skillId)}'));
    if (response.statusCode != 200) throw _error(response);
    return GraphSkill.fromJson(await _decodeObject(response));
  }

  Future<List<SkillHistoryEvent>> fetchSkillHistory(String skillId) async {
    final response = await _client.get(_uri('/api/skills/${Uri.encodeComponent(skillId)}/history'));
    if (response.statusCode != 200) throw _error(response);
    final list = await _decodeList(response);
    return list.map((e) => SkillHistoryEvent.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<List<UserSkillLink>> fetchUserSkillLinks(String userId) async {
    final response = await _client.get(_uri('/api/relationships/users/${Uri.encodeComponent(userId)}/skills'));
    if (response.statusCode != 200) throw _error(response);
    final list = await _decodeList(response);
    return list.map((e) => UserSkillLink.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> addUserSkill({
    required String userId,
    required String skillId,
    int proficiency = 3,
  }) async {
    final response = await _client.post(
      _uri('/api/relationships'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'userId': userId, 'skillId': skillId, 'proficiency': proficiency}),
    );
    if (response.statusCode != 200) throw _error(response);
  }

  Future<EvidenceRecord> createEvidence({
    required String actorUserId,
    required String skillId,
    required String url,
    required String type,
    Map<String, dynamic>? metadata,
  }) async {
    final response = await _client.post(
      _uri('/api/evidence'),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': actorUserId,
      },
      body: jsonEncode({
        'skillId': skillId,
        'url': url,
        'type': type,
        'metadata': metadata ?? {},
      }),
    );
    if (response.statusCode != 200) throw _error(response);
    return EvidenceRecord.fromJson(await _decodeObject(response));
  }

  Future<List<EvidenceRecord>> fetchEvidenceForUser(String userId) async {
    final response = await _client.get(_uri('/api/evidence/${Uri.encodeComponent(userId)}'));
    if (response.statusCode != 200) throw _error(response);
    final list = await _decodeList(response);
    return list.map((e) => EvidenceRecord.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<EndorsementRecord> createEndorsement({
    required String endorserId,
    required String recipientId,
    required String skillId,
    String? comment,
  }) async {
    final response = await _client.post(
      _uri('/api/endorse'),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': endorserId,
      },
      body: jsonEncode({
        'recipientId': recipientId,
        'skillId': skillId,
        'comment': comment,
      }),
    );
    if (response.statusCode != 200) throw _error(response);
    return EndorsementRecord.fromJson(await _decodeObject(response));
  }

  Future<List<EndorsementRecord>> fetchEndorsementsForUser(
    String userId,
  ) async {
    final response = await _client.get(_uri('/api/endorse/${Uri.encodeComponent(userId)}'));
    if (response.statusCode != 200) throw _error(response);
    final list = await _decodeList(response);
    return list.map((e) => EndorsementRecord.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AssessmentRecord> ingestAssessment({
    required String userId,
    required String skillId,
    required num score,
    required String timestamp,
    required String source,
  }) async {
    final response = await _client.post(
      _uri('/api/assessment/ingest'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'skillId': skillId,
        'score': score,
        'timestamp': timestamp,
        'source': source,
      }),
    );
    if (response.statusCode != 200) throw _error(response);
    return AssessmentRecord.fromJson(await _decodeObject(response));
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
    final response = await _client.post(
      _uri('/api/recruiter/search'),
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': recruiterId,
      },
      body: jsonEncode({
        'query': query,
        'topK': topK,
        'filters': {
          'industries': industries,
          'projectTypes': projectTypes,
          'requiredSkillIds': requiredSkillIds,
          'minFitScore': minFitScore,
        },
        'includeExplanation': includeExplanation,
      }),
    );
    if (response.statusCode != 200) throw _error(response);
    return RecruiterSearchResponse.fromJson(await _decodeObject(response));
  }

  void close() {
    _client.close();
  }
}
