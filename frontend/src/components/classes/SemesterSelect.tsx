// SemesterSelect.tsx
// A dropdown of the user's semesters, newest first, marking the current one

import { todayDate } from "../../dates";
import { isCurrentSemester, type Semester } from "../../model/Semester";
import { controlClass } from "../form/formControl";

interface SemesterSelectProps {
    id: string;
    semesters: Semester[];
    value: string;
    onChange: (semesterId: string) => void;
    disabled?: boolean;
    className?: string;
}

const SemesterSelect = ({ id, semesters, value, onChange, disabled, className }: SemesterSelectProps) => {
    const currentDate = todayDate();

    return (
        <select
            id={id}
            value={value}
            disabled={disabled}
            onChange={e => onChange(e.target.value)}
            className={`${controlClass()} bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className ?? ""}`}>
            {semesters.map(semester => (
                <option
                    key={semester.id}
                    value={semester.id}>
                    {semester.name}
                    {isCurrentSemester(semester, currentDate) ? " (current)" : ""}
                </option>
            ))}
        </select>
    );
};

export default SemesterSelect;
