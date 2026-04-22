import 'dart:convert';

import 'package:flutter/material.dart';

import '../api/skillgraph_api.dart';
import '../models/graph_models.dart';
import '../theme/skillgraph_theme.dart';
import '../widgets/skillgraph_background.dart';

class ApiWorkbenchScreen extends StatefulWidget {
  const ApiWorkbenchScreen({
    super.key,
    required this.api,
    required this.currentUser,
  });

  final SkillGraphApi api;
  final GraphUser currentUser;

  @override
  State<ApiWorkbenchScreen> createState() => _ApiWorkbenchScreenState();
}

class _ApiWorkbenchScreenState extends State<ApiWorkbenchScreen> {
  final _createUserName = TextEditingController();
  final _createUserEmail = TextEditingController();
  final _createSkillName = TextEditingController();
  final _createSkillCategory = TextEditingController();
  final _lookupUserId = TextEditingController();
  final _lookupSkillId = TextEditingController();
  final _historySkillId = TextEditingController();
  final _evidenceActorId = TextEditingController();
  final _evidenceSkillId = TextEditingController();
  final _evidenceUrl = TextEditingController();
  final _evidenceDescription = TextEditingController();
  final _evidenceListUserId = TextEditingController();
  final _endorserId = TextEditingController();
  final _endorsementRecipientId = TextEditingController();
  final _endorsementSkillId = TextEditingController();
  final _endorsementComment = TextEditingController();
  final _endorsementListUserId = TextEditingController();
  final _assessmentUserId = TextEditingController();
  final _assessmentSkillId = TextEditingController();
  final _assessmentScore = TextEditingController(text: '82');
  final _assessmentTimestamp = TextEditingController(
    text: DateTime.now().toIso8601String(),
  );
  final _assessmentSource = TextEditingController(text: 'automated-challenge');
  final _recruiterQuery = TextEditingController();
  final _recruiterSkillIds = TextEditingController();

  String _evidenceType = 'github';
  String _output = '';
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    final userId = widget.currentUser.id;
    _lookupUserId.text = userId;
    _evidenceActorId.text = userId;
    _evidenceListUserId.text = userId;
    _endorserId.text = userId;
    _endorsementListUserId.text = userId;
    _assessmentUserId.text = userId;
  }

  @override
  void dispose() {
    for (final controller in [
      _createUserName,
      _createUserEmail,
      _createSkillName,
      _createSkillCategory,
      _lookupUserId,
      _lookupSkillId,
      _historySkillId,
      _evidenceActorId,
      _evidenceSkillId,
      _evidenceUrl,
      _evidenceDescription,
      _evidenceListUserId,
      _endorserId,
      _endorsementRecipientId,
      _endorsementSkillId,
      _endorsementComment,
      _endorsementListUserId,
      _assessmentUserId,
      _assessmentSkillId,
      _assessmentScore,
      _assessmentTimestamp,
      _assessmentSource,
      _recruiterQuery,
      _recruiterSkillIds,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  String _pretty(Object value) =>
      const JsonEncoder.withIndent('  ').convert(value);

  Future<void> _run(Future<Object?> Function() task) async {
    setState(() {
      _loading = true;
    });
    try {
      final result = await task();
      if (!mounted) return;
      setState(() {
        _output = result == null
            ? 'Success (no response body)'
            : _pretty(result);
      });
    } on SkillGraphApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _output = 'API error (${e.statusCode ?? 'unknown'}): ${e.message}';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _output = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Widget _field(
    String label,
    TextEditingController controller, {
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(labelText: label),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SkillGraphBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('API Workbench')),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Base URL: ${widget.api.apiBaseUrl}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: SkillGraphColors.accent,
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        FilledButton(
                          onPressed: _loading
                              ? null
                              : () =>
                                    _run(() async => widget.api.fetchHealth()),
                          child: const Text('GET /health'),
                        ),
                        FilledButton.tonal(
                          onPressed: _loading
                              ? null
                              : () => _run(() async {
                                  final users = await widget.api.searchUsers(
                                    limit: 10,
                                  );
                                  return users.map((u) => u.toJson()).toList();
                                }),
                          child: const Text('GET /api/users'),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Users', style: skillgraphDisplayText(20)),
                        _field('Name', _createUserName),
                        _field(
                          'Email',
                          _createUserEmail,
                          keyboardType: TextInputType.emailAddress,
                        ),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilledButton(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final user = await widget.api.createUser(
                                        name: _createUserName.text,
                                        email: _createUserEmail.text,
                                      );
                                      return user.toJson();
                                    }),
                              child: const Text('POST /api/users'),
                            ),
                            FilledButton.tonal(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final user = await widget.api.fetchUser(
                                        _lookupUserId.text,
                                      );
                                      return user.toJson();
                                    }),
                              child: const Text('GET /api/users/:id'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _field('Lookup user id', _lookupUserId),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Skills', style: skillgraphDisplayText(20)),
                        _field('Skill name', _createSkillName),
                        _field('Category (optional)', _createSkillCategory),
                        _field('Skill id', _lookupSkillId),
                        _field('History skill id', _historySkillId),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilledButton(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final skill = await widget.api
                                          .createSkill(
                                            name: _createSkillName.text,
                                            category: _createSkillCategory.text,
                                          );
                                      return {
                                        'id': skill.id,
                                        'name': skill.name,
                                        'category': skill.category,
                                        'createdAt': skill.createdAt,
                                      };
                                    }),
                              child: const Text('POST /api/skills'),
                            ),
                            FilledButton.tonal(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final skill = await widget.api
                                          .fetchSkillById(_lookupSkillId.text);
                                      return {
                                        'id': skill.id,
                                        'name': skill.name,
                                        'category': skill.category,
                                        'createdAt': skill.createdAt,
                                      };
                                    }),
                              child: const Text('GET /api/skills/:id'),
                            ),
                            FilledButton.tonal(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final events = await widget.api
                                          .fetchSkillHistory(
                                            _historySkillId.text,
                                          );
                                      return events
                                          .map(
                                            (e) => {
                                              'id': e.id,
                                              'type': e.type,
                                              'detail': e.detail,
                                              'timestamp': e.timestamp,
                                            },
                                          )
                                          .toList();
                                    }),
                              child: const Text('GET /api/skills/:id/history'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Evidence', style: skillgraphDisplayText(20)),
                        _field('Actor user id (x-user-id)', _evidenceActorId),
                        _field('Skill id', _evidenceSkillId),
                        _field('URL', _evidenceUrl),
                        _field('Description', _evidenceDescription),
                        DropdownButton<String>(
                          value: _evidenceType,
                          items: const [
                            DropdownMenuItem(
                              value: 'github',
                              child: Text('github'),
                            ),
                            DropdownMenuItem(
                              value: 'portfolio',
                              child: Text('portfolio'),
                            ),
                            DropdownMenuItem(
                              value: 'certificate',
                              child: Text('certificate'),
                            ),
                            DropdownMenuItem(
                              value: 'article',
                              child: Text('article'),
                            ),
                            DropdownMenuItem(
                              value: 'other',
                              child: Text('other'),
                            ),
                          ],
                          onChanged: _loading
                              ? null
                              : (value) {
                                  if (value == null) return;
                                  setState(() => _evidenceType = value);
                                },
                        ),
                        _field('List evidence by user id', _evidenceListUserId),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilledButton(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final evidence = await widget.api
                                          .createEvidence(
                                            actorUserId: _evidenceActorId.text,
                                            skillId: _evidenceSkillId.text,
                                            url: _evidenceUrl.text,
                                            type: _evidenceType,
                                            metadata: {
                                              'description':
                                                  _evidenceDescription.text,
                                            },
                                          );
                                      return {
                                        'id': evidence.id,
                                        'userId': evidence.userId,
                                        'skillId': evidence.skillId,
                                        'url': evidence.url,
                                        'type': evidence.type,
                                        'metadata': evidence.metadata,
                                        'createdAt': evidence.createdAt,
                                      };
                                    }),
                              child: const Text('POST /api/evidence'),
                            ),
                            FilledButton.tonal(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final records = await widget.api
                                          .fetchEvidenceForUser(
                                            _evidenceListUserId.text,
                                          );
                                      return records
                                          .map(
                                            (e) => {
                                              'id': e.id,
                                              'userId': e.userId,
                                              'skillId': e.skillId,
                                              'url': e.url,
                                              'type': e.type,
                                              'metadata': e.metadata,
                                              'createdAt': e.createdAt,
                                            },
                                          )
                                          .toList();
                                    }),
                              child: const Text('GET /api/evidence/:userId'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Endorsements', style: skillgraphDisplayText(20)),
                        _field('Endorser id (x-user-id)', _endorserId),
                        _field('Recipient id', _endorsementRecipientId),
                        _field('Skill id', _endorsementSkillId),
                        _field('Comment (optional)', _endorsementComment),
                        _field(
                          'List by recipient user id',
                          _endorsementListUserId,
                        ),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilledButton(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final endorsement = await widget.api
                                          .createEndorsement(
                                            endorserId: _endorserId.text,
                                            recipientId:
                                                _endorsementRecipientId.text,
                                            skillId: _endorsementSkillId.text,
                                            comment: _endorsementComment.text,
                                          );
                                      return {
                                        'id': endorsement.id,
                                        'endorserId': endorsement.endorserId,
                                        'recipientId': endorsement.recipientId,
                                        'skillId': endorsement.skillId,
                                        'timestamp': endorsement.timestamp,
                                        'comment': endorsement.comment,
                                        'weight': endorsement.weight,
                                        'riskFlags': endorsement.riskFlags,
                                      };
                                    }),
                              child: const Text('POST /api/endorse'),
                            ),
                            FilledButton.tonal(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final endorsements = await widget.api
                                          .fetchEndorsementsForUser(
                                            _endorsementListUserId.text,
                                          );
                                      return endorsements
                                          .map(
                                            (e) => {
                                              'id': e.id,
                                              'endorserId': e.endorserId,
                                              'recipientId': e.recipientId,
                                              'skillId': e.skillId,
                                              'timestamp': e.timestamp,
                                              'comment': e.comment,
                                              'weight': e.weight,
                                              'riskFlags': e.riskFlags,
                                              'skill': e.skill == null
                                                  ? null
                                                  : {
                                                      'id': e.skill!.id,
                                                      'name': e.skill!.name,
                                                      'category':
                                                          e.skill!.category,
                                                    },
                                            },
                                          )
                                          .toList();
                                    }),
                              child: const Text('GET /api/endorse/:userId'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Assessment + Recruiter Search',
                          style: skillgraphDisplayText(20),
                        ),
                        _field('Assessment user id', _assessmentUserId),
                        _field('Assessment skill id', _assessmentSkillId),
                        _field(
                          'Assessment score',
                          _assessmentScore,
                          keyboardType: TextInputType.number,
                        ),
                        _field(
                          'Assessment timestamp (ISO)',
                          _assessmentTimestamp,
                        ),
                        _field('Assessment source', _assessmentSource),
                        _field('Recruiter query', _recruiterQuery),
                        _field(
                          'Required skill IDs (comma separated)',
                          _recruiterSkillIds,
                        ),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            FilledButton(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final assessment = await widget.api
                                          .ingestAssessment(
                                            userId: _assessmentUserId.text,
                                            skillId: _assessmentSkillId.text,
                                            score:
                                                num.tryParse(
                                                  _assessmentScore.text,
                                                ) ??
                                                0,
                                            timestamp:
                                                _assessmentTimestamp.text,
                                            source: _assessmentSource.text,
                                          );
                                      return {
                                        'id': assessment.id,
                                        'userId': assessment.userId,
                                        'skillId': assessment.skillId,
                                        'score': assessment.score,
                                        'timestamp': assessment.timestamp,
                                        'source': assessment.source,
                                        'createdAt': assessment.createdAt,
                                      };
                                    }),
                              child: const Text('POST /api/assessment/ingest'),
                            ),
                            FilledButton.tonal(
                              onPressed: _loading
                                  ? null
                                  : () => _run(() async {
                                      final requiredSkillIds =
                                          _recruiterSkillIds.text
                                              .split(',')
                                              .map((s) => s.trim())
                                              .where((s) => s.isNotEmpty)
                                              .toList();
                                      final result = await widget.api
                                          .recruiterSearch(
                                            recruiterId: widget.currentUser.id,
                                            query: _recruiterQuery.text,
                                            requiredSkillIds: requiredSkillIds,
                                          );
                                      return {
                                        'scoreVersion': result.scoreVersion,
                                        'tookMs': result.tookMs,
                                        'total': result.total,
                                        'candidates': result.candidates
                                            .map(
                                              (c) => {
                                                'candidateId': c.candidateId,
                                                'displayName': c.displayName,
                                                'fitScore': c.fitScore,
                                                'scoreVersion': c.scoreVersion,
                                                'matchedSkillIds':
                                                    c.matchedSkillIds,
                                                'industries': c.industries,
                                                'projectTypes': c.projectTypes,
                                                'explanationAtoms': c
                                                    .explanationAtoms
                                                    .map(
                                                      (a) => {
                                                        'type': a.type,
                                                        'label': a.label,
                                                        'value': a.value,
                                                        'contribution':
                                                            a.contribution,
                                                      },
                                                    )
                                                    .toList(),
                                              },
                                            )
                                            .toList(),
                                      };
                                    }),
                              child: const Text('POST /api/recruiter/search'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (_loading)
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              ),
                            if (_loading) const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Last response',
                                style: skillgraphDisplayText(20),
                              ),
                            ),
                            IconButton(
                              onPressed: () => setState(() => _output = ''),
                              icon: const Icon(Icons.clear),
                              tooltip: 'Clear output',
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        SelectableText(
                          _output.isEmpty ? 'No response yet.' : _output,
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: SkillGraphColors.muted,
                                fontFamily: 'monospace',
                              ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
