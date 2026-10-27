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
 * ADAPTATION AU CHANGEMENT CLIMATIQUE — coupe sur une travée d'un
 * immeuble bioclimatique R+3, traversant nord-sud. La tranche (4,80 m)
 * laisse voir chaque logement en entier ; le reste du bâtiment est
 * rappelé en tirets derrière.
 *  - nord : façade à ossature bois et 30 cm de fibre de bois, petites
 *    baies à persiennes, local vélos au rez-de-chaussée ;
 *  - cœur : dalles béton apparentes (inertie), pièces d'eau adossées à
 *    une cheminée de ventilation naturelle qui débouche en toiture ;
 *  - sud : jardins d'hiver à vitrage coulissant, brise-soleil à lames,
 *    pergola végétale au rez-de-chaussée, arbre caduc ;
 *  - toiture végétalisée épaisse et panneaux photovoltaïques ;
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
const FFL = [0.6, 3.7, 6.8, 9.9];
const ROOF = 13.0;
const SL = 0.3;
const SH = { x0: -0.5, x1: 0.5, z1: -1.6, top: 15.3 };
const ceil = (f) => (f < 3 ? FFL[f + 1] : ROOF) - SL;

/* Annotation : point visé, trait de rappel, texte dans le plan de coupe. */
function note(pen, [px, py], text, [lx, ly], align = "start") {
  pen.circle("medium", [px, py, zc], 0.06, { axis: "z", n: 6 });
  pen.seg("faint", [px, py, zc], [lx, ly, zc]);
  const dx = align === "end" ? -0.4 : 0.4;
  pen.seg("faint", [lx, ly, zc], [lx + dx, ly, zc]);
  pen.text("medium", text, [lx + dx * 1.15, ly - 0.15, zc], [1, 0, 0], [0, 1, 0], 0.34, { align });
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
    pen.solid([XS + 0.12, yb + 0.05, ZB], [XJ + 0.1 - XS - 0.12 + (f === 4 ? 0.8 : 0), SL - 0.05, ZC - ZB], 0.02);
  }
  pen.solid([XN, -1.0, ZB - 0.25], [XJ - XN, ROOF + 1.0, 0.25], 0.02);
  pen.solid([SH.x0, FFL[0], ZB], [SH.x1 - SH.x0, SH.top - FFL[0], SH.z1 - ZB], 0.02);
  for (let f = 0; f < 4; f++) {
    const y0 = f === 0 ? 0.3 : FFL[f] - SL;
    const y1 = ceil(f);
    solidWallAlongZ(pen, XN, XNI, ZB, ZC, y0, y1, f === 0 ? [[-1.6, 0.6, FFL[0], FFL[0] + 2.2]] : [[-0.6, 1.0, FFL[f] + 0.9, FFL[f] + 2.2]], 0.02);
  }
  pen.solid([XN, ceil(3), ZB], [XNI - XN, ROOF + 0.9 - ceil(3), ZC - ZB], 0.02);

  /* ======================= sol, eau, fondations ======================= */
  const ground = [[-17, 0], [-12.5, 0], [-11.6, -0.5], [-9.8, -0.5], [-9.0, 0], [XN, 0]];
  pen.poly("strong", ground.map(([x, y]) => [x, y, zc]));
  pen.seg("strong", [10.2, 0, zc], [18, 0, zc]);
  earth(pen, [-17, -3.0, zc], [10.4, 0, 0], [0, 2.5, 0], 34);
  earth(pen, [XS + 0.4, -3.0, zc], [11.8, 0, 0], [0, 3.0, 0], 34);
  earth(pen, [XNI, -3.0, zc], [XS - XNI, 0, 0], [0, 2.7, 0], 34);
  pen.dashed("faint", [-11.5, -0.35, zc], [-9.9, -0.35, zc], { dash: 0.25, gap: 0.2 });
  for (let i = 0; i < 7; i++) pen.circle("hair", [-11.4 + i * 0.24, -0.44, zc], 0.06, { axis: "z", n: 6 });
  for (const x of [-12.0, -11.0, -9.6]) tuft(pen, x, -0.3, zc - 0.4, 1.0);
  pen.text("faint", "NOUE", [-10.7, -1.1, zc], [1, 0, 0], [0, 1, 0], 0.36, { align: "center" });

  /* puits canadien */
  pen.box("medium", [-14.8, 0, zc - 0.6], [0.6, 1.2, 0.6]);
  pen.rect("faint", [-14.75, 0.85, zc - 0.01], [0.5, 0, 0], [0, 0, 0]);
  pen.poly("medium", [[-14.65, 0, zc], [-14.65, -2.1, zc], [-6.9, -1.6, zc], [-5.8, -0.35, zc]]);
  pen.poly("medium", [[-14.35, 0, zc], [-14.35, -1.8, zc], [-6.95, -1.32, zc], [-6.05, -0.3, zc]]);
  pen.text("faint", "PUITS CANADIEN", [-10.6, -2.45, zc], [1, 0, 0], [0, 1, 0], 0.32, { align: "center" });

  /* cuve de récupération */
  for (const [xa, xb] of [[10.6, 10.8], [13.6, 13.8]]) cutBox(pen, xa, xb, -2.8, -0.6, zc, "beton");
  cutBox(pen, 10.6, 13.8, -3.0, -2.8, zc, "beton");
  cutBox(pen, 10.6, 13.8, -0.6, -0.4, zc, "beton");
  hatchZ(pen, "hair", 10.85, 13.55, -2.75, -1.4, zc, 0.35, -1);
  pen.dashed("faint", [10.85, -1.4, zc], [13.55, -1.4, zc], { dash: 0.3, gap: 0.2 });
  pen.text("faint", "CUVE EP 10 M3", [12.2, -2.2, zc], [1, 0, 0], [0, 1, 0], 0.3, { align: "center" });

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
  pen.rect("medium", [XNI, ROOF + 0.65, ZB], [XS - 0.4 - XNI, 0, 0], [0, 0, ZC - ZB]);
  for (let i = 0; i < 12; i++) {
    const x = -5.8 + i * 1.0;
    if (x > -0.9 && x < 0.9) continue;
    tuft(pen, x, ROOF + 0.65, zc - 0.25, 1.0);
    tuft(pen, x + 0.45, ROOF + 0.65, -1.2 + (i % 3) * 1.1, 0.9);
  }
  /* photovoltaïque sur châssis, orienté plein sud */
  for (const x0 of [1.2, 3.4]) {
    const P = [[x0, ROOF + 0.65], [x0 + 1.7, ROOF + 0.65], [x0 + 1.7, ROOF + 1.65]];
    pen.poly("medium", [...P, P[0]].map(([x, yy]) => [x, yy, zc - 0.1]));
    pen.seg("faint", [x0 + 1.7, ROOF + 1.65, zc - 0.1], [x0 + 1.7, ROOF + 1.65, ZB + 0.2]);
    pen.seg("faint", [x0, ROOF + 0.65, zc - 0.1], [x0, ROOF + 0.65, ZB + 0.2]);
    for (let z = ZB + 0.2; z < ZC; z += 0.95) pen.seg("hair", [x0, ROOF + 0.65, z], [x0 + 1.7, ROOF + 1.65, z]);
    pen.seg("medium", [x0 + 1.7, ROOF + 0.65, zc - 0.1], [x0 + 1.7, ROOF + 0.65, ZB + 0.2]);
  }

  /* cheminée de ventilation : gaine, débouché, chapeau à ventelles */
  pen.box("medium", [SH.x0, FFL[0], ZB], [SH.x1 - SH.x0, SH.top - FFL[0], SH.z1 - ZB]);
  for (let yy = ROOF + 1.1; yy < SH.top - 0.4; yy += 0.18) pen.seg("faint", [SH.x0 - 0.01, yy, ZB + 0.05], [SH.x0 - 0.01, yy, SH.z1 - 0.05]);
  pen.box("strong", [SH.x0 - 0.25, SH.top, ZB - 0.2], [SH.x1 - SH.x0 + 0.5, 0.15, SH.z1 - ZB + 0.4]);
  pen.poly("medium", [[SH.x0 - 0.25, SH.top + 0.15, ZB - 0.2], [0, SH.top + 0.55, (ZB + SH.z1) / 2], [SH.x1 + 0.25, SH.top + 0.15, ZB - 0.2]]);

  /* façade sud : vitrages intérieurs, jardins d'hiver, brise-soleil */
  for (let f = 0; f < 4; f++) {
    const y0 = FFL[f];
    const y1 = ceil(f);
    cutBox(pen, XS - 0.14, XS, y0, y0 + 0.07, zc, "vide", "medium");
    cutBox(pen, XS - 0.14, XS, y1 - 0.12, y1, zc, "vide", "medium");
    for (const x of [XS - 0.09, XS - 0.05]) pen.seg("medium", [x, y0 + 0.07, zc], [x, y1 - 0.12, zc]);
    windowOn(pen, [XS - 0.07, y0 + 0.02, ZB + 0.1], [0, 0, ZC - ZB - 0.1], [0, y1 - y0 - 0.14, 0], { mullion: true, transom: false, inset: 0.04 });
    if (f === 0) continue;
    /* vitrage extérieur coulissant (simple vitrage), en partie ouvert */
    cutBox(pen, XJ - 0.06, XJ + 0.04, y0, y1, zc, "bois", "medium");
    windowOn(pen, [XJ - 0.01, y0 + 0.05, ZB + 0.1], [0, 0, 2.3], [0, y1 - y0 - 0.15, 0], { mullion: false, transom: false, inset: 0.03 });
    windowOn(pen, [XJ + 0.05, y0 + 0.05, ZB + 1.6], [0, 0, 2.3], [0, y1 - y0 - 0.15, 0], { mullion: false, transom: false, inset: 0.03 });
    pen.seg("medium", [XJ - 0.06, y0 + 1.0, ZB + 0.1], [XJ - 0.06, y0 + 1.0, ZC]);
    /* lames fixes en partie haute + store enroulé */
    for (let i = 0; i < 4; i++) {
      const yy = y1 - 0.15 - i * 0.18;
      pen.poly("medium", [[XJ + 0.15, yy, zc], [XJ + 0.8, yy + 0.12, zc], [XJ + 0.78, yy + 0.16, zc], [XJ + 0.15, yy, zc]]);
      pen.seg("faint", [XJ + 0.15, yy, ZB], [XJ + 0.15, yy, ZC]);
    }
    pen.circle("medium", [XJ + 0.25, y1 - 0.9, zc], 0.08, { axis: "z", n: 8 });
    pen.seg("faint", [XJ + 0.25, y1 - 0.9, ZB], [XJ + 0.25, y1 - 0.9, ZC]);
    pen.box("faint", [XS + 0.12, y0, ZB - 0.02], [XJ - XS - 0.12, y1 - y0, 0.1]);
  }

  /* façade nord vue : bardage, baies à persiennes, porte du local vélos */
  const NF = { o: [XN, 0, 0], u: [0, 0, 1], n: [-1, 0, 0] };
  for (let z = ZB + 0.15; z < ZC; z += 0.16) pen.seg("hair", [XN - 0.012, 0.3, z], [XN - 0.012, ROOF + 0.9, z]);
  for (let f = 0; f < 4; f++) {
    if (f === 0) {
      bay(pen, NF, -1.6, FFL[0], 2.2, 2.2, { kind: "door", coffre: false, depth: 0.4 });
      continue;
    }
    bay(pen, NF, -0.6, FFL[f] + 0.9, 1.6, 1.3, { coffre: false, depth: 0.4 });
    pen.rect("faint", [XN - 0.1, FFL[f] + 0.8, 1.15], [0, 0, 1.6], [0, 1.5, 0]);
    for (let k = 1; k < 10; k++) pen.seg("hair", [XN - 0.1, FFL[f] + 0.8 + k * 0.15, 1.15], [XN - 0.1, FFL[f] + 0.8 + k * 0.15, 2.75]);
  }
  for (const x of [XN, XS]) pen.seg("strong", [x, 0, ZB], [x, x === XN ? ROOF + 0.9 : ROOF + 0.75, ZB]);
  pen.seg("medium", [XN, ROOF + 0.9, ZB], [XN, ROOF + 0.9, ZC]);

  /* le reste de l'immeuble, rappelé en tirets derrière la travée */
  for (const [x, yy] of [[XN, 0], [XN, ROOF + 0.9], [XJ, 0], [XJ, ROOF], [8.9, ROOF]]) {
    pen.dashed("hair", [x, yy, ZB - 0.25], [x, yy, -14], { dash: 0.5, gap: 0.35 });
  }

  /* ========================= les quatre niveaux ========================= */
  for (let f = 0; f < 4; f++) level(pen, f);

  /* RDC sud : terrasse sous pergola végétale */
  pen.rect("medium", [XS + 0.1, 0.45, ZB], [3.9, 0, 0], [0, 0, ZC - ZB]);
  for (let z = ZB + 0.15; z < ZC; z += 0.3) pen.seg("hair", [XS + 0.1, 0.46, z], [10.0, 0.46, z]);
  cutBox(pen, XS + 0.1, 10.0, 0.35, 0.45, zc, "bois", "medium");
  for (const z of [ZB + 0.2, ZC - 0.2]) {
    pen.seg("medium", [9.8, 0.45, z], [9.8, 3.1, z]);
    pen.seg("strong", [XS, 3.1, z], [10.3, 3.1, z]);
  }
  for (let x = 6.6; x < 10.2; x += 0.45) pen.seg("faint", [x, 3.15, ZB], [x, 3.15, ZC]);
  for (let i = 0; i < 4; i++) {
    const z = ZB + 0.6 + i * 1.2;
    pen.curve("faint", [[9.8, 0.5, z], [9.7, 1.8, z + 0.2], [9.9, 2.8, z - 0.1], [9.0, 3.2, z + 0.3], [7.4, 3.15, z]], 18);
  }
  {
    const tr = new Local(pen, { x: 0, y: 0.45, z: 0 });
    table(tr.sub(7.2, -0.9, 1), 1.6, 0.8, { chairs: 2 });
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
  pen.dashedCurve([[-14.5, -1.9, zc - 0.5], [-7.0, -1.5, zc - 0.5], [-5.6, FFL[0] + 0.3, 1.0], [-2.5, FFL[0] + 0.9, 0.6]], { dash: 0.55, gap: 0.4, opacity: 0.7 });

  /* eau : toiture → descente → cuve → arrosage */
  pen.poly("medium", [[8.85, ROOF - 0.05, zc - 0.1], [8.85, 0.2, zc - 0.1], [9.4, -0.8, zc - 0.1], [11.0, -0.8, zc - 0.1]]);
  pen.dashedCurve([[3.0, ROOF + 1.0, 1.5], [6.0, ROOF + 0.8, 1.6], [8.7, ROOF + 0.2, 1.8]], { dash: 0.3, gap: 0.25, opacity: 0.5 });
  pen.dashedCurve([[12.5, -0.4, zc], [13.4, 0.6, zc], [14.6, 0.2, zc]], { dash: 0.25, gap: 0.2, opacity: 0.5 });

  /* ========================= annotations ========================= */
  note(pen, [-3.0, ROOF + 0.5], "TOITURE VEGETALISEE", [-7.4, ROOF + 2.4], "end");
  note(pen, [0, SH.top + 0.3], "CHEMINEE DE VENTILATION", [-1.2, SH.top + 1.6], "end");
  note(pen, [4.2, ROOF + 1.3], "PHOTOVOLTAIQUE", [6.4, ROOF + 2.6]);
  note(pen, [7.1, FFL[3] + 1.6], "JARDIN D'HIVER", [9.3, FFL[3] + 2.0]);
  note(pen, [XJ + 0.5, ceil(2) - 0.3], "BRISE-SOLEIL", [9.3, ceil(2) + 0.6]);
  note(pen, [9.6, 3.0], "PERGOLA VEGETALE", [10.6, 4.4]);
  note(pen, [-4.0, FFL[2] - 0.18], "DALLE APPARENTE : INERTIE", [-7.4, 8.4], "end");
  note(pen, [XNI - 0.15, FFL[2] + 1.6], "FIBRE DE BOIS 30 CM", [-7.4, 11.4], "end");
  for (const [f, lab] of [[0, "+0.00"], [1, "+3.10"], [2, "+6.20"], [3, "+9.30"]]) levelMark(pen, [XN - 0.35, FFL[f], zc], lab, { dir: -1, len: 1.8 });
  levelMark(pen, [XN - 0.35, ROOF, zc], "+12.40", { dir: -1, len: 1.8 });

  /* ========================= végétation ========================= */
  tree(pen, 16.6, -3.6, { h: 9.0, r: 2.6, lean: -0.1 });
  pen.hatch("hair", [12.2, 0.01, -6.4], [5.6, 0, 0], [0, 0, 4.4], 9);
  conifer(pen, -15.4, -2.0, 7.2);
  conifer(pen, -13.2, -3.6, 6.2);
  for (const [x, z, s] of [[11.4, 1.8, 1.2], [16.2, 0.8, 1.3], [-8.2, 1.6, 1.1], [-13.6, 1.4, 1.0]]) tuft(pen, x, 0, z, s);
  planterRow(pen, [10.6, 0, 0.2], [13.4, 0, 0.2], 6, 0.9);
  person(pen, 12.0, 1.4, { h: 1.72, face: 2.6 });
  bike(pen, -8.6, -1.0, { face: 0.3 });

  return pen.build(ink);
}
