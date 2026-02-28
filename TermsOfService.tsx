import { MobileLayout } from "@/components/nook/MobileLayout";
import { BackHeader } from "@/components/nook/BackHeader";
import { AppFooter } from "@/components/nook/AppFooter";

export default function TermsOfService() {
  const header = <BackHeader to="/" />;

  return (
    <MobileLayout header={header} footer={<AppFooter />}>
      <article className="prose prose-sm dark:prose-invert max-w-none space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Terms of Service for Nook</h1>

        <p>By using Nook, you agree to the following terms:</p>

        <h2 className="text-lg font-semibold text-foreground">1. Community Conduct</h2>
        <p>Users must behave respectfully during meetups. Harassment, abuse, or unsafe behavior is strictly prohibited.</p>

        <h2 className="text-lg font-semibold text-foreground">2. Account Responsibility</h2>
        <p>You are responsible for maintaining the security of your account.</p>

        <h2 className="text-lg font-semibold text-foreground">3. Meetup Participation</h2>
        <p>Meetup availability and attendance depend on participant confirmation. Nook does not guarantee outcomes of in-person interactions.</p>

        <h2 className="text-lg font-semibold text-foreground">4. Platform Usage</h2>
        <p>You agree not to misuse the platform or attempt to disrupt its functionality.</p>

        <h2 className="text-lg font-semibold text-foreground">5. Account Suspension</h2>
        <p>Nook reserves the right to suspend or terminate accounts for violations of these terms.</p>
      </article>
    </MobileLayout>
  );
}
