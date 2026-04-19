import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

export const metadata = { title: "Privacy Policy · mintr" };

const LAST_UPDATED = "April 2026";

export default function PrivacyPage() {
  return (
    <main className="relative mx-auto max-w-3xl px-6 py-10">
      <div
        aria-hidden
        className="ambient-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px]"
      />

      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wordmark />
          <ToolsMenu />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthBar />
        </div>
      </div>

      <article className="markdown">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

        <p>
          This Privacy Policy explains what information mintr collects, how we use
          it, and the choices you have. If you have questions, email{" "}
          <a href="mailto:support@mintr.app">support@mintr.app</a>.
        </p>

        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>Account information.</strong> Email address and a hashed
            password when you sign up. We never store plaintext passwords.
          </li>
          <li>
            <strong>Content you submit.</strong> The skills, ideas, resume
            information, job postings, and follow-up messages you type into the
            tools. Plans you explicitly share are saved so that the shared link
            works.
          </li>
          <li>
            <strong>Payment information.</strong> Handled entirely by Stripe. We
            receive only your Stripe customer ID, subscription ID, and plan — we
            never see or store your card number.
          </li>
          <li>
            <strong>Device-local data.</strong> Your history sidebar, checklist
            state, and theme preference are stored in your browser&apos;s
            localStorage. This data stays on your device and is not sent to us.
          </li>
          <li>
            <strong>Basic logs.</strong> Standard server logs (IP address,
            user-agent, request time) are kept for security and debugging.
          </li>
        </ul>

        <h2>2. How we use it</h2>
        <ul>
          <li>To operate the service — sending your inputs to Anthropic&apos;s Claude API to generate outputs.</li>
          <li>To authenticate you and keep your account secure.</li>
          <li>To process payments via Stripe and manage your subscription.</li>
          <li>To prevent abuse, diagnose errors, and improve the product.</li>
        </ul>
        <p>
          We do <strong>not</strong> sell your personal data. We do not use your
          inputs or outputs to train machine-learning models.
        </p>

        <h2>3. Third parties we share with</h2>
        <ul>
          <li>
            <strong>Anthropic</strong> (AI provider). The text you submit is sent
            to Anthropic&apos;s API to generate plans, resumes, cover letters, and
            interview prep. See{" "}
            <a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">
              Anthropic&apos;s privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Stripe</strong> (payments). When you subscribe, your payment
            details are collected directly by Stripe. See{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">
              Stripe&apos;s privacy policy
            </a>
            .
          </li>
          <li>
            <strong>Hosting provider.</strong> Our server code runs on a hosting
            provider (e.g. Vercel) which processes requests on our behalf.
          </li>
          <li>
            <strong>Legal requests.</strong> We may disclose information when
            legally required or to protect the rights, property, or safety of
            users or others.
          </li>
        </ul>

        <h2>4. Retention</h2>
        <p>
          Account and subscription records are retained for as long as your
          account is active, plus a reasonable period afterward to comply with
          legal and accounting obligations. Plans you mark as shared remain
          accessible by link until you delete your account. Content sent to
          Anthropic is subject to Anthropic&apos;s own retention policy.
        </p>

        <h2>5. Your rights</h2>
        <p>You can, at any time:</p>
        <ul>
          <li>Export or delete the data you&apos;ve submitted;</li>
          <li>Cancel your subscription;</li>
          <li>Request deletion of your account and associated data.</li>
        </ul>
        <p>
          Email <a href="mailto:support@mintr.app">support@mintr.app</a> to make
          a request. Depending on where you live, you may have additional rights
          under GDPR, CCPA, or similar laws.
        </p>

        <h2>6. Cookies</h2>
        <p>
          We use a single session cookie (<code>mintr.session</code>) to keep you
          signed in. It is httpOnly, SameSite=Lax, and cleared when you log out.
          We do not use third-party advertising or analytics cookies.
        </p>

        <h2>7. Children&apos;s privacy</h2>
        <p>
          mintr is not directed to children under 13. We do not knowingly collect
          information from children under 13. If you believe a child has provided
          us personal information, email us and we will delete it.
        </p>

        <h2>8. Security</h2>
        <p>
          We use industry-standard measures (HTTPS in transit, hashed passwords,
          signed sessions) to protect your data. No system is 100% secure; if you
          believe your account has been compromised, email us immediately.
        </p>

        <h2>9. Changes</h2>
        <p>
          We may update this policy over time. Material changes will be posted on
          this page with a new &ldquo;Last updated&rdquo; date. Your continued
          use of the service after changes constitutes acceptance of the revised
          policy.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions or requests? Email{" "}
          <a href="mailto:support@mintr.app">support@mintr.app</a>.
        </p>

        <hr />
        <p className="text-xs text-neutral-500">
          See also: <Link href="/terms">Terms of Service</Link>.
        </p>
      </article>
    </main>
  );
}
