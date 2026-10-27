import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* ------------------------------------------------------------------ */
/*  Boîte à outils de dessin filaire 3D — l'équivalent volumique du    */
/*  crayon : quatre poids de trait (fort / moyen / estompé / fin),     */
/*  tirets, cotes, lettrage, volumes masquants (parties cachées) et    */
/*  vocabulaire d'architecture réutilisable.                           */
/* ------------------------------------------------------------------ */

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/* Jitter déterministe : les sommets identiques tremblent pareil,
   les lignes restent connectées mais perdent leur froideur CAO. */
const jit = (x, y, z, k) => {
  const h = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (h - Math.floor(h) - 0.5) * k;
};

const WEIGHTS = { strong: 0.92, medium: 0.5, faint: 0.22, hair: 0.12 };

export class Pen {
  constructor({ wobble = 0.05 } = {}) {
    this.buf = { strong: [], medium: [], faint: [], hair: [] };
    this.dashes = [];
    this.solids = [];
    this.labels = [];
    this.wobble = wobble;
  }

  /** Tirets posés dans le même lot de traits (pas de matériau en plus). */
  dashed(w, a, b, { dash = 0.45, gap = 0.3 } = {}) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (!L) return;
    for (let s = 0; s < L; s += dash + gap) {
      this.seg(w, lerp3(a, b, s / L), lerp3(a, b, Math.min(s + dash, L) / L));
    }
  }

  /** Trait mixte d'axe : long tiret, point. */
  axis(w, a, b, { dash = 1.6, gap = 0.28, dot = 0.12 } = {}) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (!L) return;
    const P = (s) => lerp3(a, b, Math.min(s, L) / L);
    for (let s = 0; s < L; s += dash + dot + 2 * gap) {
      this.seg(w, P(s), P(s + dash));
      if (s + dash + gap < L) this.seg(w, P(s + dash + gap), P(s + dash + gap + dot));
    }
  }

  /**
   * Volume plein invisible : il n'est jamais dessiné mais masque les
   * traits situés derrière lui, comme un dessin en parties cachées.
   * Il est rétréci de `inset` pour ne pas manger les traits posés
   * sur ses faces.
   */
  solid([x, y, z], [dx, dy, dz], inset = 0.12) {
    if (dx <= 2 * inset || dy <= 2 * inset || dz <= 2 * inset) return;
    const g = new THREE.BoxGeometry(dx - 2 * inset, dy - 2 * inset, dz - 2 * inset);
    g.translate(x + dx / 2, y + dy / 2, z + dz / 2);
    this.solids.push(g);
  }

  /**
   * Prisme masquant extrudé de `from` à `to` :
   * axis "x" → profil [[z, y]…] ; "z" → profil [[x, y]…] ; "y" → emprise [[x, z]…].
   */
  solidPrism(profile, { axis = "x", from, to }) {
    const shape = new THREE.Shape(profile.map(([u, v]) => new THREE.Vector2(u, v)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: to - from, bevelEnabled: false });
    const m = new THREE.Matrix4();
    if (axis === "x") m.set(0, 0, 1, from, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1);
    else if (axis === "y") m.set(1, 0, 0, 0, 0, 0, 1, from, 0, 1, 0, 0, 0, 0, 0, 1);
    else m.makeTranslation(0, 0, from);
    g.applyMatrix4(m);
    this.solids.push(g);
  }

  /** Volume masquant quelconque (dôme, tambour…), déjà positionné. */
  solidGeo(geometry) {
    this.solids.push(geometry);
  }

  /**
   * Lettrage d'agence au trait (capitales, chiffres) sur un plan o + u, v.
   * Chaque inscription garde son centre et son repère : `orientLabels` la
   * retourne sur elle-même pour qu'elle ne se lise jamais en miroir ni à
   * l'envers, de quelque côté que l'on regarde la maquette.
   */
  text(w, str, o, u, v, size = 0.5, { align = "start" } = {}) {
    const sc = size / 6;
    const adv = 5.6;
    const total = (str.length * adv - 1.6) * sc;
    const shift = align === "center" ? -total / 2 : align === "end" ? -total : 0;
    const at = (a, b) => add(add(o, mul(u, a)), mul(v, b));
    const pos = [];
    [...String(str).toUpperCase()].forEach((ch, i) => {
      const g = GLYPHS[ch];
      if (!g) return;
      for (const line of g) {
        for (let k = 0; k < line.length - 1; k++) {
          const p = at(shift + (i * adv + line[k][0]) * sc, line[k][1] * sc);
          const q = at(shift + (i * adv + line[k + 1][0]) * sc, line[k + 1][1] * sc);
          this._emit(pos, p[0], p[1], p[2], q[0], q[1], q[2]);
        }
      }
    });
    if (pos.length) this.labels.push({ w, pos, c: at(shift + total / 2, 3 * sc), u, v });
  }

  _emit(arr, x1, y1, z1, x2, y2, z2) {
    const k = this.wobble;
    arr.push(
      x1 + jit(x1, y1, z1, k), y1 + jit(y1, z1, x1, k), z1 + jit(z1, x1, y1, k),
      x2 + jit(x2, y2, z2, k), y2 + jit(y2, z2, x2, k), z2 + jit(z2, x2, y2, k)
    );
  }

  _push(w, x1, y1, z1, x2, y2, z2) {
    this._emit(this.buf[w], x1, y1, z1, x2, y2, z2);
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
    const labels = [];
    for (const k of Object.keys(this.buf)) {
      const arr = this.buf[k];
      const own = this.labels.filter((l) => l.w === k);
      if (!arr.length && !own.length) continue;
      const placed = own.map((l) => {
        const start = arr.length;
        for (const x of l.pos) arr.push(x);
        return { l, start };
      });
      const geo = new THREE.BufferGeometry();
      const attr = new THREE.Float32BufferAttribute(arr, 3);
      geo.setAttribute("position", attr);
      for (const { l, start } of placed) labels.push(labelRecord(l, attr, start));
      const mat = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: WEIGHTS[k] });
      mat.userData.baseOpacity = WEIGHTS[k];
      g.add(new THREE.LineSegments(geo, mat));
      mats.push(mat);
    }
    g.userData.labels = labels;
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
    if (this.solids.length) {
      const parts = this.solids.map((s) => {
        const ni = s.index ? s.toNonIndexed() : s;
        for (const k of Object.keys(ni.attributes)) if (k !== "position") ni.deleteAttribute(k);
        return ni;
      });
      const occ = new THREE.Mesh(
        mergeGeometries(parts),
        new THREE.MeshBasicMaterial({
          colorWrite: false,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: 2,
          polygonOffsetUnits: 2,
        })
      );
      occ.renderOrder = -1;
      g.add(occ);
      g.userData.occluder = occ;
      this.solids.forEach((s) => s.dispose());
    }
    g.userData.mats = mats;
    return g;
  }
}

/* --------------------- inscriptions toujours lisibles --------------------- */

/* Une inscription : sa plage de sommets, ses traits rapportés au centre,
   son repère (largeur, hauteur, normale) et son retournement courant. */
function labelRecord({ pos, c, u, v }, attr, start) {
  const U = new THREE.Vector3(...u).normalize();
  const V = new THREE.Vector3(...v).normalize();
  const rel = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    rel[i] = pos[i] - c[0];
    rel[i + 1] = pos[i + 1] - c[1];
    rel[i + 2] = pos[i + 2] - c[2];
  }
  return { attr, start, rel, c, axes: [null, V, new THREE.Vector3().crossVectors(U, V), U], U, V, state: 0 };
}

/* Demi-tour de l'inscription autour de l'un de ses axes, passant par son centre :
   1 → autour de sa hauteur (vue de dos), 2 → dans son plan (vue tête-bêche),
   3 → autour de sa largeur. */
function turnLabel(l) {
  const a = l.attr.array;
  const k = l.axes[l.state];
  for (let i = 0; i < l.rel.length; i += 3) {
    let x = l.rel[i];
    let y = l.rel[i + 1];
    let z = l.rel[i + 2];
    if (k) {
      const d = 2 * (k.x * x + k.y * y + k.z * z);
      x = d * k.x - x;
      y = d * k.y - y;
      z = d * k.z - z;
    }
    a[l.start + i] = l.c[0] + x;
    a[l.start + i + 1] = l.c[1] + y;
    a[l.start + i + 2] = l.c[2] + z;
  }
}

const _q = new THREE.Quaternion();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3();

/**
 * Retourne les inscriptions d'une maquette selon le point de vue : une
 * inscription vue de dos fait demi-tour sur sa hauteur, une inscription
 * au sol vue tête-bêche fait demi-tour dans son plan. Un léger seuil évite
 * qu'elle hésite quand elle se présente de profil.
 */
export function orientLabels(group, camera) {
  const labels = group.userData.labels;
  if (!labels || !labels.length) return;
  group.getWorldQuaternion(_q).invert();
  _right.set(1, 0, 0).applyQuaternion(camera.quaternion).applyQuaternion(_q);
  _up.set(0, 1, 0).applyQuaternion(camera.quaternion).applyQuaternion(_q);
  const dirty = new Set();
  for (const l of labels) {
    const ux = l.U.dot(_right);
    const uy = l.U.dot(_up);
    const vx = l.V.dot(_right);
    const vy = l.V.dot(_up);
    const front = ux * vy - uy * vx >= 0;
    const [a, b] = front ? [0, 2] : [1, 3];
    const score = front ? ux + vy : vy - ux;
    let s = score >= 0 ? a : b;
    if ((l.state === a || l.state === b) && Math.abs(score) < 0.2) s = l.state;
    if (s === l.state) continue;
    l.state = s;
    turnLabel(l);
    dirty.add(l.attr);
  }
  for (const attr of dirty) attr.needsUpdate = true;
}

/* ------------------------- lettrage au trait ------------------------- */
/* Glyphes sur une grille 4 × 6, tracés comme au normographe. */
const O = [[1, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0]];
const GLYPHS = {
  " ": [],
  0: [O],
  1: [[[1, 5], [2, 6], [2, 0]], [[1, 0], [3, 0]]],
  2: [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [0, 0], [4, 0]]],
  3: [[[0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1.5, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]],
  4: [[[3, 0], [3, 6], [0, 2], [4, 2]]],
  5: [[[4, 6], [0, 6], [0, 3.4], [3, 3.4], [4, 2.4], [4, 1], [3, 0], [1, 0], [0, 1]]],
  6: [[[3.6, 6], [1.6, 6], [0, 4], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2.4], [3, 3.4], [0.4, 3.4]]],
  7: [[[0, 6], [4, 6], [1.4, 0]]],
  8: [[[1, 3], [0, 4], [0, 5], [1, 6], [3, 6], [4, 5], [4, 4], [3, 3], [1, 3], [0, 2], [0, 1], [1, 0], [3, 0], [4, 1], [4, 2], [3, 3]]],
  9: [[[0.4, 0], [2.4, 0], [4, 2], [4, 5], [3, 6], [1, 6], [0, 5], [0, 3.6], [1, 2.6], [4, 2.6]]],
  ".": [[[1.6, 0], [2.4, 0], [2.4, 0.7], [1.6, 0.7], [1.6, 0]]],
  ",": [[[2.2, 0.7], [2.2, 0], [1.4, -0.9]]],
  "+": [[[2, 1], [2, 5]], [[0, 3], [4, 3]]],
  "-": [[[0.6, 3], [3.4, 3]]],
  "/": [[[0, 0], [4, 6]]],
  "°": [[[1.2, 6], [2.8, 6], [2.8, 4.4], [1.2, 4.4], [1.2, 6]]],
  "²": [[[1, 6], [2, 6.6], [3, 6], [1, 4.4], [3, 4.4]]],
  A: [[[0, 0], [2, 6], [4, 0]], [[0.7, 2], [3.3, 2]]],
  B: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [0, 0]]],
  C: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1]]],
  D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
  E: [[[4, 6], [0, 6], [0, 0], [4, 0]], [[0, 3], [3, 3]]],
  F: [[[4, 6], [0, 6], [0, 0]], [[0, 3], [3, 3]]],
  G: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [3, 0], [4, 1], [4, 3], [2, 3]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
  J: [[[4, 6], [4, 1], [3, 0], [1, 0], [0, 1]]],
  K: [[[0, 0], [0, 6]], [[4, 6], [0, 2.4]], [[1.3, 3.5], [4, 0]]],
  L: [[[0, 6], [0, 0], [4, 0]]],
  M: [[[0, 0], [0, 6], [2, 3], [4, 6], [4, 0]]],
  N: [[[0, 0], [0, 6], [4, 0], [4, 6]]],
  O: [O],
  P: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]]],
  Q: [O, [[2.6, 1.6], [4.2, -0.4]]],
  R: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[2, 3], [4, 0]]],
  S: [[[4, 5], [3, 6], [1, 6], [0, 5], [0, 4], [1, 3], [3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]],
  T: [[[0, 6], [4, 6]], [[2, 6], [2, 0]]],
  U: [[[0, 6], [0, 1], [1, 0], [3, 0], [4, 1], [4, 6]]],
  V: [[[0, 6], [2, 0], [4, 6]]],
  W: [[[0, 6], [1, 0], [2, 4], [3, 0], [4, 6]]],
  X: [[[0, 0], [4, 6]], [[0, 6], [4, 0]]],
  Y: [[[0, 6], [2, 3], [4, 6]], [[2, 3], [2, 0]]],
  Z: [[[0, 6], [4, 6], [0, 0], [4, 0]]],
};
GLYPHS["É"] = GLYPHS.E;
GLYPHS["È"] = GLYPHS.E;

/* ===================== conventions de dessin ===================== */

const FLAT_U = [1, 0, 0];
const FLAT_V = [0, 0, -1];

/**
 * Chaîne de cotes horizontale, posée au sol.
 * along : "x" (cotes le long de x, ligne à z = at) ou "z".
 * ticks : positions successives ; from : nu du bâtiment (amorces).
 */
export function dimChain(pen, ticks, { along = "x", at, from = at, y = 0.03, size = 0.42, labels = true } = {}) {
  const P = (s, q) => (along === "x" ? [s, y, q] : [q, y, s]);
  const dir = Math.sign(at - from) || 1;
  pen.seg("faint", P(ticks[0] - 0.4, at), P(ticks[ticks.length - 1] + 0.4, at));
  for (const s of ticks) {
    pen.seg("hair", P(s, from + dir * 0.25), P(s, at + dir * 0.35));
    pen.seg("medium", P(s - 0.16, at - 0.16 * dir), P(s + 0.16, at + 0.16 * dir));
  }
  if (!labels) return;
  for (let i = 0; i < ticks.length - 1; i++) {
    const mid = (ticks[i] + ticks[i + 1]) / 2;
    const len = Math.abs(ticks[i + 1] - ticks[i]);
    if (len < size * 3) continue;
    const txt = len.toFixed(2);
    const base = at - dir * 0.2 + (dir < 0 ? size : 0);
    if (along === "x") pen.text("hair", txt, [mid, y, base], FLAT_U, FLAT_V, size, { align: "center" });
    else pen.text("hair", txt, [base, y, mid], [0, 0, -1], [-1, 0, 0], size, { align: "center" });
  }
}

/** Axes de trame structurelle : trait mixte + bulle repérée. */
export function gridAxes(pen, { xs = [], zs = [], x0, x1, z0, z1, y = 0.02, ext = 2.4, r = 0.55, xLabels, zLabels }) {
  xs.forEach((x, i) => {
    pen.axis("hair", [x, y, z0 - ext + r], [x, y, z1 + 0.6]);
    const c = [x, y, z0 - ext];
    pen.circle("faint", c, r, { n: 18 });
    const lab = xLabels ? xLabels[i] : String(i + 1);
    pen.text("faint", lab, [x, y, z0 - ext + r * 0.45], FLAT_U, FLAT_V, r * 0.95, { align: "center" });
  });
  zs.forEach((z, i) => {
    pen.axis("hair", [x0 - ext + r, y, z], [x1 + 0.6, y, z]);
    const c = [x0 - ext, y, z];
    pen.circle("faint", c, r, { n: 18 });
    const lab = zLabels ? zLabels[i] : String.fromCharCode(65 + i);
    pen.text("faint", lab, [x0 - ext, y, z + r * 0.45], FLAT_U, FLAT_V, r * 0.95, { align: "center" });
  });
}

/**
 * Repère de niveau en élévation (plan vertical z = const) :
 * triangle pointé sur le niveau, trait d'attache, cote « +3.40 ».
 */
export function levelMark(pen, [x, y, z], label, { len = 2.2, size = 0.38, dir = 1 } = {}) {
  pen.seg("medium", [x, y, z], [x + dir * len, y, z]);
  const tx = x + dir * len * 0.35;
  pen.poly("medium", [[tx, y, z], [tx - 0.22, y + 0.34, z], [tx + 0.22, y + 0.34, z], [tx, y, z]]);
  pen.text("faint", label, [tx + dir * 0.35, y + 0.12, z], [1, 0, 0], [0, 1, 0], size, { align: dir > 0 ? "start" : "end" });
}

/**
 * Isolant en coupe (convention « ressort ») dans une bande o + u (longueur)
 * et v (épaisseur).
 */
export function insulation(pen, o, u, v, { w = "faint", step } = {}) {
  const L = Math.hypot(...u);
  const T = Math.hypot(...v);
  const st = step || T * 0.7;
  const n = Math.max(2, Math.round(L / st));
  const pts = [];
  for (let i = 0; i <= n * 8; i++) {
    const t = i / (n * 8);
    const ph = t * n * Math.PI * 2;
    const a = t + (Math.sin(ph) * 0.35) / n;
    const b = 0.5 - Math.cos(ph) * 0.45;
    pts.push(add(add(o, mul(u, Math.min(Math.max(a, 0), 1))), mul(v, b)));
  }
  pen.poly(w, pts);
}

/** Terre en coupe : hachure oblique coupée de petits traits croisés. */
export function earth(pen, o, u, v, n = 14) {
  pen.hatch("hair", o, add(mul(u, 0.06), v), [u[0], u[1], u[2]], n);
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

/* ------------------------------------------------------------------ */
/* Baie de façade : nu, tableaux (épaisseur du mur), menuiserie en     */
/* retrait, appui saillant, coffre de volet roulant.                   */
/* f = { o, u, n } : origine, direction du linéaire, normale sortante. */
/* ------------------------------------------------------------------ */
export function bay(pen, f, s, y, w, h, { kind = "window", depth = 0.24, rail = 0, coffre = true } = {}) {
  const P = (ds, dy, dn) => add(add(add(f.o, mul(f.u, s + ds)), [0, y + dy, 0]), mul(f.n, dn));
  const U = mul(f.u, w);
  pen.rect("strong", P(0, 0, 0.012), U, [0, h, 0]);
  for (const [ds, dy] of [[0, 0], [w, 0], [0, h], [w, h]]) pen.seg("faint", P(ds, dy, 0.012), P(ds, dy, -depth));
  const back = P(0, 0, -depth);
  if (kind === "door") {
    pen.rect("medium", back, U, [0, h, 0]);
    pen.rect("faint", P(0.12, 0.12, -depth), mul(f.u, w - 0.24), [0, h - 0.62, 0]);
    pen.seg("faint", P(0, h - 0.42, -depth), P(w, h - 0.42, -depth));
    pen.seg("medium", P(w - 0.16, 1.0, -depth + 0.02), P(w - 0.16, 1.14, -depth + 0.02));
  } else {
    windowOn(pen, back, U, [0, h, 0], { mullion: w > 1.1, transom: kind === "french", rail, inset: 0.07 });
  }
  if (kind === "window") pen.rect("faint", P(-0.05, -0.04, 0.07), mul(f.u, w + 0.1), mul(f.n, -0.3));
  if (coffre) pen.seg("hair", P(0, h + 0.24, 0.012), P(w, h + 0.24, 0.012));
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
export function bike(pen, x, z, { face = 0, y = 0 } = {}) {
  const c = Math.cos(face);
  const s = Math.sin(face);
  const P = (dx, dy) => [x + dx * c, y + dy, z + dx * s];
  for (const cx of [-0.55, 0.55]) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      pts.push(P(cx + Math.cos(a) * 0.33, 0.33 + Math.sin(a) * 0.33));
    }
    pen.poly("medium", pts);
  }
  pen.poly("medium", [P(-0.55, 0.33), P(-0.1, 0.85), P(0.42, 0.85), P(0.55, 0.33)]);
  pen.poly("medium", [P(-0.1, 0.85), P(0.18, 0.42), P(0.55, 0.33)]);
  pen.seg("medium", P(-0.62, 0.95), P(-0.48, 0.95));
  pen.seg("medium", P(-0.55, 0.33), P(-0.55, 0.95));
}
