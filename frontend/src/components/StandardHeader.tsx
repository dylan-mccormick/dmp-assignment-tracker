// StandardHeader.tsx
// Contains a header including the logo, app title, and a log out button (if user is logged in)

import { Menu } from "lucide-react";
import { Link } from "react-router";

interface StandardHeaderProps {
    hideNavbar?: boolean;
    setNavOpen: (_: (b: boolean) => boolean) => void;
}

const StandardHeader = ({ hideNavbar, setNavOpen }: StandardHeaderProps) => {
    return (
        <>
            <link
                rel="icon"
                type="image/x-icon"
                href="https://cdn.mnmzc.us.to/logos/dmp.png"
            />

            <header className="w-full h-16 border-b border-gray-300 flex items-center justify-between px-4">
                {/* Left */}
                <div className="flex items-center h-16">
                    <button className={`button-link text-black ${hideNavbar ? "hidden" : ""}`}>
                        <Menu
                            className="mr-2"
                            onClick={() => setNavOpen(n => !n)}
                        />
                    </button>
                    <Link
                        className="button-link no-underline flex items-center h-16"
                        to="/">
                        <img
                            className="h-full ml-2 mr-2 py-2"
                            alt="DMP Service Logo"
                            src="https://cdn.mnmzc.us.to/logos/dmp-black.png"></img>
                        <h3 className="text-lg ml-2 mr-2 hover:text-black active:text-black text-black">
                            Assignment Tracker
                        </h3>
                    </Link>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 h-16"></div>
            </header>
        </>
    );
};

export default StandardHeader;
