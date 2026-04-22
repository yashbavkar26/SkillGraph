class AppConfig {
  AppConfig._();

  static const String _apiBaseUrlFromDefine = String.fromEnvironment(
    'API_BASE_URL',
  );

  /// Default backend URL for local Android emulators.
  ///
  /// For a physical phone, set this from the app settings using your machine LAN IP,
  /// for example `http://192.168.1.40:3000`.
  static final String initialApiBaseUrl = normalizeBaseUrl(
    _apiBaseUrlFromDefine.isEmpty
        ? 'http://localhost:3000'
        : _apiBaseUrlFromDefine,
  );

  static String fallbackApiBaseUrl() => 'http://localhost:3000';

  static String normalizeBaseUrl(String rawValue) {
    final trimmed = rawValue.trim();
    if (trimmed.isEmpty) {
      return fallbackApiBaseUrl();
    }
    return trimmed.replaceAll(RegExp(r'/$'), '');
  }
}
