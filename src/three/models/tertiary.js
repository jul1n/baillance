import {
  Pen, bay, balustrade, tree, person, planterRow, tuft, bike, dimChain, gridAxes,
} from "../lineKit.js";
import {
  Local, chair, sofa, armchair, coffeeTable, plant, basin, wc, stairU, lift, duct, column,
  apartmentT4, apartmentOpenings,
} from "../planKit.js";

/**
 * TRANSFORMATION TERTIAIRE — un plateau de bureaux R+5 en mutation,
 * dernier niveau écorché à 1,20 m. À l'ouest, « hier » : façade rideau
 * tramée à 1,20 m, poteaux sur trame de 7,20 m, faux plancher, postes de
 * travail, salle de réunion. À l'est, « demain » : la même trame accueille
 * deux T4 traversants de 14 m de profondeur — bande centrale dévolue aux
 * pièces d'eau, cellier, dressing, poteaux conservés dans le plan. Les
 * dalles sont prolongées en balcons au sud, une coursive est greffée au
 * nord, le noyau béton est conservé et partagé ; la grue greffe un balcon.
 */

const FLOORS = 6;
const FH = 3.5;
const CUT = 1.2;
const V = { x: -18, z: -7, w: 36, d: 14 };
const Y5 = (FLOORS - 1) * FH;
const zf = V.z + V.d;
const zb = V.z;
const XS = [-18, -10.8, -3.6, 3.6, 10.8, 18];
const CORE = { x0: -7.2, x1: 0, z0: -3, z1: 3 };
const BAL = 1.9;
const CO = 1.4;

/* Les deux logements de la moitié mutée (W = 9, D = 14). */
const APTS = [
  { x0: 0, mirror: false },
  { x0: 18, mirror: true },
];
const OPS = apartmentOpenings(9);
const wx = (apt, a, w) => (apt.mirror ? apt.x0 - a - w : apt.x0 + a);

/* Façade rideau en plan : montants coupés + double vitrage. */
function curtainPlan(L, a, b, q, { along = "x", step = 1.2, H = CUT } = {}) {
  const n = Math.round((b - a) / step);
  const P = (s, y, dq = 0) => (along === "x" ? [s, y, q + dq] : [q + dq, y, s]);
  for (let i = 0; i <= n; i++) {
    const s = a + ((b - a) * i) / n;
    const [x, , z] = P(s, 0);
    L.box("medium", along === "x" ? [x - 0.03, 0, z - 0.08] : [x - 0.08, 0, z - 0.03], along === "x" ? [0.06, H, 0.16] : [0.16, H, 0.06]);
  }
  for (const dq of [-0.03, 0.03]) L.seg("medium", P(a, H, dq), P(b, H, dq));
}

/* Îlot de postes de travail : deux rangées face à face, écran central. */
function deskBench(L, n) {
  const w = 1.4;
  const d = 0.75;
  L.rect("medium", [0, 0.74, 0], [n * w, 0, 0], [0, 0, 2 * d]);
  L.seg("faint", [0, 0.74, d], [n * w, 0.74, d]);
  for (let i = 1; i < n; i++) L.seg("faint", [i * w, 0.74, 0], [i * w, 0.74, 2 * d]);
  L.rect("faint", [0, 0.74, d], [n * w, 0, 0], [0, 0.4, 0]);
  for (const x of [0.05, n * w - 0.05]) {
    for (const z of [0.1, 2 * d - 0.1]) L.seg("hair", [x, 0, z], [x, 0.74, z]);
  }
  for (let i = 0; i < n; i++) {
    L.rect("hair", [i * w + 0.45, 0.76, d - 0.22], [0.5, 0, 0], [0, 0.3, 0]);
    L.rect("hair", [i * w + 0.45, 0.76, d + 0.22], [0.5, 0, 0], [0, 0.3, 0]);
    chair(L.sub(i * w + 0.48, -0.62, 0));
    chair(L.sub(i * w + 0.92, 2 * d + 0.62, 2));
  }
}

/* ================== le dernier niveau, écorché ================== */
function cutFloor(pen) {
  const L = new Local(pen, { x: 0, y: Y5, z: 0 });

  /* ---------- structure conservée : poteaux de la trame 7,20 ---------- */
  for (const x of [-10.8, 3.6, 10.8]) {
    for (const z of [-6.62, 0, 6.62]) column(L, x, z, 0.4, CUT);
  }
  for (const z of [-3.6, 3.6]) {
    column(L, -17.55, z, 0.4, CUT);
    column(L, 17.85, z, 0.3, CUT);
  }

  /* ---------- HIER : plateau de bureaux ---------- */
  curtainPlan(L, V.x, 0, zf - 0.05);
  curtainPlan(L, V.x, CORE.x0, zb + 0.05);
  curtainPlan(L, zb, zf, V.x + 0.05, { along: "z", step: 14 / 11 });
  /* faux plancher technique 60 × 60 */
  for (let x = V.x + 0.6; x < CORE.x0 - 0.1; x += 0.6) L.seg("hair", [x, 0.01, zb + 0.3], [x, 0.01, zf - 0.3]);
  for (let z = zb + 0.6; z < zf - 0.2; z += 0.6) L.seg("hair", [V.x + 0.3, 0.01, z], [CORE.x0 - 0.1, 0.01, z]);
  /* postes de travail */
  for (const z of [-5.6, -1.6, 2.4]) {
    deskBench(L.sub(-16.6, z, 0), 3);
    deskBench(L.sub(-10.2, z, 0), 2);
  }
  /* espace détente et cabine téléphonique */
  sofa(L.sub(-13.8, 6.55, 2), 2.4, 0.9);
  armchair(L.sub(-15.6, 4.75, 0));
  armchair(L.sub(-14.6, 4.75, 0));
  coffeeTable(L.sub(-15.4, 5.0, 0), 1.2, 0.55);
  plant(L.sub(-17.0, 5.2, 0), 1.2);
  plant(L.sub(-8.0, -6.2, 0), 1.1);
  L.box("medium", [-9.6, 0, 4.9], [1.3, CUT, 1.3]);
  armchair(L.sub(-9.35, 5.15, 0));
  L.label("faint", "BUREAUX", [-12.4, 0.02, 1.35], 0.5);

  /* salle de réunion vitrée */
  L.wall(CORE.x0, CORE.z1, CORE.x0, zf - 0.1, { t: 0.06, w: "faint", base: false, openings: [{ at: 0.4, w: 0.9, kind: "door", side: -1, hinge: "a" }] });
  {
    const R = L.sub(-5.4, 4.4, 0);
    R.rect("medium", [0, 0.74, 0], [3.6, 0, 0], [0, 0, 1.2]);
    for (let i = 0; i < 3; i++) {
      chair(R.sub(0.35 + i * 1.15, -0.6, 0));
      chair(R.sub(0.79 + i * 1.15, 1.8, 2));
    }
    chair(R.sub(-0.6, 0.82, 3));
    chair(R.sub(4.2, 0.38, 1));
  }
  L.label("hair", "REUNION", [-3.6, 0.02, 6.4], 0.32);

  /* ---------- noyau béton conservé : escalier, ascenseurs, sanitaires ---------- */
  const t = 0.25;
  L.wall(CORE.x0, CORE.z0, CORE.x1, CORE.z0, {
    t, poche: true,
    openings: [
      { at: 0.4, w: 1.0, kind: "door", side: -1, hinge: "a" },
      { at: 3.1, w: 1.0, kind: "slide" },
      { at: 4.9, w: 1.0, kind: "slide" },
    ],
  });
  L.wall(CORE.x0, CORE.z1, CORE.x1, CORE.z1, { t, poche: true });
  L.wall(CORE.x0, CORE.z0, CORE.x0, CORE.z1, { t, poche: true, openings: [{ at: 4.5, w: 0.9, kind: "door", side: -1, hinge: "b" }] });
  L.wall(-4.5, CORE.z0, -4.5, -0.95, { t: 0.2, poche: true });
  L.wall(-2.7, CORE.z0, -2.7, -0.95, { t: 0.2, poche: true });
  L.wall(-4.5, -0.95, CORE.x1, -0.95, { t: 0.2, poche: true });
  L.partition(CORE.x0 + 0.1, 0.9, -4.5, 0.9);
  L.partition(-4.5, -0.85, -4.5, CORE.z1 - 0.1, [{ at: 2.0, w: 0.8, kind: "door", side: 1, hinge: "a" }]);
  stairU(L.sub(-6.95, CORE.z0 + 0.15, 0), { fw: 1.1, jour: 0.14, FH, risers: 20, tread: 0.27, landing: 1.15, cut: CUT });
  lift(L.sub(-4.35, CORE.z0 + 0.15, 0), 1.5, 1.8);
  lift(L.sub(-2.55, CORE.z0 + 0.15, 0), 1.5, 1.8);
  duct(L.sub(-0.95, CORE.z0 + 0.2, 0), 0.8, 1.7);
  /* bloc sanitaires */
  for (let i = 0; i < 3; i++) {
    const x = -4.35 + i * 1.05;
    L.partition(x + 1.0, 1.35, x + 1.0, CORE.z1 - 0.12);
    wc(L.sub(x + 0.78, CORE.z1 - 0.13, 2));
  }
  L.partition(-4.4, 1.35, -1.2, 1.35, [
    { at: 0.1, w: 0.75, kind: "door", side: -1, hinge: "a" },
    { at: 1.15, w: 0.75, kind: "door", side: -1, hinge: "a" },
    { at: 2.2, w: 0.75, kind: "door", side: -1, hinge: "a" },
  ]);
  basin(L.sub(-4.3, -0.82, 0), 1.8);
  L.label("faint", "A", [-3.6, 0.02, -1.6], 0.36);

  /* ---------- palier d'étage partagé, ouvert sur la coursive ---------- */
  L.wall(CORE.x0, zb + 0.1, CORE.x0, CORE.z0 - 0.12, {
    t: 0.06, w: "faint", base: false,
    openings: [{ at: 1.3, w: 1.6, kind: "door", side: -1, double: true }],
  });
  for (let x = CORE.x0 + 0.6; x < -0.2; x += 0.6) L.seg("hair", [x, 0.01, zb + 0.15], [x, 0.01, CORE.z0 - 0.15]);
  for (let z = zb + 0.6; z < CORE.z0 - 0.1; z += 0.6) L.seg("hair", [CORE.x0 + 0.05, 0.01, z], [-0.2, 0.01, z]);
  L.wall(CORE.x0, zb + 0.15, 0, zb + 0.15, {
    t: 0.3, poche: true,
    openings: [
      { at: 0.8, w: 2.4, kind: "window", sill: 0.9, inside: 1 },
      { at: 4.8, w: 1.6, kind: "door", side: 1, double: true },
    ],
  });
  plant(L.sub(-6.4, -6.1, 0), 1.1);
  L.box("faint", [-6.6, 0, -4.6], [0.45, 0.45, 1.6]);
  L.label("hair", "PALIER", [-3.6, 0.02, -4.4], 0.32);

  /* ---------- la ligne de mutation devient un mur séparatif ---------- */
  L.wall(0.0, zb, 0.0, zf, { t: 0.3, poche: true });

  /* ---------- DEMAIN : deux T4 traversants dans la même trame ---------- */
  for (const apt of APTS) {
    const A = new Local(pen, { x: apt.x0, y: Y5, z: zb, mirror: apt.mirror });
    apartmentT4(A, { W: 9, D: 14, H: CUT });
  }
  L.wall(9, zb + 0.3, 9, zf - 0.3, { t: 0.2, poche: true });
  /* pignon est habité : fenêtre de cuisine, porte-fenêtre du séjour */
  L.wall(17.85, zb, 17.85, zf, {
    t: 0.3, poche: true,
    openings: [
      { at: 4.1, w: 1.5, kind: "window", sill: 1.1, inside: -1 },
      { at: 8.4, w: 2.0, kind: "french", inside: -1 },
    ],
  });
  L.label("faint", "LOGEMENTS", [9, 0.02, zf + 1.35], 0.5);

  /* habitants et travailleurs */
  person(pen, -12.0, -3.6, { y: Y5, h: 1.72, face: 0.3 });
  person(pen, -4.0, -5.0, { y: Y5, h: 1.68, face: -1.6 });
  person(pen, 2.6, 5.2, { y: Y5, h: 1.7, face: 0.8 });
  person(pen, 15.6, -0.6, { y: Y5, h: 1.66, face: 2.4 });
}

export function buildTertiary(ink) {
  const pen = new Pen({ wobble: 0.035 });

  /* ============================ enveloppe ============================ */
  for (const [x, z] of [[V.x, zb], [V.x + V.w, zb], [V.x + V.w, zf], [V.x, zf]]) pen.seg("strong", [x, 0, z], [x, Y5, z]);
  pen.rect("strong", [V.x, 0, zb], [V.w, 0, 0], [0, 0, V.d]);
  pen.rect("medium", [V.x, Y5, zb], [V.w, 0, 0], [0, 0, V.d]);
  pen.rect("hair", [V.x, Y5 - 0.3, zb], [V.w, 0, 0], [0, 0, V.d]);
  pen.solid([V.x, 0, zb], [V.w, Y5, V.d], 0.3);

  /* ---------- façade rideau (moitié ouest, pignon ouest, nord) ---------- */
  for (let i = 0; i <= 15; i++) {
    const x = V.x + i * 1.2;
    pen.seg("medium", [x, 0.4, zf + 0.01], [x, Y5, zf + 0.01]);
    if (x <= CORE.x0 + 0.01) pen.seg("medium", [x, 0.4, zb - 0.01], [x, Y5, zb - 0.01]);
  }
  for (let i = 0; i <= 11; i++) pen.seg("faint", [V.x - 0.01, 0.4, zb + i * (14 / 11)], [V.x - 0.01, Y5, zb + i * (14 / 11)]);
  for (let f = 0; f < FLOORS - 1; f++) {
    const y = f * FH;
    pen.seg("strong", [V.x, y, zf + 0.01], [0, y, zf + 0.01]);
    pen.seg("faint", [V.x, y + 0.95, zf + 0.02], [0, y + 0.95, zf + 0.02]);
    pen.seg("faint", [V.x, y + FH - 0.35, zf + 0.02], [0, y + FH - 0.35, zf + 0.02]);
    pen.seg("strong", [V.x, y, zb - 0.01], [CORE.x0, y, zb - 0.01]);
    pen.seg("faint", [V.x, y + 0.95, zb - 0.02], [CORE.x0, y + 0.95, zb - 0.02]);
    pen.seg("faint", [V.x, y + FH - 0.35, zb - 0.02], [CORE.x0, y + FH - 0.35, zb - 0.02]);
    if (f > 0) pen.seg("medium", [V.x - 0.01, y, zb], [V.x - 0.01, y, zf]);
  }
  /* palier d'étage côté nord : vitrage toute hauteur */
  for (let f = 1; f < FLOORS - 1; f++) {
    const y = f * FH;
    bay(pen, { o: [0, 0, zb], u: [1, 0, 0], n: [0, 0, -1] }, -6.4, y + 0.9, 2.4, 1.6, {});
    bay(pen, { o: [0, 0, zb], u: [1, 0, 0], n: [0, 0, -1] }, -2.4, y, 1.6, 2.4, { kind: "door", coffre: false });
  }

  /* ---------- lignes de mutation, tremblées ---------- */
  for (const [z, d] of [[zf, 1], [zb, -1]]) {
    pen.dashedCurve(
      [[0, -0.4, z + 0.35 * d], [0.25 * d, Y5 * 0.35, z + 0.4 * d], [-0.2, Y5 * 0.7, z + 0.35 * d], [0.1, Y5 + 2.4, z + 0.3 * d]],
      { dash: 0.55, gap: 0.4, opacity: 0.75 }
    );
  }

  /* ---------- moitié est : façades neuves alignées sur le plan ---------- */
  const S = { o: [0, 0, zf], u: [1, 0, 0], n: [0, 0, 1] };
  const N = { o: [0, 0, zb], u: [1, 0, 0], n: [0, 0, -1] };
  const E = { o: [V.x + V.w, 0, 0], u: [0, 0, 1], n: [1, 0, 0] };
  for (let f = 1; f < FLOORS - 1; f++) {
    const y = f * FH;
    pen.seg("strong", [0, y, zf + 0.01], [V.x + V.w, y, zf + 0.01]);
    pen.seg("strong", [0, y, zb - 0.01], [V.x + V.w, y, zb - 0.01]);
    pen.seg("medium", [V.x + V.w + 0.01, y, zb], [V.x + V.w + 0.01, y, zf]);
    for (const apt of APTS) {
      for (const op of OPS.south) bay(pen, S, wx(apt, op.a, op.w), y, op.w, op.h, { kind: op.kind });
      for (const op of OPS.north) bay(pen, N, wx(apt, op.a, op.w), y + op.sill, op.w, op.h, { kind: op.kind, coffre: op.kind !== "door" });
    }
    bay(pen, E, -2.9, y + 1.1, 1.5, 1.0, {});
    bay(pen, E, 1.4, y, 2.0, 2.25, { kind: "french" });
  }

  /* ---------- rez-de-chaussée : accueil vitré, commerce, marquise ---------- */
  pen.rect("strong", [1.0, 0.2, zf + 0.012], [16, 0, 0], [0, 2.8, 0]);
  pen.grid("medium", [1.0, 0.2, zf + 0.012], [16, 0, 0], [0, 2.8, 0], 8, 2);
  pen.box("medium", [V.x + V.w, 2.8, -0.5], [1.3, 0.18, 3.4]);
  pen.solid([V.x + V.w, 2.8, -0.5], [1.3, 0.18, 3.4], 0.04);
  bay(pen, E, 0.0, 0, 2.2, 2.5, { kind: "door", coffre: false });
  bay(pen, E, -5.6, 0.9, 2.0, 1.6, {});
  bay(pen, E, 4.0, 0.9, 2.0, 1.6, {});
  for (let i = 0; i < 5; i++) pen.seg("hair", [-14 + i * 2.4, 0.3, zf + 0.6], [-14 + i * 2.4, 2.9, zf + 0.6]);

  /* ---------- dalles prolongées en balcons filants (sud) ---------- */
  for (let f = 1; f < FLOORS; f++) {
    const y = f * FH;
    pen.box("medium", [0.15, y - 0.22, zf], [17.7, 0.22, BAL]);
    pen.solid([0.15, y - 0.22, zf], [17.7, 0.22, BAL], 0.04);
    balustrade(pen, [0.3, y, zf + BAL], [17.7, y, zf + BAL], { h: 1.05, step: 0.36 });
    pen.seg("faint", [0.3, y + 1.05, zf], [0.3, y + 1.05, zf + BAL]);
    pen.seg("faint", [17.7, y + 1.05, zf], [17.7, y + 1.05, zf + BAL]);
    pen.rect("medium", [9, y, zf], [0, 0, BAL], [0, 1.8, 0]);
    for (let i = 1; i < 7; i++) pen.seg("hair", [9, y, zf + i * 0.27], [9, y + 1.8, zf + i * 0.27]);
    planterRow(pen, [1.4, y + 1.05, zf + BAL], [16.6, y + 1.05, zf + BAL], 7, 0.8);
  }
  person(pen, 4.6, zf + 1, { y: 2 * FH, h: 1.7, face: 0.3 });
  person(pen, 13.2, zf + 1, { y: 4 * FH, h: 1.7, face: -0.4 });

  /* ---------- coursive greffée au nord ---------- */
  for (let f = 1; f < FLOORS; f++) {
    const y = f * FH;
    pen.box("medium", [-2.6, y - 0.22, zb - CO], [20.4, 0.22, CO]);
    pen.solid([-2.6, y - 0.22, zb - CO], [20.4, 0.22, CO], 0.04);
    balustrade(pen, [-2.45, y, zb - CO], [17.65, y, zb - CO], { h: 1.1, step: 0.4 });
    pen.seg("faint", [-2.45, y + 1.1, zb], [-2.45, y + 1.1, zb - CO]);
    pen.seg("faint", [17.65, y + 1.1, zb], [17.65, y + 1.1, zb - CO]);
    if (f % 2 === 0) planterRow(pen, [2.5, y + 1.1, zb - CO], [14.5, y + 1.1, zb - CO], 5, 0.8);
  }
  for (const x of [-2.5, 3.6, 10.8, 17.7]) pen.box("faint", [x - 0.06, 0, zb - CO + 0.02], [0.12, Y5 + 1.1, 0.12]);
  person(pen, 8.5, zb - 0.6, { y: 3 * FH, h: 1.7, face: 3.14 });
  person(pen, 14.2, zb - 0.6, { y: FH, h: 1.6, face: 2.8 });

  /* ---------- balcons greffés sur le pignon est (séjours) ---------- */
  for (let f = 1; f < FLOORS; f++) {
    const y = f * FH;
    const xe = V.x + V.w;
    pen.box("medium", [xe, y - 0.18, 0.9], [1.45, 0.18, 3.0]);
    pen.solid([xe, y - 0.18, 0.9], [1.45, 0.18, 3.0], 0.04);
    balustrade(pen, [xe + 1.45, y, 1.0], [xe + 1.45, y, 3.8], { h: 1.05, step: 0.36 });
    pen.seg("faint", [xe, y + 1.05, 1.0], [xe + 1.45, y + 1.05, 1.0]);
    pen.seg("faint", [xe, y + 1.05, 3.8], [xe + 1.45, y + 1.05, 3.8]);
    planterRow(pen, [xe + 1.45, y + 1.05, 1.3], [xe + 1.45, y + 1.05, 3.5], 3, 0.62);
  }
  person(pen, V.x + V.w + 1.0, 2.0, { y: 2 * FH, h: 1.66, face: 1.5 });

  /* ================== le dernier niveau, écorché ================== */
  cutFloor(pen);

  /* ================= LA GRUE ================= */
  const C = { x: 26, z: -2, h: 27, half: 0.75 };
  const legs = [
    [C.x - C.half, C.z - C.half], [C.x + C.half, C.z - C.half],
    [C.x + C.half, C.z + C.half], [C.x - C.half, C.z + C.half],
  ];
  for (const [lx, lz] of legs) pen.seg("strong", [lx, 0, lz], [lx, C.h, lz]);
  for (let i = 0; i < 18; i++) {
    const y0 = i * 1.5;
    const y1 = (i + 1) * 1.5;
    for (let fce = 0; fce < 4; fce++) {
      const a = legs[fce];
      const b = legs[(fce + 1) % 4];
      if (i % 2 === 0) pen.seg("faint", [a[0], y0, a[1]], [b[0], y1, b[1]]);
      else pen.seg("faint", [b[0], y0, b[1]], [a[0], y1, a[1]]);
      if (i % 3 === 0) pen.seg("faint", [a[0], y0, a[1]], [b[0], y0, b[1]]);
    }
  }
  pen.box("medium", [C.x - 1.6, 0, C.z - 1.6], [3.2, 0.6, 3.2]);
  const jy = C.h - 1.5;
  pen.seg("strong", [C.x, jy, C.z], [C.x - 22, jy, C.z]);
  pen.seg("medium", [C.x, jy + 1, C.z], [C.x - 22, jy, C.z]);
  for (let i = 1; i < 10; i++) {
    pen.seg("faint", [C.x - i * 2.2, jy, C.z], [C.x - i * 2.2 + 1.1, jy + 1 - i * 0.1, C.z]);
  }
  pen.seg("strong", [C.x, jy, C.z], [C.x + 7, jy, C.z]);
  pen.box("medium", [C.x + 5.4, jy - 1.6, C.z - 0.7], [1.6, 1.4, 1.4]);
  pen.seg("faint", [C.x + 5.4, jy - 1.6, C.z + 0.7], [C.x + 7, jy - 0.2, C.z + 0.7]);
  pen.seg("faint", [C.x + 7, jy - 1.6, C.z + 0.7], [C.x + 5.4, jy - 0.2, C.z + 0.7]);
  pen.seg("medium", [C.x, C.h, C.z], [C.x - 11, jy + 1, C.z]);
  pen.seg("medium", [C.x, C.h, C.z], [C.x + 6.5, jy + 0.2, C.z]);
  pen.box("faint", [C.x - 1.2, jy - 2.4, C.z - 0.9], [1.6, 2.2, 1.8]);
  /* câble + module de balcon suspendu, en route vers la façade */
  const hookX = C.x - 15.5;
  const hy = Y5 + 4.2;
  pen.seg("medium", [hookX, jy, C.z], [hookX, hy + 2.4, C.z]);
  pen.poly("faint", [[hookX - 1.6, hy + 1.2, C.z], [hookX, hy + 2.4, C.z], [hookX + 1.6, hy + 1.2, C.z]]);
  pen.box("strong", [hookX - 1.8, hy, C.z - 1], [3.6, 0.24, 2]);
  balustrade(pen, [hookX - 1.7, hy + 0.24, C.z + 1], [hookX + 1.7, hy + 0.24, C.z + 1], { h: 0.9, step: 0.34 });
  pen.dashed("hair", [hookX, hy - 0.2, C.z], [hookX, Y5 + 0.3, C.z], { dash: 0.3, gap: 0.3 });

  /* ================= SOL & CONTEXTE ================= */
  pen.rect("medium", [V.x - 4, 0, V.z - 4], [V.w + 15, 0, 0], [0, 0, V.d + 12]);
  pen.rect("faint", [V.x - 7, 0, V.z - 7], [V.w + 21, 0, 0], [0, 0, V.d + 18]);
  for (let i = 0; i < 6; i++) {
    pen.seg("medium", [3 + i * 1.1, 0.01, zf + 4.5], [3.55 + i * 1.1, 0.01, zf + 6.5]);
  }
  gridAxes(pen, {
    xs: XS, zs: [zb, 0, zf], x0: V.x, x1: V.x + V.w + 1.5, z0: zb - CO, z1: zf + BAL, ext: 2.2, r: 0.6,
  });
  dimChain(pen, XS, { along: "x", at: zf + BAL + 1.2, from: zf + BAL, size: 0.5 });

  tree(pen, -23.5, 4, { h: 7, r: 2.7 });
  tree(pen, 22, 10, { h: 5.5, r: 2.2 });
  tuft(pen, -21, 0, 9, 1.6);
  tuft(pen, 20, 0, 12.5, 1.4);
  person(pen, -7, zf + 3.4, { face: 0.8 });
  person(pen, -5.6, zf + 3.7, { h: 1.65, face: 2.4 });
  person(pen, 9.5, zf + 5.2, { h: 1.8, face: -1.2 });
  person(pen, 10.8, zf + 5.4, { h: 1.15, face: -0.8 });
  bike(pen, -11, zf + 2.6, { face: 0.1 });

  return pen.build(ink);
}
