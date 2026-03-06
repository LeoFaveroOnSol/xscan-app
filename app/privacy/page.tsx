import { Shield, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - XSCAN',
  description: 'Privacy Policy for XSCAN - KOL Performance Tracking Platform',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            Legal
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              Welcome to XSCAN ("we," "our," or "us"). We are committed to protecting your privacy
              and ensuring the security of your personal information. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our
              platform and services.
            </p>
            <p className="text-muted-foreground">
              By accessing or using XSCAN, you agree to the terms of this Privacy Policy. If you
              do not agree with our policies and practices, please do not use our services.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Wallet Address:</strong> When you connect your
                Solana wallet, we store your public wallet address for verification and identification purposes.
              </li>
              <li>
                <strong className="text-foreground">Twitter/X Handle:</strong> If you apply as a KOL,
                we collect your Twitter handle to monitor and track your public calls.
              </li>
              <li>
                <strong className="text-foreground">Application Information:</strong> Any additional
                information you provide when applying to be listed as a KOL.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Information Automatically Collected</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Usage Data:</strong> Information about how you
                interact with our platform, including pages visited and features used.
              </li>
              <li>
                <strong className="text-foreground">Device Information:</strong> Browser type,
                operating system, and device identifiers.
              </li>
              <li>
                <strong className="text-foreground">Log Data:</strong> IP address, access times,
                and referring URLs.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.3 Public Blockchain Data</h3>
            <p className="text-muted-foreground">
              We collect and analyze publicly available blockchain data, including transaction
              history and token holdings associated with public wallet addresses. This data is
              inherently public on the Solana blockchain.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the collected information to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Track and display KOL performance metrics</li>
              <li>Verify KOL applications and identities</li>
              <li>Detect and prevent fraudulent activity, including side wallet tracking</li>
              <li>Communicate with you about updates, features, and announcements</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell your personal information. We may share your information in the
              following circumstances:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Public Display:</strong> KOL profiles,
                performance metrics, and call history are publicly displayed on our platform.
              </li>
              <li>
                <strong className="text-foreground">Service Providers:</strong> We may share
                information with third-party service providers who help us operate our platform.
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements:</strong> We may disclose
                information if required by law or to protect our rights and safety.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your
              information against unauthorized access, alteration, disclosure, or destruction.
              However, no method of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your personal information (subject to legal requirements)</li>
              <li>Opt out of marketing communications</li>
              <li>Disconnect your wallet at any time</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use essential cookies to ensure our platform functions correctly. We may also
              use analytics cookies to understand how users interact with our platform. You can
              control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">8. Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our platform may contain links to third-party websites or services. We are not
              responsible for the privacy practices of these third parties. We encourage you
              to read their privacy policies.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">9. Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not intended for individuals under the age of 18. We do not
              knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new Privacy Policy on this page and updating the "Last
              updated" date. Your continued use of the platform after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us through our official Twitter/X account or Discord server.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/"
            className="text-primary hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
