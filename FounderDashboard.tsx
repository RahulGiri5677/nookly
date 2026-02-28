import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/nook/MobileLayout";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { DbExplorer } from "@/components/founder/DbExplorer";
import { AlertsPanel, EmailPanel, FlagsPanel, LogsPanel, CronHealthPanel } from "@/components/founder/FounderPanels";
import { BackHeader } from "@/components/nook/BackHeader";
import {
  Database, Bell, Mail, Settings, ScrollText, Activity,
} from "lucide-react";

type Tab = "data" | "alerts" | "email" | "flags" | "logs" | "health";

export default function FounderDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const [tab, setTab] = useState<Tab>("data");

  useEffect(() => {
    if (!authLoading && !roleLoading && (!user || !isAdmin)) {
      navigate("/home", { replace: true });
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return <MobileLayout centered><p className="text-muted-foreground">Loading...</p></MobileLayout>;
  }

  const tabs: { id: Tab; icon: typeof Database; label: string }[] = [
    { id: "data", icon: Database, label: "Data" },
    { id: "alerts", icon: Bell, label: "Alerts" },
    { id: "email", icon: Mail, label: "Email" },
    { id: "flags", icon: Settings, label: "Flags" },
    { id: "logs", icon: ScrollText, label: "Logs" },
    { id: "health", icon: Activity, label: "Health" },
  ];

  const header = <BackHeader to="/home" />;

  return (
    <MobileLayout header={header}>
      <div className="space-y-4 pb-24">
        {/* Tab bar */}
        <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-shrink-0 flex flex-col items-center gap-0.5 py-2 px-2 rounded-lg text-[10px] transition-colors min-w-[44px] ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm font-medium"
                  : "text-muted-foreground"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "data" && <DbExplorer />}
        {tab === "alerts" && <AlertsPanel />}
        {tab === "email" && <EmailPanel userEmail={user?.email || ""} />}
        {tab === "flags" && <FlagsPanel />}
        {tab === "logs" && <LogsPanel />}
        {tab === "health" && <CronHealthPanel />}
      </div>
    </MobileLayout>
  );
}
