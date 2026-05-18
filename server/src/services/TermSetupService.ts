import { ClassroomRecord, CreateTermRequest, TermRecord } from "../types";
import { appPropertiesService } from "./AppPropertiesService";
import { CLASSROOM_HEADERS } from "./TermRegistryService";
import { DEFAULT_ATTENDANCE_STATUSES, mainSettingsService } from "./MainSettingsService";
import { ensureSheet, removeDefaultSheets, replaceTable } from "./SpreadsheetTable";

const STUDENT_HEADERS = ["studentId", "prefix", "firstName", "lastName", "status"];
const ATTENDANCE_HEADERS = ["studentId"];
const STATUS_HEADERS = ["code", "label", "countsAsPresent"];

class TermSetupService {
  public createTerm(request: CreateTermRequest): TermRecord {
    const termKey = request.termKey.trim();
    if (!termKey) throw new Error("termKey is required.");
    if (mainSettingsService.getTerms(true).some((term) => term.termKey === termKey)) {
      throw new Error(`Term already exists: ${termKey}`);
    }

    const classrooms = this.normalizeClassrooms(request.classrooms);
    if (classrooms.length === 0) {
      throw new Error("At least one classroom is required.");
    }

    const label = request.label.trim() || termKey;
    const parentFolder = this.getMainSettingParentFolder();
    const folder = parentFolder.createFolder(label);
    const studentList = this.createSpreadsheetInFolder("Student_List", folder);
    const attendance = this.createSpreadsheetInFolder("Attendance_Statistics", folder);
    const setting = this.createSpreadsheetInFolder("Setting", folder);

    this.setupStudentList(studentList, classrooms);
    this.setupAttendance(attendance, classrooms);
    this.setupTermSetting(setting, classrooms);

    const term: TermRecord = {
      termKey,
      academicYear: request.academicYear.trim(),
      semester: request.semester.trim(),
      label,
      folderId: folder.getId(),
      studentListSpreadsheetId: studentList.getId(),
      attendanceSpreadsheetId: attendance.getId(),
      settingSpreadsheetId: setting.getId(),
      isActive: true,
      sortOrder: mainSettingsService.getTerms(true).length + 1,
    };

    mainSettingsService.upsertTerm(term);

    const system = mainSettingsService.getSystemSettings();
    if (!system.defaultTermKey) {
      mainSettingsService.saveSystemSettings({ ...system, defaultTermKey: term.termKey });
    }

    return term;
  }

  private normalizeClassrooms(classrooms: ClassroomRecord[]): ClassroomRecord[] {
    return classrooms
      .map((classroom) => {
        const grade = classroom.grade.trim().toUpperCase();
        const room = classroom.room.trim();
        return {
          grade,
          room,
          sheetName: classroom.sheetName.trim() || `${grade}-${room}`,
          enabled: classroom.enabled,
        };
      })
      .filter((classroom) => classroom.grade && classroom.room && classroom.sheetName);
  }

  private getMainSettingParentFolder(): GoogleAppsScript.Drive.Folder {
    const settingSheetId = appPropertiesService.getSettingSheetId();
    if (!settingSheetId) return DriveApp.getRootFolder();

    const parents = DriveApp.getFileById(settingSheetId).getParents();
    return parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  }

  private createSpreadsheetInFolder(
    name: string,
    folder: GoogleAppsScript.Drive.Folder,
  ): GoogleAppsScript.Spreadsheet.Spreadsheet {
    const ss = SpreadsheetApp.create(name);
    DriveApp.getFileById(ss.getId()).moveTo(folder);
    return ss;
  }

  private setupStudentList(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    classrooms: ClassroomRecord[],
  ): void {
    classrooms.forEach((classroom) => {
      ensureSheet(ss, classroom.sheetName, STUDENT_HEADERS);
    });
    removeDefaultSheets(ss, classrooms.map((classroom) => classroom.sheetName));
  }

  private setupAttendance(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    classrooms: ClassroomRecord[],
  ): void {
    classrooms.forEach((classroom) => {
      ensureSheet(ss, classroom.sheetName, ATTENDANCE_HEADERS);
    });
    removeDefaultSheets(ss, classrooms.map((classroom) => classroom.sheetName));
  }

  private setupTermSetting(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    classrooms: ClassroomRecord[],
  ): void {
    const classroomSheet = ensureSheet(ss, "Classrooms", CLASSROOM_HEADERS);
    replaceTable(
      classroomSheet,
      CLASSROOM_HEADERS,
      classrooms.map((classroom) => [
        classroom.grade,
        classroom.room,
        classroom.sheetName,
        String(classroom.enabled),
      ]),
    );

    const statusSheet = ensureSheet(ss, "AttendanceStatuses", STATUS_HEADERS);
    replaceTable(
      statusSheet,
      STATUS_HEADERS,
      DEFAULT_ATTENDANCE_STATUSES.map((status) => [
        status.code,
        status.label,
        String(status.countsAsPresent),
      ]),
    );
    removeDefaultSheets(ss, ["Classrooms", "AttendanceStatuses"]);
  }
}

export const termSetupService = new TermSetupService();
export { STUDENT_HEADERS, ATTENDANCE_HEADERS };
