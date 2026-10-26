import { insulation } from "./lineKit.js";

/* ------------------------------------------------------------------ */
/*  Kit de coupe : conventions graphiques d'une coupe d'architecte     */
/*  dans le plan z = zc — poché du béton, isolant en « ressort »,      */
/*  terre, planchers en couches, cotes verticales, et volumes          */
/*  masquants des murs percés de baies.                                */
/* ------------------------------------------------------------------ */

/** Hachure à 45° d'un rectangle du plan z = zc ; dir = 1 « / », -1 « \ ». */
export function hatchZ(pen, w, x0, x1, y0, y1, zc, step = 0.13, dir = 1) {
  const H = y1 - y0;
  for (let c = x0 - H; c < x1; c += step) {
    const ua = Math.max(0, x0 - c);
    const ub = Math.min(H, x1 - c);
    if (ub <= ua) continue;
    if (dir > 0) pen.seg(w, [c + ua, y0 + ua, zc], [c + ub, y0 + ub, zc]);
    else pen.seg(w, [c + ua, y1 - ua, zc], [c + ub, y1 - ub, zc]);
  }
}

/**
 * Élément coupé : contour + matière.
 * kind : beton | isolant | terre | bois | maconnerie | vide
 */
export function cutBox(pen, x0, x1, y0, y1, zc, kind = "beton", w = "strong") {
  if (x1 - x0 < 1e-3 || y1 - y0 < 1e-3) return;
  pen.rect(w, [x0, y0, zc], [x1 - x0, 0, 0], [0, y1 - y0, 0]);
  const horiz = x1 - x0 > y1 - y0;
  if (kind === "beton") hatchZ(pen, "faint", x0, x1, y0, y1, zc, 0.12);
  else if (kind === "maconnerie") {
    hatchZ(pen, "hair", x0, x1, y0, y1, zc, 0.2, 1);
    hatchZ(pen, "hair", x0, x1, y0, y1, zc, 0.2, -1);
  } else if (kind === "terre") hatchZ(pen, "hair", x0, x1, y0, y1, zc, 0.32, 1);
  else if (kind === "isolant") {
    if (horiz) insulation(pen, [x0, y0, zc], [x1 - x0, 0, 0], [0, y1 - y0, 0], { w: "hair", step: Math.max(0.12, (y1 - y0) * 0.9) });
    else insulation(pen, [x0, y0, zc], [0, y1 - y0, 0], [x1 - x0, 0, 0], { w: "hair", step: Math.max(0.12, (x1 - x0) * 0.9) });
  } else if (kind === "bois") {
    if (horiz) pen.seg("hair", [x0, (y0 + y1) / 2, zc], [x1, (y0 + y1) / 2, zc]);
    else pen.seg("hair", [(x0 + x1) / 2, y0, zc], [(x0 + x1) / 2, y1, zc]);
  }
}

/**
 * Mur coupé : couches successives depuis le parement intérieur (x)
 * vers l'extérieur (dir = ±1).
 */
export function wallSection(pen, x, dir, y0, y1, zc, layers) {
  let cur = x;
  for (const { t, kind, w } of layers) {
    const a = dir > 0 ? cur : cur - t;
    const b = dir > 0 ? cur + t : cur;
    cutBox(pen, a, b, y0, y1, zc, kind, w || (kind === "beton" ? "strong" : "medium"));
    cur += dir * t;
  }
  return cur;
}

/**
 * Plancher coupé, de haut en bas : parquet, chape, résilient acoustique,
 * dalle béton, plénum et faux plafond suspendu.
 */
export function slabSection(pen, x0, x1, ffl, zc, { ceiling = true, phonic = true, thick = 0.4 } = {}) {
  pen.seg("medium", [x0, ffl, zc], [x1, ffl, zc]);
  pen.seg("hair", [x0, ffl - 0.025, zc], [x1, ffl - 0.025, zc]);
  pen.seg("faint", [x0, ffl - 0.095, zc], [x1, ffl - 0.095, zc]);
  if (phonic) insulation(pen, [x0, ffl - 0.15, zc], [x1 - x0, 0, 0], [0, 0.05, 0], { w: "hair", step: 0.3 });
  cutBox(pen, x0, x1, ffl - thick, ffl - 0.15, zc, "beton", "strong");
  if (ceiling) {
    const yc = ffl - thick - 0.18;
    pen.seg("faint", [x0, yc, zc], [x1, yc, zc]);
    pen.seg("hair", [x0, yc + 0.013, zc], [x1, yc + 0.013, zc]);
    for (let x = x0 + 0.6; x < x1; x += 1.2) pen.seg("hair", [x, yc, zc], [x, ffl - thick, zc]);
  }
}

/** Chaîne de cotes verticale dans le plan z = zc. */
export function vDim(pen, x, zc, ys, { size = 0.32 } = {}) {
  pen.seg("faint", [x, ys[0] - 0.3, zc], [x, ys[ys.length - 1] + 0.3, zc]);
  for (const y of ys) {
    pen.seg("medium", [x - 0.13, y - 0.13, zc], [x + 0.13, y + 0.13, zc]);
    pen.seg("hair", [x - 0.3, y, zc], [x + 0.6, y, zc]);
  }
  for (let i = 0; i < ys.length - 1; i++) {
    const len = ys[i + 1] - ys[i];
    if (len < size * 2.6) continue;
    pen.text("hair", len.toFixed(2), [x - 0.16, (ys[i] + ys[i + 1]) / 2, zc], [0, 1, 0], [-1, 0, 0], size, { align: "center" });
  }
}

/* --------------------- volumes masquants des murs percés --------------------- */

function spans(a0, a1, holes) {
  const cuts = [a0, a1, ...holes.flatMap((h) => [h[0], h[1]])]
    .filter((v) => v >= a0 && v <= a1)
    .sort((m, n) => m - n);
  const out = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    if (cuts[i + 1] - cuts[i] < 0.01) continue;
    const mid = (cuts[i] + cuts[i + 1]) / 2;
    out.push([cuts[i], cuts[i + 1], holes.find((h) => mid > h[0] && mid < h[1])]);
  }
  return out;
}

/** Mur d'épaisseur xa..xb courant le long de z ; baies [[za, zb, ya, yb]]. */
export function solidWallAlongZ(pen, xa, xb, z0, z1, y0, y1, holes = [], inset = 0.03) {
  for (const [za, zb, h] of spans(z0, z1, holes)) {
    if (!h) pen.solid([xa, y0, za], [xb - xa, y1 - y0, zb - za], inset);
    else {
      if (h[2] > y0) pen.solid([xa, y0, za], [xb - xa, h[2] - y0, zb - za], inset);
      if (h[3] < y1) pen.solid([xa, h[3], za], [xb - xa, y1 - h[3], zb - za], inset);
    }
  }
}

/** Mur d'épaisseur za..zb courant le long de x ; baies [[xa, xb, ya, yb]]. */
export function solidWallAlongX(pen, za, zb, x0, x1, y0, y1, holes = [], inset = 0.03) {
  for (const [xa, xb, h] of spans(x0, x1, holes)) {
    if (!h) pen.solid([xa, y0, za], [xb - xa, y1 - y0, zb - za], inset);
    else {
      if (h[2] > y0) pen.solid([xa, y0, za], [xb - xa, h[2] - y0, zb - za], inset);
      if (h[3] < y1) pen.solid([xa, h[3], za], [xb - xa, y1 - h[3], zb - za], inset);
    }
  }
}
