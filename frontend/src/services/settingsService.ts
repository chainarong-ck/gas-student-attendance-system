import { callGas } from './gasClient';

export type AppStatus = {
	ready: boolean;
	missingProperties: string[];
};

export type InitialSettings = {
	settingSheetId: string;
};

export function getAppStatus() {
	return callGas<AppStatus>('api_getAppStatus');
}

export function saveInitialSettings(settings: InitialSettings) {
	return callGas<boolean>('api_saveInitialSettings', settings);
}
