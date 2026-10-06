// NavbarContextProvider.tsx
// Holds the state for NavbarContext: open by default on desktop, closed on mobile, reset when crossing the breakpoint

import { type ReactNode, useCallback, useState } from "react";

import useIsMobile from "../hooks/useIsMobile";
import { NavbarContext } from "./NavbarContext";

const NavbarContextProvider = ({ children }: { children: ReactNode }) => {
    const isMobile = useIsMobile();

    // The user's explicit choice, or null to use the default for the current screen size
    const [userNavOpen, setUserNavOpen] = useState<boolean | null>(null);

    // Crossing the breakpoint discards the user's choice, so each mode starts from its default.
    // Adjusting state during render (rather than in an effect) avoids a frame with the stale value.
    const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
    if (prevIsMobile !== isMobile) {
        setPrevIsMobile(isMobile);
        setUserNavOpen(null);
    }

    const navOpen = userNavOpen ?? !isMobile;

    const toggleNav = useCallback(() => setUserNavOpen(!navOpen), [navOpen]);
    const closeNav = useCallback(() => setUserNavOpen(false), []);

    return (
        <NavbarContext.Provider value={{ isMobile, navOpen, toggleNav, closeNav }}>{children}</NavbarContext.Provider>
    );
};

export default NavbarContextProvider;
