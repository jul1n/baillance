import React from "react";
import {
  S,
  S2,
  CL,
  Ah,
  Label,
  Tuft,
  Tree,
  Person,
  Child,
  Bird,
  Sheet,
  SheetFrame,
  Stamp,
} from "./common.jsx";

/**
 * TRANSFORMATION TERTIAIRE — un immeuble de bureaux dont la façade
 * rideau se métamorphose, travée après travée, en balcons habités.
 * À droite, la grue greffe un module de balcon ; en toiture, un
 * rooftop rendu aux habitants.
 */
export default function TertiaryTransformation({ id = "ter" }) {
  return (
    <Sheet id={id}>
      <SheetFrame />

      {/* ------ ciel de nuit : croissant de lune + étoiles ------ */}
      <g transform="translate(150 120)">
        <S d="M14,-22 A24,24 0 1,0 14,22 A19,19 0 1,1 14,-22 Z" w={1.2} o={0.75} />
      </g>
      {[
        [236, 88],
        [92, 196],
        [316, 152],
        [1114, 96],
        [1058, 62],
      ].map(([sx, sy], i) => (
        <S key={i} d={`M${sx - 5},${sy} H${sx + 5} M${sx},${sy - 5} V${sy + 5}`} w={0.8} o={0.55} />
      ))}
      <Bird x={960} y={100} s={0.8} />

      {/* ------ lignes de construction ------ */}
      <CL d="M100,650 H1120" />
      <CL d="M150,170 H1010" />
      <CL d="M250,120 V700 M850,120 V700" />
      <CL d="M120,250 H1040 M120,330 H1040 M120,410 H1040 M120,490 H1040 M120,570 H1040" o={0.16} />

      {/* ------ sol ------ */}
      <S2 d="M90,650 H1130" w={1.8} />
      <S d="M120,658 H360 M470,660 H730 M830,657 H1090" w={0.8} o={0.4} />

      {/* ================= LE PLATEAU : enveloppe générale ================= */}
      <S2 d="M250,170 H850 V650 H250 Z" w={1.7} />
      {/* face latérale en fuite */}
      <S2 d="M850,170 L968,214 L968,612 L850,650" w={1.3} />
      <S d="M850,250 L968,286 M850,330 L968,358 M850,410 L968,430 M850,490 L968,502 M850,570 L968,572" w={0.7} o={0.4} />
      <path d="M851,171 L967,215 L967,611 L851,649 Z" fill={`url(#${id}-hatch2)`} opacity="0.4" />

      {/* ------ ligne de mutation, tremblée et fléchée ------ */}
      <S d="M560,148 C556,220 566,300 558,380 C552,460 566,540 560,668" w={1.3} o={0.85} dash="12 8" />
      <S d="M480,120 C520,96 600,96 642,118" w={1.4} o={0.85} />
      <Ah x={642} y={118} a={32} />
      <Label x={561} y={88} size={18} anchor="middle">
        la façade se transforme
      </Label>

      {/* ================= MOITIÉ GAUCHE : façade rideau de bureaux ================= */}
      <rect x="251" y="171" width="308" height="478" fill={`url(#${id}-hatch2)`} opacity="0.28" />
      {/* meneaux verticaux stricts */}
      {Array.from({ length: 8 }).map((_, c) => (
        <S key={c} d={`M${252 + (c + 1) * 34.2},171 V649`} w={0.6} o={0.5} />
      ))}
      {/* traverses : allège + linteau à chaque niveau */}
      {[170, 250, 330, 410, 490, 570].map((fy) => (
        <g key={fy}>
          <S d={`M251,${fy + 12} H559 M251,${fy + 58} H559`} w={0.7} o={0.55} />
          <S2 d={`M251,${fy} H559`} w={1} />
        </g>
      ))}
      {/* reflets froids du vitrage */}
      <S d="M280,420 L390,240 M310,500 L430,310 M270,600 L330,510" w={0.7} o={0.3} />
      <Label x={300} y={140} size={17}>
        plateaux de bureaux vacants
      </Label>
      <S d="M405,148 C420,168 430,182 438,196 M438,196 a2,2 0 1,0 0.1,0" w={0.7} o={0.5} />

      {/* ================= MOITIÉ DROITE : logements greffés ================= */}
      {[250, 330, 410, 490, 570].map((fy, i) => (
        <g key={fy}>
          {/* dalle prolongée en balcon */}
          <S2 d={`M560,${fy} H872 M556,${fy + 8} H876`} w={1.2} />
          <S d={`M556,${fy} V${fy + 8} M876,${fy} V${fy + 8}`} w={1} o={0.8} />
          <path d={`M557,${fy + 1} H875 V${fy + 7} H557 Z`} fill={`url(#${id}-hatch)`} opacity="0.3" />
          {/* garde-corps */}
          <S d={`M562,${fy - 26} H870`} w={1} o={0.8} />
          {Array.from({ length: 24 }).map((_, k) => (
            <S key={k} d={`M${570 + k * 12.6},${fy - 26} V${fy}`} w={0.5} o={0.5} />
          ))}
          {/* végétation en débord */}
          <Tuft x={588 + (i % 3) * 22} y={fy - 26} s={1.2} />
          <Tuft x={700} y={fy - 26} s={1.05} />
          <Tuft x={806 - (i % 2) * 30} y={fy - 26} s={1.25} />
          {/* portes-fenêtres toute hauteur, éclairées (hachure chaude) */}
          {[586, 668, 750].map((wx) => (
            <g key={wx}>
              <S d={`M${wx},${fy - 68} H${wx + 58} V${fy - 26} M${wx},${fy - 26} V${fy - 68} M${wx + 29},${fy - 68} V${fy - 26}`} w={0.9} o={0.75} />
              <rect x={wx + 2} y={fy - 66} width="54" height="38" fill={`url(#${id}-hatch)`} opacity={i % 2 === 0 ? 0.5 : 0.25} />
            </g>
          ))}
        </g>
      ))}
      {/* habitants aux balcons */}
      <Person x={628} y={330} s={0.75} />
      <Person x={818} y={490} s={0.75} flip />

      {/* ------ rooftop rendu aux habitants ------ */}
      <S d="M568,170 V138 M640,170 V132 M712,170 V132 M784,170 V138" w={1.1} o={0.8} />
      <S2 d="M556,138 H796" w={1.2} />
      <S d="M580,136 L592,122 M640,132 L652,118 M700,132 L712,118 M756,134 L768,120" w={0.7} o={0.45} />
      <Tuft x={600} y={170} s={1.3} />
      <Tuft x={686} y={169} s={1.15} />
      <Tuft x={764} y={170} s={1.3} />
      <Person x={730} y={170} s={0.82} flip />
      <Label x={905} y={150} size={16}>
        rooftop partagé
      </Label>
      <S d="M902,144 C860,138 826,140 800,144 M800,144 a2,2 0 1,0 0.1,0" w={0.7} o={0.5} />

      {/* ================= LA GRUE : greffe d'un module balcon ================= */}
      {/* mât en treillis */}
      <S2 d="M1040,650 V128 M1056,650 V128" w={1.2} />
      {Array.from({ length: 17 }).map((_, k) => (
        <S
          key={k}
          d={
            k % 2 === 0
              ? `M1040,${650 - k * 30} L1056,${650 - (k + 1) * 30}`
              : `M1056,${650 - k * 30} L1040,${650 - (k + 1) * 30}`
          }
          w={0.6}
          o={0.6}
        />
      ))}
      {/* flèche + contre-flèche */}
      <S2 d="M914,150 H1132" w={1.3} />
      <S d="M914,158 H1132 M1048,128 L980,150 M1048,128 L1116,150" w={0.8} o={0.7} />
      {Array.from({ length: 9 }).map((_, k) => (
        <S key={k} d={`M${918 + k * 24},150 L${930 + k * 24},158`} w={0.5} o={0.5} />
      ))}
      {/* contrepoids */}
      <S2 d="M1108,158 H1136 V186 H1108 Z" w={1} />
      <path d="M1109,159 H1135 V185 H1109 Z" fill={`url(#${id}-cross)`} opacity="0.4" />
      {/* câble + crochet + module balcon suspendu */}
      <S d="M948,158 V240" w={0.9} o={0.8} />
      <S d="M948,240 C944,246 946,252 950,252" w={1} o={0.8} />
      <S d="M918,266 L948,252 L978,266" w={0.8} o={0.7} />
      <g>
        <S2 d="M912,266 H984 M908,274 H988" w={1.1} />
        <S d="M912,266 L912,246 M984,266 L984,246 M912,246 H984" w={0.9} o={0.75} />
        {Array.from({ length: 6 }).map((_, k) => (
          <S key={k} d={`M${920 + k * 11},246 V266`} w={0.5} o={0.55} />
        ))}
      </g>
      <Ah x={906} y={286} a={205} s={7} />
      <S d="M980,290 C960,292 936,290 910,286" w={0.7} o={0.55} dash="6 5" />
      <Label x={996} y={302} size={16}>
        balcons greffés
      </Label>

      {/* ------ vie au sol ------ */}
      <Person x={306} y={650} s={1.05} />
      <Person x={330} y={650} s={0.95} flip />
      <Person x={742} y={650} s={1.05} flip />
      <Child x={764} y={650} />
      <Tree x={152} y={650} s={1.5} />
      <Tree x={1005} y={650} s={1.15} />
      <Tuft x={218} y={650} s={1.5} />
      <Tuft x={890} y={650} s={1.3} />

      {/* ------ cotation horizontale ------ */}
      <S d="M250,692 H850 M250,686 V698 M850,686 V698 M560,686 V698" w={0.7} o={0.5} />
      <Label x={402} y={714} size={14} anchor="middle" o={0.6}>
        hier, des bureaux
      </Label>
      <Label x={706} y={714} size={14} anchor="middle" o={0.6}>
        demain, des logements traversants
      </Label>

      {/* ------ cartouche ------ */}
      <Stamp x={112} y={706} line1="carnet n°02" line2="mutation tertiaire → résidentiel, sans étalement" />
    </Sheet>
  );
}
