// StandardLayout.tsx
// Layout component to include a standard header, collapsible sidebar (mobile responsive), footer, and main content area

import { useContext } from "react";

import { NavbarContext } from "../context/NavbarContext";
import StandardHeader from "./StandardHeader";
import type { SidebarComponentProps } from "./StandardNavbar";
import StandardNavbar from "./StandardNavbar";

interface StandardLayoutProps {
    title: string;
    sidebar: SidebarComponentProps[];
    children?: React.ReactNode;
}

const StandardLayout = ({ title, sidebar, children }: StandardLayoutProps) => {
    // Context
    const { isMobile, navOpen, toggleNav, closeNav } = useContext(NavbarContext);

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col">
            <title>{title ? title + " | DMP Assignment Tracker" : "DMP Assignment Tracker"}</title>

            <StandardHeader
                hideNavbar={sidebar.length === 0}
                toggleNav={toggleNav}
            />

            <div className="relative flex flex-1 overflow-hidden">
                {/* On mobile the navbar overlays the page (which stays mounted underneath) and closes on navigation */}
                {sidebar.length > 0 && navOpen && (
                    <StandardNavbar
                        items={sidebar}
                        fullScreen={isMobile}
                        onNavigate={isMobile ? closeNav : undefined}
                    />
                )}

                <div className="flex flex-col flex-1 overflow-y-auto p-4 min-h-full">
                    <div className="flex-1">{children}</div>

                    <footer className="w-full h-16 border-t border-gray-300 flex items-center justify-center px-4 pt-4 mt-4 text-sm text-gray-600">
                        <p>&copy; 2026 Dylan McCormick. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default StandardLayout;
