import * as THREE from "three";
import { Pen, add, mul, bay, balustrade, tree, person, tuft, bike, dimChain } from "../lineKit.js";
import {
  Local, bed, sofa, armchair, chair, table, rug, kitchen, wardrobe, desk, bathtub, wc, basin, shelves,
  plant, coffeeTable,
} from "../planKit.js";

/**
 * URBANISME ET MIXITÉ — un angle de ville haussmannien en gradins.
 * L'aile sur le boulevard descend niveau par niveau vers le spectateur :
 * chaque ressaut est un plan coupé à 1,20 m qui révèle un usage —
 * logement au R+3, appartement de l'étage noble au R+2, cabinet au R+1,
 * boulangerie en rez-de-chaussée — et chaque contremarche est une coupe
 * (planchers et murs pochés). L'angle à pan coupé garde sa pleine
 * hauteur, son dôme, ses mansardes ; au pied : tram, vélos, terrasses,
 * canopée, crèche en cœur d'îlot.
 */

const FL = [0, 3.6, 6.4, 9.2, 12.0];
const H = 15.0;
const HM = 17.4;
const CUT = 1.2;
const ZF = 4;
const ZB = -6;
const XE = 4;
const PCA = [1.2, ZF];
const PCB = [XE, 1.2];
const BZ1 = -22;
const STEPS = [
  { x0: -11, fs: 3 },
  { x0: -16, fs: 2 },
  { x0: -21, fs: 1 },
  { x0: -26, fs: 0 },
];
const SW = 5;
const BAYS_A = Array.from({ length: 11 }, (_, i) => 0.25 - 2.5 * i);
const BAYS_B = Array.from({ length: 9 }, (_, i) => 0.4 + 2.5 * i);
const FLOOR = [
  null,
  { sill: 0.75, h: 2.05, kind: "window", rail: 4 },
  { sill: 0.05, h: 2.35, kind: "french" },
  { sill: 0.8, h: 1.8, kind: "window", rail: 4 },
  { sill: 0.05, h: 2.2, kind: "french" },
];
const BALC = [2, 4];

const SOUTH = { o: [0, 0, ZF], u: [1, 0, 0], n: [0, 0, 1] };
const COURT_A = { o: [0, 0, ZB], u: [1, 0, 0], n: [0, 0, -1] };
const EAST = { o: [XE, 0, 0], u: [0, 0, -1], n: [1, 0, 0] };
const COURT_B = { o: [-6, 0, 0], u: [0, 0, -1], n: [-1, 0, 0] };
const PC_LEN = Math.hypot(PCB[0] - PCA[0], PCB[1] - PCA[1]);
const PAN = {
  o: [PCA[0], 0, PCA[1]],
  u: [(PCB[0] - PCA[0]) / PC_LEN, 0, (PCB[1] - PCA[1]) / PC_LEN],
  n: [Math.SQRT1_2, 0, Math.SQRT1_2],
};
const at = (f, s, y, d = 0) => add(add(add(f.o, mul(f.u, s)), [0, y, 0]), mul(f.n, d));

/* plus haut niveau existant (en élévation) au droit de x sur l'aile A */
const topFloorAt = (x) => {
  const st = STEPS.find((s) => x >= s.x0 && x < s.x0 + SW);
  return st ? st.fs - 1 : 4;
};

/* --------------------------- façade haussmannienne --------------------------- */

/** Fenêtre à chambranle, agrafe, garde-corps d'appui. */
function hausBay(pen, f, s, fl, { court = false } = {}) {
  const sp = FLOOR[fl];
  const w = court ? 1.0 : 1.3;
  const y = FL[fl] + (court ? 0.9 : sp.sill);
  const h = court ? 1.5 : sp.h;
  bay(pen, f, s - w / 2, y, w, h, { kind: court ? "window" : sp.kind, rail: court ? 0 : sp.rail, coffre: false, depth: 0.3 });
  if (court) return;
  pen.rect("faint", at(f, s - w / 2 - 0.14, y - 0.06, 0.02), mul(f.u, w + 0.28), [0, h + 0.2, 0]);
  pen.rect("hair", at(f, s - 0.13, y + h + 0.03, 0.03), mul(f.u, 0.26), [0, 0.26, 0]);
}

/** Balcon filant : dalle, consoles, garde-corps en fonte. */
function balcon(pen, f, s0, s1, y, { consoles = true } = {}) {
  const d = 0.6;
  pen.poly("medium", [at(f, s0, y, 0), at(f, s0, y, d), at(f, s1, y, d), at(f, s1, y, 0)]);
  pen.poly("faint", [at(f, s0, y, d), at(f, s0, y - 0.16, d), at(f, s1, y - 0.16, d), at(f, s1, y, d)]);
  if (consoles) {
    for (let s = s0 + 0.6; s < s1 - 0.3; s += 1.25) {
      pen.poly("hair", [at(f, s, y - 0.16, 0), at(f, s, y - 0.55, 0), at(f, s, y - 0.16, 0.45)]);
    }
  }
  balustrade(pen, at(f, s0 + 0.05, y, d - 0.05), at(f, s1 - 0.05, y, d - 0.05), { h: 0.95, step: 0.19 });
}

/** Corniche saillante et ses modillons. */
function corniche(pen, f, s0, s1) {
  const P = (s, y, d) => at(f, s, y, d);
  pen.seg("strong", P(s0, H, 0.45), P(s1, H, 0.45));
  pen.seg("medium", P(s0, H - 0.4, 0.45), P(s1, H - 0.4, 0.45));
  pen.seg("faint", P(s0, H - 0.55, 0.02), P(s1, H - 0.55, 0.02));
  for (const s of [s0, s1]) pen.poly("medium", [P(s, H - 0.55, 0), P(s, H - 0.4, 0.45), P(s, H, 0.45), P(s, H, 0)]);
  for (let s = s0 + 0.15; s < s1; s += 0.32) pen.seg("hair", P(s, H - 0.4, 0.44), P(s, H - 0.55, 0.12));
}

/** Brisis de mansarde, joints debout du zinc, lucarnes au droit des travées. */
function mansard(pen, f, s0, s1, bays) {
  const P = (s, y, d) => at(f, s, y, d);
  const dep = 1.6;
  pen.seg("medium", P(s0, HM, -dep), P(s1, HM, -dep));
  for (const s of [s0, s1]) pen.seg("medium", P(s, H, 0), P(s, HM, -dep));
  for (let s = s0 + 0.45; s < s1; s += 0.45) pen.seg("hair", P(s, H + 0.05, -0.03), P(s, HM - 0.05, -dep + 0.03));
  for (const c of bays) {
    const w = 0.7;
    const yb = H + 0.25;
    const yt = H + 1.75;
    const dF = -0.45;
    pen.rect("medium", P(c - w, yb, dF), mul(f.u, 2 * w), [0, yt - yb, 0]);
    pen.rect("faint", P(c - w + 0.14, yb + 0.12, dF), mul(f.u, 2 * w - 0.28), [0, yt - yb - 0.24, 0]);
    pen.seg("hair", P(c, yb + 0.12, dF), P(c, yt - 0.12, dF));
    pen.poly("strong", [P(c - w - 0.1, yt, dF), P(c, yt + 0.55, dF), P(c + w + 0.1, yt, dF), P(c - w - 0.1, yt, dF)]);
    const back = (y) => (-dep * (y - H)) / (HM - H);
    pen.seg("faint", P(c, yt + 0.55, dF), P(c, yt + 0.55, back(yt + 0.55)));
    for (const sx of [c - w, c + w]) {
      pen.seg("faint", P(sx, yt, dF), P(sx, yt, back(yt)));
      pen.seg("hair", P(sx, yb, dF), P(sx, yb, back(yb)));
    }
  }
}

/** Souche de cheminée et ses mitrons. */
function chimney(pen, x, z, ax = "x") {
  const [dx, dz] = ax === "x" ? [1.6, 0.7] : [0.7, 1.6];
  pen.box("medium", [x - dx / 2, HM - 0.2, z - dz / 2], [dx, 1.7, dz]);
  pen.seg("faint", [x - dx / 2, HM + 1.3, z - dz / 2], [x + dx / 2, HM + 1.3, z - dz / 2]);
  for (let i = 0; i < 3; i++) {
    const t = (i + 0.5) / 3 - 0.5;
    const mx = x + (ax === "x" ? t * dx * 0.8 : 0);
    const mz = z + (ax === "x" ? 0 : t * dz * 0.8);
    pen.seg("medium", [mx, HM + 1.5, mz], [mx, HM + 2.05, mz]);
    pen.circle("hair", [mx, HM + 2.05, mz], 0.1, { n: 8 });
  }
}

/* --------------------------- coupes des contremarches --------------------------- */

function hatchX(pen, x, z0, z1, y0, y1, step = 0.22) {
  for (let c = z0 - (y1 - y0); c < z1; c += step) {
    const ya = Math.max(y0, y0 + (z0 - c));
    const yb = Math.min(y1, y0 + (z1 - c));
    if (yb > ya) pen.seg("hair", [x, ya, c + ya - y0], [x, yb, c + yb - y0]);
  }
}

/** Coupe verticale dans le plan x : planchers, façades et refend pochés. */
function sectionAt(pen, x, y0, y1) {
  const P = (z, y) => [x, y, z];
  pen.poly("strong", [P(ZB, y0), P(ZF, y0), P(ZF, Math.min(y1, H)), P(ZB, Math.min(y1, H)), P(ZB, y0)]);
  const slabs = [...FL, H].filter((y) => y > y0 + 0.1 && y <= y1 + 0.01);
  for (const y of slabs) {
    pen.rect("medium", P(ZB, y - 0.35), [0, 0, ZF - ZB], [0, 0.35, 0]);
    hatchX(pen, x, ZB, ZF, y - 0.35, y, 0.18);
    if (BALC.some((b) => FL[b] === y)) {
      pen.rect("medium", P(ZF, y - 0.16), [0, 0, 0.6], [0, 0.16, 0]);
      pen.seg("faint", P(ZF + 0.55, y), P(ZF + 0.55, y + 0.95));
    }
  }
  const top = Math.min(y1, H);
  for (const [za, zb] of [[ZF - 0.5, ZF], [ZB, ZB + 0.4], [-1.12, -0.88]]) {
    pen.rect("medium", P(za, y0), [0, 0, zb - za], [0, top - y0, 0]);
    hatchX(pen, x, za, zb, y0, top, 0.16);
  }
  if (y1 > H) {
    pen.poly("strong", [P(ZF, H), P(ZF - 1.6, HM), P(ZB + 1.6, HM), P(ZB, H)]);
    pen.poly("faint", [P(ZF + 0.45, H), P(ZF + 0.45, H - 0.4), P(ZF, H - 0.55)]);
    for (let z = ZB + 1.2; z < ZF - 1; z += 1.1) pen.seg("hair", P(z, H), P(z + 0.6, HM));
    pen.seg("faint", P(ZB + 0.9, H + 2.2), P(ZF - 0.9, H + 2.2));
  }
}

/** Repère de niveau posé sur la coupe (plan x), lisible depuis le sud-ouest. */
function levelX(pen, x, y, label) {
  const z0 = ZF + 0.9;
  pen.seg("faint", [x, y, ZF + 0.6], [x, y, z0 + 1.8]);
  pen.poly("medium", [[x, y, z0 + 0.3], [x, y + 0.3, z0 + 0.1], [x, y + 0.3, z0 + 0.5], [x, y, z0 + 0.3]]);
  pen.text("faint", label, [x, y + 0.12, z0 + 0.7], [0, 0, 1], [0, 1, 0], 0.34);
}

/* ------------------------------ plans des gradins ------------------------------ */

function slicePlan(pen, { x0, fs }) {
  const y = FL[fs];
  const L = new Local(pen, { x: x0, y, z: ZB });
  const bx = BAYS_A.filter((c) => c > x0 && c < x0 + SW).map((c) => c - x0);
  const sp = FLOOR[fs];

  const south = fs === 0
    ? [{ at: 0.45, w: 2.9, kind: "window", sill: 0.35, inside: -1 }, { at: 3.55, w: 1.0, kind: "door", side: -1, hinge: "b" }]
    : bx.map((c) => (sp.kind === "french"
      ? { at: c - 0.65, w: 1.3, kind: "french", inside: -1 }
      : { at: c - 0.65, w: 1.3, kind: "window", sill: sp.sill, inside: -1 }));
  L.wall(0, 9.75, SW, 9.75, { t: 0.5, poche: true, openings: south });
  L.wall(0, 0.2, SW, 0.2, {
    t: 0.4, poche: true,
    openings: bx.map((c) => ({ at: c - 0.5, w: 1.0, kind: "window", sill: 0.95, inside: 1 })),
  });
  const spineDoor = fs === 2 ? 3.8 : 1.7;
  L.wall(0, 5.0, SW, 5.0, { t: 0.25, poche: true, openings: [{ at: spineDoor, w: 0.9, kind: "door", side: 1, hinge: "a" }] });

  if (fs === 0) {
    /* BOULANGERIE : boutique sur rue, fournil sur cour */
    L.wall(0.15, 0, 0.15, 10, { t: 0.3, poche: true });
    L.wall(4.92, 0, 4.92, 10, { t: 0.16, poche: true });
    L.box("medium", [0.5, 0, 6.2], [3.4, 1.0, 0.7]);
    L.rect("faint", [0.55, 1.0, 6.3], [3.3, 0, 0], [0, 0, 0.5]);
    L.box("faint", [3.4, 1.0, 6.3], [0.35, 0.18, 0.3]);
    shelves(L.sub(0.35, 5.13, 0), 3.7, { h: 1.2, d: 0.42 });
    for (const [cx, cz] of [[1.2, 8.4], [2.6, 8.7]]) {
      L.circle("medium", [cx, 0.74, cz], 0.33, { n: 14 });
      L.seg("hair", [cx, 0, cz], [cx, 0.74, cz]);
      chair(L.sub(cx - 0.22, cz - 0.95, 0));
      chair(L.sub(cx + 0.22, cz + 0.95, 2));
    }
    L.box("medium", [0.4, 0, 0.45], [2.3, 1.2, 1.7]);
    L.circleV("faint", [1.55, 0.6, 2.15], 0.42, { n: 10 });
    L.circle("medium", [3.7, 0.85, 2.3], 0.45, { n: 16 });
    L.box("faint", [3.35, 0, 1.95], [0.7, 0.85, 0.7]);
    L.box("faint", [1.0, 0, 3.2], [2.0, 0.9, 0.8]);
    for (let i = 0; i < 3; i++) L.box("hair", [3.4 + i * 0.42, 0, 4.0], [0.38, 0.6, 0.55]);
    L.label("faint", "COMMERCE", [2.5, 0.02, 8.0], 0.42);
    person(pen, x0 + 2.1, ZB + 7.0, { y, h: 1.7, face: 1.4 });
    person(pen, x0 + 1.6, ZB + 8.9, { y, h: 1.62, face: -1.2 });
    return;
  }

  /* refends transversaux : enfilade près de la façade aux étages nobles */
  const enf = fs === 2 ? [{ at: 7.6, w: 1.4, kind: "door", side: 1, double: true }] : [];
  L.wall(0.12, 0.4, 0.12, 9.5, { t: 0.15, poche: true, openings: enf });
  L.wall(4.88, 0.4, 4.88, 9.5, {
    t: 0.15, poche: true,
    openings: fs === 2 ? [{ at: 7.6, w: 1.4, kind: "door", side: -1, double: true }] : [],
  });

  /* balcon filant de l'étage, au niveau du plan */
  if (BALC.includes(fs)) {
    balcon(pen, SOUTH, x0, x0 + SW, y, { consoles: false });
  }

  if (fs === 3) {
    /* LOGEMENT FAMILIAL : chambre sur rue avec cheminée, bains sur cour */
    bed(L.sub(0.22, 8.9, 3), 1.6, 2.0);
    wardrobe(L.sub(4.8, 5.15, 1), 1.6);
    L.box("medium", [4.4, 0, 7.6], [0.4, 1.1, 1.3]);
    L.rect("faint", [4.4, 0.05, 7.8], [0, 0, 0.9], [0, 0.7, 0]);
    rug(L.sub(2.4, 6.3, 0), 1.6, 1.2);
    L.partition(3.1, 0.4, 3.1, 4.87, [{ at: 2.3, w: 0.8, kind: "door", side: 1, hinge: "b" }]);
    bathtub(L.sub(0.22, 0.42, 0), 1.7, 0.75);
    basin(L.sub(2.95, 4.86, 2), 0.9);
    wc(L.sub(2.45, 0.42, 0));
    for (let z = 1.4; z < 4.8; z += 0.3) L.seg("hair", [0.2, 0.01, z], [3.05, 0.01, z]);
    shelves(L.sub(4.8, 0.45, 1), 2.6, { d: 0.32 });
    L.label("faint", "LOGEMENT", [2.5, 0.02, 6.1], 0.4);
    person(pen, x0 + 3.4, ZB + 3.2, { y, h: 1.66, face: 2.0 });
  } else if (fs === 2) {
    /* ÉTAGE NOBLE : salon en enfilade, cheminée, cuisine sur cour */
    L.box("medium", [1.8, 0, 5.13], [1.4, 1.1, 0.4]);
    L.rect("faint", [2.05, 0.05, 5.53], [0.9, 0, 0], [0, 0.75, 0]);
    L.rect("faint", [1.7, 1.1, 5.1], [1.6, 0, 0], [0, 0, 0.5]);
    sofa(L.sub(3.5, 8.25, 2), 2.0, 0.85);
    armchair(L.sub(0.55, 7.0, 3));
    armchair(L.sub(4.45, 6.15, 1));
    rug(L.sub(1.2, 5.85, 0), 2.6, 2.3);
    coffeeTable(L.sub(2.0, 6.45, 0), 1.0, 0.5);
    for (let i = 0; i < 9; i++) {
      const zc = 5.3 + i * 0.5;
      L.seg("hair", [0.25, 0.01, zc], [0.55, 0.01, zc + 0.3]);
      L.seg("hair", [0.55, 0.01, zc + 0.3], [0.85, 0.01, zc]);
    }
    plant(L.sub(2.5, 9.2, 0), 1.1);
    kitchen(L.sub(0.25, 0.42, 0), 2.7, { fridge: false, sink: 0.4, hob: 0.7 });
    table(L.sub(1.3, 2.4, 0), 1.4, 0.8, { chairs: 2 });
    shelves(L.sub(4.8, 0.45, 1), 3.0, { d: 0.4 });
    L.label("faint", "LOGEMENT", [2.5, 0.02, 9.35], 0.4);
    person(pen, x0 + 2.4, ZB + 7.5, { y, h: 1.72, face: 0.4 });
  } else {
    /* CABINET : consultation sur rue, attente et accueil sur cour */
    desk(L.sub(0.7, 6.0, 0), 1.6, 0.8);
    chair(L.sub(1.0, 5.25, 0));
    chair(L.sub(1.6, 5.25, 0));
    L.box("medium", [3.3, 0, 6.9], [0.7, 0.75, 1.9]);
    L.rect("faint", [3.38, 0.76, 7.0], [0.54, 0, 0], [0, 0, 0.4]);
    basin(L.sub(4.8, 5.3, 1), 0.6);
    for (let i = 0; i < 5; i++) chair(L.sub(0.25, 1.2 + i * 0.62, 3));
    coffeeTable(L.sub(1.0, 2.0, 0), 0.8, 0.5);
    plant(L.sub(0.7, 4.2, 0));
    L.box("medium", [3.1, 0, 2.2], [1.6, 1.05, 0.6]);
    L.box("faint", [3.1, 0, 2.8], [0.6, 1.05, 1.0]);
    L.label("faint", "CABINET", [2.5, 0.02, 9.2], 0.4);
    person(pen, x0 + 2.0, ZB + 3.0, { y, h: 1.6, face: 0.9 });
  }
}

export function buildUrban(ink) {
  const pen = new Pen({ wobble: 0.03 });

  /* ============================ volumes ============================ */
  /* angle + aile B (pleine hauteur) */
  const corner = [[-6, BZ1], [XE, BZ1], [XE, PCB[1]], [PCA[0], ZF], [-6, ZF]];
  pen.poly("strong", [...corner, corner[0]].map(([x, z]) => [x, 0, z]));
  for (const [x, z] of corner) pen.seg("strong", [x, 0, z], [x, H, z]);
  pen.poly("medium", [[XE, H, BZ1], [XE, H, PCB[1]], [PCA[0], H, ZF], [-6, H, ZF]]);
  pen.seg("medium", [-6, H, BZ1], [XE, H, BZ1]);
  pen.seg("medium", [-6, H, BZ1], [-6, H, ZB]);
  pen.solidPrism(
    [[-5.85, BZ1 + 0.3], [XE - 0.3, BZ1 + 0.3], [XE - 0.3, 1.076], [1.076, ZF - 0.3], [-5.85, ZF - 0.3]],
    { axis: "y", from: 0, to: H }
  );
  pen.solidPrism([[ZF - 0.3, H - 0.1], [ZF - 1.75, HM - 0.12], [ZB + 1.6, HM - 0.12], [ZB, H - 0.1]], { axis: "x", from: -5.85, to: 2.0 });
  pen.solidPrism([[XE - 0.3, H - 0.1], [XE - 1.75, HM - 0.12], [-4.4, HM - 0.12], [-5.85, H - 0.1]], { axis: "z", from: BZ1 + 0.3, to: 1.0 });

  /* gradins de l'aile A */
  for (const st of STEPS) {
    const yt = FL[st.fs];
    if (yt > 0) pen.solid([st.x0 + 0.15, 0, ZB + 0.3], [SW, yt - 0.12, ZF - ZB - 0.6], 0);
    pen.seg("strong", [st.x0, 0, ZF], [st.x0 + SW, 0, ZF]);
    pen.seg("strong", [st.x0, 0, ZB], [st.x0 + SW, 0, ZB]);
    pen.rect("medium", [st.x0, yt, ZB], [SW, 0, 0], [0, 0, ZF - ZB]);
  }
  pen.seg("strong", [-26, 0, ZB], [-26, 0, ZF]);
  /* contremarches : coupes verticales + repères de niveau */
  sectionAt(pen, -6, FL[3] + CUT, HM);
  sectionAt(pen, -11, FL[2] + CUT, FL[3]);
  sectionAt(pen, -16, FL[1] + CUT, FL[2]);
  sectionAt(pen, -21, CUT, FL[1]);
  levelX(pen, -6, FL[4], "+12.00");
  levelX(pen, -6, H, "+15.00");
  levelX(pen, -11, FL[3], "+9.20");
  levelX(pen, -16, FL[2], "+6.40");
  levelX(pen, -21, FL[1], "+3.60");
  levelX(pen, -26, 0, "+0.00");
  /* contour fantôme du volume retiré */
  for (const z of [ZF, ZB]) {
    pen.dashed("hair", [-26, H, z], [-6, H, z], { dash: 0.5, gap: 0.35 });
    pen.dashed("hair", [-26, CUT, z], [-26, H, z], { dash: 0.5, gap: 0.35 });
  }
  pen.dashed("hair", [-26, H, ZB], [-26, H, ZF], { dash: 0.5, gap: 0.35 });
  pen.dashed("hair", [-26, HM, ZF - 1.6], [-6, HM, ZF - 1.6], { dash: 0.5, gap: 0.35 });

  /* ======================= façades sur le boulevard ======================= */
  for (const c of BAYS_A) {
    const top = topFloorAt(c);
    for (let fl = 1; fl <= top; fl++) {
      hausBay(pen, SOUTH, c, fl);
      if (c < -6) hausBay(pen, COURT_A, c, fl, { court: true });
    }
  }
  /* cordons et bandeau d'entresol */
  for (let fl = 1; fl <= 4; fl++) {
    const x0 = STEPS.filter((s) => s.fs > fl).reduce((m, s) => Math.min(m, s.x0), -6);
    pen.seg(fl === 1 ? "medium" : "faint", [x0, FL[fl], ZF + 0.02], [PCA[0], FL[fl], ZF + 0.02]);
    if (fl === 1) pen.seg("faint", [x0, FL[1] - 0.25, ZF + 0.02], [PCA[0], FL[1] - 0.25, ZF + 0.02]);
  }
  for (const fl of BALC) {
    const x0 = STEPS.filter((s) => s.fs > fl).reduce((m, s) => Math.min(m, s.x0), -6);
    balcon(pen, SOUTH, x0, PCA[0] - 0.05, FL[fl]);
    pen.solid([x0, FL[fl] - 0.16, ZF], [PCA[0] - x0, 0.16, 0.6], 0.03);
  }
  /* rez-de-chaussée : devantures, enseignes, bossages */
  for (const st of STEPS.filter((s) => s.fs >= 1)) {
    const x0 = st.x0;
    pen.rect("strong", [x0 + 0.45, 0.25, ZF + 0.012], [SW - 0.9, 0, 0], [0, 2.75, 0]);
    pen.grid("medium", [x0 + 0.45, 0.25, ZF + 0.012], [SW - 0.9, 0, 0], [0, 2.75, 0], 3, 1);
    pen.rect("faint", [x0 + 0.45, 3.05, ZF + 0.02], [SW - 0.9, 0, 0], [0, 0.4, 0]);
    pen.rect("faint", [x0 + 0.45, 3.0, ZF], [SW - 0.9, 0, 0], [0, -0.5, 1.4]);
    for (let y = 0.45; y < 3.5; y += 0.45) pen.seg("hair", [x0 - 0.45, y, ZF + 0.015], [x0 + 0.45, y, ZF + 0.015]);
  }
  /* café d'angle : vitrine sur le boulevard */
  pen.rect("strong", [-5.6, 0.25, ZF + 0.012], [6.4, 0, 0], [0, 2.8, 0]);
  pen.grid("medium", [-5.6, 0.25, ZF + 0.012], [6.4, 0, 0], [0, 2.8, 0], 5, 2);
  pen.rect("faint", [-5.6, 3.1, ZF + 0.02], [6.4, 0, 0], [0, 0.38, 0]);
  corniche(pen, SOUTH, -6, PCA[0]);
  mansard(pen, SOUTH, -6, PCA[0], BAYS_A.filter((c) => c > -6));

  /* ============================ pan coupé ============================ */
  for (let fl = 1; fl <= 4; fl++) hausBay(pen, PAN, PC_LEN / 2, fl);
  for (const fl of BALC) balcon(pen, PAN, 0, PC_LEN, FL[fl], { consoles: false });
  bay(pen, PAN, PC_LEN / 2 - 0.9, 0, 1.8, 2.8, { kind: "door", coffre: false });
  pen.rect("faint", at(PAN, 0.25, 3.1, 0.02), mul(PAN.u, PC_LEN - 0.5), [0, 0.38, 0]);
  corniche(pen, PAN, 0, PC_LEN);
  pen.seg("faint", at(PAN, 0, FL[1], 0.02), at(PAN, PC_LEN, FL[1], 0.02));

  /* dôme du pavillon d'angle */
  const dc = [PCA[0] + (PCB[0] - PCA[0]) / 2 - 1.3, 0, PCA[1] + (PCB[1] - PCA[1]) / 2 - 1.3];
  const R = 2.2;
  pen.circle("strong", [dc[0], H + 0.05, dc[2]], R, { n: 32 });
  pen.circle("medium", [dc[0], HM + 0.2, dc[2]], R, { n: 32 });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    pen.seg("faint", [dc[0] + Math.cos(a) * R, H + 0.05, dc[2] + Math.sin(a) * R], [dc[0] + Math.cos(a) * R, HM + 0.2, dc[2] + Math.sin(a) * R]);
  }
  for (const a of [Math.PI * 0.25, Math.PI * 0.75, -Math.PI * 0.25]) {
    const n = [Math.cos(a), 0, Math.sin(a)];
    const c = [dc[0] + n[0] * (R + 0.02), H + 1.25, dc[2] + n[2] * (R + 0.02)];
    const pts = [];
    for (let k = 0; k <= 12; k++) {
      const t = (k / 12) * Math.PI * 2;
      pts.push(add(add(c, mul([-n[2], 0, n[0]], Math.cos(t) * 0.42)), [0, Math.sin(t) * 0.42, 0]));
    }
    pen.poly("medium", pts);
  }
  pen.edges("medium", new THREE.SphereGeometry(R, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), { pos: [dc[0], HM + 0.2, dc[2]] });
  pen.circle("medium", [dc[0], HM + 2.45, dc[2]], 0.42, { n: 12 });
  pen.circle("medium", [dc[0], HM + 3.25, dc[2]], 0.42, { n: 12 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    pen.seg("faint", [dc[0] + Math.cos(a) * 0.42, HM + 2.45, dc[2] + Math.sin(a) * 0.42], [dc[0] + Math.cos(a) * 0.42, HM + 3.25, dc[2] + Math.sin(a) * 0.42]);
  }
  pen.seg("strong", [dc[0], HM + 3.25, dc[2]], [dc[0], HM + 4.4, dc[2]]);
  {
    const tam = new THREE.CylinderGeometry(R - 0.12, R - 0.12, HM - H, 24);
    tam.translate(dc[0], (H + HM) / 2 + 0.1, dc[2]);
    pen.solidGeo(tam);
    const dome = new THREE.SphereGeometry(R - 0.1, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(dc[0], HM + 0.2, dc[2]);
    pen.solidGeo(dome);
  }

  /* ============================ aile B, rue est ============================ */
  for (let i = 0; i < BAYS_B.length; i++) {
    const s = BAYS_B[i];
    for (let fl = 1; fl <= 4; fl++) {
      hausBay(pen, EAST, s, fl);
      if (-s < ZB) hausBay(pen, COURT_B, s, fl, { court: true });
    }
    if (i === 4) {
      bay(pen, EAST, s - 1.3, 0, 2.6, 3.0, { kind: "door", coffre: false, depth: 0.5 });
      pen.circle("medium", at(EAST, s, 3.0, 0.015), 1.3, { axis: "x", n: 14, a0: 0, a1: Math.PI });
    } else if (i !== 0) {
      bay(pen, EAST, s - 0.95, 0.3, 1.9, 2.6, { kind: "french", coffre: false });
    }
  }
  for (let fl = 1; fl <= 4; fl++) pen.seg(fl === 1 ? "medium" : "faint", [XE + 0.02, FL[fl], PCB[1]], [XE + 0.02, FL[fl], BZ1]);
  for (const fl of BALC) {
    balcon(pen, EAST, -PCB[1] + 0.05, -BZ1, FL[fl]);
    pen.solid([XE, FL[fl] - 0.16, BZ1], [0.6, 0.16, PCB[1] - BZ1], 0.03);
  }
  corniche(pen, EAST, -PCB[1], -BZ1);
  mansard(pen, EAST, -PCB[1], -BZ1, BAYS_B);
  mansard(pen, COURT_B, -ZB, -BZ1, BAYS_B.filter((c, i) => -c < ZB && i % 2 === 0));
  pen.seg("medium", [-6.02, H - 0.3, ZB], [-6.02, H - 0.3, BZ1]);
  /* terrassons, cheminées */
  pen.rect("faint", [-6, HM, ZF - 1.6], [PCA[0] + 6, 0, 0], [0, 0, -(ZF - 1.6 - (ZB + 1.6))]);
  pen.rect("faint", [-4.4, HM, PCB[1] - 0.4], [XE - 1.6 + 4.4, 0, 0], [0, 0, BZ1 - PCB[1] + 0.4]);
  chimney(pen, -3.6, -1.0, "x");
  for (const z of [-8.2, -14.2, -20.4]) chimney(pen, -1.0, z, "z");

  /* ======================= plans des gradins ======================= */
  for (const st of STEPS) slicePlan(pen, st);

  /* ======================= cœur d'îlot : crèche ======================= */
  const K = { x0: -23, x1: -11, z0: -20, z1: -11.5, h: 3.8 };
  pen.box("medium", [K.x0, 0, K.z0], [K.x1 - K.x0, K.h, K.z1 - K.z0]);
  pen.solid([K.x0, 0, K.z0], [K.x1 - K.x0, K.h, K.z1 - K.z0], 0.15);
  for (let i = 0; i < 4; i++) {
    pen.rect("medium", [K.x0 + 0.8 + i * 2.9, 0.4, K.z1 + 0.012], [2.2, 0, 0], [0, 2.6, 0]);
    pen.seg("faint", [K.x0 + 1.9 + i * 2.9, 0.4, K.z1 + 0.012], [K.x0 + 1.9 + i * 2.9, 3.0, K.z1 + 0.012]);
  }
  for (let i = 0; i < 9; i++) tuft(pen, K.x0 + 1 + i * 1.3, K.h, K.z0 + 1.5 + (i % 3) * 2.6, 0.8);
  pen.hatch("hair", [K.x0 + 0.4, K.h + 0.02, K.z0 + 0.4], [K.x1 - K.x0 - 0.8, 0, 0], [0, 0, K.z1 - K.z0 - 0.8], 7);
  pen.rect("faint", [-20, 0.25, -9.5], [3, 0, 0], [0, 0, 2]);
  tree(pen, -8.5, -16.5, { h: 6.4, r: 2.4 });
  person(pen, -18.0, -8.6, { h: 1.0, face: 0.4 });
  person(pen, -16.6, -8.2, { h: 1.7, face: 2.6 });

  /* ============================ la rue ============================ */
  /* boulevard sud : trottoir, piste, tram, quai, contre-allée */
  pen.seg("strong", [-30, 0, 7.4], [1.0, 0, 7.4]);
  pen.curve("strong", Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI / 2 - (i / 6) * (Math.PI / 2);
    return [1.0 + Math.cos(a) * 5.4, 0, 2.0 + Math.sin(a) * 5.4];
  }), 16);
  pen.seg("strong", [6.4, 0, 2.0], [6.4, 0, -24]);
  pen.seg("medium", [-30, 0, 19.2], [12, 0, 19.2]);
  pen.seg("medium", [12, 0, 19.2], [12, 0, -24]);
  pen.dashed("faint", [-30, 0.02, 8.8], [12, 0.02, 8.8], { dash: 1.1, gap: 0.9 });
  pen.dashed("faint", [9.6, 0.02, 2.0], [9.6, 0.02, -24], { dash: 1.1, gap: 0.9 });
  for (const rz of [11.3, 12.8]) pen.seg("medium", [-30, 0.02, rz], [12, 0.02, rz]);
  for (let x = -29; x < 11; x += 1.2) {
    if (x > -21.5 && x < -9.5) continue;
    pen.seg("hair", [x, 0.02, 11.3], [x, 0.02, 12.8]);
  }
  /* quai et abri */
  pen.rect("medium", [-26, 0.25, 14.0], [16, 0, 0], [0, 0, 2.2]);
  pen.seg("faint", [-26, 0.25, 14.25], [-10, 0.25, 14.25]);
  for (const [x, z] of [[-20, 15.6], [-15, 15.6]]) pen.seg("medium", [x, 0.25, z], [x, 2.7, z]);
  pen.box("medium", [-21, 2.7, 15.0], [7, 0.12, 1.2]);
  pen.rect("faint", [-20, 0.25, 15.75], [5, 0, 0], [0, 2.2, 0]);
  pen.box("faint", [-19, 0.25, 15.4], [3, 0.45, 0.4]);
  /* le tram */
  const T = { x0: -21, l: 11, z0: 10.85, w: 2.4, h: 3.3 };
  pen.box("strong", [T.x0, 0.3, T.z0], [T.l, T.h - 0.3, T.w]);
  pen.solid([T.x0, 0.3, T.z0], [T.l, T.h - 0.3, T.w], 0.08);
  for (const z of [T.z0 - 0.01, T.z0 + T.w + 0.01]) {
    pen.rect("medium", [T.x0 + 0.4, 1.4, z], [T.l - 0.8, 0, 0], [0, 1.25, 0]);
    pen.grid("faint", [T.x0 + 0.4, 1.4, z], [T.l - 0.8, 0, 0], [0, 1.25, 0], 7, 1);
    for (const dx of [1.3, T.l - 2.5]) pen.rect("medium", [T.x0 + dx, 0.35, z], [1.2, 0, 0], [0, 2.3, 0]);
  }
  pen.poly("medium", [[T.x0 + 4.5, T.h, T.z0 + 1.2], [T.x0 + 5.2, T.h + 1.0, T.z0 + 1.2], [T.x0 + 5.9, T.h, T.z0 + 1.2]]);
  pen.seg("faint", [-30, T.h + 1.0, T.z0 + 1.2], [12, T.h + 1.0, T.z0 + 1.2]);
  for (const x of [-27, -3]) pen.seg("faint", [x, 0, 17.0], [x, T.h + 1.4, 17.0]);
  /* passages piétons */
  for (let i = 0; i < 6; i++) {
    pen.seg("medium", [-3.2 + i * 0.8, 0.02, 7.7], [-3.2 + i * 0.8, 0.02, 10.4]);
    pen.seg("medium", [6.7, 0.02, -2.0 - i * 0.8], [9.2, 0.02, -2.0 - i * 0.8]);
  }

  /* terrasses : café d'angle et boulangerie */
  for (const [x, z, parasol] of [[3.2, 4.7, true], [5.0, 2.8, true], [1.4, 5.9, false], [-23.6, 5.6, false], [-22.0, 6.2, false]]) {
    pen.circle("medium", [x, 0.74, z], 0.32, { n: 12 });
    pen.seg("hair", [x, 0, z], [x, 0.74, z]);
    for (const a of [0.4, 2.6]) {
      const cx = x + Math.cos(a) * 0.62;
      const cz = z + Math.sin(a) * 0.62;
      pen.circle("faint", [cx, 0.45, cz], 0.2, { n: 8 });
      pen.seg("hair", [cx, 0, cz], [cx, 0.45, cz]);
    }
    if (parasol) {
      pen.seg("medium", [x, 0.74, z], [x, 2.25, z]);
      pen.edges("medium", new THREE.ConeGeometry(1.5, 0.5, 8), { pos: [x, 2.45, z] });
    }
  }
  person(pen, 2.6, 4.2, { h: 1.25, face: 0.2 });
  person(pen, 3.7, 5.3, { h: 1.25, face: 2.8 });
  person(pen, -23.0, 5.0, { h: 1.25, face: 1.0 });

  /* canopée et mobilier urbain */
  for (const x of [-18.5, -11, -3.6]) {
    pen.rect("faint", [x - 0.7, 0.01, 5.6], [1.4, 0, 0], [0, 0, 1.4]);
    pen.hatch("hair", [x - 0.7, 0.01, 5.6], [1.4, 0, 0], [0, 0, 1.4], 5);
    tree(pen, x, 6.3, { h: 5.6, r: 1.7, lean: 0.15 });
    pen.circle("hair", [x + 0.9, 0.02, 7.1], 2.0, { n: 20 });
  }
  for (const z of [-4.5, -11, -17.5]) tree(pen, 5.3, z, { h: 5.2, r: 1.9 });
  for (const x of [-25.5, -11, 0.3]) {
    pen.seg("medium", [x, 0, 7.0], [x, 4.2, 7.0]);
    pen.box("faint", [x - 0.18, 4.2, 6.82], [0.36, 0.5, 0.36]);
  }
  bike(pen, -12, 8.4, { face: 0.05 });
  bike(pen, -4, 9.0, { face: 0.12 });
  bike(pen, 9.2, -8.0, { face: -1.5 });
  person(pen, -17, 5.0, { face: 1.4 });
  person(pen, -9.5, 4.8, { h: 1.68, face: -0.8 });
  person(pen, -8.6, 5.0, { h: 1.1, face: -0.5 });
  person(pen, 5.4, -6.5, { face: 0.4 });
  person(pen, -14.5, 15.0, { h: 1.75, face: 2.2 });
  person(pen, -12.8, 15.3, { h: 1.7, face: 1.9 });
  for (const [sx, sz] of [[-28, 13.5], [10.5, 17.5], [-29, -14]]) tuft(pen, sx, 0, sz, 1.4);

  /* cotes du profil du boulevard */
  dimChain(pen, [ZF, 7.4, 14.0, 16.2, 19.2], { along: "z", at: 13.8, from: 12, size: 0.45 });

  return pen.build(ink);
}
