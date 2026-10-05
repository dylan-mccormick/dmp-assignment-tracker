// Dashboard.tsx
// The signed-in user's main page

import StandardLayout from "../components/StandardLayout";
import { MAIN_NAV_ITEMS } from "../navItems";

const Dashboard = () => {
    return (
        <StandardLayout
            title="Dashboard"
            sidebar={MAIN_NAV_ITEMS}>
            {/* Content pane: intentionally empty for now */}
        </StandardLayout>
    );
};

export default Dashboard;
