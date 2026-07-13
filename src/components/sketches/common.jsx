import React from "react";

/* ------------------------------------------------------------------ */
/*  Habillage 2D des planches : cadre de feuille, cartouche, notes     */
/*  manuscrites. Le dessin lui-même est désormais un modèle 3D         */
/*  (voir src/three) ; ici ne restent que les attributs de la planche. */
/* ------------------------------------------------------------------ */

/** Trait de crayon simple. */
export const S = ({ d, w = 1.4, o = 0.9, dash, fill = "none", ...rest }) => (
  <path
    d={d}
    fill={fill}
    stroke="currentColor"
    strokeWidth={w}
    strokeOpacity={o}
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeDasharray={dash}
    {...rest}
  />
);

/** Annotation manuscrite (serif italique + filtre = écriture à la main). */
export const Label = ({ x, y, children, size = 17, o = 0.8, anchor = "start", rotate = 0 }) => (
  <text
    x={x}
    y={y}
    fontSize={size}
    textAnchor={anchor}
    transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
    fill="currentColor"
    fillOpacity={o}
    style={{
      fontFamily: "var(--font-serif, Georgia, serif)",
      fontStyle: "italic",
      letterSpacing: "0.02em",
    }}
  >
    {children}
  </text>
);

/** Cadre de planche + coins, comme une feuille de carnet d'architecte. */
export const SheetFrame = () => (
  <>
    <S d="M42,42 H1158 V758 H42 Z" w={0.7} o={0.2} />
    <S d="M42,60 V42 H60 M1140,42 H1158 V60 M1158,740 V758 H1140 M60,758 H42 V740" w={1.1} o={0.4} />
  </>
);

/** Cartouche / tampon d'agence en bas de planche. */
export const Stamp = ({ x, y, line1, line2 }) => (
  <g>
    <S d={`M${x},${y} H${x + 236} V${y + 46} H${x} Z`} w={0.9} o={0.5} />
    <S d={`M${x},${y + 27} H${x + 236} M${x + 122},${y} V${y + 27}`} w={0.6} o={0.4} />
    <text
      x={x + 10}
      y={y + 18}
      fontSize="13"
      fill="currentColor"
      fillOpacity="0.72"
      style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontWeight: 600, letterSpacing: "0.12em" }}
    >
      BAILLANCE
    </text>
    <text x={x + 132} y={y + 18} fontSize="11" fill="currentColor" fillOpacity="0.6" style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontStyle: "italic" }}>
      {line1}
    </text>
    <text x={x + 10} y={y + 40} fontSize="11" fill="currentColor" fillOpacity="0.6" style={{ fontFamily: "var(--font-serif, Georgia, serif)", fontStyle: "italic" }}>
      {line2}
    </text>
  </g>
);

/** Rose "Nord" de plan masse. */
export const NorthArrow = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <S d="M0,-15 a15,15 0 1,1 -0.1,0" w={0.9} o={0.55} />
    <S d="M0,10 L-4,2 L0,-13 L4,2 Z" w={1.1} o={0.75} />
    <Label x={0} y={-21} size={13} anchor="middle" o={0.65}>
      N
    </Label>
  </g>
);

/** Filtre « main levée » pour les éléments 2D de la planche. */
export const SketchDefs = ({ id, scale = 3.4, freq = 0.012 }) => (
  <defs>
    <filter id={`${id}-rough`} x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" seed="11" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
);
