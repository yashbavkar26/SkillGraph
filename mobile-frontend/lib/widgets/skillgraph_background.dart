import 'package:flutter/material.dart';

import '../theme/skillgraph_theme.dart';

/// Soft hero glows + grid lines similar to the web landing background.
class SkillGraphBackground extends StatelessWidget {
  const SkillGraphBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [SkillGraphColors.bg, SkillGraphColors.bgStrong],
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -90,
            left: -50,
            child: IgnorePointer(
              child: Container(
                width: 260,
                height: 260,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0x5C9359FF).withValues(alpha: 0.28),
                ),
              ),
            ),
          ),
          Positioned(
            top: -40,
            right: -60,
            child: IgnorePointer(
              child: Container(
                width: 280,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0x573FE1FF).withValues(alpha: 0.26),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: -120,
            left: 0,
            right: 0,
            child: IgnorePointer(
              child: Align(
                child: Container(
                  width: 420,
                  height: 260,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0x42FF68D3).withValues(alpha: 0.18),
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(child: CustomPaint(painter: _GridPainter())),
          ),
          child,
        ],
      ),
    );
  }
}

class _GridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    const spacing = 44.0;
    final line = Paint()
      ..color = SkillGraphColors.accent.withValues(alpha: 0.07)
      ..strokeWidth = 1;

    for (double x = 0; x <= size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), line);
    }
    for (double y = 0; y <= size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), line);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
