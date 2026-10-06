// Dashboard.tsx
// The signed-in user's main page: a greeting and a grid of stat cards for the active semester

import { useContext, useState } from "react";
import { Link } from "react-router";

import AssignmentListCard from "../components/dashboard/AssignmentListCard";
import ClassesCard from "../components/dashboard/ClassesCard";
import CompletionCard from "../components/dashboard/CompletionCard";
import DashboardCard from "../components/dashboard/DashboardCard";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import NextDeadlineCard from "../components/dashboard/NextDeadlineCard";
import SemesterCard from "../components/dashboard/SemesterCard";
import TypesCard from "../components/dashboard/TypesCard";
import WeekCard from "../components/dashboard/WeekCard";
import StandardLayout from "../components/StandardLayout";
import { UserContext } from "../context/UserContext";
import { localWeekBounds } from "../dates";
import useDashboard from "../hooks/useDashboard";
import { MAIN_NAV_ITEMS } from "../navItems";

// "Good morning" until noon, "afternoon" until 5pm, "evening" otherwise (including small hours)
const greetingFor = (hour: number) =>
    hour >= 5 && hour < 12 ? "Good morning" : hour >= 12 && hour < 17 ? "Good afternoon" : "Good evening";

const longDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });

const Dashboard = () => {
    // Context
    const { user } = useContext(UserContext);

    // State
    const { dashboard, fetchedAt, refreshing, failed } = useDashboard();
    // when the page opened, for the greeting and the week's dates (it doesn't need to tick)
    const [openedAt] = useState(() => new Date());

    const firstName = user.loggedIn ? user.name.split(" ")[0] : "";
    const greeting = `${greetingFor(openedAt.getHours())}${firstName ? `, ${firstName}` : ""}`;

    return (
        <StandardLayout
            title="Dashboard"
            sidebar={MAIN_NAV_ITEMS}>
            <div className="mx-auto max-w-[74rem] mb-8">
                <h1 className="text-3xl font-extralight">{greeting}</h1>
                <p className="text-gray-600 mt-1">{longDate.format(openedAt)}</p>
            </div>

            {failed && !dashboard && (
                <p className="text-center text-gray-600 py-16">
                    Your stats couldn't be loaded. Try refreshing the page.
                </p>
            )}

            {dashboard && !dashboard.semester && (
                <DashboardGrid>
                    <DashboardCard w={3}>
                        <div className="h-full flex flex-col items-center justify-center gap-2 text-center text-gray-600">
                            <p>
                                Your stats will show up here once you've added a semester, its classes and assignments.
                            </p>
                            <Link
                                to="/semesters"
                                className="text-primary underline active:text-blue-600">
                                Create your first semester
                            </Link>
                        </div>
                    </DashboardCard>
                </DashboardGrid>
            )}

            {dashboard?.semester &&
                dashboard.progress &&
                fetchedAt !== undefined && (
                    // a refresh dims the current view instead of flashing a loading state
                    <div
                        aria-busy={refreshing}
                        className={`transition-opacity duration-200 ${refreshing ? "opacity-60" : ""}`}>
                        <DashboardGrid>
                            <SemesterCard
                                semester={dashboard.semester}
                                progress={dashboard.progress}
                            />
                            <NextDeadlineCard next={dashboard.upcoming[0]} />
                            <CompletionCard
                                done={dashboard.assignmentsDone}
                                total={dashboard.assignmentsTotal}
                            />
                            <AssignmentListCard
                                kind="upcoming"
                                assignments={dashboard.upcoming}
                                now={fetchedAt}
                            />
                            <AssignmentListCard
                                kind="overdue"
                                assignments={dashboard.overdue}
                                now={fetchedAt}
                            />
                            <TypesCard types={dashboard.types} />
                            <ClassesCard
                                classes={dashboard.classes}
                                semesterId={dashboard.semester.id}
                                semesterName={dashboard.semester.name}
                            />
                            {/* last in the source so that on 2 columns the grid's one unavoidable gap (an odd number of cells) falls at the
                                very end; dense packing still lifts it beside the semester card on 3 columns */}
                            <WeekCard
                                week={dashboard.week}
                                weekStart={new Date(localWeekBounds(openedAt).start)}
                            />
                        </DashboardGrid>
                    </div>
                )}
        </StandardLayout>
    );
};

export default Dashboard;
