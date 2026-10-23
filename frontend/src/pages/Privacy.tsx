// Privacy.tsx
// The Privacy Policy

import { Link } from "react-router";

import LegalDocument from "../components/legal/LegalDocument";
import { LEGAL_CONTACT_EMAIL } from "../legal";

const Privacy = () => {
    return (
        <LegalDocument title="Privacy Policy">
            <p>
                This Privacy Policy explains what information DMP Assignment Tracker (the "Service"), a personal project
                operated by Dylan McCormick ("we", "us"), collects, how it is used, and the choices you have. It applies
                together with our <Link to="/terms">Terms of Service</Link>.
            </p>

            <h2>1. Information we collect</h2>
            <p>
                <strong>From your Google account.</strong> When you sign in with Google, we receive your Google account
                ID, name, email address and profile picture URL. We refresh these from Google each time you sign in. We
                never see your Google password, and we do not request access to your Gmail, Drive, Calendar or any other
                Google data.
            </p>
            <p>
                <strong>Content you enter.</strong> The semesters, classes and assignments you create, including their
                names, dates, types, completion status and notes.
            </p>
            <p>
                <strong>Account records.</strong> When your account was created and last updated, which version of the
                Terms of Service and this Privacy Policy you accepted and when, and a counter used to sign you out of
                every device.
            </p>
            <p>
                <strong>Technical information.</strong> Like most websites, our servers process your IP address and
                details of each request (such as the page requested, time and browser type) to deliver the Service,
                enforce rate limits and investigate errors or abuse. These server logs are rotated automatically and are
                not used to build a profile of you.
            </p>

            <h2>2. Cookies and browser storage</h2>
            <p>
                We store your sign-in session token in your browser's local storage so you stay signed in. It is removed
                when you sign out. We do not use advertising or analytics cookies, and we do not track you across other
                websites. Google's sign-in window and Cloudflare (see below) may set their own cookies, which are
                governed by their own policies.
            </p>

            <h2>3. How we use your information</h2>
            <ul>
                <li>To sign you in and keep your account secure.</li>
                <li>To store, display and summarize your content, such as on your dashboard.</li>
                <li>To protect the Service against abuse, and to diagnose and fix problems.</li>
                <li>To comply with the law.</li>
            </ul>
            <p>
                We do not sell your information, use it for advertising, or use your content to train machine learning
                models.
            </p>

            <h2>4. Who we share it with</h2>
            <p>We share information only with the providers needed to run the Service, and only for that purpose:</p>
            <ul>
                <li>
                    <strong>Google</strong>, to sign you in (
                    <a
                        href="https://policies.google.com/privacy"
                        target="_blank"
                        rel="noreferrer">
                        Google's Privacy Policy
                        <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    ).
                </li>
                <li>
                    <strong>Cloudflare</strong>, which handles network traffic to the Service and protects it from
                    attacks (
                    <a
                        href="https://www.cloudflare.com/privacypolicy/"
                        target="_blank"
                        rel="noreferrer">
                        Cloudflare's Privacy Policy
                        <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    ).
                </li>
                <li>The provider of the server the Service runs on, which stores the Service's data.</li>
            </ul>
            <p>
                We may also disclose information if required by law, or to protect the rights, safety or property of our
                users or others.
            </p>

            <h2>5. Retention and deletion</h2>
            <p>
                We keep your information for as long as your account exists. You can delete your account at any time
                from the Account page. Deleting it immediately deactivates your account and signs you out on every
                device, but your information is retained so that you can restore your account by signing in again.
            </p>
            <p>
                To have your account and content permanently erased, email us at{" "}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> from the address on your account.
                Short-lived caches and backups may take a little longer to clear.
            </p>

            <h2>6. Security</h2>
            <p>
                The Service is served over HTTPS, its databases are not reachable from the internet, and every request
                for your content is checked against your account. No system is perfectly secure, however, so please do
                not store sensitive personal information in the Service.
            </p>

            <h2>7. Your choices and rights</h2>
            <ul>
                <li>You can view your account details on the Account page.</li>
                <li>
                    You can edit or delete your content at any time. Your name, email and picture come from Google, so
                    change them there and sign in again.
                </li>
                <li>You can delete your account, or ask us to permanently erase it, as described above.</li>
                <li>
                    Depending on where you live, you may have additional rights, such as to receive a copy of your
                    information. Contact us to exercise them.
                </li>
            </ul>

            <h2>8. Children</h2>
            <p>
                The Service is not intended for children under 13, and we do not knowingly collect information from
                them. If you believe a child under 13 has created an account, contact us and we will delete it.
            </p>

            <h2>9. Changes to this policy</h2>
            <p>
                We may update this Privacy Policy from time to time. When we do, we will change the effective date
                above. If a change is material, we may ask you to accept the new policy before you continue using the
                Service.
            </p>

            <h2>10. Contact</h2>
            <p>
                Questions about this Privacy Policy can be sent to{" "}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
            </p>
        </LegalDocument>
    );
};

export default Privacy;
