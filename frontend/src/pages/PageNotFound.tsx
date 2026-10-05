// PageNotFound.tsx
// A page to show for page not found errors

import { useNavigate } from "react-router";

import StandardLayout from "../components/StandardLayout";
import TertiaryButton from "../components/TertiaryButton";

const PageNotFound = () => {
    // Navigate
    const navigate = useNavigate();

    // Go back if there's somewhere to go back to (not when the 404 was opened directly in a new tab)
    const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate("/"));

    return (
        <StandardLayout
            title="Page Not Found"
            sidebar={[]}>
            <main className="text-center p-4">
                <h1 className="text-2xl font-bold mb-4">404 - Page Not Found</h1>
                <p className="text-gray-700 mb-2">
                    The page you are looking for does not exist. Please check the URL and try again.
                </p>
                <TertiaryButton onClick={goBack}>Go Back</TertiaryButton>
            </main>
        </StandardLayout>
    );
};

export default PageNotFound;
