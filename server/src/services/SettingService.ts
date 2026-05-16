import { appPropertiesService } from "./AppPropertiesService";

/**
 * @class SettingService
 * @description บริการสำหรับจัดการการตั้งค่าแอปพลิเคชัน (Spreadsheet)
 */
class SettingService {
  // Spreadsheet สำหรับจัดเก็บการตั้งค่า
  private ss: GoogleAppsScript.Spreadsheet.Spreadsheet | null = null;

  /**
   * @method constructor
   * @description สร้างอินสแตนซ์ใหม่ของ SettingService
   */
  constructor() {
    const settingSheetId = appPropertiesService.getSettingSheetId();
    if (settingSheetId) {
      this.ss = SpreadsheetApp.openById(settingSheetId);
    }
  }

}

export const settingService = new SettingService();