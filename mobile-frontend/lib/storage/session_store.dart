import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/graph_models.dart';

/// Same storage key as the web client (`src/recruiter-ui/api/client.ts`).
const _authStorageKey = 'skillgraph.auth.user';
const _apiBaseUrlStorageKey = 'skillgraph.api.baseUrl';

class SessionStore {
  Future<GraphUser?> readUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_authStorageKey);
    if (raw == null || raw.isEmpty) return null;
    try {
      final map = jsonDecode(raw) as Map<String, dynamic>;
      final user = GraphUser.fromJson(map);
      if (user.id.isEmpty || user.email.isEmpty) return null;
      return user;
    } catch (_) {
      return null;
    }
  }

  Future<void> writeUser(GraphUser user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_authStorageKey, jsonEncode(user.toJson()));
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_authStorageKey);
  }

  Future<String?> readApiBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_apiBaseUrlStorageKey);
    if (raw == null || raw.trim().isEmpty) return null;
    return raw.trim();
  }

  Future<void> writeApiBaseUrl(String baseUrl) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_apiBaseUrlStorageKey, baseUrl.trim());
  }
}
