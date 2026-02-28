import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Settings, ScrollText, Send, Plus, RefreshCw, Eye, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";

function useDiscovery() {
  const { toast } = useToast();
  return useCallback(async (body: Record<string, unknown>) => {
    const res = await supabase.functions.invoke("admin-discovery", { body });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }, [toast]);
}

// ─── Alerts / Notifications Panel ───
export function AlertsPanel() {
  const api = useDiscovery();
  const { toast } = useToast();
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api({ action: "list_notification_types" });
      setTypes(data.types || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => { load(); }, [load]);

  const sendTest = async (type: string) => {
    try {
      await api({
        action: "send_test_notification",
        title: `Test: ${type} 🧪`,
        message: `This is a test "${type}" notification from Founder Mode.`,
        type,
      });
      toast({ title: "Test notification sent ✅" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const notifTemplates = [
    { type: "confirmed", label: "Meetup Confirmed", emoji: "✨" },
    { type: "new_participant", label: "New Participant", emoji: "🌙" },
    { type: "reminder", label: "1-Hour Reminder", emoji: "⏰" },
    { type: "cancelled", label: "Cancellation", emoji: "❌" },
    { type: "attendance", label: "Attendance Marked", emoji: "✔️" },
    { type: "update", label: "General Update", emoji: "📢" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" /> Notification Registry
        </h3>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        All notification types auto-discovered. Send test notifications to your account.
      </p>

      {/* Known templates */}
      <div className="space-y-2">
        {notifTemplates.map(t => (
          <div key={t.type} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
            <div>
              <p className="text-sm font-medium">{t.emoji} {t.label}</p>
              <p className="text-[10px] text-muted-foreground">Type: {t.type}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => sendTest(t.type)}>
              <Send className="w-3 h-3 mr-1" /> Test
            </Button>
          </div>
        ))}
      </div>

      {/* Auto-discovered types */}
      {types.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-medium mb-2">Auto-discovered types in database:</p>
          <div className="flex flex-wrap gap-1">
            {types.map(t => (
              <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Email Panel ───
export function EmailPanel({ userEmail }: { userEmail: string }) {
  const api = useDiscovery();
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    try {
      const data = await api({ action: "list_email_logs" });
      setLogs(data.logs || []);
    } catch {}
  }, [api]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const templates = [
    {
      key: "cancellation",
      label: "Cancellation Email",
      subject: "Your Nook meetup was cancelled ❌",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Meetup Cancelled ❌</h2><p>Hi there,</p><p>Your upcoming meetup has been cancelled by the host.</p><p>We hope to see you at another one soon!</p><p>– Team Nook 💛</p></div>`,
    },
    {
      key: "attendance",
      label: "Attendance Email",
      subject: "Your attendance has been confirmed ✔️",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Attendance Confirmed ✔️</h2><p>Your attendance has been marked. Thanks for showing up! 🌟</p><p>– Team Nook 💛</p></div>`,
    },
    {
      key: "magic_link",
      label: "Magic Link Email",
      subject: "Your secure Nook login link 🌙",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Welcome to Nook 🌿</h2><p>Click below to sign in:</p><a href="#" style="display:inline-block;background:#c2785c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Sign In to Nook</a><p style="margin-top:16px;font-size:13px;color:#888;">This link expires in 10 minutes.</p><p>– Team Nook 💛</p></div>`,
    },
    {
      key: "reminder",
      label: "Reminder Email",
      subject: "Your Nook meetup starts in 1 hour ⏰",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;"><h2>Meetup Starting Soon ⏰</h2><p>Your meetup starts in 1 hour. Time to head out!</p><p>– Team Nook 💛</p></div>`,
    },
  ];

  const sendTestEmail = async (tmpl: typeof templates[0]) => {
    setLoading(true);
    try {
      await api({
        action: "send_test_email",
        to: userEmail,
        subject: `[TEST] ${tmpl.subject}`,
        html: tmpl.html,
      });
      toast({ title: "Test email sent ✅", description: `Sent to ${userEmail}` });
      loadLogs();
    } catch (err: any) {
      toast({ title: "Email failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Mail className="w-4 h-4" /> Email Template Manager
      </h3>
      <p className="text-xs text-muted-foreground">
        Preview or send test emails to {userEmail}. New templates auto-appear.
      </p>

      {templates.map(tmpl => (
        <Card key={tmpl.key}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{tmpl.label}</p>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => {
                  setPreviewTitle(tmpl.subject);
                  setPreviewHtml(tmpl.html);
                }}>
                  <Eye className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" disabled={loading} onClick={() => sendTestEmail(tmpl)}>
                  <Send className="w-3 h-3 mr-1" /> Send
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Subject: {tmpl.subject}</p>
          </CardContent>
        </Card>
      ))}

      {/* Email preview */}
      {previewHtml && (
        <Card>
          <CardContent className="p-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs font-semibold">{previewTitle}</p>
              <button onClick={() => setPreviewHtml(null)} className="text-xs text-muted-foreground hover:underline">Close</button>
            </div>
            <iframe
              sandbox=""
              srcDoc={previewHtml}
              className="w-full h-48 border rounded-lg bg-background"
              title="Email preview"
            />
          </CardContent>
        </Card>
      )}

      {/* Email logs */}
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">📧 Delivery Logs</p>
          <Button size="sm" variant="ghost" onClick={loadLogs}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No email logs yet</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="bg-secondary/30 rounded-lg p-2 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span className="font-medium">{log.email_type}</span>
                  <Badge variant={log.status === "sent" ? "default" : "destructive"} className="text-[9px] h-4">
                    {log.status}
                  </Badge>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{log.recipient}</span>
                  <span>{new Date(log.created_at).toLocaleString()}</span>
                </div>
                {log.error_message && (
                  <p className="text-destructive">{log.error_message}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feature Flags Panel ───
export function FlagsPanel() {
  const api = useDiscovery();
  const { toast } = useToast();
  const [flags, setFlags] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api({ action: "list_feature_flags" });
      setFlags(data.flags || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (flagId: string, enabled: boolean) => {
    try {
      await api({ action: "toggle_feature_flag", flag_id: flagId, enabled });
      setFlags(f => f.map(fl => fl.id === flagId ? { ...fl, enabled } : fl));
      toast({ title: enabled ? "Enabled ✅" : "Disabled ⏸️" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const createFlag = async () => {
    if (!newName.trim()) return;
    try {
      await api({ action: "create_feature_flag", name: newName.trim(), description: newDesc.trim() });
      setNewName("");
      setNewDesc("");
      load();
      toast({ title: "Flag created ✅" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Settings className="w-4 h-4" /> Feature Flags
      </h3>
      <p className="text-xs text-muted-foreground">
        Toggle features on/off. New flags auto-appear when created.
      </p>

      {flags.map(flag => (
        <div key={flag.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
          <div className="flex-1 mr-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{flag.name}</p>
              {flag.admin_only && <Badge variant="outline" className="text-[9px]">Admin only</Badge>}
            </div>
            {flag.description && <p className="text-[10px] text-muted-foreground mt-0.5">{flag.description}</p>}
          </div>
          <Switch
            checked={flag.enabled}
            onCheckedChange={(checked) => toggle(flag.id, checked)}
          />
        </div>
      ))}

      {/* Add new flag */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-medium">Add New Flag</p>
          <Input
            placeholder="Flag name (e.g. dark_mode)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="h-9 text-sm"
          />
          <Button size="sm" onClick={createFlag} disabled={!newName.trim()} className="w-full">
            <Plus className="w-3 h-3 mr-1" /> Create Flag
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Event Logs Panel ───
export function LogsPanel() {
  const api = useDiscovery();
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api({ action: "list_events" });
      setEvents(data.events || []);
      setAdminLogs(data.admin_logs || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => { load(); }, [load]);

  const allEntries = [
    ...events.map(e => ({
      id: e.id,
      type: e.event_type,
      source: e.source,
      time: e.created_at,
      details: e.details,
      kind: "event" as const,
    })),
    ...adminLogs.map(l => ({
      id: l.id,
      type: l.action,
      source: "admin",
      time: l.created_at,
      details: l.details,
      kind: "admin" as const,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ScrollText className="w-4 h-4" /> System Events
        </h3>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        All system events auto-logged. New event types appear automatically.
      </p>

      {allEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No events yet</p>
      ) : (
        <div className="space-y-1.5 max-h-[60vh] overflow-auto">
          {allEntries.map(entry => (
            <div key={entry.id} className="bg-card rounded-xl border border-border p-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Badge variant={entry.kind === "admin" ? "default" : "secondary"} className="text-[9px] h-4">
                    {entry.source}
                  </Badge>
                  <span className="text-xs font-medium">{entry.type}</span>
                </div>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(entry.time).toLocaleString()}
                </span>
              </div>
              {entry.details && Object.keys(entry.details).length > 0 && (
                <details>
                  <summary className="text-[9px] text-primary cursor-pointer">Details</summary>
                  <pre className="text-[9px] text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cron Health Monitor Panel ───
const CRON_JOBS = ["nook-auto-mark", "nook-auto-cancel", "nook-reminders"] as const;
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

type CronLog = {
  id: string;
  job_name: string;
  ran_at: string;
  result: {
    processed?: number;
    skipped?: number;
    cancelled?: number;
    reminded?: number;
    error?: string;
    status?: string;
  } | null;
};

export function CronHealthPanel() {
  const [logs, setLogs] = useState<Record<string, CronLog | null>>({});
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        CRON_JOBS.map(async (job) => {
          const { data, error } = await supabase
            .from("system_cron_logs")
            .select("*")
            .eq("job_name", job)
            .order("ran_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (error) throw new Error(error.message);
          return [job, data] as [string, CronLog | null];
        })
      );
      setLogs(Object.fromEntries(results));
    } catch (err: any) {
      toast({ title: "Error loading cron logs", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const getStatus = (log: CronLog | null): "success" | "error" | "stale" | "never" => {
    if (!log) return "never";
    const age = Date.now() - new Date(log.ran_at).getTime();
    if (log.result?.error) return "error";
    if (age > STALE_THRESHOLD_MS) return "stale";
    return "success";
  };

  const statusConfig = {
    success: { icon: CheckCircle2, color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-200", label: "Healthy" },
    error: { icon: XCircle, color: "text-destructive", badge: "bg-destructive/10 text-destructive border-destructive/20", label: "Error" },
    stale: { icon: Clock, color: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 border-amber-200", label: "Stale" },
    never: { icon: Clock, color: "text-muted-foreground", badge: "bg-muted text-muted-foreground border-border", label: "Never ran" },
  };

  const jobLabels: Record<string, string> = {
    "nook-auto-mark": "Auto Mark No-Show",
    "nook-auto-cancel": "Auto Cancel Unconfirmed",
    "nook-reminders": "Starting Soon Reminders",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4" /> System Health
        </h3>
        <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Latest cron run per job. Auto-refreshes every 30 seconds.
      </p>

      <div className="space-y-2">
        {CRON_JOBS.map((job) => {
          const log = logs[job] ?? null;
          const status = getStatus(log);
          const cfg = statusConfig[status];
          const Icon = cfg.icon;
          const result = log?.result;

          return (
            <div key={job} className="bg-card border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <div>
                    <p className="text-sm font-medium">{jobLabels[job]}</p>
                    <p className="text-[10px] text-muted-foreground">{job}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>

              {log ? (
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <div className="text-muted-foreground">
                    Last run:{" "}
                    <span className="text-foreground font-medium">
                      {new Date(log.ran_at).toLocaleString()}
                    </span>
                  </div>
                  {(result?.processed !== undefined || result?.cancelled !== undefined || result?.reminded !== undefined) && (
                    <div className="text-muted-foreground">
                      Processed:{" "}
                      <span className="text-foreground font-medium">
                        {result?.processed ?? result?.cancelled ?? result?.reminded ?? 0}
                      </span>
                    </div>
                  )}
                  {result?.skipped !== undefined && (
                    <div className="text-muted-foreground">
                      Skipped:{" "}
                      <span className="text-foreground font-medium">{result.skipped}</span>
                    </div>
                  )}
                  {result?.error && (
                    <div className="col-span-2 text-destructive truncate" title={result.error}>
                      Error: {result.error.slice(0, 80)}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground">No run recorded yet</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}