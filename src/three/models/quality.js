import * as THREE from "three";
import { Pen, windowOn, tree, person, tuft } from "../lineKit.js";

/**
 * LOGEMENT DE QUALITÉ — coupe perspective habitée, comme une planche
 * ancienne : trois niveaux ouverts sur la rue, murs coupés pochés,
 * escalier balancé, grande baie, mobilier au trait.
 */
export function buildQuality(ink) {
  const pen = new Pen({ wobble: 0.03 });

  const W = 16;   // largeur x : -8..8
  const D = 9;    // profondeur z : -4.5..4.5 — coupé sur z = +4.5
  const FH = 3.4; // belle hauteur sous plafond
  const LV = 3;   // niveaux
  const X0 = -W / 2;
  const X1 = W / 2;
  const Z0 = -D / 2;
  const Z1 = D / 2;
  const TH = 0.42; // épaisseur des murs/dalles coupés

  /* ---------- enveloppe coupée : poché des murs ---------- */
  const yTop = LV * FH + TH;
  // murs pignons (x = ±8) : double trait sur la tranche + hachure du poché
  for (const [xa, xb] of [[X0, X0 + TH], [X1 - TH, X1]]) {
    pen.rect("strong", [xa, 0, Z1], [xb - xa, 0, 0], [0, yTop, 0]);
    pen.hatch("faint", [xa + 0.03, 0.1, Z1 + 0.001], [xb - xa - 0.06, 0.3, 0], [0, yTop - 0.4, 0], 26);
    // arêtes verticales extérieures
    pen.seg("strong", [xa, 0, Z0], [xa, yTop, Z0]);
    pen.seg("strong", [xb, 0, Z0], [xb, yTop, Z0]);
    pen.seg("medium", [xa, yTop, Z0], [xa, yTop, Z1]);
    pen.seg("medium", [xb, yTop, Z0], [xb, yTop, Z1]);
  }
  // dalles : tranche pochée à chaque niveau
  for (let f = 0; f <= LV; f++) {
    const y = f * FH;
    pen.rect("strong", [X0, y, Z1], [W, 0, 0], [0, TH, 0]);
    pen.hatch("faint", [X0 + 0.15, y + 0.06, Z1 + 0.001], [W - 0.3, 0, 0], [0, TH - 0.12, 0], 3);
    // rive de dalle au fond
    pen.seg("medium", [X0, y + TH, Z0], [X1, y + TH, Z0]);
    if (f < LV) pen.seg("faint", [X0 + TH, y + TH, Z0 + 0.02], [X1 - TH, y + TH, Z0 + 0.02]);
  }
  // mur du fond (z = Z0), vu de l'intérieur
  pen.rect("strong", [X0, 0, Z0], [W, 0, 0], [0, yTop, 0]);

  /* ---------- toiture : léger acrotère + hachure ---------- */
  pen.rect("medium", [X0, yTop, Z0], [W, 0, 0], [0, 0, D]);
  pen.hatch("faint", [X0 + 0.3, yTop + 0.02, Z0 + 0.3], [W - 0.6, 0, 0], [0, 0, D - 0.6], 10);
  for (let i = 0; i < 5; i++) tuft(pen, X0 + 2 + i * 2.6, yTop, Z0 + 1.1, 0.8);

  /* ---------- grande baie sur le pignon gauche (x = X0) ---------- */
  // percement dans le poché : encadrement + meneaux sur 2 niveaux
  for (const f of [0, 1]) {
    const y = f * FH + TH;
    windowOn(pen, [X0 - 0.02, y + 0.15, Z0 + 1], [0, 0, 5.4], [0, FH - TH - 0.5, 0], {
      mullion: false, transom: false,
    });
    pen.grid("medium", [X0 - 0.02, y + 0.15, Z0 + 1], [0, 0, 5.4], [0, FH - TH - 0.5, 0], 4, 2);
  }
  // rais de lumière entrant par la baie du niveau 1
  for (let i = 0; i < 3; i++) {
    const zr = Z0 + 1.6 + i * 1.7;
    pen.dashedCurve(
      [[X0 + 0.2, FH + 2.6, zr], [-2.5, FH + 1.2, zr + 0.4], [1.5, FH + TH + 0.02, zr + 0.9]],
      { dash: 0.35, gap: 0.5, opacity: 0.35, div: 20 }
    );
  }
  // flaque de lumière hachurée sur le plancher du niveau 1
  pen.hatch("faint", [-2.2, FH + TH + 0.02, Z0 + 1.2], [3.6, 0, 1.4], [1.4, 0, 2.6], 6);

  /* ---------- escalier balancé contre le mur du fond ---------- */
  const stX = X1 - TH - 3.1;
  for (let f = 0; f < LV; f++) {
    const y0 = f * FH + TH;
    const steps = 13;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const y = y0 + (FH - TH) * t;
      const z = Z0 + 0.4 + 2.6 * (1 - t);
      // marche : giron + contremarche
      pen.seg("medium", [stX, y, z], [stX + 2.6, y, z]);
      if (s < steps) {
        const yNext = y0 + ((FH - TH) * (s + 1)) / steps;
        pen.seg("faint", [stX, y, z], [stX, yNext, z]);
        pen.seg("faint", [stX + 2.6, y, z], [stX + 2.6, yNext, z]);
      }
    }
    // limon + main courante
    pen.seg("strong", [stX + 2.6, y0 + 0.1, Z0 + 3], [stX + 2.6, y0 + FH - TH + 0.1, Z0 + 0.4]);
    pen.seg("strong", [stX + 2.6, y0 + 1.05, Z0 + 3], [stX + 2.6, y0 + FH - TH + 1.05, Z0 + 0.4]);
    for (let s = 0; s <= 6; s++) {
      const t = s / 6;
      const z = Z0 + 3 - 2.6 * t;
      const y = y0 + (FH - TH) * t;
      pen.seg("faint", [stX + 2.6, y + 0.1, z], [stX + 2.6, y + 1.05, z]);
    }
  }

  /* ---------- NIVEAU 0 : cuisine & table d'hôtes ---------- */
  const y0 = TH;
  // plan de travail le long du fond
  pen.box("medium", [X0 + TH + 0.4, y0, Z0 + 0.3], [4.6, 0.95, 0.7]);
  pen.seg("faint", [X0 + TH + 0.4, y0 + 0.95, Z0 + 1], [X0 + TH + 5, y0 + 0.95, Z0 + 1]);
  // crédence + étagères
  pen.seg("medium", [X0 + TH + 0.6, y0 + 1.7, Z0 + 0.05], [X0 + TH + 4.6, y0 + 1.7, Z0 + 0.05]);
  pen.seg("medium", [X0 + TH + 0.6, y0 + 2.3, Z0 + 0.05], [X0 + TH + 4.6, y0 + 2.3, Z0 + 0.05]);
  for (let i = 0; i < 9; i++) {
    const bx = X0 + TH + 0.8 + i * 0.42;
    pen.seg("faint", [bx, y0 + 1.7, Z0 + 0.08], [bx + (i % 2 ? 0.05 : -0.04), y0 + 2.02, Z0 + 0.08]);
  }
  // grande table + chaises
  pen.box("medium", [-1.6, y0 + 0.72, -0.6], [3.6, 0.06, 1.5]);
  for (const [lx, lz] of [[-1.45, -0.5], [1.85, -0.5], [-1.45, 0.75], [1.85, 0.75]]) {
    pen.seg("medium", [lx, y0, lz], [lx, y0 + 0.72, lz]);
  }
  for (const [cx, cz, fc] of [[-0.6, 1.6, Math.PI], [0.8, 1.6, Math.PI], [-0.6, -1.3, 0], [0.8, -1.3, 0]]) {
    pen.rect("faint", [cx - 0.25, y0 + 0.45, cz - 0.25], [0.5, 0, 0], [0, 0, 0.5]);
    pen.seg("faint", [cx - 0.25, y0, cz - 0.25], [cx - 0.25, y0 + 0.45, cz - 0.25]);
    pen.seg("faint", [cx + 0.25, y0, cz + 0.25], [cx + 0.25, y0 + 0.45, cz + 0.25]);
    pen.seg("medium", [cx - 0.25, y0 + 0.45, cz + fc * 0.08 - 0.25], [cx - 0.25, y0 + 1, cz - 0.25]);
  }
  // suspension au-dessus de la table
  pen.seg("faint", [0.2, FH, 0.1], [0.2, y0 + 1.9, 0.1]);
  pen.edges("medium", new THREE.ConeGeometry(0.42, 0.4, 10), { pos: [0.2, y0 + 1.75, 0.1] });
  person(pen, -3.2, 1.4, { y: y0, h: 1.7, face: 0.6 });

  /* ---------- NIVEAU 1 : le séjour lumineux ---------- */
  const y1 = FH + TH;
  // canapé face à la baie
  pen.box("medium", [-2.4, y1, 0.4], [3.4, 0.75, 1.3]);
  pen.box("medium", [-2.4, y1 + 0.75, 1.3], [3.4, 0.65, 0.4]);
  pen.seg("faint", [-0.7, y1 + 0.75, 0.4], [-0.7, y1 + 0.75, 1.3]);
  // tapis
  pen.rect("faint", [-3.4, y1 + 0.02, -1.6], [5.6, 0, 0], [0, 0, 3.4]);
  pen.dashedCurve([[-3.1, y1 + 0.02, -1.3], [2, y1 + 0.02, -1.3]], { dash: 0.3, gap: 0.3, opacity: 0.3 });
  // table basse ronde + livre
  pen.circle("medium", [-0.6, y1 + 0.4, -0.5], 0.75, { axis: "y", n: 20 });
  pen.circle("faint", [-0.6, y1 + 0.02, -0.5], 0.75, { axis: "y", n: 20 });
  pen.seg("faint", [-0.6, y1 + 0.02, -0.5], [-0.6, y1 + 0.4, -0.5]);
  pen.rect("faint", [-0.9, y1 + 0.42, -0.65], [0.5, 0, 0], [0, 0, 0.35]);
  // bibliothèque toute hauteur contre le mur du fond
  const shX0 = -1.2;
  pen.rect("strong", [shX0, y1, Z0 + 0.05], [4.4, 0, 0], [0, FH - TH - 0.3, 0]);
  for (let r = 1; r <= 4; r++) {
    pen.seg("medium", [shX0, y1 + r * 0.62, Z0 + 0.05], [shX0 + 4.4, y1 + r * 0.62, Z0 + 0.05]);
  }
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 14; i++) {
      const bx = shX0 + 0.25 + i * 0.29 + (r % 2) * 0.1;
      pen.seg("faint", [bx, y1 + r * 0.62 + 0.06, Z0 + 0.09], [bx + (i % 3 === 0 ? 0.06 : -0.04), y1 + r * 0.62 + 0.5, Z0 + 0.09]);
    }
  }
  // liseuse + plante
  pen.curve("medium", [[2.6, y1, 1.9], [2.55, y1 + 1.5, 1.85], [2.9, y1 + 1.8, 1.5]], 10);
  pen.edges("medium", new THREE.ConeGeometry(0.3, 0.35, 8), { pos: [2.95, y1 + 1.75, 1.45] });
  pen.box("faint", [3.4, y1, -1.9], [0.7, 0.55, 0.7]);
  pen.curve("medium", [[3.75, y1 + 0.55, -1.55], [3.6, y1 + 1.5, -1.7], [3.2, y1 + 1.9, -1.5]], 8);
  pen.curve("medium", [[3.75, y1 + 0.55, -1.55], [4, y1 + 1.6, -1.4], [4.3, y1 + 1.8, -1.6]], 8);
  pen.edges("faint", new THREE.IcosahedronGeometry(0.55, 1), { pos: [3.4, y1 + 2.1, -1.5], noise: 0.5 });
  pen.edges("faint", new THREE.IcosahedronGeometry(0.45, 1), { pos: [4.3, y1 + 2, -1.6], noise: 0.5 });
  person(pen, 0.8, 0.9, { y: y1, h: 1.72, face: -1.2 });

  /* ---------- NIVEAU 2 : chambre calme ---------- */
  const y2 = 2 * FH + TH;
  // lit
  pen.box("medium", [X0 + TH + 0.6, y2, -1.2], [2.6, 0.55, 2]);
  pen.rect("medium", [X0 + TH + 0.6, y2 + 0.55, -1.2], [0, 0, 2], [0, 0.7, 0]);
  pen.rect("faint", [X0 + TH + 0.75, y2 + 0.58, -0.9], [0.9, 0, 0], [0, 0, 0.65]);
  pen.seg("faint", [X0 + TH + 0.6, y2 + 0.35, 0.2], [X0 + TH + 3.2, y2 + 0.35, 0.2]);
  // armoire + bureau
  pen.box("medium", [1.2, y2, Z0 + 0.3], [2.2, 2.3, 0.7]);
  pen.seg("faint", [2.3, y2, Z0 + 1], [2.3, y2 + 2.3, Z0 + 1]);
  pen.box("faint", [-2.6, y2, Z0 + 0.35], [1.9, 0.78, 0.65]);
  pen.seg("medium", [-2.6, y2, Z0 + 1], [-2.6, y2 + 0.78, Z0 + 1]);
  pen.seg("medium", [-0.7, y2, Z0 + 1], [-0.7, y2 + 0.78, Z0 + 1]);
  // fauteuil près de la baie... et le chat
  pen.circle("medium", [X0 + TH + 1.4, y2 + 0.3, 1.9], 0.42, { axis: "y", n: 14 });
  pen.circle("faint", [X0 + TH + 1.4, y2 + 0.14, 1.9], 0.3, { axis: "y", n: 10 });

  /* ---------- double exposition : percements côté rue (fond) ---------- */
  for (let f = 0; f < LV; f++) {
    const y = f * FH + TH;
    windowOn(pen, [2.9, y + 0.9, Z0 - 0.02], [1.7, 0, 0], [0, 1.7, 0], { rail: 4 });
    if (f > 0) windowOn(pen, [-4.9, y + 0.9, Z0 - 0.02], [1.7, 0, 0], [0, 1.7, 0], { rail: 4 });
  }
  // flux d'air traversant au niveau 1
  pen.dashedCurve(
    [[X0 - 1.2, y1 + 1.6, 0.6], [-2, y1 + 1.9, 0.2], [2.4, y1 + 1.7, -1.5], [4.5, y1 + 1.9, Z0 - 0.8]],
    { dash: 0.5, gap: 0.45, opacity: 0.5 }
  );

  /* ---------- dehors : sol, arbre, passants ---------- */
  pen.rect("faint", [X0 - 6, 0, Z0 - 4], [W + 12, 0, 0], [0, 0, D + 10]);
  pen.seg("medium", [X0 - 6, 0, Z1 + 2.2], [X1 + 6, 0, Z1 + 2.2]);
  tree(pen, X0 - 5.8, 2.6, { h: 6.5, r: 2 });
  tuft(pen, X1 + 2.4, 0, Z1 + 0.8, 1.4);
  tuft(pen, X1 + 3.4, 0, Z1 - 1.2, 1.1);
  person(pen, 0.4, Z1 + 3.1, { face: 1.7 });

  return pen.build(ink);
}
