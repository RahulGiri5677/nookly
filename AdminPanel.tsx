import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { FlaskConical } from "lucide-react";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user || !isAdmin) {
        navigate("/home", { replace: true });
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <MobileLayout centered><p className="text-muted-foreground">Loading...</p></MobileLayout>;
  }

  return (
    <MobileLayout centered>
      <div className="text-center space-y-6 p-6">
        <FlaskConical className="w-12 h-12 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">🧪 Founder Mode</h1>
        <p className="text-muted-foreground text-sm">
          Testing tools are now built into each meetup page.
        </p>
        <p className="text-muted-foreground text-sm">
          Go to any nook and scroll down to find the <strong>🧪 Founder Mode</strong> section.
        </p>
        <button
          onClick={() => navigate("/explore")}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
        >
          Browse Meetups
        </button>
        <button
          onClick={() => navigate("/home")}
          className="w-full px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium flex items-center justify-center gap-2"
        >
          🔙 Exit Founder Mode
        </button>
      </div>
    </MobileLayout>
  );
}
