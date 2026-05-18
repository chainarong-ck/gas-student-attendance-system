import { useCallback, useEffect, useMemo, useState } from 'react';
import { HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import AttendancePage from './pages/AttendancePage';
import HomePage from './pages/HomePage';
import InitialSettingsPage from './pages/InitialSettingsPage';
import SettingsPage from './pages/SettingsPage';
import StudentsPage from './pages/StudentsPage';
import {
	getAppStatus,
	getBootstrap,
	type AppStatus,
	type BootstrapResponse,
	type TermWithClassrooms,
} from './services/settingsService';

function today() {
	const date = new Date();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

function Navigation({
	bootstrap,
	selectedTermKey,
	onTermChange,
}: {
	bootstrap: BootstrapResponse;
	selectedTermKey: string;
	onTermChange: (termKey: string) => void;
}) {
	const location = useLocation();
	const navItems = [
		{ to: '/', label: 'Dashboard' },
		{ to: '/attendance', label: 'Attendance' },
		{ to: '/students', label: 'Students', adminOnly: true },
		{ to: '/statistics', label: 'Statistics' },
		{ to: '/settings', label: 'Settings', adminOnly: true },
	];
	const visibleItems = navItems.filter(
		(item) => !item.adminOnly || bootstrap.currentUser.role === 'admin',
	);

	return (
		<header className="border-bottom bg-white">
			<div className="container-xxl d-flex flex-column flex-lg-row align-items-lg-center justify-content-lg-between gap-3 px-3 px-sm-4 py-3">
				<div>
					<p className="small fw-bold text-uppercase text-success app-letter-wide mb-1">
						Student Attendance System
					</p>
					<h1 className="h4 fw-bold text-body-emphasis mb-0">{bootstrap.schoolName}</h1>
				</div>

				<div className="d-flex flex-column flex-sm-row align-items-sm-center gap-2 gap-sm-3">
					<select
						value={selectedTermKey}
						onChange={(event) => onTermChange(event.target.value)}
						className="form-select form-select-sm app-term-select"
					>
						{bootstrap.terms.map((term) => (
							<option key={term.termKey} value={term.termKey}>
								{term.label}
							</option>
						))}
					</select>
					<div className="small text-secondary">
						{bootstrap.currentUser.displayName || bootstrap.currentUser.email || 'User'} ·{' '}
						{bootstrap.currentUser.role}
					</div>
				</div>
			</div>

			<nav className="container-xxl nav nav-pills flex-nowrap gap-2 overflow-x-auto px-3 px-sm-4 pb-3">
				{visibleItems.map((item) => {
					const active = location.pathname === item.to;
					return (
						<Link
							key={item.to}
							to={item.to}
							className={`nav-link text-nowrap px-3 py-2 ${
								active ? 'active bg-success' : 'text-body-secondary'
							}`}
						>
							{item.label}
						</Link>
					);
				})}
			</nav>
		</header>
	);
}

function LoadingScreen() {
	return (
		<main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary px-3">
			<div className="card shadow-sm">
				<div className="card-body text-secondary">
				Loading attendance system...
				</div>
			</div>
		</main>
	);
}

function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
	return (
		<main className="min-vh-100 d-flex align-items-center justify-content-center app-error-bg px-3">
			<div className="card shadow-sm app-readable-card border-danger-subtle">
				<div className="card-body p-4">
				<h1 className="h5 fw-bold text-danger-emphasis">Unable to load application</h1>
				<p className="small lh-lg text-danger mb-0 mt-2">{message}</p>
				<button
					type="button"
					onClick={onRetry}
					className="btn btn-danger mt-4"
				>
					Retry
				</button>
				</div>
			</div>
		</main>
	);
}

function NoAccessScreen({ bootstrap }: { bootstrap: BootstrapResponse }) {
	return (
		<main className="min-vh-100 d-flex align-items-center justify-content-center bg-body-tertiary px-3">
			<div className="card shadow-sm app-readable-card border-warning-subtle">
				<div className="card-body p-4">
				<p className="small fw-bold text-uppercase text-warning-emphasis app-letter-wide mb-2">
					Account not allowed
				</p>
				<h1 className="h4 fw-bold text-body-emphasis">
					บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน
				</h1>
				<p className="small lh-lg text-secondary mb-0 mt-3">
					กรุณาให้ผู้ดูแลระบบเพิ่มอีเมล {bootstrap.currentUser.email || 'ของคุณ'} ในหน้า
					Settings ของระบบ
				</p>
				</div>
			</div>
		</main>
	);
}

function App() {
	const [appStatus, setAppStatus] = useState<AppStatus | null>(null);
	const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
	const [statusError, setStatusError] = useState<string | null>(null);
	const [selectedTermKey, setSelectedTermKey] = useState('');
	const [currentDate] = useState(today());

	const refreshAll = useCallback(() => {
		setStatusError(null);
		getAppStatus()
			.then((status) => {
				setAppStatus(status);
				if (!status.ready) {
					setBootstrap(null);
					return null;
				}
				return getBootstrap();
			})
			.then((nextBootstrap) => {
				if (!nextBootstrap) return;
				setBootstrap(nextBootstrap);
				setSelectedTermKey((current) => current || nextBootstrap.defaultTermKey);
			})
			.catch((error: Error) => {
				setStatusError(error.message);
			});
	}, []);

	useEffect(() => {
		let ignoreResult = false;

		Promise.resolve().then(() => {
			if (!ignoreResult) refreshAll();
		});

		return () => {
			ignoreResult = true;
		};
	}, [refreshAll]);

	const selectedTerm = useMemo<TermWithClassrooms | null>(() => {
		if (!bootstrap) return null;
		return bootstrap.terms.find((term) => term.termKey === selectedTermKey) ?? bootstrap.terms[0] ?? null;
	}, [bootstrap, selectedTermKey]);

	if (statusError) {
		return <ErrorScreen message={statusError} onRetry={refreshAll} />;
	}

	if (!appStatus) {
		return <LoadingScreen />;
	}

	if (!appStatus.ready) {
		return (
			<InitialSettingsPage
				missingProperties={appStatus.missingProperties}
				onSaved={refreshAll}
			/>
		);
	}

	if (!bootstrap) {
		return <LoadingScreen />;
	}

	if (!bootstrap.currentUser.isActive) {
		return <NoAccessScreen bootstrap={bootstrap} />;
	}

	return (
		<HashRouter>
			<div className="min-vh-100 bg-body-tertiary text-body">
				<Navigation
					bootstrap={bootstrap}
					selectedTermKey={selectedTerm?.termKey ?? ''}
					onTermChange={setSelectedTermKey}
				/>
				<main className="container-xxl px-3 px-sm-4 py-4">
					<Routes>
						<Route
							path="/"
							element={
								<HomePage
									bootstrap={bootstrap}
									selectedTerm={selectedTerm}
									currentDate={currentDate}
								/>
							}
						/>
						<Route
							path="/attendance"
							element={
								<AttendancePage
									bootstrap={bootstrap}
									selectedTerm={selectedTerm}
									currentDate={currentDate}
								/>
							}
						/>
						<Route
							path="/students"
							element={<StudentsPage selectedTerm={selectedTerm} />}
						/>
						<Route
							path="/statistics"
							element={
								<HomePage
									bootstrap={bootstrap}
									selectedTerm={selectedTerm}
									currentDate={currentDate}
									detailed
								/>
							}
						/>
						<Route
							path="/settings"
							element={
								<SettingsPage
									bootstrap={bootstrap}
									onSettingsChanged={refreshAll}
								/>
							}
						/>
					</Routes>
				</main>
			</div>
		</HashRouter>
	);
}

export default App;
