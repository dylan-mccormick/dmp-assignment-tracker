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
}

const StandardNavbar = ({ items }: StandardNavbarProps) => {
    return (
        <div className="w-64 p-4 h-full border-r border-gray-300 flex flex-col">
            {items.map((item, index) => (
                <StandardNavbarItem
                    key={index}
                    {...item}
                />
            ))}
        </div>
    );
};

export default StandardNavbar;
