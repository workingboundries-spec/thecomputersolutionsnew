import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, formatDate } from "@/crm/lib/format";
import { useCustomerSettings, rankColour, useAllCustomerSettings } from "@/crm/hooks/useCustomerSettings";
import { customerType, daysUntilNextOccurrence, yearsCompleted, ageFromDob, renderTemplate, whatsappLink, messageHint } from "@/crm/lib/customerHelpers";
import { useAdminSetting } from "@/crm/hooks/useAdminSettings";
import { useCrmAuth } from "@/crm/hooks/useCrmAuth";
import { toast } from "sonner";
import { Plus, Search, Edit2, Trash2, X, Upload, Link as LinkIcon, MessageCircle, Cake, Heart, Save, FileText } from "lucide-react";
import ConfirmDialog from "@/crm/components/ConfirmDialog";

const empty = {
  name: "", phone: "", whatsapp: "", email: "", address: "", city: "",
  dob: "", anniversary_date: "", notes: "", photo_url: "",
  rank: "", source_mode: "", occupation: "",
};

function Avatar({ name, photo, size = 32 }: { name: string; photo?: string | null; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const colors = ["bg-blue-600", "bg-green-600", "bg-purple-600", "bg-pink-600", "bg-orange-600", "bg-teal-600"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  if (photo) return <img src={photo} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover border border-slate-700" />;
  return <div style={{ width: size, height: size, fontSize: size * 0.4 }} className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>{initial}</div>;
}

function RankBadge({ value, allSettings }: { value: string | null; allSettings: any[] }) {
  if (!value) return <span className="text-xs text-slate-500">—</span>;
  const colour = rankColour(value, allSettings);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border" style={{ background: `${colour}25`, borderColor: `${colour}66`, color: colour }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colour }} />
      {value}
    </span>
  );
}

type SortKey = "name" | "rank" | "occupation" | "city" | "source_mode" | "type" | "purchases" | "last" | "wa_count" | "dob" | "anniversary";

export default function CrmCustomers() {
  const { user } = useCrmAuth();
  const ranks = useCustomerSettings("rank");
  const sources = useCustomerSettings("source_mode");
  const occupations = useCustomerSettings("occupation");
  const allSettings = useAllCustomerSettings();
  const businessName = useAdminSetting<string>("shop_name", "Computer Solutions");

  const [rows, setRows] = useState<any[]>([]);
  const [waCounts, setWaCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "New" | "Repeat">("all");
  const [rankFilter, setRankFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [occupationFilter, setOccupationFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [bdayWeek, setBdayWeek] = useState(false);
  const [annivWeek, setAnnivWeek] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("last");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [photoMode, setPhotoMode] = useState<"upload" | "url">("upload");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [detail, setDetail] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [custRes, waRes] = await Promise.all([
      supabase.from("crm_customers").select("*").order("last_purchase_date", { ascending: false, nullsFirst: false }),
      supabase.from("crm_whatsapp_log").select("phone, customer_id"),
    ]);
    if (custRes.error) toast.error(custRes.error.message);
    const customers = custRes.data || [];
    // Build WA count map by phone (covers older logs without customer_id)
    const counts: Record<string, number> = {};
    (waRes.data || []).forEach((r: any) => {
      const k = r.phone || "";
      if (!k) return;
      counts[k] = (counts[k] || 0) + 1;
    });
    setWaCounts(counts);
    setRows(customers);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const enriched = useMemo(() => {
    return rows.map((c) => {
      const cType = customerType(c.total_purchases);
      const bdayIn = daysUntilNextOccurrence(c.dob);
      const annivIn = daysUntilNextOccurrence(c.anniversary_date);
      const waCount = waCounts[c.phone] || 0;
      return { ...c, _type: cType, _bdayIn: bdayIn, _annivIn: annivIn, _waCount: waCount };
    });
  }, [rows, waCounts]);

  const filtered = useMemo(() => {
    return enriched.filter((r) => {
      if (typeFilter !== "all" && r._type !== typeFilter) return false;
      if (rankFilter && r.rank !== rankFilter) return false;
      if (sourceFilter && r.source_mode !== sourceFilter) return false;
      if (occupationFilter && r.occupation !== occupationFilter) return false;
      if (cityFilter && !(r.city || "").toLowerCase().includes(cityFilter.toLowerCase())) return false;
      if (bdayWeek && (r._bdayIn === null || r._bdayIn > 7)) return false;
      if (annivWeek && (r._annivIn === null || r._annivIn > 7)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(r.name?.toLowerCase().includes(q) || r.phone?.includes(q))) return false;
      }
      return true;
    }).sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      const get = (x: any): any => {
        switch (sortBy) {
          case "name": return x.name || "";
          case "rank": return x.rank || "";
          case "occupation": return x.occupation || "";
          case "city": return x.city || "";
          case "source_mode": return x.source_mode || "";
          case "type": return x._type;
          case "purchases": return x.total_purchases || 0;
          case "last": return x.last_purchase_date || "";
          case "wa_count": return x._waCount;
          case "dob": return x._bdayIn ?? 9999;
          case "anniversary": return x._annivIn ?? 9999;
        }
      };
      const av = get(a); const bv = get(b);
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [enriched, typeFilter, rankFilter, sourceFilter, occupationFilter, cityFilter, bdayWeek, annivWeek, search, sortBy, sortDir]);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const newThisMonth = enriched.filter((c) => {
      const d = c.created_at ? new Date(c.created_at) : null;
      return d && d.getMonth() === month && d.getFullYear() === year && c._type === "New";
    }).length;
    const repeatThisMonth = enriched.filter((c) => c._type === "Repeat").length;
    const todayBdays = enriched.filter((c) => c._bdayIn === 0).length;
    const todayAnnivs = enriched.filter((c) => c._annivIn === 0).length;
    const top5 = [...enriched].sort((a, b) => (b.total_value || 0) - (a.total_value || 0)).slice(0, 5);
    return { total: enriched.length, newThisMonth, repeatThisMonth, todayBdays, todayAnnivs, top5 };
  }, [enriched]);

  const openNew = () => { setEditing(null); setForm(empty); setPhotoMode("upload"); setShowForm(true); };
  const openEdit = (r: any) => {
    setEditing(r);
    setForm({
      ...empty, ...r,
      dob: r.dob || "", anniversary_date: r.anniversary_date || "",
      photo_url: r.photo_url || "",
      rank: r.rank || "", source_mode: r.source_mode || "", occupation: r.occupation || "",
      city: r.city || "",
    });
    setPhotoMode(r.photo_url ? "url" : "upload");
    setShowForm(true);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    if (!["image/jpeg", "image/png"].includes(file.type)) { toast.error("Only JPG/PNG allowed"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("customer-photos").upload(path, file, { upsert: false });
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("customer-photos").getPublicUrl(path);
    setForm((f: any) => ({ ...f, photo_url: data.publicUrl }));
    setUploading(false);
    toast.success("Photo uploaded");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name, phone: form.phone, whatsapp: form.whatsapp || form.phone,
      email: form.email || null, address: form.address || null, city: form.city || null,
      dob: form.dob || null, anniversary_date: form.anniversary_date || null,
      notes: form.notes || null, photo_url: form.photo_url || null,
      rank: form.rank || null, source_mode: form.source_mode || null, occupation: form.occupation || null,
    };
    if (editing) {
      const { error } = await supabase.from("crm_customers").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Customer updated");
    } else {
      const { error } = await supabase.from("crm_customers").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Customer added");
    }
    setShowForm(false); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("crm_customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  };

  const sendQuickWish = async (c: any, type: "birthday" | "anniversary") => {
    const tplKey = type === "birthday" ? "birthday_template" : "anniversary_template";
    const { data } = await (supabase as any).from("admin_reminder_settings").select("setting_value").eq("setting_key", tplKey).maybeSingle();
    const tpl = (data as any)?.setting_value || `Dear {{customer_name}}, wishing you a happy ${type}! - Team {{business_name}}`;
    const years = type === "anniversary" ? yearsCompleted(c.anniversary_date) ?? "" : "";
    const message = renderTemplate(tpl, {
      customer_name: c.name, rank: c.rank || "", business_name: businessName,
      years_count: years, phone: c.phone,
    });
    window.open(whatsappLink(c.whatsapp || c.phone, message), "_blank");
    // Log
    await supabase.from("crm_whatsapp_log").insert({
      customer_id: c.id, customer_name: c.name, phone: c.phone,
      message_text: message, message_hint: messageHint(message),
      message_type: type, sent_from_section: type === "birthday" ? "birthday_quick" : "anniversary_quick",
      sent_by: user?.id || null,
    });
    await (supabase as any).from("customer_event_logs").insert({
      customer_id: c.id, event_type: type, event_date: new Date().toISOString().slice(0, 10),
      years_completed: typeof years === "number" ? years : null, message_sent: message, sent_by: user?.id || null,
    });
    toast.success(`${type === "birthday" ? "Birthday" : "Anniversary"} wish opened in WhatsApp`);
    load();
  };

  const SortHead = ({ k, label, align = "left" }: { k: SortKey; label: string; align?: "left" | "right" }) => (
    <th className={`px-3 py-2 text-${align} cursor-pointer hover:text-white select-none`} onClick={() => { if (sortBy === k) setSortDir(sortDir === "asc" ? "desc" : "asc"); else { setSortBy(k); setSortDir("asc"); } }}>
      {label} {sortBy === k && (sortDir === "asc" ? "↑" : "↓")}
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm text-slate-400">{filtered.length} of {rows.length} customers</p>
        </div>
        <button onClick={openNew} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm flex items-center gap-1.5"><Plus size={14} />Add Customer</button>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard label="Total" value={stats.total} />
        <SummaryCard label="New / month" value={stats.newThisMonth} accent="text-blue-300" />
        <SummaryCard label="Repeat" value={stats.repeatThisMonth} accent="text-green-300" />
        <SummaryCard label="🎂 Today" value={stats.todayBdays} onClick={() => { setBdayWeek(true); setTypeFilter("all"); }} accent="text-pink-300" />
        <SummaryCard label="💍 Today" value={stats.todayAnnivs} onClick={() => { setAnnivWeek(true); setTypeFilter("all"); }} accent="text-purple-300" />
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or phone…" className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)} className={inp}>
            <option value="">All Ranks</option>
            {ranks.map((r) => <option key={r.id} value={r.value}>{r.value}</option>)}
          </select>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={inp}>
            <option value="">All Sources</option>
            {sources.map((s) => <option key={s.id} value={s.value}>{s.value}</option>)}
          </select>
          <select value={occupationFilter} onChange={(e) => setOccupationFilter(e.target.value)} className={inp}>
            <option value="">All Occupations</option>
            {occupations.map((o) => <option key={o.id} value={o.value}>{o.value}</option>)}
          </select>
          <input value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} placeholder="City…" className={inp} />
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {(["all", "New", "Repeat"] as const).map((k) => (
            <button key={k} onClick={() => setTypeFilter(k)} className={`px-2.5 py-1 text-xs rounded font-medium ${typeFilter === k ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
              {k}
            </button>
          ))}
          <button onClick={() => setBdayWeek(!bdayWeek)} className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 ${bdayWeek ? "bg-pink-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            <Cake size={12} /> Birthday this week
          </button>
          <button onClick={() => setAnnivWeek(!annivWeek)} className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1 ${annivWeek ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
            <Heart size={12} /> Anniversary this week
          </button>
          {(rankFilter || sourceFilter || occupationFilter || cityFilter || bdayWeek || annivWeek || typeFilter !== "all" || search) && (
            <button onClick={() => { setRankFilter(""); setSourceFilter(""); setOccupationFilter(""); setCityFilter(""); setBdayWeek(false); setAnnivWeek(false); setTypeFilter("all"); setSearch(""); }} className="px-2.5 py-1 text-xs rounded font-medium bg-slate-800 text-red-300 hover:bg-red-600/20">Clear</button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
            <tr>
              <th className="text-left px-3 py-2 w-12"></th>
              <SortHead k="name" label="Name" />
              <SortHead k="rank" label="Rank" />
              <SortHead k="occupation" label="Occupation" />
              <SortHead k="city" label="City" />
              <SortHead k="source_mode" label="Source" />
              <SortHead k="type" label="Type" />
              <SortHead k="purchases" label="Purch" align="right" />
              <SortHead k="last" label="Last Purchase" />
              <SortHead k="wa_count" label="WA" align="right" />
              <SortHead k="dob" label="🎂" />
              <SortHead k="anniversary" label="💍" />
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={13} className="text-center py-6 text-slate-500">Loading…</td></tr> :
              filtered.length === 0 ? <tr><td colSpan={13} className="text-center py-10 text-slate-500">No customers</td></tr> :
              filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-800/30 cursor-pointer" onClick={() => setDetail(r)}>
                  <td className="px-3 py-2"><Avatar name={r.name} photo={r.photo_url} size={32} /></td>
                  <td className="px-3 py-2 text-white">{r.name}<div className="text-[11px] text-slate-500">{r.phone}</div></td>
                  <td className="px-3 py-2"><RankBadge value={r.rank} allSettings={allSettings} /></td>
                  <td className="px-3 py-2 text-slate-300 text-xs">{r.occupation || "—"}</td>
                  <td className="px-3 py-2 text-slate-300 text-xs">{r.city || "—"}</td>
                  <td className="px-3 py-2 text-slate-300 text-xs">{r.source_mode || "—"}</td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${r._type === "Repeat" ? "bg-green-600/20 text-green-300 border-green-600/40" : "bg-blue-600/20 text-blue-300 border-blue-600/40"}`}>{r._type}</span></td>
                  <td className="px-3 py-2 text-right text-slate-300">{r.total_purchases || 0}</td>
                  <td className="px-3 py-2 text-slate-400 text-xs">{formatDate(r.last_purchase_date)}</td>
                  <td className="px-3 py-2 text-right text-slate-400 text-xs">{r._waCount}</td>
                  <td className="px-3 py-2 text-xs">{r._bdayIn === null ? "—" : r._bdayIn === 0 ? <span className="text-pink-300 font-semibold">Today</span> : r._bdayIn <= 7 ? <span className="text-pink-400">{r._bdayIn}d</span> : <span className="text-slate-500">{r._bdayIn}d</span>}</td>
                  <td className="px-3 py-2 text-xs">{r._annivIn === null ? "—" : r._annivIn === 0 ? <span className="text-purple-300 font-semibold">Today</span> : r._annivIn <= 7 ? <span className="text-purple-400">{r._annivIn}d</span> : <span className="text-slate-500">{r._annivIn}d</span>}</td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => remove(r.id)} className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CustomerForm
          form={form} setForm={setForm} editing={editing} setShowForm={setShowForm}
          photoMode={photoMode} setPhotoMode={setPhotoMode} fileRef={fileRef}
          handleFileUpload={handleFileUpload} uploading={uploading}
          ranks={ranks} sources={sources} occupations={occupations}
          save={save}
        />
      )}

      {detail && (
        <CustomerDetailDialog
          customer={detail}
          onClose={() => setDetail(null)}
          allSettings={allSettings}
          onSendWish={sendQuickWish}
          onEdit={() => { setDetail(null); openEdit(detail); }}
        />
      )}
    </div>
  );
}

// ===================== Form =====================
function CustomerForm({ form, setForm, editing, setShowForm, photoMode, setPhotoMode, fileRef, handleFileUpload, uploading, ranks, sources, occupations, save }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-2xl my-8 space-y-3">
        <h3 className="text-lg font-semibold text-white">{editing ? "Edit" : "New"} Customer</h3>

        <div className="bg-slate-950/50 border border-slate-800 rounded p-3">
          <div className="flex items-center gap-3 mb-3">
            <Avatar name={form.name || "?"} photo={form.photo_url} size={64} />
            <div className="flex-1">
              <div className="text-xs text-slate-400 mb-1">Customer Photo</div>
              <div className="inline-flex bg-slate-800 rounded p-0.5">
                <button type="button" onClick={() => setPhotoMode("upload")} className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${photoMode === "upload" ? "bg-blue-600 text-white" : "text-slate-400"}`}><Upload size={12} /> Upload</button>
                <button type="button" onClick={() => setPhotoMode("url")} className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${photoMode === "url" ? "bg-blue-600 text-white" : "text-slate-400"}`}><LinkIcon size={12} /> URL</button>
              </div>
            </div>
            {form.photo_url && <button type="button" onClick={() => setForm({ ...form, photo_url: "" })} className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"><X size={14} /></button>}
          </div>
          {photoMode === "upload" ? (
            <div>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sm text-slate-300 rounded border border-dashed border-slate-700">{uploading ? "Uploading…" : "Choose JPG/PNG (max 2MB)"}</button>
            </div>
          ) : (
            <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." className={inp} />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} /></Field>
          <Field label="Phone *"><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inp} /></Field>
          <Field label="WhatsApp"><input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inp} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inp} /></Field>
          <Field label="Date of Birth"><input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} className={inp} /></Field>
          <Field label="Anniversary Date"><input type="date" value={form.anniversary_date} onChange={(e) => setForm({ ...form, anniversary_date: e.target.value })} className={inp} /></Field>
          <Field label="Rank">
            <select value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} className={inp}>
              <option value="">— None —</option>
              {ranks.map((r: any) => <option key={r.id} value={r.value}>{r.value}</option>)}
            </select>
          </Field>
          <Field label="Source Mode">
            <select value={form.source_mode} onChange={(e) => setForm({ ...form, source_mode: e.target.value })} className={inp}>
              <option value="">— None —</option>
              {sources.map((s: any) => <option key={s.id} value={s.value}>{s.value}</option>)}
            </select>
          </Field>
          <Field label="Occupation">
            <select value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} className={inp}>
              <option value="">— None —</option>
              {occupations.map((o: any) => <option key={o.id} value={o.value}>{o.value}</option>)}
            </select>
          </Field>
          <Field label="City"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inp} /></Field>
          <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inp} /></Field>
        </div>
        <Field label="Notes"><textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inp} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1.5"><Save size={14} />Save</button>
        </div>
      </form>
    </div>
  );
}

// ===================== Detail Dialog =====================
function CustomerDetailDialog({ customer, onClose, allSettings, onSendWish, onEdit }: any) {
  const [tab, setTab] = useState<"purchases" | "wa" | "events" | "notes">("purchases");
  const [data, setData] = useState<{ sales: any[]; wa: any[]; events: any[] }>({ sales: [], wa: [], events: [] });
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    (async () => {
      const [sales, wa, events] = await Promise.all([
        supabase.from("crm_sales").select("*").eq("phone", customer.phone).order("sale_date", { ascending: false }),
        supabase.from("crm_whatsapp_log").select("*").or(`customer_id.eq.${customer.id},phone.eq.${customer.phone}`).order("sent_at", { ascending: false }).limit(200),
        (supabase as any).from("customer_event_logs").select("*").eq("customer_id", customer.id).order("sent_at", { ascending: false }),
      ]);
      setData({ sales: sales.data || [], wa: wa.data || [], events: (events.data as any) || [] });
    })();
  }, [customer.id, customer.phone]);

  const bdayIn = daysUntilNextOccurrence(customer.dob);
  const annivIn = daysUntilNextOccurrence(customer.anniversary_date);
  const cType = customerType(customer.total_purchases);
  const memberSince = customer.created_at ? formatDate(customer.created_at) : "—";
  const firstPurchase = data.sales.length > 0 ? formatDate(data.sales[data.sales.length - 1].sale_date) : "—";

  const saveNote = async () => {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    const stamp = new Date().toLocaleString();
    const newNotes = `${customer.notes ? customer.notes + "\n\n" : ""}[${stamp}] ${noteDraft.trim()}`;
    const { error } = await supabase.from("crm_customers").update({ notes: newNotes }).eq("id", customer.id);
    setSavingNote(false);
    if (error) return toast.error(error.message);
    customer.notes = newNotes;
    setNoteDraft("");
    toast.success("Note added");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-4xl my-8">
        {/* Header card */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-4">
              <Avatar name={customer.name} photo={customer.photo_url} size={80} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                  <RankBadge value={customer.rank} allSettings={allSettings} />
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border ${cType === "Repeat" ? "bg-green-600/20 text-green-300 border-green-600/40" : "bg-blue-600/20 text-blue-300 border-blue-600/40"}`}>{cType}</span>
                  {customer.source_mode && <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">{customer.source_mode}</span>}
                  {customer.occupation && <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">{customer.occupation}</span>}
                </div>
                <div className="text-sm text-slate-400 mt-1">{customer.phone} {customer.email && `· ${customer.email}`}</div>
                <div className="text-xs text-slate-500 mt-0.5">{customer.city && `${customer.city} · `}Member since {memberSince}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={onEdit} className="p-2 text-blue-400 hover:bg-blue-600/20 rounded" title="Edit"><Edit2 size={16} /></button>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
          </div>

          {/* Alert strip */}
          {(bdayIn !== null && bdayIn <= 7) || (annivIn !== null && annivIn <= 7) ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {bdayIn !== null && bdayIn <= 7 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-600/15 border border-pink-600/40 rounded text-pink-300 text-xs">
                  <Cake size={14} /> Birthday {bdayIn === 0 ? "today" : `in ${bdayIn} day${bdayIn > 1 ? "s" : ""}`}
                  <button onClick={() => onSendWish(customer, "birthday")} className="ml-2 px-2 py-0.5 bg-pink-600 hover:bg-pink-500 text-white rounded text-[11px] font-medium">Send Wish</button>
                </div>
              )}
              {annivIn !== null && annivIn <= 7 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/15 border border-purple-600/40 rounded text-purple-300 text-xs">
                  <Heart size={14} /> Anniversary {annivIn === 0 ? "today" : `in ${annivIn} day${annivIn > 1 ? "s" : ""}`}
                  <button onClick={() => onSendWish(customer, "anniversary")} className="ml-2 px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-medium">Send Wish</button>
                </div>
              )}
            </div>
          ) : null}

          {/* Summary strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="Total Purchases" value={customer.total_purchases || 0} />
            <Stat label="Total Value" value={formatINR(customer.total_value)} />
            <Stat label="First Purchase" value={firstPurchase} />
            <Stat label="Last Purchase" value={formatDate(customer.last_purchase_date)} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 px-2">
          {([
            ["purchases", `Purchase History (${data.sales.length})`],
            ["wa", `WhatsApp Log (${data.wa.length})`],
            ["events", `Events Log (${data.events.length})`],
            ["notes", "Notes"],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-4 py-3 text-sm font-medium ${tab === k ? "text-white border-b-2 border-blue-500" : "text-slate-400 hover:text-white"}`}>{label}</button>
          ))}
        </div>

        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {tab === "purchases" && (
            data.sales.length === 0 ? <Empty msg="No purchases yet" /> :
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="text-left py-2">Date</th><th className="text-left py-2">Invoice</th><th className="text-left py-2">Items</th><th className="text-right py-2">Amount</th><th className="text-left py-2">Status</th></tr>
              </thead>
              <tbody>
                {data.sales.map((s) => (
                  <tr key={s.id} className="border-t border-slate-800">
                    <td className="py-2 text-slate-300 text-xs">{formatDate(s.sale_date)}</td>
                    <td className="py-2 text-slate-400 text-xs">{s.invoice_no}</td>
                    <td className="py-2 text-white">{s.item_name}</td>
                    <td className="py-2 text-right text-green-400 font-medium">{formatINR(s.total_amount)}</td>
                    <td className="py-2 text-xs"><span className={`px-2 py-0.5 rounded ${s.payment_status === "paid" ? "bg-green-600/20 text-green-300" : "bg-orange-600/20 text-orange-300"}`}>{s.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "wa" && (
            <>
              <div className="text-xs text-slate-400 mb-2">Total messages: <span className="text-white font-semibold">{data.wa.length}</span></div>
              {data.wa.length === 0 ? <Empty msg="No WhatsApp messages logged" /> :
                <div className="space-y-1.5">
                  {data.wa.map((w) => (
                    <div key={w.id} className="flex items-start gap-3 p-2 bg-slate-950/40 border border-slate-800 rounded text-xs">
                      <MessageCircle size={14} className="text-green-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-slate-200 truncate">{w.message_hint || messageHint(w.message_text || "", 80)}</div>
                        <div className="text-slate-500 mt-0.5">{new Date(w.sent_at).toLocaleString()} {w.sent_from_section && <span className="ml-2 px-1.5 py-0.5 bg-slate-800 rounded">{w.sent_from_section}</span>}</div>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </>
          )}
          {tab === "events" && (
            data.events.length === 0 ? <Empty msg="No event messages sent" /> :
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr><th className="text-left py-2">Type</th><th className="text-left py-2">Event Date</th><th className="text-left py-2">Years</th><th className="text-left py-2">Sent At</th><th className="text-left py-2">Message</th></tr>
              </thead>
              <tbody>
                {data.events.map((e: any) => (
                  <tr key={e.id} className="border-t border-slate-800">
                    <td className="py-2"><span className={`px-2 py-0.5 text-[10px] rounded ${e.event_type === "birthday" ? "bg-pink-600/20 text-pink-300" : "bg-purple-600/20 text-purple-300"}`}>{e.event_type}</span></td>
                    <td className="py-2 text-slate-300 text-xs">{formatDate(e.event_date)}</td>
                    <td className="py-2 text-slate-300 text-xs">{e.years_completed ?? "—"}</td>
                    <td className="py-2 text-slate-400 text-xs">{new Date(e.sent_at).toLocaleString()}</td>
                    <td className="py-2 text-slate-300 text-xs truncate max-w-xs">{messageHint(e.message_sent || "", 60)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {tab === "notes" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note (timestamped)…" className={inp + " flex-1"} rows={2} />
                <button onClick={saveNote} disabled={savingNote || !noteDraft.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-sm flex items-center gap-1.5 self-start"><FileText size={14} />Add</button>
              </div>
              <div className="bg-slate-950/40 border border-slate-800 rounded p-3 text-sm text-slate-200 whitespace-pre-wrap min-h-[120px] font-mono text-xs">
                {customer.notes || <span className="text-slate-500 italic">No notes yet</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent, onClick }: { label: string; value: number | string; accent?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-slate-900 border border-slate-800 rounded-lg p-3 ${onClick ? "cursor-pointer hover:border-blue-500/50" : ""}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${accent || "text-white"}`}>{value}</div>
    </div>
  );
}
function Stat({ label, value }: { label: string; value: any }) {
  return <div className="bg-slate-800/50 rounded p-2"><div className="text-xs text-slate-500">{label}</div><div className="font-semibold text-white text-sm">{value}</div></div>;
}
function Empty({ msg }: { msg: string }) { return <div className="text-sm text-slate-500 italic text-center py-8">{msg}</div>; }
function Field({ label, children }: any) { return <label className="block"><span className="text-xs text-slate-400 mb-1 block">{label}</span>{children}</label>; }
const inp = "w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500";
