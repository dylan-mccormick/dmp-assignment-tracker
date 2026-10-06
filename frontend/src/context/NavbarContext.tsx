// NavbarContext.tsx
// Context for whether the sidebar navbar is open, kept across page navigations

import { createContext } from "react";

interface NavbarContextInterface {
    isMobile: boolean;
    navOpen: boolean;
    toggleNav: () => void;
    closeNav: () => void;
}

export const NavbarContext = createContext<NavbarContextInterface>({
    isMobile: false,
    navOpen: true,
    toggleNav: () => {},
    closeNav: () => {}
});
