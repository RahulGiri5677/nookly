import { MobileLayout } from "@/components/nook/MobileLayout";
import { BackHeader } from "@/components/nook/BackHeader";
import { AppFooter } from "@/components/nook/AppFooter";

export default function PrivacyPolicy() {
  const header = <BackHeader to="/" />;

  return (
    <MobileLayout header={header} footer={<AppFooter />}>
      <article className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Privacy Policy for Nook</h1>
        <p className="text-muted-foreground text-sm">Last updated: February 13, 2026</p>

        <p>Nook respects your privacy and is committed to protecting your personal information.</p>

        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Name (if provided)</li>
          <li>Email address</li>
          <li>Profile details</li>
          <li>Meetup participation and attendance data</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">2. How We Use Information</h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
          <li>Create and manage your account</li>
          <li>Enable meetup participation</li>
          <li>Send notifications related to your meetups</li>
          <li>Improve user experience and platform safety</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground">3. Data Sharing</h2>
        <p>We do not sell or rent your personal information. Data may be processed securely by trusted service providers for hosting, authentication, and notifications.</p>

        <h2 className="text-lg font-semibold text-foreground">4. Data Security</h2>
        <p>We implement reasonable security measures to protect your information.</p>

        <h2 className="text-lg font-semibold text-foreground">5. User Rights</h2>
        <p>You may update your profile information at any time. If you wish to delete your account, you may contact us.</p>

        <h2 className="text-lg font-semibold text-foreground">6. Contact</h2>
        <p>For privacy-related concerns, contact: <a href="mailto:support@nookly.me" className="text-primary hover:underline">support@nookly.me</a></p>
      </article>
    </MobileLayout>
  );
}
