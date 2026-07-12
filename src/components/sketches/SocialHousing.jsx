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
  NorthArrow,
  Sun,
} from "./common.jsx";

/**
 * LOGEMENT SOCIAL — élévation perspective d'un immeuble moderne,
 * accueillant et inclusif : hall traversant, balcons plantés,
 * toiture partagée, figures d'échelle.
 */
export default function SocialHousing({ id = "soc" }) {
  return (
    <Sheet id={id}>
      <SheetFrame />

      {/* ------ lignes de construction (niveaux + trames verticales) ------ */}
      <CL d="M120,640 H1090" />
      <CL d="M140,280 H1000" />
      <CL d="M170,200 H1060" />
      <CL d="M300,150 V705" />
      <CL d="M630,150 V705" />
      <CL d="M920,150 V705" />
      <CL d="M120,370 H960 M120,460 H960 M120,550 H960" o={0.18} />

      {/* ------ ciel : soleil + oiseaux ------ */}
      <Sun x={168} y={122} r={24} o={0.6} />
      <Bird x={738} y={118} />
      <Bird x={800} y={140} s={0.8} />
      <Bird x={688} y={152} s={0.65} />

      {/* ------ sol ------ */}
      <S2 d="M100,640 H1100" w={1.8} />
      <S d="M130,648 H420 M520,650 H780 M860,647 H1060" w={0.8} o={0.4} />

      {/* ================= VOLUME A (gauche, R+3) ================= */}
      <S2 d="M300,280 H630 V640 H300 Z" w={1.7} />
      {/* couronnement / acrotère */}
      <S d="M292,280 H638 M296,272 H634" w={1} o={0.7} />
      {/* nez de dalles */}
      <S d="M300,370 H630 M300,460 H630 M300,550 H630" w={0.9} o={0.6} />
      {/* jardin partagé en toiture : pergola + végétation */}
      <S d="M380,272 V236 M470,272 V232 M560,272 V236" w={1.1} o={0.8} />
      <S2 d="M366,236 H576" w={1.2} />
      <S d="M380,236 L392,222 M420,234 L432,220 M470,232 L482,218 M520,234 L532,220" w={0.7} o={0.45} />
      <Tuft x={350} y={272} s={1.2} />
      <Tuft x={410} y={270} s={1.4} />
      <Tuft x={500} y={271} s={1.3} />
      <Tuft x={598} y={272} s={1.2} />
      <Person x={445} y={272} s={0.85} />

      {/* fenêtres du volume A : 3 travées × 3 niveaux */}
      {[300, 390, 480].map((fy) =>
        [330, 435, 540].map((fx) => (
          <g key={`${fx}-${fy}`}>
            <S2 d={`M${fx},${fy} H${fx + 60} V${fy + 54} H${fx} Z`} w={1.2} />
            {/* tableau / épaisseur de la baie */}
            <S d={`M${fx + 4},${fy + 4} V${fy + 50} M${fx + 4},${fy + 4} H${fx + 56}`} w={0.6} o={0.5} />
            {/* reflet du vitrage */}
            <S d={`M${fx + 12},${fy + 44} L${fx + 46},${fy + 8} M${fx + 22},${fy + 48} L${fx + 52},${fy + 16}`} w={0.6} o={0.4} />
            {/* garde-corps fin */}
            <S d={`M${fx - 3},${fy + 54} H${fx + 63}`} w={0.9} o={0.7} />
          </g>
        ))
      )}
      {/* jardinière fleurie à une fenêtre (2e travée, 2e niveau) */}
      <Tuft x={452} y={390} s={1.1} />
      <Tuft x={470} y={390} s={0.9} />

      {/* ------ rez-de-chaussée du volume A : salle commune + hall ------ */}
      {/* vitrage de la salle commune */}
      <S2 d="M312,560 H420 V636 H312 Z" w={1.2} />
      <S d="M348,560 V636 M384,560 V636" w={0.8} o={0.6} />
      <rect x="313" y="561" width="106" height="74" fill={`url(#${id}-hatch2)`} />
      {/* hall : double porte + imposte vitrée */}
      <S2 d="M440,556 H520 V640 M440,640 V556" w={1.4} />
      <S d="M480,560 V640 M448,568 H512" w={1} o={0.8} />
      <S d="M472,600 a3,6 0 1,0 0.1,0 M488,600 a3,6 0 1,0 0.1,0" w={0.9} o={0.7} />
      {/* auvent du hall, tenu par deux tirants */}
      <S2 d="M418,548 L548,540 L548,547 L418,556 Z" w={1.3} />
      <S d="M432,549 L458,502 M534,542 L522,500" w={0.9} o={0.7} />
      {/* emmarchement + rampe d'accès PMR */}
      <S d="M424,634 H540 M428,637 H536" w={0.9} o={0.65} />
      <S d="M540,640 L610,628 M540,634 L610,622 M606,622 V640" w={0.9} o={0.6} />
      {/* vitrage latéral du hall */}
      <S2 d="M532,560 H612 V632 H532 Z" w={1.1} />
      <rect x="533" y="561" width="78" height="70" fill={`url(#${id}-hatch2)`} />

      {/* ================= VOLUME B (droit, R+4, balcons plantés) ================= */}
      <S2 d="M630,200 H920 V640" w={1.7} />
      <S d="M624,200 H926 M628,193 H922" w={1} o={0.7} />
      {/* face latérale en fuite (profondeur) */}
      <S2 d="M920,200 L1006,234 L1006,602 L920,640" w={1.3} />
      <S d="M920,288 L1006,314 M920,376 L1006,394 M920,464 L1006,474 M920,552 L1006,552" w={0.7} o={0.45} />
      <S d="M948,250 L974,260 L974,296 L948,288 Z M948,338 L974,346 L974,380 L948,374 Z" w={0.8} o={0.6} />
      {/* ombre portée du volume au sol */}
      <path d="M920,640 L1006,602 L1096,640 L1010,662 Z" fill={`url(#${id}-hatch)`} opacity="0.35" />
      <S d="M920,640 L1010,662 M1006,602 L1096,640" w={0.6} o={0.35} />

      {/* nez de dalle + balcons filants plantés (4 niveaux) */}
      {[288, 376, 464, 552].map((fy, i) => (
        <g key={fy}>
          {/* dalle du balcon, légèrement en saillie */}
          <S2 d={`M640,${fy} H812 M636,${fy + 7} H816`} w={1.2} />
          <S d={`M636,${fy} V${fy + 7} M816,${fy} V${fy + 7}`} w={1} o={0.8} />
          {/* garde-corps : lisse + barreaudage fin */}
          <S d={`M638,${fy - 30} H814`} w={1.1} o={0.85} />
          {Array.from({ length: 15 }).map((_, k) => (
            <S key={k} d={`M${646 + k * 12},${fy - 30} V${fy}`} w={0.55} o={0.55} />
          ))}
          {/* végétation débordante */}
          <Tuft x={660 + (i % 2) * 30} y={fy - 30} s={1.25} />
          <Tuft x={724} y={fy - 30} s={1.05} />
          <Tuft x={782 - (i % 2) * 26} y={fy - 30} s={1.3} />
          <S d={`M700,${fy - 28} C696,${fy - 16} 702,${fy - 8} 698,${fy + 2}`} w={0.7} o={0.5} />
          {/* porte-fenêtre en retrait */}
          <S d={`M672,${fy - 66} H742 V${fy - 32} M672,${fy - 32} V${fy - 66} M707,${fy - 66} V${fy - 32}`} w={0.9} o={0.7} />
        </g>
      ))}
      {/* habitante au balcon du 2e niveau */}
      <Person x={760} y={376} s={0.8} flip />

      {/* travée de fenêtres à droite des balcons */}
      {[228, 316, 404, 492].map((fy) => (
        <g key={fy}>
          <S2 d={`M836,${fy} H900 V${fy + 52} H836 Z`} w={1.1} />
          <S d={`M868,${fy} V${fy + 52}`} w={0.7} o={0.6} />
          <S d={`M842,${fy + 44} L866,${fy + 10}`} w={0.55} o={0.4} />
        </g>
      ))}

      {/* rez-de-chaussée du volume B : atelier partagé / local vélos */}
      <S2 d="M652,568 H772 V638 H652 Z" w={1.2} />
      <rect x="653" y="569" width="118" height="68" fill={`url(#${id}-hatch2)`} />
      <S d="M712,568 V638" w={0.8} o={0.6} />
      <Label x={712} y={660} size={13} anchor="middle" o={0.55}>
        atelier des habitants
      </Label>
      {/* vélo appuyé contre la façade */}
      <g transform="translate(806 614)">
        <S d="M0,14 a13,13 0 1,1 -0.1,0 M46,14 a13,13 0 1,1 -0.1,0" w={1} o={0.8} />
        <S d="M13,27 L28,4 L46,27 M13,27 L20,4 L28,4 M20,4 L16,-2 M46,27 L44,2 M40,2 H50" w={1} o={0.8} />
      </g>

      {/* ------ figures d'échelle devant le hall ------ */}
      <Person x={572} y={640} s={1.05} />
      <Child x={596} y={640} flip />
      <Person x={392} y={640} s={1} flip />

      {/* ------ végétation ------ */}
      <Tree x={182} y={640} s={1.75} />
      <Tree x={1052} y={640} s={1.1} />
      <Tuft x={268} y={640} s={1.6} />
      <Tuft x={288} y={640} s={1.2} />
      <Tuft x={946} y={640} s={1.4} />

      {/* ------ cotation verticale ------ */}
      <S d="M252,640 V280 M246,640 H258 M246,280 H258 M246,370 H258 M246,460 H258 M246,550 H258" w={0.7} o={0.5} />
      <Label x={240} y={470} size={14} anchor="middle" rotate={-90} o={0.6}>
        R+4 — 24 logements
      </Label>

      {/* ------ annotations à main levée ------ */}
      <Label x={842} y={172} size={17}>
        balcons plantés
      </Label>
      <S d="M888,180 C860,204 830,224 800,250" w={0.7} o={0.55} />
      <S d="M800,250 a2,2 0 1,0 0.1,0" w={1.4} o={0.7} />

      <Label x={344} y={186} size={17}>
        toiture partagée
      </Label>
      <S d="M414,194 C438,208 452,220 462,230" w={0.7} o={0.55} />
      <S d="M462,230 a2,2 0 1,0 0.1,0" w={1.4} o={0.7} />

      <Label x={462} y={700} size={17} anchor="middle">
        hall traversant, ouvert sur le jardin
      </Label>
      <S d="M470,684 C474,668 478,656 480,646" w={0.7} o={0.55} />
      <S d="M480,646 a2,2 0 1,0 0.1,0" w={1.4} o={0.7} />

      {/* ------ cartouche + nord ------ */}
      <Stamp x={112} y={706} line1="carnet n°01" line2="logement social — élévation sur jardin, éch. 1:200" />
      <NorthArrow x={1108} y={716} />
    </Sheet>
  );
}
