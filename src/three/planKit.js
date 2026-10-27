import { tuft, insulation } from "./lineKit.js";

/* ------------------------------------------------------------------ */
/*  Kit de plan : un repère local posé sur un niveau (translation,     */
/*  quarts de tour, symétrie) et les conventions d'un plan d'archi-    */
/*  tecte coupé à 1,20 m — murs pochés, baies, débattements de         */
/*  portes, mobilier, escalier, ascenseur.                             */
/*                                                                    */
/*  Repère local : lx le long du mur, lz vers l'intérieur de la pièce. */
/*  Dans le repère parent (x vers l'est, z vers le sud) :              */
/*   rot 0 → dos au mur nord   · rot 1 → dos au mur est                */
/*   rot 2 → dos au mur sud    · rot 3 → dos au mur ouest              */
/* ------------------------------------------------------------------ */

const ROT = [
  [1, 0, 0, 1],
  [0, -1, 1, 0],
  [-1, 0, 0, -1],
  [0, 1, -1, 0],
];
const MIRROR = [-1, 0, 0, 1];
const mulM = (A, B) => [
  A[0] * B[0] + A[1] * B[2],
  A[0] * B[1] + A[1] * B[3],
  A[2] * B[0] + A[3] * B[2],
  A[2] * B[1] + A[3] * B[3],
];
const rotM = (rot, mirror) => {
  const R = ROT[((rot % 4) + 4) % 4];
  return mirror ? mulM(R, MIRROR) : R;
};

/** Hauteur de tête d'une baie (linteau). */
function openingTop(o) {
  if (o.top) return o.top;
  const kind = o.kind || "door";
  if (kind === "window") return (o.sill ?? 0.95) + 1.35;
  if (kind === "french") return 2.25;
  if (kind === "void" || kind === "baie") return 2.3;
  return 2.1;
}

export class Local {
  constructor(pen, { x = 0, y = 0, z = 0, rot = 0, mirror = false, M } = {}) {
    this.pen = pen;
    this.T = [x, z];
    this.y = y;
    this.M = M || rotM(rot, mirror);
  }

  P(lx, ly, lz) {
    const [a, b, c, d] = this.M;
    return [this.T[0] + a * lx + b * lz, this.y + ly, this.T[1] + c * lx + d * lz];
  }

  D(dx, dy, dz) {
    const [a, b, c, d] = this.M;
    return [a * dx + b * dz, dy, c * dx + d * dz];
  }

  /** Sous-repère : origine (lx, lz), quart de tour, symétrie éventuelle. */
  sub(lx, lz, rot = 0, { mirror = false, ly = 0 } = {}) {
    const [x, y, z] = this.P(lx, ly, lz);
    return new Local(this.pen, { x, y, z, M: mulM(this.M, rotM(rot, mirror)) });
  }

  seg(w, a, b) {
    this.pen.seg(w, this.P(...a), this.P(...b));
  }

  poly(w, pts) {
    this.pen.poly(w, pts.map((p) => this.P(...p)));
  }

  rect(w, o, u, v) {
    this.pen.rect(w, this.P(...o), this.D(...u), this.D(...v));
  }

  hatch(w, o, u, v, n, t0, t1) {
    this.pen.hatch(w, this.P(...o), this.D(...u), this.D(...v), n, t0, t1);
  }

  dashed(w, a, b, opts) {
    this.pen.dashed(w, this.P(...a), this.P(...b), opts);
  }

  curve(w, pts, div) {
    this.pen.curve(w, pts.map((p) => this.P(...p)), div);
  }

  box(w, [x, y, z], [dx, dy, dz]) {
    const c = [
      [x, y, z], [x + dx, y, z], [x + dx, y, z + dz], [x, y, z + dz],
      [x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz],
    ];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of E) this.seg(w, c[a], c[b]);
  }

  /** Ellipse horizontale (cercle si rx = rz). */
  ellipse(w, [cx, cy, cz], rx, rz, { n = 18, a0 = 0, a1 = Math.PI * 2 } = {}) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + Math.cos(a) * rx, cy, cz + Math.sin(a) * rz]);
    }
    this.poly(w, pts);
  }

  circle(w, c, r, opts) {
    this.ellipse(w, c, r, r, opts);
  }

  /** Cercle vertical dans le plan lz = cz. */
  circleV(w, [cx, cy, cz], r, { n = 14 } = {}) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, cz]);
    }
    this.poly(w, pts);
  }

  /** Volume masquant exprimé dans le repère local. */
  solid([x, y, z], [dx, dy, dz], inset) {
    const a = this.P(x, y, z);
    const b = this.P(x + dx, y + dy, z + dz);
    const lo = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2])];
    this.pen.solid(lo, [Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs(b[2] - a[2])], inset);
  }

  /** Étiquette posée au sol, toujours lisible depuis le sud-ouest. */
  label(w, str, [x, y, z], size = 0.42) {
    this.pen.text(w, str, this.P(x, y, z), [1, 0, 0], [0, 0, -1], size, { align: "center" });
  }

  tuft(x, y, z, s) {
    tuft(this.pen, ...this.P(x, y, z), s);
  }

  /* ----------------------------- murs ----------------------------- */

  /**
   * Mur droit (axe local a→b, parallèle à lx ou à lz), coupé à hauteur h.
   * openings : [{ at, w, kind: door|french|window|slide|void, hinge: a|b,
   *              side: ±1 (côté du débattement), inside: ±1, sill, double }]
   * `at` est la distance depuis a jusqu'au tableau de la baie.
   */
  wall(ax, az, bx, bz, { t = 0.2, h = 1.2, poche = false, openings = [], base = true, w = "strong", solid = false, ite = 0, iteT = 0.12 } = {}) {
    const alongX = Math.abs(bz - az) < 1e-6;
    let [s0, s1] = alongX ? [ax, bx] : [az, bz];
    if (s1 < s0) [s0, s1] = [s1, s0];
    const q = alongX ? az : ax;
    const at = (s, dq, y) => (alongX ? [s, y, q + dq] : [q + dq, y, s]);
    const L = s1 - s0;
    const ops = [...openings].sort((m, n) => m.at - n.at);

    const pieces = [];
    let cur = 0;
    for (const o of ops) {
      if (o.at > cur + 0.01) pieces.push([cur, o.at]);
      cur = Math.max(cur, o.at + o.w);
    }
    if (cur < L - 0.01) pieces.push([cur, L]);

    const ht = t / 2;
    for (const [p0, p1] of pieces) {
      const a0 = s0 + p0;
      const a1 = s0 + p1;
      this.poly(w, [at(a0, -ht, h), at(a1, -ht, h), at(a1, ht, h), at(a0, ht, h), at(a0, -ht, h)]);
      for (const s of [a0, a1]) for (const d of [-ht, ht]) this.seg("faint", at(s, d, 0), at(s, d, h));
      if (base) {
        this.seg("hair", at(a0, -ht, 0), at(a1, -ht, 0));
        this.seg("hair", at(a0, ht, 0), at(a1, ht, 0));
      }
      /* poché de la partie porteuse, isolant extérieur en « ressort » */
      const qa = ite > 0 ? -ht : -ht + (ite < 0 ? iteT : 0);
      const qb = ite > 0 ? ht - iteT : ht;
      if (poche && t >= 0.12) {
        const tb = qb - qa;
        for (let s = a0 + 0.05; s + tb <= a1; s += 0.13) this.seg("faint", at(s, qa, h), at(s + tb, qb, h));
      }
      if (ite) {
        const qi = ite > 0 ? ht - iteT : -ht;
        this.seg("faint", at(a0, ite > 0 ? qb : qa, h), at(a1, ite > 0 ? qb : qa, h));
        const o = this.P(...at(a0, qi, h + 0.005));
        const ua = this.P(...at(a1, qi, h + 0.005));
        const va = this.P(...at(a0, qi + iteT, h + 0.005));
        insulation(this.pen, o, [ua[0] - o[0], ua[1] - o[1], ua[2] - o[2]], [va[0] - o[0], va[1] - o[1], va[2] - o[2]], { w: "hair", step: 0.16 });
      }
      if (solid) {
        this.solid(alongX ? [a0, 0, q - ht] : [q - ht, 0, a0], alongX ? [a1 - a0, h, t] : [t, h, a1 - a0], 0.015);
      }
    }
    for (const o of ops) {
      this._opening(at, s0, o, t, h, base);
      /* en coupe, la baie est plus basse que le mur : linteau */
      const top = openingTop(o);
      if (solid) {
        const a = s0 + o.at;
        const box = (y0, y1) => this.solid(alongX ? [a, y0, q - ht] : [q - ht, y0, a], alongX ? [o.w, y1 - y0, t] : [t, y1 - y0, o.w], 0.015);
        const sill = o.kind === "window" ? o.sill ?? 0.95 : 0;
        if (sill > 0.1) box(0, Math.min(sill, h));
        if (h > top + 0.1) box(top, h);
      }
      if (h > top + 0.05) {
        const a = s0 + o.at;
        const b = a + o.w;
        this.poly(w, [at(a, -ht, h), at(b, -ht, h), at(b, ht, h), at(a, ht, h), at(a, -ht, h)]);
        this.poly("medium", [at(a, -ht, top), at(b, -ht, top), at(b, ht, top), at(a, ht, top), at(a, -ht, top)]);
        for (const sx of [a, b]) for (const d of [-ht, ht]) this.seg("hair", at(sx, d, top), at(sx, d, h));
      }
    }
  }

  /** Cloison légère (7 cm, sans poché). */
  partition(ax, az, bx, bz, openings = [], { h = 1.2 } = {}) {
    this.wall(ax, az, bx, bz, { t: 0.08, h, openings, w: "medium", base: false });
  }

  _opening(at, s0, o, t, h, base) {
    const a = s0 + o.at;
    const b = a + o.w;
    const ht = t / 2;
    const kind = o.kind || "door";

    if (kind === "door") {
      const side = o.side || 1;
      const leaves = o.double
        ? [[a, 1, o.w / 2], [b, -1, o.w / 2]]
        : [[o.hinge === "b" ? b : a, o.hinge === "b" ? -1 : 1, o.w]];
      for (const [sh, dirS, lw] of leaves) {
        const q0 = side * ht;
        const qt = q0 + side * lw;
        const lh = Math.min(h, 2.04);
        this.seg("medium", at(sh, q0, 0.01), at(sh, qt, 0.01));
        this.seg("medium", at(sh, qt, 0.01), at(sh, qt, lh));
        this.seg("faint", at(sh, q0, lh), at(sh, qt, lh));
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const th = (i / 12) * (Math.PI / 2);
          pts.push(at(sh + dirS * lw * Math.cos(th), q0 + side * lw * Math.sin(th), 0.01));
        }
        this.poly("faint", pts);
      }
      this.seg("hair", at(a, -ht, 0.01), at(b, -ht, 0.01));
      return;
    }

    if (kind === "slide") {
      this.seg("medium", at(a, -0.03, 0.01), at(a + o.w * 0.55, -0.03, 0.01));
      this.seg("medium", at(b - o.w * 0.55, 0.03, 0.01), at(b, 0.03, 0.01));
      return;
    }

    if (kind === "void") return;

    if (kind === "baie") {
      /* baie coulissante toute hauteur : seuil, deux vantaux décalés */
      const gh = Math.min(h, openingTop(o));
      this.seg("faint", at(a, -ht, 0.02), at(b, -ht, 0.02));
      this.seg("faint", at(a, ht, 0.02), at(b, ht, 0.02));
      for (const sx of [a + 0.04, b - 0.04]) this.seg("medium", at(sx, 0, 0), at(sx, 0, gh));
      this.seg("medium", at(a, -0.04, gh), at(a + o.w * 0.55, -0.04, gh));
      this.seg("medium", at(b - o.w * 0.55, 0.04, gh), at(b, 0.04, gh));
      this.seg("hair", at(a, -0.04, 0.03), at(a + o.w * 0.55, -0.04, 0.03));
      this.seg("hair", at(b - o.w * 0.55, 0.04, 0.03), at(b, 0.04, 0.03));
      for (const sx of [a + o.w * 0.55, b - o.w * 0.55]) this.seg("faint", at(sx, 0, 0.03), at(sx, 0, gh));
      return;
    }

    /* window / french : allège, appui, menuiserie, vitrage double */
    const sill = kind === "french" ? 0 : o.sill ?? 0.95;
    const inside = o.inside || 1;
    if (sill > 0.02) {
      this.poly("medium", [at(a, -ht, sill), at(b, -ht, sill), at(b, ht, sill), at(a, ht, sill), at(a, -ht, sill)]);
      if (base) {
        this.seg("hair", at(a, -ht, 0), at(b, -ht, 0));
        this.seg("hair", at(a, ht, 0), at(b, ht, 0));
      }
      const qo = -inside * (ht + 0.06);
      this.seg("faint", at(a - 0.04, qo, sill - 0.04), at(b + 0.04, qo, sill - 0.04));
    } else {
      this.seg("faint", at(a, -ht, 0.02), at(b, -ht, 0.02));
      this.seg("faint", at(a, ht, 0.02), at(b, ht, 0.02));
    }
    const gh = Math.min(h, openingTop(o));
    if (gh > sill) {
      const qg = -inside * ht * 0.2;
      this.seg("medium", at(a + 0.05, qg, sill), at(a + 0.05, qg, gh));
      this.seg("medium", at(b - 0.05, qg, sill), at(b - 0.05, qg, gh));
      this.seg("medium", at(a, qg - 0.035, gh), at(b, qg - 0.035, gh));
      this.seg("medium", at(a, qg + 0.035, gh), at(b, qg + 0.035, gh));
      if (o.w > 1.1) this.seg("faint", at((a + b) / 2, qg, sill), at((a + b) / 2, qg, gh));
    }
    if (kind === "french" && o.leaves !== 0) {
      const n = o.w > 1.1 ? 2 : 1;
      const lw = o.w / n;
      const hinges = n === 2 ? [[a, 1], [b, -1]] : [[a, 1]];
      for (const [sh, dirS] of hinges) {
        const q0 = inside * ht;
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const th = (i / 10) * (Math.PI / 2);
          pts.push(at(sh + dirS * lw * Math.cos(th), q0 + inside * lw * Math.sin(th), 0.01));
        }
        this.poly("hair", pts);
        this.seg("hair", at(sh, q0, 0.01), at(sh, q0 + inside * lw, 0.01));
      }
    }
  }
}

/* ============================ mobilier ============================ */
/* Chaque meuble se dessine dans un sous-repère : dos au mur à lz = 0. */

export function bed(L, w = 1.6, l = 2.0, { tables = true } = {}) {
  L.box("medium", [0, 0, 0], [w, 0.42, l]);
  L.box("faint", [0, 0, 0], [w, 0.95, 0.07]);
  const n = w > 1.2 ? 2 : 1;
  const pw = (w - 0.24 - (n - 1) * 0.08) / n;
  for (let i = 0; i < n; i++) L.rect("faint", [0.12 + i * (pw + 0.08), 0.43, 0.14], [pw, 0, 0], [0, 0, 0.4]);
  L.seg("faint", [0, 0.43, 0.72], [w, 0.43, 0.72]);
  L.seg("hair", [w * 0.55, 0.43, l], [w, 0.43, l * 0.66]);
  if (tables) {
    for (const x of [-0.5, w + 0.08]) {
      L.box("faint", [x, 0, 0.02], [0.42, 0.5, 0.38]);
      L.circle("hair", [x + 0.21, 0.51, 0.2], 0.09, { n: 10 });
    }
  }
}

export function sofa(L, w = 2.2, d = 0.9, { split = true } = {}) {
  L.box("medium", [0, 0, 0], [w, 0.42, d]);
  L.box("medium", [0, 0.42, 0], [w, 0.4, 0.22]);
  L.box("faint", [0, 0.42, 0.22], [0.2, 0.2, d - 0.22]);
  L.box("faint", [w - 0.2, 0.42, 0.22], [0.2, 0.2, d - 0.22]);
  if (split) {
    const n = Math.max(2, Math.round((w - 0.4) / 0.7));
    for (let i = 1; i < n; i++) {
      const x = 0.2 + ((w - 0.4) * i) / n;
      L.seg("hair", [x, 0.43, 0.22], [x, 0.43, d]);
    }
  }
}

export function armchair(L) {
  sofa(L, 0.82, 0.82, { split: false });
}

export function chair(L) {
  L.rect("faint", [0, 0.45, 0], [0.44, 0, 0], [0, 0, 0.44]);
  L.rect("faint", [0, 0.45, 0], [0.44, 0, 0], [0, 0.42, 0]);
  L.seg("hair", [0.03, 0, 0.41], [0.03, 0.45, 0.41]);
  L.seg("hair", [0.41, 0, 0.41], [0.41, 0.45, 0.41]);
}

export function table(L, w = 1.6, d = 0.9, { chairs = 2, ends = false } = {}) {
  L.rect("medium", [0, 0.74, 0], [w, 0, 0], [0, 0, d]);
  for (const [x, z] of [[0.06, 0.06], [w - 0.06, 0.06], [0.06, d - 0.06], [w - 0.06, d - 0.06]]) {
    L.seg("faint", [x, 0, z], [x, 0.74, z]);
  }
  for (let i = 0; i < chairs; i++) {
    const cx = (w * (i + 0.5)) / chairs - 0.22;
    chair(L.sub(cx, -0.6, 0));
    chair(L.sub(cx + 0.44, d + 0.6, 2));
  }
  if (ends) {
    chair(L.sub(-0.6, d / 2 + 0.22, 3));
    chair(L.sub(w + 0.6, d / 2 - 0.22, 1));
  }
}

export function coffeeTable(L, w = 1.1, d = 0.55) {
  L.box("faint", [0, 0, 0], [w, 0.4, d]);
}

export function rug(L, w, d) {
  L.rect("hair", [0, 0.012, 0], [w, 0, 0], [0, 0, d]);
  L.rect("hair", [0.12, 0.012, 0.12], [w - 0.24, 0, 0], [0, 0, d - 0.24]);
}

export function kitchen(L, len, { d = 0.62, sink = 0.55, hob = 0.12, fridge = true, h = 1.2 } = {}) {
  const run = fridge ? len - 0.62 : len;
  L.box("medium", [0, 0, 0], [run, 0.9, d]);
  L.seg("hair", [0, 0.1, d - 0.05], [run, 0.1, d - 0.05]);
  for (let x = 0.6; x < run - 0.1; x += 0.6) L.seg("hair", [x, 0.12, d], [x, 0.86, d]);
  const sx = Math.max(0.05, run * sink - 0.4);
  L.rect("faint", [sx, 0.91, 0.1], [0.8, 0, 0], [0, 0, 0.42]);
  L.rect("hair", [sx + 0.05, 0.91, 0.14], [0.4, 0, 0], [0, 0, 0.34]);
  L.poly("faint", [[sx + 0.6, 0.91, 0.06], [sx + 0.6, 1.16, 0.06], [sx + 0.6, 1.16, 0.22]]);
  const hx = Math.min(run - 0.62, Math.max(0.05, run * hob));
  L.rect("hair", [hx, 0.91, 0.06], [0.6, 0, 0], [0, 0, 0.52]);
  for (const [x, z, r] of [[0.16, 0.18, 0.1], [0.44, 0.18, 0.08], [0.16, 0.44, 0.08], [0.44, 0.44, 0.1]]) {
    L.circle("faint", [hx + x, 0.915, z], r, { n: 12 });
  }
  L.rect("hair", [hx + 0.03, 0.18, d + 0.005], [0.54, 0, 0], [0, 0.5, 0]);
  if (fridge) {
    L.box("medium", [run, 0, 0], [0.62, h, d]);
    L.seg("faint", [run, h, 0], [run + 0.62, h, d]);
    L.seg("faint", [run + 0.62, h, 0], [run, h, d]);
  }
}

export function wardrobe(L, len, { d = 0.6, h = 1.2 } = {}) {
  L.box("medium", [0, 0, 0], [len, h, d]);
  L.seg("faint", [0, h, 0], [len, h, d]);
  L.seg("faint", [len, h, 0], [0, h, d]);
  const n = Math.max(1, Math.round(len / 0.6));
  for (let i = 1; i < n; i++) L.seg("hair", [(len * i) / n, 0.05, d], [(len * i) / n, h - 0.05, d]);
}

export function shelves(L, len, { h = 1.2, d = 0.35 } = {}) {
  L.box("medium", [0, 0, 0], [len, h, d]);
  for (let y = 0.36; y < h - 0.1; y += 0.36) L.seg("faint", [0, y, d], [len, y, d]);
  for (let y = 0.02; y < h - 0.3; y += 0.36) {
    for (let x = 0.05; x < len - 0.05; x += 0.07 + ((x * 37) % 0.05)) {
      const bh = 0.22 + ((x * 53) % 0.08);
      L.seg("hair", [x, y, d - 0.02], [x, y + bh, d - 0.02]);
    }
  }
}

export function tvUnit(L, w = 1.8) {
  L.box("faint", [0, 0, 0], [w, 0.45, 0.42]);
  L.rect("medium", [0.25, 0.55, 0.2], [w - 0.5, 0, 0], [0, 0.6, 0]);
  L.seg("hair", [w / 2, 0.45, 0.2], [w / 2, 0.55, 0.2]);
}

export function desk(L, w = 1.3, d = 0.65) {
  L.rect("medium", [0, 0.74, 0], [w, 0, 0], [0, 0, d]);
  for (const x of [0.04, w - 0.04]) L.seg("faint", [x, 0, d - 0.04], [x, 0.74, d - 0.04]);
  L.rect("hair", [w * 0.35, 0.75, 0.12], [0.36, 0, 0], [0, 0, 0.24]);
  chair(L.sub(w / 2 + 0.22, d + 0.55, 2));
}

export function bathtub(L, l = 1.7, w = 0.75) {
  L.box("medium", [0, 0, 0], [l, 0.55, w]);
  L.ellipse("faint", [l / 2, 0.56, w / 2], l / 2 - 0.12, w / 2 - 0.1, { n: 24 });
  L.circle("hair", [0.24, 0.56, w / 2], 0.04, { n: 8 });
  L.seg("hair", [0.06, 0.56, w / 2], [0.06, 0.8, w / 2]);
}

export function shower(L, s = 0.9, { h = 1.2 } = {}) {
  L.box("faint", [0, 0, 0], [s, 0.05, s]);
  L.seg("hair", [0, 0.05, 0], [s, 0.05, s]);
  L.seg("hair", [s, 0.05, 0], [0, 0.05, s]);
  L.circle("hair", [s / 2, 0.06, s / 2], 0.05, { n: 8 });
  L.rect("faint", [0, 0.05, s], [s * 0.62, 0, 0], [0, h - 0.05, 0]);
}

export function wc(L) {
  L.box("medium", [0.07, 0, 0], [0.4, 0.78, 0.18]);
  L.ellipse("medium", [0.27, 0.4, 0.44], 0.18, 0.25, { n: 16 });
  L.ellipse("faint", [0.27, 0.4, 0.46], 0.11, 0.16, { n: 12 });
  L.ellipse("hair", [0.27, 0, 0.36], 0.1, 0.14, { n: 10 });
}

export function basin(L, w = 0.6) {
  L.box("medium", [0, 0, 0], [w, 0.85, 0.46]);
  L.ellipse("faint", [w / 2, 0.86, 0.25], Math.min(0.22, w * 0.35), 0.15, { n: 14 });
  L.rect("hair", [0.05, 0.95, 0.01], [w - 0.1, 0, 0], [0, 0.24, 0]);
}

export function washer(L) {
  L.box("medium", [0, 0, 0], [0.6, 0.85, 0.6]);
  L.circleV("faint", [0.3, 0.42, 0.6], 0.19);
}

export function plant(L, s = 1) {
  L.circle("faint", [0, 0, 0], 0.18 * s, { n: 10 });
  L.circle("faint", [0, 0.38 * s, 0], 0.22 * s, { n: 12 });
  L.tuft(0, 0.38 * s, 0, 0.9 * s);
}

/* ======================= circulations verticales ======================= */

/**
 * Escalier à deux volées droites et jour central, en plan coupé à `cut`.
 * Volée montante sur lx ∈ [0, fw] (départ au palier, lz = 0), volée
 * descendante sur lx ∈ [fw + jour, 2·fw + jour]. Ce qui est au-dessus du
 * plan de coupe est rappelé en tirets fins, comme sur un plan d'étage.
 */
export function stairU(L, { fw = 1.2, jour = 0.16, FH = 3, risers = 18, tread = 0.27, landing = 1.3, cut = 1.2 } = {}) {
  const n = risers / 2;
  const rise = FH / risers;
  const run = (n - 1) * tread;
  const xB = fw + jour;
  const half = FH / 2;

  /* volée montante, interrompue par le plan de coupe */
  let zCut = run;
  for (let i = 0; i < n; i++) {
    const y = (i + 1) * rise;
    const z0 = i * tread;
    if (y > cut) {
      zCut = z0;
      break;
    }
    L.seg("medium", [0, y, z0], [fw, y, z0]);
    L.seg("hair", [0, y - rise, z0], [0, y, z0]);
    L.seg("hair", [fw, y - rise, z0], [fw, y, z0]);
    L.seg("hair", [0, y, z0], [0, y, z0 + tread]);
    L.seg("hair", [fw, y, z0], [fw, y, z0 + tread]);
  }
  const zb = zCut + tread * 0.4;
  L.poly("strong", [[0, cut, zb], [fw * 0.4, cut, zb], [fw * 0.48, cut, zb - 0.2], [fw * 0.56, cut, zb + 0.2], [fw * 0.64, cut, zb], [fw, cut, zb]]);
  L.seg("faint", [fw, rise, 0], [fw, cut, zCut]);

  /* parties au-dessus du plan de coupe, en tirets */
  for (const x of [0, fw]) L.dashed("hair", [x, cut, zb], [x, half, run]);
  L.dashed("hair", [0, half, run + landing], [2 * fw + jour, half, run + landing]);
  for (const x of [xB, xB + fw]) L.dashed("hair", [x, half, run], [x, FH, 0]);

  /* volée descendante (vers le palier intermédiaire inférieur) */
  for (let j = 0; j < n; j++) {
    const z = run - j * tread;
    const y = -half + (j + 1) * rise;
    L.seg("medium", [xB, y, z], [xB + fw, y, z]);
    L.seg("hair", [xB, y - rise, z], [xB, y, z]);
    L.seg("hair", [xB + fw, y - rise, z], [xB + fw, y, z]);
    if (j < n - 1) {
      L.seg("hair", [xB, y, z], [xB, y, z - tread]);
      L.seg("hair", [xB + fw, y, z], [xB + fw, y, z - tread]);
    }
  }
  L.rect("medium", [0, -half, run], [2 * fw + jour, 0, 0], [0, 0, landing]);
  L.hatch("hair", [0.1, -half, run + 0.1], [2 * fw + jour - 0.2, 0, 0], [0, 0, landing - 0.2], 5);
  L.seg("faint", [xB, 0, 0], [xB, -half + rise, run]);

  /* garde-corps du jour : main courante + barreaudage */
  const slope = half / run;
  L.seg("medium", [xB + 0.04, 0.9, 0], [xB + 0.04, 0.9 - half, run]);
  for (let z = 0; z <= run + 1e-6; z += run / 8) {
    const yn = -slope * z;
    L.seg("hair", [xB + 0.04, yn, z], [xB + 0.04, yn + 0.9, z]);
  }
  for (let z = 0; z < zCut; z += zCut / 3) {
    const yn = slope * z + rise;
    L.seg("hair", [fw - 0.04, yn, z], [fw - 0.04, Math.min(cut, yn + 0.9), z]);
  }

  /* flèche de montée (convention de plan) */
  L.poly("faint", [[fw / 2, 0.02, -0.5], [fw / 2, rise * 2 + 0.02, tread * 1.5]]);
}

/** Gaine d'ascenseur vue en plan : cabine, diagonales de trémie. */
export function lift(L, w = 1.6, d = 1.75) {
  L.rect("medium", [0.08, 0.01, 0.08], [w - 0.16, 0, 0], [0, 0, d - 0.16]);
  L.seg("faint", [0.08, 0.01, 0.08], [w - 0.08, 0.01, d - 0.08]);
  L.seg("faint", [w - 0.08, 0.01, 0.08], [0.08, 0.01, d - 0.08]);
  L.rect("hair", [0.16, 0.01, 0.16], [w - 0.32, 0, 0], [0, 1.1, 0]);
}

/** Gaine technique : contour + une diagonale. */
export function duct(L, w, d) {
  L.rect("faint", [0, 0.01, 0], [w, 0, 0], [0, 0, d]);
  L.seg("hair", [0, 0.01, 0], [w, 0.01, d]);
}

/** Poteau coupé (poché) de section s, coupé à hauteur h. */
export function column(L, x, z, s = 0.3, h = 1.2) {
  L.box("strong", [x - s / 2, 0, z - s / 2], [s, h, s]);
  L.seg("faint", [x - s / 2, h, z - s / 2], [x + s / 2, h, z + s / 2]);
  L.seg("faint", [x + s / 2, h, z - s / 2], [x - s / 2, h, z + s / 2]);
}

/* ===================== logement type T4 traversant ===================== */

/** Baies d'un T4 traversant de largeur W (repère local, lx depuis l'ouest). */
export function apartmentOpenings(W = 8) {
  const a = Math.round(W * 0.4625 * 100) / 100;
  const b = a + 1.28;
  return {
    a,
    b,
    north: [
      { a: Math.max(0.5, (a - 1.5) / 2 - 0.1), w: 1.5, kind: "window", sill: 1.0, h: 1.3 },
      { a: a + 0.2, w: 0.9, kind: "door", sill: 0, h: 2.2 },
      { a: b + Math.max(0.3, (W - 0.1 - b - 1.4) / 2), w: 1.4, kind: "window", sill: 1.0, h: 1.3 },
    ],
    south: [
      { a: 0.6, w: a - 1.5, kind: "french", sill: 0, h: 2.25 },
      { a: b + 0.02, w: 1.6, kind: "french", sill: 0, h: 2.25 },
    ],
  };
}

/**
 * T4 traversant W × D en plan coupé à H, entrée au nord.
 *  nord   : chambre 3 · entrée · chambre 2
 *  milieu : cuisine ouverte + îlot · salle de bains · wc (· cellier si D ≥ 13)
 *  sud    : séjour sur balcon · chambre 1 et son dressing
 * Les salles d'eau sont adossées au mur est (lx = W) : en miroir, deux
 * logements partagent la même gaine.
 */
export function apartmentT4(L, { W = 8, D = 12, H = 1.2, label = "T4" } = {}) {
  const spec = apartmentOpenings(W);
  const { a, b } = spec;
  const Dw = D - 4.66;
  const deep = D >= 13;

  L.wall(0, 0.15, W, 0.15, {
    t: 0.3, h: H, poche: true,
    openings: spec.north.map((o) =>
      o.kind === "door"
        ? { at: o.a, w: o.w, kind: "door", side: 1, hinge: "a" }
        : { at: o.a, w: o.w, kind: "window", sill: o.sill, inside: 1 }
    ),
  });
  L.wall(0, D - 0.15, W, D - 0.15, {
    t: 0.3, h: H, poche: true,
    openings: spec.south.map((o) => ({ at: o.a, w: o.w, kind: "french", inside: -1 })),
  });

  /* cloisons et portes */
  L.partition(a, 0.3, a, D - 0.3, [
    { at: 2.3, w: 0.8, kind: "door", side: -1, hinge: "b" },
    { at: 3.7, w: 1.6, kind: "void" },
  ]);
  const bOps = [
    { at: 0.2, w: 0.8, kind: "door", side: 1, hinge: "a" },
    { at: 4.4, w: 0.7, kind: "door", side: 1, hinge: "b" },
    { at: 5.9, w: 0.7, kind: "door", side: -1, hinge: "b" },
  ];
  if (deep) bOps.push({ at: 7.25, w: 0.7, kind: "door", side: 1, hinge: "a" });
  L.partition(b, 0.3, b, Dw, bOps);
  L.partition(0.1, 3.54, a, 3.54);
  L.partition(b, 3.54, W - 0.1, 3.54);
  L.partition(b, 5.94, W - 0.1, 5.94);
  if (deep) L.partition(b, 7.24, b + 1.26, 7.24);
  L.partition(b + 1.26, 5.94, b + 1.26, Dw);
  L.partition(a, Dw, W - 0.1, Dw, [
    { at: 0.15, w: 0.8, kind: "door", side: 1, hinge: "a" },
    { at: b + 1.34 - a, w: W - 0.14 - b - 1.34, kind: "void" },
  ]);
  duct(L.sub(W - 0.55, 5.98, 0), 0.42, 0.5);

  /* chambre 3 */
  bed(L.sub(0.2, 2.75, 3), 1.6, 2.0);
  wardrobe(L.sub(a - 1.0, 0.3, 0), 0.96);
  /* chambre 2 */
  bed(L.sub(W - 0.1, 1.6, 1), 1.4, 1.9);
  wardrobe(L.sub(b + 0.94, 3.5, 2), 0.9);
  /* cuisine ouverte + îlot et tabourets */
  kitchen(L.sub(0.2, 6.3, 3), 2.6, { sink: 0.45, hob: 0.75 });
  L.box("medium", [a - 1.9, 0, 4.3], [0.9, 0.9, 1.7]);
  for (const z of [4.7, 5.6]) {
    L.circle("faint", [a - 0.7, 0.66, z], 0.17, { n: 10 });
    L.seg("hair", [a - 0.7, 0, z], [a - 0.7, 0.66, z]);
  }
  /* plan profond : coin bureau et bibliothèque dans la bande centrale */
  if (deep) {
    desk(L.sub(0.2, D - 5.9, 3), 1.4, 0.6);
    shelves(L.sub(a - 0.04, 6.0, 1), D - 11.6, { d: 0.35 });
  }
  /* séjour */
  table(L.sub(0.9, D - 5.0, 0), Math.min(1.8, a - 1.4), 0.9, { chairs: 2 });
  sofa(L.sub(a - 0.1, D - 2.9, 1), 2.2, 0.9);
  tvUnit(L.sub(0.2, D - 1.0, 3), 1.6);
  coffeeTable(L.sub(a - 1.25, D - 2.3, 1), 1.0, 0.5);
  rug(L.sub(a - 1.1, D - 3.0, 1), 2.5, a - 2.0);
  plant(L.sub(0.55, D - 3.25, 0));
  /* salle de bains : carrelage, baignoire, vasques, lave-linge */
  for (let z = 3.9; z < 5.9; z += 0.3) L.seg("hair", [b + 0.04, 0.01, z], [W - 0.1, 0.01, z]);
  for (let x = b + 0.32; x < W - 0.1; x += 0.3) L.seg("hair", [x, 0.01, 3.58], [x, 0.01, 5.9]);
  bathtub(L.sub(W - 0.1, 3.65, 1), 1.7, 0.75);
  basin(L.sub(b + 0.32, 3.58, 0), Math.min(1.2, W - b - 1.27));
  washer(L.sub(b + 1.62, 5.9, 2));
  /* wc, cellier, dressing de la chambre 1 */
  wc(L.sub(b + 1.22, 6.3, 1));
  if (deep) {
    shelves(L.sub(b + 0.04, Dw - 0.04, 3), Dw - 7.4, { d: 0.4 });
    wardrobe(L.sub(W - 0.14, 6.0, 1), Dw - 6.9, { d: 0.55 });
  }
  wardrobe(L.sub(W - 0.14, Dw - 0.04, 2), W - 0.14 - b - 1.38, { d: 0.62 });
  /* chambre 1 */
  bed(L.sub(W - 0.1, D - 3.4, 1), 1.6, 2.0);
  desk(L.sub(a + 0.1, D - 0.4, 3), 1.2, 0.6);

  /* étiquettes au normographe */
  L.label("faint", label, [(a + b) / 2, 0.02, 2.5], 0.55);
  L.label("hair", "SEJOUR", [a / 2 - 0.15, 0.02, D - 0.55], 0.3);
  L.label("hair", "CH.1", [W - 1.1, 0.02, D - 0.6], 0.3);
  L.label("hair", "CH.3", [1.5, 0.02, 3.35], 0.3);
  L.label("hair", "SDB", [b + 1.02, 0.02, 4.75], 0.26);
  return spec;
}

/** Garde-corps vitré entre deux points (repère local) : vitrages, main courante. */
export function glassRail(L, [ax, az], [bx, bz], { h = 1.0, y = 0 } = {}) {
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.round(len / 1.2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    L.seg("faint", [x, y, z], [x, y + h - 0.05, z]);
  }
  L.seg("medium", [ax, y + h, az], [bx, y + h, bz]);
  L.seg("faint", [ax, y + 0.06, az], [bx, y + 0.06, bz]);
  L.seg("hair", [ax, y + h * 0.5, az], [ax + (bx - ax) * 0.35, y + h * 0.8, az + (bz - az) * 0.35]);
}

/** Piano à queue, vu en plan, caisse à hauteur de couvercle. */
export function piano(L) {
  const pts = [[0, 0], [1.5, 0], [1.5, 0.35], [1.25, 1.1], [0.8, 1.75], [0.35, 1.9], [0, 1.75], [0, 0]];
  L.poly("medium", pts.map(([x, z]) => [x, 0.95, z]));
  L.poly("hair", pts.map(([x, z]) => [x, 0.65, z]));
  L.rect("faint", [0.1, 0.96, 0.08], [1.3, 0, 0], [0, 0, 0.18]);
  for (let i = 1; i < 11; i++) L.seg("hair", [0.1 + i * 0.118, 0.97, 0.08], [0.1 + i * 0.118, 0.97, 0.26]);
  for (const [x, z] of [[0.15, 0.2], [1.35, 0.3], [0.4, 1.6]]) L.seg("faint", [x, 0, z], [x, 0.65, z]);
  L.box("faint", [0.45, 0, -0.65], [0.6, 0.48, 0.35]);
}
