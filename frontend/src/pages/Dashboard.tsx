// Dashboard.tsx
// The signed-in user's main page

import StandardLayout from "../components/StandardLayout";

const Dashboard = () => {
    return (
        <StandardLayout
            title="Dashboard"
            sidebar={[]}>
            {/* Content pane: intentionally empty for now */}
        </StandardLayout>
    );
};

export default Dashboard;
