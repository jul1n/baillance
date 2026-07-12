import React from "react";
import {
  S,
  S2,
  CL,
  Label,
  Tuft,
  Tree,
  Person,
  Child,
  Bird,
  Sheet,
  SheetFrame,
  Stamp,
  Sun,
  lerp,
  pt,
} from "./common.jsx";

/* Point de fuite unique de la perspective de rue. */
const VP = [610, 415];
const R = (p, t) => lerp(p, VP, t);
const seg = (p, t1, t2) => `M${pt(R(p, t1))} L${pt(R(p, t2))}`;
const quad = (pTop, pBot, t1, t2) =>
  `M${pt(R(pTop, t1))} L${pt(R(pTop, t2))} L${pt(R(pBot, t2))} L${pt(R(pBot, t1))} Z`;
const vline = (pTop, pBot, t) => `M${pt(R(pTop, t))} L${pt(R(pBot, t))}`;

/* Cycliste gestuel. */
const Cyclist = ({ x, y, s = 1, flip = false, o = 0.85 }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <S d="M0,0 a10,10 0 1,1 -0.1,0 M34,0 a10,10 0 1,1 -0.1,0" w={1} o={o} />
    <S d="M0,-10 L14,-26 L34,-10 M14,-26 L20,-28 M0,-10 L8,-28 L20,-28" w={1} o={o} />
    <S d="M8,-28 C14,-40 22,-46 30,-46 M30,-46 a4,4.4 0 1,1 0.1,0 M30,-42 L22,-28 M26,-34 L14,-26" w={1.1} o={o} />
  </g>
);

/**
 * URBANISME ET MIXITÉ — perspective de rue : tram et vélos à la place
 * du tout-voiture, canopée plantée contre les îlots de chaleur,
 * rez-de-chaussée actifs (arcades, vitrines, terrasse de café).
 */
export default function UrbanMix({ id = "urb" }) {
  return (
    <Sheet id={id}>
      <SheetFrame />

      {/* ------ ciel ------ */}
      <Sun x={1076} y={112} r={21} o={0.5} rays={8} />
      <Bird x={500} y={130} s={0.9} />
      <Bird x={556} y={112} s={0.7} />
      <Bird x={760} y={150} s={0.8} />

      {/* ------ lignes de construction vers le point de fuite ------ */}
      <CL d={seg([1240, 60], 0, 0.94)} />
      <CL d={seg([-40, 40], 0, 0.94)} />
      <CL d={seg([1240, 700], 0.6, 0.96)} />
      <CL d={seg([-40, 640], 0.62, 0.96)} />
      <CL d="M60,415 H1140" o={0.18} />
      <CL d="M610,60 V760" o={0.14} />

      {/* ------ chaussée : bordures, rails de tram, bande cyclable ------ */}
      <S2 d={seg([120, 800], 0, 0.9)} w={1.5} />
      <S2 d={seg([1080, 800], 0, 0.9)} w={1.5} />
      {/* rails */}
      <S d={seg([420, 800], 0, 0.92)} w={1.1} o={0.8} />
      <S d={seg([560, 800], 0, 0.92)} w={1.1} o={0.8} />
      {/* traverses, resserrées vers le fond (le tram occupe u≈0.42) */}
      {[0.03, 0.1, 0.17, 0.24, 0.31, 0.56, 0.63, 0.7, 0.76].map((u) => (
        <S key={u} d={vline([420, 800], [560, 800], u)} w={0.6} o={0.4} />
      ))}
      {/* bande cyclable : pointillés */}
      <S d={seg([880, 800], 0, 0.88)} w={0.8} o={0.55} dash="14 12" />
      <S d={seg([1000, 800], 0, 0.88)} w={0.8} o={0.55} dash="14 12" />
      {/* ligne d'eau caniveau côté gauche */}
      <S d={seg([180, 800], 0, 0.85)} w={0.6} o={0.3} />

      {/* fil de contact du tram */}
      <S d={seg([490, 460], 0, 0.78)} w={0.6} o={0.45} />

      {/* ================= FRONT BÂTI DROIT ================= */}
      {/* bâtiment 1 : R+4, commerces en pied */}
      <S2 d={seg([1240, 700], 0.05, 0.26)} w={1.5} />
      <S2 d={seg([1240, 60], 0.05, 0.26)} w={1.5} />
      <S2 d={vline([1240, 60], [1240, 700], 0.05)} w={1.5} />
      <S2 d={vline([1240, 60], [1240, 700], 0.26)} w={1.5} />
      <S d={seg([1240, 180], 0.05, 0.26)} w={0.9} o={0.6} />
      <S d={seg([1240, 300], 0.05, 0.26)} w={0.9} o={0.6} />
      <S d={seg([1240, 420], 0.05, 0.26)} w={0.9} o={0.6} />
      <S d={seg([1240, 560], 0.05, 0.26)} w={0.9} o={0.7} />
      {/* fenêtres hautes */}
      {[0.075, 0.125, 0.175, 0.225].map((u) => (
        <g key={u}>
          <S d={quad([1240, 400], [1240, 330], u, u + 0.032)} w={0.9} o={0.7} />
          <S d={quad([1240, 280], [1240, 210], u, u + 0.032)} w={0.9} o={0.7} />
          <S d={quad([1240, 158], [1240, 96], u, u + 0.032)} w={0.85} o={0.6} />
        </g>
      ))}
      {/* balcons plantés au R+1 */}
      {[0.08, 0.16].map((u) => (
        <g key={u}>
          <S d={seg([1250, 428], u, u + 0.07)} w={1} o={0.8} />
          <S d={vline([1250, 428], [1250, 452], u)} w={0.8} o={0.7} />
          <S d={vline([1250, 428], [1250, 452], u + 0.07)} w={0.8} o={0.7} />
          <Tuft x={R([1250, 430], u + 0.02)[0]} y={R([1250, 430], u + 0.02)[1]} s={1 - u} />
          <Tuft x={R([1250, 430], u + 0.05)[0]} y={R([1250, 430], u + 0.05)[1]} s={0.9 - u} />
        </g>
      ))}
      {/* auvents des commerces + festons */}
      {[[0.06, 0.145], [0.165, 0.25]].map(([u1, u2]) => (
        <g key={u1}>
          <S2 d={quad([1240, 560], [1155, 615], u1, u2)} w={1.2} />
          {Array.from({ length: 5 }).map((_, k) => {
            const uu = u1 + ((u2 - u1) / 5) * k;
            const uu2 = u1 + ((u2 - u1) / 5) * (k + 1);
            const a = R([1155, 615], uu);
            const b = R([1155, 615], uu2);
            return <S key={k} d={`M${pt(a)} Q${(a[0] + b[0]) / 2},${(a[1] + b[1]) / 2 + 9} ${pt(b)}`} w={0.8} o={0.7} />;
          })}
        </g>
      ))}
      {/* vitrines sous les auvents */}
      <S d={quad([1240, 618], [1240, 692], 0.065, 0.14)} w={1} o={0.8} />
      <path d={quad([1240, 618], [1240, 692], 0.065, 0.14)} fill={`url(#${id}-hatch2)`} opacity="0.35" />
      <S d={quad([1240, 618], [1240, 692], 0.17, 0.245)} w={1} o={0.8} />
      <path d={quad([1240, 618], [1240, 692], 0.17, 0.245)} fill={`url(#${id}-hatch2)`} opacity="0.35" />
      <S d={vline([1240, 618], [1240, 692], 0.105)} w={0.7} o={0.6} />
      <S d={vline([1240, 618], [1240, 692], 0.207)} w={0.7} o={0.6} />

      {/* bâtiment 2 : R+2, toiture végétalisée */}
      <S2 d={seg([1240, 210], 0.26, 0.42)} w={1.3} />
      <S2 d={vline([1240, 210], [1240, 700], 0.42)} w={1.3} />
      <S d={seg([1240, 360], 0.26, 0.42)} w={0.8} o={0.6} />
      <S d={seg([1240, 520], 0.26, 0.42)} w={0.8} o={0.6} />
      {[0.285, 0.33, 0.375].map((u) => (
        <g key={u}>
          <S d={quad([1240, 330], [1240, 262], u, u + 0.028)} w={0.85} o={0.65} />
          <S d={quad([1240, 490], [1240, 420], u, u + 0.028)} w={0.85} o={0.65} />
        </g>
      ))}
      {[0.28, 0.315, 0.35, 0.385].map((u) => {
        const p = R([1240, 206], u);
        return <Tuft key={u} x={p[0]} y={p[1]} s={1.15 - u * 1.4} />;
      })}
      {/* atelier en rez-de-chaussée du bâtiment 2 */}
      <S d={quad([1240, 580], [1240, 690], 0.285, 0.4)} w={0.95} o={0.75} />
      <S d={vline([1240, 580], [1240, 690], 0.34)} w={0.6} o={0.5} />

      {/* bâtiment 3 : R+3, plus loin */}
      <S2 d={seg([1240, 120], 0.42, 0.58)} w={1.1} />
      <S2 d={vline([1240, 120], [1240, 700], 0.58)} w={1.1} />
      <S d={seg([1240, 300], 0.42, 0.58)} w={0.7} o={0.5} />
      <S d={seg([1240, 480], 0.42, 0.58)} w={0.7} o={0.5} />
      {[0.45, 0.49, 0.53].map((u) => (
        <S key={u} d={quad([1240, 270], [1240, 200], u, u + 0.024)} w={0.7} o={0.5} />
      ))}
      {/* silhouettes lointaines, à peine esquissées */}
      <S d={seg([1240, 250], 0.58, 0.72)} w={0.7} o={0.35} />
      <S d={vline([1240, 250], [1240, 700], 0.72)} w={0.7} o={0.35} />

      {/* ================= FRONT BÂTI GAUCHE : arcades ================= */}
      <S2 d={seg([-40, 640], 0.02, 0.34)} w={1.5} />
      <S2 d={seg([-40, 40], 0.02, 0.34)} w={1.5} />
      <S2 d={vline([-40, 40], [-40, 640], 0.34)} w={1.4} />
      <S d={seg([-40, 220], 0.02, 0.34)} w={0.9} o={0.6} />
      <S d={seg([-40, 390], 0.02, 0.34)} w={0.9} o={0.6} />
      {/* arcade : piliers + arcs */}
      {[0.04, 0.1, 0.16, 0.22, 0.28, 0.34].map((u) => (
        <S key={u} d={vline([-40, 500], [-40, 640], u)} w={1.2} o={0.85} />
      ))}
      {[0.04, 0.1, 0.16, 0.22, 0.28].map((u1) => {
        const u2 = u1 + 0.06;
        const a = R([-40, 500], u1);
        const b = R([-40, 500], u2);
        return (
          <S
            key={u1}
            d={`M${pt(a)} C${a[0] + (b[0] - a[0]) * 0.25},${a[1] - 30} ${a[0] + (b[0] - a[0]) * 0.75},${b[1] - 30} ${pt(b)}`}
            w={1.1}
            o={0.8}
          />
        );
      })}
      <path d={quad([-40, 505], [-40, 638], 0.04, 0.34)} fill={`url(#${id}-hatch2)`} opacity="0.22" />
      {/* fenêtres des étages */}
      {[0.06, 0.115, 0.17, 0.225, 0.28].map((u) => (
        <g key={u}>
          <S d={quad([-40, 250], [-40, 340], u, u + 0.034)} w={0.85} o={0.65} />
          <S d={quad([-40, 100], [-40, 180], u, u + 0.034)} w={0.85} o={0.65} />
        </g>
      ))}
      {/* toiture végétalisée côté gauche */}
      {[0.05, 0.1, 0.15, 0.2, 0.25, 0.3].map((u) => {
        const p = R([-40, 36], u);
        return <Tuft key={u} x={p[0]} y={p[1]} s={1.3 - u * 1.6} />;
      })}

      {/* ================= LE TRAM ================= */}
      <g>
        {/* caisse */}
        <S2 d="M486,638 V508 Q486,488 506,486 L570,486 Q590,488 590,508 V638 Z" w={1.5} />
        {/* pare-brise et vitre inférieure */}
        <S d="M498,502 Q500,496 508,495 L568,495 Q580,496 581,504 L581,548 L498,548 Z" w={1} o={0.8} />
        <path d="M500,500 L579,502 L579,546 L500,546 Z" fill={`url(#${id}-hatch2)`} opacity="0.35" />
        <S d="M498,560 H581 M498,600 H581" w={0.8} o={0.6} />
        {/* phares + bandeau destination */}
        <S d="M504,616 a6,6 0 1,0 0.1,0 M566,616 a6,6 0 1,0 0.1,0" w={0.9} o={0.8} />
        <S d="M522,472 H556 V482 H522 Z" w={0.8} o={0.7} />
        {/* pantographe sur le fil */}
        <S d="M526,486 L539,447 M552,486 L539,447 M530,449 H548" w={1} o={0.8} />
        {/* jupe et rail apparent */}
        <S d="M492,638 Q539,646 584,638" w={0.9} o={0.6} />
      </g>

      {/* ================= VÉGÉTATION & MOBILIER ================= */}
      {/* alignement d'arbres, trottoir gauche */}
      {[0.1, 0.22, 0.34, 0.46].map((u) => {
        const p = R([70, 730], u);
        return <Tree key={u} x={p[0]} y={p[1]} s={1.85 * (1 - u * 0.92)} />;
      })}
      {/* ombres portées des arbres sur la chaussée */}
      {[0.1, 0.22].map((u) => {
        const p = R([70, 730], u);
        const s = 1 - u;
        return (
          <path
            key={u}
            d={`M${p[0] - 10},${p[1] + 2} q${45 * s},${-9 * s} ${95 * s},${4 * s} q${-40 * s},${13 * s} ${-95 * s},${-4 * s} Z`}
            fill={`url(#${id}-hatch)`}
            opacity="0.28"
          />
        );
      })}
      {/* arbres côté droit, plus fins */}
      {[0.3, 0.45].map((u) => {
        const p = R([1130, 770], u);
        return <Tree key={u} x={p[0]} y={p[1]} s={1.5 * (1 - u * 0.95)} />;
      })}
      {/* jardinières du terre-plein central */}
      {[0.2, 0.34].map((u) => {
        const p = R([740, 795], u);
        const s = 1 - u * 1.1;
        return (
          <g key={u}>
            <S d={`M${p[0] - 26 * s},${p[1]} h${52 * s} v${-14 * s} h${-52 * s} Z`} w={1} o={0.75} />
            <Tuft x={p[0] - 10 * s} y={p[1] - 14 * s} s={1.3 * s} />
            <Tuft x={p[0] + 12 * s} y={p[1] - 14 * s} s={1.1 * s} />
          </g>
        );
      })}
      {/* lampadaire */}
      {(() => {
        const p = R([150, 760], 0.3);
        return (
          <g>
            <S2 d={`M${p[0]},${p[1]} V${p[1] - 88}`} w={1.2} />
            <S d={`M${p[0]},${p[1] - 88} Q${p[0] + 18},${p[1] - 92} ${p[0] + 24},${p[1] - 82}`} w={1} o={0.8} />
            <S d={`M${p[0] + 24},${p[1] - 82} a4,4 0 1,0 0.1,0`} w={1} o={0.8} />
          </g>
        );
      })()}

      {/* ================= TERRASSE DE CAFÉ (avant droit) ================= */}
      <g>
        {/* parasol */}
        <S2 d="M1046,742 V652" w={1.2} />
        <S d="M1000,664 Q1046,630 1092,664 M1000,664 Q1023,656 1046,664 Q1069,656 1092,664" w={1.1} o={0.85} />
        {/* table + verres */}
        <S d="M1022,706 a24,7 0 1,0 48,0 a24,7 0 1,0 -48,0 M1046,713 V740 M1032,740 H1060" w={1} o={0.8} />
        <S d="M1038,698 V690 M1054,698 V688" w={0.8} o={0.7} />
        {/* deux personnes attablées */}
        <S d="M1008,742 C1006,724 1010,712 1018,706 M1018,706 a4.4,4.8 0 1,1 0.1,0 M1008,720 L1024,712" w={1.1} o={0.85} />
        <S d="M1086,742 C1088,724 1084,712 1076,706 M1076,706 a4.4,4.8 0 1,1 0.1,0 M1086,720 L1070,712" w={1.1} o={0.85} />
        {/* ardoise du café */}
        <S d="M1112,700 L1136,696 L1140,738 L1116,742 Z M1118,710 L1132,708 M1119,720 L1133,718 M1120,730 L1130,728" w={0.9} o={0.7} />
      </g>

      {/* ================= FIGURES ================= */}
      <Cyclist x={912} y={688} s={1.05} />
      <Cyclist x={966} y={742} s={1.3} flip />
      <Person x={208} y={716} s={1.35} />
      <Person x={296} y={664} s={1.05} flip />
      <Child x={318} y={664} />
      <Person x={1148} y={780} s={1.5} flip />
      <Person x={700} y={560} s={0.7} />
      <Person x={676} y={520} s={0.55} flip />

      {/* ================= ANNOTATIONS ================= */}
      <Label x={836} y={776} size={17}>
        rez-de-chaussée actifs
      </Label>
      <S d="M962,770 C1010,748 1050,716 1078,684 M1078,684 a2,2 0 1,0 0.1,0" w={0.7} o={0.55} />
      <Label x={96} y={248} size={17}>
        canopée urbaine
      </Label>
      <Label x={96} y={270} size={14} o={0.6}>
        contre les îlots de chaleur
      </Label>
      <S d="M150,282 C148,340 142,420 138,500 M138,500 a2,2 0 1,0 0.1,0" w={0.7} o={0.55} />
      <Label x={610} y={782} size={17} anchor="middle">
        tram, vélos — la rue apaisée
      </Label>

      {/* ------ cartouche ------ */}
      <Stamp x={112} y={706} line1="carnet n°03" line2="la ville mixte — perspective depuis la rue" />
    </Sheet>
  );
}
