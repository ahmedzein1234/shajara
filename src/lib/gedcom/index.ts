/**
 * GEDCOM Module for Shajara
 *
 * Provides import/export functionality for the GEDCOM 5.5 format,
 * the standard file format for genealogy data exchange.
 *
 * Features:
 * - Full UTF-8 support for Arabic names
 * - Automatic Hijri date conversion
 * - Arabic name component extraction (kunya, laqab, nisba)
 * - Custom tags for Arabic genealogy data
 */

export { parseGedcom, type GedcomParseResult } from './parser';
export { exportToGedcom, type GedcomExportResult, type ExportOptions } from './exporter';

// Re-export types
export type {
  GedcomLine,
  GedcomIndividual,
  GedcomFamily,
} from './parser';
