import { Pen, windowOn, balustrade, tree, person, tuft, planterRow, bike } from "../lineKit.js";

/**
 * LOGEMENT SOCIAL — deux volumes en L autour d'un parvis planté :
 * hall traversant sous auvent, balcons filants plantés, toiture
 * partagée sous pergola.
 */
export function buildSocial(ink) {
  const pen = new Pen({ wobble: 0.04 });

  /* ================= VOLUME A : R+4, 24 × 12 ================= */
  const A = { x: -15, z: -6, w: 24, d: 12, h: 15.2 };
  pen.box("strong", [A.x, 0, A.z], [A.w, A.h, A.d]);
  // acrotère + double couronnement
  pen.rect("medium", [A.x + 0.35, A.h - 0.5, A.z + 0.35], [A.w - 0.7, 0, 0], [0, 0, A.d - 0.7]);
  pen.rect("strong", [A.x, A.h - 0.9, A.z], [A.w, 0, 0], [0, 0, A.d]);
  // nez de dalle sur les quatre faces
  for (let f = 1; f <= 4; f++) {
    const y = f * 3;
    pen.poly("faint", [
      [A.x, y, A.z + A.d], [A.x + A.w, y, A.z + A.d], [A.x + A.w, y, A.z],
      [A.x, y, A.z], [A.x, y, A.z + A.d],
    ]);
  }

  /* --- façade sud (z = +6) : 7 travées × 4 niveaux --- */
  const zf = A.z + A.d + 0.01;
  for (let f = 1; f <= 4; f++) {
    for (let b = 0; b < 7; b++) {
      const wx = A.x + 1.5 + b * 3.2;
      windowOn(pen, [wx, f * 3 + 0.9, zf], [1.9, 0, 0], [0, 1.65, 0], { rail: 5 });
    }
  }
  // balcons filants plantés (travées 2-3 et 5-6, tous niveaux)
  for (let f = 1; f <= 4; f++) {
    for (const [b0, b1] of [[1, 3], [4, 6]]) {
      const x0 = A.x + 1.2 + b0 * 3.2;
      const x1 = A.x + 1.2 + b1 * 3.2 + 0.6;
      const y = f * 3;
      pen.box("medium", [x0, y - 0.18, zf], [x1 - x0, 0.18, 1.5]);
      balustrade(pen, [x0, y, zf + 1.5], [x1, y, zf + 1.5], { h: 1.05, step: 0.38 });
      pen.seg("faint", [x0, y, zf], [x0, y + 1.05, zf]);
      pen.seg("faint", [x1, y, zf], [x1, y + 1.05, zf]);
      planterRow(pen, [x0 + 0.5, y + 1.05, zf + 1.5], [x1 - 0.5, y + 1.05, zf + 1.5], 4, 0.9);
    }
  }

  /* --- rez-de-chaussée : hall + salle commune vitrées --- */
  const hall = { x: -4.5, w: 9 };
  pen.rect("strong", [hall.x, 0.25, zf], [hall.w, 0, 0], [0, 2.55, 0]);
  pen.grid("medium", [hall.x, 0.25, zf], [hall.w, 0, 0], [0, 2.55, 0], 6, 2);
  // double porte
  pen.rect("strong", [-1.1, 0, zf + 0.02], [2.2, 0, 0], [0, 2.3, 0]);
  pen.seg("medium", [0, 0, zf + 0.02], [0, 2.3, zf + 0.02]);
  // auvent suspendu par tirants
  pen.box("strong", [-2.6, 2.7, zf], [5.2, 0.14, 2.1]);
  pen.seg("medium", [-2.3, 2.84, zf + 1.9], [-1.4, 4.4, zf + 0.02]);
  pen.seg("medium", [2.3, 2.84, zf + 1.9], [1.4, 4.4, zf + 0.02]);
  // emmarchement + rampe
  pen.poly("medium", [[-2.8, 0.16, zf + 2.5], [2.8, 0.16, zf + 2.5], [2.8, 0.16, zf + 3.2], [-2.8, 0.16, zf + 3.2]]);
  pen.poly("faint", [[2.8, 0.16, zf + 2.8], [6.4, 0, zf + 2.8], [6.4, 0, zf + 3.4], [2.8, 0.16, zf + 3.4]]);
  // salle commune (gauche du hall)
  pen.rect("strong", [A.x + 1.2, 0.25, zf], [6.5, 0, 0], [0, 2.55, 0]);
  pen.grid("medium", [A.x + 1.2, 0.25, zf], [6.5, 0, 0], [0, 2.55, 0], 4, 1);

  /* --- pignon ouest (x = A.x) : trame secondaire --- */
  for (let f = 1; f <= 4; f++) {
    for (let b = 0; b < 3; b++) {
      windowOn(pen, [A.x - 0.01, f * 3 + 0.95, A.z + 1.6 + b * 3.4], [0, 0, 2], [0, 1.55, 0], {
        rail: 4, transom: false,
      });
    }
  }
  /* --- façade nord : fenêtres plus sobres --- */
  for (let f = 1; f <= 4; f++) {
    for (let b = 0; b < 7; b++) {
      windowOn(pen, [A.x + 1.7 + b * 3.2, f * 3 + 1, A.z - 0.01], [1.6, 0, 0], [0, 1.45, 0], {
        rail: 0, transom: false,
      });
    }
  }

  /* --- toiture partagée : pergola, potagers, habitants --- */
  const ry = A.h - 0.9;
  pen.hatch("faint", [A.x + 0.5, ry + 0.02, A.z + 0.5], [A.w - 1, 0, 0], [0, 0, A.d - 1], 18);
  for (const px of [-9, -5, -1, 3]) {
    pen.seg("medium", [px, ry, -2], [px, ry + 2.3, -2]);
    pen.seg("medium", [px, ry, 2.5], [px, ry + 2.3, 2.5]);
  }
  pen.seg("strong", [-9, ry + 2.3, -2], [3, ry + 2.3, -2]);
  pen.seg("strong", [-9, ry + 2.3, 2.5], [3, ry + 2.3, 2.5]);
  for (let i = 0; i <= 8; i++) {
    const px = -9 + i * 1.5;
    pen.seg("faint", [px, ry + 2.3, -2.4], [px, ry + 2.3, 2.9]);
  }
  for (const [bx, bz] of [[5.5, -3], [5.5, 0.5], [7.6, -3], [7.6, 0.5]]) {
    pen.box("medium", [bx, ry, bz], [1.5, 0.5, 2.4]);
    planterRow(pen, [bx + 0.3, ry + 0.5, bz + 1.2], [bx + 1.2, ry + 0.5, bz + 1.2], 3, 0.75);
  }
  planterRow(pen, [A.x + 1, ry + 0.4, A.z + 0.8], [A.x + A.w - 6, ry + 0.4, A.z + 0.8], 9, 0.8);
  person(pen, -3.5, 0.4, { h: 1.7, y: ry });

  /* ================= VOLUME B : R+3 en retour ================= */
  const B = { x: 9, z: -6, w: 11, d: 9, h: 12.2 };
  pen.box("strong", [B.x, 0, B.z], [B.w, B.h, B.d]);
  pen.rect("strong", [B.x, B.h - 0.85, B.z], [B.w, 0, 0], [0, 0, B.d]);
  pen.hatch("faint", [B.x + 0.4, B.h - 0.8, B.z + 0.4], [B.w - 0.8, 0, 0], [0, 0, B.d - 0.8], 12);
  for (let f = 1; f <= 3; f++) {
    const y = f * 3;
    pen.poly("faint", [[B.x, y, B.z + B.d], [B.x + B.w, y, B.z + B.d], [B.x + B.w, y, B.z]]);
    // balcon filant sur le pignon est
    pen.box("medium", [B.x + B.w, y - 0.18, B.z + 0.8], [1.4, 0.18, B.d - 1.6]);
    balustrade(pen, [B.x + B.w + 1.4, y, B.z + 0.9], [B.x + B.w + 1.4, y, B.z + B.d - 0.9], { h: 1.05, step: 0.36 });
    planterRow(pen, [B.x + B.w + 1.3, y + 1.05, B.z + 1.4], [B.x + B.w + 1.3, y + 1.05, B.z + B.d - 1.4], 3, 0.8);
    for (let b = 0; b < 2; b++) {
      windowOn(pen, [B.x + B.w + 0.01, y + 0.15, B.z + 1.6 + b * 3.6], [0, 0, 2], [0, 2.2, 0], {
        transom: true, rail: 0,
      });
    }
    for (let b = 0; b < 3; b++) {
      windowOn(pen, [B.x + 1.1 + b * 3.4, y + 0.95, B.z + B.d + 0.01], [1.8, 0, 0], [0, 1.6, 0], { rail: 4 });
    }
  }
  // atelier des habitants en rez-de-chaussée
  pen.rect("strong", [B.x + 1, 0.25, B.z + B.d + 0.01], [6, 0, 0], [0, 2.5, 0]);
  pen.grid("medium", [B.x + 1, 0.25, B.z + B.d + 0.01], [6, 0, 0], [0, 2.5, 0], 4, 1);
  bike(pen, B.x + 8.6, B.z + B.d + 1.1, { face: 0.15 });

  /* ================= SOL, PARVIS, VÉGÉTATION ================= */
  // trottoir périmétrique + fil d'eau
  pen.rect("medium", [A.x - 3, 0, A.z - 3], [A.w + B.w + 9.5, 0, 0], [0, 0, A.d + 9]);
  pen.rect("faint", [A.x - 5, 0, A.z - 5], [A.w + B.w + 13.5, 0, 0], [0, 0, A.d + 13]);
  // parvis : calepinage de dalles devant le hall
  for (let i = 0; i <= 6; i++) pen.seg("faint", [-6 + i * 2, 0, zf + 2.2], [-6 + i * 2, 0, zf + 7.5]);
  for (let j = 1; j <= 2; j++) pen.seg("faint", [-6, 0, zf + 2.2 + j * 1.8], [6, 0, zf + 2.2 + j * 1.8]);
  // ombre portée du volume A (hachure au sol côté nord)
  pen.hatch("faint", [A.x - 2.6, 0.01, A.z - 2.6], [3.4, 0, 3.4], [A.w * 0.85, 0, 0], 14);

  tree(pen, -20.5, 4.5, { h: 7.5, r: 3 });
  tree(pen, 25.5, 2, { h: 6, r: 2.4 });
  tree(pen, 6.8, 11.5, { h: 5, r: 2 });
  for (const [sx, sz] of [[-18, 9.5], [-16.5, 10.6], [23.5, 8.5]]) tuft(pen, sx, 0, sz, 1.6);

  person(pen, -0.8, zf + 4.6, { face: 0.4 });
  person(pen, 0.9, zf + 4.9, { h: 1.1, face: -0.5 });
  person(pen, -8.5, zf + 3.4, { face: 2.6 });
  person(pen, 14, zf + 3.8, { h: 1.8, face: 1.2 });

  return pen.build(ink);
}
