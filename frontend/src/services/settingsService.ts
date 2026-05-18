import { callGas } from './gasClient';

export type UserRole = 'admin' | 'teacher';
export type AttendanceStatusCode = 'P' | 'A' | 'L' | 'S' | '';

export type AppStatus = {
	ready: boolean;
	missingProperties: string[];
	currentUser: CurrentUser | null;
	defaultTermKey: string;
};

export type InitialSettings = {
	settingSheetId: string;
};

export type Term = {
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

export type Classroom = {
	grade: string;
	room: string;
	sheetName: string;
	enabled: boolean;
};

export type TermWithClassrooms = Term & {
	classrooms: Classroom[];
};

export type Student = {
	studentId: string;
	prefix: string;
	firstName: string;
	lastName: string;
	status: string;
};

export type User = {
	email: string;
	role: UserRole;
	displayName: string;
	allowedTermKeys: string[];
	allowedClassrooms: string[];
	isActive: boolean;
};

export type CurrentUser = User & {
	isConfigured: boolean;
};

export type AttendanceStatus = {
	code: Exclude<AttendanceStatusCode, ''>;
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
	students: Student[];
	records: AttendanceRecord[];
};

export type BootstrapResponse = {
	schoolName: string;
	defaultTermKey: string;
	terms: TermWithClassrooms[];
	currentUser: CurrentUser;
	attendanceStatuses: AttendanceStatus[];
};

export type StatisticsResponse = {
	summary: Record<Exclude<AttendanceStatusCode, ''>, number>;
	totalStudents: number;
	checkedClassroomsToday: string[];
	missingClassroomsToday: string[];
	byClassroom: Array<{
		classroom: string;
		studentCount: number;
		summary: Record<Exclude<AttendanceStatusCode, ''>, number>;
	}>;
	byStudent: Array<{
		studentId: string;
		fullName: string;
		classroom: string;
		summary: Record<Exclude<AttendanceStatusCode, ''>, number>;
	}>;
};

export type SettingsPayload = {
	system: {
		schoolName: string;
		defaultTermKey: string;
	};
	terms: Term[];
	users: User[];
};

export type CreateTermRequest = {
	termKey: string;
	academicYear: string;
	semester: string;
	label: string;
	classrooms: Classroom[];
};

export function getAppStatus() {
	return callGas<AppStatus>('api_getAppStatus');
}

export function saveInitialSettings(settings: InitialSettings) {
	return callGas<boolean>('api_saveInitialSettings', settings);
}

export function getBootstrap() {
	return callGas<BootstrapResponse>('api_getBootstrap');
}

export function createTerm(request: CreateTermRequest) {
	return callGas<Term>('api_createTerm', request);
}

export function getStudents(termKey: string, classroom: string) {
	return callGas<Student[]>('api_getStudents', { termKey, classroom });
}

export function saveStudents(termKey: string, classroom: string, students: Student[]) {
	return callGas<Student[]>('api_saveStudents', { termKey, classroom, students });
}

export function getAttendance(termKey: string, classroom: string, date: string) {
	return callGas<AttendanceResponse>('api_getAttendance', { termKey, classroom, date });
}

export function saveAttendance(
	termKey: string,
	classroom: string,
	date: string,
	records: AttendanceRecord[],
) {
	return callGas<AttendanceResponse>('api_saveAttendance', {
		termKey,
		classroom,
		date,
		records,
	});
}

export function getStatistics(
	termKey: string,
	options: { scope?: string; fromDate?: string; toDate?: string } = {},
) {
	return callGas<StatisticsResponse>('api_getStatistics', { termKey, ...options });
}

export function getSettings() {
	return callGas<SettingsPayload>('api_getSettings');
}

export function saveSettings(payload: SettingsPayload) {
	return callGas<SettingsPayload>('api_saveSettings', payload);
}
