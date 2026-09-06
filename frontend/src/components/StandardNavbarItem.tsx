// StandardNavbarItem.tsx
// A single clickable navigation item

import { useNavigate } from "react-router";

interface StandardNavbarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
}

const StandardNavbarItem = ({ icon, label, href }: StandardNavbarItemProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(href);
    };

    return (
        <button
            onClick={handleClick}
            className="flex items-center p-2 text-sm font-medium hover:bg-gray-100">
            {icon}
            <span className="ml-3">{label}</span>
        </button>
    );
};

export default StandardNavbarItem;
