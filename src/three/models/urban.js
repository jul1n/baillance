import * as THREE from "three";
import { Pen, windowOn, balustrade, tree, person, tuft, bike } from "../lineKit.js";

/**
 * URBANISME ET MIXITÉ — un angle de ville haussmannien : immeuble en L
 * à pan coupé et dôme, mansardes hachurées, lucarnes, cheminées,
 * balcons filants ; au sol, tram, vélos, terrasse de café, canopée.
 */
export function buildUrban(ink) {
  const pen = new Pen({ wobble: 0.03 });

  const H = 15;      // corniche principale
  const HM = 18;     // faîtage de la mansarde
  const CH = 2.8;    // pan coupé (demi-largeur)

  /* ================= L'ÎLOT EN L ================= */
  // wing A : front sur la rue z = -2 (de x=-26 à x=-2) ; wing B : front sur x = -2.
  const A = { x0: -26, x1: -2 - CH, z: -2, depth: 10 };
  const B = { z0: -26, z1: -2 - CH, x: -2, depth: 10 };

  /* ---- arêtes principales des volumes ---- */
  pen.poly("strong", [
    [A.x0, 0, A.z], [A.x0, H, A.z],
  ]);
  pen.poly("strong", [[A.x1, 0, A.z], [A.x1, H, A.z]]);
  pen.poly("strong", [[B.x, 0, B.z0], [B.x, H, B.z0]]);
  pen.poly("strong", [[B.x, 0, B.z1], [B.x, H, B.z1]]);
  // pan coupé
  pen.seg("strong", [A.x1, 0, A.z], [B.x, 0, B.z1]);
  pen.seg("strong", [A.x1, H, A.z], [B.x, H, B.z1]);
  // lignes de corniche + entablement
  for (const y of [H, H - 0.55]) {
    pen.poly("strong", [[A.x0, y, A.z], [A.x1, y, A.z], [B.x, y, B.z1], [B.x, y, B.z0]]);
  }
  // arrière de l'îlot (cour) — plus discret
  pen.poly("medium", [
    [A.x0, H, A.z - A.depth], [A.x0, 0, A.z - A.depth],
  ]);
  pen.poly("medium", [[A.x0, H, A.z - A.depth], [B.x - B.depth, H, A.z - A.depth]]);
  pen.poly("medium", [[B.x - B.depth, H, A.z - A.depth], [B.x - B.depth, H, B.z0], [B.x - B.depth, 0, B.z0]]);
  pen.seg("medium", [B.x - B.depth, H, B.z0], [B.x, H, B.z0]);
  pen.seg("medium", [A.x0, H, A.z - A.depth], [A.x0, H, A.z]);

  /* ---- étages : bandeaux filants ---- */
  for (const y of [3.6, 6.4, 9.2, 12]) {
    pen.poly("faint", [[A.x0, y, A.z + 0.01], [A.x1, y, A.z + 0.01], [B.x + 0.01, y, B.z1], [B.x + 0.01, y, B.z0]]);
  }

  /* ---- trames de fenêtres des deux fronts + pan coupé ---- */
  const floors = [
    { y: 4.1, h: 2.0, rail: 4, balc: false },
    { y: 6.9, h: 2.0, rail: 0, balc: true },   // étage noble : balcon filant
    { y: 9.7, h: 1.9, rail: 4, balc: false },
    { y: 12.4, h: 1.7, rail: 0, balc: true },  // 5e : balcon filant
  ];
  // wing A (façade z = -2, regarde +z)
  const baysA = 8;
  for (const fl of floors) {
    for (let b = 0; b < baysA; b++) {
      const wx = A.x0 + 1.3 + b * 2.78;
      windowOn(pen, [wx, fl.y, A.z + 0.02], [1.45, 0, 0], [0, fl.h, 0], { rail: fl.rail, transom: false });
    }
  }
  // wing B (façade x = -2, regarde +x)
  const baysB = 8;
  for (const fl of floors) {
    for (let b = 0; b < baysB; b++) {
      const wz = B.z0 + 1.3 + b * 2.78;
      windowOn(pen, [B.x + 0.02, fl.y, wz], [0, 0, 1.45], [0, fl.h, 0], { rail: fl.rail, transom: false });
    }
  }
  // pan coupé : une travée par étage
  const pcDir = [B.x - A.x1, 0, B.z1 - A.z]; // vecteur du pan
  for (const fl of floors) {
    const o = [A.x1 + pcDir[0] * 0.28 + 0.015, fl.y, A.z + pcDir[2] * 0.28 + 0.015];
    windowOn(pen, o, [pcDir[0] * 0.44, 0, pcDir[2] * 0.44], [0, fl.h, 0], { rail: fl.rail, transom: false });
  }

  /* ---- balcons filants haussmanniens (2e et 5e) ---- */
  for (const y of [6.9, 12.4]) {
    // le long de A
    pen.seg("medium", [A.x0 + 0.8, y - 0.12, A.z + 0.45], [A.x1, y - 0.12, A.z + 0.45]);
    balustrade(pen, [A.x0 + 0.8, y, A.z + 0.45], [A.x1, y, A.z + 0.45], { h: 0.95, step: 0.3 });
    // le long de B
    pen.seg("medium", [B.x + 0.45, y - 0.12, B.z0 + 0.8], [B.x + 0.45, y - 0.12, B.z1]);
    balustrade(pen, [B.x + 0.45, y, B.z0 + 0.8], [B.x + 0.45, y, B.z1], { h: 0.95, step: 0.3 });
    // retour sur le pan coupé
    balustrade(pen, [A.x1 + 0.32, y, A.z + 0.32], [B.x + 0.32, y, B.z1 + 0.32], { h: 0.95, step: 0.3 });
  }

  /* ---- rez-de-chaussée : commerces, arcades, terrasse ---- */
  // vitrines wing A : 4 boutiques à auvent
  for (let sIdx = 0; sIdx < 4; sIdx++) {
    const x0 = A.x0 + 1 + sIdx * 5.6;
    pen.rect("strong", [x0, 0.3, A.z + 0.02], [4.6, 0, 0], [0, 2.6, 0]);
    pen.grid("medium", [x0, 0.3, A.z + 0.02], [4.6, 0, 0], [0, 2.6, 0], 3, 1);
    // auvent en saillie + festons
    pen.rect("medium", [x0, 3, A.z], [4.6, 0, 0], [0, -0.55, 1.6]);
    for (let i = 0; i < 6; i++) {
      const fx = x0 + 0.38 + i * 0.77;
      pen.circle("faint", [fx, 2.45, A.z + 1.6], 0.19, { axis: "z", n: 8, a0: Math.PI, a1: Math.PI * 2 });
    }
  }
  // wing B : arcades en pied
  for (let i = 0; i < 5; i++) {
    const z0 = B.z0 + 1.2 + i * 4.4;
    pen.rect("strong", [B.x + 0.02, 0, z0], [0, 0, 3.4], [0, 2.4, 0]);
    pen.circle("medium", [B.x + 0.02, 2.4, z0 + 1.7], 1.7, { axis: "x", n: 16, a0: 0, a1: Math.PI });
  }
  // porte cochère sur le pan coupé
  pen.rect("strong", [A.x1 + pcDir[0] * 0.3, 0, A.z + pcDir[2] * 0.3], [pcDir[0] * 0.4, 0, pcDir[2] * 0.4], [0, 3.2, 0]);
  pen.circle("medium", [A.x1 + pcDir[0] * 0.5, 3.2, A.z + pcDir[2] * 0.5], 1.05, { axis: "z", n: 12, a0: 0, a1: Math.PI });

  /* ---- mansardes : brisis hachurés + lucarnes + cheminées ---- */
  // wing A : brisis incliné de (y=H, z=-2) vers (y=HM, z=-3.8)
  pen.poly("strong", [[A.x0, HM, A.z - 1.8], [A.x1 + 1, HM, A.z - 1.8]]);
  pen.seg("medium", [A.x0, H, A.z], [A.x0, HM, A.z - 1.8]);
  pen.seg("medium", [A.x1, H, A.z], [A.x1 + 1, HM, A.z - 1.8]);
  pen.hatch("faint", [A.x0 + 0.3, H + 0.12, A.z - 0.12], [A.x1 - A.x0 - 0.6, 0, 0], [0, HM - H - 0.3, -1.62], 13);
  // wing B
  pen.poly("strong", [[B.x - 1.8, HM, B.z0], [B.x - 1.8, HM, B.z1 + 1]]);
  pen.seg("medium", [B.x, H, B.z0], [B.x - 1.8, HM, B.z0]);
  pen.seg("medium", [B.x, H, B.z1], [B.x - 1.8, HM, B.z1 + 1]);
  pen.hatch("faint", [B.x - 0.12, H + 0.12, B.z0 + 0.3], [0, 0, B.z1 - B.z0 - 0.6], [-1.62, HM - H - 0.3, 0], 13);
  // terrasson (partie plate haute) — hachure plus espacée
  pen.hatch("faint", [A.x0 + 0.4, HM, A.z - 2], [A.x1 - A.x0, 0, 0], [0, 0, -4], 6);
  pen.hatch("faint", [B.x - 2, HM, B.z0 + 0.4], [0, 0, B.z1 - B.z0], [-4, 0, 0], 6);
  // lucarnes wing A
  for (let i = 0; i < 4; i++) {
    const lx = A.x0 + 3 + i * 5.6;
    pen.box("medium", [lx, H + 0.5, A.z - 1.5], [1.3, 1.5, 1.3]);
    pen.poly("medium", [
      [lx, H + 2, A.z - 0.2], [lx + 0.65, H + 2.6, A.z - 0.2], [lx + 1.3, H + 2, A.z - 0.2],
    ]);
    pen.rect("medium", [lx + 0.2, H + 0.7, A.z - 0.19], [0.9, 0, 0], [0, 1.1, 0]);
    pen.seg("faint", [lx + 0.65, H + 0.7, A.z - 0.19], [lx + 0.65, H + 1.8, A.z - 0.19]);
  }
  // lucarnes wing B
  for (let i = 0; i < 4; i++) {
    const lz = B.z0 + 3 + i * 5.6;
    pen.box("medium", [B.x - 1.5, H + 0.5, lz], [1.3, 1.5, 1.3]);
    pen.poly("medium", [
      [B.x - 0.2, H + 2, lz], [B.x - 0.2, H + 2.6, lz + 0.65], [B.x - 0.2, H + 2, lz + 1.3],
    ]);
    pen.rect("medium", [B.x - 0.19, H + 0.7, lz + 0.2], [0, 0, 0.9], [0, 1.1, 0]);
  }
  // cheminées + mitrons
  for (const [cx, cz] of [[-22, -5.5], [-13, -5.8], [-5.5, -5.2], [-5.6, -14], [-5.2, -21]]) {
    pen.box("medium", [cx, HM - 0.4, cz], [1.5, 2.1, 0.9]);
    for (let m = 0; m < 3; m++) {
      pen.seg("medium", [cx + 0.3 + m * 0.45, HM + 1.7, cz + 0.45], [cx + 0.3 + m * 0.45, HM + 2.35, cz + 0.45]);
    }
  }

  /* ---- pavillon d'angle : tambour + dôme sur le pan coupé ---- */
  const domeC = [(A.x1 + B.x) / 2, HM, (A.z + B.z1) / 2];
  // tambour : le pan coupé monte jusqu'au faîtage
  pen.seg("strong", [A.x1, H, A.z], [A.x1, HM, A.z]);
  pen.seg("strong", [B.x, H, B.z1], [B.x, HM, B.z1]);
  pen.seg("strong", [A.x1, HM, A.z], [B.x, HM, B.z1]);
  pen.seg("medium", [A.x1, HM, A.z], [A.x1 + 1, HM, A.z - 1.8]);
  pen.seg("medium", [B.x, HM, B.z1], [B.x - 1.8, HM, B.z1 + 1]);
  pen.hatch("faint", [A.x1 + pcDir[0] * 0.06, H + 0.25, A.z + pcDir[2] * 0.06], [pcDir[0] * 0.88, 0, pcDir[2] * 0.88], [0, HM - H - 0.5, 0], 8);
  pen.circle("strong", [domeC[0], HM + 0.1, domeC[2]], 2.5, { axis: "y", n: 26 });
  pen.edges("medium", new THREE.SphereGeometry(2.5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), {
    pos: [domeC[0], HM + 0.1, domeC[2]],
  });
  pen.seg("strong", [domeC[0], HM + 2.6, domeC[2]], [domeC[0], HM + 3.9, domeC[2]]);
  pen.circle("medium", [domeC[0], HM + 3.3, domeC[2]], 0.28, { axis: "y", n: 10 });

  /* ================= CONTEXTE : ÎLOT VOISIN BAS ================= */
  const N = { x: 9, z: -22, w: 11, d: 12, h: 7 };
  pen.box("medium", [N.x, 0, N.z], [N.w, N.h, N.d]);
  for (let f = 0; f < 2; f++) {
    for (let b = 0; b < 3; b++) {
      windowOn(pen, [N.x - 0.01, f * 3 + 0.9, N.z + 1.5 + b * 3.4], [0, 0, 1.7], [0, 1.5, 0], {
        rail: 0, transom: false, mullion: true,
      });
      windowOn(pen, [N.x + 1.6 + b * 3.2, f * 3 + 0.9, N.z + N.d + 0.01], [1.6, 0, 0], [0, 1.5, 0], {
        rail: 0, transom: false, mullion: true,
      });
    }
  }
  pen.rect("medium", [N.x, N.h - 0.4, N.z], [N.w, 0, 0], [0, 0, N.d]);
  // toiture végétalisée du voisin, esquissée
  for (let i = 0; i < 5; i++) {
    tuft(pen, N.x + 1.6 + i * 1.9, N.h, N.z + 2 + (i % 3) * 3.6, 0.8);
  }
  pen.hatch("faint", [N.x + 0.4, N.h + 0.02, N.z + 0.4], [N.w - 0.8, 0, 0], [0, 0, N.d - 0.8], 5);

  /* ================= LES RUES ================= */
  // rue le long de A (z entre -2 et +8) et rue le long de B (x entre -2 et +8)
  pen.seg("strong", [-30, 0, 1.4], [24, 0, 1.4]);       // bordure trottoir A
  pen.seg("medium", [-30, 0, 8], [24, 0, 8]);           // bordure opposée
  pen.seg("strong", [1.4, 0, -30], [1.4, 0, 24]);       // bordure trottoir B
  pen.seg("medium", [8, 0, -30], [8, 0, 24]);
  // rails de tram (rue B) + traverses
  for (const rx of [3.6, 5.1]) pen.seg("medium", [rx, 0.02, -30], [rx, 0.02, 24]);
  for (let i = 0; i < 16; i++) {
    const tz = -28 + i * 3.4;
    if (tz > 3 && tz < 13) continue; // le tram occupe ce créneau
    pen.seg("faint", [3.6, 0.02, tz], [5.1, 0.02, tz]);
  }
  // bande cyclable (rue A) en tirets
  pen.dashedCurve([[-30, 0.02, 5.6], [-4, 0.02, 5.6], [24, 0.02, 5.6]], { dash: 1.1, gap: 0.9, opacity: 0.5 });
  pen.dashedCurve([[-30, 0.02, 7.1], [-4, 0.02, 7.1], [24, 0.02, 7.1]], { dash: 1.1, gap: 0.9, opacity: 0.5 });
  // passages piétons
  for (let i = 0; i < 5; i++) {
    pen.seg("medium", [-11 + i * 0.9, 0.02, 1.9], [-11.45 + i * 0.9, 0.02, 7.6]);
    pen.seg("medium", [1.9, 0.02, -12 + i * 0.9], [7.6, 0.02, -12.45 + i * 0.9]);
  }

  /* ---- le tram ---- */
  const T = { x: 3.15, z: 3, w: 2.4, l: 10, h: 3.3 };
  pen.box("strong", [T.x, 0.25, T.z], [T.w, T.h - 0.25, T.l]);
  // bandeau vitré continu
  pen.rect("medium", [T.x - 0.01, 1.5, T.z + 0.4], [0, 0, T.l - 0.8], [0, 1.2, 0]);
  pen.grid("faint", [T.x - 0.01, 1.5, T.z + 0.4], [0, 0, T.l - 0.8], [0, 1.2, 0], 6, 1);
  pen.rect("medium", [T.x + T.w + 0.01, 1.5, T.z + 0.4], [0, 0, T.l - 0.8], [0, 1.2, 0]);
  pen.grid("faint", [T.x + T.w + 0.01, 1.5, T.z + 0.4], [0, 0, T.l - 0.8], [0, 1.2, 0], 6, 1);
  // portes
  for (const dz of [T.z + 1.2, T.z + T.l - 2.4]) {
    pen.rect("medium", [T.x - 0.01, 0.3, dz], [0, 0, 1.2], [0, 2.3, 0]);
    pen.seg("faint", [T.x - 0.01, 0.3, dz + 0.6], [T.x - 0.01, 2.6, dz + 0.6]);
  }
  // pantographe + ligne aérienne
  pen.poly("medium", [
    [T.x + T.w / 2 - 0.5, T.h, T.z + 4.4], [T.x + T.w / 2, T.h + 1.1, T.z + 5],
    [T.x + T.w / 2 + 0.5, T.h, T.z + 5.6],
  ]);
  pen.seg("faint", [T.x + T.w / 2, T.h + 1.1, -30], [T.x + T.w / 2, T.h + 1.1, 24]);

  /* ---- terrasse de café au pied du pan coupé ---- */
  const cafe = { x: 3.4, z: -3.4 };
  pen.seg("medium", [cafe.x, 0, cafe.z], [cafe.x, 2.2, cafe.z]);
  pen.edges("medium", new THREE.ConeGeometry(1.7, 0.55, 8), { pos: [cafe.x, 2.4, cafe.z] });
  pen.circle("medium", [cafe.x - 0.4, 0.75, cafe.z + 0.5], 0.45, { axis: "y", n: 12 });
  pen.seg("faint", [cafe.x - 0.4, 0, cafe.z + 0.5], [cafe.x - 0.4, 0.75, cafe.z + 0.5]);
  person(pen, cafe.x - 1.1, cafe.z + 0.7, { h: 1.25, face: 0.2 });
  person(pen, cafe.x + 0.4, cafe.z + 1.1, { h: 1.25, face: 2.8 });

  /* ---- canopée : alignements d'arbres des deux rues ---- */
  for (let i = 0; i < 4; i++) tree(pen, -22 + i * 6.4, 3.4, { h: 5.5 + (i % 2), r: 2.3 });
  for (let i = 0; i < 3; i++) tree(pen, 3.2, -24 + i * 7, { h: 5 + (i % 2) * 1.2, r: 2.1 });
  tree(pen, 12, 12, { h: 7, r: 3 });
  tree(pen, 18, 4, { h: 5, r: 2 });
  // ombres portées de la canopée
  for (const [ox, oz, r] of [[-22, 3.4, 2.6], [-9.2, 3.4, 2.6], [12, 12, 3.2]]) {
    pen.circle("faint", [ox + 0.8, 0.02, oz + 0.8], r, { axis: "y", n: 18 });
    pen.hatch("faint", [ox - r * 0.6, 0.02, oz - r * 0.4], [r * 1.6, 0, r * 0.9], [r * 0.5, 0, r * 0.9], 5);
  }

  /* ---- vie de rue ---- */
  bike(pen, -14, 6.3, { face: 0.05 });
  bike(pen, -6, 6.9, { face: 0.12 });
  person(pen, -17, 2.6, { face: 1.4 });
  person(pen, -8.5, 2.4, { h: 1.68, face: -0.8 });
  person(pen, -7.4, 2.6, { h: 1.1, face: -0.5 });
  person(pen, 2.4, -8.5, { face: 0.4 });
  person(pen, 10.5, 2.6, { h: 1.8, face: 2.2 });
  person(pen, 12.3, -3.5, { h: 1.7, face: 1.9 });

  return pen.build(ink);
}
