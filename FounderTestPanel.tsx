import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock, Users, Bell, Mail, BarChart3, RotateCcw, ChevronDown, ChevronUp,
  FlaskConical, UserPlus, UserMinus, Eye, Send, Trash2,
} from "lucide-react";

interface FounderTestPanelProps {
  nookId: string;
  nook: any;
  userId: string;
  userEmail: string;
}

export function FounderTestPanel({ nookId, nook, userId, userEmail }: FounderTestPanelProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const action = useCallback(async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-actions", { body });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      toast({ title: "✅ Done", description: `${body.action}` });
      queryClient.invalidateQueries({ queryKey: ["nook", nookId] });
      return res.data;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [nookId, toast, queryClient]);

  const refreshSnapshot = useCallback(async () => {
    const res = await supabase.functions.invoke("admin-actions", {
      body: { action: "get_nook_snapshot", nook_id: nookId },
    });
    if (res.data) setSnapshot(res.data);
  }, [nookId]);

  const refreshEmailLogs = useCallback(async () => {
    const res = await supabase.functions.invoke("admin-actions", {
      body: { action: "get_email_logs" },
    });
    if (res.data?.logs) setEmailLogs(res.data.logs);
  }, []);

  const simulateTime = (hoursFromNow: number) => {
    const dt = new Date();
    dt.setHours(dt.getHours() + hoursFromNow);
    action({ action: "update_nook_time", nook_id: nookId, new_date_time: dt.toISOString() });
  };

  // Notification preview (popup only, no DB insert)
  const showNotifPreview = (title: string, message: string) => {
    toast({ title, description: message, duration: 8000 });
  };

  // Email preview (popup only)
  const showEmailPreview = (title: string, html: string) => {
    setPreviewTitle(title);
    setPreviewHtml(html);
  };

  const dateStr = nook ? new Date(nook.date_time).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "";
  const timeStr = nook ? new Date(nook.date_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

  const emailTemplates = {
    cancellation: {
      subject: "Your Nook meetup was cancelled ❌",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Your Nook meetup was cancelled ❌</h2><p>Hi there,</p><p>The meetup <strong>"${nook?.topic}"</strong> on <strong>${dateStr}</strong> at <strong>${timeStr}</strong> has been cancelled.</p><p>– Team Nook 💛</p></div>`,
    },
    attendance: {
      subject: "Your attendance has been confirmed ✔️",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Attendance Confirmed ✔️</h2><p>Your attendance at <strong>"${nook?.topic}"</strong> has been marked. Thanks! 🌟</p><p>– Team Nook 💛</p></div>`,
    },
    magic_link: {
      subject: "Your Nook Magic Link 🔮",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Welcome to Nook 🌿</h2><p>Click below to sign in:</p><a href="#" style="display:inline-block;background:#c2785c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Sign In</a><p>– Team Nook 💛</p></div>`,
    },
  };

  const members = snapshot?.members || [];
  const attendance = snapshot?.attendance || [];

  // Readiness counts
  const statusCounts = members.reduce((acc: Record<string, number>, m: any) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); refreshSnapshot(); refreshEmailLogs(); }}
        className="w-full p-4 bg-card rounded-2xl border-2 border-dashed border-primary/30 text-left transition-all hover:border-primary/60"
      >
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-primary" />
          <div>
            <p className="font-semibold text-foreground">🧪 Founder Mode</p>
            <p className="text-xs text-muted-foreground">Tap to open testing tools</p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <button
        onClick={() => setOpen(false)}
        className="w-full p-4 bg-primary/5 rounded-2xl border-2 border-primary/30 text-left"
      >
        <div className="flex items-center gap-3">
          <FlaskConical className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">🧪 Testing This Meetup</p>
          <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>
      </button>

      {/* 1️⃣ Simulate Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> 1️⃣ Simulate Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Current: <strong>{nook?.status}</strong> · {nook?.date_time ? new Date(nook.date_time).toLocaleString() : "N/A"}
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button size="sm" variant="outline" disabled={loading} onClick={() => simulateTime(10)} className="justify-start">
              ⏰ Jump to 10 Hours Before
            </Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={() => simulateTime(1)} className="justify-start">
              ⏰ Jump to 1 Hour Before
            </Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={() => simulateTime(0.05)} className="justify-start">
              🚪 Open Arrival Phase
            </Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={() => simulateTime(-0.1)} className="justify-start">
              ▶️ Start Meetup
            </Button>
            <Button size="sm" variant="outline" disabled={loading} onClick={() => simulateTime(-2)} className="justify-start">
              ⏹️ End Meetup
            </Button>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-xs font-medium mb-1">Force Status</p>
            <div className="flex gap-2">
              {["pending", "confirmed", "cancelled"].map(s => (
                <Button key={s} size="sm" variant={nook?.status === s ? "default" : "outline"} disabled={loading}
                  onClick={() => action({ action: "update_nook_status", nook_id: nookId, status: s })}
                  className="flex-1 text-xs">
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2️⃣ Simulate Participants */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="w-4 h-4" /> 2️⃣ Simulate Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={loading} className="flex-1"
              onClick={async () => {
                await action({ action: "add_dummy_participant", nook_id: nookId });
                refreshSnapshot();
              }}>
              <UserPlus className="w-3.5 h-3.5 mr-1" /> Add Fake Participant
            </Button>
            <Button size="sm" variant="outline" disabled={loading}
              onClick={() => refreshSnapshot()}>
              🔄
            </Button>
          </div>

          {members.length > 0 && (
            <div className="space-y-2">
              {members.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between bg-secondary/30 rounded-lg p-2">
                  <span className="text-xs">{m.user_id.slice(0, 8)}…</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px]">{m.status}</Badge>
                    <button className="text-destructive text-[10px] hover:underline" disabled={loading}
                      onClick={async () => {
                        await action({ action: "remove_participant", nook_id: nookId, user_id: m.user_id });
                        refreshSnapshot();
                      }}>
                      <UserMinus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3️⃣ Preview Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" /> 3️⃣ Preview Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Shows a popup preview only — nothing is saved.</p>
          <Button size="sm" variant="outline" className="w-full justify-start" disabled={loading}
            onClick={() => showNotifPreview("Meetup in 1 Hour ⏰", `Your Nook "${nook?.topic}" starts in 1 hour! Get ready ✨`)}>
            🔔 1-hour reminder
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" disabled={loading}
            onClick={() => showNotifPreview("❌ Meetup Cancelled", `Your Nook "${nook?.topic}" has been cancelled by the host.`)}>
            🔔 Cancellation alert
          </Button>
          <Button size="sm" variant="outline" className="w-full justify-start" disabled={loading}
            onClick={() => showNotifPreview("Attendance Confirmed ✔️", `Your attendance for "${nook?.topic}" has been marked. Thanks! 🌟`)}>
            🔔 Attendance marked
          </Button>
        </CardContent>
      </Card>

      {/* 4️⃣ Preview Emails */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Mail className="w-4 h-4" /> 4️⃣ Preview & Send Emails
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Preview in a popup, or send a real test email to your inbox.</p>
          {Object.entries(emailTemplates).map(([key, tmpl]) => (
            <div key={key} className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 justify-start text-xs" disabled={loading}
                onClick={() => showEmailPreview(tmpl.subject, tmpl.html)}>
                <Eye className="w-3 h-3 mr-1" /> {key}
              </Button>
              <Button size="sm" variant="outline" disabled={loading}
                onClick={async () => {
                  await action({ action: "send_test_email", to: userEmail, subject: `[TEST] ${tmpl.subject}`, html: tmpl.html });
                  refreshEmailLogs();
                }}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {/* Email preview popup */}
          {previewHtml && (
            <div className="border rounded-xl p-3 bg-background">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs font-semibold">{previewTitle}</p>
                <button onClick={() => setPreviewHtml(null)} className="text-xs text-muted-foreground hover:underline">Close</button>
              </div>
              <iframe
                sandbox=""
                srcDoc={previewHtml}
                className="w-full h-48 border-0 rounded"
                title="Email preview"
              />
            </div>
          )}

          {/* Email Logs */}
          {emailLogs.length > 0 && (
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-medium">📧 Recent Email Logs</p>
                <button onClick={refreshEmailLogs} className="text-[10px] text-primary hover:underline">Refresh</button>
              </div>
              <div className="space-y-1 max-h-40 overflow-auto">
                {emailLogs.map((log: any) => (
                  <div key={log.id} className="bg-secondary/30 rounded p-1.5 text-[10px] flex justify-between">
                    <span>{log.email_type} → {log.recipient}</span>
                    <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[9px] h-4">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5️⃣ Group Readiness */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> 5️⃣ Group Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{nook?.current_people || 0}</p>
              <p className="text-[10px] text-muted-foreground">Confirmed</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{statusCounts["approved"] || 0}</p>
              <p className="text-[10px] text-muted-foreground">Approved</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {attendance.filter((a: any) => a.status === "attended").length}
              </p>
              <p className="text-[10px] text-muted-foreground">Arrived</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {attendance.filter((a: any) => a.status === "no_show").length}
              </p>
              <p className="text-[10px] text-muted-foreground">No-shows</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="w-full mt-2 text-xs" onClick={refreshSnapshot}>
            🔄 Refresh Counts
          </Button>
        </CardContent>
      </Card>

      {/* 6️⃣ Reset */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> 6️⃣ Reset Meetup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-2">Resets all statuses, participants, and attendance for re-testing.</p>
          <Button size="sm" variant="destructive" className="w-full" disabled={loading}
            onClick={async () => {
              await action({ action: "reset_nook", nook_id: nookId });
              refreshSnapshot();
            }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Reset Everything
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
