import { useEffect, useState } from 'react';
import {
	getStudents,
	saveStudents,
	type Student,
	type TermWithClassrooms,
} from '../services/settingsService';

type StudentsPageProps = {
	selectedTerm: TermWithClassrooms | null;
};

const emptyStudent: Student = {
	studentId: '',
	prefix: '',
	firstName: '',
	lastName: '',
	status: 'มาเรียนปกติ',
};

export default function StudentsPage({ selectedTerm }: StudentsPageProps) {
	const [classroom, setClassroom] = useState('');
	const [students, setStudents] = useState<Student[]>([]);
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
			setMessage(null);
			setErrorMessage(null);

			getStudents(selectedTermKey, activeClassroom)
				.then((nextStudents) => {
					if (!ignoreResult) setStudents(nextStudents);
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
	}, [activeClassroom, selectedTermKey]);

	function updateStudent(index: number, field: keyof Student, value: string) {
		setStudents((current) =>
			current.map((student, studentIndex) =>
				studentIndex === index ? { ...student, [field]: value } : student,
			),
		);
	}

	function addStudent() {
		setStudents((current) => [...current, { ...emptyStudent }]);
	}

	function removeStudent(index: number) {
		setStudents((current) => current.filter((_, studentIndex) => studentIndex !== index));
	}

	function handleSave() {
		if (!selectedTerm || !activeClassroom) return;
		setIsSaving(true);
		setMessage(null);
		setErrorMessage(null);
		saveStudents(selectedTerm.termKey, activeClassroom, students)
			.then((savedStudents) => {
				setStudents(savedStudents);
				setMessage('บันทึกรายชื่อนักเรียนเรียบร้อยแล้ว');
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
						Students
					</p>
					<h2 className="h3 fw-bold text-body-emphasis mb-0">จัดการรายชื่อนักเรียน</h2>
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
					<button
						type="button"
						onClick={addStudent}
						className="btn btn-outline-secondary btn-sm"
					>
						Add student
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

			<section className="card shadow-sm">
				<div className="table-responsive">
					<table className="table table-sm align-middle mb-0 app-table-students">
						<thead className="table-light">
							<tr>
								<th className="px-3 py-3">Student ID</th>
								<th className="px-3 py-3">Prefix</th>
								<th className="px-3 py-3">Firstname</th>
								<th className="px-3 py-3">Lastname</th>
								<th className="px-3 py-3">Status</th>
								<th className="px-3 py-3">Action</th>
							</tr>
						</thead>
						<tbody>
							{isLoading ? (
								<tr>
									<td colSpan={6} className="text-center text-secondary py-5">
										Loading...
									</td>
								</tr>
							) : students.length === 0 ? (
								<tr>
									<td colSpan={6} className="text-center text-secondary py-5">
										ยังไม่มีข้อมูล กด Add student เพื่อเพิ่มรายชื่อ
									</td>
								</tr>
							) : (
								students.map((student, index) => (
									<tr key={`${student.studentId}-${index}`}>
										<td className="px-3 py-2">
											<input
												value={student.studentId}
												onChange={(event) => updateStudent(index, 'studentId', event.target.value)}
												className="form-control form-control-sm"
											/>
										</td>
										<td className="px-3 py-2">
											<input
												value={student.prefix}
												onChange={(event) => updateStudent(index, 'prefix', event.target.value)}
												className="form-control form-control-sm"
											/>
										</td>
										<td className="px-3 py-2">
											<input
												value={student.firstName}
												onChange={(event) => updateStudent(index, 'firstName', event.target.value)}
												className="form-control form-control-sm"
											/>
										</td>
										<td className="px-3 py-2">
											<input
												value={student.lastName}
												onChange={(event) => updateStudent(index, 'lastName', event.target.value)}
												className="form-control form-control-sm"
											/>
										</td>
										<td className="px-3 py-2">
											<select
												value={student.status}
												onChange={(event) => updateStudent(index, 'status', event.target.value)}
												className="form-select form-select-sm"
											>
												<option value="มาเรียนปกติ">มาเรียนปกติ</option>
												<option value="พักการเรียน">พักการเรียน</option>
												<option value="ลาออก">ลาออก</option>
											</select>
										</td>
										<td className="px-3 py-2">
											<button
												type="button"
												onClick={() => removeStudent(index)}
												className="btn btn-outline-danger btn-sm"
											>
												Remove
											</button>
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
