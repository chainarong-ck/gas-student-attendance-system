import { useEffect, useState } from 'react';
import {
	createTerm,
	getSettings,
	saveSettings,
	type BootstrapResponse,
	type Classroom,
	type CreateTermRequest,
	type SettingsPayload,
	type User,
} from '../services/settingsService';

type SettingsPageProps = {
	bootstrap: BootstrapResponse;
	onSettingsChanged: () => void;
};

const emptyUser: User = {
	email: '',
	role: 'teacher',
	displayName: '',
	allowedTermKeys: [],
	allowedClassrooms: [],
	isActive: true,
};

function csvToArray(value: string) {
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
}

function arrayToCsv(values: string[]) {
	return values.join(', ');
}

function parseClassroomPlan(value: string): Classroom[] {
	const tokens = value
		.split(/\s+/)
		.map((item) => item.trim())
		.filter(Boolean);
	const classrooms: Classroom[] = [];

	tokens.forEach((token) => {
		if (token.includes(':')) {
			const [gradeRaw, countRaw] = token.split(':');
			const grade = gradeRaw.trim().toUpperCase();
			const count = Number(countRaw);
			for (let room = 1; room <= count; room += 1) {
				classrooms.push({
					grade,
					room: String(room),
					sheetName: `${grade}-${room}`,
					enabled: true,
				});
			}
			return;
		}

		const [gradeRaw, roomRaw] = token.split('-');
		const grade = gradeRaw.trim().toUpperCase();
		const room = (roomRaw ?? '').trim();
		if (grade && room) {
			classrooms.push({
				grade,
				room,
				sheetName: `${grade}-${room}`,
				enabled: true,
			});
		}
	});

	return classrooms;
}

export default function SettingsPage({ bootstrap, onSettingsChanged }: SettingsPageProps) {
	const [settings, setSettings] = useState<SettingsPayload | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [newTerm, setNewTerm] = useState({
		termKey: '',
		academicYear: '',
		semester: '',
		label: '',
		classroomPlan: 'M1:3 M2:3 M3:3 M4:3 M5:3 M6:3',
	});

	useEffect(() => {
		let ignoreResult = false;

		Promise.resolve().then(() => {
			if (ignoreResult) return;

			setIsLoading(true);
			setErrorMessage(null);

			getSettings()
				.then((nextSettings) => {
					if (!ignoreResult) setSettings(nextSettings);
				})
				.catch((error: Error) => {
					if (!ignoreResult) setErrorMessage(error.message);
				})
				.finally(() => {
					if (!ignoreResult) setIsLoading(false);
				});
		});

		return () => {
			ignoreResult = true;
		};
	}, []);

	function updateUser(index: number, patch: Partial<User>) {
		setSettings((current) => {
			if (!current) return current;
			return {
				...current,
				users: current.users.map((user, userIndex) =>
					userIndex === index ? { ...user, ...patch } : user,
				),
			};
		});
	}

	function addUser() {
		setSettings((current) =>
			current ? { ...current, users: [...current.users, { ...emptyUser }] } : current,
		);
	}

	function removeUser(index: number) {
		setSettings((current) =>
			current
				? { ...current, users: current.users.filter((_, userIndex) => userIndex !== index) }
				: current,
		);
	}

	function handleSaveSettings() {
		if (!settings) return;
		setIsSaving(true);
		setMessage(null);
		setErrorMessage(null);
		saveSettings(settings)
			.then((savedSettings) => {
				setSettings(savedSettings);
				setMessage('บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
				onSettingsChanged();
			})
			.catch((error: Error) => setErrorMessage(error.message))
			.finally(() => setIsSaving(false));
	}

	function handleCreateTerm() {
		const classrooms = parseClassroomPlan(newTerm.classroomPlan);
		const request: CreateTermRequest = {
			termKey: newTerm.termKey,
			academicYear: newTerm.academicYear,
			semester: newTerm.semester,
			label: newTerm.label || newTerm.termKey,
			classrooms,
		};

		setIsSaving(true);
		setMessage(null);
		setErrorMessage(null);
		createTerm(request)
			.then(() => {
				setMessage('สร้างเทอมและไฟล์ Google Sheets เรียบร้อยแล้ว');
				setNewTerm({
					termKey: '',
					academicYear: '',
					semester: '',
					label: '',
					classroomPlan: newTerm.classroomPlan,
				});
				return getSettings();
			})
			.then((nextSettings) => {
				setSettings(nextSettings);
				onSettingsChanged();
			})
			.catch((error: Error) => setErrorMessage(error.message))
			.finally(() => setIsSaving(false));
	}

	if (bootstrap.currentUser.role !== 'admin') {
		return (
			<section className="card border-danger-subtle">
				<div className="card-body p-4">
				<h2 className="h5 fw-bold text-danger-emphasis mb-0">Admin permission required</h2>
				</div>
			</section>
		);
	}

	return (
		<div className="vstack gap-4">
			<div>
				<p className="small fw-bold text-uppercase text-success app-letter-wide mb-1">Settings</p>
				<h2 className="h3 fw-bold text-body-emphasis mb-0">ตั้งค่าระบบ</h2>
			</div>

			{errorMessage ? (
				<div className="alert alert-danger py-2 mb-0" role="alert">
					{errorMessage}
				</div>
			) : null}
			{message ? (
				<div className="alert alert-success py-2 mb-0" role="alert">
					{message}
				</div>
			) : null}

			{isLoading || !settings ? (
				<div className="card">
					<div className="card-body text-secondary">
					Loading settings...
					</div>
				</div>
			) : (
				<>
					<section className="card shadow-sm">
						<div className="card-body">
						<div className="row g-3">
							<label className="col-lg-6">
								<span className="form-label fw-semibold">School name</span>
								<input
									value={settings.system.schoolName}
									onChange={(event) =>
										setSettings({
											...settings,
											system: { ...settings.system, schoolName: event.target.value },
										})
									}
									className="form-control"
								/>
							</label>
							<label className="col-lg-6">
								<span className="form-label fw-semibold">Default term</span>
								<select
									value={settings.system.defaultTermKey}
									onChange={(event) =>
										setSettings({
											...settings,
											system: { ...settings.system, defaultTermKey: event.target.value },
										})
									}
									className="form-select"
								>
									<option value="">No default</option>
									{settings.terms.map((term) => (
										<option key={term.termKey} value={term.termKey}>
											{term.label}
										</option>
									))}
								</select>
							</label>
						</div>
						</div>
					</section>

					<section className="card shadow-sm">
						<div className="card-body">
						<h3 className="h6 fw-bold text-body-emphasis">สร้างปีการศึกษา-เทอมใหม่</h3>
						<div className="row g-3 mt-1">
							<input
								placeholder="termKey เช่น 2569-1"
								value={newTerm.termKey}
								onChange={(event) => setNewTerm({ ...newTerm, termKey: event.target.value })}
								className="form-control col"
							/>
							<input
								placeholder="ปีการศึกษา"
								value={newTerm.academicYear}
								onChange={(event) =>
									setNewTerm({ ...newTerm, academicYear: event.target.value })
								}
								className="form-control col"
							/>
							<input
								placeholder="เทอม"
								value={newTerm.semester}
								onChange={(event) => setNewTerm({ ...newTerm, semester: event.target.value })}
								className="form-control col"
							/>
							<input
								placeholder="ชื่อแสดงผล"
								value={newTerm.label}
								onChange={(event) => setNewTerm({ ...newTerm, label: event.target.value })}
								className="form-control col"
							/>
							<button
								type="button"
								onClick={handleCreateTerm}
								disabled={isSaving}
								className="btn btn-success col-lg-auto"
							>
								Create term
							</button>
						</div>
						<label className="d-block mt-3">
							<span className="form-label fw-semibold">Classrooms</span>
							<input
								value={newTerm.classroomPlan}
								onChange={(event) =>
									setNewTerm({ ...newTerm, classroomPlan: event.target.value })
								}
								className="form-control"
							/>
						</label>
						<p className="form-text mb-0">
							ใช้รูปแบบ M1:3 เพื่อสร้าง M1-1 ถึง M1-3 หรือระบุ M4-1 M4-2 แยกด้วยช่องว่าง
						</p>
						</div>
					</section>

					<section className="card shadow-sm">
						<div className="card-body">
						<h3 className="h6 fw-bold text-body-emphasis">Terms</h3>
						<div className="table-responsive mt-3">
							<table className="table table-sm align-middle mb-0">
								<thead className="table-light">
									<tr>
										<th>Term</th>
										<th>Label</th>
										<th>Active</th>
										<th>Folder ID</th>
									</tr>
								</thead>
								<tbody>
									{settings.terms.map((term, index) => (
										<tr key={term.termKey}>
											<td className="fw-semibold">{term.termKey}</td>
											<td>
												<input
													value={term.label}
													onChange={(event) =>
														setSettings({
															...settings,
															terms: settings.terms.map((item, termIndex) =>
																termIndex === index
																	? { ...item, label: event.target.value }
																	: item,
															),
														})
													}
													className="form-control form-control-sm"
												/>
											</td>
											<td>
												<input
													type="checkbox"
													checked={term.isActive}
													onChange={(event) =>
														setSettings({
															...settings,
															terms: settings.terms.map((item, termIndex) =>
																termIndex === index
																	? { ...item, isActive: event.target.checked }
																	: item,
															),
														})
													}
													className="form-check-input"
												/>
											</td>
											<td className="text-secondary text-truncate app-folder-cell">{term.folderId}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						</div>
					</section>

					<section className="card shadow-sm">
						<div className="card-body">
						<div className="d-flex align-items-center justify-content-between gap-3">
							<h3 className="h6 fw-bold text-body-emphasis mb-0">Users</h3>
							<button
								type="button"
								onClick={addUser}
								className="btn btn-outline-secondary btn-sm"
							>
								Add user
							</button>
						</div>
						<div className="table-responsive mt-3">
							<table className="table table-sm align-middle mb-0 app-table-users">
								<thead className="table-light">
									<tr>
										<th>Email</th>
										<th>Role</th>
										<th>Name</th>
										<th>Terms</th>
										<th>Classrooms</th>
										<th>Active</th>
										<th>Action</th>
									</tr>
								</thead>
								<tbody>
									{settings.users.map((user, index) => (
										<tr key={`${user.email}-${index}`}>
											<td>
												<input
													value={user.email}
													onChange={(event) => updateUser(index, { email: event.target.value })}
													className="form-control form-control-sm"
												/>
											</td>
											<td>
												<select
													value={user.role}
													onChange={(event) =>
														updateUser(index, {
															role: event.target.value === 'admin' ? 'admin' : 'teacher',
														})
													}
													className="form-select form-select-sm"
												>
													<option value="teacher">teacher</option>
													<option value="admin">admin</option>
												</select>
											</td>
											<td>
												<input
													value={user.displayName}
													onChange={(event) =>
														updateUser(index, { displayName: event.target.value })
													}
													className="form-control form-control-sm"
												/>
											</td>
											<td>
												<input
													value={arrayToCsv(user.allowedTermKeys)}
													onChange={(event) =>
														updateUser(index, { allowedTermKeys: csvToArray(event.target.value) })
													}
													placeholder="ว่าง = ทุกเทอม"
													className="form-control form-control-sm"
												/>
											</td>
											<td>
												<input
													value={arrayToCsv(user.allowedClassrooms)}
													onChange={(event) =>
														updateUser(index, {
															allowedClassrooms: csvToArray(event.target.value),
														})
													}
													placeholder="ว่าง = ทุกห้อง"
													className="form-control form-control-sm"
												/>
											</td>
											<td>
												<input
													type="checkbox"
													checked={user.isActive}
													onChange={(event) =>
														updateUser(index, { isActive: event.target.checked })
													}
													className="form-check-input"
												/>
											</td>
											<td>
												<button
													type="button"
													onClick={() => removeUser(index)}
													className="btn btn-outline-danger btn-sm"
												>
													Remove
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						</div>
					</section>

					<div className="d-flex justify-content-end">
						<button
							type="button"
							onClick={handleSaveSettings}
							disabled={isSaving}
							className="btn btn-success px-4 py-2"
						>
							{isSaving ? 'Saving...' : 'Save settings'}
						</button>
					</div>
				</>
			)}
		</div>
	);
}
