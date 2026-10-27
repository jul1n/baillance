import { Pen, person, planterRow, dimChain, levelMark, insulation } from "../lineKit.js";
import {
  Local, bed, sofa, armchair, chair, table, coffeeTable, rug, kitchen, wardrobe, shelves, desk,
  bathtub, shower, wc, basin, washer, plant, piano, glassRail,
} from "../planKit.js";

/**
 * LOGEMENT DE QUALITÉ — axonométrie éclatée d'un duplex traversant.
 * Les deux niveaux sont décollés (tracés de rappel en tirets) pour lire
 * chaque plan coupé à 1,15 m (0,50 m pour les murs côté observateur) ;
 * ce qui est au-dessus est rappelé en tirets
 * (trémie de la double hauteur, meubles hauts, suspensions, verrière) :
 *  - niveau bas : entrée, cuisine ouverte, séjour en double hauteur
 *    (5,70 m) bordé d'une bibliothèque, coin piano, loggia profonde ;
 *  - niveau haut : suite parentale, deux chambres, bureau en mezzanine
 *    sur le vide, balcon ;
 *  - rives des planchers en coupe et « carotte » éclatée du plancher
 *    acoustique : parquet, chape flottante, résilient, dalle, plénum,
 *    faux plafond.
 */

const W0 = -5.65;
const W1 = 5.65;
const XI0 = -5.4;
const XI1 = 5.4;
const ZN = -5.0;
const ZS = 5.0;
const LZ = 7.0;
const UP = 6.0;
const H = 1.15;
const HF = 0.5;
const PT = 0.48;
const VX = 0.6;
const VZ = 0.8;
const ST = { x0: 4.3, x1: 5.4, z0: -4.1, z1: 0.25 };

/* ----------------------------- planchers ----------------------------- */

/** Hachure à 45° sur la face verticale passant par a→b (horizontaux). */
function faceHatch(pen, w, a, b, y0, y1, step = 0.1) {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
  const Hh = y1 - y0;
  for (let c = -Hh; c < L; c += step) {
    const s0 = Math.max(0, c);
    const s1 = Math.min(L, c + Hh);
    if (s1 <= s0) continue;
    pen.seg(w, [a[0] + u[0] * s0, y0 + (s0 - c), a[1] + u[1] * s0], [a[0] + u[0] * s1, y0 + (s1 - c), a[1] + u[1] * s1]);
  }
}

/** Rive de plancher en coupe : parquet, chape, résilient, dalle, plénum, faux plafond. */
function slabEdge(pen, a, b, yTop, n) {
  const off = (p, d) => [p[0] + n[0] * d, p[1] + n[1] * d];
  const A = off(a, 0.006);
  const B = off(b, 0.006);
  const line = (w, y) => pen.seg(w, [A[0], y, A[1]], [B[0], y, B[1]]);
  line("hair", yTop - 0.02);
  line("faint", yTop - 0.08);
  insulation(pen, [A[0], yTop - 0.105, A[1]], [B[0] - A[0], 0, B[1] - A[1]], [0, 0.025, 0], { w: "hair", step: 0.14 });
  line("medium", yTop - 0.11);
  line("medium", yTop - 0.34);
  faceHatch(pen, "hair", A, B, yTop - 0.34, yTop - 0.11, 0.09);
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
  for (let s = 0.3; s < L; s += 0.6) {
    const t = s / L;
    const x = A[0] + (B[0] - A[0]) * t;
    const z = A[1] + (B[1] - A[1]) * t;
    pen.seg("hair", [x, yTop - 0.34, z], [x, yTop - 0.455, z]);
  }
  line("faint", yTop - 0.455);
}

/** Plaque de plancher : contour, rives en coupe, volumes masquants. */
function plate(pen, poly, yTop, rects, { holes = [] } = {}) {
  const loop = [...poly, poly[0]];
  pen.poly("strong", loop.map(([x, z]) => [x, yTop, z]));
  pen.poly("faint", loop.map(([x, z]) => [x, yTop - PT, z]));
  for (const [x, z] of poly) pen.seg("medium", [x, yTop, z], [x, yTop - PT, z]);
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, z1] = poly[i];
    const [x2, z2] = poly[(i + 1) % poly.length];
    area += x1 * z2 - x2 * z1;
  }
  const sgn = Math.sign(area);
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = [(-sgn * (b[1] - a[1])) / L, (sgn * (b[0] - a[0])) / L];
    slabEdge(pen, a, b, yTop, n);
  }
  for (const h of holes) {
    pen.poly("medium", [...h, h[0]].map(([x, z]) => [x, yTop, z]));
    for (const [x, z] of h) pen.seg("faint", [x, yTop, z], [x, yTop - PT, z]);
  }
  for (const [x0, x1, z0, z1] of rects) pen.solid([x0, yTop - PT, z0], [x1 - x0, PT, z1 - z0], 0.02);
}

/** Cloison légère masquante. */
const cl = (L, ax, az, bx, bz, openings = []) => L.wall(ax, az, bx, bz, { t: 0.08, h: H, openings, w: "medium", base: false, solid: true });

/** Parquet : lames dans une pièce rectangulaire (repère local). */
function parquet(L, x0, x1, z0, z1, step = 0.18, alongX = true) {
  if (alongX) for (let z = z0 + step; z < z1; z += step) L.seg("hair", [x0, 0.006, z], [x1, 0.006, z]);
  else for (let x = x0 + step; x < x1; x += step) L.seg("hair", [x, 0.006, z0], [x, 0.006, z1]);
}

/** Carrelage : quadrillage. */
function tiles(L, x0, x1, z0, z1, step = 0.3) {
  for (let z = z0 + step; z < z1; z += step) L.seg("hair", [x0, 0.006, z], [x1, 0.006, z]);
  for (let x = x0 + step; x < x1; x += step) L.seg("hair", [x, 0.006, z0], [x, 0.006, z1]);
}

/* ------------------------- la carotte de plancher ------------------------- */

function core(pen) {
  const x0 = -10.6;
  const x1 = -9.2;
  const z0 = -4.0;
  const z1 = -2.6;
  const layers = [
    ["PARQUET CHENE", 0.07, "parquet"],
    ["CHAPE FLOTTANTE", 0.17, "chape"],
    ["RESILIENT", 0.06, "resilient"],
    ["DALLE BETON", 0.42, "beton"],
    ["PLENUM", 0.32, "plenum"],
    ["FAUX PLAFOND", 0.05, "fp"],
  ];
  let y = 7.4;
  for (const [name, t, kind] of layers) {
    const yb = y - t;
    if (kind === "plenum") {
      for (const [x, z] of [[x0 + 0.3, z0 + 0.3], [x1 - 0.3, z0 + 0.3], [x0 + 0.3, z1 - 0.3], [x1 - 0.3, z1 - 0.3]]) {
        pen.seg("faint", [x, y + 0.3, z], [x, yb - 0.3, z]);
      }
    } else {
      pen.box(kind === "beton" ? "strong" : "medium", [x0, yb, z0], [x1 - x0, t, z1 - z0]);
      pen.solid([x0, yb, z0], [x1 - x0, t, z1 - z0], 0.01);
      if (kind === "parquet") for (let z = z0 + 0.12; z < z1; z += 0.12) pen.seg("hair", [x0, y + 0.004, z], [x1, y + 0.004, z]);
      if (kind === "beton") {
        faceHatch(pen, "faint", [x0 - 0.005, z0], [x0 - 0.005, z1], yb, y, 0.08);
        faceHatch(pen, "faint", [x0, z1 + 0.005], [x1, z1 + 0.005], yb, y, 0.08);
        for (const z of [z0 + 0.25, z0 + 0.7, z0 + 1.15]) pen.circle("hair", [x0 - 0.006, yb + 0.08, z], 0.03, { axis: "x", n: 6 });
      }
      if (kind === "resilient") {
        insulation(pen, [x0 - 0.006, yb, z0], [0, 0, z1 - z0], [0, t, 0], { w: "hair", step: 0.1 });
        insulation(pen, [x0, yb, z1 + 0.006], [x1 - x0, 0, 0], [0, t, 0], { w: "hair", step: 0.1 });
      }
      if (kind === "chape") {
        for (let i = 0; i < 9; i++) pen.circle("hair", [x0 - 0.006, yb + 0.04 + (i % 3) * 0.045, z0 + 0.1 + i * 0.14], 0.012, { axis: "x", n: 4 });
      }
    }
    const ym = (y + yb) / 2 - 0.1;
    pen.seg("hair", [x0 - 0.01, ym + 0.1, z0 - 0.05], [x0 - 0.01, ym + 0.1, z0 - 0.45]);
    pen.text("faint", name, [x0 - 0.01, ym, z0 - 0.55], [0, 0, 1], [0, 1, 0], 0.22, { align: "end" });
    y = yb - 0.3;
  }
  pen.text("medium", "PLANCHER ACOUSTIQUE", [x0 - 0.01, 7.9, z1], [0, 0, 1], [0, 1, 0], 0.26, { align: "end" });
  pen.seg("faint", [x0 - 0.01, 7.8, z1], [x0 - 0.01, 7.8, z1 - 4.4]);
}

export function buildQuality(ink) {
  const pen = new Pen({ wobble: 0.018 });

  /* =============================== PLANCHERS =============================== */
  plate(pen, [[W0, ZN], [W1, ZN], [W1, ZS], [W0, ZS]], 0, [[W0, W1, ZN, ZS]]);
  plate(pen, [[W0, ZS], [W1, ZS], [W1, LZ], [W0, LZ]], -0.05, [[W0, W1, ZS, LZ]]);
  plate(
    pen,
    [[W0, ZN], [W1, ZN], [W1, ZS], [VX, ZS], [VX, VZ], [W0, VZ]],
    UP,
    [
      [W0, ST.x0, ZN, VZ], [ST.x0, ST.x1, ZN, ST.z0], [ST.x0, ST.x1, ST.z1, VZ],
      [ST.x1, W1, ZN, VZ], [VX, W1, VZ, ZS],
    ],
    { holes: [[[ST.x0, ST.z0], [ST.x1, ST.z0], [ST.x1, ST.z1], [ST.x0, ST.z1]]] }
  );
  plate(pen, [[2.2, ZS], [W1, ZS], [W1, 6.3], [2.2, 6.3]], UP - 0.05, [[2.2, W1, ZS, 6.3]]);

  /* tracés de rappel entre les niveaux */
  for (const [x, z] of [[W0, ZN], [W1, ZN], [W1, ZS], [W0, VZ], [VX, ZS], [VX, VZ]]) {
    pen.dashed("hair", [x, 0, z], [x, UP - PT, z], { dash: 0.28, gap: 0.22 });
  }
  for (const x of [ST.x0, ST.x1]) pen.dashed("faint", [x, 3.0, ST.z1], [x, UP, ST.z1], { dash: 0.2, gap: 0.16 });
  pen.text("hair", "DOUBLE HAUTEUR 5.70", [-2.4, UP + 0.02, 2.9], [1, 0, 0], [0, 0, -1], 0.34, { align: "center" });
  pen.rect("hair", [W0 + 0.25, UP - PT, VZ], [VX - W0 - 0.25, 0, 0], [0, 0, ZS - VZ - 0.15]);

  /* ============================== NIVEAU BAS ============================== */
  const lo = new Local(pen, { x: 0, y: 0, z: 0 });
  lo.wall(-5.525, ZN, -5.525, LZ, { t: 0.25, h: HF, poche: true, solid: true });
  lo.wall(5.525, ZN, 5.525, LZ, { t: 0.25, h: H, poche: true, solid: true });
  lo.wall(XI0, -4.85, XI1, -4.85, {
    t: 0.3, h: H, poche: true, solid: true, ite: -1,
    openings: [
      { at: 1.1, w: 1.8, kind: "window", sill: 1.05, inside: 1 },
      { at: 8.1, w: 1.0, kind: "door", side: 1, hinge: "b" },
    ],
  });
  lo.wall(XI0, 4.85, XI1, 4.85, {
    t: 0.3, h: HF, poche: true, solid: true, ite: 1,
    openings: [
      { at: 0.5, w: 4.2, kind: "baie" },
      { at: 5.6, w: 1.6, kind: "french", inside: -1 },
      { at: 8.0, w: 2.0, kind: "baie" },
    ],
  });
  cl(lo, 1.55, -4.7, 1.55, -0.4, [{ at: 0.7, w: 1.4, kind: "void" }]);
  cl(lo, 1.6, -2.35, 4.25, -2.35, [
    { at: 0.15, w: 0.7, kind: "door", side: -1, hinge: "a" },
    { at: 1.4, w: 0.75, kind: "door", side: -1, hinge: "b" },
  ]);
  cl(lo, 2.75, -2.35, 2.75, -0.4);
  cl(lo, 1.55, -0.4, 4.25, -0.4);
  cl(lo, 4.25, -2.35, 4.25, 0.3);

  /* cuisine ouverte : linéaire sous la fenêtre, îlot, tabourets */
  tiles(lo, XI0, 1.5, -4.7, -1.4, 0.45);
  kitchen(lo.sub(-5.3, -4.7, 0), 4.6, { sink: 0.42, hob: 0.75, h: H });
  lo.box("medium", [-3.8, 0, -2.7], [2.6, 0.92, 0.95]);
  lo.rect("faint", [-3.85, 0.94, -2.75], [2.7, 0, 0], [0, 0, 1.25]);
  for (const x of [-3.3, -2.5, -1.7]) {
    lo.circle("faint", [x, 0.66, -1.2], 0.17, { n: 10 });
    lo.seg("hair", [x, 0, -1.2], [x, 0.66, -1.2]);
  }
  /* séjour : repas, salon, bibliothèque, piano */
  parquet(lo, XI0, 4.25, -1.4, 4.7, 0.2);
  table(lo.sub(-0.9, -0.1, 0), 2.2, 1.0, { chairs: 3 });
  rug(lo.sub(-4.9, 1.5, 0), 3.6, 2.8);
  sofa(lo.sub(-1.1, 1.6, 1), 2.6, 0.95);
  armchair(lo.sub(-5.0, 3.6, 3));
  armchair(lo.sub(-5.0, 2.5, 3));
  coffeeTable(lo.sub(-3.6, 2.3, 0), 1.2, 0.6);
  shelves(lo.sub(-5.4, 4.2, 3), 7.6, { h: H, d: 0.35 });
  plant(lo.sub(-4.6, 4.35, 0), 1.3);
  lo.curve("medium", [[-4.6, 0, 1.3], [-4.55, 1.5, 1.2], [-4.1, 1.75, 1.6]], 10);
  piano(lo.sub(2.9, 1.1, 0));
  armchair(lo.sub(5.3, 3.4, 1));
  /* entrée, wc, cellier */
  lo.box("faint", [1.7, 0, -3.4], [0.45, 0.45, 0.9]);
  for (let i = 0; i < 4; i++) lo.seg("hair", [1.62, 1.35, -3.6 + i * 0.3], [1.85, 1.2, -3.6 + i * 0.3]);
  tiles(lo, 1.6, 4.25, -4.7, -2.4, 0.4);
  wc(lo.sub(2.55, -0.45, 2));
  basin(lo.sub(1.6, -1.3, 3), 0.45);
  washer(lo.sub(4.2, -2.3, 1));
  shelves(lo.sub(4.2, -0.45, 2), 1.35, { h: H, d: 0.4 });
  /* escalier droit, complet jusqu'au niveau haut réel (+3,00) */
  {
    const n = 17;
    const rise = 3.0 / n;
    const tread = (ST.z1 - ST.z0) / (n - 1);
    for (let i = 0; i < n; i++) {
      const z = ST.z0 + i * tread;
      const y = (i + 1) * rise;
      pen.seg("medium", [ST.x0, y, z], [ST.x1, y, z]);
      for (const x of [ST.x0, ST.x1]) {
        pen.seg("hair", [x, y - rise, z], [x, y, z]);
        if (i < n - 1) pen.seg("hair", [x, y, z], [x, y, z + tread]);
      }
    }
    pen.seg("medium", [ST.x0, -0.2, ST.z0], [ST.x0, 3.0 - 0.25, ST.z1]);
    pen.seg("strong", [ST.x0 + 0.04, 0.95, ST.z0], [ST.x0 + 0.04, 3.95, ST.z1]);
    for (let i = 0; i < n; i += 2) {
      const z = ST.z0 + i * tread;
      const y = (i + 1) * rise;
      pen.seg("hair", [ST.x0 + 0.04, y, z], [ST.x0 + 0.04, y + 0.95, z]);
    }
  }
  /* loggia : terrasse bois, table, jardinières, brise-soleil coulissants */
  for (let z = ZS + 0.15; z < LZ; z += 0.14) pen.seg("hair", [XI0, -0.044, z], [XI1, -0.044, z]);
  table(lo.sub(-3.4, 5.65, 0), 1.6, 0.7, { chairs: 2 });
  lo.box("faint", [0.4, -0.05, 6.5], [4.8, 0.45, 0.38]);
  planterRow(pen, [0.7, 0.4, 6.7], [4.9, 0.4, 6.7], 8, 0.85);
  glassRail(lo, [XI0, 6.95], [XI1, 6.95], { h: 1.0, y: -0.05 });
  for (const x0 of [-1.6, 0.6]) {
    pen.rect("medium", [x0, -0.05, LZ + 0.06], [2.0, 0, 0], [0, 2.65, 0]);
    for (let i = 1; i < 12; i++) pen.seg("hair", [x0, -0.05 + i * 0.22, LZ + 0.06], [x0 + 2.0, -0.05 + i * 0.22, LZ + 0.06]);
  }
  pen.seg("faint", [XI0, 2.62, LZ + 0.06], [XI1, 2.62, LZ + 0.06]);
  plant(lo.sub(-5.0, 6.4, 0), 1.2);

  /* au-dessus du plan de coupe, en tirets : trémie, meubles hauts, suspensions */
  lo.dashed("faint", [XI0, 0.01, VZ], [VX, 0.01, VZ], { dash: 0.3, gap: 0.2 });
  lo.dashed("faint", [VX, 0.01, VZ], [VX, 0.01, 4.7], { dash: 0.3, gap: 0.2 });
  lo.dashed("hair", [-5.3, 0.01, -4.35], [-1.3, 0.01, -4.35], { dash: 0.2, gap: 0.15 });
  for (const [x, z, r] of [[-0.2, 0.4, 0.22], [0.6, 0.4, 0.22], [-3.2, -2.2, 0.16], [-2.5, -2.2, 0.16], [-1.8, -2.2, 0.16]]) {
    lo.circle("hair", [x, 0.012, z], r, { n: 12 });
  }
  lo.circle("faint", [-2.6, 0.012, 2.8], 0.55, { n: 18 });
  lo.circle("hair", [-2.6, 0.012, 2.8], 0.25, { n: 12 });
  lo.seg("hair", [-3.3, 0.012, 2.8], [-1.9, 0.012, 2.8]);
  lo.seg("hair", [-2.6, 0.012, 2.1], [-2.6, 0.012, 3.5]);
  /* coussins, transat, porte-manteau */
  for (let i = 0; i < 3; i++) lo.rect("hair", [-1.92, 0.44, 1.75 + i * 0.8], [0.0, 0.35, 0], [0, 0, 0.6]);
  lo.poly("medium", [[2.6, 0.0, 5.3], [2.6, 0.35, 6.6], [2.6, 0.75, 6.9]]);
  lo.poly("medium", [[3.2, 0.0, 5.3], [3.2, 0.35, 6.6], [3.2, 0.75, 6.9]]);
  lo.seg("faint", [2.6, 0.35, 6.6], [3.2, 0.35, 6.6]);
  lo.seg("faint", [2.6, 0.0, 5.3], [3.2, 0.0, 5.3]);
  lo.label("faint", "SEJOUR 49 m²", [-3.0, 0.02, 4.6], 0.32);
  lo.label("faint", "CUISINE 18 m²", [-2.4, 0.02, -3.25], 0.3);
  lo.label("hair", "ENTREE", [2.9, 0.02, -2.65], 0.24);
  lo.label("hair", "WC", [2.15, 0.02, -1.55], 0.2);
  lo.label("hair", "CELLIER", [3.4, 0.02, -1.2], 0.2);
  lo.label("faint", "LOGGIA 21 m²", [-0.4, 0.0, 5.55], 0.3);
  person(pen, -0.6, -2.3, { h: 1.7, face: 2.2 });
  person(pen, -3.1, 3.7, { h: 1.68, face: -0.6 });
  person(pen, 4.7, 1.7, { h: 1.15, face: 2.6 });
  person(pen, 1.3, 6.0, { y: -0.05, h: 1.72, face: 1.2 });

  /* ============================== NIVEAU HAUT ============================== */
  const up = new Local(pen, { x: 0, y: UP, z: 0 });
  up.wall(-5.525, ZN, -5.525, VZ, { t: 0.25, h: HF, poche: true, solid: true });
  up.wall(5.525, ZN, 5.525, 6.3, { t: 0.25, h: H, poche: true, solid: true });
  up.wall(XI0, -4.85, XI1, -4.85, {
    t: 0.3, h: H, poche: true, solid: true, ite: -1,
    openings: [
      { at: 1.1, w: 1.6, kind: "window", sill: 0.95, inside: 1 },
      { at: 4.8, w: 1.2, kind: "window", sill: 1.05, inside: 1 },
      { at: 7.5, w: 1.4, kind: "window", sill: 0.95, inside: 1 },
    ],
  });
  up.wall(VX, 4.85, XI1, 4.85, {
    t: 0.3, h: HF, poche: true, solid: true, ite: 1,
    openings: [
      { at: 0.15, w: 1.25, kind: "window", sill: 0.5, inside: -1 },
      { at: 2.1, w: 2.0, kind: "baie" },
    ],
  });
  cl(up, XI0, -0.7, 4.25, -0.7, [
    { at: 3.1, w: 0.8, kind: "door", side: -1, hinge: "a" },
    { at: 4.5, w: 0.7, kind: "door", side: 1, hinge: "b" },
    { at: 5.75, w: 0.95, kind: "void" },
    { at: 8.0, w: 0.8, kind: "door", side: -1, hinge: "b" },
  ]);
  cl(up, -1.15, -4.7, -1.15, -0.7, [{ at: 0.8, w: 0.7, kind: "door", side: 1, hinge: "a" }]);
  cl(up, -1.1, -2.18, 1.45, -2.18, [{ at: 1.55, w: 0.7, kind: "door", side: -1, hinge: "b" }]);
  cl(up, 0.25, -2.18, 0.25, -0.7);
  cl(up, 1.45, -4.7, 1.45, -0.7);
  cl(up, 4.25, -4.7, 4.25, -0.7);
  cl(up, 2.15, 1.5, XI1, 1.5, [{ at: 2.3, w: 0.8, kind: "door", side: 1, hinge: "b" }]);
  cl(up, 2.15, 1.5, 2.15, 4.7);
  /* garde-corps vitrés sur le vide et la trémie */
  glassRail(up, [XI0, VZ], [VX, VZ]);
  glassRail(up, [VX, VZ], [VX, 4.7]);
  glassRail(up, [4.25, -0.7], [4.25, ST.z1]);
  glassRail(up, [ST.x0, ST.z0], [ST.x1, ST.z0]);

  /* suite parentale : chambre, dressing, salle de bains */
  parquet(up, XI0, -1.2, -4.7, -0.75, 0.18, false);
  bed(up.sub(-5.3, -1.3, 3), 1.8, 2.0);
  wardrobe(up.sub(-1.2, -3.1, 1), 1.6);
  armchair(up.sub(-3.2, -4.55, 0));
  rug(up.sub(-4.9, -3.4, 0), 2.4, 1.5);
  tiles(up, -1.1, 1.4, -4.7, -2.2);
  bathtub(up.sub(-1.05, -4.68, 0), 1.7, 0.75);
  basin(up.sub(1.38, -3.85, 1), 1.3);
  shower(up.sub(-1.05, -2.22, 3), 0.85, { h: H });
  wc(up.sub(-1.05, -1.1, 3));
  shelves(up.sub(1.4, -2.15, 1), 1.3, { h: H, d: 0.35 });
  /* chambre 2 */
  parquet(up, 1.5, 4.2, -4.7, -0.75, 0.18, false);
  bed(up.sub(4.2, -3.6, 1), 1.4, 1.9);
  desk(up.sub(1.55, -4.65, 0), 1.1, 0.6);
  wardrobe(up.sub(1.55, -0.78, 3), 1.2);
  /* bureau en mezzanine sur le séjour */
  parquet(up, VX, 2.1, VZ, 4.7, 0.18, false);
  desk(up.sub(2.1, 1.0, 1), 1.4, 0.65);
  shelves(up.sub(2.1, 2.6, 1), 1.9, { h: H, d: 0.35 });
  plant(up.sub(-5.0, 0.1, 0), 1.0);
  /* chambre 3 et son balcon */
  parquet(up, 2.2, XI1, 1.55, 4.7, 0.18, false);
  bed(up.sub(2.25, 4.0, 3), 1.6, 2.0);
  wardrobe(up.sub(5.35, 2.5, 1), 1.8);
  glassRail(up, [2.25, 6.25], [XI1, 6.25], { y: -0.05 });
  glassRail(up, [2.25, ZS], [2.25, 6.25], { y: -0.05 });
  chair(up.sub(3.0, 5.2, 0));
  up.box("faint", [4.0, -0.05, 5.8], [1.3, 0.42, 0.34]);
  for (let i = 0; i < 3; i++) up.tuft(4.25 + i * 0.4, 0.37, 5.97, 0.6);

  /* verrière zénithale au-dessus de l'escalier, sèche-serviettes, banquette */
  up.dashed("faint", [ST.x0 + 0.1, 0.01, ST.z0 + 0.2], [ST.x1 - 0.1, 0.01, ST.z0 + 0.2], { dash: 0.2, gap: 0.15 });
  up.dashed("faint", [ST.x0 + 0.1, 0.01, ST.z0 + 2.2], [ST.x1 - 0.1, 0.01, ST.z0 + 2.2], { dash: 0.2, gap: 0.15 });
  for (const x of [ST.x0 + 0.1, ST.x1 - 0.1]) up.dashed("faint", [x, 0.01, ST.z0 + 0.2], [x, 0.01, ST.z0 + 2.2], { dash: 0.2, gap: 0.15 });
  up.rect("faint", [-1.08, 0.35, -2.0], [0, 0.75, 0], [0, 0, -0.55]);
  for (let i = 1; i < 6; i++) up.seg("hair", [-1.08, 0.35 + i * 0.125, -2.0], [-1.08, 0.35 + i * 0.125, -2.55]);
  up.box("faint", [-3.2, 0, -1.05], [0.4, 0.45, 1.4]);
  for (const [x, z] of [[-4.3, -2.2], [3.2, -2.9], [3.25, 3.2]]) up.circle("hair", [x, 0.012, z], 0.2, { n: 10 });
  up.label("faint", "CHAMBRE 17 m²", [-4.1, 0.02, -4.2], 0.28);
  up.label("hair", "SDB 7 m²", [0.35, 0.02, -2.5], 0.22);
  up.label("hair", "WC", [-0.4, 0.02, -1.85], 0.2);
  up.label("faint", "CHAMBRE 11 m²", [3.0, 0.02, -1.75], 0.26);
  up.label("faint", "CHAMBRE 10 m²", [3.4, 0.02, 4.6], 0.26);
  up.label("hair", "BUREAU", [1.3, 0.02, 4.45], 0.22);
  person(pen, -3.0, 0.1, { y: UP, h: 1.7, face: 0.5 });
  person(pen, 1.0, 3.4, { y: UP, h: 1.66, face: -1.6 });
  person(pen, 4.6, 5.7, { y: UP - 0.05, h: 1.7, face: 2.4 });

  /* ============================ ANNOTATIONS ============================ */
  core(pen);
  levelMark(pen, [W1 + 0.3, -0.05, LZ], "+0.00", { dir: 1 });
  levelMark(pen, [W1 + 0.3, UP - 0.05, 6.3], "+3.00", { dir: 1 });
  dimChain(pen, [W0, W1], { along: "x", at: LZ + 1.0, from: LZ, size: 0.4 });
  dimChain(pen, [ZN, ZS, LZ], { along: "z", at: W1 + 1.0, from: W1, size: 0.4 });

  return pen.build(ink);
}
