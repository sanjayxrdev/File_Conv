/**
 * Reusable filename utility functions for sanitizing user inputs,
 * preventing duplicate extensions (e.g. file.pdf.pdf), stripping illegal characters,
 * and ensuring clean direct download filenames.
 */

/**
 * Strips target extension or any existing trailing file extension from a filename string.
 * Example: "report.pdf" -> "report", "my.file.pdf" -> "my.file"
 */
export function stripExtension(filename: string, targetExt: string = 'pdf'): string {
  if (!filename) return '';
  let clean = filename.trim();

  // Regex for stripping repeated target extension e.g. .pdf or .PDF (case-insensitive)
  const escapedExt = targetExt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const repeatedExtRegex = new RegExp(`(\\.${escapedExt})+$`, 'i');
  clean = clean.replace(repeatedExtRegex, '');

  // Strip generic extension if still present
  const lastDot = clean.lastIndexOf('.');
  if (lastDot > 0 && lastDot < clean.length - 1) {
    // Check if what follows is a reasonable extension (1-6 alphanumeric chars)
    const extCandidate = clean.slice(lastDot + 1);
    if (/^[a-zA-Z0-9]{1,6}$/.test(extCandidate)) {
      clean = clean.slice(0, lastDot);
    }
  }

  return clean;
}

/**
 * Sanitizes input filename by replacing illegal filesystem characters,
 * stripping leading/trailing spaces, and handling empty input fallbacks.
 * Illegal characters: / \ : * ? " < > |
 */
export function sanitizeFilename(input: string, fallback: string = 'document'): string {
  if (!input) return fallback;

  // Replace invalid filesystem characters with underscores or empty
  let sanitized = input.replace(/[/\\:*?"<>|]/g, '_');

  // Replace multiple spaces or control chars with single space
  sanitized = sanitized.replace(/[\s\t\n\r]+/g, ' ').trim();

  // Strip leading dots or hyphens
  sanitized = sanitized.replace(/^[.-]+/, '');

  if (!sanitized) {
    return fallback;
  }

  // Truncate to reasonable max length (200 chars)
  if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200).trim();
  }

  return sanitized;
}

/**
 * Ensures exactly one target extension suffix exists on the filename (e.g. .pdf or .zip).
 * Handles uppercase .PDF, repeated extensions, etc.
 */
export function ensureExtension(filename: string, targetExt: string = 'pdf'): string {
  const ext = targetExt.toLowerCase().replace(/^\.+/, '');
  const base = stripExtension(filename, ext);
  const cleanBase = sanitizeFilename(base, 'document');
  return `${cleanBase}.${ext}`;
}

/**
 * High-level function returning sanitized, extension-guaranteed download filename.
 * Example inputs:
 *  - "report.pdf", "pdf" -> "report.pdf"
 *  - "final-report", "pdf" -> "final-report.pdf"
 *  - "FINAL REPORT.pdf.pdf", "pdf" -> "FINAL REPORT.pdf"
 *  - "file/name:1*?", "pdf" -> "file_name_1_.pdf"
 */
export function getDownloadFilename(input: string, targetExt: string = 'pdf', fallback: string = 'document'): string {
  return ensureExtension(input || fallback, targetExt);
}
