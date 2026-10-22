// StandardHeader.tsx
// Contains a header including the logo, app title, and a log out button (if user is logged in)

import { Menu } from "lucide-react";
import { Link } from "react-router";

import HeaderUserMenu from "./HeaderUserMenu";
import { NAV_ID, NAV_TOGGLE_ID } from "./navIds";

interface StandardHeaderProps {
    hideNavbar?: boolean;
    navOpen: boolean;
    toggleNav: () => void;
}

const StandardHeader = ({ hideNavbar, navOpen, toggleNav }: StandardHeaderProps) => {
    return (
        <>
            <link
                rel="icon"
                type="image/x-icon"
                href="https://cdn.mnmzc.dev/logos/dmp.png"
            />

            <header className="w-full h-16 border-b border-gray-300 flex items-center justify-between px-4">
                {/* Left */}
                <div className="flex items-center h-16">
                    {!hideNavbar && (
                        <button
                            type="button"
                            id={NAV_TOGGLE_ID}
                            className="cursor-pointer text-black p-1 mr-1 rounded"
                            aria-label="Navigation menu"
                            aria-expanded={navOpen}
                            aria-controls={navOpen ? NAV_ID : undefined}
                            onClick={toggleNav}>
                            <Menu />
                        </button>
                    )}
                    <Link
                        className="button-link no-underline flex items-center h-16"
                        to="/">
                        {/* decorative: the link's name is the app's name beside it */}
                        <img
                            className="h-full ml-2 mr-2 py-2 dark:invert"
                            alt=""
                            src="https://cdn.mnmzc.dev/logos/dmp-black.png"></img>
                        <span className="text-lg ml-2 mr-2 hover:text-black active:text-black text-black">
                            Assignment Tracker
                        </span>
                    </Link>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 h-16 min-w-0">
                    <HeaderUserMenu />
                </div>
            </header>
        </>
    );
};

export default StandardHeader;
