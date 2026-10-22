// RouteFocus.tsx
// Moves focus to the new page's main content after a route change, so keyboard and screen reader users start there
// instead of on <body> (where focus falls when the clicked link unmounts with the old page)

import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

const RouteFocus = () => {
    const { pathname } = useLocation();
    const firstRender = useRef(true);

    useEffect(() => {
        // the first page load starts at the top of the document, as usual
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        // leave focus alone if the new page already placed it (e.g. autoFocus on a form's first field)
        if (document.activeElement && document.activeElement !== document.body) return;
        document.getElementById("main")?.focus();
    }, [pathname]);

    return null;
};

export default RouteFocus;
