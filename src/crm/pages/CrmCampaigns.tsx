import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import {
  Send, Users, MessageSquare, ChevronLeft, ChevronRight, Filter, Check,
  History, Copy, RotateCcw, Search, X, Pause, Play,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { renderTemplate, whatsappLink, messageHint } from "@/crm/lib/customerHelpers";
import { useCustomerSettings } from "@/crm/hooks/useCustomerSettings";

type Customer = {
  id: string; name: string; phone: string; whatsapp: string | null;
  rank: string | null; source_mode: string | null; occupation: string | null;
  city: string | null; total_purchases: number; total_value: number;
  dob: string | null; anniversary_date: string | null; last_purchase_date: string | null;
};

type Filters = {
  ranks: string[]; sources: string[]; occupations: string[];
  customerType: "all" | "new" | "repeat";
  city: string;
  minValue: string; maxValue: string;
  search: string;
};

const emptyFilters: Filters = {
  ranks: [], sources: [], occupations: [],
  customerType: "all", city: "", minValue: "", maxValue: "", search: "",
};

const campaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name required").max(120),
  type: z.string().trim().max(60).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message required").max(2000, "Message too long (max 2000)"),
});

const PLACEHOLDERS = ["customer_name", "rank", "city", "occupation", "company_name"];

export default function CrmCampaigns() {
  const [tab, setTab] = useState("new");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [campaignName, setCampaignName] = useState("");
  const [campaignType, setCampaignType] = useState("");
  const [message, setMessage] = useState("");
  const [companyName, setCompanyName] = useState("The Computer Solutions");

  // Sending state
  const [sending, setSending] = useState(false);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, skipped: 0 });
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const ranks = useCustomerSettings("rank");
  const sources = useCustomerSettings("source_mode");
  const occupations = useCustomerSettings("occupation");
  const campaignTypes = useCustomerSettings("campaign_type");

  const loadData = async () => {
    setLoading(true);
    const [custRes, campRes, tplRes] = await Promise.all([
      supabase.from("crm_customers").select("id, name, phone, whatsapp, rank, source_mode, occupation, city, total_purchases, total_value, dob, anniversary_date, last_purchase_date"),
      supabase.from("campaigns" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("campaign_templates" as any).select("*").eq("is_active", true).order("name"),
    ]);
    setCustomers((custRes.data || []) as any);
    setCampaigns(campRes.data || []);
    setTemplates(tplRes.data || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Apply filters → audience
  const audience = useMemo(() => {
    return customers.filter((c) => {
      if (filters.ranks.length && !filters.ranks.includes(c.rank || "")) return false;
      if (filters.sources.length && !filters.sources.includes(c.source_mode || "")) return false;
      if (filters.occupations.length && !filters.occupations.includes(c.occupation || "")) return false;
      if (filters.customerType === "new" && (c.total_purchases || 0) >= 2) return false;
      if (filters.customerType === "repeat" && (c.total_purchases || 0) < 2) return false;
      if (filters.city && !(c.city || "").toLowerCase().includes(filters.city.toLowerCase())) return false;
      const min = parseFloat(filters.minValue); if (!isNaN(min) && (c.total_value || 0) < min) return false;
      const max = parseFloat(filters.maxValue); if (!isNaN(max) && (c.total_value || 0) > max) return false;
      const s = filters.search.toLowerCase();
      if (s && !c.name.toLowerCase().includes(s) && !c.phone.includes(s)) return false;
      // Must have a phone to message
      if (!(c.whatsapp || c.phone)) return false;
      return true;
    });
  }, [customers, filters]);

  // Sync selected with audience when filters change
  useEffect(() => {
    setSelectedIds(new Set(audience.map((a) => a.id)));
  }, [audience]);

  const toggleArrayFilter = (key: "ranks" | "sources" | "occupations", val: string) => {
    setFilters((f) => {
      const arr = new Set(f[key]);
      arr.has(val) ? arr.delete(val) : arr.add(val);
      return { ...f, [key]: Array.from(arr) };
    });
  };

  const insertPlaceholder = (ph: string) => {
    setMessage((m) => `${m}{{${ph}}}`);
  };

  const applyTemplate = (tplId: string) => {
    const t = templates.find((x) => x.id === tplId);
    if (!t) return;
    setMessage(t.message_body || "");
    if (!campaignName) setCampaignName(t.name);
    if (!campaignType && t.type) setCampaignType(t.type);
  };

  const previewMessage = useMemo(() => {
    const sample = audience[0];
    if (!sample) return message;
    return renderTemplate(message, {
      customer_name: sample.name, rank: sample.rank || "Customer",
      city: sample.city || "", occupation: sample.occupation || "",
      company_name: companyName,
    });
  }, [message, audience, companyName]);

  const goToStep2 = () => {
    if (selectedIds.size === 0) { toast.error("No customers selected"); return; }
    setStep(2);
  };

  const goToStep3 = () => {
    const parsed = campaignSchema.safeParse({ name: campaignName, type: campaignType, message });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message); return;
    }
    setStep(3);
  };

  const startSending = async () => {
    setSending(true); setPaused(false);
    const targets = audience.filter((c) => selectedIds.has(c.id));
    setProgress({ done: 0, total: targets.length, skipped: 0 });

    const { data: { user } } = await supabase.auth.getUser();

    // Create campaign row
    const { data: camp, error: cErr } = await (supabase as any).from("campaigns").insert({
      name: campaignName, type: campaignType || null, message_body: message,
      total_targeted: targets.length, status: "sending",
      filters_snapshot: filters, created_by: user?.id,
    }).select().single();
    if (cErr || !camp) { toast.error("Failed: " + (cErr?.message || "")); setSending(false); return; }
    setCampaignId(camp.id);

    let done = 0, skipped = 0;
    for (let i = 0; i < targets.length; i++) {
      // Wait while paused
      while (paused) await new Promise((r) => setTimeout(r, 400));

      const c = targets[i];
      const phone = c.whatsapp || c.phone;
      if (!phone) { skipped++; setProgress({ done, total: targets.length, skipped }); continue; }

      const personalised = renderTemplate(message, {
        customer_name: c.name, rank: c.rank || "Customer",
        city: c.city || "", occupation: c.occupation || "",
        company_name: companyName,
      });

      // Open WA tab
      window.open(whatsappLink(phone, personalised), "_blank");

      // Log recipient + WA log
      await Promise.all([
        (supabase as any).from("campaign_recipients").insert({
          campaign_id: camp.id, customer_id: c.id,
          personalised_message: personalised, status: "sent", sent_at: new Date().toISOString(),
        }),
        supabase.from("crm_whatsapp_log").insert({
          customer_id: c.id, customer_name: c.name, phone,
          message_text: personalised, message_hint: messageHint(personalised),
          message_type: "campaign", sent_from_section: "campaigns",
          campaign_id: camp.id, sent_by: user?.id,
        }),
      ]);

      done++;
      setProgress({ done, total: targets.length, skipped });
      // Stagger so browser doesn't block popups
      await new Promise((r) => setTimeout(r, 1200));
    }

    await (supabase as any).from("campaigns").update({
      status: "completed", sent_count: done, skipped_count: skipped,
    }).eq("id", camp.id);

    setSending(false);
    toast.success(`Campaign sent to ${done} customers (${skipped} skipped)`);
    loadData();
  };

  const resetWizard = () => {
    setStep(1); setFilters(emptyFilters); setSelectedIds(new Set());
    setCampaignName(""); setCampaignType(""); setMessage("");
    setProgress({ done: 0, total: 0, skipped: 0 }); setCampaignId(null);
  };

  const duplicateCampaign = (c: any) => {
    setCampaignName(c.name + " (copy)");
    setCampaignType(c.type || "");
    setMessage(c.message_body || "");
    if (c.filters_snapshot) setFilters({ ...emptyFilters, ...c.filters_snapshot });
    setStep(1); setTab("new");
    toast.info("Loaded into wizard — review and send");
  };

  if (loading) return <div className="text-slate-400">Loading campaigns…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">WhatsApp Campaigns</h1>
        <p className="text-sm text-slate-400">Bulk message customers with personalised templates</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="new"><Send size={14} className="mr-1.5" /> New Campaign</TabsTrigger>
          <TabsTrigger value="history"><History size={14} className="mr-1.5" /> History ({campaigns.length})</TabsTrigger>
        </TabsList>

        {/* ====================== NEW CAMPAIGN WIZARD ====================== */}
        <TabsContent value="new" className="space-y-4 mt-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step === n ? "bg-blue-500 text-white" :
                  step > n ? "bg-green-500 text-white" : "bg-slate-800 text-slate-500"
                }`}>
                  {step > n ? <Check size={14} /> : n}
                </div>
                <div className={`text-xs ${step >= n ? "text-white" : "text-slate-500"}`}>
                  {n === 1 ? "Audience" : n === 2 ? "Compose" : "Send"}
                </div>
                {n < 3 && <div className={`flex-1 h-0.5 ${step > n ? "bg-green-500" : "bg-slate-800"}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Audience */}
          {step === 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Filter size={16} /> Filter Audience
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Customer Type</label>
                  <select value={filters.customerType}
                    onChange={(e) => setFilters((f) => ({ ...f, customerType: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white">
                    <option value="all">All</option>
                    <option value="new">New (1 purchase)</option>
                    <option value="repeat">Repeat (2+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">City contains</label>
                  <input value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Min Spend (₹)</label>
                  <input type="number" value={filters.minValue} onChange={(e) => setFilters((f) => ({ ...f, minValue: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Max Spend (₹)</label>
                  <input type="number" value={filters.maxValue} onChange={(e) => setFilters((f) => ({ ...f, maxValue: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                </div>
              </div>

              {/* Multi-select chips */}
              {[
                { label: "Rank", key: "ranks" as const, opts: ranks },
                { label: "Source", key: "sources" as const, opts: sources },
                { label: "Occupation", key: "occupations" as const, opts: occupations },
              ].map(({ label, key, opts }) => (
                <div key={key}>
                  <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {opts.length === 0 && <div className="text-xs text-slate-500">No options — add in Admin</div>}
                    {opts.map((o) => {
                      const active = filters[key].includes(o.value);
                      return (
                        <button key={o.id} onClick={() => toggleArrayFilter(key, o.value)}
                          className={`px-2.5 py-1 rounded-full text-xs border ${
                            active ? "bg-blue-500/20 border-blue-400 text-blue-200" : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                          }`}
                          style={active && o.colour ? { borderColor: o.colour, color: o.colour } : {}}>
                          {o.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input placeholder="Search by name or phone within audience"
                  value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-200">
                  <Users size={16} />
                  <span className="font-semibold">{audience.length}</span> customers match
                  <span className="text-blue-300/70 text-xs">({selectedIds.size} selected)</span>
                </div>
                <button onClick={() => setFilters(emptyFilters)} className="text-xs text-slate-400 hover:text-white">
                  <X size={12} className="inline mr-1" /> Reset filters
                </button>
              </div>

              {/* Audience preview list */}
              {audience.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded">
                  {audience.slice(0, 100).map((c) => (
                    <label key={c.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-800/50 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.has(c.id)} onChange={(e) => {
                        setSelectedIds((s) => { const ns = new Set(s); e.target.checked ? ns.add(c.id) : ns.delete(c.id); return ns; });
                      }} />
                      <span className="text-white flex-1 truncate">{c.name}</span>
                      <span className="text-xs text-slate-500">{c.phone}</span>
                      {c.rank && <span className="text-xs px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">{c.rank}</span>}
                    </label>
                  ))}
                  {audience.length > 100 && <div className="text-xs text-slate-500 text-center py-2">+ {audience.length - 100} more (all included)</div>}
                </div>
              )}

              <div className="flex justify-end">
                <button onClick={goToStep2} disabled={selectedIds.size === 0}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm flex items-center gap-1.5">
                  Next: Compose <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Compose */}
          {step === 2 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <MessageSquare size={16} /> Compose Message
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Campaign Name *</label>
                  <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} maxLength={120}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Type</label>
                  <select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white">
                    <option value="">— Select —</option>
                    {campaignTypes.map((t) => <option key={t.id} value={t.value}>{t.value}</option>)}
                  </select>
                </div>
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Load Template (optional)</label>
                  <select onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white">
                    <option value="">— Pick a template —</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.name}{t.type ? ` (${t.type})` : ""}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400">Message *</label>
                  <span className="text-xs text-slate-500">{message.length} / 2000</span>
                </div>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={2000}
                  placeholder="Hi {{customer_name}}, ..."
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white font-mono" />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-xs text-slate-500">Insert:</span>
                  {PLACEHOLDERS.map((p) => (
                    <button key={p} onClick={() => insertPlaceholder(p)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-blue-300 border border-slate-700">
                      {`{{${p}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Company Name (for {`{{company_name}}`})</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={100}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white" />
              </div>

              {message && audience[0] && (
                <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
                  <div className="text-xs text-slate-500 mb-1">Preview (using {audience[0].name}):</div>
                  <div className="text-sm text-slate-200 whitespace-pre-wrap">{previewMessage}</div>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm flex items-center gap-1.5">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={goToStep3} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm flex items-center gap-1.5">
                  Next: Review & Send <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Send */}
          {step === 3 && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Send size={16} /> Review & Send
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/60 rounded p-3">
                  <div className="text-xs text-slate-500">Campaign</div>
                  <div className="text-white font-medium truncate">{campaignName}</div>
                  {campaignType && <div className="text-xs text-blue-300 mt-1">{campaignType}</div>}
                </div>
                <div className="bg-slate-800/60 rounded p-3">
                  <div className="text-xs text-slate-500">Recipients</div>
                  <div className="text-white font-medium">{selectedIds.size}</div>
                </div>
                <div className="bg-slate-800/60 rounded p-3">
                  <div className="text-xs text-slate-500">Message length</div>
                  <div className="text-white font-medium">{message.length} chars</div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3 text-sm text-yellow-200">
                ⚠️ Each message opens a new WhatsApp Web tab (1.2s apart). Allow popups for this site. Stay on this page until done.
              </div>

              {sending && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">Sending… {progress.done} / {progress.total}</span>
                    <span className="text-slate-400 text-xs">{progress.skipped} skipped</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all"
                      style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} />
                  </div>
                  <button onClick={() => setPaused((p) => !p)}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white flex items-center gap-1.5">
                    {paused ? <><Play size={12} /> Resume</> : <><Pause size={12} /> Pause</>}
                  </button>
                </div>
              )}

              <div className="flex justify-between">
                <button onClick={() => setStep(2)} disabled={sending}
                  className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm flex items-center gap-1.5 disabled:opacity-40">
                  <ChevronLeft size={14} /> Back
                </button>
                <div className="flex gap-2">
                  {!sending && progress.done > 0 && (
                    <button onClick={resetWizard} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">
                      New Campaign
                    </button>
                  )}
                  <button onClick={startSending} disabled={sending}
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm flex items-center gap-1.5">
                    <Send size={14} /> {sending ? "Sending…" : progress.done > 0 ? "Sent ✓" : `Send to ${selectedIds.size}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ====================== HISTORY ====================== */}
        <TabsContent value="history" className="mt-4">
          {campaigns.length === 0 ? (
            <div className="text-center text-slate-500 py-12">No campaigns yet</div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-left px-4 py-2">Type</th>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-right px-4 py-2">Targeted</th>
                    <th className="text-right px-4 py-2">Sent</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-right px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                      <td className="px-4 py-2 text-white">{c.name}</td>
                      <td className="px-4 py-2 text-slate-400">{c.type || "—"}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{new Date(c.created_at).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-slate-300">{c.total_targeted}</td>
                      <td className="px-4 py-2 text-right text-green-400">{c.sent_count}</td>
                      <td className="px-4 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          c.status === "completed" ? "bg-green-500/15 text-green-300" :
                          c.status === "sending" ? "bg-blue-500/15 text-blue-300" :
                          "bg-slate-700 text-slate-300"
                        }`}>{c.status}</span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => duplicateCampaign(c)} title="Duplicate"
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                            <Copy size={12} />
                          </button>
                          <button onClick={() => duplicateCampaign(c)} title="Resend"
                            className="p-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300">
                            <RotateCcw size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
