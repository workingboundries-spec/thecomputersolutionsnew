// Stub pages for Phase 2/3 — keep nav working
export const Stub = ({ title, msg }: { title: string; msg: string }) => (
  <div className="space-y-3">
    <h1 className="text-2xl font-bold text-white">{title}</h1>
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center">
      <p className="text-slate-400">{msg}</p>
      <p className="text-xs text-slate-500 mt-2">Coming in Phase 2 — request the next phase to build this module.</p>
    </div>
  </div>
);

export const CrmCatalogue = () => <Stub title="Catalogue" msg="Item catalogue with stock, pricing, and quote sharing" />;
export const CrmStock = () => <Stub title="Stock Report" msg="Inventory report with margins and reorder alerts" />;
export const CrmServices = () => <Stub title="Service Center" msg="Service jobs with kanban board" />;
export const CrmWarranty = () => <Stub title="Warranty & Reminders" msg="Scheduled WhatsApp reminders" />;
export const CrmSettings = () => <Stub title="Settings" msg="Shop info, templates, exports" />;
