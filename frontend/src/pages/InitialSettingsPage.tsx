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
      .then(() => {
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
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10">
        <section className="grid w-full overflow-hidden rounded-4xl border border-white/10 bg-white/4 shadow-2xl shadow-cyan-950/40 backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative isolate flex flex-col justify-between gap-12 bg-cyan-500 px-8 py-10 text-slate-950 sm:px-10 lg:px-12">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.96),rgba(20,184,166,0.92)_48%,rgba(52,211,153,0.96))]" />

            <div>
              <p className="mb-4 inline-flex rounded-full bg-slate-950/10 px-4 py-2 text-sm font-semibold">
                Student Attendance System
              </p>
              <h1 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                ตั้งค่าเริ่มต้นให้พร้อมใช้งาน
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-800">
                เชื่อมต่อ Google Sheet สำหรับเก็บค่าระบบ เพื่อให้แอปสามารถโหลดข้อมูลและเริ่มบันทึกการเข้าเรียนได้ถูกต้อง
              </p>
            </div>

            <div className="rounded-2xl border border-slate-950/10 bg-white/35 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                Missing settings
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {missingProperties.length > 0 ? (
                  missingProperties.map((property) => (
                    <span
                      key={property}
                      className="rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white"
                    >
                      {property}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full bg-emerald-900 px-3 py-1 text-sm font-medium text-white">
                    No missing settings
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
            <div className="mx-auto max-w-xl">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  Initial setup
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                  เพิ่ม Setting Sheet ID
                </h2>
                <p className="mt-3 leading-7 text-slate-400">
                  วาง ID ของ Google Sheet ที่ใช้เก็บค่าตั้งต้นของระบบ แล้วกดบันทึกเพื่อรีเฟรชสถานะแอป
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="settingSheetId"
                    className="mb-2 block text-sm font-medium text-slate-200"
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
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
                  />
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    หา ID ได้จาก URL ของ Google Sheet ระหว่าง /d/ และ /edit
                  </p>
                </div>

                {errorMessage ? (
                  <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex w-full items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-base font-semibold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/25 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
