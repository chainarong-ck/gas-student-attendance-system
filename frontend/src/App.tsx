import { useCallback, useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import AttendancePage from './pages/AttendancePage';
import HomePage from './pages/HomePage';
import InitialSettingsPage from './pages/InitialSettingsPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import { getAppStatus, type AppStatus } from './services/settingsService';

function App() {
  const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  const refreshAppStatus = useCallback(() => {
    getAppStatus()
      .then((response) => {
        setStatusError(null);
        setAppStatus(response);
      })
      .catch((error: Error) => {
        setStatusError(error.message);
      });
  }, []);

  useEffect(() => {
    getAppStatus()
      .then((response) => {
        setStatusError(null);
        setAppStatus(response);
      })
      .catch((error: Error) => {
        setStatusError(error.message);
      });
  }, []);

  if (statusError) {
    return <div>Unable to load app status: {statusError}</div>;
  }

  if (!appStatus) {
    return <div>Loading...</div>;
  }

  if (!appStatus.ready) {
    return (
      <InitialSettingsPage
        missingProperties={appStatus.missingProperties}
        onSaved={refreshAppStatus}
      />
    );
  }

  return (
    <HashRouter>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/students">Students</Link>
        <Link to="/attendance">Attendance</Link>
        <Link to="/settings">Settings</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App
