import { ClassroomRecord, TermRecord } from "../types";
import { mainSettingsService } from "./MainSettingsService";
import { ensureSheet, normalizeBoolean, readTable } from "./SpreadsheetTable";

const CLASSROOM_HEADERS = ["grade", "room", "sheetName", "enabled"];

class TermRegistryService {
  public getTerms(includeInactive = true): TermRecord[] {
    return mainSettingsService.getTerms(includeInactive);
  }

  public requireTerm(termKey: string): TermRecord {
    const term = this.getTerms(true).find((item) => item.termKey === termKey);
    if (!term) {
      throw new Error(`Term not found: ${termKey}`);
    }
    return term;
  }

  public getClassrooms(termKey: string, includeDisabled = false): ClassroomRecord[] {
    const term = this.requireTerm(termKey);
    const ss = SpreadsheetApp.openById(term.settingSpreadsheetId);
    const sheet = ensureSheet(ss, "Classrooms", CLASSROOM_HEADERS);

    return readTable(sheet, CLASSROOM_HEADERS)
      .map((row): ClassroomRecord => ({
        grade: row.grade,
        room: row.room,
        sheetName: row.sheetName || `${row.grade}-${row.room}`,
        enabled: normalizeBoolean(row.enabled),
      }))
      .filter((classroom) => classroom.sheetName && (includeDisabled || classroom.enabled));
  }
}

export const termRegistryService = new TermRegistryService();
export { CLASSROOM_HEADERS };
