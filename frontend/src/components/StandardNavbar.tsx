// StandardNavbar.tsx
// Lists clickable navigation items; full screen (on mobile) it takes focus, and Escape closes it

import { type KeyboardEvent, useEffect, useRef } from "react";

import { NAV_ID, NAV_TOGGLE_ID } from "./navIds";
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
    /** Closes the navbar (full screen only), e.g. on Escape */
    onClose?: () => void;
}

const StandardNavbar = ({ items, fullScreen, onNavigate, onClose }: StandardNavbarProps) => {
    const navRef = useRef<HTMLElement>(null);

    // full screen, it covers the page, so focus moves into it
    useEffect(() => {
        if (fullScreen) navRef.current?.querySelector("a")?.focus();
    }, [fullScreen]);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Escape" || !onClose) return;
        onClose();
        document.getElementById(NAV_TOGGLE_ID)?.focus();
    };

    return (
        <nav
            ref={navRef}
            id={NAV_ID}
            aria-label="Main"
            onKeyDown={handleKeyDown}
            className={`p-4 flex flex-col ${fullScreen ? "absolute inset-0 z-30 bg-white" : "w-64 h-full border-r border-gray-300"}`}>
            {items.map((item, index) => (
                <StandardNavbarItem
                    key={index}
                    {...item}
                    onClick={onNavigate}
                />
            ))}
        </nav>
    );
};

export default StandardNavbar;
