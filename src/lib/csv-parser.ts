/**
 * CSV Parser with UTF-8 BOM / Shift_JIS support.
 * Returns an array of objects keyed by header row.
 */
export function parseCSV(text: string): Record<string, string>[] {
  // Remove BOM if present
  const cleaned = text.replace(/^\uFEFF/, "");

  const lines = cleaned.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

/** Parse a single CSV line, handling quoted fields */
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Decode a buffer that may be Shift_JIS or UTF-8.
 */
export function decodeCSVBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Check for UTF-8 BOM
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new TextDecoder("utf-8").decode(buffer);
  }

  // Try UTF-8 first
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return text;
  } catch {
    // Fallback to Shift_JIS
    return new TextDecoder("shift_jis").decode(buffer);
  }
}
