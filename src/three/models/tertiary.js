import { Pen, windowOn, balustrade, tree, person, planterRow, tuft, bike } from "../lineKit.js";

/**
 * TRANSFORMATION TERTIAIRE — un plateau de bureaux R+5 dont la moitié
 * droite est déjà muée en logements : dalles prolongées en balcons,
 * garde-corps, plantations. La grue greffe un module de balcon,
 * le rooftop est rendu aux habitants.
 */
export function buildTertiary(ink) {
  const pen = new Pen({ wobble: 0.035 });

  const V = { x: -18, z: -7, w: 36, d: 14, h: 21 };
  const zf = V.z + V.d; // façade sur rue
  const FLOORS = 6;
  const FH = V.h / FLOORS;

  pen.box("strong", [V.x, 0, V.z], [V.w, V.h, V.d]);
  pen.rect("strong", [V.x, V.h - 0.6, V.z], [V.w, 0, 0], [0, 0, V.d]);

  /* ---------- moitié gauche : façade rideau stricte ---------- */
  // meneaux verticaux serrés
  for (let i = 0; i <= 15; i++) {
    const x = V.x + i * 1.2;
    pen.seg("medium", [x, 0.4, zf + 0.01], [x, V.h - 0.6, zf + 0.01]);
  }
  // traverses : nez de dalle fort + allège + linteau
  for (let f = 0; f < FLOORS; f++) {
    const y = f * FH;
    pen.seg("strong", [V.x, y, zf + 0.01], [V.x + 18, y, zf + 0.01]);
    pen.seg("faint", [V.x, y + 0.95, zf + 0.02], [V.x + 18, y + 0.95, zf + 0.02]);
    pen.seg("faint", [V.x, y + FH - 0.35, zf + 0.02], [V.x + 18, y + FH - 0.35, zf + 0.02]);
  }
  // pignon ouest : même trame, plus légère
  for (let i = 0; i <= 11; i++) {
    pen.seg("faint", [V.x - 0.01, 0.4, V.z + i * 1.27], [V.x - 0.01, V.h - 0.6, V.z + i * 1.27]);
  }
  for (let f = 1; f < FLOORS; f++) {
    pen.seg("medium", [V.x - 0.01, f * FH, V.z], [V.x - 0.01, f * FH, V.z + V.d]);
  }

  /* ---------- ligne de mutation, tremblée ---------- */
  pen.dashedCurve(
    [[0, -0.4, zf + 0.35], [0.25, V.h * 0.35, zf + 0.4], [-0.2, V.h * 0.7, zf + 0.35], [0.1, V.h + 1.2, zf + 0.3]],
    { dash: 0.55, gap: 0.4, opacity: 0.75 }
  );

  /* ---------- moitié droite : logements greffés ---------- */
  for (let f = 1; f <= FLOORS; f++) {
    const y = f * FH;
    // dalle prolongée en balcon filant
    pen.box("medium", [0, y - 0.22, zf], [17.6, 0.22, 1.9]);
    balustrade(pen, [0.15, y, zf + 1.9], [17.45, y, zf + 1.9], { h: 1.05, step: 0.4 });
    pen.seg("faint", [0.15, y, zf], [0.15, y + 1.05, zf + 1.9]);
    pen.seg("faint", [17.45, y, zf], [17.45, y + 1.05, zf + 1.9]);
    if (f < FLOORS) {
      // portes-fenêtres toute hauteur
      for (let b = 0; b < 5; b++) {
        windowOn(pen, [1.2 + b * 3.3, y + 0.05, zf + 0.01], [2.2, 0, 0], [0, FH - 0.9, 0], {
          transom: true, rail: 0,
        });
      }
      planterRow(pen, [1.4, y + 1.05, zf + 1.9], [16.6, y + 1.05, zf + 1.9], 6, 0.85);
    }
  }
  // habitants aux balcons
  person(pen, 4.6, zf + 1, { y: 2 * FH, h: 1.7, face: 0.3 });
  person(pen, 13.2, zf + 1, { y: 4 * FH, h: 1.7, face: -0.4 });

  // pignon est : trame résidentielle avec garde-corps
  for (let f = 1; f < FLOORS; f++) {
    for (let b = 0; b < 3; b++) {
      windowOn(pen, [V.x + V.w + 0.01, f * FH + 0.7, V.z + 1.6 + b * 3.9], [0, 0, 2.2], [0, 1.9, 0], {
        rail: 5,
      });
    }
  }

  /* ---------- rooftop rendu aux habitants (moitié droite) ---------- */
  const ry = V.h - 0.6;
  pen.hatch("faint", [V.x + 0.5, ry + 0.02, V.z + 0.5], [17.5, 0, 0], [0, 0, V.d - 1], 12);
  for (const px of [2, 6, 10, 14]) {
    pen.seg("medium", [px, ry, V.z + 2], [px, ry + 2.4, V.z + 2]);
    pen.seg("medium", [px, ry, V.z + 8], [px, ry + 2.4, V.z + 8]);
  }
  pen.seg("strong", [2, ry + 2.4, V.z + 2], [14, ry + 2.4, V.z + 2]);
  pen.seg("strong", [2, ry + 2.4, V.z + 8], [14, ry + 2.4, V.z + 8]);
  for (let i = 0; i <= 8; i++) {
    pen.seg("faint", [2 + i * 1.5, ry + 2.4, V.z + 1.5], [2 + i * 1.5, ry + 2.4, V.z + 8.5]);
  }
  planterRow(pen, [1, ry + 0.4, zf - 1], [17, ry + 0.4, zf - 1], 8, 0.85);
  for (const [bx, bz] of [[4, V.z + 4.5], [8.5, V.z + 4.5]]) {
    pen.box("medium", [bx, ry, bz], [2, 0.45, 1.4]);
    planterRow(pen, [bx + 0.3, ry + 0.45, bz + 0.7], [bx + 1.7, ry + 0.45, bz + 0.7], 3, 0.7);
  }
  person(pen, 12, V.z + 5.4, { y: ry, h: 1.72, face: 2.2 });
  person(pen, 5.6, V.z + 6.2, { y: ry, h: 1.68, face: -0.6 });

  /* ================= LA GRUE ================= */
  const C = { x: 26, z: -2, h: 27, half: 0.75 };
  const legs = [
    [C.x - C.half, C.z - C.half], [C.x + C.half, C.z - C.half],
    [C.x + C.half, C.z + C.half], [C.x - C.half, C.z + C.half],
  ];
  for (const [lx, lz] of legs) pen.seg("strong", [lx, 0, lz], [lx, C.h, lz]);
  // treillis en zigzag sur les 4 faces
  for (let i = 0; i < 18; i++) {
    const y0 = i * 1.5;
    const y1 = (i + 1) * 1.5;
    for (let fce = 0; fce < 4; fce++) {
      const a = legs[fce];
      const b = legs[(fce + 1) % 4];
      if (i % 2 === 0) pen.seg("faint", [a[0], y0, a[1]], [b[0], y1, b[1]]);
      else pen.seg("faint", [b[0], y0, b[1]], [a[0], y1, a[1]]);
    }
    if (i % 3 === 0) {
      for (let fce = 0; fce < 4; fce++) {
        const a = legs[fce];
        const b = legs[(fce + 1) % 4];
        pen.seg("faint", [a[0], y0, a[1]], [b[0], y0, b[1]]);
      }
    }
  }
  // flèche vers le bâtiment + contre-flèche
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
  // câble + module de balcon suspendu, en route vers la façade
  const hookX = C.x - 15.5;
  pen.seg("medium", [hookX, jy, C.z], [hookX, V.h + 2.6, C.z]);
  pen.poly("faint", [[hookX - 1.6, V.h + 1.4, C.z], [hookX, V.h + 2.6, C.z], [hookX + 1.6, V.h + 1.4, C.z]]);
  pen.box("strong", [hookX - 1.8, V.h + 0.2, C.z - 1], [3.6, 0.24, 2]);
  balustrade(pen, [hookX - 1.7, V.h + 0.44, C.z + 1], [hookX + 1.7, V.h + 0.44, C.z + 1], { h: 0.9, step: 0.34 });

  /* ================= SOL & CONTEXTE ================= */
  pen.rect("medium", [V.x - 4, 0, V.z - 4], [V.w + 15, 0, 0], [0, 0, V.d + 12]);
  pen.rect("faint", [V.x - 7, 0, V.z - 7], [V.w + 21, 0, 0], [0, 0, V.d + 18]);
  // passage piéton devant l'entrée mutée
  for (let i = 0; i < 6; i++) {
    pen.seg("medium", [3 + i * 1.1, 0.01, zf + 4.5], [3.55 + i * 1.1, 0.01, zf + 6.5]);
  }
  pen.hatch("faint", [V.x - 3.4, 0.01, V.z - 3.4], [2.6, 0, 2.6], [V.w * 0.8, 0, 0], 12);

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
