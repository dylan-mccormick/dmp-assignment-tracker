// LegalDocument.tsx
// Layout for a legal document page (Terms of Service, Privacy Policy), readable whether or not the user is signed in

import { type ReactNode, useContext } from "react";

import { UserContext } from "../../context/UserContext";
import { LEGAL_EFFECTIVE_DATE } from "../../legal";
import { MAIN_NAV_ITEMS } from "../../navItems";
import StandardLayout from "../StandardLayout";

interface LegalDocumentProps {
    title: string;
    children: ReactNode;
}

const LegalDocument = ({ title, children }: LegalDocumentProps) => {
    // Context
    const { user } = useContext(UserContext);

    return (
        <StandardLayout
            title={title}
            sidebar={user.loggedIn ? MAIN_NAV_ITEMS : []}>
            <article className="max-w-3xl mx-auto pb-8 leading-relaxed [&_h2]:text-xl [&_h2]:font-light [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline">
                <h1 className="text-3xl font-extralight mb-2">{title}</h1>
                <p className="text-gray-600">Effective {LEGAL_EFFECTIVE_DATE}</p>
                {children}
            </article>
        </StandardLayout>
    );
};

export default LegalDocument;
