/**
 * Utility for parsing and validating PDF page range strings.
 * Examples: "1, 3, 5-8", "1-5", "2, 4, 6-10"
 */

export interface PageRangeResult {
  valid: boolean;
  indices: number[]; // 0-indexed page array
  groups?: number[][]; // 0-indexed page groups
  error?: string;
}

export function parsePageRangeString(input: string, totalPages: number): PageRangeResult {
  if (!input || !input.trim()) {
    return { valid: false, indices: [], error: 'Page range cannot be empty.' };
  }

  const clean = input.trim();
  const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
  const resultSet = new Set<number>();

  for (const part of parts) {
    // Range syntax e.g. "1-5" or "5-1"
    if (part.includes('-')) {
      const rangeParts = part.split('-').map((p) => p.trim());
      if (rangeParts.length !== 2) {
        return { valid: false, indices: [], error: `Invalid range format: "${part}".` };
      }

      const start = parseInt(rangeParts[0], 10);
      const end = parseInt(rangeParts[1], 10);

      if (isNaN(start) || isNaN(end)) {
        return { valid: false, indices: [], error: `Invalid numbers in range: "${part}".` };
      }

      if (start < 1 || start > totalPages) {
        return { valid: false, indices: [], error: `Page ${start} is out of bounds (1 to ${totalPages}).` };
      }
      if (end < 1 || end > totalPages) {
        return { valid: false, indices: [], error: `Page ${end} is out of bounds (1 to ${totalPages}).` };
      }

      const step = start <= end ? 1 : -1;
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        resultSet.add(i - 1);
      }
    } else {
      // Single page number e.g. "3"
      const pageNum = parseInt(part, 10);
      if (isNaN(pageNum)) {
        return { valid: false, indices: [], error: `Invalid page number: "${part}".` };
      }

      if (pageNum < 1 || pageNum > totalPages) {
        return { valid: false, indices: [], error: `Page ${pageNum} is out of bounds (1 to ${totalPages}).` };
      }

      resultSet.add(pageNum - 1);
    }
  }

  const sortedIndices = Array.from(resultSet).sort((a, b) => a - b);
  if (sortedIndices.length === 0) {
    return { valid: false, indices: [], error: 'No valid pages selected.' };
  }

  return { valid: true, indices: sortedIndices };
}

export function parseCustomGroupsString(input: string, totalPages: number): { valid: boolean; groups: number[][]; error?: string } {
  if (!input || !input.trim()) {
    return { valid: false, groups: [], error: 'Group definitions cannot be empty.' };
  }

  // Groups can be separated by semicolon e.g. "1-3; 4-7; 8-10" or lines
  const groupStrings = input.split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);
  const groups: number[][] = [];

  for (let idx = 0; idx < groupStrings.length; idx++) {
    const res = parsePageRangeString(groupStrings[idx], totalPages);
    if (!res.valid) {
      return { valid: false, groups: [], error: `Group ${idx + 1} (${groupStrings[idx]}): ${res.error}` };
    }
    groups.push(res.indices);
  }

  return { valid: true, groups };
}
