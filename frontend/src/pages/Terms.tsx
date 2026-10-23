// Terms.tsx
// The Terms of Service

import { Link } from "react-router";

import LegalDocument from "../components/legal/LegalDocument";
import { LEGAL_CONTACT_EMAIL } from "../legal";

const Terms = () => {
    return (
        <LegalDocument title="Terms of Service">
            <p>
                These Terms of Service ("Terms") govern your use of DMP Assignment Tracker (the "Service"), a personal
                project operated by Dylan McCormick ("we", "us"). By creating an account or using the Service, you agree
                to these Terms and to our <Link to="/privacy">Privacy Policy</Link>. If you do not agree, do not use the
                Service.
            </p>

            <h2>1. Eligibility and accounts</h2>
            <ul>
                <li>You must be at least 13 years old to use the Service.</li>
                <li>
                    You sign in with a Google account. Each Google account has at most one account on the Service, and
                    you are responsible for activity that happens under it.
                </li>
                <li>
                    Signing out ends your sessions on every device. If you believe someone else has accessed your
                    account, sign out and secure your Google account.
                </li>
            </ul>

            <h2>2. Your content</h2>
            <p>
                You keep ownership of everything you enter into the Service, such as semesters, classes, assignments and
                notes ("Your Content"). You give us permission to store, process and display Your Content only as needed
                to provide the Service to you. We do not sell Your Content or use it for advertising.
            </p>
            <p>
                You are responsible for Your Content. Do not enter anything you are not allowed to share, and do not use
                the Service to store sensitive personal information such as government ID numbers, financial account
                details or health records.
            </p>

            <h2>3. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul>
                <li>break the law, or use the Service to harm or harass others;</li>
                <li>
                    attempt to access other users' data, or probe, scan or test the Service's security without
                    permission;
                </li>
                <li>
                    disrupt or overload the Service, including by circumventing rate limits or using automated means to
                    access it in bulk;
                </li>
                <li>reverse engineer, resell or misrepresent the Service.</li>
            </ul>

            <h2>4. The Service is provided "as is"</h2>
            <p>
                The Service is a free, personal project. It is provided "as is" and "as available", without warranties
                of any kind, express or implied, including warranties of merchantability, fitness for a particular
                purpose, accuracy and non-infringement. We do not guarantee that the Service will be available,
                error-free or secure, or that Your Content will never be lost.
            </p>
            <p>
                <strong>
                    Do not rely on the Service as your only record of deadlines or coursework. Always check due dates
                    with your instructor or your school's official systems.
                </strong>
            </p>

            <h2>5. Limitation of liability</h2>
            <p>
                To the fullest extent permitted by law, we are not liable for any indirect, incidental, special,
                consequential or punitive damages, or for any loss of data, grades, opportunities or profits, arising
                from your use of or inability to use the Service, including missed deadlines. Our total liability for
                any claim relating to the Service is limited to the amount you paid to use it, which is zero.
            </p>

            <h2>6. Ending your use</h2>
            <p>
                You can stop using the Service at any time and delete your account from the Account page. We may suspend
                or delete accounts that violate these Terms, and we may change, suspend or discontinue the Service at
                any time, with or without notice.
            </p>

            <h2>7. Changes to these Terms</h2>
            <p>
                We may update these Terms from time to time. When we do, we will change the effective date above. If a
                change is material, we may ask you to accept the new Terms before you continue using the Service.
            </p>

            <h2>8. Contact</h2>
            <p>
                Questions about these Terms can be sent to{" "}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>
        </LegalDocument>
    );
};

export default Terms;
