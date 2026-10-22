// StandardLayout.tsx
// Layout component to include a skip link, a standard header, collapsible sidebar (mobile responsive), footer, and the
// main content area (the `main` landmark, which navigation and the skip link move focus to)

import { type MouseEvent, useContext } from "react";

import { NavbarContext } from "../context/NavbarContext";
import StandardHeader from "./StandardHeader";
import type { SidebarComponentProps } from "./StandardNavbar";
import StandardNavbar from "./StandardNavbar";

interface StandardLayoutProps {
    title: string;
    sidebar: SidebarComponentProps[];
    children?: React.ReactNode;
}

// Focuses main directly: a plain #main link would be a router-unaware hash change
const skipToMain = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById("main")?.focus();
};

const StandardLayout = ({ title, sidebar, children }: StandardLayoutProps) => {
    // Context
    const { isMobile, navOpen, toggleNav, closeNav } = useContext(NavbarContext);

    const hasNav = sidebar.length > 0;
    // the mobile navbar covers the page, so the page underneath is inert while it's open
    const navCoversPage = hasNav && navOpen && isMobile;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col">
            <title>{title ? title + " | DMP Assignment Tracker" : "DMP Assignment Tracker"}</title>

            <a
                href="#main"
                onClick={skipToMain}
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded focus:bg-white focus:text-primary focus:underline focus:shadow-md">
                Skip to content
            </a>

            <StandardHeader
                hideNavbar={!hasNav}
                navOpen={navOpen}
                toggleNav={toggleNav}
            />

            <div className="relative flex flex-1 overflow-hidden">
                {/* On mobile the navbar overlays the page (which stays mounted underneath) and closes on navigation */}
                {hasNav && navOpen && (
                    <StandardNavbar
                        items={sidebar}
                        fullScreen={isMobile}
                        onNavigate={isMobile ? closeNav : undefined}
                        onClose={isMobile ? closeNav : undefined}
                    />
                )}

                <div
                    inert={navCoversPage}
                    className="flex flex-col flex-1 overflow-y-auto p-4 min-h-full">
                    <main
                        id="main"
                        tabIndex={-1}
                        className="flex-1 outline-none">
                        {children}
                    </main>

                    <footer className="w-full h-16 border-t border-gray-300 flex items-center justify-center px-4 pt-4 mt-4 text-sm text-gray-600">
                        <p>&copy; 2026 Dylan McCormick. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default StandardLayout;
