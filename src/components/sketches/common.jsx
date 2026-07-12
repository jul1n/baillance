import React from "react";

/* ------------------------------------------------------------------ */
/*  Boîte à outils "croquis d'architecte"                              */
/*  Tous les tracés utilisent currentColor : la couleur d'encre est    */
/*  donnée par le conteneur (style={{ color: theme.ink }}).            */
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

/** Trait repassé deux fois — simule la main qui revient sur la ligne. */
export const S2 = ({ d, w = 1.5, o = 0.9, dx = 1.2, dy = -0.9 }) => (
  <>
    <S d={d} w={w} o={o} />
    <S d={d} w={w * 0.55} o={o * 0.4} transform={`translate(${dx} ${dy})`} />
  </>
);

/** Ligne de construction : fine, discrète, dépasse toujours l'objet. */
export const CL = ({ d, o = 0.28, w = 0.55, dash }) => (
  <S d={d} w={w} o={o} dash={dash} />
);

/** Pointe de flèche, orientée par l'angle `a` (degrés). */
export const Ah = ({ x, y, a = 0, s = 8, w = 1.2, o = 0.8 }) => (
  <g transform={`translate(${x} ${y}) rotate(${a})`}>
    <S d={`M0,0 L${-s},${-s * 0.5} M0,0 L${-s},${s * 0.5}`} w={w} o={o} />
  </g>
);

/** Annotation manuscrite (serif italique + filtre = écriture à la main). */
export const Label = ({
  x,
  y,
  children,
  size = 17,
  o = 0.8,
  anchor = "start",
  rotate = 0,
}) => (
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

/** Touffe de végétation (jardinière, balcon planté…). */
export const Tuft = ({ x, y, s = 1, o = 0.85 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <S d="M0,0 C-3,-7 -9,-10 -7,-2" w={1} o={o} />
    <S d="M0,0 C-1,-9 3,-13 3,-4" w={1} o={o} />
    <S d="M0,0 C3,-6 9,-8 6,-1" w={1} o={o} />
    <S d="M1,0 C1,-5 6,-11 8,-6" w={0.9} o={o * 0.8} />
  </g>
);

/** Arbre au trait, canopée en nuage gribouillé. */
export const Tree = ({ x, y, s = 1, o = 0.9 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {/* tronc et branches */}
    <S2 d="M-2,0 C-4,-16 -2,-30 -4,-46 M3,0 C4,-14 2,-28 3,-44" w={1.4} o={o} />
    <S d="M-3,-38 C-12,-46 -18,-50 -26,-52 M2,-40 C10,-48 16,-50 24,-54 M0,-46 C0,-54 -2,-60 -1,-66" w={1.1} o={o * 0.9} />
    {/* canopée : trois nuages qui se chevauchent */}
    <S
      d="M-34,-52 C-48,-58 -46,-80 -28,-84 C-26,-98 -2,-102 8,-90 C26,-96 40,-80 30,-66 C40,-56 24,-44 8,-48 C-6,-40 -28,-42 -34,-52 Z"
      w={1.3}
      o={o}
    />
    <S
      d="M-24,-60 C-34,-68 -26,-82 -12,-80 C-8,-90 10,-90 14,-80 C26,-82 32,-70 22,-62"
      w={0.8}
      o={o * 0.55}
    />
    <S d="M-18,-66 C-10,-72 0,-74 10,-68 M-22,-56 C-12,-60 -2,-60 6,-56 M-4,-84 C2,-80 8,-78 16,-76" w={0.7} o={o * 0.4} />
  </g>
);

/** Silhouette humaine d'échelle, gestuelle. */
export const Person = ({ x, y, s = 1, flip = false, o = 0.9 }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <S d="M0,-34 a4.6,5 0 1,1 0.1,0" w={1.2} o={o} />
    <S d="M0,-28 C1,-20 1,-14 0,-6 M0,-6 L-5,8 M0,-6 L5,8 M0,-22 L-7,-11 M0,-22 L6,-13" w={1.2} o={o} />
  </g>
);

/** Enfant (même vocabulaire, plus petit et plus vif). */
export const Child = ({ x, y, s = 0.62, flip = false, o = 0.9 }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <S d="M0,-32 a5,5.4 0 1,1 0.1,0" w={1.6} o={o} />
    <S d="M0,-26 C1,-19 1,-13 0,-6 M0,-6 L-6,8 M0,-6 L6,8 M0,-21 L-9,-16 M0,-21 L9,-26" w={1.6} o={o} />
  </g>
);

/** Oiseau en deux coups de crayon. */
export const Bird = ({ x, y, s = 1, o = 0.7 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <S d="M0,0 C3,-4 7,-4 9,-1 C11,-4 15,-4 18,0" w={1} o={o} />
  </g>
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

/** Soleil gribouillé. */
export const Sun = ({ x, y, r = 26, o = 0.7, rays = 9 }) => (
  <g transform={`translate(${x} ${y})`}>
    <S d={`M${r},0 a${r},${r} 0 1,1 -0.1,0`} w={1.2} o={o} />
    <S d={`M${r * 0.8},${-r * 0.25} a${r},${r} 0 0,1 ${-r * 0.3},${r * 0.9}`} w={0.7} o={o * 0.5} />
    {Array.from({ length: rays }).map((_, i) => {
      const a = (i / rays) * Math.PI * 2 + 0.35;
      const c = Math.cos(a);
      const s = Math.sin(a);
      return (
        <S
          key={i}
          d={`M${c * (r + 7)},${s * (r + 7)} L${c * (r + 15 + (i % 3) * 4)},${s * (r + 15 + (i % 3) * 4)}`}
          w={1}
          o={o * 0.8}
        />
      );
    })}
  </g>
);

/* Interpolation linéaire entre deux points — pour les perspectives. */
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;

/**
 * Defs communes : filtre "main levée" (turbulence + displacement)
 * et motifs de hachures pour les ombres et vitrages.
 */
export const SketchDefs = ({ id, scale = 3.4, freq = 0.012 }) => (
  <defs>
    <filter id={`${id}-rough`} x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" seed="11" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <pattern id={`${id}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
      <line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" strokeWidth="0.7" opacity="0.5" />
    </pattern>
    <pattern id={`${id}-hatch2`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
      <line x1="0" y1="0" x2="0" y2="9" stroke="currentColor" strokeWidth="0.55" opacity="0.35" />
    </pattern>
    <pattern id={`${id}-cross`} width="8" height="8" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="8" y2="8" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      <line x1="8" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
    </pattern>
  </defs>
);

/** Enveloppe standard d'une planche : viewBox 1200×800 + filtre crayon. */
export const Sheet = ({ id, children, className = "" }) => (
  <svg
    viewBox="0 0 1200 800"
    className={`h-full w-full ${className}`}
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <SketchDefs id={id} />
    <g filter={`url(#${id}-rough)`}>{children}</g>
  </svg>
);
