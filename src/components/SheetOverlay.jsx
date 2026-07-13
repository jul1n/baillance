import React from "react";
import { S, Label, SheetFrame, Stamp, NorthArrow, SketchDefs } from "./sketches/common.jsx";

/**
 * Habillage de planche par-dessus la scène 3D : cadre de feuille,
 * annotations manuscrites en marge, cartouche d'agence, rose du nord.
 * Purement décoratif — aucun événement pointeur.
 */
export default function SheetOverlay({ theme, id }) {
  const fid = `${id}-${theme.id}`;
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid meet"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <SketchDefs id={fid} />
      <g filter={`url(#${fid}-rough)`}>
        <SheetFrame />
        {(theme.notes || []).map((n, i) => (
          <g key={i}>
            <Label x={n.x} y={n.y} size={n.size || 17} anchor={n.anchor || "start"}>
              {n.text}
            </Label>
            {n.tick && (
              <S
                d={`M${n.x + (n.tick[0] || 0)},${n.y + 6} q${n.tick[1] || 30},${n.tick[2] || 14} ${n.tick[3] || 60},${n.tick[4] || 30}`}
                w={0.7}
                o={0.5}
                dash="5 6"
              />
            )}
          </g>
        ))}
        <Stamp x={112} y={706} line1={theme.stamp1} line2={theme.stamp2} />
        <NorthArrow x={1108} y={716} />
      </g>
    </svg>
  );
}
