export interface DesignInputs {
  designation: string;
  height: number; // mm
  b: number; // mm width
  D: number; // mm depth
  existingBars: number;
  existingBarDia: number; // mm
  fy: number; // MPa
  fck: number; // MPa
  Pu: number; // kN
  dbar: number; // mm
}

export interface DesignResults {
  fck_new: number;
  Ac: number;
  Ac_prime: number;
  B_trial: number;
  D_trial: number;
  tj_B_calc: number;
  tj_D_calc: number;
  tj: number;
  new_B: number;
  new_D: number;
  new_area: number;
  As: number;
  As_prime: number;
  N_calc: number;
  N_bars: number;
  additional_bars: number;
  dh: number;
  S_calc: number;
  S_adopted: number;
  shear_dia: number;
  shear_spacing: number;
  N_shear: number;
}

export function calculateJacketing(inputs: DesignInputs): DesignResults {
  const { height, b, D, existingBars, fy, fck, Pu, dbar } = inputs;

  // IS 15988:2013 §8.5.1.2(a) – new concrete strength
  const fck_new = fck + 5;

  // Solve Pu×10³ = 0.4×fck_new×Ac + 0.67×fy×0.008×Ac
  const Ac = (Pu * 1000) / (0.4 * fck_new + 0.67 * fy * 0.008);

  // IS 15988:2013 §8.5.1.1(e)
  const Ac_prime = 1.5 * Ac;

  // Trial dimensions
  const B_trial = 400;
  const D_trial = Ac_prime / B_trial;

  // Computed jacket thicknesses
  const tj_B_calc = (B_trial - b) / 2;
  const tj_D_calc = (D_trial - D) / 2;

  // Minimum jacket thickness = 100 mm per IS 15988:2013 §8.5.1.2(c)
  const tj = 100;

  // New column dimensions
  const new_B = b + 2 * tj;
  const new_D = D + 2 * tj;
  const new_area = new_B * new_D;

  // Steel area
  const As = 0.008 * new_B * new_D;
  // IS 15988:2013 §8.5.1.1(e)
  const As_prime = (4 / 3) * As;

  // Number of bars
  const N_calc = (As_prime * 4) / (Math.PI * dbar * dbar);
  let N_bars = Math.ceil(N_calc);
  if (N_bars % 2 !== 0) N_bars += 1; // round to next even number
  const additional_bars = N_bars - existingBars;

  // Tie diameter – IS 15988:2013 §8.5.1.2(e), minimum 8 mm
  const dh = Math.max(8, Math.ceil(dbar / 3));

  // Tie spacing – IS 15988:2013 §8.5.1.1(f)
  const S_calc = (fy * dh * dh) / (Math.PI * fck_new * tj * tj);
  let S_adopted = Math.floor(S_calc / 5) * 5;
  S_adopted = Math.min(S_adopted, 300);
  S_adopted = Math.max(S_adopted, 100); // minimum 100 mm

  // Shear connectors
  const shear_dia = 12;
  const shear_spacing = 250;
  const N_shear = Math.ceil(height / shear_spacing);

  return {
    fck_new,
    Ac,
    Ac_prime,
    B_trial,
    D_trial,
    tj_B_calc,
    tj_D_calc,
    tj,
    new_B,
    new_D,
    new_area,
    As,
    As_prime,
    N_calc,
    N_bars,
    additional_bars,
    dh,
    S_calc,
    S_adopted,
    shear_dia,
    shear_spacing,
    N_shear,
  };
}
