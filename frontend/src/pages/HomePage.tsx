import { useEffect, useState } from 'react';
import {
	getStatistics,
	type BootstrapResponse,
	type StatisticsResponse,
	type TermWithClassrooms,
} from '../services/settingsService';

type HomePageProps = {
	bootstrap: BootstrapResponse;
	selectedTerm: TermWithClassrooms | null;
	currentDate: string;
	detailed?: boolean;
};

function MetricCard({ label, value, tone }: { label: string; value: number | string; tone: string }) {
	return (
		<div className="card h-100 shadow-sm">
			<div className="card-body">
			<p className={`small fw-semibold mb-0 ${tone}`}>{label}</p>
			<p className="display-6 fw-bold text-body-emphasis mb-0 mt-2">{value}</p>
			</div>
		</div>
	);
}

export default function HomePage({
	bootstrap,
	selectedTerm,
	currentDate,
	detailed = false,
}: HomePageProps) {
	const [stats, setStats] = useState<StatisticsResponse | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [fromDate, setFromDate] = useState(currentDate);
	const [toDate, setToDate] = useState(currentDate);
	const selectedTermKey = selectedTerm?.termKey ?? '';

	useEffect(() => {
		if (!selectedTermKey) return undefined;

		let ignoreResult = false;

		Promise.resolve().then(() => {
			if (ignoreResult) return;

			setIsLoading(true);
			setErrorMessage(null);

			getStatistics(selectedTermKey, {
				fromDate: detailed ? fromDate : currentDate,
				toDate: detailed ? toDate : currentDate,
			})
				.then((nextStats) => {
					if (!ignoreResult) setStats(nextStats);
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
	}, [currentDate, detailed, fromDate, selectedTermKey, toDate]);

	if (!selectedTerm) {
		return (
			<section className="card border-warning-subtle">
				<div className="card-body p-4">
				<h2 className="h5 fw-bold text-body-emphasis">ยังไม่มีเทอมที่เปิดใช้งาน</h2>
				<p className="small text-secondary mb-0 mt-2">
					ผู้ดูแลระบบสามารถสร้างเทอมใหม่ได้จากหน้า Settings
				</p>
				</div>
			</section>
		);
	}

	const summary = stats?.summary ?? { P: 0, A: 0, L: 0, S: 0 };
	const title = detailed ? 'Statistics' : 'Dashboard';

	return (
		<div className="vstack gap-4">
			<div className="d-flex flex-column flex-sm-row align-items-sm-end justify-content-sm-between gap-2">
				<div>
					<p className="small fw-bold text-uppercase text-success app-letter-wide mb-1">
						{selectedTerm.label}
					</p>
					<h2 className="h3 fw-bold text-body-emphasis mb-0">{title}</h2>
				</div>
				{detailed ? (
					<div className="d-flex flex-column flex-sm-row gap-2">
						<input
							type="date"
							value={fromDate}
							onChange={(event) => setFromDate(event.target.value)}
							className="form-control form-control-sm"
						/>
						<input
							type="date"
							value={toDate}
							onChange={(event) => setToDate(event.target.value)}
							className="form-control form-control-sm"
						/>
					</div>
				) : (
					<p className="small text-secondary mb-0">
						{bootstrap.currentUser.role === 'admin' ? 'Admin view' : 'Teacher view'} ·{' '}
						{currentDate}
					</p>
				)}
			</div>

			{errorMessage ? (
				<div className="alert alert-danger py-2 mb-0" role="alert">
					{errorMessage}
				</div>
			) : null}

			<div className="row g-3">
				<div className="col-sm-6 col-lg"><MetricCard label="Students" value={stats?.totalStudents ?? '-'} tone="text-secondary" /></div>
				<div className="col-sm-6 col-lg"><MetricCard label="มา" value={summary.P} tone="text-success" /></div>
				<div className="col-sm-6 col-lg"><MetricCard label="ขาด" value={summary.A} tone="text-danger" /></div>
				<div className="col-sm-6 col-lg"><MetricCard label="ลา" value={summary.L} tone="text-warning-emphasis" /></div>
				<div className="col-sm-6 col-lg"><MetricCard label="สาย" value={summary.S} tone="text-primary" /></div>
			</div>

			<div className="row g-3">
				<section className="col-lg-5">
					<div className="card h-100 shadow-sm">
						<div className="card-body">
					<h3 className="h6 fw-bold text-body-emphasis">ห้องที่ยังไม่เช็คชื่อวันนี้</h3>
					{isLoading ? (
						<p className="small text-secondary mb-0 mt-3">Loading...</p>
					) : stats && stats.missingClassroomsToday.length > 0 ? (
						<div className="d-flex flex-wrap gap-2 mt-3">
							{stats.missingClassroomsToday.map((classroom) => (
								<span
									key={classroom}
									className="badge text-bg-warning"
								>
									{classroom}
								</span>
							))}
						</div>
					) : (
						<p className="small text-success mb-0 mt-3">เช็คครบแล้วสำหรับวันนี้</p>
					)}
						</div>
					</div>
				</section>

				<section className="col-lg-7">
					<div className="card h-100 shadow-sm">
						<div className="card-body">
					<h3 className="h6 fw-bold text-body-emphasis">สรุปรายห้อง</h3>
					<div className="table-responsive mt-3">
						<table className="table table-sm align-middle mb-0">
							<thead className="table-light">
								<tr>
									<th>ห้อง</th>
									<th>นักเรียน</th>
									<th>มา</th>
									<th>ขาด</th>
									<th>ลา</th>
									<th>สาย</th>
								</tr>
							</thead>
							<tbody>
								{stats?.byClassroom.map((row) => (
									<tr key={row.classroom}>
										<td className="fw-semibold text-body-emphasis">{row.classroom}</td>
										<td>{row.studentCount}</td>
										<td>{row.summary.P}</td>
										<td>{row.summary.A}</td>
										<td>{row.summary.L}</td>
										<td>{row.summary.S}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
						</div>
					</div>
				</section>
			</div>

			{detailed ? (
				<section className="card shadow-sm">
					<div className="card-body">
					<h3 className="h6 fw-bold text-body-emphasis">สรุปรายคน</h3>
					<div className="table-responsive app-scroll-tall mt-3">
						<table className="table table-sm align-middle mb-0">
							<thead className="table-light sticky-top">
								<tr>
									<th>รหัส</th>
									<th>ชื่อ</th>
									<th>ห้อง</th>
									<th>มา</th>
									<th>ขาด</th>
									<th>ลา</th>
									<th>สาย</th>
								</tr>
							</thead>
							<tbody>
								{stats?.byStudent.map((student) => (
									<tr key={`${student.classroom}-${student.studentId}`}>
										<td>{student.studentId}</td>
										<td className="fw-medium text-body-emphasis">{student.fullName}</td>
										<td>{student.classroom}</td>
										<td>{student.summary.P}</td>
										<td>{student.summary.A}</td>
										<td>{student.summary.L}</td>
										<td>{student.summary.S}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					</div>
				</section>
			) : null}
		</div>
	);
}
