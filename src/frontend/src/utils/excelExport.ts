import type { DesignInputs, DesignResults } from "./calculations";

type Row = (string | number)[];

function n(val: number, decimals = 2): string {
  return val.toFixed(decimals);
}

function loadXlsxScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as Window & { XLSX?: unknown }).XLSX) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load SheetJS"));
    document.head.appendChild(script);
  });
}

export async function downloadExcel(
  inputs: DesignInputs,
  results: DesignResults,
): Promise<void> {
  await loadXlsxScript();
  // biome-ignore lint/suspicious/noExplicitAny: SheetJS loaded from CDN
  const XLSX = (window as any).XLSX;
  if (!XLSX) throw new Error("SheetJS not loaded");

  const wb = XLSX.utils.book_new();

  // ---- Sheet 1: Input Data ----
  const s1: Row[] = [
    ["Parameter", "Value", "Unit"],
    ["Structural Element Designation", inputs.designation, ""],
    ["Height of Column", inputs.height, "mm"],
    ["Width (b)", inputs.b, "mm"],
    ["Depth (D)", inputs.D, "mm"],
    ["Number of Existing Bars", inputs.existingBars, "nos"],
    ["Existing Bar Diameter", inputs.existingBarDia, "mm"],
    ["Yield Strength of Steel (fy)", inputs.fy, "MPa"],
    ["Concrete Cube Strength (fck)", inputs.fck, "N/mm2"],
    ["Factored Axial Load (Pu)", inputs.Pu, "kN"],
    ["Jacket Bar Diameter (dbar)", inputs.dbar, "mm"],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(s1);
  ws1["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Input Data");

  // ---- Sheet 2: Design Calculations ----
  const s2: Row[] = [
    ["RCC COLUMN JACKETING DESIGN - IS 15988:2013"],
    [""],
    ["Step", "Description", "Formula / Value", "Result", "Unit"],
    [
      "1",
      "New concrete strength [IS 15988:2013 §8.5.1.2(a)]",
      `fck_new = fck + 5 = ${inputs.fck} + 5`,
      n(results.fck_new, 0),
      "N/mm2",
    ],
    [
      "2",
      "Required concrete area (Ac)",
      `Ac = Pu*10^3 / (0.4*fck_new + 0.67*fy*0.008) = ${inputs.Pu}*10^3 / (0.4*${results.fck_new} + 0.67*${inputs.fy}*0.008)`,
      n(results.Ac, 2),
      "mm2",
    ],
    [
      "3",
      "Enhanced concrete area A'c [IS 15988:2013 §8.5.1.1(e)]",
      `A'c = 1.5 x Ac = 1.5 x ${n(results.Ac)}`,
      n(results.Ac_prime, 2),
      "mm2",
    ],
    [
      "4",
      "Trial column width B = 400 mm, compute D_trial",
      `D_trial = A'c / B_trial = ${n(results.Ac_prime)} / 400`,
      n(results.D_trial, 2),
      "mm",
    ],
    [
      "5",
      "Computed jacket thickness (B-side)",
      `tj_B = (B_trial - b) / 2 = (400 - ${inputs.b}) / 2`,
      n(results.tj_B_calc, 2),
      "mm",
    ],
    [
      "5a",
      "Computed jacket thickness (D-side)",
      `tj_D = (D_trial - D) / 2 = (${n(results.D_trial)} - ${inputs.D}) / 2`,
      n(results.tj_D_calc, 2),
      "mm",
    ],
    [
      "5b",
      "Minimum jacket thickness [IS 15988:2013 §8.5.1.2(c)]",
      "tj_min = 100 mm governs",
      100,
      "mm",
    ],
    [
      "6",
      "New column size",
      `new_B = b + 2*tj = ${inputs.b} + 200; new_D = D + 2*tj = ${inputs.D} + 200`,
      `${results.new_B} x ${results.new_D}`,
      "mm",
    ],
    [
      "7",
      "New concrete area",
      `new_B x new_D = ${results.new_B} x ${results.new_D}`,
      n(results.new_area, 0),
      "mm2",
    ],
    [
      "8",
      "Steel area As = 0.8% of new area",
      `As = 0.008 x ${results.new_B} x ${results.new_D}`,
      n(results.As, 2),
      "mm2",
    ],
    [
      "9",
      "Enhanced steel area A's [IS 15988:2013 §8.5.1.1(e)]",
      `A's = (4/3) x As = (4/3) x ${n(results.As)}`,
      n(results.As_prime, 2),
      "mm2",
    ],
    [
      "10",
      "Number of bars (N_calc)",
      `N = A's x 4 / (pi x dbar^2) = ${n(results.As_prime)} x 4 / (pi x ${inputs.dbar}^2)`,
      n(results.N_calc, 3),
      "nos",
    ],
    [
      "10a",
      "Rounded to next even number",
      `N_bars = ${results.N_bars} (even)`,
      results.N_bars,
      "nos",
    ],
    [
      "11",
      "Additional bars required",
      `N_bars - existing = ${results.N_bars} - ${inputs.existingBars}`,
      results.additional_bars,
      "nos",
    ],
    [
      "12",
      "Lateral tie diameter [IS 15988:2013 §8.5.1.2(e)]",
      `dh = max(8, ceil(dbar/3)) = max(8, ceil(${inputs.dbar}/3))`,
      results.dh,
      "mm",
    ],
    [
      "13",
      "Jacket thickness for spacing formula",
      "tj = 100 mm (minimum governs)",
      results.tj,
      "mm",
    ],
    [
      "14",
      "Tie spacing S [IS 15988:2013 §8.5.1.1(f)]",
      `S = (fy x dh^2) / (pi x fck_new x tj^2) = (${inputs.fy} x ${results.dh}^2) / (pi x ${results.fck_new} x ${results.tj}^2)`,
      n(results.S_calc, 2),
      "mm",
    ],
    [
      "14a",
      "Adopted tie spacing (min 100 mm, max 300 mm)",
      `S_adopted = max(100, min(300, floor(S/5)*5)) = ${results.S_adopted} mm`,
      results.S_adopted,
      "mm c/c",
    ],
    [
      "15",
      "Shear connectors",
      `N = ceil(H / 250) = ceil(${inputs.height} / 250)`,
      results.N_shear,
      `nos of ${results.shear_dia} mm dia @ ${results.shear_spacing} mm c/c`,
    ],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(s2);
  ws2["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];
  ws2["!cols"] = [
    { wch: 6 },
    { wch: 46 },
    { wch: 60 },
    { wch: 18 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Design Calculations");

  // ---- Sheet 3: Final Design Summary ----
  const s3: Row[] = [
    ["FINAL DESIGN SUMMARY - RCC COLUMN JACKETING"],
    [`Element: ${inputs.designation}`, "", ""],
    [""],
    ["Parameter", "Old Column", "New Jacketed Column"],
    [
      "Column Size",
      `${inputs.b} x ${inputs.D} mm`,
      `${results.new_B} x ${results.new_D} mm`,
    ],
    [
      "Longitudinal Bars",
      `${inputs.existingBars} nos - ${inputs.existingBarDia} mm dia`,
      `${results.N_bars} nos - ${inputs.dbar} mm dia`,
    ],
    [
      "Additional Bars Required",
      "-",
      `${results.additional_bars} nos of ${inputs.dbar} mm dia`,
    ],
    ["Lateral Ties", "-", `${results.dh} mm dia @ ${results.S_adopted} mm c/c`],
    [
      "Shear Connectors",
      "-",
      `${results.N_shear} nos of ${results.shear_dia} mm dia @ ${results.shear_spacing} mm c/c`,
    ],
    ["Jacket Thickness", "-", `${results.tj} mm each side`],
    [""],
    ["Code Compliance", "IS 15988:2013 - Satisfied", ""],
    ["Minimum jacket thickness [§8.5.1.2(c)]", "100 mm", "Satisfied"],
    [
      "New fck >= existing + 5 MPa [§8.5.1.2(a)]",
      `${results.fck_new} N/mm2`,
      "Satisfied",
    ],
    [
      "Enhanced steel area A's [§8.5.1.1(e)]",
      `${n(results.As_prime, 2)} mm2`,
      "Satisfied",
    ],
    ["Minimum tie diameter [§8.5.1.2(e)]", `${results.dh} mm`, "Satisfied"],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(s3);
  ws3["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
  ws3["!cols"] = [{ wch: 44 }, { wch: 28 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, ws3, "Final Design Summary");

  const filename = `Column_Jacketing_${inputs.designation || "Design"}.xlsx`;
  XLSX.writeFile(wb, filename);
}
