import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:skillgraph_mobile/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('renders auth screen after bootstrap', (tester) async {
    await tester.pumpWidget(const SkillGraphMobileApp());
    await tester.pumpAndSettle();

    expect(find.textContaining('SKILLGRAPH ACCESS'), findsOneWidget);
    expect(find.textContaining('Login'), findsWidgets);
  });
}
