import * as THREE from "three";
import { Pen, windowOn, bay, tree, person, tuft, levelMark, earth } from "../lineKit.js";
import {
  Local, bed, sofa, armchair, chair, table, coffeeTable, rug, kitchen, wardrobe, shelves, desk,
  shower, wc, basin, washer, plant,
} from "../planKit.js";
import {
  cutBox, wallSection, slabSection, vDim, solidWallAlongZ, solidWallAlongX,
} from "../sectionKit.js";

/**
 * LOGEMENT DE QUALITÉ — coupe perspective d'une maison de ville
 * traversante sur trois niveaux, dessinée comme une planche d'exécution.
 *  - fondations, vide sanitaire ventilé, dalle portée isolée ;
 *  - murs en couches (béton, isolant, lame d'air, bardage / enduit) ;
 *  - planchers acoustiques : parquet, chape, résilient, dalle, faux plafond ;
 *  - 2,82 m sous plafond, double orientation, loggias profondes ;
 *  - escalier à deux volées dans une trémie, noyau humide superposé ;
 *  - plans cohérents d'un niveau à l'autre : cuisine-repas au RDC,
 *    séjour-bibliothèque au R+1, chambres, bains et dressing au R+2.
 */

const X0 = -8;
const X1 = 8;
const ZP = -4.5;
const ZC = 4.5;
const zc = ZC + 0.02;
const FFL = [0.6, 4.0, 7.4];
const ROOF = 10.8;
const SL = 0.4;
const HSP = 2.82;
const LOG = -9.85;
const P1 = 5.6;
const RISE = 3.4 / 19;
const TREAD = 0.26;

const ceil = (f) => FFL[f] + HSP;
const top = (f) => (f < 2 ? FFL[f + 1] : ROOF) - SL;

/* baies de façade par niveau, [z0, z1, allège, tête] relatives au plancher */
const WEST_BAY = [-2.4, ZC + 0.1, 0, 2.5];
const EAST_OPS = [
  [[1.6, 2.6, 0, 2.3], [-0.8, 0.8, 0.95, 2.35]],
  [[-1.8, 0.6, 0.9, 2.4]],
  [[-0.6, 1.4, 1.0, 2.35]],
];

/* Volée droite le long de x, côté libre en zOpen. */
function flight(pen, xa, xb, y0, za, zb, { rails = [] } = {}) {
  const n = 19;
  const dir = Math.sign(xb - xa);
  for (let i = 0; i < n; i++) {
    const x = xa + dir * i * TREAD;
    const y = y0 + (i + 1) * RISE;
    pen.seg("medium", [x, y, za], [x, y, zb]);
    for (const z of [za, zb]) {
      pen.seg("hair", [x, y - RISE, z], [x, y, z]);
      if (i < n - 1) pen.seg("hair", [x, y, z], [x + dir * TREAD, y, z]);
    }
  }
  const xe = xa + dir * (n - 1) * TREAD;
  for (const z of [za, zb]) {
    pen.seg("medium", [xa, y0 - 0.25, z], [xe, y0 + n * RISE - 0.25, z]);
  }
  for (const z of rails) {
    pen.seg("medium", [xa, y0 + 0.95, z], [xe, y0 + n * RISE + 0.95, z]);
    for (let i = 0; i < n; i += 2) {
      const x = xa + dir * i * TREAD;
      const y = y0 + (i + 1) * RISE;
      pen.seg("hair", [x, y, z], [x, y + 0.95, z]);
    }
  }
}

/* Écran de lames verticales (brise-soleil coulissant). */
function slats(pen, x, y, z0, z1, h, spacing, w = "faint") {
  const n = Math.max(2, Math.round((z1 - z0) / spacing));
  for (let i = 0; i <= n; i++) {
    const z = z0 + ((z1 - z0) * i) / n;
    pen.seg(w, [x, y, z], [x, y + h, z]);
    pen.seg("hair", [x - 0.06, y, z + 0.03], [x - 0.06, y + h, z + 0.03]);
  }
  pen.seg("medium", [x, y + h, z0], [x, y + h, z1]);
  pen.seg("faint", [x, y, z0], [x, y, z1]);
}

export function buildQuality(ink) {
  const pen = new Pen({ wobble: 0.025 });

  /* ======================= volumes masquants ======================= */
  pen.solid([X0, -1.4, ZP], [X1 - X0, 1.6, ZC - ZP], 0.03);
  pen.solid([X0, FFL[0] - SL, ZP], [X1 - X0, SL, ZC - ZP], 0.02);
  for (const [f, hole] of [[1, [-4.5, -3.45]], [2, [-3.45, -2.35]]]) {
    const y = FFL[f] - SL;
    pen.solid([X0, y, ZP], [0.3 - X0, SL, ZC - ZP], 0.02);
    pen.solid([5.2, y, ZP], [X1 - 5.2, SL, ZC - ZP], 0.02);
    if (hole[0] > ZP) pen.solid([0.3, y, ZP], [4.9, SL, hole[0] - ZP], 0.02);
    pen.solid([0.3, y, hole[1]], [4.9, SL, ZC - hole[1]], 0.02);
  }
  pen.solid([LOG, ROOF - SL, ZP], [X1 - LOG, 0.75, ZC - ZP], 0.02);
  pen.solid([X0, -1.4, ZP - 0.3], [X1 - X0, ROOF + 0.4 + 1.4, 0.3], 0.02);
  for (let f = 0; f < 3; f++) {
    const y0 = FFL[f];
    const y1 = top(f);
    solidWallAlongZ(pen, X0, X0 + 0.5, ZP, ZC, y0, y1, [[WEST_BAY[0], WEST_BAY[1], y0, y0 + WEST_BAY[3]]], 0.02);
    solidWallAlongZ(pen, X1 - 0.5, X1, ZP, ZC, y0, y1, EAST_OPS[f].map(([a, b, s, h]) => [a, b, y0 + s, y0 + h]), 0.02);
  }

  /* ============================ sol et fondations ============================ */
  pen.seg("strong", [-17, 0, zc], [X0, 0, zc]);
  pen.seg("strong", [X1, 0, zc], [14, 0, zc]);
  earth(pen, [-17, -1.6, zc], [9, 0, 0], [0, 1.6, 0], 30);
  earth(pen, [X1, -1.6, zc], [6, 0, 0], [0, 1.6, 0], 20);
  earth(pen, [X0 + 0.5, -1.6, zc], [X1 - X0 - 1.0, 0, 0], [0, 1.2, 0], 50);
  pen.seg("faint", [X0 + 0.4, -0.4, zc], [X1 - 0.4, -0.4, zc]);
  for (const [xa, xb] of [[-8.35, -7.15], [7.15, 8.35]]) cutBox(pen, xa, xb, -1.4, -1.0, zc, "beton");
  for (const [xa, xb] of [[-8, -7.6], [7.6, 8]]) cutBox(pen, xa, xb, -1.0, 0.2, zc, "beton");
  cutBox(pen, -8.14, -8, -1.0, 0.2, zc, "isolant", "faint");
  cutBox(pen, 8, 8.14, -1.0, 0.2, zc, "isolant", "faint");
  for (const x of [-7.8, 7.8]) pen.rect("faint", [x - 0.1, -0.2, zc + 0.01], [0.2, 0, 0], [0, 0.12, 0]);
  cutBox(pen, -7.6, 7.6, 0.08, 0.2, zc, "isolant", "faint");
  slabSection(pen, -7.6, 7.6, FFL[0], zc, { ceiling: false });
  pen.text("hair", "VIDE SANITAIRE", [-1.6, -0.25, zc], [1, 0, 0], [0, 1, 0], 0.22);

  /* ============================ façades coupées ============================ */
  for (let f = 0; f < 3; f++) {
    const y0 = FFL[f];
    const y1 = top(f);
    const yh = y0 + WEST_BAY[3];
    /* ouest : la coupe passe dans la grande baie (menuiserie en coupe) */
    wallSection(pen, X0 + 0.5, -1, yh, y1, zc, [
      { t: 0.2, kind: "beton" }, { t: 0.2, kind: "isolant" }, { t: 0.04, kind: "vide", w: "hair" }, { t: 0.06, kind: "bois", w: "faint" },
    ]);
    cutBox(pen, -7.86, -7.7, y0, y0 + 0.08, zc, "vide", "medium");
    cutBox(pen, -7.86, -7.7, yh - 0.12, yh, zc, "vide", "medium");
    for (const x of [-7.8, -7.76]) pen.seg("medium", [x, y0 + 0.08, zc], [x, yh - 0.12, zc]);
    pen.seg("faint", [-7.55, y0 + 0.02, zc], [-7.3, y0 + 0.02, zc]);
    /* est : mur plein (la coupe passe entre les fenêtres) */
    wallSection(pen, X1 - 0.5, 1, f === 0 ? 0.2 : y0, y1, zc, [
      { t: 0.25, kind: "beton" }, { t: 0.22, kind: "isolant" }, { t: 0.03, kind: "vide", w: "faint" },
    ]);
  }
  for (const f of [1, 2]) {
    slabSection(pen, -7.8, 7.8, FFL[f], zc);
    cutBox(pen, X0, -7.8, FFL[f] - SL, FFL[f], zc, "isolant", "faint");
    cutBox(pen, 7.8, X1, FFL[f] - SL, FFL[f], zc, "isolant", "faint");
  }

  /* toiture végétalisée : dalle, isolant, étanchéité, substrat, acrotères */
  cutBox(pen, LOG, 7.8, ROOF - SL, ROOF, zc, "beton");
  pen.seg("faint", [-7.5, ROOF - SL - 0.18, zc], [7.5, ROOF - SL - 0.18, zc]);
  for (let x = -6.9; x < 7.4; x += 1.2) pen.seg("hair", [x, ROOF - SL - 0.18, zc], [x, ROOF - SL, zc]);
  cutBox(pen, -7.9, 7.6, ROOF, ROOF + 0.22, zc, "isolant", "medium");
  pen.seg("medium", [-7.9, ROOF + 0.235, zc], [7.6, ROOF + 0.235, zc]);
  cutBox(pen, -7.6, 7.5, ROOF + 0.24, ROOF + 0.4, zc, "terre", "faint");
  cutBox(pen, 7.6, X1, ROOF, ROOF + 0.65, zc, "beton");
  pen.poly("medium", [[7.52, ROOF + 0.65, zc], [8.1, ROOF + 0.65, zc], [8.1, ROOF + 0.55, zc]]);
  cutBox(pen, LOG, LOG + 0.2, ROOF, ROOF + 0.45, zc, "beton");
  for (let i = 0; i < 9; i++) tuft(pen, -6.8 + i * 1.6, ROOF + 0.4, zc - 0.3 - (i % 3) * 2.6, 0.75);
  for (let i = 0; i < 7; i++) tuft(pen, -6.0 + i * 2.1, ROOF + 0.4, -2.4 + (i % 2) * 1.8, 0.7);
  pen.rect("medium", [X0, ROOF + 0.4, ZP], [X1 - X0, 0, 0], [0, 0, ZC - ZP]);

  /* repères de niveau et cotes de hauteur */
  levelMark(pen, [X1 + 0.8, 0, zc], "-0.60", { dir: 1 });
  levelMark(pen, [X1 + 0.8, FFL[0], zc], "+0.00", { dir: 1 });
  levelMark(pen, [X1 + 0.8, FFL[1], zc], "+3.40", { dir: 1 });
  levelMark(pen, [X1 + 0.8, FFL[2], zc], "+6.80", { dir: 1 });
  levelMark(pen, [X1 + 0.8, ROOF, zc], "+10.20", { dir: 1 });
  vDim(pen, -12.6, zc, [FFL[0], ceil(0), FFL[1], ceil(1), FFL[2], ceil(2), ROOF]);

  /* ============================ loggias, terrasse ============================ */
  for (const f of [1, 2]) {
    const y = FFL[f];
    cutBox(pen, LOG, -8.06, y - 0.25, y - 0.03, zc, "beton");
    cutBox(pen, -8.06, -7.94, y - 0.25, y - 0.03, zc, "isolant", "faint");
    pen.box("medium", [LOG, y - 0.25, -2.8], [-8 - LOG, 0.22, ZC + 2.8]);
    pen.solid([LOG, y - 0.25, -2.8], [-8 - LOG, 0.22, ZC + 2.8], 0.02);
    cutBox(pen, LOG + 0.05, LOG + 0.12, y - 0.03, y + 1.05, zc, "vide", "medium");
    cutBox(pen, LOG + 0.02, LOG + 0.16, y + 1.0, y + 1.08, zc, "vide", "medium");
    pen.seg("strong", [LOG + 0.08, y + 1.05, -2.8], [LOG + 0.08, y + 1.05, ZC]);
    for (let z = -2.6; z < ZC; z += 0.22) pen.seg("faint", [LOG + 0.08, y + 0.1, z], [LOG + 0.08, y + 1.05, z]);
    slats(pen, LOG - 0.12, y + 0.05, -2.8, f === 2 ? ZC : -0.2, HSP - 0.1, f === 2 ? 0.3 : 0.5, f === 2 ? "medium" : "faint");
    pen.box("faint", [LOG + 0.25, y, 3.2], [0.5, 0.42, 1.0]);
    for (let i = 0; i < 3; i++) tuft(pen, LOG + 0.5, y + 0.42, 3.35 + i * 0.35, 0.6);
  }
  pen.box("medium", [LOG, FFL[1] - 0.25, -3.0], [-8 - LOG, ROOF - FFL[1] + 0.25, 0.2]);
  pen.solid([LOG, FFL[1] - 0.25, -3.0], [-8 - LOG, ROOF - FFL[1] + 0.25, 0.2], 0.02);
  {
    const lg = new Local(pen, { x: 0, y: FFL[1], z: 0 });
    table(lg.sub(-8.4, 0.5, 1), 0.7, 0.7, { chairs: 1 });
  }
  /* terrasse du rez-de-chaussée sous la loggia, marches vers le jardin */
  cutBox(pen, -11.5, X0, 0.36, 0.48, zc, "bois", "medium");
  for (const x of [-11.0, -9.8, -8.6]) cutBox(pen, x, x + 0.12, 0.0, 0.36, zc, "vide", "faint");
  pen.rect("medium", [-11.5, 0.48, -2.8], [11.5 + X0, 0, 0], [0, 0, ZC + 2.8]);
  for (let z = -2.6; z < ZC; z += 0.3) pen.seg("hair", [-11.5, 0.49, z], [X0, 0.49, z]);
  for (let i = 1; i <= 2; i++) pen.rect("faint", [-11.5 - i * 0.32, 0.48 - i * 0.16, -1.2], [0.32, 0, 0], [0, 0, 3.0]);
  {
    const tr = new Local(pen, { x: 0, y: 0.48, z: 0 });
    table(tr.sub(-10.2, -0.6, 1), 1.4, 0.8, { chairs: 2 });
  }

  /* ============================ façades vues ============================ */
  for (let f = 0; f < 3; f++) {
    const y0 = FFL[f];
    /* ouest : menuiseries coulissantes toute hauteur, bardage */
    windowOn(pen, [-7.7, y0, WEST_BAY[0]], [0, 0, ZC - WEST_BAY[0]], [0, WEST_BAY[3], 0], { mullion: false, transom: false, inset: 0.05 });
    pen.grid("faint", [-7.7, y0, WEST_BAY[0]], [0, 0, ZC - WEST_BAY[0]], [0, WEST_BAY[3], 0], 5, 1);
    pen.rect("medium", [X0 - 0.01, y0 + WEST_BAY[3], WEST_BAY[0]], [0, 0, ZC - WEST_BAY[0]], [0, top(f) - y0 - WEST_BAY[3], 0]);
    /* est : baies sur rue */
    for (const [a, b, s, h] of EAST_OPS[f]) {
      bay(pen, { o: [X1, 0, 0], u: [0, 0, -1], n: [1, 0, 0] }, -b, y0 + s, b - a, h - s, { kind: s === 0 ? "door" : "window", coffre: false, depth: 0.45, rail: s === 0 ? 0 : 3 });
    }
  }
  for (let z = ZP + 0.15; z < WEST_BAY[0]; z += 0.3) pen.seg("hair", [X0 - 0.012, 0.25, z], [X0 - 0.012, ROOF, z]);
  for (const f of [1, 2]) {
    pen.seg("medium", [X0 - 0.01, FFL[f] - SL, ZP], [X0 - 0.01, FFL[f] - SL, WEST_BAY[0]]);
    pen.seg("medium", [X1 + 0.01, FFL[f] - SL, ZP], [X1 + 0.01, FFL[f] - SL, ZC]);
  }
  for (const x of [X0, X1]) {
    pen.seg("strong", [x, -0.1, ZP], [x, ROOF + 0.4, ZP]);
    pen.seg("medium", [x, ROOF + 0.4, ZP], [x, ROOF + 0.4, ZC]);
  }
  /* entrée sur rue : emmarchement et auvent */
  for (let i = 0; i < 3; i++) pen.rect("faint", [X1 + 0.3 * (3 - i), 0.2 * i, 1.3], [0.3, 0, 0], [0, 0, 1.6]);
  pen.box("medium", [X1, FFL[0] + 2.55, 1.2], [1.2, 0.12, 1.8]);
  pen.solid([X1, FFL[0] + 2.55, 1.2], [1.2, 0.12, 1.8], 0.02);
  pen.seg("strong", [X1, 0, ZC], [14, 0, ZC]);
  pen.seg("medium", [11.5, 0, ZP - 2], [11.5, 0, ZC + 1.5]);

  /* ============================ intérieurs ============================ */
  /* le mur mitoyen vu depuis chaque pièce : plinthes et sous-face */
  for (let f = 0; f < 3; f++) {
    pen.seg("faint", [-7.5, FFL[f] + 0.08, ZP + 0.01], [7.5, FFL[f] + 0.08, ZP + 0.01]);
    pen.seg("faint", [-7.5, ceil(f), ZP + 0.01], [7.5, ceil(f), ZP + 0.01]);
  }
  /* gaine technique continue sur trois niveaux */
  pen.box("faint", [7.0, FFL[0], ZP], [0.5, ROOF - FFL[0], 0.75]);
  pen.dashed("hair", [7.25, FFL[0], ZP + 0.37], [7.25, ROOF + 0.6, ZP + 0.37], { dash: 0.4, gap: 0.3 });

  /* escalier : deux volées superposées, trémies, garde-corps */
  flight(pen, 0.4, 5.08, FFL[0], -4.5, -3.5, { rails: [-3.5] });
  flight(pen, 5.08, 0.4, FFL[1], -3.4, -2.4, { rails: [-2.4, -3.4] });
  for (let x = 1.6; x < 5.0; x += 0.9) {
    const h = ((x - 0.4) / 4.68) * 3.4 - 0.35;
    pen.box("faint", [x, FFL[0], -4.45], [0.82, Math.max(0.4, h - 0.15), 0.9]);
  }
  for (const [f, zEdge] of [[2, -3.45]]) {
    pen.seg("medium", [0.3, FFL[f] + 1.0, zEdge], [5.2, FFL[f] + 1.0, zEdge]);
    for (let x = 0.4; x < 5.2; x += 0.3) pen.seg("hair", [x, FFL[f], zEdge], [x, FFL[f] + 1.0, zEdge]);
  }
  pen.seg("medium", [0.3, FFL[1] + 1.0, -4.5], [0.3, FFL[1] + 1.0, -3.45]);

  /* ---------------- RDC : entrée, wc, cuisine ouverte, repas ---------------- */
  {
    const y = FFL[0];
    const L = new Local(pen, { x: 0, y, z: 0 });
    const H = HSP;
    L.wall(P1, ZP, P1, ZC, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 4.9, w: 0.9, kind: "door", side: -1, hinge: "b" }] });
    L.wall(P1 + 0.05, -1.2, 7.5, -1.2, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.15, w: 0.75, kind: "door", side: 1, hinge: "a" }] });
    solidWallAlongZ(pen, P1 - 0.05, P1 + 0.05, ZP, ZC, y, y + H, [[0.4, 1.3, y, y + 2.1]], 0.01);
    solidWallAlongX(pen, -1.25, -1.15, P1 + 0.05, 7.5, y, y + H, [[5.8, 6.55, y, y + 2.1]], 0.01);
    wc(L.sub(6.0, ZP, 0));
    basin(L.sub(5.7, -1.95, 3), 0.45);
    wardrobe(L.sub(5.7, 4.4, 3), 2.2, { d: 0.55, h: 2.4 });
    L.box("faint", [6.9, 0, -0.6], [0.5, 0.45, 1.2]);
    kitchen(L.sub(-5.4, ZP, 0), 5.0, { sink: 0.5, hob: 0.22, h: 2.15 });
    L.box("faint", [-5.4, 1.5, ZP], [4.38, 0.7, 0.35]);
    L.poly("faint", [[-4.0, 1.5, ZP + 0.35], [-3.6, 1.2, ZP + 0.55], [-3.0, 1.2, ZP + 0.55], [-2.6, 1.5, ZP + 0.35]]);
    L.box("medium", [-4.2, 0, -2.6], [2.6, 0.92, 0.9]);
    for (const x of [-3.7, -2.6]) {
      L.circle("faint", [x, 0.66, -1.35], 0.17, { n: 10 });
      L.seg("hair", [x, 0, -1.35], [x, 0.66, -1.35]);
    }
    table(L.sub(-5.0, -0.4, 1), 2.2, 1.0, { chairs: 3 });
    for (const z of [0.2, 1.2]) {
      L.seg("hair", [-5.5, H, z], [-5.5, 1.75, z]);
      pen.edges("faint", new THREE.ConeGeometry(0.22, 0.26, 10), { pos: [-5.5, y + 1.65, z] });
    }
    plant(L.sub(-7.0, 3.6, 0), 1.2);
    L.label("hair", "CUISINE", [-3.0, 0.02, -1.6], 0.3);
    L.label("hair", "REPAS", [-5.6, 0.02, 2.6], 0.3);
    L.label("hair", "ENTREE", [6.5, 0.02, 3.6], 0.3);
    person(pen, -2.8, -3.3, { y, h: 1.7, face: 0.2 });
    person(pen, -6.3, 0.9, { y, h: 1.15, face: 1.4 });
  }

  /* ---------------- R+1 : séjour, bibliothèque, bureau, buanderie ---------------- */
  {
    const y = FFL[1];
    const L = new Local(pen, { x: 0, y, z: 0 });
    const H = HSP;
    L.wall(P1, ZP, P1, ZC, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 5.5, w: 1.4, kind: "door", side: 1, double: true }] });
    L.wall(P1 + 0.05, -1.2, 7.5, -1.2, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.15, w: 0.75, kind: "door", side: 1, hinge: "a" }] });
    solidWallAlongZ(pen, P1 - 0.05, P1 + 0.05, ZP, ZC, y, y + H, [[1.0, 2.4, y, y + 2.1]], 0.01);
    solidWallAlongX(pen, -1.25, -1.15, P1 + 0.05, 7.5, y, y + H, [[5.8, 6.55, y, y + 2.1]], 0.01);
    washer(L.sub(5.7, -3.4, 3));
    washer(L.sub(5.7, -2.7, 3));
    shelves(L.sub(7.0, -3.6, 1), 2.2, { h: 2.2, d: 0.4 });
    shelves(L.sub(-7.4, ZP, 0), 6.9, { h: 2.75, d: 0.38 });
    sofa(L.sub(-3.0, -0.8, 1), 2.6, 0.95);
    coffeeTable(L.sub(-4.6, -0.2, 1), 1.2, 0.6);
    armchair(L.sub(-6.4, 1.6, 3));
    rug(L.sub(-6.0, -1.0, 0), 3.4, 3.0);
    armchair(L.sub(-1.0, -4.05, 0));
    L.curve("medium", [[-0.3, 0, -3.2], [-0.4, 1.6, -3.3], [-0.9, 1.95, -3.6]], 10);
    pen.edges("faint", new THREE.ConeGeometry(0.2, 0.22, 8), { pos: [-0.95, y + 1.85, -3.6] });
    desk(L.sub(7.5, -1.0, 1), 1.6, 0.7);
    shelves(L.sub(5.7, 4.4, 3), 1.8, { h: 2.0, d: 0.35 });
    plant(L.sub(7.0, 3.8, 0), 1.1);
    L.label("hair", "BIBLIOTHEQUE", [-4.0, 0.02, -3.65], 0.28);
    L.label("hair", "SEJOUR", [-4.6, 0.02, 3.4], 0.3);
    L.label("hair", "BUREAU", [6.6, 0.02, 3.2], 0.28);
    person(pen, -4.9, 0.4, { y, h: 1.72, face: -1.2 });
    person(pen, 6.4, 0.0, { y, h: 1.66, face: 0.0 });
  }

  /* ---------------- R+2 : chambres, salle d'eau, dressing ---------------- */
  {
    const y = FFL[2];
    const L = new Local(pen, { x: 0, y, z: 0 });
    const H = HSP;
    L.wall(P1, ZP, P1, ZC, {
      t: 0.1, h: H, w: "medium", base: false,
      openings: [{ at: 0.2, w: 0.7, kind: "door", side: 1, hinge: "a" }, { at: 7.7, w: 1.0, kind: "void" }],
    });
    L.wall(P1 + 0.05, -1.2, 7.5, -1.2, { t: 0.1, h: H, w: "medium", base: false });
    L.wall(-1.6, ZP, -1.6, ZC, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.2, w: 0.8, kind: "door", side: -1, hinge: "a" }] });
    L.wall(-1.55, -2.3, P1 - 0.05, -2.3, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.15, w: 0.8, kind: "door", side: 1, hinge: "a" }] });
    solidWallAlongZ(pen, P1 - 0.05, P1 + 0.05, ZP, ZC, y, y + H, [[-4.3, -3.6, y, y + 2.1], [3.2, 4.2, y, y + 2.3]], 0.01);
    solidWallAlongX(pen, -1.25, -1.15, P1 + 0.05, 7.5, y, y + H, [], 0.01);
    solidWallAlongZ(pen, -1.65, -1.55, ZP, ZC, y, y + H, [[-4.3, -3.5, y, y + 2.1]], 0.01);
    solidWallAlongX(pen, -2.35, -2.25, -1.55, P1 - 0.05, y, y + H, [[-1.4, -0.6, y, y + 2.1]], 0.01);
    /* chambre parentale + dressing sur mitoyen */
    bed(L.sub(-1.7, -1.4, 1), 1.6, 2.0);
    wardrobe(L.sub(-7.4, ZP, 0), 4.8, { h: 2.3, d: 0.6 });
    armchair(L.sub(-7.0, 2.4, 3));
    for (let i = 0; i <= 10; i++) {
      const z = -2.3 + (i / 10) * 6.7;
      L.curve("faint", [[-7.35, 0.1, z], [-7.3 + (i % 2 ? 0.07 : -0.05), 1.4, z + 0.04], [-7.35, 2.4, z]], 8);
    }
    /* chambre d'enfant */
    bed(L.sub(5.5, -0.2, 1), 1.4, 1.9);
    desk(L.sub(0.6, -2.2, 0), 1.4, 0.65);
    rug(L.sub(1.0, 0.8, 0), 2.2, 1.6);
    wardrobe(L.sub(-1.5, 4.4, 3), 1.8, { h: 2.1 });
    /* salle d'eau superposée à la gaine */
    shower(L.sub(7.5, -2.15, 1), 0.9, { h: 2.1 });
    basin(L.sub(5.7, -1.3, 3), 0.9);
    wc(L.sub(6.45, ZP, 0));
    for (let z = -4.2; z < -1.25; z += 0.3) L.seg("hair", [5.7, 0.01, z], [7.0, 0.01, z]);
    /* dressing côté rue */
    wardrobe(L.sub(5.7, 0.9, 3), 1.9, { h: 2.3 });
    L.box("faint", [6.6, 0, 2.2], [0.7, 0.42, 0.45]);
    L.label("hair", "CHAMBRE", [-4.8, 0.02, 3.4], 0.3);
    L.label("hair", "CHAMBRE", [2.0, 0.02, 3.7], 0.3);
    L.label("hair", "SDB", [6.6, 0.02, -2.6], 0.28);
    L.label("hair", "DRESSING", [6.6, 0.02, 3.9], 0.24);
    person(pen, 2.6, 2.2, { y, h: 1.2, face: -0.7 });
  }

  /* ======================= lumière et air ======================= */
  for (let i = 0; i < 3; i++) {
    const z = 0.4 + i * 1.3;
    pen.dashedCurve([[-15.5, 9.2, z], [-8.4, FFL[1] + 2.3, z + 0.1], [-3.2, FFL[1] + 0.02, z + 0.5]], { dash: 0.32, gap: 0.4, opacity: 0.34, div: 20 });
  }
  pen.dashedCurve([[-15.0, 13.6, -1.0], [-9.85, ROOF - SL, -0.9], [-9.0, ROOF - 0.9, -0.8]], { dash: 0.3, gap: 0.3, opacity: 0.28, div: 12 });
  pen.dashedCurve(
    [[-10.6, FFL[1] + 1.5, 1.4], [-7.0, FFL[1] + 1.8, 1.0], [0, FFL[1] + 1.7, 0.4], [6.2, FFL[1] + 1.8, -0.4], [10.5, FFL[1] + 1.9, -0.6]],
    { dash: 0.48, gap: 0.42, opacity: 0.45, div: 30 }
  );
  pen.hatch("hair", [-6.8, FFL[1] + 0.02, 0.4], [2.6, 0, 1.0], [0.7, 0, 2.2], 7);

  /* ======================= jardin et rue ======================= */
  tree(pen, -15.6, 2.8, { h: 6.6, r: 2.0 });
  for (const [x, z, s] of [[-12.6, 3.6, 1.3], [-13.4, -1.8, 1.0], [-16.0, 3.0, 1.2], [12.2, 3.6, 1.0]]) tuft(pen, x, 0.02, z, s);
  pen.box("faint", [-15.6, 0, -3.6], [1.8, 0.45, 0.5]);
  person(pen, 10.2, 2.6, { y: 0, h: 1.72, face: 2.8 });

  return pen.build(ink);
}
