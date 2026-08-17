/**
 * Utility functions for ZipShift file processing.
 */

// Month names for date formatting
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Gets the ordinal suffix for a given day (e.g., 1 -> 'st', 2 -> 'nd', 3 -> 'rd', 4 -> 'th').
 */
export function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
}

/**
 * Formats a date as "26th_May_2026".
 */
export function formatOrdinalDate(date: Date): string {
  const day = date.getDate();
  const monthName = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day}${getOrdinalSuffix(day)}_${monthName}_${year}`;
}

interface ParsedFile {
  prefix: string;
  originalDateStr: string;
  parsedDate: Date;
  previousDayFormatted: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parses a filename to extract prefix and date, calculates the previous day, and formats it.
 * Example input: "700029_INCOMING_TRANSFERS_DETAILS_27052026.CSV"
 * Output: { prefix: "700029", previousDayFormatted: "26th_May_2026", ... }
 */
export function parseFilename(filename: string, mode: "merchant" | "bank"): ParsedFile {
  const result: ParsedFile = {
    prefix: "",
    originalDateStr: "",
    parsedDate: new Date(),
    previousDayFormatted: "",
    isValid: false,
  };

  // 1. Extract prefix (everything before the first underscore)
  const firstUnderscoreIndex = filename.indexOf("_");
  if (firstUnderscoreIndex === -1) {
    result.error = "Filename does not contain an underscore separator";
    return result;
  }
  
  const prefix = filename.substring(0, firstUnderscoreIndex);
  result.prefix = prefix;

  // Validate prefix length based on mode
  if (mode === "merchant") {
    if (!/^\d{6}$/.test(prefix)) {
      result.error = `Invalid Merchant prefix "${prefix}" (expected exactly 6 digits)`;
      return result;
    }
  } else {
    if (!/^\d{3}$/.test(prefix)) {
      result.error = `Invalid Bank prefix "${prefix}" (expected exactly 3 digits)`;
      return result;
    }
  }

  // 2. Extract date suffix (8 digits at the end before extension)
  // Match 8 digits preceded by underscore, optionally followed by an extension at the end of the string
  const dateMatch = filename.match(/_(\d{8})(?:\.[a-zA-Z0-9]+)?$/);
  if (!dateMatch) {
    result.error = "Could not find a valid 8-digit date suffix at the end of the filename (e.g., _27052026)";
    return result;
  }

  const dateStr = dateMatch[1];
  result.originalDateStr = dateStr;

  const day = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10) - 1; // JS months are 0-11
  const year = parseInt(dateStr.substring(4, 8), 10);

  const dateObj = new Date(year, month, day);

  // Validate date bounds (e.g., invalid months/days)
  if (
    isNaN(dateObj.getTime()) ||
    dateObj.getDate() !== day ||
    dateObj.getMonth() !== month ||
    dateObj.getFullYear() !== year
  ) {
    result.error = `Invalid date suffix "${dateStr}"`;
    return result;
  }

  result.parsedDate = new Date(dateObj);

  // 3. Subtract 1 day
  const prevDate = new Date(dateObj);
  prevDate.setDate(prevDate.getDate() - 1);

  // 4. Format previous date (e.g., "26th_May_2026")
  result.previousDayFormatted = formatOrdinalDate(prevDate);
  result.isValid = true;

  return result;
}

/**
 * Groups list of files by their parsed prefix.
 */
export interface FileGroup {
  prefix: string;
  targetZipName: string;
  files: File[];
  originalDateStr: string;
}

export function groupFiles(files: File[], mode: "merchant" | "bank"): {
  groups: FileGroup[];
  invalidFiles: { file: File; error: string }[];
} {
  const groupsMap: Record<string, { files: File[]; dateStr: string; zipName: string }> = {};
  const invalidFiles: { file: File; error: string }[] = [];

  files.forEach(file => {
    const parsed = parseFilename(file.name, mode);
    if (!parsed.isValid) {
      invalidFiles.push({ file, error: parsed.error || "Unknown validation error" });
      return;
    }

    const key = `${parsed.prefix}_${parsed.previousDayFormatted}`;
    if (!groupsMap[key]) {
      groupsMap[key] = {
        files: [],
        dateStr: parsed.originalDateStr,
        zipName: `${parsed.prefix}_${parsed.previousDayFormatted}.zip`
      };
    }
    groupsMap[key].files.push(file);
  });

  const groups: FileGroup[] = Object.entries(groupsMap).map(([key, data]) => {
    const prefix = key.split("_")[0];
    return {
      prefix,
      targetZipName: data.zipName,
      files: data.files,
      originalDateStr: data.dateStr
    };
  });

  // Sort groups alphabetically by prefix
  groups.sort((a, b) => a.prefix.localeCompare(b.prefix));

  return { groups, invalidFiles };
}

/**
 * Formats a date range compactly:
 * - Same month & year: "14th-16th_August_2026"
 * - Same year, different month: "14th_August-12th_September_2026"
 * - Different years: "30th_December_2026-2nd_January_2027"
 */
export function formatDateRangeLabel(start: Date, end: Date): string {
  const startDayOrdinal = `${start.getDate()}${getOrdinalSuffix(start.getDate())}`;
  const endDayOrdinal = `${end.getDate()}${getOrdinalSuffix(end.getDate())}`;
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${startDayOrdinal}_${startMonth}_${startYear}-${endDayOrdinal}_${endMonth}_${endYear}`;
  }

  if (start.getMonth() !== end.getMonth()) {
    return `${startDayOrdinal}_${startMonth}-${endDayOrdinal}_${endMonth}_${startYear}`;
  }

  return `${startDayOrdinal}-${endDayOrdinal}_${startMonth}_${startYear}`;
}

/**
 * Groups files by prefix only, merging every file whose business date
 * (the date suffix minus 1 day) falls within [rangeStart, rangeEnd] into a
 * single zip per prefix. Used for the "Date Range" mode (e.g. compiling a
 * Friday-to-Sunday weekend into one package).
 */
export function groupFilesByDateRange(
  files: File[],
  mode: "merchant" | "bank",
  rangeStart: Date,
  rangeEnd: Date
): {
  groups: FileGroup[];
  invalidFiles: { file: File; error: string }[];
} {
  const groupsMap: Record<string, { files: File[]; zipName: string }> = {};
  const invalidFiles: { file: File; error: string }[] = [];

  const rs = new Date(rangeStart);
  rs.setHours(0, 0, 0, 0);
  const re = new Date(rangeEnd);
  re.setHours(0, 0, 0, 0);

  const rangeLabel = formatDateRangeLabel(rs, re);

  files.forEach(file => {
    const parsed = parseFilename(file.name, mode);
    if (!parsed.isValid) {
      invalidFiles.push({ file, error: parsed.error || "Unknown validation error" });
      return;
    }

    // Business date = the file's date suffix minus 1 day (same offset used elsewhere in the app)
    const businessDate = new Date(parsed.parsedDate);
    businessDate.setDate(businessDate.getDate() - 1);
    businessDate.setHours(0, 0, 0, 0);

    if (businessDate < rs || businessDate > re) {
      invalidFiles.push({
        file,
        error: `File date (${parsed.previousDayFormatted}) falls outside the selected range (${formatOrdinalDate(rs)} - ${formatOrdinalDate(re)})`
      });
      return;
    }

    const key = parsed.prefix;
    if (!groupsMap[key]) {
      groupsMap[key] = {
        files: [],
        zipName: `${parsed.prefix}_${rangeLabel}.zip`
      };
    }
    groupsMap[key].files.push(file);
  });

  const groups: FileGroup[] = Object.entries(groupsMap).map(([prefix, data]) => ({
    prefix,
    targetZipName: data.zipName,
    files: data.files,
    originalDateStr: rangeLabel
  }));

  groups.sort((a, b) => a.prefix.localeCompare(b.prefix));

  return { groups, invalidFiles };
}
