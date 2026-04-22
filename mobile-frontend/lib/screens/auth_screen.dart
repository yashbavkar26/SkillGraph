import 'package:flutter/material.dart';

import '../api/skillgraph_api.dart';
import '../models/graph_models.dart';
import '../storage/session_store.dart';
import '../theme/skillgraph_theme.dart';
import '../widgets/gradient_primary_button.dart';
import '../widgets/skillgraph_background.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({
    super.key,
    required this.api,
    required this.sessionStore,
    required this.apiBaseUrl,
    required this.onApiBaseUrlChanged,
    required this.onSignedIn,
  });

  final SkillGraphApi api;
  final SessionStore sessionStore;
  final String apiBaseUrl;
  final Future<void> Function(String) onApiBaseUrlChanged;
  final ValueChanged<GraphUser> onSignedIn;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();

  bool _register = false;
  String _role = 'candidate';
  bool _loading = false;
  String? _error;
  String? _apiUrlInfo;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
    });
    if (!_formKey.currentState!.validate()) return;

    setState(() => _loading = true);
    try {
      final email = _emailController.text.trim().toLowerCase();
      final LoginResponse result;
      if (_register) {
        result = await widget.api.register(
          name: _nameController.text.trim(),
          email: email,
          role: _role,
        );
      } else {
        result = await widget.api.login(email: email, role: _role);
      }
      await widget.sessionStore.writeUser(result.user);
      if (!mounted) return;
      widget.onSignedIn(result.user);
    } on SkillGraphApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openApiUrlEditor() async {
    final controller = TextEditingController(text: widget.apiBaseUrl);
    final result = await showDialog<String>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('API base URL'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.url,
            decoration: const InputDecoration(
              labelText: 'Base URL',
              hintText: 'http://192.168.1.40:3000',
            ),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, controller.text),
              child: const Text('Save'),
            ),
          ],
        );
      },
    );

    if (result == null) return;
    await widget.onApiBaseUrlChanged(result);
    if (!mounted) return;
    setState(() {
      _apiUrlInfo = 'API URL updated to ${widget.api.apiBaseUrl}';
    });
  }

  @override
  Widget build(BuildContext context) {
    return SkillGraphBackground(
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 520),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SKILLGRAPH ACCESS',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(
                                letterSpacing: 2.4,
                                color: SkillGraphColors.accent,
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${_role == 'recruiter' ? 'Recruiter' : 'Candidate'} '
                          '${_register ? 'Register' : 'Login'}',
                          style: skillgraphDisplayText(28),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Uses the same SkillGraph API as the website.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: SkillGraphColors.muted),
                        ),
                        const SizedBox(height: 4),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          children: [
                            Text(
                              widget.apiBaseUrl,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: SkillGraphColors.accent),
                            ),
                            TextButton(
                              onPressed: _openApiUrlEditor,
                              child: const Text('Change API URL'),
                            ),
                          ],
                        ),
                        if (_apiUrlInfo != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            _apiUrlInfo!,
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: SkillGraphColors.muted),
                          ),
                        ],
                        const SizedBox(height: 18),
                        Text(
                          'Role',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text('Candidate'),
                              selected: _role == 'candidate',
                              onSelected: (_) =>
                                  setState(() => _role = 'candidate'),
                            ),
                            ChoiceChip(
                              label: const Text('Recruiter'),
                              selected: _role == 'recruiter',
                              onSelected: (_) =>
                                  setState(() => _role = 'recruiter'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Action',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text('Login'),
                              selected: !_register,
                              onSelected: (_) =>
                                  setState(() => _register = false),
                            ),
                            ChoiceChip(
                              label: const Text('Register'),
                              selected: _register,
                              onSelected: (_) =>
                                  setState(() => _register = true),
                            ),
                          ],
                        ),
                        if (_register) ...[
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _nameController,
                            decoration: const InputDecoration(
                              labelText: 'Full name',
                            ),
                            textInputAction: TextInputAction.next,
                            validator: (v) {
                              if (!_register) {
                                return null;
                              }
                              if (v == null || v.trim().isEmpty) {
                                return 'Name is required';
                              }
                              return null;
                            },
                          ),
                        ],
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(labelText: 'Email'),
                          keyboardType: TextInputType.emailAddress,
                          autocorrect: false,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _submit(),
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Input is required';
                            }
                            return null;
                          },
                        ),
                        if (_error != null) ...[
                          const SizedBox(height: 14),
                          Text(
                            _error!,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: SkillGraphColors.danger),
                          ),
                        ],
                        const SizedBox(height: 18),
                        GradientPrimaryButton(
                          label: _register ? 'Create account' : 'Continue',
                          loading: _loading,
                          onPressed: _submit,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
