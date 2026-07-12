import React from "react";
import {
  S,
  S2,
  CL,
  Ah,
  Label,
  Tuft,
  Tree,
  Bird,
  Sheet,
  SheetFrame,
  Stamp,
  Sun,
} from "./common.jsx";

/**
 * ADAPTATION AU CHANGEMENT CLIMATIQUE — coupe bioclimatique d'un
 * logement traversant : double exposition, brise-soleil au sud,
 * ventilation naturelle, ombrage végétal, toiture plantée.
 * (Volontairement : aucun panneau solaire.)
 */
export default function ClimateAdaptation({ id = "cli" }) {
  return (
    <Sheet id={id}>
      <SheetFrame />

      {/* ------ lignes de construction ------ */}
      <CL d="M90,650 H1120" />
      <CL d="M330,80 V710 M870,80 V710" />
      <CL d="M150,390 H1050 M150,610 H1050" o={0.16} />

      {/* ================= COURSE DU SOLEIL ================= */}
      <S d="M290,150 C480,42 830,50 1096,300" w={0.8} o={0.5} dash="3 9" />
      <Sun x={718} y={68} r={22} o={0.75} />
      <Label x={766} y={62} size={15} o={0.65}>
        soleil d'été, haut
      </Label>
      {/* soleil d'hiver, bas sur l'horizon */}
      <S d="M1078,282 a17,17 0 1,1 -0.1,0" w={1} o={0.55} dash="4 4" />
      <Label x={1078} y={332} size={15} anchor="middle" o={0.6}>
        hiver, bas
      </Label>
      {/* rayons d'été arrêtés par les brise-soleil */}
      <S d="M760,110 L906,428 M800,122 L916,472 M840,140 L924,516" w={0.7} o={0.5} />
      <Ah x={906} y={428} a={246} s={6} o={0.6} />
      <Ah x={916} y={472} a={250} s={6} o={0.6} />
      <Ah x={924} y={516} a={252} s={6} o={0.6} />
      {/* rayon d'hiver qui pénètre profondément */}
      <S d="M1052,300 C960,360 800,450 620,540" w={0.7} o={0.5} dash="10 7" />
      <Ah x={620} y={540} a={208} s={7} o={0.6} />

      <Bird x={470} y={140} s={0.9} />
      <Bird x={528} y={120} s={0.7} />

      {/* ================= LE BÂTIMENT EN COUPE ================= */}
      {/* terrain */}
      <S2 d="M100,650 H1110" w={1.8} />
      <S d="M130,658 H320 M420,660 H700 M880,657 H1080" w={0.8} o={0.4} />
      <path d="M332,630 H868 V650 H332 Z" fill={`url(#${id}-cross)`} opacity="0.35" />
      <S d="M332,630 H868" w={1} o={0.7} />

      {/* murs coupés (poché hachuré) */}
      {[
        [330, 355],
        [845, 870],
      ].map(([x1, x2]) => (
        <g key={x1}>
          <S2 d={`M${x1},140 V630 M${x2},140 V630`} w={1.6} />
          <path d={`M${x1},140 H${x2} V630 H${x1} Z`} fill={`url(#${id}-hatch)`} opacity="0.5" />
        </g>
      ))}

      {/* dalles coupées */}
      {[
        [120, 148],
        [370, 392],
        [606, 630],
      ].map(([y1, y2]) => (
        <g key={y1}>
          <S2 d={`M330,${y1} H870 M330,${y2} H870`} w={1.4} />
          <path d={`M332,${y1 + 1} H868 V${y2 - 1} H332 Z`} fill={`url(#${id}-hatch)`} opacity="0.45" />
        </g>
      ))}

      {/* acrotères + toiture végétalisée (sans aucun panneau) */}
      <S2 d="M330,140 V96 M870,140 V96 M322,96 H338 M862,96 H878" w={1.4} />
      <S d="M340,132 H860" w={0.8} o={0.5} />
      {[360, 405, 450, 495, 540, 585, 630, 675, 720, 765, 810].map((x, i) => (
        <Tuft key={x} x={x} y={122} s={0.95 + (i % 3) * 0.18} />
      ))}
      <Label x={600} y={80} size={15} anchor="middle" o={0.65}>
        toiture plantée, inertie et fraîcheur
      </Label>

      {/* ================= FAÇADE NORD-OUEST (gauche) ================= */}
      {/* baie du séjour */}
      <S2 d="M330,420 V590 M355,420 V590" w={1.3} />
      <S d="M338,420 V590 M346,420 V590" w={0.8} o={0.7} />
      <S d="M326,420 H360 M326,590 H360" w={1.1} o={0.8} />
      {/* balcon filant + garde-corps */}
      <S2 d="M282,606 H355 M278,614 H358" w={1.2} />
      <S d="M282,606 V614 M286,548 H332 M286,548 V606 M300,548 V606 M314,548 V606 M328,548 V606" w={0.8} o={0.7} />
      <Tuft x={294} y={548} s={1.1} />
      <Tuft x={318} y={548} s={0.95} />
      {/* casquette / auvent au-dessus de la baie */}
      <S2 d="M330,414 L268,392 M330,404 L272,384" w={1.1} />
      <S d="M268,392 L272,384 M290,388 L286,398 M308,396 L304,406" w={0.8} o={0.6} />
      {/* étage : fenêtre + volet persienné entrouvert */}
      <S2 d="M330,190 V330 M355,190 V330 M326,190 H360 M326,330 H360" w={1.2} />
      <S d="M338,190 V330 M346,190 V330" w={0.7} o={0.6} />
      <S d="M306,196 L330,204 L330,318 L306,326 Z" w={1} o={0.8} />
      {[210, 226, 242, 258, 274, 290, 306].map((y) => (
        <S key={y} d={`M308,${y} L328,${y + 6}`} w={0.6} o={0.55} />
      ))}

      {/* ================= FAÇADE SUD (droite) : BRISE-SOLEIL ================= */}
      {/* vitrage du séjour */}
      <S2 d="M845,410 V600 M870,410 V600" w={1.3} />
      <S d="M853,410 V600 M861,410 V600" w={0.8} o={0.7} />
      <S d="M840,410 H876 M840,600 H876" w={1.1} o={0.8} />
      {/* lames du brise-soleil, inclinées */}
      <S2 d="M886,404 V606 M912,404 V606" w={1.2} />
      {Array.from({ length: 12 }).map((_, k) => (
        <S key={k} d={`M886,${414 + k * 16} L912,${422 + k * 16}`} w={1.3} o={0.85} />
      ))}
      <S d="M886,404 H912 M886,606 H912" w={1} o={0.8} />
      {/* étage : mêmes lames devant la fenêtre haute */}
      <S2 d="M845,200 V340 M870,200 V340 M840,200 H876 M840,340 H876" w={1.2} />
      <S d="M853,200 V340 M861,200 V340" w={0.7} o={0.6} />
      <S d="M886,196 V346 M908,196 V346" w={1} o={0.8} />
      {Array.from({ length: 9 }).map((_, k) => (
        <S key={k} d={`M886,${206 + k * 15.5} L908,${213 + k * 15.5}`} w={1.1} o={0.75} />
      ))}
      {/* ombre projetée des lames sur la façade */}
      <path d="M871,430 H884 V590 H871 Z" fill={`url(#${id}-hatch2)`} opacity="0.4" />

      {/* ================= INTÉRIEUR : NIVEAU HAUT (chambre) ================= */}
      <S d="M420,370 H560 M420,370 V330 M560,370 V342 M420,330 H560 L560,342" w={0.9} o={0.55} />
      <S d="M430,330 V342 M430,336 H548" w={0.6} o={0.4} />
      <S d="M470,318 a12,6 0 1,0 24,0 a12,6 0 1,0 -24,0" w={0.7} o={0.45} />
      {/* bureau + silhouette esquissée */}
      <S d="M660,330 H770 M672,330 V370 M758,330 V370" w={0.8} o={0.5} />
      <S d="M712,296 a5,5.4 0 1,1 0.1,0 M712,301 C713,312 713,320 710,330 M710,312 L694,322 M710,312 L726,320" w={0.9} o={0.5} />

      {/* ================= INTÉRIEUR : NIVEAU BAS (séjour traversant) ================= */}
      {/* ventilateur de plafond */}
      <S d="M600,392 V408" w={1.1} o={0.8} />
      <S d="M600,408 a5,5 0 1,0 0.1,0 M566,410 a34,7 0 0,1 30,-4 M634,410 a34,7 0 0,0 -30,-4" w={1} o={0.8} />
      <S d="M560,424 a44,10 0 0,1 80,-2" w={0.5} o={0.3} dash="2 6" />
      {/* fauteuil + lectrice */}
      <S2 d="M500,630 V584 Q500,570 516,568 L560,566 Q576,566 576,582 V630" w={1.3} />
      <S d="M500,600 Q488,598 488,584 Q488,566 504,562 M576,598 Q590,596 590,582" w={1} o={0.8} />
      <S d="M534,540 a6,6.4 0 1,1 0.1,0 M534,546 C536,560 536,570 534,584 M534,560 L518,574 M534,558 L552,570 M518,574 L544,580" w={1.1} o={0.85} />
      <S d="M544,566 L560,556 L566,568" w={0.9} o={0.7} />
      {/* table d'appoint + carafe d'eau fraîche */}
      <S d="M610,630 V596 M596,596 H624 M604,586 q0,-10 6,-10 q6,0 6,10 Z M610,570 v6" w={0.9} o={0.7} />
      {/* grande plante intérieure côté sud */}
      <S d="M780,630 h44 l-7,-36 h-30 Z" w={1} o={0.8} />
      <S d="M800,594 C794,560 786,540 774,524 M800,594 C806,552 818,532 832,520 M800,594 C800,556 804,540 800,524" w={1} o={0.8} />
      <S d="M774,524 q-24,-6 -26,-30 q20,0 26,18 q4,8 0,12 Z M832,520 q6,-26 30,-30 q2,22 -18,30 q-8,4 -12,0 Z M800,524 q-10,-24 4,-42 q12,16 4,38 q-3,7 -8,4 Z" w={0.9} o={0.75} />
      {/* tapis */}
      <S d="M446,632 H700 M452,626 H694" w={0.7} o={0.45} />

      {/* ================= FLUX D'AIR TRAVERSANTS ================= */}
      <S d="M228,506 C300,492 360,494 440,512 C560,540 660,532 740,496 C790,472 818,458 852,444" w={1.2} o={0.8} dash="16 9" />
      <Ah x={852} y={444} a={-22} s={9} />
      <S d="M240,556 C340,590 560,598 700,566 C760,552 800,522 838,492" w={1.1} o={0.7} dash="16 9" />
      <Ah x={838} y={492} a={-30} s={8} o={0.7} />
      {/* tirage thermique : l'air chaud s'élève et s'échappe en partie haute */}
      <S d="M640,560 C660,520 650,480 668,444 C676,428 690,420 706,418" w={0.9} o={0.6} dash="10 8" />
      <Ah x={706} y={418} a={-8} s={7} o={0.6} />

      {/* ================= OMBRAGE VÉGÉTAL ================= */}
      <Tree x={196} y={650} s={2.15} />
      <Tree x={120} y={650} s={1.4} />
      <Tuft x={280} y={650} s={1.5} />
      <Tuft x={952} y={650} s={1.4} />
      <Tuft x={996} y={650} s={1.7} />
      <Tuft x={1034} y={650} s={1.2} />
      {/* ombre portée de l'arbre sur la façade et le sol */}
      <path d="M118,650 q80,-16 180,4 q-90,18 -180,-4 Z" fill={`url(#${id}-hatch)`} opacity="0.3" />

      {/* ================= THERMOMÈTRE DU CONFORT ================= */}
      <g transform="translate(140 420)">
        <S2 d="M0,-58 a9,9 0 0,1 18,0 V22 a15,15 0 1,1 -18,0 Z" w={1.2} />
        <S d="M9,30 a6,6 0 1,0 0.1,0 M9,26 V-12" w={1.6} o={0.8} />
        <S d="M22,-40 h8 M22,-24 h8 M22,-8 h8" w={0.7} o={0.6} />
      </g>
      <Label x={110} y={510} size={15} o={0.7}>
        confort d'été,
      </Label>
      <Label x={110} y={530} size={15} o={0.7}>
        sans climatisation
      </Label>

      {/* ================= ANNOTATIONS ================= */}
      <Label x={962} y={470} size={17}>
        brise-soleil
      </Label>
      <S d="M958,464 C942,458 928,452 916,448 M916,448 a2,2 0 1,0 0.1,0" w={0.7} o={0.55} />

      <Label x={488} y={694} size={17} anchor="middle">
        ventilation naturelle traversante
      </Label>
      <S d="M420,686 C400,660 386,636 376,614 M376,614 a2,2 0 1,0 0.1,0" w={0.7} o={0.55} />

      <Label x={600} y={730} size={16} anchor="middle" o={0.7}>
        double exposition — l'air et la lumière passent
      </Label>
      <S d="M446,724 C400,716 366,700 340,680" w={0.7} o={0.5} />
      <Ah x={340} y={680} a={210} s={6} o={0.6} />
      <S d="M754,724 C800,716 836,700 862,680" w={0.7} o={0.5} />
      <Ah x={862} y={680} a={-30} s={6} o={0.6} />

      <Label x={196} y={306} size={15} o={0.7}>
        ombrage au sud-ouest
      </Label>
      <S d="M232,316 C222,346 212,382 204,420" w={0.7} o={0.5} dash="4 6" />

      {/* cotation du niveau */}
      <S d="M310,392 V606 M304,392 H316 M304,606 H316" w={0.7} o={0.5} />
      <Label x={298} y={500} size={13} anchor="middle" rotate={-90} o={0.6}>
        2,70 m
      </Label>

      {/* ------ cartouche ------ */}
      <Stamp x={112} y={706} line1="carnet n°05" line2="coupe bioclimatique — le confort d'été" />
    </Sheet>
  );
}
