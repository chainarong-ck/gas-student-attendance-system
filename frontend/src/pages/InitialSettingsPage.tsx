import { useState, type FormEvent } from 'react';
import { saveInitialSettings } from '../services/settingsService';

type InitialSettingsPageProps = {
  missingProperties: string[];
  onSaved: () => void;
};

export default function InitialSettingsPage({
  missingProperties,
  onSaved,
}: InitialSettingsPageProps) {
  const [settingSheetId, setSettingSheetId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    saveInitialSettings({ settingSheetId })
      .then((saved) => {
        if (!saved) {
          throw new Error('Unable to save Setting Sheet ID');
        }
        onSaved();
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
      })
      .finally(() => {
        setIsSaving(false);
      });
  }

  return (
    <main className="setup-shell min-vh-100">
      <div className="container-xl min-vh-100 d-flex align-items-center py-5">
        <section className="setup-card rounded-4 overflow-hidden w-100 border">
          <div className="row g-0">
          <div className="col-lg-5 setup-hero d-flex flex-column justify-content-between gap-5 p-4 p-sm-5">
            <div>
              <p className="badge rounded-pill setup-badge-soft text-dark px-3 py-2 mb-4">
                Student Attendance System
              </p>
              <h1 className="display-5 fw-bold lh-sm">
                ตั้งค่าเริ่มต้นให้พร้อมใช้งาน
              </h1>
              <p className="lh-lg text-dark mb-0 mt-4">
                เชื่อมต่อ Google Sheet สำหรับเก็บค่าระบบ เพื่อให้แอปสามารถโหลดข้อมูลและเริ่มบันทึกการเข้าเรียนได้ถูกต้อง
              </p>
            </div>

            <div className="setup-missing-box rounded-3 border p-4">
              <p className="small fw-bold text-uppercase app-letter-wide text-dark mb-0">
                Missing settings
              </p>
              <div className="d-flex flex-wrap gap-2 mt-3">
                {missingProperties.length > 0 ? (
                  missingProperties.map((property) => (
                    <span
                      key={property}
                      className="badge rounded-pill text-bg-dark"
                    >
                      {property}
                    </span>
                  ))
                ) : (
                  <span className="badge rounded-pill text-bg-success">
                    No missing settings
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-7 bg-dark px-4 py-5 p-sm-5">
            <div className="mx-auto app-setup-form">
              <div className="mb-4">
                <p className="small fw-bold text-uppercase app-letter-wide text-info mb-0">
                  Initial setup
                </p>
                <h2 className="h2 fw-bold text-white mt-3">
                  เพิ่ม Setting Sheet ID
                </h2>
                <p className="lh-lg text-white-50 mb-0 mt-3">
                  วาง ID ของ Google Sheet ที่ใช้เก็บค่าตั้งต้นของระบบ แล้วกดบันทึกเพื่อรีเฟรชสถานะแอป
                </p>
              </div>

              <form onSubmit={handleSubmit} className="vstack gap-4">
                <div>
                  <label
                    htmlFor="settingSheetId"
                    className="form-label text-light"
                  >
                    Setting Sheet ID
                  </label>
                  <input
                    id="settingSheetId"
                    name="settingSheetId"
                    type="text"
                    value={settingSheetId}
                    onChange={(event) => setSettingSheetId(event.target.value)}
                    placeholder="เช่น 1AbCDeFgHiJkLmNoP..."
                    required
                    className="form-control form-control-lg bg-black border-secondary text-white"
                  />
                  <p className="form-text text-white-50">
                    หา ID ได้จาก URL ของ Google Sheet ระหว่าง /d/ และ /edit
                  </p>
                </div>

                {errorMessage ? (
                  <div className="alert alert-danger mb-0" role="alert">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-info btn-lg w-100 fw-semibold"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </form>
            </div>
          </div>
          </div>
        </section>
      </div>
    </main>
  )
}
