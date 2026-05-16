/**
 * @class AppPropertiesService
 * @description บริการสำหรับจัดการการกำหนดค่าแอปพลิเคชัน (Script Properties)
 */
class AppPropertiesService {
  // ชื่อคีย์สำหรับเก็บค่าใน App Properties
  private readonly APP_CONFIG_KEY = ["SETTING_SHEET_ID"];

  // ชื่อคีย์ที่จำเป็นต้องตั้งค่า
  private readonly APP_CONFIG_KEY_MUST_SET = ["SETTING_SHEET_ID"];

  // เก็บค่าที่อ่านได้จาก App Properties
  private appProperties: Record<string, string> = {};

  // สถานะว่าได้อ่านค่าจาก App Properties แล้วหรือยัง
  private appProperties_Geted: boolean = false;

  /**
   * @method constructor
   * @description สร้างอ็อบเจกต์ AppPropertiesService และรับคุณสมบัติทั้งหมดของแอปพลิเคชัน
   */
  constructor() {
    this.getAppProperties();
  }

  /**
   * @method getAppProperties
   * @description รับคุณสมบัติทั้งหมดของแอปพลิเคชัน
   * @param {boolean} force - บังคับให้รับคุณสมบัติทั้งหมดใหม่
   * @returns {Record<string, string>} คุณสมบัติทั้งหมดของแอปพลิเคชัน
   */
  public getAppProperties(force: boolean = false): Record<string, string> {
    if (this.appProperties_Geted && !force) {
      return this.appProperties;
    }
    try {
      const allProperties =
        PropertiesService.getScriptProperties().getProperties();
      const appProperties: Record<string, string> = {};
      this.APP_CONFIG_KEY.forEach((key) => {
        if (allProperties[key] && allProperties[key] !== "") {
          appProperties[key] = allProperties[key];
        }
      });
      this.appProperties = appProperties;
      this.appProperties_Geted = true;
      return this.appProperties;
    } catch (error) {
      Logger.log(error);
      return {};
    }
  }

  /**
   * @method getMissingProperties
   * @description รับรายการคุณสมบัติที่หายไปของแอปพลิเคชัน
   * @returns {string[] | null} อาร์เรย์ของชื่อคุณสมบัติที่หายไป หรือ null ถ้ามีคุณสมบัติครบถ้วน
   */
  public getMissingProperties(): string[] | null {
    const appProperties = this.getAppProperties();
    const missingProperties = this.APP_CONFIG_KEY.filter(
      (key) => !appProperties[key] || appProperties[key] === "",
    );
    if (missingProperties.length > 0) {
      return missingProperties;
    }
    return null;
  }

  /**
   * @method getMissingPropertiesMustSet
   * @description รับรายการคุณสมบัติที่ต้องตั้งค่า
   * @returns {string[] | null} อาร์เรย์ของชื่อคุณสมบัติที่ต้องตั้งค่า หรือ null ถ้ามีคุณสมบัติครบถ้วน
   */
  public getMissingPropertiesMustSet(): string[] | null {
    const appProperties = this.getAppProperties();
    const missingProperties = this.APP_CONFIG_KEY_MUST_SET.filter(
      (key) => !appProperties[key] || appProperties[key] === "",
    );
    if (missingProperties.length > 0) {
      return missingProperties;
    }
    return null;
  }

  /**
   * @method getSettingSheetId
   * @description รับรหัสสเปรดชีตการตั้งค่า
   * @returns {string} รหัสสเปรดชีตการตั้งค่า
   */
  public getSettingSheetId(): string {
    return this.appProperties["SETTING_SHEET_ID"];
  }

  /**
   * @method setSettingSheetId
   * @description ตั้งค่ารหัสสเปรดชีตการตั้งค่า
   * @param {string} settingSheetId - รหัสสเปรดชีตการตั้งค่า
   * @returns {boolean} true ถ้าตั้งค่าสำเร็จ, false ถ้าไม่สำเร็จ
   */
  public setSettingSheetId(settingSheetId: string): boolean {
    try {
      PropertiesService.getScriptProperties().setProperty(
        "SETTING_SHEET_ID",
        settingSheetId,
      );
      this.appProperties["SETTING_SHEET_ID"] = settingSheetId;
      return true;
    } catch (error) {
      Logger.log(error);
      return false;
    }
  }

}

export const appPropertiesService = new AppPropertiesService();