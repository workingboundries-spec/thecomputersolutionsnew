import { useState } from "react";
import { X } from "lucide-react";
import { formatINR } from "@/crm/lib/format";

export type PriceUpdateChoice = {
  updateBilling: boolean;
  updateNlc: boolean;
  updateSale: boolean;
};

type Props = {
  itemLabel: string;
  newPurchasePrice: number;
  currentBilling: number;
  currentNlc: number;
  currentSale: number;
  onCancel: () => void;
  onConfirm: (choice: PriceUpdateChoice) => void;
};

export default function PriceUpdateConfirmDialog({
  itemLabel, newPurchasePrice, currentBilling, currentNlc, currentSale, onCancel, onConfirm,
}: Props) {
  const [updateBilling, setUpdateBilling] = useState(true);
  const [updateNlc, setUpdateNlc] = useState(currentNlc !== newPurchasePrice);
  const [updateSale, setUpdateSale] = useState(false);

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Update Catalogue Prices?</h2>
          <button onClick={onCancel} className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <div className="text-slate-300">
            <div className="text-white font-medium mb-1">{itemLabel}</div>
            <div className="text-xs text-slate-400">
              New purchase price: <span className="text-amber-300 font-semibold">{formatINR(newPurchasePrice)}</span>
            </div>
          </div>
          <div className="text-xs text-slate-400 pt-1">Select which catalogue prices to update:</div>

          <Row
            label="Billing Price"
            current={currentBilling}
            newValue={newPurchasePrice}
            checked={updateBilling}
            onChange={setUpdateBilling}
          />
          <Row
            label="NLC Price"
            current={currentNlc}
            newValue={newPurchasePrice}
            checked={updateNlc}
            onChange={setUpdateNlc}
          />
          <Row
            label="Sale Price"
            current={currentSale}
            newValue={newPurchasePrice}
            checked={updateSale}
            onChange={setUpdateSale}
          />

          <div className="text-[11px] text-slate-500 pt-1">
            Unchecked prices stay as they are. All changes are logged in Price History.
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-slate-800">
          <button onClick={onCancel} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-sm">
            Skip — keep old prices
          </button>
          <button
            onClick={() => onConfirm({ updateBilling, updateNlc, updateSale })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white text-sm font-medium"
          >
            Apply Selected
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label, current, newValue, checked, onChange,
}: { label: string; current: number; newValue: number; checked: boolean; onChange: (v: boolean) => void }) {
  const same = Number(current) === Number(newValue);
  return (
    <label className={`flex items-center justify-between gap-3 p-2 rounded border ${checked ? "border-blue-500/50 bg-blue-500/5" : "border-slate-800 bg-slate-800/30"} cursor-pointer`}>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={same} />
        <span className="text-slate-200">{label}</span>
      </div>
      <div className="text-right text-xs">
        <div className="text-slate-400">Now: {formatINR(current)}</div>
        <div className={same ? "text-slate-500" : "text-amber-300"}>
          {same ? "(same)" : `→ ${formatINR(newValue)}`}
        </div>
      </div>
    </label>
  );
}
