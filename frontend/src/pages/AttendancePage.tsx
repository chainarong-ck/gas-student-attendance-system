import { useEffect, useMemo, useState } from 'react';
import {
	getAttendance,
	saveAttendance,
	type AttendanceStatusCode,
	type BootstrapResponse,
	type Student,
	type TermWithClassrooms,
} from '../services/settingsService';

type AttendancePageProps = {
	bootstrap: BootstrapResponse;
	selectedTerm: TermWithClassrooms | null;
	currentDate: string;
};

const statusStyles: Record<Exclude<AttendanceStatusCode, ''>, string> = {
	P: 'btn-success',
	A: 'btn-danger',
	L: 'btn-warning',
	S: 'btn-primary',
};

export default function AttendancePage({
	bootstrap,
	selectedTerm,
	currentDate,
}: AttendancePageProps) {
	const [classroom, setClassroom] = useState('');
	const [date, setDate] = useState(currentDate);
	const [students, setStudents] = useState<Student[]>([]);
	const [records, setRecords] = useState<Record<string, AttendanceStatusCode>>({});
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const selectedTermKey = selectedTerm?.termKey ?? '';
	const firstClassroom = selectedTerm?.classrooms[0]?.sheetName ?? '';
	const activeClassroom = selectedTerm?.classrooms.some((item) => item.sheetName === classroom)
		? classroom
		: firstClassroom;

	useEffect(() => {
		if (!selectedTermKey || !activeClassroom) return undefined;

		let ignoreResult = false;

		Promise.resolve().then(() => {
			if (ignoreResult) return;

			setIsLoading(true);
			setErrorMessage(null);
			setMessage(null);

			getAttendance(selectedTermKey, activeClassroom, date)
				.then((response) => {
					if (ignoreResult) return;

					const nextRecords: Record<string, AttendanceStatusCode> = {};
					response.records.forEach((record) => {
						nextRecords[record.studentId] = record.status;
					});
					setStudents(response.students);
					setRecords(nextRecords);
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
	}, [activeClassroom, date, selectedTermKey]);

	const counts = useMemo(() => {
		return students.reduce(
			(total, student) => {
				const status = records[student.studentId] || '';
				if (status === 'P' || status === 'A' || status === 'L' || status === 'S') {
					total[status] += 1;
				}
				return total;
			},
			{ P: 0, A: 0, L: 0, S: 0 },
		);
	}, [records, students]);

	function setAllPresent() {
		const nextRecords: Record<string, AttendanceStatusCode> = {};
		students.forEach((student) => {
			nextRecords[student.studentId] = 'P';
		});
		setRecords(nextRecords);
	}

	function handleSave() {
		if (!selectedTerm || !activeClassroom) return;
		setIsSaving(true);
		setErrorMessage(null);
		setMessage(null);
		saveAttendance(
			selectedTerm.termKey,
			activeClassroom,
			date,
			students.map((student) => ({
				studentId: student.studentId,
				status: records[student.studentId] || '',
			})),
		)
			.then((response) => {
				const nextRecords: Record<string, AttendanceStatusCode> = {};
				response.records.forEach((record) => {
					nextRecords[record.studentId] = record.status;
				});
				setRecords(nextRecords);
				setMessage('บันทึกการเช็คชื่อเรียบร้อยแล้ว');
			})
			.catch((error: Error) => setErrorMessage(error.message))
			.finally(() => setIsSaving(false));
	}

	if (!selectedTerm) {
		return <div className="card"><div className="card-body">No active term.</div></div>;
	}

	return (
		<div className="vstack gap-3">
			<div className="d-flex flex-column flex-lg-row align-items-lg-end justify-content-lg-between gap-3">
				<div>
					<p className="small fw-bold text-uppercase text-success app-letter-wide mb-1">
						Attendance
					</p>
					<h2 className="h3 fw-bold text-body-emphasis mb-0">เช็คชื่อนักเรียน</h2>
				</div>
				<div className="d-flex flex-column flex-sm-row gap-2">
					<select
						value={activeClassroom}
						onChange={(event) => setClassroom(event.target.value)}
						className="form-select form-select-sm"
					>
						{selectedTerm.classrooms.map((item) => (
							<option key={item.sheetName} value={item.sheetName}>
								{item.sheetName}
							</option>
						))}
					</select>
					<input
						type="date"
						value={date}
						onChange={(event) => setDate(event.target.value)}
						className="form-control form-control-sm"
					/>
					<button
						type="button"
						onClick={setAllPresent}
						className="btn btn-outline-success btn-sm"
					>
						Mark all present
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving || isLoading}
						className="btn btn-success btn-sm"
					>
						{isSaving ? 'Saving...' : 'Save'}
					</button>
				</div>
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

			<div className="row g-3">
				{bootstrap.attendanceStatuses.map((status) => (
					<div key={status.code} className="col-sm-6 col-lg-3">
						<div className="card h-100">
							<div className="card-body">
						<p className="small text-secondary mb-0">{status.label}</p>
						<p className="h3 fw-bold text-body-emphasis mb-0 mt-2">{counts[status.code]}</p>
							</div>
						</div>
					</div>
				))}
			</div>

			<section className="card shadow-sm">
				<div className="table-responsive">
					<table className="table table-sm align-middle mb-0">
						<thead className="table-light">
							<tr>
								<th className="px-3 py-3">รหัส</th>
								<th className="px-3 py-3">ชื่อ</th>
								<th className="px-3 py-3">สถานะนักเรียน</th>
								<th className="px-3 py-3">เช็คชื่อ</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td colSpan={4} className="text-center text-secondary py-5">
										Loading...
									</td>
								</tr>
							) : students.length === 0 ? (
								<tr>
									<td colSpan={4} className="text-center text-secondary py-5">
										ยังไม่มีรายชื่อนักเรียนในห้องนี้
									</td>
								</tr>
							) : (
								students.map((student) => (
									<tr key={student.studentId}>
										<td className="px-3 py-3 fw-medium text-body-emphasis">{student.studentId}</td>
										<td className="px-3 py-3">
											{student.prefix}
											{student.firstName} {student.lastName}
										</td>
										<td className="px-3 py-3 text-secondary">{student.status}</td>
										<td className="px-3 py-3">
											<div className="d-flex flex-wrap gap-2">
												{bootstrap.attendanceStatuses.map((status) => {
													const active = records[student.studentId] === status.code;
													return (
														<button
															key={status.code}
															type="button"
															onClick={() =>
																setRecords((current) => ({
																	...current,
																	[student.studentId]: status.code,
																}))
															}
															className={`btn btn-sm app-status-button ${
																active ? statusStyles[status.code] : 'btn-outline-secondary'
															}`}
														>
															{status.code}
														</button>
													);
												})}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
