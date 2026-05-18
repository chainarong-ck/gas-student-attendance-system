export type RowRecord = Record<string, string>;

export function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const text = String(value ?? "").trim().toLowerCase();
  return text === "true" || text === "1" || text === "yes" || text === "y";
}

export function splitCsv(value: unknown): string[] {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinCsv(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(",");
}

export function normalizeSheetDateHeader(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const timezone = Session.getScriptTimeZone() || "Asia/Bangkok";
    return Utilities.formatDate(value, timezone, "yyyy-MM-dd");
  }

  const text = String(value ?? "").trim();
  const isoDateMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return text;
}

export function ensureSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  name: string,
  headers: string[],
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  const currentHeaders = sheet
    .getRange(1, 1, 1, Math.max(headers.length, 1))
    .getValues()[0]
    .map((value) => String(value ?? "").trim());

  const needsHeader = headers.some((header, index) => currentHeaders[index] !== header);
  if (needsHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

export function readTable(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headers: string[],
): RowRecord[] {
  if (sheet.getLastRow() < 2) {
    return [];
  }

  const width = Math.max(headers.length, sheet.getLastColumn());
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, width).getValues();
  return values
    .map((row) => {
      const record: RowRecord = {};
      headers.forEach((header, index) => {
        record[header] = String(row[index] ?? "").trim();
      });
      return record;
    })
    .filter((record) => Object.values(record).some((value) => value !== ""));
}

export function replaceTable(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  headers: string[],
  rows: string[][],
): void {
  sheet.clearContents();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}

export function removeDefaultSheets(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
  keepSheetNames: string[],
): void {
  const keep = new Set(keepSheetNames);
  ss.getSheets().forEach((sheet) => {
    if (!keep.has(sheet.getName()) && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet);
    }
  });
}
