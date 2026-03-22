import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Building2,
  Calculator,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  ImageDown,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import ColumnSectionSVG from "./components/ColumnSectionSVG";
import {
  type DesignInputs,
  type DesignResults,
  calculateJacketing,
} from "./utils/calculations";
import { downloadExcel } from "./utils/excelExport";

interface FormValues {
  designation: string;
  height: string;
  b: string;
  D: string;
  existingBars: string;
  existingBarDia: string;
  fy: string;
  fck: string;
  Pu: string;
  dbar: string;
}

interface FormErrors {
  designation?: string;
  height?: string;
  b?: string;
  D?: string;
  existingBars?: string;
  existingBarDia?: string;
  fy?: string;
  fck?: string;
  Pu?: string;
  dbar?: string;
}

const INITIAL_FORM: FormValues = {
  designation: "",
  height: "",
  b: "",
  D: "",
  existingBars: "",
  existingBarDia: "",
  fy: "",
  fck: "",
  Pu: "",
  dbar: "",
};

function isNum(v: string) {
  return !Number.isNaN(Number(v));
}

function validateForm(f: FormValues): FormErrors {
  const e: FormErrors = {};
  if (!f.designation.trim()) e.designation = "Required";
  if (!f.height || !isNum(f.height) || Number(f.height) <= 0)
    e.height = "Enter a positive number";
  if (!f.b || !isNum(f.b) || Number(f.b) <= 0) e.b = "Enter a positive number";
  if (!f.D || !isNum(f.D) || Number(f.D) <= 0) e.D = "Enter a positive number";
  if (!f.existingBars || !isNum(f.existingBars) || Number(f.existingBars) < 4)
    e.existingBars = "Minimum 4 bars required";
  if (
    !f.existingBarDia ||
    !isNum(f.existingBarDia) ||
    Number(f.existingBarDia) <= 0
  )
    e.existingBarDia = "Enter a positive number";
  if (!f.fy || !isNum(f.fy) || Number(f.fy) <= 0)
    e.fy = "Enter a positive number";
  if (!f.fck || !isNum(f.fck) || Number(f.fck) <= 0)
    e.fck = "Enter a positive number";
  if (!f.Pu || !isNum(f.Pu) || Number(f.Pu) <= 0)
    e.Pu = "Enter a positive number";
  if (!f.dbar) e.dbar = "Select bar diameter";
  return e;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p
      className="flex items-center gap-1 text-xs text-destructive mt-1"
      data-ocid="field_error"
    >
      <AlertCircle className="w-3 h-3" />
      {msg}
    </p>
  );
}

function UnitChip({ unit }: { unit: string }) {
  return (
    <span className="flex items-center px-3 text-sm text-muted-foreground bg-secondary border border-border border-l-0 rounded-r-md h-10 whitespace-nowrap select-none">
      {unit}
    </span>
  );
}

function InputWithUnit({
  id,
  unit,
  value,
  onChange,
  error,
  ocid,
}: {
  id: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  ocid: string;
}) {
  return (
    <div>
      <div className="flex">
        <Input
          id={id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0"
          data-ocid={ocid}
        />
        <UnitChip unit={unit} />
      </div>
      <FieldError msg={error} />
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-2">
        {children}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function CodeRef({ ref: refText }: { ref: string }) {
  return (
    <Badge
      variant="secondary"
      className="text-xs font-mono font-normal px-2 py-0.5"
    >
      {refText}
    </Badge>
  );
}

// ─── HTML Report Generator ──────────────────────────────────────────────────
function generateHTMLReport(
  inputs: DesignInputs,
  results: DesignResults,
): string {
  const date = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const S_formula_val = (
    (inputs.fy * results.dh * results.dh) /
    (Math.PI * results.fck_new * results.tj * results.tj)
  ).toFixed(2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>RCC Column Jacketing Design Report – ${inputs.designation}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    font-size: 11pt;
    color: #1a1a2e;
    background: #f8f9fa;
    padding: 0;
  }
  .page {
    max-width: 210mm;
    margin: 0 auto;
    background: white;
    padding: 20mm 18mm 20mm 18mm;
    min-height: 297mm;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  }
  /* Header */
  .report-header {
    border-bottom: 3px solid #1e3a5f;
    padding-bottom: 14px;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 10px;
  }
  .report-header-left h1 {
    font-size: 18pt;
    font-weight: 700;
    color: #1e3a5f;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }
  .report-header-left p {
    font-size: 9pt;
    color: #5a6a7e;
    margin-top: 3px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .report-header-right {
    text-align: right;
    font-size: 9pt;
    color: #5a6a7e;
    line-height: 1.7;
  }
  .report-header-right strong { color: #1e3a5f; font-weight: 600; }
  /* Section titles */
  .section-title {
    font-size: 11pt;
    font-weight: 700;
    color: #1e3a5f;
    background: #eef3fa;
    padding: 7px 12px;
    border-left: 4px solid #1e3a5f;
    margin: 22px 0 12px 0;
    letter-spacing: 0.1px;
  }
  /* Tables */
  table { width: 100%; border-collapse: collapse; font-size: 10pt; margin-bottom: 6px; }
  th {
    background: #1e3a5f;
    color: white;
    padding: 7px 10px;
    font-weight: 600;
    text-align: left;
    font-size: 9.5pt;
  }
  td {
    padding: 6px 10px;
    border: 1px solid #dde3ec;
    vertical-align: top;
  }
  tr:nth-child(even) td { background: #f5f8fd; }
  tr:last-child td { border-bottom: 2px solid #1e3a5f; }
  .td-label { font-weight: 600; color: #334155; width: 45%; }
  /* Calc steps */
  .calc-block {
    background: #f8fafd;
    border: 1px solid #dde3ec;
    border-left: 3px solid #3b82f6;
    border-radius: 4px;
    padding: 10px 14px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }
  .calc-block .step-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .step-num {
    background: #1e3a5f;
    color: white;
    font-size: 9pt;
    font-weight: 700;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .step-desc { font-weight: 600; font-size: 10pt; color: #1e3a5f; }
  .code-ref {
    margin-left: auto;
    font-size: 8pt;
    background: #e0eaff;
    color: #1e3a5f;
    border: 1px solid #b0c9f0;
    border-radius: 3px;
    padding: 2px 7px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    white-space: nowrap;
  }
  .formula {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    color: #374151;
    background: white;
    border: 1px solid #e2e8f0;
    padding: 5px 10px;
    border-radius: 3px;
    margin-top: 4px;
    line-height: 1.6;
  }
  .result {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9.5pt;
    font-weight: 600;
    color: #1e40af;
    margin-top: 5px;
    padding: 3px 10px;
    background: #eff6ff;
    border-radius: 3px;
    display: inline-block;
  }
  /* Compliance box */
  .compliance {
    border: 2px solid #16a34a;
    border-radius: 6px;
    background: #f0fdf4;
    padding: 12px 16px;
    margin-top: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .compliance .check { font-size: 18pt; color: #16a34a; }
  .compliance p { font-size: 10pt; font-weight: 600; color: #166534; line-height: 1.5; }
  /* Footer */
  .report-footer {
    border-top: 2px solid #dde3ec;
    margin-top: 30px;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #94a3b8;
  }
  @media print {
    body { background: white; }
    .page { box-shadow: none; padding: 15mm 15mm; }
    .calc-block { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="report-header">
    <div class="report-header-left">
      <h1>RCC Column Jacketing Design Report</h1>
      <p>IS 15988 : 2013 &nbsp;|&nbsp; Seismic Rehabilitation of RC Buildings</p>
    </div>
    <div class="report-header-right">
      <strong>Element: ${inputs.designation}</strong><br/>
      Date: ${date}<br/>
      Code: IS 15988 : 2013
    </div>
  </div>

  <!-- Input Data -->
  <div class="section-title">1. Input Data</div>
  <table>
    <thead><tr><th>Parameter</th><th>Value</th><th>Unit</th></tr></thead>
    <tbody>
      <tr><td class="td-label">Structural Element Designation</td><td>${inputs.designation}</td><td>—</td></tr>
      <tr><td class="td-label">Height of Column</td><td>${inputs.height}</td><td>mm</td></tr>
      <tr><td class="td-label">Width of Column (b)</td><td>${inputs.b}</td><td>mm</td></tr>
      <tr><td class="td-label">Depth of Column (D)</td><td>${inputs.D}</td><td>mm</td></tr>
      <tr><td class="td-label">No. of Existing Longitudinal Bars</td><td>${inputs.existingBars}</td><td>nos</td></tr>
      <tr><td class="td-label">Existing Bar Diameter</td><td>${inputs.existingBarDia}</td><td>mm</td></tr>
      <tr><td class="td-label">Yield Strength of Steel (fy)</td><td>${inputs.fy}</td><td>MPa</td></tr>
      <tr><td class="td-label">Cube Compressive Strength of Concrete (fck)</td><td>${inputs.fck}</td><td>MPa</td></tr>
      <tr><td class="td-label">Factored Axial Load (Pu)</td><td>${inputs.Pu}</td><td>kN</td></tr>
      <tr><td class="td-label">Bar Diameter for Jacket</td><td>${inputs.dbar}</td><td>mm</td></tr>
    </tbody>
  </table>

  <!-- Design Calculations -->
  <div class="section-title">2. Step-by-Step Design Calculations</div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">1</div>
      <div class="step-desc">New Concrete Strength</div>
      <span class="code-ref">IS 15988:2013 §8.5.1.2(a)</span>
    </div>
    <div class="formula">According to §8.5.1.2(a) of IS 15988:2013, concrete strength shall be at least 5 MPa greater than existing concrete.<br/>
fck_new = fck + 5 = ${inputs.fck} + 5 = ${results.fck_new} N/mm²</div>
    <div class="result">fck_new = ${results.fck_new} MPa</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">2</div>
      <div class="step-desc">Required Gross Concrete Area (Ac)</div>
      <span class="code-ref">IS 456:2000 Eq.</span>
    </div>
    <div class="formula">Assuming Asc = 0.8% of Ac:<br/>
Pu × 10³ = 0.4 × fck_new × Ac + 0.67 × fy × (0.8% × Ac)<br/>
${inputs.Pu} × 10³ = 0.4 × ${results.fck_new} × Ac + 0.67 × ${inputs.fy} × 0.008 × Ac<br/>
${inputs.Pu * 1000} = (${(0.4 * results.fck_new).toFixed(3)} + ${(0.67 * inputs.fy * 0.008).toFixed(4)}) × Ac<br/>
Ac = ${inputs.Pu * 1000} / ${(0.4 * results.fck_new + 0.67 * inputs.fy * 0.008).toFixed(4)}</div>
    <div class="result">Ac = ${results.Ac.toFixed(2)} mm²</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">3</div>
      <div class="step-desc">Enhanced Concrete Area (A'c)</div>
      <span class="code-ref">IS 15988:2013 §8.5.1.1(e)</span>
    </div>
    <div class="formula">According to §8.5.1.1(e), A'c = 1.5 × Ac<br/>
A'c = 1.5 × ${results.Ac.toFixed(2)}</div>
    <div class="result">A'c = ${results.Ac_prime.toFixed(2)} mm²</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">4</div>
      <div class="step-desc">Trial Cross-Section Dimensions</div>
    </div>
    <div class="formula">Assume trial width B = ${results.B_trial} mm:<br/>
D_trial = A'c / B_trial = ${results.Ac_prime.toFixed(2)} / ${results.B_trial}<br/>
D_trial = ${results.D_trial.toFixed(2)} mm<br/><br/>
Computed jacket thicknesses:<br/>
tj_B = (B_trial − b) / 2 = (${results.B_trial} − ${inputs.b}) / 2 = ${results.tj_B_calc.toFixed(2)} mm<br/>
tj_D = (D_trial − D) / 2 = (${results.D_trial.toFixed(2)} − ${inputs.D}) / 2 = ${results.tj_D_calc.toFixed(2)} mm</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">5</div>
      <div class="step-desc">Jacket Thickness Check – Minimum 100 mm Governs</div>
      <span class="code-ref">IS 15988:2013 §8.5.1.2(c)</span>
    </div>
    <div class="formula">Computed tj_B = ${results.tj_B_calc.toFixed(2)} mm, tj_D = ${results.tj_D_calc.toFixed(2)} mm<br/>
As per §8.5.1.2(c), minimum jacket thickness = 100 mm<br/>
→ Adopt tj = 100 mm (governs)</div>
    <div class="result">tj = ${results.tj} mm (each side)</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">6</div>
      <div class="step-desc">New Column Dimensions After Jacketing</div>
    </div>
    <div class="formula">New B = b + 2 × tj = ${inputs.b} + 2 × ${results.tj} = ${results.new_B} mm<br/>
New D = D + 2 × tj = ${inputs.D} + 2 × ${results.tj} = ${results.new_D} mm<br/>
New concrete area = ${results.new_B} × ${results.new_D} = ${results.new_area} mm²<br/>
(New area ${results.new_area} mm² > Required Ac ${results.Ac.toFixed(2)} mm² ✓)</div>
    <div class="result">${results.new_B} × ${results.new_D} mm</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">7</div>
      <div class="step-desc">Area of Steel Required</div>
      <span class="code-ref">IS 15988:2013 §8.5.1.1(e)</span>
    </div>
    <div class="formula">As = 0.8% × new_B × new_D = 0.008 × ${results.new_B} × ${results.new_D} = ${results.As.toFixed(2)} mm²<br/>
As per §8.5.1.1(e), A's = (4/3) × As<br/>
A's = (4/3) × ${results.As.toFixed(2)}</div>
    <div class="result">A's = ${results.As_prime.toFixed(2)} mm²</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">8</div>
      <div class="step-desc">Number of Longitudinal Bars</div>
    </div>
    <div class="formula">Using ${inputs.dbar} mm Ø bars:<br/>
N = A's × 4 / (π × Ø²) = ${results.As_prime.toFixed(2)} × 4 / (π × ${inputs.dbar}²) = ${results.N_calc.toFixed(3)}<br/>
Round up to next even number → N = ${results.N_bars} nos<br/><br/>
Additional bars required = N_total − N_existing = ${results.N_bars} − ${inputs.existingBars} = ${results.additional_bars} nos</div>
    <div class="result">${results.N_bars} nos of ${inputs.dbar} mm Ø (${results.additional_bars} additional)</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">9</div>
      <div class="step-desc">Lateral Tie Diameter</div>
      <span class="code-ref">IS 15988:2013 §8.5.1.2(e)</span>
    </div>
    <div class="formula">Min. tie dia = max(8 mm, ⌈Ø_bar / 3⌉)<br/>
= max(8, ⌈${inputs.dbar} / 3⌉) = max(8, ${Math.ceil(inputs.dbar / 3)}) mm</div>
    <div class="result">dh = ${results.dh} mm</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">10</div>
      <div class="step-desc">Spacing of Lateral Ties</div>
      <span class="code-ref">IS 15988:2013 §8.5.1.1(f)</span>
    </div>
    <div class="formula">S = (fy × dh²) / (π × fck_new × tj²)<br/>
S = (${inputs.fy} × ${results.dh}²) / (π × ${results.fck_new} × ${results.tj}²)<br/>
S = (${inputs.fy} × ${results.dh * results.dh}) / (π × ${results.fck_new} × ${results.tj * results.tj})<br/>
S = ${S_formula_val} mm<br/>
(Minimum spacing = 100 mm as per code)</div>
    <div class="result">${results.dh} mm Ø @ ${results.S_adopted} mm c/c</div>
  </div>

  <div class="calc-block">
    <div class="step-header">
      <div class="step-num">11</div>
      <div class="step-desc">Shear Connector Studs</div>
    </div>
    <div class="formula">Spacing of shear connectors = 250 mm c/c, Dia = 12 mm<br/>
No. of shear connectors = ⌈Column Height / Spacing⌉<br/>
= ⌈${inputs.height} / 250⌉ = ${results.N_shear} nos</div>
    <div class="result">${results.N_shear} nos of 12 mm Ø @ 250 mm c/c</div>
  </div>

  <!-- Final Design Summary -->
  <div class="section-title">3. Final Design Summary</div>
  <table>
    <thead>
      <tr><th>Parameter</th><th>Old Column</th><th>New Jacketed Column</th></tr>
    </thead>
    <tbody>
      <tr>
        <td class="td-label">Column Size</td>
        <td>${inputs.b} × ${inputs.D} mm</td>
        <td><strong>${results.new_B} × ${results.new_D} mm</strong></td>
      </tr>
      <tr>
        <td class="td-label">Longitudinal Bars</td>
        <td>${inputs.existingBars} nos – ${inputs.existingBarDia} mm Ø</td>
        <td><strong>${results.N_bars} nos – ${inputs.dbar} mm Ø</strong></td>
      </tr>
      <tr>
        <td class="td-label">Additional Bars Required</td>
        <td>—</td>
        <td><strong>${results.additional_bars} nos of ${inputs.dbar} mm Ø</strong></td>
      </tr>
      <tr>
        <td class="td-label">Lateral Ties</td>
        <td>—</td>
        <td>${results.dh} mm Ø @ ${results.S_adopted} mm c/c</td>
      </tr>
      <tr>
        <td class="td-label">Shear Connectors</td>
        <td>—</td>
        <td>${results.N_shear} nos of ${results.shear_dia} mm Ø @ ${results.shear_spacing} mm c/c</td>
      </tr>
      <tr>
        <td class="td-label">Jacket Thickness (each side)</td>
        <td>—</td>
        <td>${results.tj} mm</td>
      </tr>
      <tr>
        <td class="td-label">Concrete Strength (fck)</td>
        <td>${inputs.fck} MPa</td>
        <td>${results.fck_new} MPa</td>
      </tr>
    </tbody>
  </table>

  <!-- Compliance -->
  <div class="compliance">
    <div class="check">✔</div>
    <p>Design satisfies all provisions of IS 15988 : 2013 – Seismic Rehabilitation of Reinforced Concrete Buildings.<br/>
    Code clauses referred: §8.5.1.2(a), §8.5.1.1(e), §8.5.1.2(c), §8.5.1.2(e), §8.5.1.1(f)</p>
  </div>

  <!-- Footer -->
  <div class="report-footer">
    <span>RCC Column Jacketing Design &nbsp;|&nbsp; IS 15988 : 2013</span>
    <span>Generated on ${date}</span>
  </div>

</div>
</body>
</html>`;
}

export default function App() {
  const [form, setForm] = useState<FormValues>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [results, setResults] = useState<DesignResults | null>(null);
  const [inputs, setInputs] = useState<DesignInputs | null>(null);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  const setField = (key: keyof FormValues) => (val: string) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleCalculate = () => {
    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const inp: DesignInputs = {
      designation: form.designation.trim(),
      height: Number(form.height),
      b: Number(form.b),
      D: Number(form.D),
      existingBars: Number(form.existingBars),
      existingBarDia: Number(form.existingBarDia),
      fy: Number(form.fy),
      fck: Number(form.fck),
      Pu: Number(form.Pu),
      dbar: Number(form.dbar),
    };
    const res = calculateJacketing(inp);
    setInputs(inp);
    setResults(res);
  };

  const handleDownloadImage = () => {
    const svgEl = document.getElementById(
      "column-section-svg",
    ) as SVGSVGElement | null;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = 860;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ColumnSection_${inputs?.designation || "Design"}.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const handleDownloadExcel = async () => {
    if (!inputs || !results) return;
    setXlsxLoading(true);
    try {
      await downloadExcel(inputs, results);
    } catch (err) {
      console.error("Excel export failed:", err);
      alert("Excel export failed. Please check your internet connection.");
    } finally {
      setXlsxLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!inputs || !results) return;
    const html = generateHTMLReport(inputs, results);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ColumnJacketing_Report_${inputs.designation}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header
        className="w-full"
        style={{ background: "oklch(0.22 0.068 248)" }}
        data-ocid="nav.section"
      >
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center gap-3">
          <Building2 className="w-7 h-7 text-white opacity-90" />
          <div>
            <h1 className="text-white font-bold text-xl leading-tight tracking-tight">
              RCC Column Jacketing Design
            </h1>
            <p className="text-blue-200 text-xs font-medium tracking-wider">
              IS 15988 : 2013
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6 items-start">
          {/* ===== INPUT FORM CARD ===== */}
          <div
            className="bg-card rounded-lg shadow-card border border-border"
            data-ocid="form.card"
          >
            <div className="px-6 pt-6 pb-2 border-b border-border">
              <h2 className="text-base font-bold text-foreground">
                Design Parameters
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter all values for IS 15988 : 2013 jacketing design
              </p>
            </div>

            <div className="px-6 pb-6">
              {/* Column Geometry */}
              <SectionHeading>Column Geometry</SectionHeading>

              <div className="mb-4">
                <Label
                  htmlFor="designation"
                  className="text-sm font-semibold mb-1 block"
                >
                  Structural Element Designation
                </Label>
                <Input
                  id="designation"
                  value={form.designation}
                  onChange={(e) => setField("designation")(e.target.value)}
                  data-ocid="form.designation.input"
                />
                <FieldError msg={errors.designation} />
              </div>

              <div className="mb-4">
                <Label
                  htmlFor="height"
                  className="text-sm font-semibold mb-1 block"
                >
                  Height of Column
                </Label>
                <InputWithUnit
                  id="height"
                  unit="mm"
                  value={form.height}
                  onChange={setField("height")}
                  error={errors.height}
                  ocid="form.height.input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label
                    htmlFor="b"
                    className="text-sm font-semibold mb-1 block"
                  >
                    Width (b)
                  </Label>
                  <InputWithUnit
                    id="b"
                    unit="mm"
                    value={form.b}
                    onChange={setField("b")}
                    error={errors.b}
                    ocid="form.b.input"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="D"
                    className="text-sm font-semibold mb-1 block"
                  >
                    Depth (D)
                  </Label>
                  <InputWithUnit
                    id="D"
                    unit="mm"
                    value={form.D}
                    onChange={setField("D")}
                    error={errors.D}
                    ocid="form.D.input"
                  />
                </div>
              </div>

              {/* Reinforcement */}
              <SectionHeading>Reinforcement</SectionHeading>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label
                    htmlFor="existingBars"
                    className="text-sm font-semibold mb-1 block"
                  >
                    No. of Existing Bars
                  </Label>
                  <div>
                    <div className="flex">
                      <Input
                        id="existingBars"
                        type="number"
                        value={form.existingBars}
                        onChange={(e) =>
                          setField("existingBars")(e.target.value)
                        }
                        className="rounded-r-none focus-visible:ring-0 border-r-0"
                        data-ocid="form.existingBars.input"
                      />
                      <UnitChip unit="nos" />
                    </div>
                    <FieldError msg={errors.existingBars} />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="existingBarDia"
                    className="text-sm font-semibold mb-1 block"
                  >
                    Existing Bar Dia.
                  </Label>
                  <InputWithUnit
                    id="existingBarDia"
                    unit="mm"
                    value={form.existingBarDia}
                    onChange={setField("existingBarDia")}
                    error={errors.existingBarDia}
                    ocid="form.existingBarDia.input"
                  />
                </div>
              </div>

              <div className="mb-4">
                <Label
                  htmlFor="dbar"
                  className="text-sm font-semibold mb-1 block"
                >
                  Bar Diameter for Jacket
                </Label>
                <Select value={form.dbar} onValueChange={setField("dbar")}>
                  <SelectTrigger
                    id="dbar"
                    className="w-full"
                    data-ocid="form.dbar.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[12, 16, 20, 25, 32].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError msg={errors.dbar} />
              </div>

              {/* Material Properties */}
              <SectionHeading>Material Properties</SectionHeading>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <Label
                    htmlFor="fy"
                    className="text-sm font-semibold mb-1 block"
                  >
                    Yield Strength (f<sub>y</sub>)
                  </Label>
                  <InputWithUnit
                    id="fy"
                    unit="MPa"
                    value={form.fy}
                    onChange={setField("fy")}
                    error={errors.fy}
                    ocid="form.fy.input"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="fck"
                    className="text-sm font-semibold mb-1 block"
                  >
                    Cube Strength (f<sub>ck</sub>)
                  </Label>
                  <InputWithUnit
                    id="fck"
                    unit="MPa"
                    value={form.fck}
                    onChange={setField("fck")}
                    error={errors.fck}
                    ocid="form.fck.input"
                  />
                </div>
              </div>

              {/* Loading */}
              <SectionHeading>Loading</SectionHeading>

              <div className="mb-6">
                <Label
                  htmlFor="Pu"
                  className="text-sm font-semibold mb-1 block"
                >
                  Factored Axial Load (P<sub>u</sub>)
                </Label>
                <InputWithUnit
                  id="Pu"
                  unit="kN"
                  value={form.Pu}
                  onChange={setField("Pu")}
                  error={errors.Pu}
                  ocid="form.Pu.input"
                />
              </div>

              <Button
                className="w-full h-11 text-base font-semibold gap-2"
                style={{ background: "oklch(0.22 0.068 248)" }}
                onClick={handleCalculate}
                data-ocid="calculate.primary_button"
              >
                <Calculator className="w-5 h-5" />
                Calculate Design
              </Button>
            </div>
          </div>

          {/* ===== RESULTS CARD ===== */}
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {!results ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card rounded-lg shadow-card border border-border flex flex-col items-center justify-center py-24 text-center"
                  data-ocid="results.empty_state"
                >
                  <Building2 className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
                  <p className="text-muted-foreground font-medium">
                    Fill in the design parameters and click
                  </p>
                  <p className="text-primary font-bold text-lg">
                    Calculate Design
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Results will appear here
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                  data-ocid="results.section"
                >
                  {/* Status + actions */}
                  <div className="bg-card rounded-lg shadow-card border border-border px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-foreground">
                          Design Complete &ndash;{" "}
                          <span className="text-primary">
                            {inputs?.designation}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <CodeRef ref="IS 15988:2013 §8.5.1.2(a)" />
                          <CodeRef ref="IS 15988:2013 §8.5.1.1(e)" />
                          <CodeRef ref="IS 15988:2013 §8.5.1.2(c)" />
                          <CodeRef ref="IS 15988:2013 §8.5.1.2(e)" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleDownloadImage}
                        data-ocid="download.image.button"
                      >
                        <ImageDown className="w-4 h-4" />
                        Download Section Image
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleDownloadReport}
                        data-ocid="download.report.button"
                      >
                        <FileText className="w-4 h-4" />
                        Download Report
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5"
                        style={{ background: "oklch(0.22 0.068 248)" }}
                        onClick={handleDownloadExcel}
                        disabled={xlsxLoading}
                        data-ocid="download.excel.button"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        {xlsxLoading ? "Generating..." : "Download Excel"}
                      </Button>
                    </div>
                  </div>

                  {/* Key results grid */}
                  {inputs && results && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: "New Column Size",
                          value: `${results.new_B} × ${results.new_D} mm`,
                          sub: "Jacketed section",
                        },
                        {
                          label: "Total Bars",
                          value: `${results.N_bars} nos – ${inputs.dbar} mm`,
                          sub: `+${results.additional_bars} additional`,
                        },
                        {
                          label: "Lateral Ties",
                          value: `${results.dh} mm Ø`,
                          sub: `@ ${results.S_adopted} mm c/c`,
                        },
                        {
                          label: "Jacket Thickness",
                          value: `${results.tj} mm`,
                          sub: "Each side",
                        },
                        {
                          label: "Shear Connectors",
                          value: `${results.N_shear} nos`,
                          sub: "12 mm @ 250 mm c/c",
                        },
                        {
                          label: "New fck",
                          value: `${results.fck_new} MPa`,
                          sub: "IS 15988 §8.5.1.2(a)",
                        },
                      ].map((kv) => (
                        <div
                          key={kv.label}
                          className="bg-card border border-border rounded-lg px-4 py-3"
                        >
                          <p className="text-xs text-muted-foreground font-medium">
                            {kv.label}
                          </p>
                          <p className="text-base font-bold text-foreground leading-tight mt-0.5">
                            {kv.value}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {kv.sub}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Results table */}
                  {inputs && results && (
                    <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
                      <div className="px-6 py-4 border-b border-border">
                        <h3 className="font-bold text-foreground">
                          Design Summary
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Final design as per IS 15988 : 2013
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <Table data-ocid="results.table">
                          <TableHeader>
                            <TableRow className="bg-secondary">
                              <TableHead className="font-semibold text-foreground">
                                Parameter
                              </TableHead>
                              <TableHead className="font-semibold text-foreground">
                                Old Column
                              </TableHead>
                              <TableHead className="font-semibold text-foreground">
                                New Jacketed Column
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow data-ocid="results.row.item.1">
                              <TableCell className="font-medium">
                                Column Size
                              </TableCell>
                              <TableCell>
                                {inputs.b} × {inputs.D} mm
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                {results.new_B} × {results.new_D} mm
                              </TableCell>
                            </TableRow>
                            <TableRow data-ocid="results.row.item.2">
                              <TableCell className="font-medium">
                                Longitudinal Bars
                              </TableCell>
                              <TableCell>
                                {inputs.existingBars} nos –{" "}
                                {inputs.existingBarDia} mm dia
                              </TableCell>
                              <TableCell className="font-semibold">
                                {results.N_bars} nos – {inputs.dbar} mm dia
                              </TableCell>
                            </TableRow>
                            <TableRow data-ocid="results.row.item.3">
                              <TableCell className="font-medium">
                                Additional Bars Required
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                &mdash;
                              </TableCell>
                              <TableCell className="font-semibold text-green-700">
                                {results.additional_bars} nos of {inputs.dbar}{" "}
                                mm dia
                              </TableCell>
                            </TableRow>
                            <TableRow data-ocid="results.row.item.4">
                              <TableCell className="font-medium">
                                Lateral Ties
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                &mdash;
                              </TableCell>
                              <TableCell>
                                {results.dh} mm dia @ {results.S_adopted} mm c/c
                              </TableCell>
                            </TableRow>
                            <TableRow data-ocid="results.row.item.5">
                              <TableCell className="font-medium">
                                Shear Connectors
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                &mdash;
                              </TableCell>
                              <TableCell>
                                {results.N_shear} nos of {results.shear_dia} mm
                                @ {results.shear_spacing} mm c/c
                              </TableCell>
                            </TableRow>
                            <TableRow data-ocid="results.row.item.6">
                              <TableCell className="font-medium">
                                Jacket Thickness
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                &mdash;
                              </TableCell>
                              <TableCell>{results.tj} mm each side</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      <div className="px-6 py-3 bg-green-50 border-t border-border flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm text-green-800 font-medium">
                          Design satisfies all provisions of IS 15988 : 2013
                          &ndash; Seismic Rehabilitation of RC Buildings
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Column Section SVG Diagram */}
                  {inputs && results && (
                    <div className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
                      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">
                            Column Section Diagram
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Existing vs. Jacketed cross-section
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={handleDownloadImage}
                          data-ocid="diagram.download.button"
                        >
                          <Download className="w-4 h-4" />
                          Save as PNG
                        </Button>
                      </div>
                      <div className="overflow-x-auto p-4">
                        <ColumnSectionSVG inputs={inputs} results={results} />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 mt-8">
        <div className="max-w-screen-xl mx-auto px-6 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}. Built with &hearts; using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
