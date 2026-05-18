import { StudentRecord, TermRecord } from "../types";
import { ATTENDANCE_HEADERS, STUDENT_HEADERS } from "./TermSetupService";
import {
  ensureSheet,
  normalizeSheetDateHeader,
  readTable,
  replaceTable,
} from "./SpreadsheetTable";
import { termRegistryService } from "./TermRegistryService";

class StudentService {
  public getStudents(termKey: string, classroom: string): StudentRecord[] {
    const term = termRegistryService.requireTerm(termKey);
    const ss = SpreadsheetApp.openById(term.studentListSpreadsheetId);
    const sheet = ensureSheet(ss, classroom, STUDENT_HEADERS);
    return readTable(sheet, STUDENT_HEADERS)
      .map((row): StudentRecord => ({
        studentId: row.studentId,
        prefix: row.prefix,
        firstName: row.firstName,
        lastName: row.lastName,
        status: row.status || "มาเรียนปกติ",
      }))
      .filter((student) => student.studentId);
  }

  public saveStudents(
    termKey: string,
    classroom: string,
    students: StudentRecord[],
  ): StudentRecord[] {
    const term = termRegistryService.requireTerm(termKey);
    const normalizedStudents = students
      .map((student) => ({
        studentId: student.studentId.trim(),
        prefix: student.prefix.trim(),
        firstName: student.firstName.trim(),
        lastName: student.lastName.trim(),
        status: student.status.trim() || "มาเรียนปกติ",
      }))
      .filter((student) => student.studentId);

    const ss = SpreadsheetApp.openById(term.studentListSpreadsheetId);
    const sheet = ensureSheet(ss, classroom, STUDENT_HEADERS);
    replaceTable(
      sheet,
      STUDENT_HEADERS,
      normalizedStudents.map((student) => [
        student.studentId,
        student.prefix,
        student.firstName,
        student.lastName,
        student.status,
      ]),
    );

    this.syncAttendanceStudentRows(term, classroom, normalizedStudents.map((student) => student.studentId));
    return normalizedStudents;
  }

  public syncAttendanceStudentRows(
    term: TermRecord,
    classroom: string,
    studentIds: string[],
  ): void {
    const ss = SpreadsheetApp.openById(term.attendanceSpreadsheetId);
    const sheet = ensureSheet(ss, classroom, ATTENDANCE_HEADERS);
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const rawDateHeaders = headers.slice(1).map((value) => normalizeSheetDateHeader(value));
    const dateHeaders = rawDateHeaders.filter(
      (header, index) => header && rawDateHeaders.indexOf(header) === index,
    );
    const existingRows =
      sheet.getLastRow() > 1
        ? sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn).getValues()
        : [];
    const existingById = new Map<string, unknown[]>();
    existingRows.forEach((row) => {
      const id = String(row[0] ?? "").trim();
      if (!id) return;

      const valuesByDate: unknown[] = dateHeaders.map(() => "");
      rawDateHeaders.forEach((dateHeader, rawIndex) => {
        const targetIndex = dateHeaders.indexOf(dateHeader);
        if (targetIndex < 0) return;

        const value = row[rawIndex + 1];
        if (!valuesByDate[targetIndex] && value) {
          valuesByDate[targetIndex] = value;
        }
      });

      existingById.set(id, valuesByDate);
    });

    sheet.clearContents();
    sheet
      .getRange(1, 1, 1, dateHeaders.length + 1)
      .setNumberFormat("@")
      .setValues([["studentId", ...dateHeaders]]);
    if (studentIds.length > 0) {
      const rows = studentIds.map((studentId) => [
        studentId,
        ...(existingById.get(studentId) ?? dateHeaders.map(() => "")),
      ]);
      sheet.getRange(2, 1, rows.length, dateHeaders.length + 1).setValues(rows);
    }
  }
}

export const studentService = new StudentService();
