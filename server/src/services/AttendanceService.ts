import {
  AttendanceRecord,
  AttendanceResponse,
  AttendanceStatusCode,
  StatisticsRequest,
  StatisticsResponse,
  TermRecord,
} from "../types";
import { ATTENDANCE_HEADERS } from "./TermSetupService";
import { ensureSheet, normalizeSheetDateHeader } from "./SpreadsheetTable";
import { studentService } from "./StudentService";
import { termRegistryService } from "./TermRegistryService";

const VALID_STATUS_CODES = new Set(["", "P", "A", "L", "S"]);

function emptySummary(): Record<"P" | "A" | "L" | "S", number> {
  return { P: 0, A: 0, L: 0, S: 0 };
}

function addSummary(
  summary: Record<"P" | "A" | "L" | "S", number>,
  status: string,
): void {
  if (status === "P" || status === "A" || status === "L" || status === "S") {
    summary[status] += 1;
  }
}

class AttendanceService {
  public getAttendance(termKey: string, classroom: string, date: string): AttendanceResponse {
    const term = termRegistryService.requireTerm(termKey);
    const students = studentService.getStudents(termKey, classroom);
    studentService.syncAttendanceStudentRows(term, classroom, students.map((student) => student.studentId));

    const sheet = this.getAttendanceSheet(term, classroom);
    const dateColumn = this.findDateColumn(sheet, date);
    const records = dateColumn
      ? this.readStatusColumn(sheet, dateColumn).map((record) => ({
          studentId: record.studentId,
          status: record.status,
        }))
      : students.map((student) => ({
          studentId: student.studentId,
          status: "" as AttendanceStatusCode,
        }));

    return {
      termKey,
      classroom,
      date,
      students,
      records,
    };
  }

  public saveAttendance(
    termKey: string,
    classroom: string,
    date: string,
    records: AttendanceRecord[],
  ): AttendanceResponse {
    const term = termRegistryService.requireTerm(termKey);
    const students = studentService.getStudents(termKey, classroom);
    studentService.syncAttendanceStudentRows(term, classroom, students.map((student) => student.studentId));

    const sheet = this.getAttendanceSheet(term, classroom);
    const dateColumn = this.ensureDateColumn(sheet, date);
    const rowByStudentId = this.getRowByStudentId(sheet);
    const valuesByStudentId = new Map<string, AttendanceStatusCode>();
    records.forEach((record) => {
      const status = record.status || "";
      if (!VALID_STATUS_CODES.has(status)) {
        throw new Error(`Invalid attendance status: ${status}`);
      }
      valuesByStudentId.set(record.studentId, status as AttendanceStatusCode);
    });

    valuesByStudentId.forEach((status, studentId) => {
      const row = rowByStudentId.get(studentId);
      if (row) {
        sheet.getRange(row, dateColumn).setValue(status);
      }
    });

    return this.getAttendance(termKey, classroom, date);
  }

  public getStatistics(request: StatisticsRequest): StatisticsResponse {
    const term = termRegistryService.requireTerm(request.termKey);
    const classrooms = termRegistryService
      .getClassrooms(request.termKey)
      .filter((classroom) => !request.scope || classroom.sheetName === request.scope)
      .filter(
        (classroom) =>
          !request.classroomFilter ||
          request.classroomFilter.length === 0 ||
          request.classroomFilter.includes(classroom.sheetName),
      );
    const today = this.today();
    const fromDate = request.fromDate || today;
    const toDate = request.toDate || fromDate;

    const response: StatisticsResponse = {
      summary: emptySummary(),
      totalStudents: 0,
      checkedClassroomsToday: [],
      missingClassroomsToday: [],
      byClassroom: [],
      byStudent: [],
    };

    classrooms.forEach((classroom) => {
      const students = studentService.getStudents(request.termKey, classroom.sheetName);
      const activeStudents = students.filter((student) => student.status !== "ลาออก");
      response.totalStudents += activeStudents.length;

      const sheet = this.getAttendanceSheet(term, classroom.sheetName);
      const headerDates = this.getHeaderDates(sheet);
      const dateIndexes = headerDates
        .map((date, index) => ({ date, index }))
        .filter((item) => item.date >= fromDate && item.date <= toDate);

      const classroomSummary = emptySummary();
      const studentSummaries = new Map<string, Record<"P" | "A" | "L" | "S", number>>();
      activeStudents.forEach((student) => studentSummaries.set(student.studentId, emptySummary()));

      const values =
        sheet.getLastRow() > 1 && sheet.getLastColumn() > 1
          ? sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues()
          : [];

      let todayHasAnyValue = false;
      values.forEach((row) => {
        const studentId = String(row[0] ?? "").trim();
        const studentSummary = studentSummaries.get(studentId);
        if (!studentSummary) return;

        dateIndexes.forEach((item) => {
          const status = String(row[item.index + 1] ?? "").trim();
          addSummary(classroomSummary, status);
          addSummary(response.summary, status);
          addSummary(studentSummary, status);
          if (item.date === today && status) todayHasAnyValue = true;
        });
      });

      if (todayHasAnyValue) {
        response.checkedClassroomsToday.push(classroom.sheetName);
      } else {
        response.missingClassroomsToday.push(classroom.sheetName);
      }

      response.byClassroom.push({
        classroom: classroom.sheetName,
        studentCount: activeStudents.length,
        summary: classroomSummary,
      });

      activeStudents.forEach((student) => {
        response.byStudent.push({
          studentId: student.studentId,
          fullName: `${student.prefix}${student.firstName} ${student.lastName}`.trim(),
          classroom: classroom.sheetName,
          summary: studentSummaries.get(student.studentId) ?? emptySummary(),
        });
      });
    });

    return response;
  }

  private getAttendanceSheet(
    term: TermRecord,
    classroom: string,
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = SpreadsheetApp.openById(term.attendanceSpreadsheetId);
    return ensureSheet(ss, classroom, ATTENDANCE_HEADERS);
  }

  private ensureDateColumn(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    date: string,
  ): number {
    this.validateDate(date);
    const existingColumn = this.findDateColumn(sheet, date);
    if (existingColumn) return existingColumn;

    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const newColumn = lastColumn + 1;
    this.setDateHeader(sheet, newColumn, date);
    return newColumn;
  }

  private findDateColumn(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    date: string,
  ): number | null {
    this.validateDate(date);

    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const matchingColumns = headers
      .map((value, index) => ({
        column: index + 1,
        date: normalizeSheetDateHeader(value),
      }))
      .filter((header) => header.date === date)
      .map((header) => header.column);

    if (matchingColumns.length > 0) {
      return this.mergeDuplicateDateColumns(sheet, date, matchingColumns);
    }

    return null;
  }

  private validateDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error("date must use YYYY-MM-DD format.");
    }
  }

  private mergeDuplicateDateColumns(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    date: string,
    columns: number[],
  ): number {
    const sortedColumns = [...columns].sort((a, b) => a - b);
    const primaryColumn = sortedColumns[0];
    this.setDateHeader(sheet, primaryColumn, date);

    if (sortedColumns.length === 1 || sheet.getLastRow() < 2) {
      sortedColumns
        .slice(1)
        .sort((a, b) => b - a)
        .forEach((column) => sheet.deleteColumn(column));
      return primaryColumn;
    }

    const rowCount = sheet.getLastRow() - 1;
    const primaryRange = sheet.getRange(2, primaryColumn, rowCount, 1);
    const primaryValues = primaryRange.getValues();

    sortedColumns.slice(1).forEach((column) => {
      const duplicateValues = sheet.getRange(2, column, rowCount, 1).getValues();
      duplicateValues.forEach((row, index) => {
        if (!primaryValues[index][0] && row[0]) {
          primaryValues[index][0] = row[0];
        }
      });
    });

    primaryRange.setValues(primaryValues);
    sortedColumns
      .slice(1)
      .sort((a, b) => b - a)
      .forEach((column) => sheet.deleteColumn(column));

    return primaryColumn;
  }

  private setDateHeader(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    column: number,
    date: string,
  ): void {
    sheet.getRange(1, column).setNumberFormat("@").setValue(date);
  }

  private readStatusColumn(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    dateColumn: number,
  ): AttendanceRecord[] {
    if (sheet.getLastRow() < 2) return [];

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, dateColumn).getValues();
    return values
      .map((row) => ({
        studentId: String(row[0] ?? "").trim(),
        status: String(row[dateColumn - 1] ?? "").trim() as AttendanceStatusCode,
      }))
      .filter((record) => record.studentId);
  }

  private getRowByStudentId(sheet: GoogleAppsScript.Spreadsheet.Sheet): Map<string, number> {
    const rows = new Map<string, number>();
    if (sheet.getLastRow() < 2) return rows;

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    values.forEach((row, index) => {
      const studentId = String(row[0] ?? "").trim();
      if (studentId) rows.set(studentId, index + 2);
    });
    return rows;
  }

  private getHeaderDates(sheet: GoogleAppsScript.Spreadsheet.Sheet): string[] {
    if (sheet.getLastColumn() < 2) return [];
    return sheet
      .getRange(1, 2, 1, sheet.getLastColumn() - 1)
      .getValues()[0]
      .map((value) => normalizeSheetDateHeader(value))
      .filter(Boolean);
  }

  private today(): string {
    const timezone = Session.getScriptTimeZone() || "Asia/Bangkok";
    return Utilities.formatDate(new Date(), timezone, "yyyy-MM-dd");
  }
}

export const attendanceService = new AttendanceService();
