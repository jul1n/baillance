import * as THREE from "three";
import { Pen, windowOn, tree, person, tuft, planterRow, levelMark, earth } from "../lineKit.js";
import { Local, bed, sofa, armchair, table, rug, kitchen, wardrobe, desk, shower, wc, basin, plant } from "../planKit.js";
import { cutBox, wallSection, vDim, hatchZ, solidWallAlongZ } from "../sectionKit.js";

/**
 * ADAPTATION AU CHANGEMENT CLIMATIQUE — coupe bioclimatique d'une maison
 * R+1 traversante, façade sud (x+) protégée, façade nord (x−) épaisse.
 *  - inertie : mur de refend en pisé, dalles béton apparentes ;
 *  - confort d'été : brise-soleil à lames, casquette dimensionnée sur le
 *    soleil de 65°, double hauteur et lanterneau en cheminée solaire,
 *    puits canadien, brasseurs d'air ;
 *  - hiver : soleil de 20° captant jusqu'au mur lourd ;
 *  - eau et sol : toiture végétalisée épaisse, noue d'infiltration, cuve
 *    de récupération ; arbres caducs au sud, persistants au nord.
 */

const X0 = -7.5;
const X1 = 7.5;
const Z0 = -4;
const ZC = 4;
const zc = ZC + 0.02;
const F0 = 0.45;
const F1 = 3.95;
const ROOF = 7.45;
const SL = 0.35;
const VOID = { x0: 1.2, x1: 4.8, z0: -2.0 };
const STAIR = { x0: -0.2, x1: 4.55, z0: -4.0, z1: -3.0 };
const LAN = { x0: 1.5, x1: 4.5, z0: -1.8, top: 9.0 };
const BS = 9.5;
const NORTH_WIN = [[-1.6, 0.4, 0.9, 2.2], [-3.2, -1.4, 1.0, 2.25]];

/* Pisé : strates horizontales légèrement ondulées. */
function strata(pen, x0, x1, y0, y1, z) {
  for (let y = y0 + 0.09; y < y1; y += 0.11) {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const x = x0 + ((x1 - x0) * i) / 6;
      pts.push([x, y + Math.sin(i * 1.7 + y * 9) * 0.012, z]);
    }
    pen.poly("hair", pts);
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

/* Angle solaire annoté au point p (rayon descendant d'angle a). */
function angleMark(pen, p, a, label) {
  const r = 1.6;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = (i / 10) * a;
    pts.push([p[0] + Math.cos(t) * r, p[1] + Math.sin(t) * r, p[2]]);
  }
  pen.poly("faint", pts);
  pen.seg("hair", p, [p[0] + r + 0.6, p[1], p[2]]);
  pen.text("faint", label, [p[0] + r + 0.15, p[1] + Math.sin(a / 2) * r * 0.9, p[2]], [1, 0, 0], [0, 1, 0], 0.42);
}

export function buildClimate(ink) {
  const pen = new Pen({ wobble: 0.025 });

  /* ======================= volumes masquants ======================= */
  pen.solid([X0, -1.0, Z0], [X1 - X0, F0 - SL + 1.0, ZC - Z0], 0.03);
  pen.solid([X0, F0 - SL, Z0], [X1 - X0, SL, ZC - Z0], 0.02);
  {
    const y = F1 - SL;
    for (const [xa, xb, za, zb] of [
      [X0, STAIR.x0 - 0.1, Z0, ZC],
      [STAIR.x0 - 0.1, VOID.x0, STAIR.z1, ZC],
      [VOID.x0, STAIR.x1 + 0.05, STAIR.z1, VOID.z0],
      [STAIR.x1 + 0.05, VOID.x1, Z0, VOID.z0],
      [VOID.x1, BS - 0.6, Z0, ZC],
    ]) pen.solid([xa, y, za], [xb - xa, SL, zb - za], 0.02);
  }
  for (const [xa, xb, za, zb] of [[X0, LAN.x0, Z0, ZC], [LAN.x0, LAN.x1, Z0, LAN.z0], [LAN.x1, BS, Z0, ZC]]) {
    pen.solid([xa, ROOF - SL, za], [xb - xa, 1.0, zb - za], 0.02);
  }
  pen.solid([LAN.x0 - 0.2, LAN.top, LAN.z0 - 0.2], [LAN.x1 - LAN.x0 + 0.4, 0.3, ZC - LAN.z0 + 0.2], 0.02);
  pen.solid([X0, -1.0, Z0 - 0.3], [BS - X0, ROOF + 1.85, 0.3], 0.02);
  for (const [f, y0, y1] of [[0, F0, F1 - SL], [1, F1, ROOF - SL]]) {
    const [a, b, s, h] = NORTH_WIN[f];
    solidWallAlongZ(pen, X0, X0 + 0.6, Z0, ZC, y0, y1, [[a, b, y0 + s, y0 + h]], 0.02);
  }
  solidWallAlongZ(pen, -1.2, -0.4, Z0, ZC, F0, F1 - SL, [[-2.6, -1.4, F0, F0 + 2.2]], 0.02);

  /* ======================= sol, eau, fondations ======================= */
  const ground = [[-19, 0], [-14, 0], [-13, -0.6], [-11, -0.6], [-10, 0], [X0, 0]];
  pen.poly("strong", ground.map(([x, y]) => [x, y, zc]));
  pen.seg("strong", [X1, 0, zc], [17, 0, zc]);
  earth(pen, [-19, -3.0, zc], [11.5, 0, 0], [0, 2.4, 0], 36);
  earth(pen, [X1, -3.0, zc], [9.5, 0, 0], [0, 3.0, 0], 26);
  pen.dashed("faint", [-12.9, -0.45, zc], [-11.1, -0.45, zc], { dash: 0.25, gap: 0.2 });
  for (let i = 0; i < 8; i++) pen.circle("hair", [-12.8 + i * 0.24, -0.55, zc], 0.06, { axis: "z", n: 6 });
  for (const x of [-13.4, -12.2, -10.6]) tuft(pen, x, -0.4, zc - 0.4, 1.0);
  pen.text("faint", "NOUE", [-12.0, -1.15, zc], [1, 0, 0], [0, 1, 0], 0.38, { align: "center" });

  /* puits canadien : borne, tube enterré, arrivée en sous-face */
  pen.box("medium", [-16.3, 0, zc - 0.6], [0.6, 1.2, 0.6]);
  pen.rect("faint", [-16.25, 0.85, zc - 0.01], [0.5, 0, 0], [0, 0.25, 0]);
  pen.poly("medium", [[-16.15, 0, zc], [-16.15, -2.1, zc], [-6.5, -1.6, zc], [-6.5, F0 - SL, zc]]);
  pen.poly("medium", [[-15.85, 0, zc], [-15.85, -1.8, zc], [-6.8, -1.32, zc], [-6.8, F0 - SL, zc]]);
  pen.text("faint", "PUITS CANADIEN", [-11.5, -2.4, zc], [1, 0, 0], [0, 1, 0], 0.34, { align: "center" });

  /* cuve de récupération des eaux pluviales */
  cutBox(pen, 10, 13.4, -2.8, -0.6, zc, "vide", "medium");
  for (const [xa, xb] of [[10, 10.2], [13.2, 13.4]]) cutBox(pen, xa, xb, -2.8, -0.6, zc, "beton");
  cutBox(pen, 10, 13.4, -3.0, -2.8, zc, "beton");
  hatchZ(pen, "hair", 10.25, 13.15, -2.75, -1.4, zc, 0.35, -1);
  pen.dashed("faint", [10.25, -1.4, zc], [13.15, -1.4, zc], { dash: 0.3, gap: 0.2 });
  pen.poly("medium", [[BS - 0.15, ROOF + 0.1, zc], [BS - 0.15, 0.3, zc], [BS + 0.4, -0.9, zc], [10.4, -0.9, zc]]);
  pen.text("faint", "CUVE EP", [11.7, -2.1, zc], [1, 0, 0], [0, 1, 0], 0.34, { align: "center" });

  /* fondations + dallage sur terre-plein isolé, hérisson */
  for (const [xa, xb] of [[-7.85, -6.6], [6.6, 7.85], [-1.4, -0.2]]) cutBox(pen, xa, xb, -1.0, -0.6, zc, "beton");
  for (const [xa, xb] of [[-7.5, -7.0], [7.0, 7.5]]) cutBox(pen, xa, xb, -0.6, F0 - SL, zc, "beton");
  cutBox(pen, -7.0, 7.0, -0.32, -0.1, zc, "vide", "faint");
  for (let x = -6.8; x < 6.9; x += 0.3) pen.circle("hair", [x, -0.21, zc], 0.08, { axis: "z", n: 6 });
  cutBox(pen, -7.0, 7.0, -0.1, F0 - SL, zc, "isolant", "faint");
  cutBox(pen, -7.0, 7.0, F0 - SL, F0 - 0.07, zc, "beton");
  pen.seg("medium", [-7.0, F0, zc], [7.5, F0, zc]);
  pen.seg("hair", [-7.0, F0 - 0.07, zc], [7.5, F0 - 0.07, zc]);

  /* ========================= enveloppe coupée ========================= */
  for (const [y0, y1] of [[F0, F1 - SL], [F1, ROOF - SL]]) {
    wallSection(pen, X0 + 0.6, -1, y0, y1, zc, [
      { t: 0.3, kind: "maconnerie" }, { t: 0.24, kind: "isolant" }, { t: 0.03, kind: "vide", w: "hair" }, { t: 0.03, kind: "bois", w: "faint" },
    ]);
    /* sud : vitrage toute hauteur entre poteaux bois */
    cutBox(pen, 7.15, 7.45, y0, y1, zc, "bois", "medium");
    for (const x of [7.25, 7.31]) pen.seg("medium", [x, y0 + 0.1, zc - 0.25], [x, y1 - 0.1, zc - 0.25]);
  }
  /* dalle intermédiaire apparente, interrompue par la double hauteur */
  for (const [xa, xb] of [[X0 + 0.3, VOID.x0], [VOID.x1, X1]]) {
    cutBox(pen, xa, xb, F1 - SL, F1 - 0.07, zc, "beton");
    pen.seg("medium", [xa, F1, zc], [xb, F1, zc]);
    pen.seg("hair", [xa, F1 - 0.07, zc], [xb, F1 - 0.07, zc]);
  }
  cutBox(pen, X1, X1 + 0.12, F1 - SL, F1 - 0.07, zc, "isolant", "faint");
  cutBox(pen, X1 + 0.12, 8.9, F1 - 0.28, F1 - 0.08, zc, "beton");
  cutBox(pen, X0, X0 + 0.3, F1 - SL, F1, zc, "isolant", "faint");
  /* toiture végétalisée épaisse + casquette */
  for (const [xa, xb] of [[X0, LAN.x0], [LAN.x1, BS]]) cutBox(pen, xa, xb, ROOF - SL, ROOF, zc, "beton");
  for (const [xa, xb] of [[X0, LAN.x0 - 0.15], [LAN.x1 + 0.15, X1]]) {
    cutBox(pen, xa, xb, ROOF, ROOF + 0.3, zc, "isolant", "medium");
    pen.seg("medium", [xa, ROOF + 0.315, zc], [xb, ROOF + 0.315, zc]);
    cutBox(pen, xa + 0.1, xb - 0.1, ROOF + 0.33, ROOF + 0.63, zc, "terre", "faint");
  }
  cutBox(pen, X0, X0 + 0.25, ROOF, ROOF + 0.85, zc, "beton");
  pen.poly("medium", [[X0 - 0.08, ROOF + 0.75, zc], [X0 - 0.08, ROOF + 0.85, zc], [X0 + 0.3, ROOF + 0.85, zc]]);
  cutBox(pen, BS - 0.2, BS, ROOF, ROOF + 0.35, zc, "beton");
  for (let i = 0; i < 14; i++) {
    const x = -6.8 + i * 1.05;
    if (x > LAN.x0 - 0.4 && x < LAN.x1 + 0.4) continue;
    tuft(pen, x, ROOF + 0.63, zc - 0.25, 1.05);
    tuft(pen, x + 0.4, ROOF + 0.63, -1.6 + (i % 3) * 1.6, 0.95);
  }
  pen.rect("medium", [X0, ROOF + 0.63, Z0], [X1 - X0, 0, 0], [0, 0, ZC - Z0]);

  /* lanterneau : cheminée solaire au-dessus de la double hauteur */
  cutBox(pen, LAN.x0 - 0.2, LAN.x0, ROOF, LAN.top, zc, "bois", "medium");
  cutBox(pen, LAN.x1, LAN.x1 + 0.2, ROOF, LAN.top, zc, "bois", "medium");
  cutBox(pen, LAN.x0 - 0.4, LAN.x1 + 0.4, LAN.top, LAN.top + 0.25, zc, "beton");
  for (const x of [LAN.x1 + 0.07, LAN.x1 + 0.13]) pen.seg("medium", [x, ROOF + 0.4, LAN.z0], [x, LAN.top - 0.1, LAN.z0]);
  windowOn(pen, [LAN.x1 + 0.1, ROOF + 0.4, LAN.z0], [0, 0, ZC - LAN.z0], [0, LAN.top - ROOF - 0.5, 0], { mullion: true, transom: false });
  for (let i = 0; i < 6; i++) {
    const y = ROOF + 0.55 + i * 0.22;
    pen.seg("medium", [LAN.x0 - 0.1, y, zc], [LAN.x0 - 0.55, y + 0.16, zc]);
    pen.seg("faint", [LAN.x0 - 0.1, y, LAN.z0], [LAN.x0 - 0.55, y + 0.16, LAN.z0]);
  }
  pen.rect("medium", [LAN.x0 - 0.4, LAN.top + 0.25, LAN.z0 - 0.2], [LAN.x1 - LAN.x0 + 0.8, 0, 0], [0, 0, ZC - LAN.z0 + 0.2]);

  /* repères de niveau et cotes */
  levelMark(pen, [BS + 1.2, F0, zc], "+0.00", { dir: 1 });
  levelMark(pen, [BS + 1.2, F1, zc], "+3.50", { dir: 1 });
  levelMark(pen, [BS + 1.2, ROOF, zc], "+7.00", { dir: 1 });
  levelMark(pen, [BS + 1.2, LAN.top + 0.25, zc], "+8.80", { dir: 1 });
  vDim(pen, -15.5, zc, [F0, F1 - SL, F1, ROOF - SL, ROOF]);

  /* ========================= façades vues ========================= */
  for (const [y0, y1] of [[F0, F1 - SL], [F1, ROOF - SL]]) {
    for (let z = Z0; z <= ZC; z += 2) pen.box("medium", [7.15, y0, z - 0.06], [0.3, y1 - y0, 0.12]);
    for (let z = Z0; z < ZC; z += 2) windowOn(pen, [7.3, y0 + 0.05, z + 0.06], [0, 0, 1.88], [0, y1 - y0 - 0.1, 0], { mullion: false, transom: false, inset: 0.04 });
    /* brise-soleil à lames orientables sur cadre */
    for (const z of [Z0, 0, ZC]) pen.seg("medium", [8.85, y0, z], [8.85, y1, z]);
    for (let i = 0; i < 12; i++) {
      const y = y0 + 0.25 + ((y1 - y0 - 0.5) * i) / 11;
      pen.poly("medium", [[8.4, y, zc], [9.1, y + 0.22, zc], [9.05, y + 0.27, zc], [8.4, y, zc]]);
      pen.seg("faint", [8.4, y, Z0], [8.4, y, ZC]);
      pen.seg("hair", [9.1, y + 0.22, Z0], [9.1, y + 0.22, ZC]);
    }
  }
  /* nord : petites baies, persiennes coulissantes, casquette plantée */
  for (const [[a, b, s, h], y0] of [[NORTH_WIN[0], F0], [NORTH_WIN[1], F1]]) {
    windowOn(pen, [X0 - 0.01, y0 + s, a], [0, 0, b - a], [0, h - s, 0], { mullion: true, transom: false });
    pen.box("faint", [X0 - 0.12, y0 + s - 0.1, b + 0.05], [0.08, h - s + 0.2, b - a]);
    for (let k = 1; k < 10; k++) pen.seg("hair", [X0 - 0.12, y0 + s - 0.1 + (k * (h - s + 0.2)) / 10, b + 0.05], [X0 - 0.12, y0 + s - 0.1 + (k * (h - s + 0.2)) / 10, 2 * b - a + 0.05]);
  }
  pen.box("medium", [X0 - 1.6, F1 - 0.3, Z0 + 0.4], [1.6, 0.3, ZC - Z0 - 0.4]);
  pen.solid([X0 - 1.6, F1 - 0.3, Z0 + 0.4], [1.6, 0.3, ZC - Z0 - 0.4], 0.02);
  planterRow(pen, [X0 - 1.35, F1, Z0 + 0.9], [X0 - 1.35, F1, ZC - 0.4], 5, 1.0);
  for (let z = Z0 + 0.2; z < ZC; z += 0.25) pen.seg("hair", [X0 - 0.012, 0.3, z], [X0 - 0.012, ROOF + 0.85, z]);
  for (const x of [X0, BS]) pen.seg("strong", [x, x === X0 ? 0 : ROOF - SL, Z0], [x, ROOF + (x === X0 ? 0.85 : 0.35), Z0]);
  pen.seg("strong", [X1, 0, Z0], [X1, ROOF - SL, Z0]);
  pen.seg("medium", [X0, ROOF + 0.85, Z0], [X0, ROOF + 0.85, ZC]);

  /* ========================= intérieurs ========================= */
  /* mur lourd en pisé au RDC : coupe et parement vu */
  cutBox(pen, -1.2, -0.4, F0, F1 - SL, zc, "vide", "strong");
  strata(pen, -1.2, -0.4, F0, F1 - SL, zc);
  for (const x of [-1.21, -0.39]) {
    for (let y = F0 + 0.1; y < F1 - SL; y += 0.11) {
      pen.seg("hair", [x, y, -1.4], [x, y, ZC]);
      pen.seg("hair", [x, y, Z0], [x, y, -2.6]);
    }
    pen.rect("medium", [x, F0, -2.6], [0, 0, 1.2], [0, 2.2, 0]);
  }
  pen.text("faint", "PISE", [-0.8, F0 + 1.3, zc], [0, 1, 0], [-1, 0, 0], 0.3, { align: "center" });

  /* escalier droit le long du mur du fond */
  {
    const n = 20;
    const rise = (F1 - F0) / n;
    const tread = (STAIR.x1 - STAIR.x0) / (n - 1);
    for (let i = 0; i < n; i++) {
      const x = STAIR.x0 + i * tread;
      const y = F0 + (i + 1) * rise;
      pen.seg("medium", [x, y, STAIR.z0], [x, y, STAIR.z1]);
      pen.seg("hair", [x, y - rise, STAIR.z1], [x, y, STAIR.z1]);
      if (i < n - 1) pen.seg("hair", [x, y, STAIR.z1], [x + tread, y, STAIR.z1]);
    }
    pen.seg("medium", [STAIR.x0, F0 + 0.95, STAIR.z1], [STAIR.x1, F1 + 0.95, STAIR.z1]);
    pen.seg("medium", [STAIR.x0, F0 - 0.2, STAIR.z1], [STAIR.x1, F1 - 0.25, STAIR.z1]);
  }
  /* garde-corps de la mezzanine sur la double hauteur */
  pen.seg("medium", [VOID.x0, F1 + 1.0, VOID.z0], [VOID.x1, F1 + 1.0, VOID.z0]);
  for (let x = VOID.x0; x <= VOID.x1; x += 0.3) pen.seg("hair", [x, F1, VOID.z0], [x, F1 + 1.0, VOID.z0]);
  for (const x of [VOID.x0, VOID.x1]) {
    cutBox(pen, x - (x === VOID.x0 ? 0.06 : 0), x + (x === VOID.x0 ? 0 : 0.06), F1, F1 + 1.0, zc, "vide", "medium");
  }

  /* RDC : cuisine au nord, séjour sud en double hauteur */
  {
    const L = new Local(pen, { x: 0, y: F0, z: 0 });
    kitchen(L.sub(-6.6, Z0, 0), 4.4, { sink: 0.4, hob: 0.2, h: 2.1 });
    L.box("faint", [-6.6, 1.5, Z0], [3.7, 0.7, 0.35]);
    table(L.sub(-5.4, -0.4, 0), 2.0, 0.9, { chairs: 2 });
    plant(L.sub(-6.6, 3.4, 0), 1.1);
    sofa(L.sub(1.6, 1.5, 3), 2.4, 0.9);
    armchair(L.sub(5.6, 2.8, 1));
    rug(L.sub(1.5, -1.2, 0), 3.4, 3.0);
    L.box("faint", [3.2, 0, -0.1], [0.9, 0.4, 0.6]);
    plant(L.sub(6.5, -3.3, 0), 1.3);
    L.label("hair", "CUISINE", [-4.4, 0.02, 2.6], 0.3);
    L.label("hair", "SEJOUR", [3.0, 0.02, 3.2], 0.3);
    person(pen, -3.6, -2.9, { y: F0, h: 1.7, face: 0.4 });
    person(pen, 5.0, 0.6, { y: F0, h: 1.68, face: -2.2 });
  }
  /* R+1 : chambre nord, salle d'eau coupée, chambre sud sur la double hauteur */
  {
    const L = new Local(pen, { x: 0, y: F1, z: 0 });
    const H = ROOF - SL - F1;
    L.wall(-0.95, VOID.z0, -0.95, ZC, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.3, w: 0.8, kind: "door", side: -1, hinge: "a" }] });
    L.wall(1.15, 0.6, 1.15, ZC, { t: 0.1, h: H, w: "medium", base: false });
    L.wall(-0.9, 0.55, 1.1, 0.55, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.6, w: 0.7, kind: "door", side: 1, hinge: "a" }] });
    L.wall(VOID.x1 + 0.05, Z0, VOID.x1 + 0.05, ZC, { t: 0.1, h: H, w: "medium", base: false, openings: [{ at: 0.3, w: 0.8, kind: "door", side: 1, hinge: "a" }] });
    solidWallAlongZ(pen, -1.0, -0.9, VOID.z0, ZC, F1, F1 + H, [[-1.7, -0.9, F1, F1 + 2.1]], 0.01);
    solidWallAlongZ(pen, 1.1, 1.2, 0.6, ZC, F1, F1 + H, [], 0.01);
    solidWallAlongZ(pen, VOID.x1, VOID.x1 + 0.1, Z0, ZC, F1, F1 + H, [[-3.7, -2.9, F1, F1 + 2.1]], 0.01);
    for (const x of [-0.95, 1.15, VOID.x1 + 0.05]) cutBox(pen, x - 0.05, x + 0.05, F1, ROOF - SL, zc, "isolant", "medium");
    bed(L.sub(-5.0, Z0, 0), 1.6, 2.0);
    desk(L.sub(-6.9, 1.6, 3), 1.4, 0.6);
    wardrobe(L.sub(-1.05, -0.8, 1), 1.9, { h: 2.3 });
    shower(L.sub(1.1, 3.95, 2), 0.9, { h: 2.2 });
    basin(L.sub(-0.9, 2.2, 3), 0.8);
    wc(L.sub(-0.9, 1.4, 3));
    for (let z = 0.8; z < ZC; z += 0.3) L.seg("hair", [-0.9, 0.01, z], [1.1, 0.01, z]);
    bed(L.sub(7.0, -1.8, 1), 1.4, 1.9);
    desk(L.sub(6.9, 3.95, 2), 1.2, 0.6);
    L.label("hair", "CHAMBRE", [-4.0, 0.02, 3.4], 0.3);
    L.label("hair", "SDB", [0.1, 0.02, 3.0], 0.26);
    L.label("hair", "CHAMBRE", [6.2, 0.02, 3.4], 0.26);
    person(pen, 2.6, -2.5, { y: F1, h: 1.66, face: 0.6 });
  }
  /* brasseurs d'air sous les dalles apparentes */
  for (const [x, z, yc] of [[-4.0, 0.6, F1 - SL], [5.9, 1.0, F1 - SL], [-4.0, 0.6, ROOF - SL]]) {
    pen.seg("medium", [x, yc, z], [x, yc - 0.45, z]);
    pen.circle("medium", [x, yc - 0.45, z], 0.16, { n: 10 });
    for (const a of [0, 2.09, 4.19]) {
      pen.poly("medium", [[x, yc - 0.45, z], [x + Math.cos(a) * 0.75, yc - 0.48, z + Math.sin(a) * 0.75], [x + Math.cos(a - 0.25) * 0.7, yc - 0.48, z + Math.sin(a - 0.25) * 0.7]]);
    }
  }

  /* ========================= soleil, air ========================= */
  const C = [1, 0.5, 0];
  const RS = 17.5;
  pen.circle("hair", C, RS, { axis: "z", n: 48, a0: Math.PI * 0.04, a1: Math.PI * 0.96 });
  const aS = (65 * Math.PI) / 180;
  const sunS = [C[0] + Math.cos(aS) * RS, C[1] + Math.sin(aS) * RS, 0];
  pen.circle("strong", sunS, 1.1, { axis: "z", n: 22 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    pen.seg("faint", [sunS[0] + Math.cos(a) * 1.35, sunS[1] + Math.sin(a) * 1.35, 0], [sunS[0] + Math.cos(a) * 1.75, sunS[1] + Math.sin(a) * 1.75, 0]);
  }
  /* été : le rayon rasant l'about de la casquette tombe devant le vitrage */
  const edge = [BS, ROOF - SL, zc];
  const tS = Math.tan(aS);
  const hitS = [edge[0] - (edge[1] - F1) / tS, F1, zc];
  pen.dashedCurve([[sunS[0], sunS[1], zc], edge, hitS], { dash: 0.5, gap: 0.4, opacity: 0.6 });
  const edge2 = [8.9, F1 - 0.28, zc];
  const hitS2 = [edge2[0] - (edge2[1] - F0) / tS, F0, zc];
  pen.dashedCurve([[edge2[0] + 4 / tS, edge2[1] + 4, zc], edge2, hitS2], { dash: 0.5, gap: 0.4, opacity: 0.55 });
  angleMark(pen, hitS2, aS, "65°");
  /* hiver : le soleil bas traverse jusqu'au mur lourd */
  const aW = (20 * Math.PI) / 180;
  const sunW = [C[0] + Math.cos(aW) * RS, C[1] + Math.sin(aW) * RS, 0];
  pen.circle("medium", sunW, 0.85, { axis: "z", n: 16 });
  const tW = Math.tan(aW);
  const hitW = [edge2[0] - (edge2[1] - F0) / tW, F0, zc];
  pen.dashedCurve([[edge2[0] + 7.5, edge2[1] + 7.5 * tW, zc], edge2, hitW], { dash: 0.8, gap: 0.6, opacity: 0.7 });
  angleMark(pen, hitW, aW, "20°");
  pen.hatch("hair", [hitW[0] + 0.1, F0 + 0.01, Z0 + 0.6], [X1 - hitW[0] - 0.3, 0, 0], [0, 0, ZC - Z0 - 0.8], 16);

  /* air : puits canadien → séjour → double hauteur → lanterneau */
  pen.dashedCurve(
    [[-15.6, -1.4, zc - 0.5], [-7.8, -1.0, zc - 0.5], [-6.4, F0 + 0.4, 1.2], [-2.4, F0 + 0.9, 1.0], [2.5, F0 + 1.6, 0.6], [3.0, F1 + 1.6, 0.6], [3.0, ROOF + 0.9, 0.8], [LAN.x0 - 1.4, LAN.top - 0.2, 1.0]],
    { dash: 0.55, gap: 0.4, opacity: 0.8 }
  );
  pen.poly("strong", [[LAN.x0 - 1.15, LAN.top - 0.55, 1.0], [LAN.x0 - 1.55, LAN.top - 0.15, 1.0], [LAN.x0 - 1.0, LAN.top - 0.05, 1.0]]);
  pen.dashedCurve([[X0 - 2.0, F1 + 1.4, -2.4], [-4.0, F1 + 1.7, -2.2], [0.6, F1 + 2.0, -2.0], [3.2, F1 + 2.4, -1.6], [3.2, ROOF + 1.1, -0.8]], { dash: 0.45, gap: 0.4, opacity: 0.5 });

  /* ========================= végétation ========================= */
  tree(pen, 15.6, -2.2, { h: 9.0, r: 3.0, lean: -0.1 });
  pen.hatch("hair", [12.5, 0.01, -4.6], [6.0, 0, 0], [0, 0, 4.8], 9);
  conifer(pen, -17.4, -2.2, 7.2);
  conifer(pen, -19.6, 1.4, 8.0);
  for (const [x, z, s] of [[11.2, 3.2, 1.2], [15.8, -2.8, 1.3], [-9.2, 3.0, 1.1], [-15.0, 3.4, 1.0]]) tuft(pen, x, 0, z, s);
  person(pen, 12.2, 2.6, { y: 0, h: 1.72, face: 2.6 });

  return pen.build(ink);
}
