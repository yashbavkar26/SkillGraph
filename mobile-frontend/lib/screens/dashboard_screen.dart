import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api/skillgraph_api.dart';
import '../models/graph_models.dart';
import '../storage/session_store.dart';
import '../theme/skillgraph_theme.dart';
import '../widgets/skillgraph_background.dart';
import 'api_workbench_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({
    super.key,
    required this.api,
    required this.sessionStore,
    required this.user,
    required this.apiBaseUrl,
    required this.onApiBaseUrlChanged,
    required this.onSignedOut,
  });

  final SkillGraphApi api;
  final SessionStore sessionStore;
  final GraphUser user;
  final String apiBaseUrl;
  final Future<void> Function(String) onApiBaseUrlChanged;
  final VoidCallback onSignedOut;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  HealthResponse? _health;
  GraphUser? _profile;
  List<GraphSkill> _allSkills = const [];
  List<UserSkillLink> _links = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        widget.api.fetchHealth(),
        widget.api.fetchUser(widget.user.id),
        widget.api.fetchAllSkills(),
        widget.api.fetchUserSkillLinks(widget.user.id),
      ]);
      if (!mounted) return;
      setState(() {
        _health = results[0] as HealthResponse;
        _profile = results[1] as GraphUser;
        _allSkills = results[2] as List<GraphSkill>;
        _links = results[3] as List<UserSkillLink>;
        _loading = false;
      });
    } on SkillGraphApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _logout() async {
    await widget.sessionStore.clear();
    if (!mounted) return;
    widget.onSignedOut();
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
    await _load();
  }

  Future<void> _openApiWorkbench() async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) =>
            ApiWorkbenchScreen(api: widget.api, currentUser: widget.user),
      ),
    );
  }

  Map<String, GraphSkill> get _skillById => {
    for (final s in _allSkills) s.id: s,
  };

  Future<void> _openAddSkill() async {
    final linkIds = _links.map((l) => l.skillId).toSet();
    final candidates = _allSkills.where((s) => !linkIds.contains(s.id)).toList()
      ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));

    if (candidates.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No new skills available to add right now.'),
        ),
      );
      return;
    }

    GraphSkill? picked = candidates.first;
    var proficiency = 3;

    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: SkillGraphColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            left: 18,
            right: 18,
            top: 16,
            bottom: 16 + MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: StatefulBuilder(
            builder: (context, setModal) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Add a skill', style: skillgraphDisplayText(22)),
                  const SizedBox(height: 8),
                  Text(
                    'POST /api/relationships - same payload as the website.',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: SkillGraphColors.muted,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButton<GraphSkill>(
                    isExpanded: true,
                    value: picked,
                    items: candidates
                        .map(
                          (s) => DropdownMenuItem(
                            value: s,
                            child: Text(
                              s.name,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => setModal(() => picked = v),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Proficiency ($proficiency)',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  Slider(
                    value: proficiency.toDouble(),
                    min: 1,
                    max: 4,
                    divisions: 3,
                    label: '$proficiency',
                    onChanged: (v) => setModal(() => proficiency = v.round()),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Cancel'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Add'),
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        );
      },
    );

    final chosen = picked;
    if (added != true || chosen == null) return;

    try {
      await widget.api.addUserSkill(
        userId: widget.user.id,
        skillId: chosen.id,
        proficiency: proficiency,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Linked "${chosen.name}"')));
      await _load();
    } on SkillGraphApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile ?? widget.user;

    return SkillGraphBackground(
      child: SafeArea(
        child: RefreshIndicator(
          onRefresh: _load,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverAppBar(
                pinned: true,
                title: Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: const BoxDecoration(
                        color: SkillGraphColors.accent,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: SkillGraphColors.accent,
                            blurRadius: 18,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      'Skill',
                      style: GoogleFonts.chakraPetch(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    ShaderMask(
                      blendMode: BlendMode.srcIn,
                      shaderCallback: (bounds) =>
                          const LinearGradient(
                            colors: [
                              SkillGraphColors.accent,
                              SkillGraphColors.accentStrong,
                            ],
                            begin: Alignment.centerLeft,
                            end: Alignment.centerRight,
                          ).createShader(
                            Rect.fromLTWH(0, 0, bounds.width, bounds.height),
                          ),
                      child: Text(
                        'Graph',
                        style: GoogleFonts.chakraPetch(
                          fontSize: 22,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
                actions: [
                  IconButton(
                    onPressed: _openApiUrlEditor,
                    icon: const Icon(Icons.settings_ethernet),
                    tooltip: 'API URL',
                  ),
                  IconButton(
                    onPressed: _openApiWorkbench,
                    icon: const Icon(Icons.api),
                    tooltip: 'API Workbench',
                  ),
                  TextButton(onPressed: _logout, child: const Text('Logout')),
                ],
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Text(
                      'API: ${widget.apiBaseUrl}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: SkillGraphColors.accent,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (_loading)
                      const Padding(
                        padding: EdgeInsets.only(top: 48),
                        child: Center(child: CircularProgressIndicator()),
                      )
                    else if (_error != null)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(
                            _error!,
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(color: SkillGraphColors.danger),
                          ),
                        ),
                      )
                    else ...[
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'API',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      letterSpacing: 2.2,
                                      color: SkillGraphColors.accent,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Backend health',
                                style: skillgraphDisplayText(22),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _health == null
                                    ? '-'
                                    : '${_health!.status} | ${_health!.timestamp}',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: SkillGraphColors.muted),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'PROFILE',
                                style: Theme.of(context).textTheme.labelSmall
                                    ?.copyWith(
                                      letterSpacing: 2.2,
                                      color: SkillGraphColors.accent,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                profile.name,
                                style: skillgraphDisplayText(24),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                profile.email,
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: SkillGraphColors.muted),
                              ),
                              const SizedBox(height: 8),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Chip(
                                  label: Text(
                                    (profile.role ?? 'candidate').toUpperCase(),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      'Your skills',
                                      style: skillgraphDisplayText(22),
                                    ),
                                  ),
                                  FilledButton.tonal(
                                    onPressed: _openAddSkill,
                                    child: const Text('Add'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              if (_links.isEmpty)
                                Text(
                                  'No skills linked yet. Add one to mirror the candidate portal flow.',
                                  style: Theme.of(context).textTheme.bodyMedium
                                      ?.copyWith(color: SkillGraphColors.muted),
                                )
                              else
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: _links.map((link) {
                                    final skill = _skillById[link.skillId];
                                    final label = skill?.name ?? link.skillId;
                                    final p = link.proficiency;
                                    return Chip(
                                      label: Text(
                                        p == null ? label : '$label | L$p',
                                      ),
                                    );
                                  }).toList(),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
