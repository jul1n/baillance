import React from "react";
import { S, S2, CL, Label, Sheet, SheetFrame, Stamp, lerp, pt } from "./common.jsx";

/* Point de fuite central de la perspective intérieure. */
const VP = [600, 400];
/* Murs : arêtes fuyantes depuis le mur du fond (400,240)-(800,560). */
const LT = (t) => lerp([400, 240], [60, 20], t); // plafond, mur gauche
const LB = (t) => lerp([400, 560], [60, 800], t); // sol, mur gauche
const RT = (t) => lerp([800, 240], [1140, 20], t); // plafond, mur droit
const RB = (t) => lerp([800, 560], [1140, 800], t); // sol, mur droit
const mix = (a, b, f) => lerp(a, b, f);

/**
 * LOGEMENT DE QUALITÉ — perspective intérieure : grande hauteur sous
 * plafond, baie toute hauteur inondée de lumière, parquet massif,
 * enfilade traversante et médaillon technique sur l'acoustique.
 */
export default function QualityHome({ id = "qua" }) {
  /* Baie vitrée sur le mur gauche, de t=0.18 (fond) à t=0.80 (premier plan). */
  const win = (t, f) => mix(LT(t), LB(t), f);

  return (
    <Sheet id={id}>
      <SheetFrame />

      {/* ------ boîte de la pièce : arêtes + lignes de construction ------ */}
      <CL d={`M${pt(LT(1))} L${pt([600, 400])} M${pt(LB(1))} L${pt([600, 400])}`} o={0.16} />
      <CL d={`M${pt(RT(1))} L${pt([600, 400])} M${pt(RB(1))} L${pt([600, 400])}`} o={0.16} />
      <S2 d="M400,240 H800 V560 H400 Z" w={1.6} />
      <S2 d={`M400,240 L${pt(LT(1))}`} w={1.4} />
      <S2 d={`M400,560 L${pt(LB(1))}`} w={1.4} />
      <S2 d={`M800,240 L${pt(RT(1))}`} w={1.4} />
      <S2 d={`M800,560 L${pt(RB(1))}`} w={1.4} />

      {/* ------ plafond : solives discrètes ------ */}
      {[260, 460, 740, 940].map((x) => (
        <S key={x} d={`M${x},20 L${x + (600 - x) * 0.58},${20 + 380 * 0.58}`} w={0.6} o={0.3} />
      ))}

      {/* ------ parquet massif, lames fuyantes + joints ------ */}
      {[140, 232, 324, 416, 508, 600, 692, 784, 876, 968, 1060].map((x) => (
        <S key={x} d={`M${x},800 L${x + (600 - x) * 0.6},${800 - 400 * 0.6}`} w={0.55} o={0.4} />
      ))}
      <S d="M315,620 H885" w={0.5} o={0.28} />
      <S d="M258,700 H942" w={0.5} o={0.28} />
      <S d="M480,588 h14 M700,652 h16 M420,730 h18 M840,690 h16" w={0.7} o={0.4} />

      {/* ================= LA BAIE TOUTE HAUTEUR (mur gauche) ================= */}
      {/* cadre */}
      <S2
        d={`M${pt(win(0.18, 0.06))} L${pt(win(0.8, 0.06))} L${pt(win(0.8, 0.86))} L${pt(win(0.18, 0.86))} Z`}
        w={1.6}
      />
      {/* meneaux verticaux + traverse */}
      {[0.335, 0.49, 0.645].map((t) => (
        <S key={t} d={`M${pt(win(t, 0.06))} L${pt(win(t, 0.86))}`} w={1} o={0.8} />
      ))}
      <S d={`M${pt(win(0.18, 0.3))} L${pt(win(0.8, 0.3))}`} w={0.9} o={0.7} />
      {/* dehors, à peine suggéré : frondaisons + oiseaux */}
      <S d="M170,360 C150,330 170,300 200,306 C210,286 244,286 254,304 C280,300 292,326 276,342 C284,358 262,370 244,362 C220,372 184,374 170,360 Z" w={0.8} o={0.35} />
      <S d="M212,338 C224,330 240,328 252,334 M186,352 C200,344 216,344 228,348" w={0.6} o={0.25} />
      <S d="M300,250 c3,-4 7,-4 9,-1 c2,-3 6,-3 9,0" w={0.8} o={0.3} />
      <S d={`M${pt(win(0.24, 0.78))} L${pt(win(0.42, 0.74))}`} w={0.5} o={0.25} />
      {/* reflets du vitrage */}
      <S d={`M${pt(win(0.28, 0.7))} L${pt(win(0.44, 0.16))} M${pt(win(0.52, 0.74))} L${pt(win(0.7, 0.2))}`} w={0.6} o={0.3} />

      {/* ------ rideau au premier plan, retombée souple ------ */}
      <S2 d="M128,112 C120,260 138,420 124,560 C118,628 136,700 128,748" w={1.3} />
      <S d="M146,120 C140,270 156,430 144,570 C138,640 152,706 146,744 M164,130 C158,276 170,440 160,580 C156,648 166,708 162,740" w={0.9} o={0.6} />
      <S d="M112,744 C130,752 150,752 170,742 C158,756 124,758 112,744 Z" w={0.8} o={0.5} />

      {/* ================= LA LUMIÈRE ================= */}
      {/* faisceaux traversants */}
      <S d={`M${pt(win(0.3, 0.12))} L740,690 M${pt(win(0.46, 0.16))} L640,648`} w={0.6} o={0.35} />
      <S d={`M${pt(win(0.62, 0.14))} L920,742`} w={0.6} o={0.3} />
      {[0.34, 0.38, 0.42].map((t) => (
        <S key={t} d={`M${pt(win(t, 0.14))} L${668 + (t - 0.34) * 800},${660 + (t - 0.34) * 340}`} w={0.45} o={0.2} />
      ))}
      {/* flaques de lumière sur le parquet */}
      <path d="M620,652 L790,700 L700,742 L540,688 Z" fill={`url(#${id}-hatch)`} opacity="0.2" />
      <S d="M620,652 L790,700 L700,742 L540,688 Z" w={0.5} o={0.25} />
      <path d="M840,720 L980,764 L900,792 L770,752 Z" fill={`url(#${id}-hatch)`} opacity="0.14" />

      {/* ================= MUR DU FOND : enfilade traversante ================= */}
      {/* porte ouverte vers une seconde façade (logement traversant) */}
      <S2 d="M690,378 H762 V560 M690,560 V378" w={1.3} />
      <S d="M690,378 L664,368 L664,556 L690,560" w={1.1} o={0.8} />
      {/* seconde fenêtre lumineuse au-delà */}
      <S d="M712,404 H746 V500 H712 Z M729,404 V500" w={0.8} o={0.55} />
      <path d="M713,405 H745 V499 H713 Z" fill={`url(#${id}-hatch2)`} opacity="0.3" />
      {/* cadres accrochés */}
      <S2 d="M470,300 H542 V382 H470 Z" w={1.1} />
      <S d="M478,308 H534 V374 H478 Z M486,362 L524,318" w={0.7} o={0.55} />
      <S2 d="M560,322 H612 V372 H560 Z" w={1} />
      <S d="M566,328 H606 V366 H566 Z" w={0.6} o={0.5} />

      {/* ================= BIBLIOTHÈQUE (mur droit) ================= */}
      <S2 d={`M${pt(mix(RT(0.12), RB(0.12), 0.1))} L${pt(mix(RT(0.12), RB(0.12), 0.76))}`} w={1.3} />
      <S2 d={`M${pt(mix(RT(0.5), RB(0.5), 0.1))} L${pt(mix(RT(0.5), RB(0.5), 0.76))}`} w={1.3} />
      {[0.1, 0.245, 0.39, 0.535, 0.68, 0.76].map((f) => (
        <S key={f} d={`M${pt(mix(RT(0.12), RB(0.12), f))} L${pt(mix(RT(0.5), RB(0.5), f))}`} w={0.9} o={0.75} />
      ))}
      {/* livres : petites verticales irrégulières sur chaque étagère */}
      {[0.245, 0.39, 0.535, 0.68].map((f) =>
        [0.15, 0.19, 0.23, 0.27, 0.31, 0.35, 0.39, 0.43, 0.47].map((t, k) => {
          const base = mix(RT(t), RB(t), f);
          const top = mix(RT(t), RB(t), f - 0.1 - (k % 3) * 0.014);
          return (
            <S
              key={`${f}-${t}`}
              d={`M${pt(base)} L${top[0] + (k % 2 ? 2.5 : -1.5)},${top[1]}`}
              w={1}
              o={0.55 + (k % 3) * 0.1}
            />
          );
        })
      )}

      {/* ================= MOBILIER ================= */}
      {/* tapis en perspective */}
      <S2 d="M350,632 L850,632 Q878,634 886,652 L936,768 Q940,782 918,782 L286,782 Q262,782 268,766 L326,646 Q332,634 350,632 Z" w={1.2} />
      <S d="M370,650 L832,650 L872,756 L322,756 Z" w={0.6} o={0.4} dash="8 7" />
      {Array.from({ length: 12 }).map((_, k) => (
        <S key={k} d={`M${296 + k * 4},${770 + (k % 2)} l-7,9`} w={0.5} o={0.4} />
      ))}
      {Array.from({ length: 12 }).map((_, k) => (
        <S key={k} d={`M${880 + k * 4},${766 + (k % 2)} l7,9`} w={0.5} o={0.4} />
      ))}

      {/* canapé */}
      <S2 d="M320,700 V620 Q320,600 342,596 L600,584 Q622,582 622,602 V692 Q622,706 604,708 L340,712 Q320,712 320,700 Z" w={1.5} />
      <S d="M334,596 Q330,540 356,534 L588,522 Q616,520 618,548 L620,584" w={1.3} o={0.85} />
      <S d="M336,618 Q336,600 356,598 L470,592 Q482,592 482,606 L482,616 M486,614 Q486,592 504,590 L592,586 Q606,586 606,600 L606,612" w={0.9} o={0.7} />
      <S d="M602,586 Q648,580 652,616 V694 Q652,706 636,706 L622,706" w={1.3} o={0.85} />
      {/* coussins + plaid */}
      <S d="M370,566 q-6,-24 18,-28 q26,-4 28,18 q2,20 -22,22 q-22,2 -24,-12 Z" w={0.9} o={0.7} />
      <S d="M540,556 q-4,-22 20,-24 q24,-2 24,18 q0,18 -22,19 q-20,1 -22,-13 Z" w={0.9} o={0.7} />
      <path d="M596,552 L650,546 L656,612 L622,616 Z" fill={`url(#${id}-hatch2)`} opacity="0.35" />
      <S d="M596,552 L650,546 M600,580 L654,574" w={0.7} o={0.5} />
      {/* chat lové sur l'assise */}
      <S d="M508,596 q-4,-14 12,-16 q18,-2 20,10 q2,10 -12,12 q-16,2 -20,-6 Z M534,586 l4,-7 4,6 M508,598 q-10,4 -6,10" w={0.9} o={0.7} />

      {/* table basse */}
      <S2 d="M668,704 a52,17 0 1,0 104,0 a52,17 0 1,0 -104,0" w={1.3} />
      <S d="M676,710 V742 M762,710 V742 M700,720 V752 M740,720 V752" w={1} o={0.75} />
      <S d="M696,694 h26 v6 h-26 Z M736,690 a7,3.4 0 1,0 14,0 a7,3.4 0 1,0 -14,0 M743,676 V687" w={0.8} o={0.65} />

      {/* lampadaire liseuse */}
      <S2 d="M232,758 C238,690 226,620 244,562" w={1.3} />
      <S d="M244,562 Q262,532 292,540" w={1.1} o={0.85} />
      <S d="M282,532 L312,552 L296,576 L268,556 Z" w={1.1} o={0.85} />
      <S d="M300,584 l6,12 M310,574 l12,8 M288,590 l2,14" w={0.6} o={0.4} dash="2 5" />
      <S d="M206,760 H262" w={1.1} o={0.8} />

      {/* table à manger au fond + suspension */}
      <S d="M760,150 V300" w={0.8} o={0.7} />
      <S2 d="M742,300 L778,300 L768,332 L752,332 Z" w={1.1} />
      <S d="M746,336 L724,464 M774,336 L798,464" w={0.5} o={0.3} dash="3 7" />
      <S2 d="M700,470 L820,470 L842,502 L682,502 Z" w={1.2} />
      <S d="M700,470 V464 L820,464 L820,470 M690,502 V552 M834,502 V554 M710,478 V500 M812,478 V500" w={0.9} o={0.7} />
      <S d="M666,494 q-2,-26 16,-28 M668,502 V546 M652,522 h18 M866,494 q4,-26 -14,-30 M860,502 V548 M856,524 h18" w={0.9} o={0.7} />
      <S d="M754,452 q0,-14 8,-14 q8,0 8,14 Z M762,438 v-10 M756,432 q6,-6 12,0" w={0.7} o={0.6} />

      {/* grande plante d'intérieur */}
      <S2 d="M962,700 H1032 L1022,762 H972 Z" w={1.3} />
      <S d="M968,712 H1026" w={0.6} o={0.4} />
      <S d="M996,700 C992,660 986,630 972,606 M996,700 C1000,650 1012,620 1030,600 M996,700 C994,656 1002,636 998,616" w={1.1} o={0.85} />
      <S d="M972,606 q-34,-8 -36,-38 q26,-2 36,20 q6,10 0,18 Z M972,606 q-6,-16 -2,-24" w={1} o={0.8} />
      <S d="M1030,600 q6,-36 40,-40 q4,28 -20,40 q-12,6 -20,0 Z M1030,600 q10,-12 22,-16" w={1} o={0.8} />
      <S d="M998,616 q-16,-30 4,-52 q18,20 6,48 q-4,8 -10,4 Z" w={1} o={0.8} />

      {/* ================= MÉDAILLON TECHNIQUE : ACOUSTIQUE ================= */}
      <S2 d="M1010,150 a62,62 0 1,1 -0.2,0" w={1.2} />
      {/* coupe de mur : deux parois + isolant */}
      <S d="M990,102 V198 M997,102 V198 M1023,102 V198 M1030,102 V198" w={1} o={0.8} />
      <S d="M999,110 q8,6 -2,12 q10,6 -2,12 q10,6 -2,12 q10,6 -2,12 q10,6 -2,12 q10,6 -2,12 q10,6 -2,12" w={0.8} o={0.6} transform="translate(11 -3)" />
      {/* ondes sonores arrêtées par la paroi */}
      <S d="M966,134 a26,26 0 0,1 0,32 M956,124 a40,40 0 0,1 0,52 M946,114 a54,54 0 0,1 0,72" w={0.9} o={0.7} />
      <S d="M1040,142 a12,12 0 0,1 0,16" w={0.7} o={0.35} dash="2 5" />
      {/* renvoi vers le mur droit */}
      <S d="M1004,214 C980,258 952,296 930,326" w={0.7} o={0.5} dash="5 6" />
      <S d="M930,326 a2,2 0 1,0 0.1,0" w={1.4} o={0.7} />
      <Label x={1010} y={240} size={16} anchor="middle">
        acoustique soignée
      </Label>

      {/* ================= COTATIONS & ANNOTATIONS ================= */}
      <S d="M386,240 V560 M380,240 H392 M380,560 H392" w={0.7} o={0.5} />
      <Label x={374} y={400} size={14} anchor="middle" rotate={-90} o={0.6}>
        2,70 m sous plafond
      </Label>

      <Label x={318} y={102} size={17}>
        lumière traversante
      </Label>
      <S d="M330,112 C316,134 302,152 290,166 M290,166 a2,2 0 1,0 0.1,0" w={0.7} o={0.55} />

      <Label x={588} y={766} size={16} anchor="middle">
        parquet massif, matériaux pérennes
      </Label>
      <S d="M520,750 C506,742 494,736 482,732 M482,732 a2,2 0 1,0 0.1,0" w={0.7} o={0.55} />

      <Label x={726} y={366} size={13} anchor="middle" o={0.6}>
        double exposition
      </Label>

      {/* ------ cartouche ------ */}
      <Stamp x={112} y={706} line1="carnet n°04" line2="la qualité d'habiter — perspective intérieure" />
    </Sheet>
  );
}
