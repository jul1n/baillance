import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Boîte à outils de dessin filaire 3D — l'équivalent volumique du    */
/*  crayon : trois poids de trait (fort / moyen / estompé), courbes    */
/*  pointillées, et vocabulaire d'architecture réutilisable.           */
/* ------------------------------------------------------------------ */

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

/* Jitter déterministe : les sommets identiques tremblent pareil,
   les lignes restent connectées mais perdent leur froideur CAO. */
const jit = (x, y, z, k) => {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (h - Math.floor(h) - 0.5) * k;
};

const WEIGHTS = { strong: 0.92, medium: 0.5, faint: 0.2 };

export class Pen {
  constructor({ wobble = 0.05 } = {}) {
    this.buf = { strong: [], medium: [], faint: [] };
    this.dashes = [];
    this.wobble = wobble;
  }

  _push(w, x1, y1, z1, x2, y2, z2) {
    const k = this.wobble;
    this.buf[w].push(
      x1 + jit(x1, y1, z1, k), y1 + jit(y1, z1, x1, k), z1 + jit(z1, x1, y1, k),
      x2 + jit(x2, y2, z2, k), y2 + jit(y2, z2, x2, k), z2 + jit(z2, x2, y2, k)
    );
  }

  seg(w, a, b) {
    this._push(w, a[0], a[1], a[2], b[0], b[1], b[2]);
  }

  poly(w, pts) {
    for (let i = 0; i < pts.length - 1; i++) this.seg(w, pts[i], pts[i + 1]);
  }

  /** Rectangle sur un plan quelconque : origine + deux vecteurs d'arête. */
  rect(w, o, u, v) {
    const p = (a, b) => add(add(o, mul(u, a)), mul(v, b));
    this.poly(w, [p(0, 0), p(1, 0), p(1, 1), p(0, 1), p(0, 0)]);
  }

  /** Subdivisions internes d'un rectangle (meneaux, traverses). */
  grid(w, o, u, v, nu, nv) {
    for (let i = 1; i < nu; i++) {
      const t = i / nu;
      this.seg(w, add(o, mul(u, t)), add(add(o, mul(u, t)), v));
    }
    for (let j = 1; j < nv; j++) {
      const t = j / nv;
      this.seg(w, add(o, mul(v, t)), add(add(o, mul(v, t)), u));
    }
  }

  /** Hachures : n lignes parallèles à u, réparties le long de v. */
  hatch(w, o, u, v, n, t0 = 0, t1 = 1) {
    for (let i = 0; i < n; i++) {
      const t = t0 + ((t1 - t0) * i) / Math.max(n - 1, 1);
      this.seg(w, add(o, mul(v, t)), add(add(o, mul(v, t)), u));
    }
  }

  /** Arêtes d'une boîte : coin minimal + dimensions. */
  box(w, [x, y, z], [dx, dy, dz]) {
    const c = [
      [x, y, z], [x + dx, y, z], [x + dx, y, z + dz], [x, y, z + dz],
      [x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz],
    ];
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (const [a, b] of E) this.seg(w, c[a], c[b]);
  }

  /** Cercle (ou arc) dans un plan : axis = normale y|x|z. */
  circle(w, [cx, cy, cz], r, { axis = "y", n = 40, a0 = 0, a1 = Math.PI * 2 } = {}) {
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const c = Math.cos(a) * r;
      const s = Math.sin(a) * r;
      const p =
        axis === "y" ? [cx + c, cy, cz + s] : axis === "z" ? [cx + c, cy + s, cz] : [cx, cy + c, cz + s];
      if (prev) this.seg(w, prev, p);
      prev = p;
    }
  }

  /** Courbe lissée (Catmull-Rom) échantillonnée en polyligne. */
  curve(w, pts, div = 28) {
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    const sampled = c.getPoints(div).map((v) => [v.x, v.y, v.z]);
    this.poly(w, sampled);
  }

  /** Courbe en tirets (flux d'air, lignes de mutation…). */
  dashedCurve(pts, { dash = 0.7, gap = 0.5, opacity = 0.65, div = 48 } = {}) {
    this.dashes.push({ pts, dash, gap, opacity, div });
  }

  /** Injecte les arêtes d'une géométrie three.js (canopées, dômes…). */
  edges(w, geometry, { pos = [0, 0, 0], scale = 1, noise = 0 } = {}) {
    const e = new THREE.EdgesGeometry(geometry, 1);
    const a = e.attributes.position.array;
    for (let i = 0; i < a.length; i += 6) {
      const n1 = noise ? jit(a[i], a[i + 1], a[i + 2], noise) : 0;
      const n2 = noise ? jit(a[i + 3], a[i + 4], a[i + 5], noise) : 0;
      this._push(
        w,
        pos[0] + a[i] * scale * (1 + n1), pos[1] + a[i + 1] * scale * (1 + n1), pos[2] + a[i + 2] * scale * (1 + n1),
        pos[0] + a[i + 3] * scale * (1 + n2), pos[1] + a[i + 4] * scale * (1 + n2), pos[2] + a[i + 5] * scale * (1 + n2)
      );
    }
    e.dispose();
    geometry.dispose();
  }

  /** Fabrique le groupe three.js final (un draw call par poids). */
  build(ink) {
    const g = new THREE.Group();
    const mats = [];
    for (const k of Object.keys(this.buf)) {
      if (!this.buf[k].length) continue;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(this.buf[k], 3));
      const mat = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: WEIGHTS[k] });
      mat.userData.baseOpacity = WEIGHTS[k];
      g.add(new THREE.LineSegments(geo, mat));
      mats.push(mat);
    }
    for (const d of this.dashes) {
      const c = new THREE.CatmullRomCurve3(d.pts.map((p) => new THREE.Vector3(...p)));
      const geo = new THREE.BufferGeometry().setFromPoints(c.getPoints(d.div));
      const mat = new THREE.LineDashedMaterial({
        color: ink,
        transparent: true,
        opacity: d.opacity,
        dashSize: d.dash,
        gapSize: d.gap,
      });
      mat.userData.baseOpacity = d.opacity;
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      g.add(line);
      mats.push(mat);
    }
    g.userData.mats = mats;
    return g;
  }
}

/* ================== vocabulaire d'architecture ================== */

/**
 * Fenêtre posée sur un plan de façade.
 * o : coin bas-gauche ; u : vecteur largeur ; v : vecteur hauteur.
 */
export function windowOn(pen, o, u, v, { mullion = true, transom = true, rail = 0, inset = 0.09 } = {}) {
  pen.rect("strong", o, u, v);
  const oi = add(add(o, mul(u, inset)), mul(v, inset));
  pen.rect("medium", oi, mul(u, 1 - 2 * inset), mul(v, 1 - 2 * inset));
  if (mullion) {
    pen.seg("medium", add(o, mul(u, 0.5)), add(add(o, mul(u, 0.5)), v));
  }
  if (transom) {
    pen.seg("medium", add(o, mul(v, 0.72)), add(add(o, mul(v, 0.72)), u));
  }
  if (rail > 0) {
    // garde-corps de fenêtre : lisse haute + barreaudage fin
    const rl = add(o, mul(v, 0.3));
    pen.seg("medium", rl, add(rl, u));
    for (let i = 0; i <= rail; i++) {
      const t = i / rail;
      pen.seg("faint", add(o, mul(u, t)), add(add(o, mul(u, t)), mul(v, 0.3)));
    }
  }
}

/** Balustrade le long d'un segment a→b (lisse + poteaux serrés). */
export function balustrade(pen, a, b, { h = 1.05, step = 0.42 } = {}) {
  const top = [a[0], a[1] + h, a[2]];
  const topB = [b[0], b[1] + h, b[2]];
  pen.seg("strong", top, topB);
  pen.seg("medium", [a[0], a[1] + h * 0.55, a[2]], [b[0], b[1] + h * 0.55, b[2]]);
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const n = Math.max(2, Math.round(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    pen.seg("faint", [x, a[1], z], [x, a[1] + h, z]);
  }
}

/** Arbre : tronc en polyligne, branches, canopée en icosphère froissée. */
export function tree(pen, x, z, { h = 6, r = 2.4, lean = 0.25 } = {}) {
  pen.poly("medium", [
    [x, 0, z],
    [x + lean * 0.6, h * 0.4, z - lean * 0.4],
    [x + lean, h * 0.68, z + lean * 0.3],
  ]);
  pen.poly("medium", [
    [x + 0.22, 0, z + 0.14],
    [x + 0.3, h * 0.36, z],
    [x - lean * 0.5, h * 0.62, z - lean * 0.5],
  ]);
  pen.seg("faint", [x + lean * 0.4, h * 0.5, z], [x + r * 0.55, h * 0.66, z + r * 0.3]);
  pen.seg("faint", [x, h * 0.44, z], [x - r * 0.5, h * 0.6, z - r * 0.25]);
  pen.edges("medium", new THREE.IcosahedronGeometry(r, 1), {
    pos: [x + lean * 0.6, h * 0.72 + r * 0.55, z],
    noise: 0.55,
  });
  pen.edges("faint", new THREE.IcosahedronGeometry(r * 0.62, 1), {
    pos: [x - r * 0.32, h * 0.66 + r * 0.4, z + r * 0.28],
    noise: 0.7,
  });
}

/** Silhouette d'échelle humaine (y = altitude du sol porteur). */
export function person(pen, x, z, { h = 1.75, face = 0, y = 0 } = {}) {
  const c = Math.cos(face) * 0.28;
  const s = Math.sin(face) * 0.28;
  const hd = y + h * 0.86;
  pen.circle("medium", [x, y + h * 0.93, z], h * 0.07, { axis: "z", n: 10 });
  pen.seg("medium", [x, hd, z], [x, y + h * 0.47, z]);
  pen.seg("medium", [x, y + h * 0.47, z], [x - c, y, z - s]);
  pen.seg("medium", [x, y + h * 0.47, z], [x + c, y, z + s]);
  pen.seg("medium", [x, y + h * 0.76, z], [x - c * 1.1, y + h * 0.52, z - s * 1.1]);
  pen.seg("medium", [x, y + h * 0.76, z], [x + c * 1.1, y + h * 0.55, z + s * 1.1]);
}

/** Touffe de végétation (jardinières, toitures plantées). */
export function tuft(pen, x, y, z, s = 1) {
  pen.seg("medium", [x, y, z], [x - 0.28 * s, y + 0.5 * s, z + 0.1 * s]);
  pen.seg("medium", [x, y, z], [x + 0.05 * s, y + 0.62 * s, z - 0.08 * s]);
  pen.seg("medium", [x, y, z], [x + 0.3 * s, y + 0.46 * s, z + 0.06 * s]);
  pen.seg("faint", [x, y, z], [x - 0.12 * s, y + 0.42 * s, z - 0.22 * s]);
  pen.seg("faint", [x, y, z], [x + 0.18 * s, y + 0.52 * s, z + 0.2 * s]);
}

/** Rangée de jardinières plantées le long d'un segment. */
export function planterRow(pen, a, b, n, s = 1) {
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    tuft(pen, a[0] + (b[0] - a[0]) * t, a[1], a[2] + (b[2] - a[2]) * t, s);
  }
}

/** Voiture non — Baillance préfère un vélo. */
export function bike(pen, x, z, { face = 0 } = {}) {
  const c = Math.cos(face);
  const s = Math.sin(face);
  const P = (dx, dy) => [x + dx * c, dy, z + dx * s];
  pen.circle("medium", P(-0.55, 0.33), 0.33, { axis: "z", n: 14 });
  pen.circle("medium", P(0.55, 0.33), 0.33, { axis: "z", n: 14 });
  pen.poly("medium", [P(-0.55, 0.33), P(-0.1, 0.85), P(0.42, 0.85), P(0.55, 0.33)]);
  pen.poly("medium", [P(-0.1, 0.85), P(0.18, 0.42), P(0.55, 0.33)]);
  pen.seg("medium", P(-0.62, 0.95), P(-0.48, 0.95));
  pen.seg("medium", P(-0.55, 0.33), P(-0.55, 0.95));
}
