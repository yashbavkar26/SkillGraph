import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/graph_models.dart';
import '../theme/skillgraph_theme.dart';

class UserSkillGraphView extends StatefulWidget {
  const UserSkillGraphView({
    super.key,
    required this.userName,
    required this.skills,
    required this.allSkills,
  });

  final String userName;
  final List<UserSkillLink> skills;
  final List<GraphSkill> allSkills;

  @override
  State<UserSkillGraphView> createState() => _UserSkillGraphViewState();
}

class _UserSkillGraphViewState extends State<UserSkillGraphView> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final Map<String, Offset> _positions = {};

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..forward();
    _computePositions();
  }

  void _computePositions() {
    _positions.clear();
    if (widget.skills.isEmpty) return;

    final count = widget.skills.length;
    for (int i = 0; i < count; i++) {
      final angle = (i * 2 * math.pi) / count;
      _positions[widget.skills[i].skillId] = Offset(
        math.cos(angle) * 110,
        math.sin(angle) * 110,
      );
    }
  }

  @override
  void didUpdateWidget(UserSkillGraphView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.skills != oldWidget.skills) {
      _computePositions();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 320,
      width: double.infinity,
      margin: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        color: SkillGraphColors.surface.withOpacity(0.2),
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: SkillGraphColors.accent.withOpacity(0.1)),
      ),
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Stack(
            children: [
              // User Center Node
              Center(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: SkillGraphColors.accent.withOpacity(0.1),
                    border: Border.all(color: SkillGraphColors.accent, width: 2),
                    boxShadow: [
                      BoxShadow(color: SkillGraphColors.accent.withOpacity(0.2), blurRadius: 15),
                    ],
                  ),
                  child: Text(
                    widget.userName[0].toUpperCase(),
                    style: skillgraphDisplayText(20).copyWith(color: SkillGraphColors.accent),
                  ),
                ),
              ),

              // Skill Nodes
              ...widget.skills.map((link) {
                final pos = _positions[link.skillId] ?? Offset.zero;
                final animatedPos = Offset(pos.dx * _controller.value, pos.dy * _controller.value);
                final skill = widget.allSkills.firstWhere((s) => s.id == link.skillId, orElse: () => GraphSkill(id: '', name: 'Unknown', createdAt: ''));

                return Positioned(
                  left: 160 + animatedPos.dx - 40,
                  top: 160 + animatedPos.dy - 15,
                  child: Opacity(
                    opacity: _controller.value,
                    child: Container(
                      width: 80,
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: SkillGraphColors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: SkillGraphColors.accent.withOpacity(0.3)),
                      ),
                      child: Text(
                        skill.name,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                );
              }),

              // Lines (drawn via custom painter)
              Positioned.fill(
                child: CustomPaint(
                  painter: _SkillGraphPainter(
                    positions: _positions,
                    progress: _controller.value,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SkillGraphPainter extends CustomPainter {
  _SkillGraphPainter({required this.positions, required this.progress});
  final Map<String, Offset> positions;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()
      ..color = SkillGraphColors.accent.withOpacity(0.15 * progress)
      ..strokeWidth = 1.5;

    for (final pos in positions.values) {
      canvas.drawLine(center, center + (pos * progress), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
