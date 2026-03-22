import type { DesignInputs, DesignResults } from "../utils/calculations";

interface Props {
  inputs: DesignInputs;
  results: DesignResults;
}

/**
 * Places N bars symmetrically around a rectangle.
 * Always puts bars at 4 corners; distributes remaining bars
 * evenly on top/bottom (equal) and left/right (equal),
 * proportional to side lengths so spacing looks uniform.
 */
function getSymmetricBarPositions(
  cx: number,
  cy: number,
  W: number,
  H: number,
  N: number,
): { x: number; y: number }[] {
  if (N <= 0) return [];

  const corners: { x: number; y: number }[] = [
    { x: cx - W / 2, y: cy - H / 2 },
    { x: cx + W / 2, y: cy - H / 2 },
    { x: cx + W / 2, y: cy + H / 2 },
    { x: cx - W / 2, y: cy + H / 2 },
  ];

  if (N <= 4) return corners.slice(0, N);

  const extra = N - 4; // bars to add between corners, must be even
  const halfExtra = extra / 2; // split between (top+bottom) pair and (left+right) pair

  // Distribute proportionally to side length, keeping top=bottom, left=right
  const halfPerimeter = W + H;
  let n_top = Math.round((halfExtra * W) / halfPerimeter);
  let n_left = halfExtra - n_top;
  // Clamp
  n_top = Math.max(0, n_top);
  n_left = Math.max(0, halfExtra - n_top);

  const n_bottom = n_top;
  const n_right = n_left;

  const mid: { x: number; y: number }[] = [];

  // Top side (left-to-right between corners)
  for (let i = 1; i <= n_top; i++)
    mid.push({ x: cx - W / 2 + (i / (n_top + 1)) * W, y: cy - H / 2 });

  // Right side (top-to-bottom between corners)
  for (let i = 1; i <= n_right; i++)
    mid.push({ x: cx + W / 2, y: cy - H / 2 + (i / (n_right + 1)) * H });

  // Bottom side (right-to-left between corners)
  for (let i = 1; i <= n_bottom; i++)
    mid.push({ x: cx + W / 2 - (i / (n_bottom + 1)) * W, y: cy + H / 2 });

  // Left side (bottom-to-top between corners)
  for (let i = 1; i <= n_left; i++)
    mid.push({ x: cx - W / 2, y: cy + H / 2 - (i / (n_left + 1)) * H });

  return [...corners, ...mid];
}

function XMark({ cx, cy, size }: { cx: number; cy: number; size: number }) {
  return (
    <g>
      <line
        x1={cx - size}
        y1={cy - size}
        x2={cx + size}
        y2={cy + size}
        stroke="#1e40af"
        strokeWidth="1.5"
      />
      <line
        x1={cx + size}
        y1={cy - size}
        x2={cx - size}
        y2={cy + size}
        stroke="#1e40af"
        strokeWidth="1.5"
      />
    </g>
  );
}

export default function ColumnSectionSVG({ inputs, results }: Props) {
  const { b, D, existingBars, existingBarDia, dbar } = inputs;
  const {
    new_B,
    new_D,
    N_bars,
    tj,
    N_shear,
    shear_dia,
    shear_spacing,
    additional_bars,
  } = results;

  const svgW = 860;
  const svgH = 480;

  // Scale: fit new section in ~200px
  const maxDim = Math.max(new_B, new_D);
  const scale = Math.min(200 / maxDim, 0.45);

  // OLD section center
  const oldCx = 200;
  const oldCy = 210;
  const oldW = b * scale;
  const oldH = D * scale;

  // NEW section center
  const newCx = 650;
  const newCy = 210;
  const newW = new_B * scale;
  const newH = new_D * scale;
  const innerW = b * scale;
  const innerH = D * scale;

  // Cover for bar placement (35mm typical)
  const cover = 35 * scale;
  const oldBarW = oldW - 2 * cover;
  const oldBarH = oldH - 2 * cover;
  const newBarW = newW - 2 * cover;
  const newBarH = newH - 2 * cover;

  // Old section bar positions — always symmetric
  const oldBarPositions = getSymmetricBarPositions(
    oldCx,
    oldCy,
    oldBarW,
    oldBarH,
    existingBars,
  );

  // New jacket bar positions — show only additional_bars, symmetric
  const newBarPositions = getSymmetricBarPositions(
    newCx,
    newCy,
    newBarW,
    newBarH,
    additional_bars,
  );

  // Shear connector positions on old section (left & right edges)
  const shearCount = Math.min(N_shear, 6);
  const shearPositionsOld: { x: number; y: number; side: string }[] = [];
  for (let i = 0; i < shearCount; i++) {
    const sy = oldCy - oldH / 2 + ((i + 0.5) / shearCount) * oldH;
    shearPositionsOld.push({ x: oldCx - oldW / 2, y: sy, side: "L" });
    shearPositionsOld.push({ x: oldCx + oldW / 2, y: sy, side: "R" });
  }

  // Shear connectors on inner column boundary in new section
  const shearPositionsNew: { x: number; y: number; side: string }[] = [];
  for (let i = 0; i < shearCount; i++) {
    const ny = newCy - innerH / 2 + ((i + 0.5) / shearCount) * innerH;
    shearPositionsNew.push({ x: newCx - innerW / 2, y: ny, side: "L" });
    shearPositionsNew.push({ x: newCx + innerW / 2, y: ny, side: "R" });
  }

  // Suppress unused variable warning
  void N_bars;

  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: engineering diagram, title provided via aria-label
    <svg
      id="column-section-svg"
      role="img"
      aria-label="Column section diagram showing existing and jacketed cross-sections"
      viewBox={`0 0 ${svgW} ${svgH}`}
      width={svgW}
      height={svgH}
      style={{ background: "white", maxWidth: "100%" }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="hatch"
          patternUnits="userSpaceOnUse"
          width="8"
          height="8"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="8" stroke="#6b7280" strokeWidth="1" />
        </pattern>
        <pattern id="dots" patternUnits="userSpaceOnUse" width="8" height="8">
          <circle cx="4" cy="4" r="1" fill="#94a3b8" />
        </pattern>
      </defs>

      {/* Divider */}
      <line
        x1={svgW / 2}
        y1={10}
        x2={svgW / 2}
        y2={svgH - 10}
        stroke="#e2e8f0"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* ====== OLD SECTION ====== */}
      <text
        x={oldCx}
        y={30}
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="#1e3a5f"
      >
        EXISTING SECTION
      </text>

      <rect
        x={oldCx - oldW / 2}
        y={oldCy - oldH / 2}
        width={oldW}
        height={oldH}
        fill="url(#hatch)"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Old column bars — symmetric */}
      {oldBarPositions.map((pos) => (
        <circle
          key={`old-bar-${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`}
          cx={pos.x}
          cy={pos.y}
          r={Math.max(5, existingBarDia * scale * 0.55)}
          fill="#1e3a5f"
          stroke="white"
          strokeWidth="1"
        />
      ))}

      {/* Shear connectors on old section */}
      {shearPositionsOld.map((pos) => (
        <XMark
          key={`shear-old-${pos.side}-${pos.y.toFixed(1)}`}
          cx={pos.x}
          cy={pos.y}
          size={4}
        />
      ))}

      {/* Width dimension line top */}
      <line
        x1={oldCx - oldW / 2}
        y1={oldCy - oldH / 2 - 14}
        x2={oldCx + oldW / 2}
        y2={oldCy - oldH / 2 - 14}
        stroke="#374151"
        strokeWidth="1"
      />
      <line
        x1={oldCx - oldW / 2}
        y1={oldCy - oldH / 2 - 18}
        x2={oldCx - oldW / 2}
        y2={oldCy - oldH / 2 - 10}
        stroke="#374151"
        strokeWidth="1"
      />
      <line
        x1={oldCx + oldW / 2}
        y1={oldCy - oldH / 2 - 18}
        x2={oldCx + oldW / 2}
        y2={oldCy - oldH / 2 - 10}
        stroke="#374151"
        strokeWidth="1"
      />
      <text
        x={oldCx}
        y={oldCy - oldH / 2 - 20}
        textAnchor="middle"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#374151"
      >
        {b} mm
      </text>

      {/* Height dimension line left */}
      <line
        x1={oldCx - oldW / 2 - 14}
        y1={oldCy - oldH / 2}
        x2={oldCx - oldW / 2 - 14}
        y2={oldCy + oldH / 2}
        stroke="#374151"
        strokeWidth="1"
      />
      <line
        x1={oldCx - oldW / 2 - 18}
        y1={oldCy - oldH / 2}
        x2={oldCx - oldW / 2 - 10}
        y2={oldCy - oldH / 2}
        stroke="#374151"
        strokeWidth="1"
      />
      <line
        x1={oldCx - oldW / 2 - 18}
        y1={oldCy + oldH / 2}
        x2={oldCx - oldW / 2 - 10}
        y2={oldCy + oldH / 2}
        stroke="#374151"
        strokeWidth="1"
      />
      <text
        x={oldCx - oldW / 2 - 22}
        y={oldCy}
        textAnchor="middle"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#374151"
        transform={`rotate(-90, ${oldCx - oldW / 2 - 22}, ${oldCy})`}
      >
        {D} mm
      </text>

      {/* Old section labels */}
      <text
        x={oldCx}
        y={oldCy + oldH / 2 + 24}
        textAnchor="middle"
        fontSize="12"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#374151"
        fontWeight="600"
      >
        {b} × {D} mm
      </text>
      <text
        x={oldCx}
        y={oldCy + oldH / 2 + 40}
        textAnchor="middle"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#6b7280"
      >
        {existingBars} nos – {existingBarDia} mm dia bars
      </text>
      <text
        x={oldCx}
        y={oldCy + oldH / 2 + 56}
        textAnchor="middle"
        fontSize="10"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#1e40af"
      >
        Shear connectors: {N_shear} nos, {shear_dia} mm @ {shear_spacing} c/c (2
        sides)
      </text>

      {/* ====== NEW JACKETED SECTION ====== */}
      <text
        x={newCx}
        y={30}
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="#1e3a5f"
      >
        JACKETED SECTION
      </text>

      {/* Jacket outer – dotted */}
      <rect
        x={newCx - newW / 2}
        y={newCy - newH / 2}
        width={newW}
        height={newH}
        fill="url(#dots)"
        stroke="#0f172a"
        strokeWidth="2.5"
      />

      {/* Inner old column – hatched */}
      <rect
        x={newCx - innerW / 2}
        y={newCy - innerH / 2}
        width={innerW}
        height={innerH}
        fill="url(#hatch)"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Tie rectangle */}
      <rect
        x={newCx - newBarW / 2 - 4}
        y={newCy - newBarH / 2 - 4}
        width={newBarW + 8}
        height={newBarH + 8}
        fill="none"
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />

      {/* New section bars — symmetric jacket bars only */}
      {newBarPositions.map((pos) => (
        <circle
          key={`new-bar-${pos.x.toFixed(1)}-${pos.y.toFixed(1)}`}
          cx={pos.x}
          cy={pos.y}
          r={Math.max(6, dbar * scale * 0.6)}
          fill="#1e3a5f"
          stroke="white"
          strokeWidth="1.5"
        />
      ))}

      {/* Shear connectors on inner boundary in new section */}
      {shearPositionsNew.map((pos) => (
        <XMark
          key={`shear-new-${pos.side}-${pos.y.toFixed(1)}`}
          cx={pos.x}
          cy={pos.y}
          size={4}
        />
      ))}

      {/* New outer width dim line top */}
      <line
        x1={newCx - newW / 2}
        y1={newCy - newH / 2 - 14}
        x2={newCx + newW / 2}
        y2={newCy - newH / 2 - 14}
        stroke="#0f172a"
        strokeWidth="1"
      />
      <line
        x1={newCx - newW / 2}
        y1={newCy - newH / 2 - 18}
        x2={newCx - newW / 2}
        y2={newCy - newH / 2 - 10}
        stroke="#0f172a"
        strokeWidth="1"
      />
      <line
        x1={newCx + newW / 2}
        y1={newCy - newH / 2 - 18}
        x2={newCx + newW / 2}
        y2={newCy - newH / 2 - 10}
        stroke="#0f172a"
        strokeWidth="1"
      />
      <text
        x={newCx}
        y={newCy - newH / 2 - 20}
        textAnchor="middle"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#0f172a"
        fontWeight="600"
      >
        {new_B} mm
      </text>

      {/* New section right height dim */}
      <line
        x1={newCx + newW / 2 + 14}
        y1={newCy - newH / 2}
        x2={newCx + newW / 2 + 14}
        y2={newCy + newH / 2}
        stroke="#0f172a"
        strokeWidth="1"
      />
      <line
        x1={newCx + newW / 2 + 10}
        y1={newCy - newH / 2}
        x2={newCx + newW / 2 + 18}
        y2={newCy - newH / 2}
        stroke="#0f172a"
        strokeWidth="1"
      />
      <line
        x1={newCx + newW / 2 + 10}
        y1={newCy + newH / 2}
        x2={newCx + newW / 2 + 18}
        y2={newCy + newH / 2}
        stroke="#0f172a"
        strokeWidth="1"
      />
      <text
        x={newCx + newW / 2 + 22}
        y={newCy}
        textAnchor="middle"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#0f172a"
        fontWeight="600"
        transform={`rotate(90, ${newCx + newW / 2 + 22}, ${newCy})`}
      >
        {new_D} mm
      </text>

      {/* Jacket thickness annotation */}
      <line
        x1={newCx - newW / 2}
        y1={newCy - innerH / 2 - 4}
        x2={newCx - innerW / 2}
        y2={newCy - innerH / 2 - 4}
        stroke="#7c3aed"
        strokeWidth="1.5"
      />
      <text
        x={(newCx - newW / 2 + newCx - innerW / 2) / 2}
        y={newCy - innerH / 2 - 8}
        textAnchor="middle"
        fontSize="9"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#7c3aed"
      >
        tj={tj}mm
      </text>

      {/* Legend */}
      <rect
        x={newCx - newW / 2}
        y={newCy + newH / 2 + 12}
        width="12"
        height="12"
        fill="url(#hatch)"
        stroke="#374151"
        strokeWidth="1"
      />
      <text
        x={newCx - newW / 2 + 16}
        y={newCy + newH / 2 + 22}
        fontSize="10"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#374151"
      >
        Existing concrete
      </text>
      <rect
        x={newCx - newW / 2 + 115}
        y={newCy + newH / 2 + 12}
        width="12"
        height="12"
        fill="url(#dots)"
        stroke="#374151"
        strokeWidth="1"
      />
      <text
        x={newCx - newW / 2 + 131}
        y={newCy + newH / 2 + 22}
        fontSize="10"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#374151"
      >
        New jacket concrete
      </text>

      {/* New section labels */}
      <text
        x={newCx}
        y={newCy + newH / 2 + 50}
        textAnchor="middle"
        fontSize="12"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#374151"
        fontWeight="600"
      >
        {new_B} × {new_D} mm
      </text>
      <text
        x={newCx}
        y={newCy + newH / 2 + 66}
        textAnchor="middle"
        fontSize="11"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#6b7280"
      >
        {additional_bars} nos – {dbar} mm dia (new jacket bars)
      </text>
      <text
        x={newCx}
        y={newCy + newH / 2 + 82}
        textAnchor="middle"
        fontSize="10"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#1e40af"
      >
        Shear connectors: {N_shear} nos, {shear_dia} mm @ {shear_spacing} c/c (2
        sides)
      </text>

      {/* Tie legend */}
      <line
        x1={newCx - 40}
        y1={newCy + newH / 2 + 100}
        x2={newCx - 28}
        y2={newCy + newH / 2 + 100}
        stroke="#dc2626"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      <text
        x={newCx - 24}
        y={newCy + newH / 2 + 104}
        fontSize="10"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif"
        fill="#dc2626"
      >
        Lateral tie ({results.dh} mm Ø @ {results.S_adopted} mm c/c)
      </text>
    </svg>
  );
}
