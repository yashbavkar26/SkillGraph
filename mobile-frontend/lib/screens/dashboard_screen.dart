import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../api/skillgraph_api.dart';
import '../models/graph_models.dart';
import '../storage/session_store.dart';
import '../theme/skillgraph_theme.dart';
import '../widgets/skillgraph_background.dart';
import '../widgets/recruiter_graph_view.dart';
import '../widgets/user_skill_graph_view.dart';
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
  List<EvidenceRecord> _myEvidence = const [];
  List<EndorsementRecord> _myEndorsements = const [];

  // Recruiter specific state
  final _searchController = TextEditingController();
  final _industryController = TextEditingController();
  final _projectTypeController = TextEditingController();
  List<RecruiterCandidateResult> _searchResults = [];
  RecruiterCandidateResult? _selectedCandidate;
  List<EvidenceRecord> _selectedCandidateEvidence = [];
  List<EndorsementRecord> _selectedCandidateEndorsements = [];
  List<String> _requiredSkillIds = [];
  bool _searching = false;
  bool _loadingSignals = false;
  String? _lastSearchQuery;

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
        widget.api.fetchEvidenceForUser(widget.user.id),
        widget.api.fetchEndorsementsForUser(widget.user.id),
      ]);
      if (!mounted) return;
      setState(() {
        _health = results[0] as HealthResponse;
        _profile = results[1] as GraphUser;
        _allSkills = results[2] as List<GraphSkill>;
        _links = results[3] as List<UserSkillLink>;
        _myEvidence = results[4] as List<EvidenceRecord>;
        _myEndorsements = results[5] as List<EndorsementRecord>;
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

  Future<void> _performRecruiterSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _searching = true;
      _error = null;
      _selectedCandidate = null;
    });

    try {
      final industries = _industryController.text.trim().isEmpty ? null : [_industryController.text.trim()];
      final projectTypes = _projectTypeController.text.trim().isEmpty ? null : [_projectTypeController.text.trim()];

      final response = await widget.api.recruiterSearch(
        recruiterId: widget.user.id,
        query: query,
        topK: 12,
        industries: industries,
        projectTypes: projectTypes,
        requiredSkillIds: _requiredSkillIds.isEmpty ? null : _requiredSkillIds,
      );
      if (!mounted) return;
      setState(() {
        _searchResults = response.candidates;
        _searching = false;
        _lastSearchQuery = query;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _searching = false;
      });
    }
  }

  Future<void> _selectCandidate(RecruiterCandidateResult candidate) async {
    setState(() {
      _selectedCandidate = candidate;
      _loadingSignals = true;
    });

    try {
      final results = await Future.wait([
        widget.api.fetchEvidenceForUser(candidate.candidateId),
        widget.api.fetchEndorsementsForUser(candidate.candidateId),
      ]);
      if (!mounted) return;
      setState(() {
        _selectedCandidateEvidence = results[0] as List<EvidenceRecord>;
        _selectedCandidateEndorsements = results[1] as List<EndorsementRecord>;
        _loadingSignals = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loadingSignals = false;
      });
    }
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

  Future<void> _openAddEvidence() async {
    if (_links.isEmpty) return;

    String? selectedSkillId = _links.first.skillId;
    final urlController = TextEditingController();
    final descController = TextEditingController();

    final added = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModal) => Padding(
          padding: EdgeInsets.only(
            left: 18,
            right: 18,
            top: 20,
            bottom: 20 + MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Attach Evidence', style: skillgraphDisplayText(22)),
              const SizedBox(height: 16),
              DropdownButton<String>(
                isExpanded: true,
                value: selectedSkillId,
                items: _links.map((l) {
                  final s = _skillById[l.skillId];
                  return DropdownMenuItem(value: l.skillId, child: Text(s?.name ?? l.skillId));
                }).toList(),
                onChanged: (v) => setModal(() => selectedSkillId = v),
              ),
              TextField(
                controller: urlController,
                decoration: const InputDecoration(labelText: 'URL (GitHub, Portfolio...)'),
              ),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'Description'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Attach'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (added != true || selectedSkillId == null) return;

    try {
      await widget.api.createEvidence(
        actorUserId: widget.user.id,
        skillId: selectedSkillId!,
        url: urlController.text,
        type: 'other',
        metadata: {'description': descController.text},
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _openSendEndorsement() async {
    final emailController = TextEditingController();
    final commentController = TextEditingController();
    String? selectedSkillId = _allSkills.isNotEmpty ? _allSkills.first.id : null;
    GraphUser? recipient;

    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => StatefulBuilder(
        builder: (context, setModal) => Padding(
          padding: EdgeInsets.only(
            left: 18,
            right: 18,
            top: 20,
            bottom: 20 + MediaQuery.viewInsetsOf(context).bottom,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Send Endorsement', style: skillgraphDisplayText(22)),
              const SizedBox(height: 16),
              TextField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Recipient Email'),
                onChanged: (v) async {
                  if (v.length > 3) {
                    try {
                      final users = await widget.api.searchUsers(query: v, limit: 1);
                      if (users.isNotEmpty) setModal(() => recipient = users.first);
                    } catch (_) {}
                  }
                },
              ),
              if (recipient != null)
                ListTile(
                  title: Text(recipient!.name),
                  subtitle: Text(recipient!.email),
                  leading: const Icon(Icons.person_pin),
                ),
              if (_allSkills.isNotEmpty)
                DropdownButton<String>(
                  isExpanded: true,
                  value: selectedSkillId,
                  items: _allSkills.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
                  onChanged: (v) => setModal(() => selectedSkillId = v),
                ),
              TextField(
                controller: commentController,
                decoration: const InputDecoration(labelText: 'Comment'),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Endorse'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (sent != true || recipient == null || selectedSkillId == null) return;

    try {
      await widget.api.createEndorsement(
        endorserId: widget.user.id,
        recipientId: recipient!.id,
        skillId: selectedSkillId!,
        comment: commentController.text,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Endorsement sent!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
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
                      if (profile.role == 'recruiter')
                        _buildRecruiterDashboard()
                      else
                        _buildCandidateDashboard(profile),
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

  Widget _buildRecruiterDashboard() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'GRAPH SEARCH',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 2.2,
                        color: SkillGraphColors.accent,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Find Expertise',
                  style: skillgraphDisplayText(22),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  onSubmitted: (_) => _performRecruiterSearch(),
                  decoration: InputDecoration(
                    hintText: 'e.g. TypeScript, Flutter, Neo4j...',
                    suffixIcon: IconButton(
                      onPressed: _performRecruiterSearch,
                      icon: const Icon(Icons.search),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _industryController,
                        style: const TextStyle(fontSize: 12),
                        decoration: const InputDecoration(
                          hintText: 'Industry (Finance, etc.)',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _projectTypeController,
                        style: const TextStyle(fontSize: 12),
                        decoration: const InputDecoration(
                          hintText: 'Project Type (Mobile, etc.)',
                          contentPadding: EdgeInsets.symmetric(horizontal: 12),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'REQUIRED SKILLS',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        letterSpacing: 2.2,
                        color: SkillGraphColors.accent,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: _allSkills.take(12).map((s) {
                    final isSelected = _requiredSkillIds.contains(s.id);
                    return FilterChip(
                      label: Text(s.name, style: const TextStyle(fontSize: 11)),
                      selected: isSelected,
                      onSelected: (val) {
                        setState(() {
                          if (val) {
                            _requiredSkillIds.add(s.id);
                          } else {
                            _requiredSkillIds.remove(s.id);
                          }
                        });
                      },
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ),
        if (_searching)
          const Padding(
            padding: EdgeInsets.all(32),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_searchResults.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text(
            'MATCHING NODES',
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  letterSpacing: 2.2,
                  color: SkillGraphColors.accent,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 12),
          RecruiterGraphView(
            results: _searchResults,
            searchQuery: _lastSearchQuery ?? '',
          ),
          const SizedBox(height: 16),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _searchResults.length,
            itemBuilder: (context, index) {
              final candidate = _searchResults[index];
              final isSelected = _selectedCandidate?.candidateId == candidate.candidateId;
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                color: isSelected ? SkillGraphColors.accent.withOpacity(0.1) : null,
                child: ListTile(
                  onTap: () => _selectCandidate(candidate),
                  leading: CircleAvatar(
                    backgroundColor: SkillGraphColors.accent.withOpacity(0.1),
                    child: Text(
                      candidate.displayName[0],
                      style: const TextStyle(color: SkillGraphColors.accent),
                    ),
                  ),
                  title: Text(candidate.displayName),
                  subtitle: Text(
                    'Matched: ${candidate.matchedSkillIds.length} skills',
                  ),
                  trailing: Text(
                    '${(candidate.fitScore * 100).toInt()}% FIT',
                    style: const TextStyle(
                      color: SkillGraphColors.accent,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              );
            },
          ),
          if (_selectedCandidate != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'VERIFICATION SIGNALS: ${_selectedCandidate!.displayName.toUpperCase()}',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            letterSpacing: 2.2,
                            color: SkillGraphColors.accent,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 12),
                    if (_loadingSignals)
                      const Center(child: CircularProgressIndicator())
                    else ...[
                      Text('Evidence', style: skillgraphDisplayText(18)),
                      const SizedBox(height: 8),
                      if (_selectedCandidateEvidence.isEmpty)
                        const Text('No evidence found.', style: TextStyle(color: SkillGraphColors.muted))
                      else
                        ..._selectedCandidateEvidence.map((ev) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text('• ${ev.type.toUpperCase()}: ${ev.url}', style: const TextStyle(fontSize: 12)),
                            )),
                      const SizedBox(height: 12),
                      Text('Endorsements', style: skillgraphDisplayText(18)),
                      const SizedBox(height: 8),
                      if (_selectedCandidateEndorsements.isEmpty)
                        const Text('No endorsements found.', style: TextStyle(color: SkillGraphColors.muted))
                      else
                        ..._selectedCandidateEndorsements.map((en) => Padding(
                              padding: const EdgeInsets.only(bottom: 4),
                              child: Text('• ${en.skill?.name ?? en.skillId}: ${en.comment ?? "Trust Weight ${en.weight.toStringAsFixed(2)}"}', style: const TextStyle(fontSize: 12)),
                            )),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ],
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
                      child: Text('Your Evidence', style: skillgraphDisplayText(20)),
                    ),
                    FilledButton.tonal(onPressed: _openAddEvidence, child: const Text('Attach')),
                  ],
                ),
                const SizedBox(height: 8),
                if (_myEvidence.isEmpty)
                  const Text('No evidence attached yet.', style: TextStyle(color: SkillGraphColors.muted))
                else
                  ..._myEvidence.map((ev) => ListTile(
                        dense: true,
                        title: Text(ev.url),
                        subtitle: Text(ev.type.toUpperCase()),
                        leading: const Icon(Icons.link, size: 16),
                      )),
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
                      child: Text('Endorsements', style: skillgraphDisplayText(20)),
                    ),
                    FilledButton.tonal(onPressed: _openSendEndorsement, child: const Text('Send')),
                  ],
                ),
                const SizedBox(height: 8),
                if (_myEndorsements.isEmpty)
                  const Text('No endorsements received yet.', style: TextStyle(color: SkillGraphColors.muted))
                else
                  ..._myEndorsements.map((en) => ListTile(
                        dense: true,
                        title: Text(en.skill?.name ?? en.skillId),
                        subtitle: Text(en.comment ?? 'No comment'),
                        trailing: Text('W: ${en.weight.toStringAsFixed(1)}'),
                      )),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCandidateDashboard(GraphUser profile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PROFILE',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
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
        UserSkillGraphView(
          userName: profile.name,
          skills: _links,
          allSkills: _allSkills,
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
    );
  }
}
