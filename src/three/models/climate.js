import * as THREE from "three";
import { Pen, windowOn, balustrade, tree, person, tuft, planterRow } from "../lineKit.js";

/**
 * ADAPTATION AU CHANGEMENT CLIMATIQUE — coupe bioclimatique en volume :
 * logement traversant, brise-soleil à lames au sud, flux d'air en
 * tirets, course du soleil été/hiver, toiture plantée, ombrage végétal.
 * (Toujours aucun panneau solaire.)
 */
export function buildClimate(ink) {
  const pen = new Pen({ wobble: 0.03 });

  const W = 15;   // x : -7.5 (nord-ouest) .. 7.5 (sud)
  const D = 8;    // z : -4..4, coupé sur z = +4
  const FH = 3.2;
  const LV = 2;
  const X0 = -W / 2;
  const X1 = W / 2;
  const Z0 = -D / 2;
  const Z1 = D / 2;
  const TH = 0.45;
  const yTop = LV * FH + TH;

  /* ---------- enveloppe coupée, poché hachuré ---------- */
  for (const [xa, xb] of [[X0, X0 + TH], [X1 - TH, X1]]) {
    pen.rect("strong", [xa, 0, Z1], [xb - xa, 0, 0], [0, yTop, 0]);
    pen.hatch("faint", [xa + 0.04, 0.12, Z1 + 0.001], [xb - xa - 0.08, 0.32, 0], [0, yTop - 0.45, 0], 22);
    pen.seg("strong", [xa, 0, Z0], [xa, yTop, Z0]);
    pen.seg("strong", [xb, 0, Z0], [xb, yTop, Z0]);
    pen.seg("medium", [xa, yTop, Z0], [xa, yTop, Z1]);
    pen.seg("medium", [xb, yTop, Z0], [xb, yTop, Z1]);
  }
  for (let f = 0; f <= LV; f++) {
    const y = f * FH;
    pen.rect("strong", [X0, y, Z1], [W, 0, 0], [0, TH, 0]);
    pen.hatch("faint", [X0 + 0.15, y + 0.07, Z1 + 0.001], [W - 0.3, 0, 0], [0, TH - 0.14, 0], 3);
    pen.seg("medium", [X0, y + TH, Z0], [X1, y + TH, Z0]);
  }
  pen.rect("strong", [X0, 0, Z0], [W, 0, 0], [0, yTop, 0]);

  /* ---------- toiture plantée, inertie et fraîcheur ---------- */
  pen.rect("medium", [X0, yTop, Z0], [W, 0, 0], [0, 0, D]);
  pen.seg("strong", [X0, yTop + 0.55, Z1], [X0, yTop + 0.55, Z0]);
  pen.seg("strong", [X1, yTop + 0.55, Z1], [X1, yTop + 0.55, Z0]);
  pen.seg("medium", [X0, yTop + 0.55, Z1], [X1, yTop + 0.55, Z1]);
  pen.hatch("faint", [X0 + 0.2, yTop + 0.08, Z1 + 0.001], [W - 0.4, 0.22, 0], [0, 0, 0], 1);
  for (let i = 0; i < 11; i++) {
    tuft(pen, X0 + 0.9 + i * 1.32, yTop + 0.2, Z0 + 0.8 + (i % 3) * 1.1, 0.85);
  }
  pen.hatch("faint", [X0 + 0.4, yTop + 0.04, Z0 + 0.4], [W - 0.8, 0, 0], [0, 0, D - 0.8], 8);

  /* ---------- façade sud (x = X1) : brise-soleil à lames ---------- */
  for (let f = 0; f < LV; f++) {
    const y = f * FH + TH;
    // vitrage toute hauteur en retrait
    windowOn(pen, [X1 + 0.01, y + 0.1, Z0 + 0.7], [0, 0, D - 1.4], [0, FH - TH - 0.4, 0], {
      mullion: false, transom: false,
    });
    pen.grid("medium", [X1 + 0.01, y + 0.1, Z0 + 0.7], [0, 0, D - 1.4], [0, FH - TH - 0.4, 0], 4, 1);
    // structure du brise-soleil : montants déportés
    for (const bz of [Z0 + 0.5, Z1 - 0.5]) {
      pen.seg("strong", [X1 + 0.85, y, bz], [X1 + 0.85, y + FH - TH, bz]);
    }
    // lames inclinées (l'épaisseur du dessin vient d'ici)
    const slats = 11;
    for (let s = 0; s < slats; s++) {
      const sy = y + 0.25 + ((FH - TH - 0.5) * s) / (slats - 1);
      pen.seg("medium", [X1 + 0.62, sy, Z0 + 0.5], [X1 + 0.62, sy, Z1 - 0.5]);
      pen.seg("medium", [X1 + 1.08, sy + 0.3, Z0 + 0.5], [X1 + 1.08, sy + 0.3, Z1 - 0.5]);
      pen.seg("faint", [X1 + 0.62, sy, Z0 + 0.5], [X1 + 1.08, sy + 0.3, Z0 + 0.5]);
      pen.seg("faint", [X1 + 0.62, sy, Z1 - 0.5], [X1 + 1.08, sy + 0.3, Z1 - 0.5]);
    }
  }

  /* ---------- façade nord-ouest (x = X0) : baie + persiennes ---------- */
  for (let f = 0; f < LV; f++) {
    const y = f * FH + TH;
    windowOn(pen, [X0 - 0.01, y + 0.15, Z0 + 1], [0, 0, 3.4], [0, FH - TH - 0.6, 0], {
      mullion: true, transom: true,
    });
    // volet persienné entrouvert
    const vz = Z0 + 4.6;
    pen.rect("medium", [X0 - 0.55, y + 0.15, vz], [0.55, 0, 0.35], [0, FH - TH - 0.6, 0]);
    for (let l = 1; l < 8; l++) {
      const ly = y + 0.15 + ((FH - TH - 0.6) * l) / 8;
      pen.seg("faint", [X0 - 0.5, ly, vz + 0.03], [X0 - 0.08, ly + 0.12, vz + 0.3]);
    }
  }
  // balcon-casquette au niveau 1 : ombre l'été, soleil l'hiver
  pen.box("medium", [X0 - 1.7, FH, Z0 + 0.6], [1.7, 0.2, D - 1.2]);
  balustrade(pen, [X0 - 1.6, FH + 0.2, Z0 + 0.8], [X0 - 1.6, FH + 0.2, Z1 - 0.8], { h: 1, step: 0.36 });
  planterRow(pen, [X0 - 1.5, FH + 1.2, Z0 + 1.2], [X0 - 1.5, FH + 1.2, Z1 - 1.2], 3, 0.8);

  /* ---------- intérieur : niveau bas, séjour traversant ---------- */
  const y0 = TH;
  // fauteuil + lectrice + table
  pen.box("medium", [-1.8, y0, -0.6], [1.1, 0.72, 1.1]);
  pen.rect("medium", [-1.8, y0 + 0.72, -0.6], [0, 0, 1.1], [0, 0.55, 0]);
  person(pen, -1.1, -0.1, { y: y0 + 0.35, h: 1.25, face: 0.5 });
  pen.circle("medium", [0.4, y0 + 0.55, 0.4], 0.4, { axis: "y", n: 12 });
  pen.seg("faint", [0.4, y0, 0.4], [0.4, y0 + 0.55, 0.4]);
  // ventilateur de plafond — le confort sans climatisation
  pen.seg("medium", [0.5, FH - 0.05, 0], [0.5, FH - 0.5, 0]);
  pen.circle("medium", [0.5, FH - 0.5, 0], 0.14, { axis: "y", n: 8 });
  for (const a of [0, 2.1, 4.2]) {
    pen.seg("medium", [0.5, FH - 0.5, 0], [0.5 + Math.cos(a) * 1.05, FH - 0.55, Math.sin(a) * 1.05]);
  }
  // grande plante près du vitrage sud
  pen.box("faint", [4.6, y0, -0.5], [0.8, 0.6, 0.8]);
  pen.curve("medium", [[5, y0 + 0.6, -0.1], [4.8, y0 + 1.7, -0.3], [4.4, y0 + 2.1, -0.1]], 8);
  pen.curve("medium", [[5, y0 + 0.6, -0.1], [5.3, y0 + 1.8, 0.1], [5.6, y0 + 2, -0.2]], 8);
  pen.edges("faint", new THREE.IcosahedronGeometry(0.6, 1), { pos: [4.5, y0 + 2.4, -0.15], noise: 0.5 });
  pen.edges("faint", new THREE.IcosahedronGeometry(0.5, 1), { pos: [5.6, y0 + 2.3, -0.2], noise: 0.5 });

  /* ---------- intérieur : niveau haut, bureau au calme ---------- */
  const y1 = FH + TH;
  pen.box("medium", [-2.6, y1, Z0 + 0.4], [2.1, 0.76, 0.75]);
  pen.seg("medium", [-2.6, y1, Z0 + 1.15], [-2.6, y1 + 0.76, Z0 + 1.15]);
  pen.seg("medium", [-0.5, y1, Z0 + 1.15], [-0.5, y1 + 0.76, Z0 + 1.15]);
  person(pen, -1.5, Z0 + 1.7, { y: y1, h: 1.35, face: 3.1 });
  pen.box("medium", [3.2, y1, -1], [2.4, 0.5, 1.7]);
  pen.rect("faint", [3.35, y1 + 0.52, -0.75], [0.9, 0, 0], [0, 0, 0.6]);

  /* ================= LE CLIMAT AUTOUR ================= */

  /* ---- course du soleil : arc été + position hiver ---- */
  const RS = 14.5;
  pen.circle("faint", [0, 0.5, 0], RS, { axis: "z", n: 32, a0: Math.PI * 0.1, a1: Math.PI * 0.9 });
  // soleil d'été, haut sur l'arc
  const aE = Math.PI * 0.38;
  const SE = [Math.cos(aE) * RS, 0.5 + Math.sin(aE) * RS, 0];
  pen.circle("strong", SE, 1.1, { axis: "z", n: 20 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    pen.seg("medium", [SE[0] + Math.cos(a) * 1.5, SE[1] + Math.sin(a) * 1.5, 0], [SE[0] + Math.cos(a) * 2.1, SE[1] + Math.sin(a) * 2.1, 0]);
  }
  // rayons d'été arrêtés par les lames du brise-soleil
  for (const t of [0.25, 0.6]) {
    pen.dashedCurve(
      [[SE[0] + 0.6, SE[1] - 1.4, 0], [X1 + 2.6 - t, FH * 1.8 - t, 0], [X1 + 1.05, FH * 1.15 + t * 2.6, 0]],
      { dash: 0.45, gap: 0.4, opacity: 0.55, div: 16 }
    );
  }
  // soleil d'hiver, bas sur l'arc — son rayon file entre les lames
  const aH = Math.PI * 0.09;
  const SH = [Math.cos(aH) * RS, 0.5 + Math.sin(aH) * RS, 0];
  pen.circle("medium", SH, 0.8, { axis: "z", n: 16, a0: 0, a1: Math.PI * 2 });
  pen.dashedCurve(
    [[SH[0] - 0.9, SH[1] - 0.2, 0], [X1 + 1.2, 3.9, 0], [0.8, TH + 0.9, 0.4]],
    { dash: 0.6, gap: 0.5, opacity: 0.5 }
  );

  /* ---- flux d'air traversants ---- */
  pen.dashedCurve(
    [[X0 - 3.4, y0 + 1.5, 0.8], [-3, y0 + 1.9, 0.5], [1.5, y0 + 2.3, -0.4], [X1 + 2.4, FH - 0.4, -0.6]],
    { dash: 0.55, gap: 0.42, opacity: 0.7 }
  );
  pen.dashedCurve(
    [[X0 - 2.8, y0 + 0.8, -1.2], [-2, y0 + 1, -1], [2.5, y0 + 1.4, -1.4], [X1 + 2, y0 + 2.6, -1.8]],
    { dash: 0.55, gap: 0.42, opacity: 0.55 }
  );
  // tirage vertical dans la cage (l'air chaud s'échappe en haut)
  pen.dashedCurve(
    [[2.4, y0 + 1.2, 1.2], [2.6, FH + 0.8, 1], [2.2, 2 * FH - 0.4, 0.8], [3, yTop + 1.6, 0.5]],
    { dash: 0.5, gap: 0.45, opacity: 0.45 }
  );
  // pointes de flèches des flux
  pen.poly("medium", [[X1 + 1.9, FH - 0.15, -0.6], [X1 + 2.4, FH - 0.4, -0.6], [X1 + 1.85, FH - 0.65, -0.6]]);
  pen.poly("medium", [[X1 + 1.5, y0 + 2.4, -1.8], [X1 + 2, y0 + 2.6, -1.8], [X1 + 1.45, y0 + 2.85, -1.8]]);
  pen.poly("medium", [[2.6, yTop + 1.3, 0.5], [3, yTop + 1.6, 0.5], [3.35, yTop + 1.2, 0.5]]);

  /* ---- ombrage végétal au sud-ouest ---- */
  tree(pen, X0 - 6.2, 1.6, { h: 8.5, r: 2.7, lean: 0.45 });
  tree(pen, X0 - 9.4, -2, { h: 5.5, r: 1.9 });
  // ombre portée de la canopée sur la façade et le sol
  pen.hatch("faint", [X0 - 6.5, 0.02, 2.2], [4.6, 0, 1.6], [1.8, 0, -3.4], 7);

  /* ---- sol et abords ---- */
  pen.rect("faint", [X0 - 10, 0, Z0 - 5], [W + 22, 0, 0], [0, 0, D + 11]);
  pen.seg("medium", [X0 - 10, 0, Z1 + 2.4], [X1 + 8, 0, Z1 + 2.4]);
  for (const [sx, sz, s] of [[X1 + 3.2, 2.6, 1.5], [X1 + 4.4, 1.2, 1.1], [X1 + 3.8, -2.2, 1.3], [X0 - 3, -3.2, 1.4]]) {
    tuft(pen, sx, 0, sz, s);
  }
  person(pen, -3.4, Z1 + 3.2, { face: 1.2 });

  return pen.build(ink);
}
