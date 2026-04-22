import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../models/graph_models.dart';
import '../../theme/skillgraph_theme.dart';

class RecruiterGraphView extends StatefulWidget {
  const RecruiterGraphView({
    super.key,
    required this.results,
    required this.searchQuery,
  });

  final List<RecruiterCandidateResult> results;
  final String searchQuery;

  @override
  State<RecruiterGraphView> createState() => _RecruiterGraphViewState();
}

class _RecruiterGraphViewState extends State<RecruiterGraphView> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final Map<String, Offset> _nodePositions = {};
  final math.Random _random = math.Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..forward();
    _generatePositions();
  }

  @override
  void didUpdateWidget(RecruiterGraphView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.results != oldWidget.results) {
      _generatePositions();
      _controller.reset();
      _controller.forward();
    }
  }

  void _generatePositions() {
    _nodePositions.clear();
    for (final candidate in widget.results) {
      // Random positions in a circular layout
      final angle = _random.nextDouble() * 2 * math.pi;
      final radius = 80 + _random.nextDouble() * 100;
      _nodePositions[candidate.candidateId] = Offset(
        math.cos(angle) * radius,
        math.sin(angle) * radius,
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Container(
          height: 400,
          decoration: BoxDecoration(
            color: SkillGraphColors.surface.withOpacity(0.3),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: SkillGraphColors.accent.withOpacity(0.2)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              // Grid Background
              Positioned.fill(
                child: CustomPaint(painter: _GraphGridPainter()),
              ),
              
              // Central "Expertise" Node
              Center(
                child: _ExpertiseNode(label: widget.searchQuery),
              ),

              // Candidate Nodes and Edges
              ...widget.results.map((candidate) {
                final pos = _nodePositions[candidate.candidateId] ?? Offset.zero;
                final animatedPos = Offset(
                  pos.dx * _controller.value,
                  pos.dy * _controller.value,
                );

                return Positioned(
                  left: 200 + animatedPos.dx - 40,
                  top: 200 + animatedPos.dy - 40,
                  child: _CandidateNode(
                    candidate: candidate,
                    opacity: _controller.value,
                  ),
                );
              }),
              
              // Connections (drawn behind nodes)
              Positioned.fill(
                child: CustomPaint(
                  painter: _GraphEdgePainter(
                    results: widget.results,
                    positions: _nodePositions,
                    progress: _controller.value,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ExpertiseNode extends StatelessWidget {
  const _ExpertiseNode({required this.label});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: SkillGraphColors.accent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: SkillGraphColors.accent, width: 2),
        boxShadow: [
          BoxShadow(
            color: SkillGraphColors.accent.withOpacity(0.4),
            blurRadius: 20,
          ),
        ],
      ),
      child: Text(
        label.toUpperCase(),
        style: const TextStyle(
          color: SkillGraphColors.accent,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.5,
          fontSize: 12,
        ),
      ),
    );
  }
}

class _CandidateNode extends StatelessWidget {
  const _CandidateNode({required this.candidate, required this.opacity});
  final RecruiterCandidateResult candidate;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    final size = 40 + (candidate.fitScore * 40);
    
    return Opacity(
      opacity: opacity,
      child: Tooltip(
        message: '${candidate.displayName}\nFit: ${(candidate.fitScore * 100).toInt()}%',
        child: Column(
          children: [
            Container(
              width: size,
              height: size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    SkillGraphColors.accentStrong,
                    SkillGraphColors.accent.withOpacity(0.5),
                  ],
                ),
                boxShadow: [
                  BoxShadow(
                    color: SkillGraphColors.accent.withOpacity(0.3),
                    blurRadius: 10,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  '${(candidate.fitScore * 100).toInt()}%',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              candidate.displayName.split(' ').first,
              style: const TextStyle(fontSize: 9, color: SkillGraphColors.muted),
            ),
          ],
        ),
      ),
    );
  }
}

class _GraphGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = SkillGraphColors.accent.withOpacity(0.05)
      ..strokeWidth = 1;

    for (double i = 0; i < size.width; i += 20) {
      canvas.drawLine(Offset(i, 0), Offset(i, size.height), paint);
    }
    for (double i = 0; i < size.height; i += 20) {
      canvas.drawLine(Offset(0, i), Offset(size.width, i), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _GraphEdgePainter extends CustomPainter {
  _GraphEdgePainter({
    required this.results,
    required this.positions,
    required this.progress,
  });

  final List<RecruiterCandidateResult> results;
  final Map<String, Offset> positions;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()
      ..shader = const LinearGradient(
        colors: [SkillGraphColors.accent, Colors.transparent],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke;

    for (final candidate in results) {
      final pos = positions[candidate.candidateId];
      if (pos == null) continue;

      final target = center + (pos * progress);
      
      // Draw a subtle curved line from center to candidate
      final path = Path()
        ..moveTo(center.dx, center.dy)
        ..quadraticBezierTo(
          center.dx + pos.dx * 0.5,
          center.dy + pos.dy * 0.2,
          target.dx,
          target.dy,
        );

      canvas.drawPath(path, paint..color = SkillGraphColors.accent.withOpacity(0.2 * progress));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
