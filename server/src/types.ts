export type UserRole = "admin" | "teacher";

export type AttendanceStatusCode = "P" | "A" | "L" | "S" | "";

export type TermRecord = {
  termKey: string;
  academicYear: string;
  semester: string;
  label: string;
  folderId: string;
  studentListSpreadsheetId: string;
  attendanceSpreadsheetId: string;
  settingSpreadsheetId: string;
  isActive: boolean;
  sortOrder: number;
};

export type ClassroomRecord = {
  grade: string;
  room: string;
  sheetName: string;
  enabled: boolean;
};

export type StudentRecord = {
  studentId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  status: string;
};

export type UserRecord = {
  email: string;
  role: UserRole;
  displayName: string;
  allowedTermKeys: string[];
  allowedClassrooms: string[];
  isActive: boolean;
};

export type CurrentUser = UserRecord & {
  isConfigured: boolean;
};

export type SystemSettings = {
  schoolName: string;
  defaultTermKey: string;
};

export type BootstrapResponse = {
  schoolName: string;
  defaultTermKey: string;
  terms: Array<TermRecord & { classrooms: ClassroomRecord[] }>;
  currentUser: CurrentUser;
  attendanceStatuses: AttendanceStatus[];
};

export type AppStatusResponse = {
  ready: boolean;
  missingProperties: string[];
  currentUser: CurrentUser | null;
  defaultTermKey: string;
};

export type AttendanceStatus = {
  code: Exclude<AttendanceStatusCode, "">;
  label: string;
  countsAsPresent: boolean;
};

export type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatusCode;
};

export type AttendanceResponse = {
  termKey: string;
  classroom: string;
  date: string;
  students: StudentRecord[];
  records: AttendanceRecord[];
};

export type StatisticsRequest = {
  termKey: string;
  scope?: string;
  fromDate?: string;
  toDate?: string;
  classroomFilter?: string[];
};

export type StatisticsResponse = {
  summary: Record<Exclude<AttendanceStatusCode, "">, number>;
  totalStudents: number;
  checkedClassroomsToday: string[];
  missingClassroomsToday: string[];
  byClassroom: Array<{
    classroom: string;
    studentCount: number;
    summary: Record<Exclude<AttendanceStatusCode, "">, number>;
  }>;
  byStudent: Array<{
    studentId: string;
    fullName: string;
    classroom: string;
    summary: Record<Exclude<AttendanceStatusCode, "">, number>;
  }>;
};

export type SettingsPayload = {
  system: SystemSettings;
  terms: TermRecord[];
  users: UserRecord[];
};

export type CreateTermRequest = {
  termKey: string;
  academicYear: string;
  semester: string;
  label: string;
  classrooms: ClassroomRecord[];
};
