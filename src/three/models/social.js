import {
  Pen, bay, balustrade, tree, person, tuft, planterRow, bike, dimChain, gridAxes,
} from "../lineKit.js";
import { Local, table, stairU, lift, duct, apartmentT4, apartmentOpenings } from "../planKit.js";

/**
 * LOGEMENT SOCIAL — axonométrie écorchée.
 * Barre R+4 de trois T4 traversants par niveau (deux en miroir, salles
 * d'eau adossées à la même gaine), desservis au nord par une coursive et
 * une tour d'escalier + ascenseur. L'étage courant est coupé à 1,20 m
 * pour lire le plan. L'aile basse R+3 offre sa toiture aux habitants, de
 * plain-pied avec le dernier niveau ; balcons filants plantés au sud,
 * hall traversant ouvert sur le parvis.
 */

const FH = 3;
const CUT = 1.2;
const LV = 4;
const Y4 = LV * FH;
const A = { x0: -15, x1: 9, z0: -6, z1: 6 };
const B = { x0: 9, x1: 20, z0: -6, z1: 3 };
const T = { x0: -6.2, x1: -1.2, z0: -11.4, z1: -7.6 };
const CO = 1.6;
const BAL = 1.6;

/* Les trois logements de la barre : origine locale + symétrie. */
const APTS = [
  { x0: -15, mirror: false },
  { x0: 1, mirror: true },
  { x0: 1, mirror: false },
];
const { north: NORTH_OPS, south: SOUTH_OPS } = apartmentOpenings(8);
const worldX = (apt, a, w) => (apt.mirror ? apt.x0 - a - w : apt.x0 + a);

/* T4 traversant 8,00 × 12,00 (plan type du kit) + son balcon au niveau écorché. */
function apartmentT4Floor(pen, apt) {
  const L = new Local(pen, { x: apt.x0, y: Y4, z: A.z0, mirror: apt.mirror });
  apartmentT4(L, { W: 8, D: 12, H: CUT });

  /* balcon filant planté (niveau écorché) : mobilier + jardinière */
  const bx0 = 0.2;
  const bx1 = 7.8;
  table(L.sub(2.0, 12.5, 1), 0.6, 0.6, { chairs: 1 });
  L.box("faint", [bx0 + 3.4, 0, 12 + BAL - 0.42], [3.8, 0.42, 0.34]);
  for (let i = 0; i < 6; i++) L.tuft(bx0 + 3.6 + i * 0.68, 0.42, 12 + BAL - 0.25, 0.75);
  L.solid([bx0, -0.2, 12], [bx1 - bx0, 0.2, BAL], 0.04);
}

export function buildSocial(ink) {
  const pen = new Pen({ wobble: 0.035 });

  /* ============================ volumes ============================ */
  /* barre A : arêtes jusqu'au niveau écorché, nez de dalle */
  for (const [x, z] of [[A.x0, A.z0], [A.x1, A.z0], [A.x1, A.z1], [A.x0, A.z1]]) {
    pen.seg("strong", [x, 0, z], [x, Y4, z]);
  }
  pen.rect("strong", [A.x0, 0, A.z0], [A.x1 - A.x0, 0, 0], [0, 0, A.z1 - A.z0]);
  for (let f = 1; f <= LV; f++) {
    const y = f * FH;
    pen.rect(f === LV ? "medium" : "faint", [A.x0, y, A.z0], [A.x1 - A.x0, 0, 0], [0, 0, A.z1 - A.z0]);
    pen.rect("hair", [A.x0, y - 0.25, A.z0], [A.x1 - A.x0, 0, 0], [0, 0, A.z1 - A.z0]);
  }
  pen.rect("hair", [A.x0, 0.55, A.z0], [A.x1 - A.x0, 0, 0], [0, 0, A.z1 - A.z0]);
  pen.solid([A.x0, 0, A.z0], [A.x1 - A.x0, Y4, A.z1 - A.z0], 0.3);

  /* aile B : R+3, toiture-terrasse accessible à +12.00 */
  const BH = Y4 + 0.3;
  pen.box("strong", [B.x0, 0, B.z0], [B.x1 - B.x0, BH, B.z1 - B.z0]);
  pen.rect("medium", [B.x0 + 0.25, BH, B.z0 + 0.25], [B.x1 - B.x0 - 0.25, 0, 0], [0, 0, B.z1 - B.z0 - 0.5]);
  for (let f = 1; f < LV; f++) {
    pen.poly("faint", [[B.x0, f * FH, B.z1], [B.x1, f * FH, B.z1], [B.x1, f * FH, B.z0], [B.x0, f * FH, B.z0]]);
  }
  pen.solid([B.x0, 0, B.z0], [B.x1 - B.x0, BH, B.z1 - B.z0], 0.3);

  /* =================== façades des niveaux courants =================== */
  const S = { o: [0, 0, A.z1], u: [1, 0, 0], n: [0, 0, 1] };
  const N = { o: [0, 0, A.z0], u: [1, 0, 0], n: [0, 0, -1] };
  for (let f = 1; f < LV; f++) {
    const y = f * FH;
    for (const apt of APTS) {
      for (const op of SOUTH_OPS) bay(pen, S, worldX(apt, op.a, op.w), y, op.w, op.h, { kind: op.kind });
      for (const op of NORTH_OPS) {
        bay(pen, N, worldX(apt, op.a, op.w), y + op.sill, op.w, op.h, { kind: op.kind, coffre: op.kind !== "door" });
      }
    }
  }

  /* ---------- rez-de-chaussée : salle commune, hall traversant, vélos ---------- */
  pen.rect("strong", [-14.4, 0.2, A.z1 + 0.012], [6.6, 0, 0], [0, 2.6, 0]);
  pen.grid("medium", [-14.4, 0.2, A.z1 + 0.012], [6.6, 0, 0], [0, 2.6, 0], 5, 2);
  pen.rect("strong", [-6.0, 0, A.z1 + 0.012], [4.6, 0, 0], [0, 2.75, 0]);
  pen.grid("medium", [-6.0, 0, A.z1 + 0.012], [4.6, 0, 0], [0, 2.75, 0], 4, 2);
  pen.rect("strong", [-4.3, 0, A.z1 + 0.03], [1.8, 0, 0], [0, 2.3, 0]);
  pen.seg("medium", [-3.4, 0, A.z1 + 0.03], [-3.4, 2.3, A.z1 + 0.03]);
  /* auvent suspendu par tirants */
  pen.box("strong", [-6.4, 2.85, A.z1], [5.4, 0.16, 2.3]);
  pen.seg("medium", [-6.1, 3.0, A.z1 + 2.1], [-5.2, 4.6, A.z1 + 0.02]);
  pen.seg("medium", [-1.3, 3.0, A.z1 + 2.1], [-2.2, 4.6, A.z1 + 0.02]);
  pen.solid([-6.4, 2.85, A.z1], [5.4, 0.16, 2.3], 0.04);
  /* local vélos + loge */
  bay(pen, S, 0.4, 0, 3.2, 2.5, { kind: "door", coffre: false });
  for (let i = 1; i < 8; i++) pen.seg("hair", [0.4 + i * 0.4, 0.15, A.z1 - 0.22], [0.4 + i * 0.4, 2.35, A.z1 - 0.22]);
  bay(pen, S, 4.6, 0.9, 1.6, 1.5, {});
  bay(pen, S, 6.8, 0.9, 1.6, 1.5, {});
  /* nord : sortie du hall vers la tour, local ordures */
  pen.rect("strong", [-6.0, 0, A.z0 - 0.012], [4.6, 0, 0], [0, 2.75, 0]);
  pen.grid("medium", [-6.0, 0, A.z0 - 0.012], [4.6, 0, 0], [0, 2.75, 0], 4, 2);
  bay(pen, N, 4.4, 0, 1.4, 2.2, { kind: "door", coffre: false });
  for (const x of [-13.6, -10.4, 0.6, 6.6]) bay(pen, N, x, 1.0, 1.4, 1.3, {});
  /* emmarchement + rampe */
  pen.poly("medium", [[-6.8, 0.16, A.z1 + 2.6], [-0.6, 0.16, A.z1 + 2.6], [-0.6, 0.16, A.z1 + 3.2], [-6.8, 0.16, A.z1 + 3.2]]);
  pen.poly("faint", [[-0.6, 0.16, A.z1 + 2.8], [3.2, 0, A.z1 + 2.8], [3.2, 0, A.z1 + 3.4], [-0.6, 0.16, A.z1 + 3.4]]);

  /* ---------- pignon ouest en brique : assises, chaînages, joint ---------- */
  const gx = A.x0 - 0.012;
  for (let y = 0.9; y < Y4 - 0.1; y += 0.42) {
    if (y % FH < 0.3 || y % FH > FH - 0.3) continue;
    pen.seg("hair", [gx, y, A.z0 + 0.05], [gx, y, A.z1 - 0.05]);
  }
  for (let f = 1; f <= LV; f++) {
    for (const dy of [-0.28, -0.12]) pen.seg("faint", [gx, f * FH + dy, A.z0], [gx, f * FH + dy, A.z1]);
  }
  pen.seg("faint", [gx, 0.55, -0.6], [gx, Y4, -0.6]);
  pen.seg("faint", [gx, 0.55, -0.45], [gx, Y4, -0.45]);

  /* ---------- descentes d'eaux pluviales ---------- */
  for (const x of [A.x0 + 0.35, A.x1 - 0.35]) {
    for (const dx of [0, 0.1]) pen.seg("faint", [x + dx, 0.3, A.z1 + 0.1], [x + dx, Y4 - 0.1, A.z1 + 0.1]);
    pen.rect("faint", [x - 0.04, 0, A.z1 + 0.04], [0.18, 0, 0], [0, 0.3, 0]);
  }

  /* =========================== aile B =========================== */
  const BS = { o: [0, 0, B.z1], u: [1, 0, 0], n: [0, 0, 1] };
  const BN = { o: [0, 0, B.z0], u: [1, 0, 0], n: [0, 0, -1] };
  const BE = { o: [B.x1, 0, 0], u: [0, 0, 1], n: [1, 0, 0] };
  for (let f = 1; f < LV; f++) {
    const y = f * FH;
    for (const x of [10.0, 15.2]) bay(pen, BS, x, y, 1.8, 2.25, { kind: "french" });
    for (const x of [12.6, 17.8]) bay(pen, BS, x, y + 0.95, 1.3, 1.3, { rail: 5 });
    for (const x of [9.9, 15.1]) bay(pen, BN, x, y + 1.0, 1.2, 1.3, {});
    for (const x of [11.6, 16.8]) bay(pen, BN, x, y, 0.9, 2.2, { kind: "door", coffre: false });
    for (const x of [13.2, 18.4]) bay(pen, BN, x, y + 1.0, 1.0, 1.3, {});
    for (const z of [-5.0, -1.2]) bay(pen, BE, z, y, 2.0, 2.25, { kind: "french" });
    /* balcon filant sur le pignon est */
    const bz0 = B.z0 + 0.6;
    const bz1 = B.z1 - 0.6;
    pen.box("medium", [B.x1, y - 0.18, bz0], [1.4, 0.18, bz1 - bz0]);
    pen.solid([B.x1, y - 0.18, bz0], [1.4, 0.18, bz1 - bz0], 0.04);
    balustrade(pen, [B.x1 + 1.4, y, bz0 + 0.1], [B.x1 + 1.4, y, bz1 - 0.1], { h: 1.05, step: 0.36 });
    pen.seg("faint", [B.x1, y + 1.05, bz0 + 0.1], [B.x1 + 1.4, y + 1.05, bz0 + 0.1]);
    pen.seg("faint", [B.x1, y + 1.05, bz1 - 0.1], [B.x1 + 1.4, y + 1.05, bz1 - 0.1]);
    planterRow(pen, [B.x1 + 1.25, y + 1.05, bz0 + 0.6], [B.x1 + 1.25, y + 1.05, bz1 - 0.6], 4, 0.8);
  }
  /* atelier des habitants (rdc sud de B) */
  pen.rect("strong", [9.8, 0.2, B.z1 + 0.012], [9.4, 0, 0], [0, 2.6, 0]);
  pen.grid("medium", [9.8, 0.2, B.z1 + 0.012], [9.4, 0, 0], [0, 2.6, 0], 6, 2);
  bay(pen, BE, -4.6, 0, 2.6, 2.4, { kind: "door", coffre: false });
  bay(pen, BE, -0.8, 0.9, 1.6, 1.4, {});

  /* ---------- toiture partagée sur B, de plain-pied avec le R+4 ---------- */
  const RY = Y4 + 0.12;
  for (let x = B.x0 + 0.6; x < B.x1 - 0.3; x += 0.45) pen.seg("hair", [x, RY, B.z0 + 0.35], [x, RY, B.z1 - 0.35]);
  balustrade(pen, [B.x0 + 0.15, BH, B.z1 - 0.12], [B.x1 - 0.12, BH, B.z1 - 0.12], { h: 0.8, step: 0.4 });
  balustrade(pen, [B.x1 - 0.12, BH, B.z0 + 0.15], [B.x1 - 0.12, BH, B.z1 - 0.12], { h: 0.8, step: 0.4 });
  balustrade(pen, [B.x0 + CO, BH, B.z0 + 0.12], [B.x1 - 0.12, BH, B.z0 + 0.12], { h: 0.8, step: 0.4 });
  /* pergola */
  for (const px of [11, 14, 17]) {
    for (const pz of [-4.6, -0.6]) pen.seg("medium", [px, RY, pz], [px, RY + 2.5, pz]);
  }
  for (const pz of [-4.6, -0.6]) pen.seg("strong", [10.6, RY + 2.5, pz], [17.4, RY + 2.5, pz]);
  for (let i = 0; i <= 13; i++) pen.seg("faint", [10.8 + i * 0.5, RY + 2.5, -5.0], [10.8 + i * 0.5, RY + 2.5, -0.2]);
  const roof = new Local(pen, { x: 0, y: RY, z: 0 });
  table(roof.sub(12.6, -3.1, 0), 2.4, 0.9, { chairs: 3 });
  /* potagers en bacs */
  for (const [bx, bz] of [[10.2, 0.6], [13.0, 0.6], [15.8, 0.6]]) {
    pen.box("medium", [bx, RY, bz], [2.2, 0.55, 1.3]);
    planterRow(pen, [bx + 0.3, RY + 0.55, bz + 0.65], [bx + 1.9, RY + 0.55, bz + 0.65], 4, 0.7);
  }
  for (let i = 0; i < 6; i++) tuft(pen, 18.6, RY, -5.2 + i * 1.3, 0.9);
  person(pen, 15.6, -2.4, { y: RY, h: 1.7, face: 2.4 });
  person(pen, 11.8, 1.9, { y: RY, h: 1.65, face: 0.6 });
  person(pen, 12.4, 2.1, { y: RY, h: 1.1, face: 0.2 });

  /* ============================ coursive ============================ */
  for (let f = 1; f <= LV; f++) {
    const y = f * FH;
    const xe = f === LV ? B.x0 + CO : B.x1;
    pen.box("medium", [A.x0, y - 0.22, A.z0 - CO], [xe - A.x0, 0.22, CO]);
    pen.solid([A.x0, y - 0.22, A.z0 - CO], [xe - A.x0, 0.22, CO], 0.04);
    balustrade(pen, [A.x0 + 0.1, y, A.z0 - CO + 0.08], [T.x0, y, A.z0 - CO + 0.08], { h: 1.1, step: 0.34 });
    balustrade(pen, [T.x1, y, A.z0 - CO + 0.08], [xe - 0.1, y, A.z0 - CO + 0.08], { h: 1.1, step: 0.34 });
    balustrade(pen, [A.x0 + 0.08, y, A.z0 - CO + 0.1], [A.x0 + 0.08, y, A.z0 - 0.05], { h: 1.1, step: 0.34 });
    balustrade(pen, [xe - 0.08, y, A.z0 - CO + 0.1], [xe - 0.08, y, A.z0 - 0.05], { h: 1.1, step: 0.34 });
    /* jardinières devant les chambres : mise à distance de la coursive */
    for (const apt of APTS) {
      for (const op of [NORTH_OPS[0], NORTH_OPS[2]]) {
        const x = worldX(apt, op.a, op.w);
        pen.box("faint", [x, y, A.z0 - 0.5], [op.w, 0.45, 0.42]);
        if (f === LV || f % 2 === 1) planterRow(pen, [x + 0.25, y + 0.45, A.z0 - 0.3], [x + op.w - 0.25, y + 0.45, A.z0 - 0.3], 3, 0.6);
      }
    }
  }
  for (const x of [A.x0 + 0.1, -7, 1, A.x1, 14.5, B.x1 - 0.1]) {
    const top = x > A.x1 ? (LV - 1) * FH + 1.1 : Y4 + 1.1;
    pen.box("medium", [x - 0.06, 0, A.z0 - CO + 0.02], [0.12, top, 0.12]);
  }
  person(pen, -10.2, A.z0 - 0.8, { y: 2 * FH, h: 1.7, face: 3.0 });
  person(pen, 5.0, A.z0 - 0.8, { y: Y4, h: 1.68, face: 0.2 });

  /* ======================= tour d'escalier + ascenseur ======================= */
  const tw = new Local(pen, { x: 0, y: 0, z: 0 });
  for (const [x, z] of [[T.x0, T.z0], [T.x1, T.z0], [T.x0, T.z1], [T.x1, T.z1]]) pen.seg("strong", [x, 0, z], [x, Y4, z]);
  for (let f = 1; f <= LV; f++) pen.poly("faint", [[T.x0, f * FH, T.z1], [T.x0, f * FH, T.z0], [T.x1, f * FH, T.z0], [T.x1, f * FH, T.z1]]);
  /* claire-voie de lames verticales */
  for (let x = T.x0 + 0.25; x < T.x1; x += 0.25) pen.seg("hair", [x, 0.3, T.z0 - 0.06], [x, Y4 - 0.1, T.z0 - 0.06]);
  for (let z = T.z0 + 0.25; z < T.z1; z += 0.25) pen.seg("hair", [T.x0 - 0.06, 0.3, z], [T.x0 - 0.06, Y4 - 0.1, z]);
  pen.solid([T.x0, 0, T.z0], [T.x1 - T.x0, Y4 - 1.7, T.z1 - T.z0], 0.2);
  pen.solid([-3.34, 0, -9.7], [T.x1 + 3.34, Y4, 2.1], 0.15);
  pen.solid([-3.34, 0, T.z0], [T.x1 + 3.34, Y4, 1.7], 0.15);
  /* au niveau écorché : murs coupés, escalier, ascenseur */
  const t4 = new Local(pen, { x: 0, y: Y4, z: 0 });
  t4.wall(T.x0 + 0.1, T.z0, T.x0 + 0.1, T.z1, { t: 0.2, poche: true });
  t4.wall(T.x1 - 0.1, T.z0, T.x1 - 0.1, T.z1, { t: 0.2, poche: true });
  t4.wall(T.x0, T.z0 + 0.1, T.x1, T.z0 + 0.1, { t: 0.2, poche: true });
  t4.wall(-3.34, T.z0 + 0.2, -3.34, T.z1, { t: 0.2, poche: true });
  t4.wall(-3.24, -9.7, T.x1 - 0.2, -9.7, { t: 0.2, poche: true });
  stairU(t4.sub(-3.44, T.z1, 2), { fw: 1.2, jour: 0.16, FH, risers: 18, tread: 0.27, landing: 1.3, cut: CUT });
  lift(t4.sub(-3.24, -9.6, 0), 1.84, 1.9);
  duct(t4.sub(-3.0, T.z0 + 0.4, 0), 1.4, 1.0);
  tw.label("faint", "A", [-2.3, Y4 + 0.02, -8.2], 0.4);

  /* ====================== l'étage courant écorché ====================== */
  for (const apt of APTS) apartmentT4Floor(pen, apt);
  const lv = new Local(pen, { x: 0, y: Y4, z: 0 });
  lv.wall(A.x0 + 0.1, A.z0, A.x0 + 0.1, A.z1, { t: 0.2, poche: true });
  lv.wall(-7, A.z0 + 0.3, -7, A.z1 - 0.3, { t: 0.2, poche: true });
  lv.wall(1, A.z0 + 0.3, 1, A.z1 - 0.3, { t: 0.2, poche: true });
  lv.wall(A.x1 - 0.15, A.z0, A.x1 - 0.15, A.z1, { t: 0.3, poche: true });
  /* pare-vues entre balcons */
  for (const x of [-7, 1]) {
    for (let f = 1; f <= LV; f++) {
      const y = f * FH;
      pen.rect("medium", [x, y, A.z1], [0, 0, BAL], [0, 1.8, 0]);
      for (let i = 1; i < 6; i++) pen.seg("hair", [x, y, A.z1 + i * 0.27], [x, y + 1.8, A.z1 + i * 0.27]);
    }
  }
  /* habitants à l'étage */
  for (const [x, z, face] of [[-13.4, 4.3, 0.8], [-0.3, -1.0, -2.2], [4.3, 0.2, 1.2]]) {
    person(pen, x, z, { y: Y4, h: 1.7, face });
  }

  /* ===================== balcons filants plantés ===================== */
  for (let f = 1; f < LV; f++) {
    const y = f * FH;
    for (const apt of APTS) {
      const [xa, xb] = apt.mirror ? [apt.x0 - 7.8, apt.x0 - 0.2] : [apt.x0 + 0.2, apt.x0 + 7.8];
      pen.box("medium", [xa, y - 0.2, A.z1], [xb - xa, 0.2, BAL]);
      pen.solid([xa, y - 0.2, A.z1], [xb - xa, 0.2, BAL], 0.04);
      pen.box("faint", [xa + 0.3, y, A.z1 + BAL - 0.42], [xb - xa - 0.6, 0.42, 0.34]);
      planterRow(pen, [xa + 0.6, y + 0.42, A.z1 + BAL - 0.25], [xb - 0.6, y + 0.42, A.z1 + BAL - 0.25], 6, 0.8);
    }
  }
  for (let f = 1; f <= LV; f++) {
    const y = f * FH;
    for (const apt of APTS) {
      const [xa, xb] = apt.mirror ? [apt.x0 - 7.8, apt.x0 - 0.2] : [apt.x0 + 0.2, apt.x0 + 7.8];
      if (f === LV) pen.box("medium", [xa, y - 0.2, A.z1], [xb - xa, 0.2, BAL]);
      balustrade(pen, [xa, y, A.z1 + BAL], [xb, y, A.z1 + BAL], { h: 1.05, step: 0.3 });
    }
  }
  person(pen, -12.0, A.z1 + 0.8, { y: 2 * FH, h: 1.7, face: 0.4 });
  person(pen, 4.4, A.z1 + 0.7, { y: FH, h: 1.66, face: -0.3 });

  /* ======================= sol : parvis, rue, jardin ======================= */
  pen.axis("hair", [-19, 0.02, -14.6], [25, 0.02, -14.6]);
  pen.axis("hair", [25, 0.02, -14.6], [25, 0.02, 11.4]);
  pen.axis("hair", [-19, 0.02, -14.6], [-19, 0.02, 11.4]);
  pen.seg("strong", [-21, 0, 11.4], [27, 0, 11.4]);
  pen.seg("faint", [-21, 0, 11.75], [27, 0, 11.75]);
  pen.seg("faint", [-21, 0, 14.2], [27, 0, 14.2]);
  /* calepinage du parvis */
  for (let x = -8; x <= 1.6; x += 1.2) pen.seg("hair", [x, 0.01, A.z1 + BAL + 0.4], [x, 0.01, 11.2]);
  for (let z = A.z1 + BAL + 0.4; z <= 11.2; z += 0.6) pen.seg("hair", [-8, 0.01, z], [1.6, 0.01, z]);
  /* arceaux vélos */
  for (let i = 0; i < 5; i++) {
    const x = 3.6 + i * 0.9;
    pen.circle("medium", [x, 0.45, 10.2], 0.38, { axis: "z", n: 10, a0: 0, a1: Math.PI });
    pen.seg("medium", [x - 0.38, 0, 10.2], [x - 0.38, 0.45, 10.2]);
    pen.seg("medium", [x + 0.38, 0, 10.2], [x + 0.38, 0.45, 10.2]);
  }
  bike(pen, 4.5, 10.6, { face: 0.05 });
  /* arbres d'alignement en fosse */
  for (const x of [-16.5, -9.5, 11.5, 19]) {
    pen.rect("faint", [x - 0.8, 0.01, 9.6], [1.6, 0, 0], [0, 0, 1.6]);
    pen.hatch("hair", [x - 0.8, 0.01, 9.6], [1.6, 0, 0], [0, 0, 1.6], 6);
    tree(pen, x, 10.4, { h: 6.2, r: 2.2 });
  }
  /* jardin en cœur d'îlot (nord) */
  pen.curve("faint", [[-19, 0.01, -12.5], [-11, 0.01, -11.2], [-6.2, 0.01, -9.6]], 20);
  pen.curve("faint", [[-1.2, 0.01, -9.6], [6, 0.01, -11.5], [14, 0.01, -9.4], [25, 0.01, -10.2]], 26);
  tree(pen, -12.5, -11.8, { h: 5.4, r: 2.1 });
  tree(pen, 10.5, -11.6, { h: 6, r: 2.4 });
  for (const [sx, sz] of [[-17.5, -9.4], [3.5, -12.8], [18.5, -12.6], [-16.6, 8.4]]) tuft(pen, sx, 0, sz, 1.4);
  /* banc */
  pen.box("medium", [4.2, 0, -10.6], [2.2, 0.45, 0.5]);

  /* trame structurelle + cotes */
  gridAxes(pen, {
    xs: [A.x0, -7, 1, A.x1, B.x1], zs: [A.z0, A.z1],
    x0: A.x0, x1: B.x1 + 1.6, z0: T.z0, z1: A.z1 + BAL, ext: 2.4, r: 0.6,
  });
  dimChain(pen, [A.x0, -7, 1, A.x1, B.x1], { along: "x", at: 12.9, from: A.z1 + BAL, size: 0.5 });
  dimChain(pen, [A.z0 - CO, A.z0, A.z1, A.z1 + BAL], { along: "z", at: A.x0 - 1.0, from: A.x0, size: 0.5 });

  /* vie du parvis */
  person(pen, -4.2, A.z1 + 4.6, { face: 0.4 });
  person(pen, -2.6, A.z1 + 4.9, { h: 1.1, face: -0.5 });
  person(pen, -10.5, A.z1 + 3.6, { face: 2.6 });
  person(pen, 15, B.z1 + 3.8, { h: 1.8, face: 1.2 });

  return pen.build(ink);
}
