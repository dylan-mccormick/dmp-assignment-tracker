// StandardNavbar.tsx
// Lists clickable navigation items

import StandardNavbarItem from "./StandardNavbarItem";

export interface SidebarComponentProps {
    icon: React.ReactNode;
    label: string;
    href: string;
}

interface StandardNavbarProps {
    items: SidebarComponentProps[];
    fullScreen?: boolean;
    onNavigate?: () => void;
}

const StandardNavbar = ({ items, fullScreen, onNavigate }: StandardNavbarProps) => {
    return (
        <div
            className={`p-4 flex flex-col ${fullScreen ? "absolute inset-0 z-30 bg-white" : "w-64 h-full border-r border-gray-300"}`}>
            {items.map((item, index) => (
                <StandardNavbarItem
                    key={index}
                    {...item}
                    onClick={onNavigate}
                />
            ))}
        </div>
    );
};

export default StandardNavbar;
