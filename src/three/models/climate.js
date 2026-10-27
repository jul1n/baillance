import * as THREE from "three";
import {
  Pen, bay, windowOn, tree, person, tuft, planterRow, bike, levelMark, earth,
} from "../lineKit.js";
import {
  Local, bed, sofa, armchair, table, coffeeTable, rug, kitchen, wardrobe, desk, shelves,
  shower, wc, basin, washer, plant, piano,
} from "../planKit.js";
import { cutBox, wallSection, hatchZ, solidWallAlongZ } from "../sectionKit.js";

/**
 * ADAPTATION AU CHANGEMENT CLIMATIQUE — immeuble bioclimatique R+3 de
 * trois travées, traversant nord-sud, coupé sur sa première travée. La
 * tranche (4,80 m) laisse voir chaque logement en entier ; les deux autres
 * travées se lisent en façade, si bien que la maquette se tient de tous
 * les côtés quand elle tourne.
 *  - nord : façade à ossature bois et 30 cm de fibre de bois, bardage à
 *    lames verticales, baies à persiennes coulissantes, local vélos, hall
 *    d'entrée sous auvent desservi par une rampe ;
 *  - cœur : dalles béton apparentes (inertie), pièces d'eau adossées à
 *    une cheminée de ventilation naturelle par travée, qui débouche en
 *    toiture ;
 *  - sud : jardins d'hiver à vitrage coulissant séparés par des joues,
 *    brise-soleil à lames, pergola végétale au rez-de-chaussée ;
 *  - pignon : bardage bois, treille végétale sur câbles et bac planté ;
 *  - toiture végétalisée épaisse et panneaux photovoltaïques ;
 *  - socle : terrain coupé dans le plan de coupe, noue qui file le long
 *    du bâtiment, puits canadien, cuve ;
 *  - cycles : soleil d'été (65°) arrêté, soleil d'hiver (20°) capté,
 *    ventilation nocturne traversante, tirage thermique, puits canadien,
 *    eaux pluviales vers la cuve et la noue.
 */

const XN = -6.55;
const XNI = -6.15;
const XS = 6.2;
const XJ = 8.0;
const ZB = -2.4;
const ZC = 2.4;
const zc = ZC + 0.02;
const BAY = ZC - ZB;
const ZE = ZB - 2 * BAY;
const GW = 0.4;
const ZT = ZE - 4.6;
const TX0 = -17;
const TX1 = 18.4;
const FFL = [0.6, 3.7, 6.8, 9.9];
const ROOF = 13.0;
const SL = 0.3;
const SH = { x0: -0.5, x1: 0.5, z1: -1.6, top: 15.3 };
const ceil = (f) => (f < 3 ? FFL[f + 1] : ROOF) - SL;
/* Plage libre de chaque travée le long de z (entre refends ; la première est coupée). */
const BAYS = [
  [ZB, ZC],
  [ZB - BAY, ZB - 0.25],
  [ZE + GW, ZB - BAY - 0.25],
];

/* Annotation : point visé, trait de rappel, texte dans le plan z (de coupe par défaut). */
function note(pen, [px, py], text, [lx, ly], align = "start", z = zc) {
  pen.circle("medium", [px, py, z], 0.06, { axis: "z", n: 6 });
  pen.seg("faint", [px, py, z], [lx, ly, z]);
  const dx = align === "end" ? -0.4 : 0.4;
  pen.seg("faint", [lx, ly, z], [lx + dx, ly, z]);
  pen.text("medium", text, [lx + dx * 1.15, ly - 0.15, z], [1, 0, 0], [0, 1, 0], 0.34, { align });
}

/* Bardage à lames verticales sur un plan de façade, interrompu aux baies.
   at(s, y) → point ; holes : [[s0, s1, y0, y1]]. */
function cladding(pen, at, s0, s1, y0, y1, step, holes) {
  for (let s = s0 + step / 2; s < s1; s += step) {
    const cuts = holes.filter(([a, b]) => s > a && s < b).sort((p, q) => p[2] - q[2]);
    let y = y0;
    for (const [, , ya, yb] of cuts) {
      if (ya > y) pen.seg("hair", at(s, y), at(s, ya));
      y = Math.max(y, yb);
    }
    if (y < y1) pen.seg("hair", at(s, y), at(s, y1));
  }
}

/* Conifère : cônes superposés. */
function conifer(pen, x, z, h = 7) {
  pen.seg("medium", [x, 0, z], [x, h * 0.3, z]);
  for (let i = 0; i < 3; i++) {
    const r = 1.6 - i * 0.4;
    pen.edges("faint", new THREE.ConeGeometry(r, h * 0.36, 9), { pos: [x, h * 0.3 + i * h * 0.22 + h * 0.18, z], noise: 0.08 });
  }
}

/* Angle solaire annoté au point p. */
function angleMark(pen, p, a, label) {
  const r = 1.5;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * a;
    pts.push([p[0] + Math.cos(t) * r, p[1] + Math.sin(t) * r, p[2]]);
  }
  pen.poly("faint", pts);
  pen.seg("hair", p, [p[0] + r + 0.5, p[1], p[2]]);
  pen.text("medium", label, [p[0] + r + 0.15, p[1] + Math.sin(a / 2) * r * 0.8, p[2]], [1, 0, 0], [0, 1, 0], 0.4);
}

/* Brasseur d'air sous une dalle apparente. */
function fan(pen, x, z, yc) {
  pen.seg("medium", [x, yc, z], [x, yc - 0.4, z]);
  pen.circle("medium", [x, yc - 0.4, z], 0.14, { n: 10 });
  for (const a of [0, 2.09, 4.19]) {
    pen.poly("medium", [[x, yc - 0.4, z], [x + Math.cos(a) * 0.7, yc - 0.43, z + Math.sin(a) * 0.7], [x + Math.cos(a - 0.25) * 0.65, yc - 0.43, z + Math.sin(a - 0.25) * 0.65]]);
  }
}

/* ------------------------------ un niveau ------------------------------ */
function level(pen, f) {
  const y = FFL[f];
  const H = ceil(f) - y;
  const L = new Local(pen, { x: 0, y, z: 0 });

  /* cloisons : chambre / cœur, bloc salle d'eau */
  L.wall(-2.4, ZB, -2.4, ZC, {
    t: 0.1, h: H, w: "medium", base: false, solid: true,
    openings: [{ at: 0.45, w: 0.85, kind: "door", side: -1, hinge: "a" }],
  });
  L.wall(-0.55, ZB, -0.55, -0.4, { t: 0.08, h: H, w: "medium", base: false, solid: true });
  L.wall(-2.35, -0.4, -0.55, -0.4, {
    t: 0.08, h: H, w: "medium", base: false, solid: true,
    openings: [{ at: 0.45, w: 0.7, kind: "door", side: -1, hinge: "b" }],
  });
  cutBox(pen, -2.45, -2.35, y, ceil(f), zc, "isolant", "medium");

  /* dalle apparente : plinthes et arêtes sur le refend du fond */
  pen.seg("faint", [XNI, y + 0.08, ZB + 0.01], [XS, y + 0.08, ZB + 0.01]);
  pen.seg("faint", [XNI, ceil(f), ZB + 0.01], [XS, ceil(f), ZB + 0.01]);

  /* salle d'eau ventilée par la cheminée */
  shower(L.sub(-2.35, -1.5, 3), 0.9, { h: 2.1 });
  wc(L.sub(-1.45, ZB, 0));
  basin(L.sub(-0.6, -1.4, 1), 0.7);
  for (let z = -2.1; z < -0.45; z += 0.3) L.seg("hair", [-2.35, 0.01, z], [-0.6, 0.01, z]);
  /* grille d'extraction sur la cheminée */
  pen.rect("medium", [-0.3, y + 2.25, SH.z1 + 0.01], [0.6, 0, 0], [0, 0.3, 0]);
  for (let i = 1; i < 4; i++) pen.seg("hair", [-0.3, y + 2.25 + i * 0.075, SH.z1 + 0.01], [0.3, y + 2.25 + i * 0.075, SH.z1 + 0.01]);

  if (f === 0) {
    /* RDC : local vélos, buanderie commune, salle commune sur jardin */
    for (const x of [-5.4, -4.6, -3.8, -3.0]) bike(pen, x, 0.2, { face: Math.PI / 2, y });
    L.box("faint", [-6.1, 0, ZB], [3.6, 1.8, 0.3]);
    washer(L.sub(0.6, ZB, 0));
    washer(L.sub(1.3, ZB, 0));
    shelves(L.sub(2.0, ZB, 0), 0.15, { h: 1.8, d: 0.4 });
    L.box("faint", [0.7, 0, -0.3], [1.4, 0.9, 0.7]);
    table(L.sub(2.7, -1.2, 0), 3.0, 1.0, { chairs: 3 });
    plant(L.sub(5.6, 1.9, 0), 1.3);
    L.label("hair", "VELOS", [-4.3, 0.02, 2.1], 0.3);
    L.label("hair", "SALLE COMMUNE", [4.2, 0.02, 1.6], 0.3);
    person(pen, 3.4, 0.6, { y, h: 1.7, face: 2.6 });
    person(pen, 4.9, -2.0, { y, h: 1.16, face: 1.0 });
    person(pen, -3.6, -0.6, { y, h: 1.74, face: 0.4 });
    return;
  }

  /* cuisine adossée au refend, hotte raccordée à la cheminée */
  kitchen(L.sub(0.55, ZB, 0), 1.6, { fridge: false, sink: 0.6, hob: 0.08, h: 2.1 });
  L.box("faint", [0.55, 1.5, ZB], [1.6, 0.7, 0.35]);
  L.dashed("hair", [0.85, 2.2, ZB + 0.2], [0.5, 2.5, ZB + 0.4], { dash: 0.12, gap: 0.1 });
  table(L.sub(-1.8, 0.6, 0), 1.6, 0.85, { chairs: 2 });
  fan(pen, 4.2, 0.0, ceil(f));
  fan(pen, -4.3, 0.4, ceil(f));

  /* jardin d'hiver : vitrage coulissant, plantes */
  for (let z = ZB + 0.15; z < ZC; z += 0.3) L.seg("hair", [XS + 0.15, 0.0, z], [XJ - 0.05, 0.0, z]);
  plant(L.sub(7.6, -1.9, 0), 1.3);
  plant(L.sub(7.6, -1.0, 0), 1.0);

  if (f === 1) {
    /* famille : chambre d'enfants, séjour, jardin d'hiver habité */
    bed(L.sub(-6.05, ZB, 0), 0.9, 1.9, { tables: false });
    bed(L.sub(-3.45, ZB, 0), 0.9, 1.9, { tables: false });
    desk(L.sub(-6.1, 1.4, 3), 1.2, 0.6);
    rug(L.sub(-5.0, 0.3, 0), 1.8, 1.4);
    shelves(L.sub(2.4, ZB, 0), 3.4, { h: 2.2, d: 0.35 });
    sofa(L.sub(2.5, 1.9, 3), 2.4, 0.9);
    coffeeTable(L.sub(3.8, 0.2, 0), 0.6, 1.0);
    armchair(L.sub(5.6, 0.0, 1));
    rug(L.sub(3.5, -0.6, 0), 2.2, 2.4);
    table(L.sub(6.6, 0.4, 0), 0.8, 0.7, { chairs: 1 });
    L.label("hair", "CHAMBRE", [-4.3, 0.02, 2.1], 0.28);
    L.label("hair", "SEJOUR", [4.2, 0.02, 2.15], 0.28);
    person(pen, 4.6, 1.4, { y, h: 1.7, face: 2.8 });
    person(pen, -4.5, 1.0, { y, h: 1.1, face: 0.7 });
  } else if (f === 2) {
    /* couple : chambre, séjour-bibliothèque, piano, chaise longue */
    bed(L.sub(-4.9, ZB, 0), 1.6, 2.0);
    wardrobe(L.sub(-2.5, 0.3, 1), 1.8, { h: 2.2 });
    armchair(L.sub(-6.05, 1.9, 3));
    shelves(L.sub(2.4, ZB, 0), 1.4, { h: 2.4, d: 0.35 });
    piano(L.sub(3.9, -2.3, 0));
    table(L.sub(2.7, 0.3, 0), 1.8, 0.9, { chairs: 2 });
    armchair(L.sub(5.6, 1.5, 1));
    L.poly("medium", [[6.5, 0.0, -0.2], [6.8, 0.4, 0.9], [7.5, 0.4, 1.0], [7.7, 0.85, 1.25]]);
    L.poly("medium", [[6.5, 0.0, 0.4], [6.8, 0.4, 1.5], [7.5, 0.4, 1.6], [7.7, 0.85, 1.85]]);
    L.label("hair", "CHAMBRE", [-4.3, 0.02, 2.1], 0.28);
    L.label("hair", "SEJOUR", [4.6, 0.02, 2.15], 0.28);
    person(pen, 3.2, -0.6, { y, h: 1.66, face: -0.4 });
  } else {
    /* dernier niveau : bureau, séjour, hamac au jardin d'hiver */
    desk(L.sub(-6.1, 1.5, 3), 1.4, 0.7);
    shelves(L.sub(-5.9, ZB, 0), 3.2, { h: 2.3, d: 0.35 });
    sofa(L.sub(-2.5, 1.3, 1), 2.2, 0.9);
    rug(L.sub(-5.4, -0.3, 0), 2.4, 1.8);
    sofa(L.sub(2.5, 1.9, 3), 2.4, 0.9);
    coffeeTable(L.sub(3.8, 0.2, 0), 0.6, 1.0);
    plant(L.sub(5.5, -1.6, 0), 1.5);
    L.curve("medium", [[6.4, 1.6, -1.6], [7.1, 0.7, -0.4], [7.8, 1.6, 0.8]], 14);
    L.curve("faint", [[6.4, 1.6, -1.4], [7.1, 0.75, -0.2], [7.8, 1.6, 1.0]], 14);
    L.label("hair", "BUREAU", [-4.3, 0.02, 2.1], 0.28);
    L.label("hair", "SEJOUR", [4.2, 0.02, 2.15], 0.28);
    person(pen, -4.6, 0.2, { y, h: 1.7, face: -0.9 });
    person(pen, 5.0, 0.6, { y, h: 1.62, face: 2.2 });
  }
}

export function buildClimate(ink) {
  const pen = new Pen({ wobble: 0.022 });

  /* ======================= volumes masquants ======================= */
  pen.solid([XN, -1.0, ZB], [XS - XN, 1.6, ZC - ZB], 0.03);
  for (let f = 1; f <= 4; f++) {
    const yt = f < 4 ? FFL[f] : ROOF;
    const yb = yt - SL;
    pen.solid([XNI, yb, ZB], [SH.x0 - XNI, SL + (f === 4 ? 0.65 : 0), ZC - ZB], 0.02);
    pen.solid([SH.x0, yb, SH.z1], [SH.x1 - SH.x0, SL + (f === 4 ? 0.65 : 0), ZC - SH.z1], 0.02);
    pen.solid([SH.x1, yb, ZB], [XS - SH.x1, SL + (f === 4 ? 0.65 : 0), ZC - ZB], 0.02);
    /* dalles des jardins d'hiver, filantes sur les trois travées */
    pen.solid([XS + 0.12, yb + 0.05, ZE], [XJ + 0.1 - XS - 0.12 + (f === 4 ? 0.8 : 0), SL - 0.05, ZC - ZE], 0.02);
  }
  pen.solid([XN, -1.0, ZB - 0.25], [XJ - XN, ROOF + 1.0, 0.25], 0.02);
  pen.solid([SH.x0, FFL[0], ZB], [SH.x1 - SH.x0, SH.top - FFL[0], SH.z1 - ZB], 0.02);
  for (let f = 0; f < 4; f++) {
    const y0 = f === 0 ? 0.3 : FFL[f] - SL;
    const y1 = ceil(f);
    solidWallAlongZ(pen, XN, XNI, ZB, ZC, y0, y1, f === 0 ? [[-1.6, 0.6, FFL[0], FFL[0] + 2.2]] : [[-0.6, 1.0, FFL[f] + 0.9, FFL[f] + 2.2]], 0.02);
  }
  pen.solid([XN, ceil(3), ZB], [XNI - XN, ROOF + 0.9 - ceil(3), ZC - ZB], 0.02);
  /* les deux travées pleines, leurs acrotères, les joues des jardins d'hiver, les cheminées */
  pen.solid([XN, -0.5, ZE], [XS - XN, ROOF + 1.15, ZB - 0.25 - ZE], 0.15);
  pen.solid([XN, ROOF + 0.5, ZE], [XNI - XN, 0.4, ZB - 0.25 - ZE], 0.03);
  pen.solid([XNI, ROOF + 0.5, ZE], [XS - 0.3 - XNI, 0.4, 0.3], 0.03);
  pen.solid([XS - 0.3, ROOF + 0.5, ZE], [0.3, 0.25, ZB - 0.25 - ZE], 0.03);
  for (const [za, zb] of [[ZB - BAY - 0.25, ZB - BAY], [ZE, ZE + GW]]) {
    pen.solid([XS, FFL[1] - SL, za], [XJ - XS, ROOF - FFL[1] + SL, zb - za], 0.02);
  }
  for (const k of [1, 2]) pen.solid([SH.x0, ROOF, ZB - k * BAY], [SH.x1 - SH.x0, SH.top - ROOF, SH.z1 - ZB], 0.02);
  /* socle de terrain, entaillé par la noue */
  pen.solid([TX0, -3.0, ZT], [-11.6 - TX0, 3.0, zc - ZT], 0.05);
  pen.solid([-11.6, -3.0, ZT], [1.8, 2.5, zc - ZT], 0.05);
  pen.solid([-9.8, -3.0, ZT], [TX1 + 9.8, 3.0, zc - ZT], 0.05);

  /* ======================= sol, eau, fondations ======================= */
  const ground = [[TX0, 0], [-12.5, 0], [-11.6, -0.5], [-9.8, -0.5], [-9.0, 0], [XN, 0]];
  pen.poly("strong", ground.map(([x, y]) => [x, y, zc]));
  pen.seg("strong", [10.2, 0, zc], [TX1, 0, zc]);
  earth(pen, [TX0, -3.0, zc], [10.4, 0, 0], [0, 2.5, 0], 34);
  earth(pen, [XS + 0.4, -3.0, zc], [TX1 - XS - 0.4, 0, 0], [0, 3.0, 0], 34);
  earth(pen, [XNI, -3.0, zc], [XS - XNI, 0, 0], [0, 2.7, 0], 34);
  pen.dashed("faint", [-11.5, -0.35, zc], [-9.9, -0.35, zc], { dash: 0.25, gap: 0.2 });
  for (let i = 0; i < 7; i++) pen.circle("hair", [-11.4 + i * 0.24, -0.44, zc], 0.06, { axis: "z", n: 6 });
  for (const x of [-12.0, -11.0, -9.6]) tuft(pen, x, -0.3, zc - 0.4, 1.0);
  pen.text("faint", "NOUE", [-10.7, -1.1, zc], [1, 0, 0], [0, 1, 0], 0.36, { align: "center" });

  /* le socle : arêtes, fond, et la noue qui file le long du bâtiment */
  const profile = [...ground.slice(0, -1), [TX1, 0]];
  pen.poly("medium", profile.map(([x, y]) => [x, y, ZT]));
  for (const [x, y] of profile.slice(1, -1)) pen.seg("faint", [x, y, ZT], [x, y, zc]);
  for (const x of [TX0, TX1]) {
    pen.seg("medium", [x, 0, ZT], [x, 0, zc]);
    pen.seg("faint", [x, -3.0, ZT], [x, -3.0, zc]);
    for (const z of [ZT, zc]) pen.seg("medium", [x, -3.0, z], [x, 0, z]);
  }
  for (const z of [ZT, zc]) pen.seg("faint", [TX0, -3.0, z], [TX1, -3.0, z]);
  for (let z = ZT + 0.9; z < zc - 0.6; z += 1.7) tuft(pen, -10.7 + Math.sin(z) * 0.5, -0.5, z, 0.9);

  /* puits canadien */
  pen.box("medium", [-14.8, 0, zc - 0.6], [0.6, 1.2, 0.6]);
  pen.rect("faint", [-14.75, 0.85, zc - 0.01], [0.5, 0, 0], [0, 0, 0]);
  pen.poly("medium", [[-14.65, 0, zc], [-14.65, -2.1, zc], [-6.9, -1.6, zc], [-5.8, -0.35, zc]]);
  pen.poly("medium", [[-14.35, 0, zc], [-14.35, -1.8, zc], [-6.95, -1.32, zc], [-6.05, -0.3, zc]]);
  pen.text("faint", "PUITS CANADIEN", [-10.6, -2.45, zc], [1, 0, 0], [0, 1, 0], 0.32, { align: "center" });

  /* cuve de récupération et son regard */
  for (const [xa, xb] of [[10.6, 10.8], [13.6, 13.8]]) cutBox(pen, xa, xb, -2.8, -0.6, zc, "beton");
  cutBox(pen, 10.6, 13.8, -3.0, -2.8, zc, "beton");
  cutBox(pen, 10.6, 13.8, -0.6, -0.4, zc, "beton");
  hatchZ(pen, "hair", 10.85, 13.55, -2.75, -1.4, zc, 0.35, -1);
  pen.dashed("faint", [10.85, -1.4, zc], [13.55, -1.4, zc], { dash: 0.3, gap: 0.2 });
  pen.text("faint", "CUVE EP 10 M3", [12.2, -2.2, zc], [1, 0, 0], [0, 1, 0], 0.3, { align: "center" });
  pen.rect("medium", [11.8, 0.01, 0.6], [0.8, 0, 0], [0, 0, 0.8]);
  pen.rect("hair", [11.9, 0.012, 0.7], [0.6, 0, 0], [0, 0, 0.6]);

  /* fondations, dallage sur hérisson isolé */
  for (const [xa, xb] of [[-6.85, -5.75], [5.65, 6.75], [7.5, 8.4]]) cutBox(pen, xa, xb, -1.0, -0.6, zc, "beton");
  cutBox(pen, XN, XNI, -0.6, 0.3, zc, "beton");
  cutBox(pen, 5.9, 6.3, -0.6, 0.3, zc, "beton");
  for (let x = XNI + 0.2; x < 5.8; x += 0.3) pen.circle("hair", [x, -0.12, zc], 0.08, { axis: "z", n: 6 });
  cutBox(pen, XNI, 5.9, 0.05, 0.3, zc, "isolant", "faint");
  cutBox(pen, XNI, 5.9, 0.3, 0.52, zc, "beton");
  pen.seg("medium", [XNI, FFL[0], zc], [XS, FFL[0], zc]);

  /* ========================= coupe du bâti ========================= */
  /* façade nord continue : ossature bois, fibre de bois, bardage */
  wallSection(pen, XNI, -1, 0.3, ROOF + 0.9, zc, [
    { t: 0.03, kind: "vide", w: "faint" },
    { t: 0.24, kind: "isolant" },
    { t: 0.06, kind: "isolant", w: "faint" },
    { t: 0.04, kind: "vide", w: "hair" },
    { t: 0.03, kind: "bois", w: "medium" },
  ]);
  for (let f = 0; f < 4; f++) {
    const y0 = f === 0 ? 0.6 : FFL[f];
    for (let yy = y0 + 0.6; yy < ceil(f); yy += 0.6) cutBox(pen, XNI - 0.18, XNI - 0.06, yy, yy + 0.05, zc, "vide", "hair");
  }
  pen.poly("medium", [[XN - 0.08, ROOF + 0.82, zc], [XN - 0.08, ROOF + 0.95, zc], [XNI + 0.05, ROOF + 0.95, zc]]);
  /* dalles apparentes et dalles de jardin d'hiver sur rupteurs */
  for (let f = 1; f <= 3; f++) {
    const yt = FFL[f];
    cutBox(pen, XNI, XS, yt - SL, yt - 0.07, zc, "beton");
    pen.seg("medium", [XNI, yt, zc], [XS, yt, zc]);
    pen.seg("hair", [XNI, yt - 0.02, zc], [XS, yt - 0.02, zc]);
    cutBox(pen, XS, XS + 0.12, yt - SL, yt - 0.07, zc, "isolant", "faint");
    cutBox(pen, XS + 0.12, XJ + 0.1, yt - SL + 0.05, yt - 0.03, zc, "beton");
  }
  /* toiture : dalle, isolant, étanchéité, substrat, casquette */
  cutBox(pen, XNI, XS, ROOF - SL, ROOF, zc, "beton");
  cutBox(pen, XS, XS + 0.12, ROOF - SL, ROOF - 0.07, zc, "isolant", "faint");
  cutBox(pen, XS + 0.12, 8.9, ROOF - SL + 0.05, ROOF - 0.05, zc, "beton");
  cutBox(pen, XNI, XS - 0.3, ROOF, ROOF + 0.3, zc, "isolant", "medium");
  pen.seg("medium", [XNI, ROOF + 0.315, zc], [XS - 0.3, ROOF + 0.315, zc]);
  cutBox(pen, XNI + 0.1, XS - 0.4, ROOF + 0.33, ROOF + 0.65, zc, "terre", "faint");
  cutBox(pen, XS - 0.3, XS, ROOF - 0.05, ROOF + 0.75, zc, "beton");

  /* la toiture vue, sur les trois travées : substrat planté, acrotères, couvertines */
  pen.rect("medium", [XNI, ROOF + 0.65, ZE + 0.3], [XS - 0.4 - XNI, 0, 0], [0, 0, ZC - ZE - 0.3]);
  for (const [x, y] of [[XN, ROOF + 0.9], [XNI, ROOF + 0.9], [XS - 0.3, ROOF + 0.75], [XS, ROOF + 0.75]]) {
    pen.seg(x === XN || x === XS ? "strong" : "medium", [x, y, ZE], [x, y, ZC]);
  }
  pen.seg("medium", [XN - 0.08, ROOF + 0.95, ZE - 0.08], [XN - 0.08, ROOF + 0.95, zc]);
  pen.poly("medium", [[XNI, ROOF + 0.9, ZE + 0.3], [XS - 0.3, ROOF + 0.9, ZE + 0.3], [XS - 0.3, ROOF + 0.75, ZE + 0.3]]);
  pen.seg("faint", [XS - 0.3, ROOF + 0.9, ZE], [XS - 0.3, ROOF + 0.9, ZE + 0.3]);
  for (let i = 0; i < 12; i++) {
    const x = -5.8 + i * 1.0;
    if (x > -0.9 && x < 0.9) continue;
    tuft(pen, x, ROOF + 0.65, zc - 0.25, 1.0);
    tuft(pen, x + 0.45, ROOF + 0.65, -1.2 + (i % 3) * 1.1, 0.9);
  }
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 8; j++) {
      const z = ZE + 0.9 + j * 1.15;
      if (z > ZB - 0.5) continue;
      tuft(pen, -5.7 + i * 1.05 + ((j * 7) % 3) * 0.15, ROOF + 0.65, z, 0.8 + ((i + j) % 3) * 0.12);
    }
  }
  /* photovoltaïque sur châssis, incliné plein sud, filant sur les trois travées */
  const pz0 = ZE + 0.7;
  for (const x0 of [1.2, 3.4]) {
    const P = [[x0, ROOF + 0.65], [x0 + 1.7, ROOF + 0.65], [x0, ROOF + 1.65]];
    for (const z of [zc - 0.1, pz0]) pen.poly("medium", [...P, P[0]].map(([x, yy]) => [x, yy, z]));
    pen.seg("medium", [x0, ROOF + 1.65, pz0], [x0, ROOF + 1.65, zc - 0.1]);
    pen.seg("medium", [x0 + 1.7, ROOF + 0.65, pz0], [x0 + 1.7, ROOF + 0.65, zc - 0.1]);
    pen.seg("faint", [x0, ROOF + 0.65, pz0], [x0, ROOF + 0.65, zc - 0.1]);
    for (let z = pz0 + 0.95; z < zc - 0.2; z += 0.95) pen.seg("hair", [x0, ROOF + 1.65, z], [x0 + 1.7, ROOF + 0.65, z]);
    pen.solidPrism(P, { axis: "z", from: pz0 + 0.03, to: zc - 0.13 });
  }

  /* cheminées de ventilation, une par travée : gaine, ventelles, chapeau */
  for (let k = 0; k < 3; k++) {
    const dz = -k * BAY;
    const za = ZB + dz;
    const zb = SH.z1 + dz;
    pen.box("medium", [SH.x0, k === 0 ? FFL[0] : ROOF + 0.65, za], [SH.x1 - SH.x0, SH.top - (k === 0 ? FFL[0] : ROOF + 0.65), zb - za]);
    for (let yy = ROOF + 1.1; yy < SH.top - 0.4; yy += 0.18) {
      for (const x of [SH.x0 - 0.01, SH.x1 + 0.01]) pen.seg("faint", [x, yy, za + 0.05], [x, yy, zb - 0.05]);
    }
    pen.box("strong", [SH.x0 - 0.25, SH.top, za - 0.2], [SH.x1 - SH.x0 + 0.5, 0.15, zb - za + 0.4]);
    const apex = [0, SH.top + 0.55, (za + zb) / 2];
    for (const x of [SH.x0 - 0.25, SH.x1 + 0.25]) for (const z of [za - 0.2, zb + 0.2]) pen.seg("medium", [x, SH.top + 0.15, z], apex);
  }

  /* façade sud : vitrages intérieurs, jardins d'hiver, brise-soleil */
  for (let f = 0; f < 4; f++) {
    const y0 = FFL[f];
    const y1 = ceil(f);
    cutBox(pen, XS - 0.14, XS, y0, y0 + 0.07, zc, "vide", "medium");
    cutBox(pen, XS - 0.14, XS, y1 - 0.12, y1, zc, "vide", "medium");
    for (const x of [XS - 0.09, XS - 0.05]) pen.seg("medium", [x, y0 + 0.07, zc], [x, y1 - 0.12, zc]);
    for (const [za, zb] of BAYS) {
      windowOn(pen, [XS - 0.07, y0 + 0.02, za + 0.1], [0, 0, zb - za - 0.1], [0, y1 - y0 - 0.14, 0], { mullion: true, transom: false, inset: 0.04 });
    }
    if (f === 0) continue;
    /* vitrage extérieur coulissant (simple vitrage), plus ou moins ouvert selon les logements */
    cutBox(pen, XJ - 0.06, XJ + 0.04, y0, y1, zc, "bois", "medium");
    BAYS.forEach(([za, zb], k) => {
      const pw = (zb - za) / 2 + 0.1;
      const open = k === 0 ? 0.75 : [0, 0.9, 1.6][(k + f) % 3];
      windowOn(pen, [XJ - 0.01, y0 + 0.05, za + 0.1], [0, 0, pw], [0, y1 - y0 - 0.15, 0], { mullion: false, transom: false, inset: 0.03 });
      windowOn(pen, [XJ + 0.05, y0 + 0.05, zb - pw - open], [0, 0, pw], [0, y1 - y0 - 0.15, 0], { mullion: false, transom: false, inset: 0.03 });
    });
    pen.seg("medium", [XJ - 0.06, y0 + 1.0, ZE + GW], [XJ - 0.06, y0 + 1.0, ZC]);
    /* lames fixes en partie haute + store enroulé, filants jusqu'au pignon */
    for (let i = 0; i < 4; i++) {
      const yy = y1 - 0.15 - i * 0.18;
      const lame = [[XJ + 0.15, yy], [XJ + 0.8, yy + 0.12], [XJ + 0.78, yy + 0.16], [XJ + 0.15, yy]];
      for (const z of [zc, ZE]) pen.poly("medium", lame.map(([x, y]) => [x, y, z]));
      pen.seg("faint", [XJ + 0.15, yy, ZE], [XJ + 0.15, yy, ZC]);
      pen.seg("hair", [XJ + 0.8, yy + 0.12, ZE], [XJ + 0.8, yy + 0.12, ZC]);
    }
    for (const z of [zc, ZE]) pen.circle("medium", [XJ + 0.25, y1 - 0.9, z], 0.08, { axis: "z", n: 8 });
    pen.seg("faint", [XJ + 0.25, y1 - 0.9, ZE], [XJ + 0.25, y1 - 0.9, ZC]);
    /* joues entre jardins d'hiver, et celle du pignon */
    for (const [za, zb] of [[ZB - 0.25, ZB], [ZB - BAY - 0.25, ZB - BAY], [ZE, ZE + GW]]) {
      pen.box("faint", [XS + 0.12, y0, za], [XJ - XS - 0.12, y1 - y0, zb - za]);
    }
    cladding(pen, (s, y) => [s, y, ZE - 0.012], XS + 0.12, XJ, y0, y1, 0.22, []);
    /* jardins d'hiver des travées pleines : platelage, plantes */
    BAYS.slice(1).forEach(([za, zb], i) => {
      const k = i + 1;
      for (let z = za + 0.15; z < zb; z += 0.3) pen.seg("hair", [XS + 0.15, y0 + 0.005, z], [XJ - 0.05, y0 + 0.005, z]);
      const L = new Local(pen, { x: 0, y: y0, z: 0 });
      plant(L.sub(7.5, za + 0.5 + ((k * 3 + f) % 4) * 0.7, 0), 1.1 + 0.15 * (f % 2));
      if ((k + f) % 2) plant(L.sub(7.4, zb - 0.6, 0), 0.9);
      else armchair(L.sub(6.7, zb - 1.6, 1));
    });
  }
  /* rives des dalles de jardin d'hiver et de la casquette, filantes, et leurs abouts au pignon */
  for (let f = 1; f <= 4; f++) {
    const yt = f < 4 ? FFL[f] : ROOF;
    const xe = f < 4 ? XJ + 0.1 : 8.9;
    const yb = yt - SL + 0.05;
    const ya = f < 4 ? yt - 0.03 : yt - 0.05;
    for (const y of [yb, ya]) pen.seg("medium", [xe, y, ZE], [xe, y, ZC]);
    pen.rect("medium", [XS + 0.12, yb, ZE - 0.005], [xe - XS - 0.12, 0, 0], [0, ya - yb, 0]);
  }

  /* façade nord vue : bardage, baies à persiennes, local vélos, hall d'entrée */
  const NF = { o: [XN, 0, 0], u: [0, 0, 1], n: [-1, 0, 0] };
  const nHoles = [];
  for (let k = 0; k < 3; k++) {
    const dz = -k * BAY;
    const depth = k === 0 ? 0.4 : 0.1;
    for (let f = 0; f < 4; f++) {
      if (f === 0 && k === 0) {
        bay(pen, NF, -1.6, FFL[0], 2.2, 2.2, { kind: "door", coffre: false, depth });
        nHoles.push([-1.6, 0.6, FFL[0], FFL[0] + 2.2]);
        continue;
      }
      if (f === 0 && k === 1) {
        bay(pen, NF, -5.4, FFL[0], 1.8, 2.5, { kind: "door", coffre: false, depth });
        nHoles.push([-5.4, -3.6, FFL[0], FFL[0] + 2.5]);
        continue;
      }
      const s = -0.6 + dz;
      bay(pen, NF, s, FFL[f] + 0.9, 1.6, 1.3, { coffre: false, depth });
      nHoles.push([s, s + 1.6, FFL[f] + 0.86, FFL[f] + 2.2]);
      if (f === 0) continue;
      /* persienne coulissante, rangée contre la baie */
      const p0 = -2.3 + dz;
      pen.rect("faint", [XN - 0.1, FFL[f] + 0.8, p0], [0, 0, 1.6], [0, 1.5, 0]);
      for (let i = 1; i < 10; i++) pen.seg("hair", [XN - 0.1, FFL[f] + 0.8 + i * 0.15, p0], [XN - 0.1, FFL[f] + 0.8 + i * 0.15, p0 + 1.6]);
      nHoles.push([p0, p0 + 1.6, FFL[f] + 0.8, FFL[f] + 2.3]);
    }
  }
  cladding(pen, (s, y) => [XN - 0.012, y, s], ZE, ZC, FFL[0], ROOF + 0.9, 0.16, nHoles);
  pen.seg("medium", [XN - 0.012, FFL[0], ZE], [XN - 0.012, FFL[0], ZC]);
  for (let f = 1; f < 4; f++) pen.seg("faint", [XN - 0.03, FFL[f] - 0.12, ZE], [XN - 0.03, FFL[f] - 0.12, ZC]);

  /* perron surélevé (rez-de-chaussée hors d'eau), rampe, auvent du hall */
  const PX = XN - 1.8;
  pen.box("medium", [PX, 0, -7.0], [XN - PX, FFL[0], 7.8]);
  pen.solid([PX, 0, -7.0], [XN - PX, FFL[0], 7.8], 0.03);
  for (let z = -6.7; z < 0.8; z += 0.3) pen.seg("hair", [PX, FFL[0] + 0.005, z], [XN, FFL[0] + 0.005, z]);
  const RZ = -14.2;
  for (const x of [PX + 0.2, XN - 0.2]) pen.seg("medium", [x, FFL[0], -7.0], [x, 0, RZ]);
  pen.seg("faint", [PX + 0.2, 0, -7.0], [PX + 0.2, 0, RZ]);
  for (let z = -7.6; z > RZ; z -= 0.6) {
    const y = FFL[0] * (z - RZ) / (-7.0 - RZ);
    pen.seg("hair", [PX + 0.2, y, z], [XN - 0.2, y, z]);
  }
  pen.solidPrism([[-7.0, 0], [-7.0, FFL[0]], [RZ, 0]], { axis: "x", from: PX + 0.2, to: XN - 0.2 });
  pen.seg("medium", [PX, FFL[0] + 1.0, 0.8], [PX, FFL[0] + 1.0, -7.0]);
  pen.seg("medium", [PX + 0.2, FFL[0] + 1.0, -7.0], [PX + 0.2, 0.9, RZ]);
  for (let z = 0.6; z > -7.0; z -= 1.2) pen.seg("faint", [PX, FFL[0], z], [PX, FFL[0] + 1.0, z]);
  for (let z = -7.6; z > RZ; z -= 1.2) {
    const y = FFL[0] * (z - RZ) / (-7.0 - RZ);
    pen.seg("faint", [PX + 0.2, y, z], [PX + 0.2, y + 0.95, z]);
  }
  pen.box("medium", [PX, FFL[0] + 2.75, -6.0], [XN - PX, 0.15, 3.0]);
  pen.solid([PX, FFL[0] + 2.75, -6.0], [XN - PX, 0.15, 3.0], 0.02);
  for (const z of [-5.9, -3.1]) pen.seg("faint", [PX + 0.1, FFL[0] + 2.9, z], [XN, FFL[0] + 4.0, z]);

  /* pignon : bardage, baies, treille végétale sur câbles, bac planté */
  const GF = { o: [0, 0, ZE], u: [1, 0, 0], n: [0, 0, -1] };
  const gHoles = [[-2.2, 1.8, 0, ROOF]];
  for (let f = 0; f < 4; f++) {
    const y = FFL[f];
    if (f === 0) {
      bay(pen, GF, -5.5, y, 1.2, 2.2, { kind: "door", coffre: false, depth: 0.1 });
      bay(pen, GF, 2.6, y, 2.6, 2.3, { kind: "french", coffre: false, depth: 0.1 });
      gHoles.push([-5.5, -4.3, y, y + 2.2], [2.6, 5.2, y, y + 2.3]);
      continue;
    }
    bay(pen, GF, -5.2, y + 0.9, 1.2, 1.3, { coffre: false, depth: 0.1 });
    bay(pen, GF, 2.9, y, 1.8, 2.3, { kind: "french", rail: 6, coffre: false, depth: 0.1 });
    gHoles.push([-5.2, -4.0, y + 0.86, y + 2.2], [2.9, 4.7, y, y + 2.3]);
  }
  cladding(pen, (s, y) => [s, y, ZE - 0.012], XN, XS, FFL[0], ROOF + 0.9, 0.2, gHoles);
  pen.poly("strong", [[XN, 0, ZE], [XN, ROOF + 0.9, ZE], [XS - 0.3, ROOF + 0.9, ZE], [XS - 0.3, ROOF + 0.75, ZE], [XS, ROOF + 0.75, ZE], [XS, 0, ZE]]);
  pen.seg("medium", [XN, FFL[0], ZE - 0.012], [XS, FFL[0], ZE - 0.012]);
  for (let f = 1; f < 4; f++) pen.seg("faint", [XN, FFL[f] - 0.12, ZE - 0.03], [XS, FFL[f] - 0.12, ZE - 0.03]);
  pen.box("medium", [-5.8, 0, ZE - 0.9], [1.8, FFL[0], 0.9]);
  pen.solid([-5.8, 0, ZE - 0.9], [1.8, FFL[0], 0.9], 0.03);
  pen.box("medium", [-2.2, 0, ZE - 0.75], [4.0, 0.6, 0.65]);
  pen.solid([-2.2, 0, ZE - 0.75], [4.0, 0.6, 0.65], 0.03);
  for (let x = -1.9; x < 1.7; x += 0.35) pen.seg("hair", [x, 0.6, ZE - 0.2], [x, FFL[3] + 0.4, ZE - 0.2]);
  for (const y of [FFL[1] - 0.12, FFL[2] - 0.12, FFL[3] - 0.12, FFL[3] + 0.4]) pen.seg("faint", [-2.0, y, ZE - 0.2], [1.6, y, ZE - 0.2]);
  for (let i = 0; i < 6; i++) {
    const top = FFL[1] + 1.2 + ((i * 7) % 5) * 1.25;
    const pts = [];
    for (let y = 0.6, j = 0; y < top; y += 0.7, j++) {
      pts.push([-1.75 + i * 0.62 + Math.sin(j * 1.7 + i) * 0.22, y, ZE - 0.24 - 0.06 * Math.cos(j + i)]);
    }
    pen.curve("faint", pts, pts.length * 4);
    pts.forEach((p, j) => {
      if (j % 2) tuft(pen, p[0], p[1], p[2], 0.55);
    });
    tuft(pen, -1.75 + i * 0.62, 0.6, ZE - 0.45, 0.8);
  }
  for (const k of [1, 2]) {
    const z = ZB - (k - 1) * BAY - 0.12;
    pen.seg("medium", [8.85, ROOF - 0.05, z], [8.85, 0.0, z]);
  }

  /* ========================= les quatre niveaux ========================= */
  for (let f = 0; f < 4; f++) level(pen, f);

  /* RDC sud : terrasse sous pergola végétale, sur toute la longueur */
  pen.rect("medium", [XS + 0.1, 0.45, ZE], [3.9, 0, 0], [0, 0, ZC - ZE]);
  pen.solid([XS + 0.1, 0, ZE], [3.9, 0.45, ZC - ZE], 0.03);
  for (let z = ZE + 0.15; z < ZC; z += 0.3) pen.seg("hair", [XS + 0.1, 0.46, z], [10.0, 0.46, z]);
  cutBox(pen, XS + 0.1, 10.0, 0.35, 0.45, zc, "bois", "medium");
  pen.rect("faint", [XS + 0.1, 0.35, ZE - 0.005], [3.9, 0, 0], [0, 0.1, 0]);
  for (const z of [ZC - 0.2, ZB - 0.12, ZB - BAY - 0.12, ZE + 0.2]) {
    pen.seg("medium", [9.8, 0.45, z], [9.8, 3.1, z]);
    pen.seg("strong", [XS, 3.1, z], [10.3, 3.1, z]);
  }
  pen.seg("medium", [9.8, 3.05, ZE + 0.2], [9.8, 3.05, ZC - 0.2]);
  for (let x = 6.6; x < 10.2; x += 0.45) pen.seg("faint", [x, 3.15, ZE], [x, 3.15, ZC]);
  for (let i = 0; i < 11; i++) {
    const z = ZE + 0.6 + i * 1.3;
    pen.curve("faint", [[9.8, 0.5, z], [9.7, 1.8, z + 0.2], [9.9, 2.8, z - 0.1], [9.0, 3.2, z + 0.3], [7.4, 3.15, z]], 18);
  }
  {
    const tr = new Local(pen, { x: 0, y: 0.45, z: 0 });
    table(tr.sub(7.2, -0.9, 1), 1.6, 0.8, { chairs: 2 });
    table(tr.sub(7.2, -6.4, 1), 1.6, 0.8, { chairs: 2 });
    armchair(tr.sub(8.6, -10.6, 1));
    person(pen, 8.4, -5.4, { y: 0.45, h: 1.7, face: 2.0 });
  }

  /* ========================= soleil, air, eau ========================= */
  const C = [1, 0.6, 0];
  const RS = 18;
  pen.circle("hair", C, RS, { axis: "z", n: 52, a0: Math.PI * 0.04, a1: Math.PI * 0.96 });
  const aS = (65 * Math.PI) / 180;
  const sunS = [C[0] + Math.cos(aS) * RS, C[1] + Math.sin(aS) * RS, 0];
  pen.circle("strong", sunS, 1.0, { axis: "z", n: 22 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pen.seg("faint", [sunS[0] + Math.cos(a) * 1.25, sunS[1] + Math.sin(a) * 1.25, 0], [sunS[0] + Math.cos(a) * 1.65, sunS[1] + Math.sin(a) * 1.65, 0]);
  }
  /* été : arrêté par les lames et la dalle du jardin d'hiver supérieur */
  const tS = Math.tan(aS);
  const e1 = [XJ + 0.8, ceil(2) - 0.15, zc];
  const h1 = [e1[0] - (e1[1] - FFL[2]) / tS, FFL[2], zc];
  pen.dashedCurve([[e1[0] + 5 / tS, e1[1] + 5, zc], e1, h1], { dash: 0.5, gap: 0.4, opacity: 0.6 });
  angleMark(pen, h1, aS, "65°");
  /* hiver : traverse le jardin d'hiver jusqu'au cœur du logement */
  const aW = (20 * Math.PI) / 180;
  const sunW = [C[0] + Math.cos(aW) * RS, C[1] + Math.sin(aW) * RS, 0];
  pen.circle("medium", sunW, 0.8, { axis: "z", n: 16 });
  const tW = Math.tan(aW);
  const e2 = [XJ + 0.1, ceil(1) - 0.6, zc];
  const h2 = [e2[0] - (e2[1] - FFL[1]) / tW, FFL[1], zc];
  pen.dashedCurve([[e2[0] + 7, e2[1] + 7 * tW, zc], e2, h2], { dash: 0.8, gap: 0.6, opacity: 0.7 });
  angleMark(pen, h2, aW, "20°");
  pen.hatch("hair", [h2[0] + 0.1, FFL[1] + 0.012, ZB + 0.4], [XS - h2[0] - 0.2, 0, 0], [0, 0, ZC - ZB - 0.6], 14);

  /* air : nuit d'été traversante, tirage thermique, air préchauffé l'hiver */
  for (const f of [1, 2, 3]) {
    pen.dashedCurve([[XN - 1.6, FFL[f] + 1.2, 0.6], [-4.5, FFL[f] + 1.3, 0.5], [0, FFL[f] + 1.5, 0.3], [4.0, FFL[f] + 1.6, 0.2], [XJ + 1.6, FFL[f] + 1.8, 0.2]], { dash: 0.45, gap: 0.4, opacity: 0.45 });
  }
  pen.dashedCurve([[-1.6, FFL[1] + 1.8, -1.0], [0, FFL[1] + 2.4, -1.8], [0, ROOF + 0.5, -2.0], [0, SH.top + 0.9, -2.0], [1.4, SH.top + 1.6, -2.0]], { dash: 0.5, gap: 0.4, opacity: 0.8 });
  pen.poly("strong", [[1.15, SH.top + 1.3, -2.0], [1.55, SH.top + 1.65, -2.0], [1.0, SH.top + 1.85, -2.0]]);
  pen.dashedCurve([[XJ - 0.3, FFL[2] + 0.6, 1.4], [XJ - 0.6, FFL[2] + 2.2, 1.2], [XS - 0.6, FFL[2] + 2.3, 1.0], [3.5, FFL[2] + 1.2, 0.8]], { dash: 0.4, gap: 0.3, opacity: 0.55 });
  pen.dashedCurve([[-14.5, -1.9, zc], [-7.0, -1.5, zc], [-5.6, FFL[0] + 0.3, 1.0], [-2.5, FFL[0] + 0.9, 0.6]], { dash: 0.55, gap: 0.4, opacity: 0.7 });

  /* eau : toiture → descente → cuve → arrosage */
  pen.poly("medium", [[8.85, ROOF - 0.05, zc - 0.02], [8.85, 0.2, zc - 0.02], [9.4, -0.8, zc - 0.02], [11.0, -0.8, zc - 0.02]]);
  pen.dashedCurve([[3.0, ROOF + 1.0, 1.5], [6.0, ROOF + 0.8, 1.6], [8.7, ROOF + 0.2, 1.8]], { dash: 0.3, gap: 0.25, opacity: 0.5 });
  pen.dashedCurve([[12.5, -0.4, zc], [13.4, 0.6, zc], [14.6, 0.2, zc]], { dash: 0.25, gap: 0.2, opacity: 0.5 });

  /* ========================= annotations ========================= */
  note(pen, [-3.0, ROOF + 0.5], "TOITURE VEGETALISEE", [-7.4, ROOF + 2.4], "end");
  note(pen, [0, SH.top + 0.3], "CHEMINEE DE VENTILATION", [-1.2, SH.top + 1.6], "end");
  note(pen, [4.2, ROOF + 1.2], "PHOTOVOLTAIQUE", [6.4, ROOF + 2.6]);
  note(pen, [7.1, FFL[3] + 1.6], "JARDIN D'HIVER", [9.3, FFL[3] + 2.0]);
  note(pen, [XJ + 0.5, ceil(2) - 0.3], "BRISE-SOLEIL", [9.3, ceil(2) + 0.6]);
  note(pen, [9.6, 3.0], "PERGOLA VEGETALE", [10.6, 4.4]);
  note(pen, [-4.0, FFL[2] - 0.18], "DALLE APPARENTE : INERTIE", [-7.4, 8.4], "end");
  note(pen, [XNI - 0.15, FFL[2] + 1.6], "FIBRE DE BOIS 30 CM", [-7.4, 11.4], "end");
  for (const [f, lab] of [[0, "+0.00"], [1, "+3.10"], [2, "+6.20"], [3, "+9.30"]]) levelMark(pen, [XN - 0.35, FFL[f], zc], lab, { dir: -1, len: 1.8 });
  levelMark(pen, [XN - 0.35, ROOF, zc], "+12.40", { dir: -1, len: 1.8 });
  /* au pignon, inscrit sur l'élévation : masqué tant qu'on regarde la coupe */
  pen.text("medium", "BARDAGE MELEZE", [-0.2, ROOF - 0.62, ZE - 0.03], [1, 0, 0], [0, 1, 0], 0.26, { align: "center" });
  pen.text("medium", "TREILLE VEGETALE", [-0.2, FFL[3] + 0.75, ZE - 0.03], [1, 0, 0], [0, 1, 0], 0.26, { align: "center" });
  /* ========================= végétation ========================= */
  tree(pen, 16.6, -3.6, { h: 9.0, r: 2.6, lean: -0.1 });
  tree(pen, 14.2, -12.4, { h: 8.0, r: 2.3, lean: 0.15 });
  pen.hatch("hair", [12.2, 0.01, -6.4], [5.6, 0, 0], [0, 0, 4.4], 9);
  conifer(pen, -15.4, -2.0, 7.2);
  conifer(pen, -13.2, -3.6, 6.2);
  conifer(pen, -14.6, -11.4, 6.8);
  for (const [x, z, s] of [[11.4, 1.8, 1.2], [16.2, 0.8, 1.3], [-8.2, 1.6, 1.1], [-13.6, 1.4, 1.0], [11.0, -14.8, 1.1], [-3.0, -15.2, 1.0], [5.0, -14.4, 1.2]]) tuft(pen, x, 0, z, s);
  planterRow(pen, [10.6, 0, 0.2], [13.4, 0, 0.2], 6, 0.9);
  person(pen, 12.0, 1.4, { h: 1.72, face: 2.6 });
  person(pen, -9.4, -11.6, { h: 1.68, face: 0.2 });
  bike(pen, -8.6, -1.0, { face: 0.3 });
  /* banc au pied du pignon */
  pen.box("medium", [1.0, 0, ZE - 2.6], [2.0, 0.45, 0.5]);
  pen.rect("faint", [1.0, 0.45, ZE - 2.15], [2.0, 0, 0], [0, 0.45, 0]);

  return pen.build(ink);
}
