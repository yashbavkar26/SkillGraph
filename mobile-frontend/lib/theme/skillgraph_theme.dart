import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Mirrors `src/recruiter-ui/styles/recruiter-search.css` dark theme tokens.
class SkillGraphColors {
  SkillGraphColors._();

  static const Color bg = Color(0xFF090B18);
  static const Color bgStrong = Color(0xFF111428);
  static const Color panel = Color(0xC711152A);
  static const Color panelBorder = Color(0x3D8898FF);
  static const Color text = Color(0xFFECF1FF);
  static const Color muted = Color(0xFFA5B1D9);
  static const Color accent = Color(0xFF56CCFF);
  static const Color accentStrong = Color(0xFF4CE7D2);
  static const Color accentSoft = Color(0x2E56CCFF);
  static const Color success = Color(0xFF52E5AE);
  static const Color danger = Color(0xFFFF8EA5);
  static const Color surface = Color(0xC70E1223);
}

TextStyle skillgraphDisplayText(
  double size, {
  FontWeight weight = FontWeight.w600,
}) {
  return GoogleFonts.chakraPetch(
    fontSize: size,
    fontWeight: weight,
    color: SkillGraphColors.text,
    height: 1.1,
  );
}

ThemeData buildSkillGraphDarkTheme() {
  final colorScheme = ColorScheme.dark(
    surface: SkillGraphColors.surface,
    primary: SkillGraphColors.accent,
    secondary: SkillGraphColors.accentStrong,
    onSurface: SkillGraphColors.text,
    onPrimary: Colors.white,
    error: SkillGraphColors.danger,
    outline: SkillGraphColors.panelBorder,
  );

  final baseDark = ThemeData(brightness: Brightness.dark).textTheme;
  final inter = GoogleFonts.interTextTheme(baseDark).apply(
    bodyColor: SkillGraphColors.text,
    displayColor: SkillGraphColors.text,
  );

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: SkillGraphColors.bg,
    textTheme: inter,
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      foregroundColor: SkillGraphColors.text,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.chakraPetch(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: SkillGraphColors.text,
      ),
    ),
    cardTheme: CardThemeData(
      color: SkillGraphColors.panel,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(22),
        side: const BorderSide(color: SkillGraphColors.panelBorder),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: SkillGraphColors.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: SkillGraphColors.panelBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: const BorderSide(color: SkillGraphColors.panelBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(13),
        borderSide: BorderSide(
          color: SkillGraphColors.accent.withValues(alpha: 0.65),
        ),
      ),
      labelStyle: const TextStyle(color: SkillGraphColors.muted),
      hintStyle: TextStyle(
        color: SkillGraphColors.muted.withValues(alpha: 0.85),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: SkillGraphColors.accent,
        foregroundColor: Colors.white,
        disabledBackgroundColor: SkillGraphColors.accent.withValues(
          alpha: 0.45,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        shape: const StadiumBorder(),
        textStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: SkillGraphColors.text,
        side: const BorderSide(color: SkillGraphColors.panelBorder),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        shape: const StadiumBorder(),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: SkillGraphColors.accentSoft,
      selectedColor: SkillGraphColors.accentSoft,
      disabledColor: const Color(0x12ECF1FF),
      labelStyle: GoogleFonts.inter(
        color: SkillGraphColors.accentStrong,
        fontWeight: FontWeight.w600,
        fontSize: 13,
      ),
      secondaryLabelStyle: GoogleFonts.inter(
        color: SkillGraphColors.muted,
        fontSize: 13,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      side: BorderSide(color: SkillGraphColors.accent.withValues(alpha: 0.36)),
    ),
    dividerTheme: const DividerThemeData(color: SkillGraphColors.panelBorder),
  );
}
