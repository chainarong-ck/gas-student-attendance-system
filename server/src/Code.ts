import { appPropertiesService } from './services/AppPropertiesService';

/**
 * @function doGet
 * @description จัดการคำขอ HTTP GET และให้บริการหน้าแอปพลิเคชันเว็บ
 *              ฟังก์ชันนี้จะถูกเรียกเมื่อมีการเข้าถึง URL ของแอปพลิเคชันผ่านเบราว์เซอร์
 * @param {GoogleAppsScript.Events.DoGet} e อ็อบเจกต์ที่เก็บข้อมูลคำขอ
 * @returns {GoogleAppsScript.HTML.HtmlOutput} ผลลัพธ์ HTML ที่จะส่งกลับไปยังผู้ใช้
 */
export function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Student Attendance System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * @function api_getAppStatus
 * @description รับสถานะของแอปพลิเคชัน
 * @returns {Object} สถานะของแอปพลิเคชัน
 */
export function api_getAppStatus(): {
  ready: boolean;
  missingProperties: string[];
} {
  const missingProperties =
    appPropertiesService.getMissingPropertiesMustSet() ?? [];

  return {
    ready: missingProperties.length === 0,
    missingProperties,
  };
}

/**
 * @function api_saveInitialSettings
 * @description บันทึกการตั้งค่าเริ่มต้นของแอปพลิเคชัน
 * @param {Object} settings การตั้งค่าที่จะบันทึก
 * @param {string} settings.settingSheetId รหัสสเปรดชีตการตั้งค่า
 * @returns {boolean} true ถ้าบันทึกสำเร็จ, false ถ้าไม่สำเร็จ
 */
export function api_saveInitialSettings(settings: {
  settingSheetId: string;
}): boolean {
  const settingSheetId = settings?.settingSheetId?.trim();

  if (!settingSheetId) {
    return false;
  }

  return appPropertiesService.setSettingSheetId(settingSheetId);
}
