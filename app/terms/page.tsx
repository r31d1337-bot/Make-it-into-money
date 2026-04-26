import Link from "next/link";
import MobileNav from "@/components/MobileNav";
import HeaderModelToggle from "@/components/HeaderModelToggle";
import AuthBar from "@/components/AuthBar";
import ToolsMenu from "@/components/ToolsMenu";
import Wordmark from "@/components/Wordmark";

export const metadata = { title: "Terms of Service · mintr" };

const LAST_UPDATED = "April 2026";

export default function TermsPage() {
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
        <div className="hidden items-center gap-2 sm:flex">
          <HeaderModelToggle />          <AuthBar />
        </div>
        <MobileNav />
      </div>

      <article className="markdown">
        <h1>Terms of Service</h1>
        <p className="text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>

        <p>
          Welcome to mintr. By creating an account or using the service, you agree to
          these Terms of Service (&ldquo;Terms&rdquo;). Read them carefully. If you do not
          agree, do not use the service.
        </p>

        <h2>1. The service</h2>
        <p>
          mintr is a web application that uses large language models to generate
          monetization plans, resumes, cover letters, and interview preparation from
          inputs you provide. Outputs are produced by third-party AI (currently
          Anthropic&apos;s Claude models) and are provided as-is for informational
          purposes only. mintr is not a law firm, accounting firm, licensed financial
          advisor, recruiter, or employment agency. Nothing generated constitutes
          legal, financial, tax, career, or medical advice.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 13 years old, or the minimum age of digital consent in
          your jurisdiction (whichever is higher), to use mintr. By using the service
          you represent that you meet this requirement.
        </p>

        <h2>3. Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity under your account. Notify us immediately
          of any unauthorized use. We may suspend or terminate accounts that violate
          these Terms, engage in abuse, or appear to be automated or fraudulent.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the service to generate content that is unlawful, harassing, defamatory, or infringing;</li>
          <li>Attempt to reverse-engineer, scrape, or overload the service;</li>
          <li>Use automated tools to access the service without written permission;</li>
          <li>Resell, rebrand, or redistribute outputs as a wholesale product;</li>
          <li>Impersonate any person or misrepresent your affiliation;</li>
          <li>Submit content you do not have the right to submit.</li>
        </ul>

        <h2>5. Your content</h2>
        <p>
          You retain ownership of the inputs you submit (ideas, resumes, backgrounds,
          job postings) and of the outputs generated for you. You grant mintr a
          limited license to process that content solely to operate the service —
          including sending it to our AI provider, storing it for your history and
          shared plans, and improving the product.
        </p>

        <h2>6. Pricing and billing</h2>
        <p>
          The &ldquo;Turn This Into Money&rdquo; tool is free to use. mintr Pro unlocks
          the resume writer, cover letter writer, and interview-prep tools, and is
          offered as:
        </p>
        <ul>
          <li><strong>Monthly</strong> — $7.99 per month, auto-renewing until cancelled.</li>
          <li><strong>Yearly</strong> — $79 per year, auto-renewing until cancelled.</li>
          <li><strong>Lifetime</strong> — $249 one-time, no renewal.</li>
        </ul>
        <p>
          All prices are in U.S. dollars. Billing is handled by Stripe, Inc.
          Recurring plans continue at the listed price until you cancel. You can
          cancel any time from your Account page; access continues through the end
          of your current paid period.
        </p>

        <h2>7. Refunds</h2>
        <p>
          Because generations consume real AI-inference costs, mintr does not offer
          refunds for partial periods or unused portions of a subscription. Lifetime
          purchases are non-refundable after 7 days from purchase. For billing errors
          or unauthorized charges, contact us at the address below.
        </p>

        <h2>8. Service changes and availability</h2>
        <p>
          We may add, modify, or remove features at any time. We may also pause or
          rate-limit access to prevent abuse or maintain stability. We do not
          guarantee any specific uptime, response time, or quality of AI outputs.
          If we materially degrade or discontinue Pro before the end of your paid
          period, you may request a pro-rated refund.
        </p>

        <h2>9. AI output disclaimer</h2>
        <p>
          Outputs from mintr are generated by machine-learning systems and may be
          inaccurate, incomplete, outdated, or unsuitable for your situation. You
          are solely responsible for reviewing, verifying, and editing any output
          before acting on it, sending it to an employer, publishing it, or making
          financial decisions based on it.
        </p>

        <h2>10. Third-party services</h2>
        <p>
          mintr sends user inputs to Anthropic&apos;s API (Claude) to generate
          outputs. Payments are processed by Stripe. Your use of the service is also
          subject to those providers&apos; terms. We are not responsible for outages,
          errors, or content produced by third-party systems.
        </p>

        <h2>11. Intellectual property</h2>
        <p>
          The mintr name, wordmark, site design, and code are owned by the operator
          of mintr and protected by applicable copyright and trademark law. These
          Terms do not grant you any right to use those marks.
        </p>

        <h2>12. Disclaimers</h2>
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo;
          without warranties of any kind, express or implied, including fitness for
          a particular purpose, non-infringement, or that outputs will be accurate or
          result in any particular outcome (employment, revenue, or otherwise).
        </p>

        <h2>13. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by law, mintr and its operators will not
          be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for lost profits, revenue, data, or opportunities.
          Our total aggregate liability for any claim arising out of these Terms or
          your use of the service shall not exceed the greater of (a) the amount
          you paid to mintr in the twelve months preceding the claim, or (b) USD
          $50.
        </p>

        <h2>14. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless mintr and its operators from any
          claims, damages, or expenses arising out of your use of the service, your
          content, or your violation of these Terms.
        </p>

        <h2>15. Termination</h2>
        <p>
          You can stop using mintr at any time. We may suspend or terminate your
          access, with or without notice, for any material breach of these Terms,
          for reasons of legal compliance, or if we discontinue the service.
        </p>

        <h2>16. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be
          posted on this page with an updated &ldquo;Last updated&rdquo; date. Your
          continued use of the service after changes constitutes acceptance of the
          revised Terms.
        </p>

        <h2>17. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of California, United
          States, without regard to conflicts-of-law principles. Disputes shall be
          resolved in the state or federal courts located in San Francisco County,
          California.
        </p>

        <h2>18. Contact</h2>
        <p>
          Questions about these Terms? Email{" "}
          <a href="mailto:team@adroitventures.io">team@adroitventures.io</a>.
        </p>

        <hr />
        <p className="text-xs text-neutral-500">
          See also: <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </article>
    </main>
  );
}
