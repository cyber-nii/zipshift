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
  const prevDay = prevDate.getDate();
  const prevMonthName = MONTH_NAMES[prevDate.getMonth()];
  const prevYear = prevDate.getFullYear();
  const suffix = getOrdinalSuffix(prevDay);

  result.previousDayFormatted = `${prevDay}${suffix}_${prevMonthName}_${prevYear}`;
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
