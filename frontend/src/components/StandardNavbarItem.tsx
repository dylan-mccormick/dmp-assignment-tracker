// StandardNavbarItem.tsx
// A single clickable navigation item, bold when its route is the current page

import { NavLink } from "react-router";

interface StandardNavbarItemProps {
    icon: React.ReactNode;
    label: string;
    href: string;
    onClick?: () => void;
}

const StandardNavbarItem = ({ icon, label, href, onClick }: StandardNavbarItemProps) => {
    return (
        <NavLink
            to={href}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center p-2 text-sm hover:bg-gray-100 ${isActive ? "font-bold" : "font-medium"}`
            }>
            {icon}
            <span className="ml-3">{label}</span>
        </NavLink>
    );
};

export default StandardNavbarItem;
