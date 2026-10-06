// ClassesCard.tsx
// How much of each class's work is done this semester, with a link to edit the classes

import { useNavigate } from "react-router";

import type { DashboardClass } from "../../model/Dashboard";
import ProgressBar from "../ProgressBar";
import TertiaryButton from "../TertiaryButton";
import DashboardCard from "./DashboardCard";

interface ClassesCardProps {
    classes: DashboardClass[];
    semesterId: string;
    semesterName: string;
}

const ClassesCard = ({ classes, semesterId, semesterName }: ClassesCardProps) => {
    const navigate = useNavigate();

    return (
        <DashboardCard
            w={2}
            h={2}
            title="Classes">
            <div className="h-full flex flex-col">
                {classes.length === 0 ? (
                    <p className="flex-1 flex items-center justify-center text-sm text-gray-500">
                        {semesterName} doesn't have any classes yet.
                    </p>
                ) : (
                    // the card is its own container, so its rows go 1 -> 2 -> 3 across with the card's width
                    <div className="@container flex-1 min-h-0 overflow-y-auto">
                        <ul className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-3 gap-x-8 gap-y-5">
                            {classes.map(cls => (
                                <li
                                    key={cls.classId}
                                    className="min-w-0 space-y-1.5">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="min-w-0 truncate">
                                            <span className="font-medium">{cls.code}</span>{" "}
                                            <span className="text-sm text-gray-500">{cls.name}</span>
                                        </p>
                                        <p className="shrink-0 font-semibold">
                                            {cls.total === 0 ? "—" : `${Math.round((cls.done / cls.total) * 100)}%`}
                                        </p>
                                    </div>
                                    <ProgressBar
                                        fraction={cls.total === 0 ? 0 : cls.done / cls.total}
                                        label={`${cls.code} assignments done`}
                                        valueText={cls.total === 0 ? "No assignments" : `${cls.done} of ${cls.total}`}
                                    />
                                    <p className="text-xs text-gray-500">
                                        {cls.total === 0 ? "No assignments yet" : `${cls.done} of ${cls.total} done`}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="pt-3">
                    <TertiaryButton onClick={() => navigate(`/classes?semester=${encodeURIComponent(semesterId)}`)}>
                        Edit classes
                    </TertiaryButton>
                </div>
            </div>
        </DashboardCard>
    );
};

export default ClassesCard;
