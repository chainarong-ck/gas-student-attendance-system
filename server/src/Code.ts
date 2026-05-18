import { accessControlService } from "./services/AccessControlService";
import { appPropertiesService } from "./services/AppPropertiesService";
import { attendanceService } from "./services/AttendanceService";
import {
  DEFAULT_ATTENDANCE_STATUSES,
  mainSettingsService,
} from "./services/MainSettingsService";
import { studentService } from "./services/StudentService";
import { termRegistryService } from "./services/TermRegistryService";
import { termSetupService } from "./services/TermSetupService";
import {
  AppStatusResponse,
  AttendanceRecord,
  AttendanceResponse,
  BootstrapResponse,
  ClassroomRecord,
  CreateTermRequest,
  SettingsPayload,
  StatisticsRequest,
  StatisticsResponse,
  StudentRecord,
} from "./types";

export function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.HTML.HtmlOutput {
  void e;
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("Student Attendance System")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

export function api_getAppStatus(): AppStatusResponse {
  const missingProperties = appPropertiesService.getMissingPropertiesMustSet() ?? [];
  if (missingProperties.length > 0) {
    return {
      ready: false,
      missingProperties,
      currentUser: null,
      defaultTermKey: "",
    };
  }

  mainSettingsService.ensureSchema();
  const system = mainSettingsService.getSystemSettings();
  return {
    ready: true,
    missingProperties: [],
    currentUser: accessControlService.getCurrentUser(),
    defaultTermKey: system.defaultTermKey,
  };
}

export function api_saveInitialSettings(settings: { settingSheetId: string }): boolean {
  const settingSheetId = settings?.settingSheetId?.trim();
  if (!settingSheetId) return false;

  const saved = appPropertiesService.setSettingSheetId(settingSheetId);
  if (saved) {
    mainSettingsService.ensureSchema();
  }
  return saved;
}

export function api_getBootstrap(): BootstrapResponse {
  const system = mainSettingsService.getSystemSettings();
  const currentUser = accessControlService.getCurrentUser();
  if (!currentUser.isActive) {
    return {
      schoolName: system.schoolName,
      defaultTermKey: "",
      terms: [],
      currentUser,
      attendanceStatuses: DEFAULT_ATTENDANCE_STATUSES,
    };
  }

  const terms = accessControlService
    .filterTerms(mainSettingsService.getTerms(false))
    .map((term) => ({
      ...term,
      classrooms: accessControlService.filterClassrooms(
        termRegistryService.getClassrooms(term.termKey),
      ),
    }));

  const defaultTermIsAvailable = terms.some((term) => term.termKey === system.defaultTermKey);
  return {
    schoolName: system.schoolName,
    defaultTermKey: defaultTermIsAvailable ? system.defaultTermKey : terms[0]?.termKey ?? "",
    terms,
    currentUser,
    attendanceStatuses: DEFAULT_ATTENDANCE_STATUSES,
  };
}

export function api_createTerm(request: CreateTermRequest) {
  accessControlService.assertAdmin();
  return termSetupService.createTerm(request);
}

export function api_getStudents(request: {
  termKey: string;
  classroom: string;
}): StudentRecord[] {
  accessControlService.assertAdmin();
  accessControlService.assertTermAccess(request.termKey);
  accessControlService.assertClassroomAccess(request.classroom);
  return studentService.getStudents(request.termKey, request.classroom);
}

export function api_saveStudents(request: {
  termKey: string;
  classroom: string;
  students: StudentRecord[];
}): StudentRecord[] {
  accessControlService.assertAdmin();
  accessControlService.assertTermAccess(request.termKey);
  accessControlService.assertClassroomAccess(request.classroom);
  return studentService.saveStudents(request.termKey, request.classroom, request.students);
}

export function api_getAttendance(request: {
  termKey: string;
  classroom: string;
  date: string;
}): AttendanceResponse {
  accessControlService.assertTermAccess(request.termKey);
  accessControlService.assertClassroomAccess(request.classroom);
  return attendanceService.getAttendance(request.termKey, request.classroom, request.date);
}

export function api_saveAttendance(request: {
  termKey: string;
  classroom: string;
  date: string;
  records: AttendanceRecord[];
}): AttendanceResponse {
  accessControlService.assertTermAccess(request.termKey);
  accessControlService.assertClassroomAccess(request.classroom);
  return attendanceService.saveAttendance(
    request.termKey,
    request.classroom,
    request.date,
    request.records,
  );
}

export function api_getStatistics(request: StatisticsRequest): StatisticsResponse {
  accessControlService.assertTermAccess(request.termKey);
  if (request.scope) accessControlService.assertClassroomAccess(request.scope);
  const user = accessControlService.assertActiveUser();
  return attendanceService.getStatistics({
    ...request,
    classroomFilter:
      user.role === "teacher" && user.allowedClassrooms.length > 0
        ? user.allowedClassrooms
        : undefined,
  });
}

export function api_getSettings(): SettingsPayload {
  accessControlService.assertAdmin();
  return {
    system: mainSettingsService.getSystemSettings(),
    terms: mainSettingsService.getTerms(true),
    users: mainSettingsService.getUsers(),
  };
}

export function api_saveSettings(payload: SettingsPayload): SettingsPayload {
  accessControlService.assertAdmin();
  mainSettingsService.saveSystemSettings(payload.system);
  mainSettingsService.saveTerms(payload.terms);
  mainSettingsService.saveUsers(payload.users);
  return api_getSettings();
}

export function api_getClassrooms(request: {
  termKey: string;
  includeDisabled?: boolean;
}): ClassroomRecord[] {
  accessControlService.assertTermAccess(request.termKey);
  return accessControlService.filterClassrooms(
    termRegistryService.getClassrooms(request.termKey, Boolean(request.includeDisabled)),
  );
}
