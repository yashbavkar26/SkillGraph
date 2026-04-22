import 'package:flutter/material.dart';

import 'api/skillgraph_api.dart';
import 'config/app_config.dart';
import 'models/graph_models.dart';
import 'screens/auth_screen.dart';
import 'screens/dashboard_screen.dart';
import 'storage/session_store.dart';
import 'theme/skillgraph_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SkillGraphMobileApp());
}

class SkillGraphMobileApp extends StatefulWidget {
  const SkillGraphMobileApp({super.key});

  @override
  State<SkillGraphMobileApp> createState() => _SkillGraphMobileAppState();
}

class _SkillGraphMobileAppState extends State<SkillGraphMobileApp> {
  final SkillGraphApi _api = SkillGraphApi();
  final SessionStore _sessionStore = SessionStore();

  GraphUser? _user;
  String _apiBaseUrl = AppConfig.initialApiBaseUrl;
  bool _bootstrapping = true;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final results = await Future.wait([
      _sessionStore.readUser(),
      _sessionStore.readApiBaseUrl(),
    ]);
    final existing = results[0] as GraphUser?;
    final storedApiBaseUrl = results[1] as String?;
    final normalizedBaseUrl = AppConfig.normalizeBaseUrl(
      storedApiBaseUrl ?? AppConfig.initialApiBaseUrl,
    );
    _api.setBaseUrl(normalizedBaseUrl);
    if (!mounted) return;
    setState(() {
      _user = existing;
      _apiBaseUrl = normalizedBaseUrl;
      _bootstrapping = false;
    });
  }

  Future<void> _updateApiBaseUrl(String nextBaseUrl) async {
    final normalized = AppConfig.normalizeBaseUrl(nextBaseUrl);
    _api.setBaseUrl(normalized);
    await _sessionStore.writeApiBaseUrl(normalized);
    if (!mounted) return;
    setState(() {
      _apiBaseUrl = normalized;
    });
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SkillGraph',
      debugShowCheckedModeBanner: false,
      theme: buildSkillGraphDarkTheme(),
      home: Builder(
        builder: (context) {
          if (_bootstrapping) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          final user = _user;
          if (user == null) {
            return AuthScreen(
              api: _api,
              sessionStore: _sessionStore,
              apiBaseUrl: _apiBaseUrl,
              onApiBaseUrlChanged: _updateApiBaseUrl,
              onSignedIn: (u) => setState(() => _user = u),
            );
          }

          return DashboardScreen(
            api: _api,
            sessionStore: _sessionStore,
            user: user,
            apiBaseUrl: _apiBaseUrl,
            onApiBaseUrlChanged: _updateApiBaseUrl,
            onSignedOut: () => setState(() => _user = null),
          );
        },
      ),
    );
  }
}
