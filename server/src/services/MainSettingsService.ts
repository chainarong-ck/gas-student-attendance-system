import {
  AttendanceStatus,
  SystemSettings,
  TermRecord,
  UserRecord,
  UserRole,
} from "../types";
import { appPropertiesService } from "./AppPropertiesService";
import {
  ensureSheet,
  joinCsv,
  normalizeBoolean,
  readTable,
  replaceTable,
  splitCsv,
} from "./SpreadsheetTable";

const SYSTEM_HEADERS = ["key", "value"];
const TERM_HEADERS = [
  "termKey",
  "academicYear",
  "semester",
  "label",
  "folderId",
  "studentListSpreadsheetId",
  "attendanceSpreadsheetId",
  "settingSpreadsheetId",
  "isActive",
  "sortOrder",
];
const USER_HEADERS = [
  "email",
  "role",
  "displayName",
  "allowedTermKeys",
  "allowedClassrooms",
  "isActive",
];

export const DEFAULT_ATTENDANCE_STATUSES: AttendanceStatus[] = [
  { code: "P", label: "มา", countsAsPresent: true },
  { code: "A", label: "ขาด", countsAsPresent: false },
  { code: "L", label: "ลา", countsAsPresent: false },
  { code: "S", label: "สาย", countsAsPresent: true },
];

class MainSettingsService {
  private ss: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null;

  public getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    if (this.ss) return this.ss;

    const settingSheetId = appPropertiesService.getSettingSheetId();
    if (!settingSheetId) {
      throw new Error("SETTING_SHEET_ID is not configured.");
    }

    this.ss = SpreadsheetApp.openById(settingSheetId);
    this.ensureSchema();
    return this.ss;
  }

  public ensureSchema(): void {
    const settingSheetId = appPropertiesService.getSettingSheetId();
    if (!settingSheetId) return;

    const ss = this.ss ?? SpreadsheetApp.openById(settingSheetId);
    this.ss = ss;

    ensureSheet(ss, "System", SYSTEM_HEADERS);
    ensureSheet(ss, "Terms", TERM_HEADERS);
    ensureSheet(ss, "Users", USER_HEADERS);

    const system = this.getSystemSettings();
    if (!system.schoolName) {
      this.saveSystemSettings({
        ...system,
        schoolName: "Student Attendance System",
      });
    }
  }

  public getSystemSettings(): SystemSettings {
    const ss = this.getSpreadsheet();
    const sheet = ensureSheet(ss, "System", SYSTEM_HEADERS);
    const rows = readTable(sheet, SYSTEM_HEADERS);
    const values: Record<string, string> = {};
    rows.forEach((row) => {
      if (row.key) values[row.key] = row.value;
    });

    return {
      schoolName: values.schoolName ?? "",
      defaultTermKey: values.defaultTermKey ?? "",
    };
  }

  public saveSystemSettings(settings: SystemSettings): void {
    const ss = this.getSpreadsheet();
    const sheet = ensureSheet(ss, "System", SYSTEM_HEADERS);
    replaceTable(sheet, SYSTEM_HEADERS, [
      ["schoolName", settings.schoolName],
      ["defaultTermKey", settings.defaultTermKey],
    ]);
  }

  public getTerms(includeInactive = true): TermRecord[] {
    const ss = this.getSpreadsheet();
    const sheet = ensureSheet(ss, "Terms", TERM_HEADERS);
    return readTable(sheet, TERM_HEADERS)
      .map((row): TermRecord => ({
        termKey: row.termKey,
        academicYear: row.academicYear,
        semester: row.semester,
        label: row.label,
        folderId: row.folderId,
        studentListSpreadsheetId: row.studentListSpreadsheetId,
        attendanceSpreadsheetId: row.attendanceSpreadsheetId,
        settingSpreadsheetId: row.settingSpreadsheetId,
        isActive: normalizeBoolean(row.isActive),
        sortOrder: Number(row.sortOrder || 0),
      }))
      .filter((term) => term.termKey && (includeInactive || term.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.termKey.localeCompare(b.termKey));
  }

  public saveTerms(terms: TermRecord[]): void {
    const ss = this.getSpreadsheet();
    const sheet = ensureSheet(ss, "Terms", TERM_HEADERS);
    replaceTable(
      sheet,
      TERM_HEADERS,
      terms.map((term) => [
        term.termKey,
        term.academicYear,
        term.semester,
        term.label,
        term.folderId,
        term.studentListSpreadsheetId,
        term.attendanceSpreadsheetId,
        term.settingSpreadsheetId,
        String(term.isActive),
        String(term.sortOrder),
      ]),
    );
  }

  public upsertTerm(term: TermRecord): void {
    const terms = this.getTerms(true);
    const nextTerms = terms.filter((item) => item.termKey !== term.termKey);
    nextTerms.push(term);
    this.saveTerms(nextTerms);
  }

  public getUsers(): UserRecord[] {
    const ss = this.getSpreadsheet();
    const sheet = ensureSheet(ss, "Users", USER_HEADERS);
    return readTable(sheet, USER_HEADERS)
      .map((row): UserRecord => ({
        email: row.email.toLowerCase(),
        role: row.role === "admin" ? "admin" : "teacher",
        displayName: row.displayName,
        allowedTermKeys: splitCsv(row.allowedTermKeys),
        allowedClassrooms: splitCsv(row.allowedClassrooms),
        isActive: normalizeBoolean(row.isActive),
      }))
      .filter((user) => user.email);
  }

  public saveUsers(users: UserRecord[]): void {
    const ss = this.getSpreadsheet();
    const sheet = ensureSheet(ss, "Users", USER_HEADERS);
    replaceTable(
      sheet,
      USER_HEADERS,
      users.map((user) => [
        user.email.toLowerCase(),
        user.role as UserRole,
        user.displayName,
        joinCsv(user.allowedTermKeys),
        joinCsv(user.allowedClassrooms),
        String(user.isActive),
      ]),
    );
  }
}

export const mainSettingsService = new MainSettingsService();
