// navItems.tsx
// Navbar items shared by the signed-in pages

import { Calendar, FileText, Gauge, GraduationCap, User } from "lucide-react";

import type { SidebarComponentProps } from "./components/StandardNavbar";

export const MAIN_NAV_ITEMS: SidebarComponentProps[] = [
    { icon: <Gauge />, label: "Dashboard", href: "/dashboard" },
    { icon: <FileText />, label: "Assignments", href: "/assignments" },
    { icon: <GraduationCap />, label: "Classes", href: "/classes" },
    { icon: <Calendar />, label: "Semesters", href: "/semesters" },
    { icon: <User />, label: "Account", href: "/account" }
];
