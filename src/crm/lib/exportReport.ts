// Shared Excel / PDF / Print exporters for customer reports.
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type Column = { header: string; key: string; width?: number };

export function exportExcel(filename: string, columns: Column[], rows: any[]) {
  const data = rows.map((r) => {
    const o: any = {};
    columns.forEach((c) => (o[c.header] = r[c.key] ?? ""));
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = columns.map((c) => ({ wch: c.width || Math.max(12, c.header.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(title: string, columns: Column[], rows: any[], subtitle?: string) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text(title, 14, 14);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 20);
    doc.setTextColor(0);
  }
  autoTable(doc, {
    startY: subtitle ? 24 : 18,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(r[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [241, 245, 249] },
  });
  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export function printReport(title: string, columns: Column[], rows: any[], subtitle?: string) {
  const w = window.open("", "_blank", "width=1000,height=700");
  if (!w) return;
  const head = columns.map((c) => `<th>${c.header}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${columns.map((c) => `<td>${String(r[c.key] ?? "")}</td>`).join("")}</tr>`)
    .join("");
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
      h1{margin:0 0 4px;font-size:20px}
      .sub{color:#64748b;font-size:12px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
      th{background:#1e40af;color:#fff}
      tr:nth-child(even) td{background:#f1f5f9}
      @media print{button{display:none}}
    </style></head><body>
    <h1>${title}</h1>${subtitle ? `<div class="sub">${subtitle}</div>` : ""}
    <button onclick="window.print()" style="margin-bottom:12px;padding:6px 12px;cursor:pointer">Print</button>
    <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
    </body></html>`);
  w.document.close();
}
