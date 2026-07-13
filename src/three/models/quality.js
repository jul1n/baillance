import * as THREE from "three";
import { Pen, windowOn, tree, person, tuft } from "../lineKit.js";

/**
 * LOGEMENT DE QUALITÉ — coupe perspective habitée, dessinée comme une
 * planche d'architecte ancienne.
 *
 * Parti pris :
 * - éléments réellement coupés en trait fort et pochés ;
 * - bâtiment ancré dans le sol, avec soubassement et fondations lisibles ;
 * - planchers épais et plafond désolidarisé pour rendre l'acoustique crédible ;
 * - escalier confortable, garde-corps continu et circulation refermable ;
 * - loggias profondes, protections solaires et filtres d'intimité ;
 * - rangements intégrés et noyau technique servant aussi de tampon phonique ;
 * - lumière et ventilation traversantes matérialisées dans le dessin.
 */
export function buildQuality(ink) {
  const pen = new Pen({ wobble: 0.03 });

  const W = 16;
  const D = 9;
  const FH = 3.4;       // hauteur d'étage, dalle à dalle
  const LV = 3;
  const WALL = 0.5;     // mur porteur / enveloppe
  const SLAB = 0.52;    // dalle + chape flottante
  const CEILING = 0.18; // plénum acoustique sous dalle

  const X0 = -W / 2;
  const X1 = W / 2;
  const Z0 = -D / 2;
  const Z1 = D / 2;     // plan de coupe principal
  const yTop = LV * FH + SLAB;

  const floorTop = (f) => f * FH + SLAB;

  /* ------------------------------------------------------------------ */
  /* OUTILS DE DESSIN RÉPÉTITIFS                                        */
  /* ------------------------------------------------------------------ */

  function cutHatch(origin, u, v, density = 8) {
    pen.hatch("faint", origin, u, v, density);
  }

  function builtInStorage(x, y, z, w, h, d, doors = 3) {
    pen.box("medium", [x, y, z], [w, h, d]);
    for (let i = 1; i < doors; i++) {
      const xi = x + (w * i) / doors;
      pen.seg("faint", [xi, y + 0.04, z + d + 0.01], [xi, y + h - 0.04, z + d + 0.01]);
    }
    for (let i = 0; i < doors; i++) {
      const xi = x + (w * (i + 0.5)) / doors;
      pen.seg("faint", [xi - 0.04, y + h * 0.52, z + d + 0.02], [xi + 0.04, y + h * 0.52, z + d + 0.02]);
    }
  }

  function acousticDoorOnX(x, y, z, depth = 1.0, h = 2.15) {
    // Porte épaisse, joint périphérique et petit bouton : lecture volontairement simple.
    pen.rect("strong", [x, y, z], [0, h, 0], [0, 0, depth]);
    pen.rect("faint", [x - 0.01, y + 0.07, z + 0.07], [0, h - 0.14, 0], [0, 0, depth - 0.14]);
    pen.seg("medium", [x - 0.02, y + 1.02, z + depth - 0.22], [x - 0.02, y + 1.02, z + depth - 0.1]);
  }

  function guardRailOnX(x, y, z0, z1, h = 1.05, posts = 8) {
    pen.seg("strong", [x, y + h, z0], [x, y + h, z1]);
    pen.seg("medium", [x, y + 0.12, z0], [x, y + 0.12, z1]);
    for (let i = 0; i <= posts; i++) {
      const z = z0 + ((z1 - z0) * i) / posts;
      pen.seg("medium", [x, y + 0.12, z], [x, y + h, z]);
    }
  }

  function verticalScreen(x, y, z0, z1, h, spacing = 0.55, strength = "medium") {
    const count = Math.max(2, Math.ceil((z1 - z0) / spacing));
    for (let i = 0; i <= count; i++) {
      const z = z0 + ((z1 - z0) * i) / count;
      pen.seg(strength, [x, y, z], [x, y + h, z]);
      // seconde arête : donne une épaisseur aux lames sans perdre le trait esquissé
      pen.seg("faint", [x - 0.07, y, z + 0.03], [x - 0.07, y + h, z + 0.03]);
    }
  }

  function curtainOnX(x, y, z0, z1, h, folds = 8) {
    for (let i = 0; i <= folds; i++) {
      const z = z0 + ((z1 - z0) * i) / folds;
      const bulge = i % 2 === 0 ? 0.08 : -0.06;
      pen.curve(
        "faint",
        [[x, y, z], [x + bulge, y + h * 0.52, z + 0.04], [x, y + h, z]],
        8
      );
    }
  }

  /* ------------------------------------------------------------------ */
  /* SOL, SOUBASSEMENT ET FONDATIONS                                    */
  /* ------------------------------------------------------------------ */

  const foundationBottom = -1.15;

  // Terrain en coupe : hachures plus denses sous l'emprise, plus légères dehors.
  pen.seg("strong", [X0 - 6, 0, Z1 + 0.02], [X1 + 6, 0, Z1 + 0.02]);
  cutHatch([X0 - 6, foundationBottom, Z1 + 0.03], [W + 12, 0, 0], [0, 1.08, 0], 18);

  // Semelles filantes sous les deux façades porteuses.
  for (const x of [X0 - 0.25, X1 - 0.75]) {
    pen.rect("strong", [x, foundationBottom, Z1 + 0.05], [1.0, 0, 0], [0, 0.42, 0]);
    cutHatch([x + 0.05, foundationBottom + 0.05, Z1 + 0.06], [0.9, 0, 0], [0, 0.32, 0], 5);
  }

  // Longrines / murs de soubassement et dalle basse.
  for (const [xa, xb] of [[X0, X0 + WALL], [X1 - WALL, X1]]) {
    pen.rect("strong", [xa, foundationBottom + 0.35, Z1 + 0.04], [xb - xa, 0, 0], [0, 1.3, 0]);
    cutHatch([xa + 0.05, foundationBottom + 0.45, Z1 + 0.05], [xb - xa - 0.1, 0, 0], [0, 1.1, 0], 8);
  }
  pen.rect("strong", [X0, 0, Z1 + 0.04], [W, 0, 0], [0, SLAB, 0]);
  cutHatch([X0 + 0.12, 0.07, Z1 + 0.05], [W - 0.24, 0, 0], [0, SLAB - 0.14, 0], 4);

  // Soubassement légèrement surélevé : évite l'impression de bâtiment posé sur une ligne.
  pen.seg("strong", [X0, SLAB, Z0], [X1, SLAB, Z0]);
  pen.seg("medium", [X0 - 2.2, 0.12, Z0 - 2.8], [X1 + 3.2, 0.12, Z0 - 2.8]);

  /* ------------------------------------------------------------------ */
  /* ENVELOPPE COUPÉE ET HIÉRARCHIE DES TRAITS                          */
  /* ------------------------------------------------------------------ */

  // Murs pignons sectionnés : contour fort et poché dense.
  for (const [xa, xb] of [[X0, X0 + WALL], [X1 - WALL, X1]]) {
    pen.rect("strong", [xa, 0, Z1], [xb - xa, 0, 0], [0, yTop, 0]);
    cutHatch([xa + 0.05, 0.12, Z1 + 0.01], [xb - xa - 0.1, 0, 0], [0, yTop - 0.28, 0], 30);

    // Arêtes hors coupe : volontairement moins fortes.
    pen.seg("medium", [xa, 0, Z0], [xa, yTop, Z0]);
    pen.seg("medium", [xb, 0, Z0], [xb, yTop, Z0]);
    pen.seg("faint", [xa, yTop, Z0], [xa, yTop, Z1]);
    pen.seg("faint", [xb, yTop, Z0], [xb, yTop, Z1]);
  }

  // Dalles épaisses : béton en coupe + chape flottante + faux plafond acoustique.
  for (let f = 0; f <= LV; f++) {
    const y = f * FH;
    pen.rect("strong", [X0, y, Z1], [W, 0, 0], [0, SLAB, 0]);
    cutHatch([X0 + 0.15, y + 0.06, Z1 + 0.01], [W - 0.3, 0, 0], [0, SLAB - 0.12, 0], 4);

    // Chape désolidarisée au-dessus de la dalle.
    if (f < LV) {
      pen.seg("medium", [X0 + WALL, y + SLAB + 0.08, Z1 + 0.015], [X1 - WALL, y + SLAB + 0.08, Z1 + 0.015]);
    }

    // Plafond suspendu sous la dalle supérieure : masse-ressort-masse lisible en coupe.
    if (f > 0) {
      pen.seg("faint", [X0 + WALL, y - CEILING, Z0 + 0.12], [X1 - WALL, y - CEILING, Z0 + 0.12]);
      for (let x = X0 + 1.0; x < X1 - 0.8; x += 2.2) {
        pen.seg("faint", [x, y, Z0 + 0.12], [x, y - CEILING, Z0 + 0.12]);
      }
    }

    pen.seg("medium", [X0, y + SLAB, Z0], [X1, y + SLAB, Z0]);
  }

  // Mur du fond, non sectionné : trait moyen, afin de ne pas concurrencer le poché.
  pen.rect("medium", [X0, 0, Z0], [W, 0, 0], [0, yTop, 0]);

  /* ------------------------------------------------------------------ */
  /* NOYAU STRUCTUREL, TECHNIQUE ET ACOUSTIQUE                          */
  /* ------------------------------------------------------------------ */

  const coreX = 4.35;
  const coreT = 0.32;
  const coreZ0 = Z0 + 0.15;
  const coreZ1 = 0.85;

  // Refend continu : réduit les portées de dalle et sert de dos au noyau humide.
  pen.box("strong", [coreX, 0, coreZ0], [coreT, yTop, coreZ1 - coreZ0]);
  for (let f = 0; f < LV; f++) {
    const y = floorTop(f);
    // Parement lourd côté pièces : seconde peau acoustique.
    pen.rect("medium", [coreX - 0.08, y, coreZ0], [0, FH - SLAB - 0.18, 0], [0, 0, coreZ1 - coreZ0]);
    // Porte palière refermable : le bruit ne monte plus librement sur trois niveaux.
    acousticDoorOnX(coreX - 0.1, y, coreZ1 - 1.05, 0.92, 2.15);
  }

  // Gaine technique verticale, alignée sur cuisine et salle d'eau.
  pen.box("medium", [3.15, SLAB, Z0 + 0.28], [0.9, yTop - SLAB - 0.2, 0.82]);
  pen.seg("faint", [3.47, SLAB + 0.2, Z0 + 1.11], [3.47, yTop - 0.25, Z0 + 1.11]);
  pen.seg("faint", [3.73, SLAB + 0.2, Z0 + 1.11], [3.73, yTop - 0.25, Z0 + 1.11]);

  /* ------------------------------------------------------------------ */
  /* TOITURE : ACROTÈRE, ISOLATION ET VÉGÉTALISATION LÉGÈRE             */
  /* ------------------------------------------------------------------ */

  pen.rect("strong", [X0, yTop, Z1], [W, 0, 0], [0, 0.34, 0]);
  pen.rect("medium", [X0, yTop, Z0], [W, 0, 0], [0, 0, D]);
  cutHatch([X0 + 0.3, yTop + 0.02, Z0 + 0.3], [W - 0.6, 0, 0], [0, 0, D - 0.6], 11);
  for (let i = 0; i < 6; i++) tuft(pen, X0 + 1.5 + i * 2.45, yTop + 0.03, Z0 + 1.2, 0.82);

  /* ------------------------------------------------------------------ */
  /* LOGGIAS PROFONDES, PROTECTION SOLAIRE ET INTIMITÉ                  */
  /* ------------------------------------------------------------------ */

  const LOG_D = 1.85;
  const LOG_X = X0 - LOG_D;
  const LOG_Z0 = Z0 + 0.85;
  const LOG_Z1 = Z1 - 0.65;
  const LOG_W = LOG_Z1 - LOG_Z0;

  for (let f = 0; f < LV; f++) {
    const y = floorTop(f);
    const clearH = FH - SLAB - 0.22;

    // Plancher de loggia et sous-face : la profondeur crée une vraie casquette solaire.
    pen.rect("medium", [LOG_X, y - SLAB, LOG_Z0], [LOG_D, 0, 0], [0, 0, LOG_W]);
    pen.rect("strong", [LOG_X, y - SLAB, LOG_Z1], [LOG_D, 0, 0], [0, SLAB, 0]);
    pen.seg("medium", [LOG_X, y, LOG_Z0], [X0, y, LOG_Z0]);
    pen.seg("medium", [LOG_X, y, LOG_Z1], [X0, y, LOG_Z1]);

    // Dalle supérieure / casquette.
    const canopyY = (f + 1) * FH;
    pen.rect("medium", [LOG_X, canopyY, LOG_Z0], [LOG_D, 0, 0], [0, 0, LOG_W]);
    pen.rect("strong", [LOG_X, canopyY, LOG_Z1], [LOG_D, 0, 0], [0, SLAB, 0]);

    // Garde-corps à barreaudage vertical et main courante continue.
    if (f > 0) guardRailOnX(LOG_X, y, LOG_Z0, LOG_Z1, 1.08, 10);

    // Baie en retrait : elle n'est plus alignée sur le nu extérieur.
    windowOn(pen, [X0 - 0.02, y + 0.18, LOG_Z0 + 0.15], [0, 0, LOG_W - 0.3], [0, clearH - 0.35, 0], {
      mullion: false,
      transom: false,
    });
    pen.grid("medium", [X0 - 0.02, y + 0.18, LOG_Z0 + 0.15], [0, 0, LOG_W - 0.3], [0, clearH - 0.35, 0], 5, 2);

    // Écran coulissant : densité plus forte devant la chambre.
    const screenH = clearH - 0.08;
    if (f === 2) {
      verticalScreen(LOG_X - 0.08, y + 0.08, LOG_Z0, LOG_Z1, screenH, 0.34, "strong");
      curtainOnX(X0 + 0.1, y + 0.22, LOG_Z0 + 0.25, LOG_Z1 - 0.25, clearH - 0.5, 10);
    } else {
      verticalScreen(LOG_X - 0.06, y + 0.18, LOG_Z0, LOG_Z0 + 2.25, screenH - 0.18, 0.55, "medium");
    }

    // Quelques plantations et un petit mobilier rendent l'extérieur réellement habitable.
    pen.box("faint", [LOG_X + 0.18, y, LOG_Z1 - 0.75], [0.5, 0.42, 0.48]);
    tuft(pen, LOG_X + 0.43, y + 0.42, LOG_Z1 - 0.5, 0.52);
    if (f === 1) {
      pen.circle("medium", [LOG_X + 0.8, y + 0.42, LOG_Z0 + 2.8], 0.48, { axis: "y", n: 16 });
      pen.seg("faint", [LOG_X + 0.8, y, LOG_Z0 + 2.8], [LOG_X + 0.8, y + 0.42, LOG_Z0 + 2.8]);
    }
  }

  /* ------------------------------------------------------------------ */
  /* ESCALIER : PROPORTIONS RÉALISTES ET SÉCURITÉ                       */
  /* ------------------------------------------------------------------ */

  const stW = 1.18;
  const stX = X1 - WALL - stW - 0.18;
  const stZTop = Z0 + 0.42;
  const stairRun = 4.45;
  const risers = 18; // 18,9 cm : nettement plus crédible que 13 marches sur 3,40 m

  for (let f = 0; f < LV; f++) {
    const yBase = floorTop(f);

    for (let s = 0; s <= risers; s++) {
      const t = s / risers;
      const y = yBase + FH * t;
      const z = stZTop + stairRun * (1 - t);

      // Giron et contremarche : largeur domestique réaliste.
      pen.seg("medium", [stX, y, z], [stX + stW, y, z]);
      if (s < risers) {
        const yNext = yBase + (FH * (s + 1)) / risers;
        pen.seg("faint", [stX, y, z], [stX, yNext, z]);
        pen.seg("faint", [stX + stW, y, z], [stX + stW, yNext, z]);
      }
    }

    // Limon porteur côté mur.
    pen.seg("strong", [stX + stW, yBase + 0.08, stZTop + stairRun], [stX + stW, yBase + FH + 0.08, stZTop]);

    // Garde-corps continu côté vide, à environ 1 m au-dessus du nez de marche.
    pen.seg("strong", [stX, yBase + 1.02, stZTop + stairRun], [stX, yBase + FH + 1.02, stZTop]);
    pen.seg("medium", [stX, yBase + 0.12, stZTop + stairRun], [stX, yBase + FH + 0.12, stZTop]);
    for (let s = 0; s <= 9; s++) {
      const t = s / 9;
      const z = stZTop + stairRun * (1 - t);
      const y = yBase + FH * t;
      pen.seg("medium", [stX, y + 0.12, z], [stX, y + 1.02, z]);
    }

    // Protection du palier haut et lisse basse anti-chute.
    guardRailOnX(stX, yBase + FH, stZTop, stZTop + 1.15, 1.02, 3);
  }

  /* ------------------------------------------------------------------ */
  /* NIVEAU 0 : ENTRÉE, CUISINE ET PIÈCE COMMUNE                        */
  /* ------------------------------------------------------------------ */

  const y0 = floorTop(0);

  // Sas d'entrée : porte et grand rangement toute hauteur.
  builtInStorage(1.65, y0, Z0 + 1.18, 1.2, 2.45, 0.72, 2);
  builtInStorage(2.92, y0, Z0 + 1.18, 0.85, 2.45, 0.72, 1);

  // Cuisine alignée sur la gaine technique.
  pen.box("medium", [X0 + WALL + 0.42, y0, Z0 + 0.34], [4.9, 0.94, 0.72]);
  pen.seg("strong", [X0 + WALL + 0.42, y0 + 0.94, Z0 + 1.06], [X0 + WALL + 5.32, y0 + 0.94, Z0 + 1.06]);
  pen.seg("medium", [X0 + WALL + 0.65, y0 + 1.68, Z0 + 0.08], [X0 + WALL + 4.75, y0 + 1.68, Z0 + 0.08]);
  pen.seg("medium", [X0 + WALL + 0.65, y0 + 2.28, Z0 + 0.08], [X0 + WALL + 4.75, y0 + 2.28, Z0 + 0.08]);
  for (let i = 0; i < 10; i++) {
    const bx = X0 + WALL + 0.82 + i * 0.39;
    pen.seg("faint", [bx, y0 + 1.72, Z0 + 0.1], [bx + (i % 2 ? 0.04 : -0.05), y0 + 2.08, Z0 + 0.1]);
  }

  // Îlot bas : sépare visuellement la cuisine sans créer une caisse de résonance verticale.
  pen.box("medium", [-3.0, y0, -0.6], [2.6, 0.92, 0.82]);
  pen.seg("faint", [-1.7, y0, 0.22], [-1.7, y0 + 0.92, 0.22]);

  // Table familiale et chaises.
  pen.box("medium", [-0.2, y0 + 0.72, -0.45], [3.4, 0.08, 1.42]);
  for (const [lx, lz] of [[-0.05, -0.3], [2.95, -0.3], [-0.05, 0.72], [2.95, 0.72]]) {
    pen.seg("medium", [lx, y0, lz], [lx, y0 + 0.72, lz]);
  }
  for (const [cx, cz] of [[0.45, 1.38], [1.65, 1.38], [0.45, -1.12], [1.65, -1.12]]) {
    pen.rect("faint", [cx - 0.23, y0 + 0.45, cz - 0.22], [0.46, 0, 0], [0, 0, 0.44]);
    pen.seg("faint", [cx - 0.22, y0, cz - 0.2], [cx - 0.22, y0 + 0.45, cz - 0.2]);
    pen.seg("faint", [cx + 0.22, y0, cz + 0.2], [cx + 0.22, y0 + 0.45, cz + 0.2]);
    pen.seg("medium", [cx - 0.22, y0 + 0.45, cz - 0.2], [cx - 0.22, y0 + 1.0, cz - 0.2]);
  }

  // Suspension et scène habitée.
  pen.seg("faint", [1.45, FH - CEILING, 0.1], [1.45, y0 + 1.92, 0.1]);
  pen.edges("medium", new THREE.ConeGeometry(0.42, 0.4, 10), { pos: [1.45, y0 + 1.76, 0.1] });
  person(pen, -3.55, 1.42, { y: y0, h: 1.7, face: 0.55 });

  // Rangement sous escalier : volume utile, lourd, et absorbant côté cuisine.
  const underStairX = stX - 0.18;
  for (let i = 0; i < 4; i++) {
    const h = 0.72 + i * 0.48;
    pen.box("medium", [underStairX - 0.95, y0, 0.08 + i * 0.66], [0.88, h, 0.6]);
  }

  /* ------------------------------------------------------------------ */
  /* NIVEAU 1 : SÉJOUR, BIBLIOTHÈQUE ACOUSTIQUE ET LOGGIA               */
  /* ------------------------------------------------------------------ */

  const y1 = floorTop(1);

  // Canapé tourné vers la lumière mais reculé de la façade vitrée.
  pen.box("medium", [-2.55, y1, 0.35], [3.45, 0.75, 1.28]);
  pen.box("medium", [-2.55, y1 + 0.75, 1.2], [3.45, 0.63, 0.42]);
  pen.seg("faint", [-0.84, y1 + 0.75, 0.35], [-0.84, y1 + 0.75, 1.2]);

  pen.rect("faint", [-3.45, y1 + 0.02, -1.58], [5.55, 0, 0], [0, 0, 3.35]);
  pen.dashedCurve([[-3.1, y1 + 0.03, -1.26], [1.72, y1 + 0.03, -1.26]], {
    dash: 0.28,
    gap: 0.28,
    opacity: 0.28,
  });

  pen.circle("medium", [-0.72, y1 + 0.4, -0.5], 0.72, { axis: "y", n: 20 });
  pen.circle("faint", [-0.72, y1 + 0.02, -0.5], 0.72, { axis: "y", n: 20 });
  pen.seg("faint", [-0.72, y1 + 0.02, -0.5], [-0.72, y1 + 0.4, -0.5]);
  pen.rect("faint", [-0.98, y1 + 0.42, -0.66], [0.52, 0, 0], [0, 0, 0.34]);

  // Bibliothèque massive entre séjour et cage d'escalier : rangement + tampon phonique.
  const shX0 = 0.95;
  builtInStorage(shX0, y1, Z0 + 0.34, 2.0, 2.62, 0.72, 4);
  pen.rect("strong", [-1.45, y1, Z0 + 0.08], [4.15, 0, 0], [0, FH - SLAB - 0.32, 0]);
  for (let r = 1; r <= 4; r++) {
    pen.seg("medium", [-1.45, y1 + r * 0.58, Z0 + 0.09], [2.7, y1 + r * 0.58, Z0 + 0.09]);
  }
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < 13; i++) {
      const bx = -1.22 + i * 0.29 + (r % 2) * 0.08;
      pen.seg("faint", [bx, y1 + r * 0.58 + 0.07, Z0 + 0.12], [bx + (i % 3 === 0 ? 0.05 : -0.04), y1 + r * 0.58 + 0.48, Z0 + 0.12]);
    }
  }

  // Coin lecture et végétation.
  pen.curve("medium", [[2.45, y1, 1.78], [2.4, y1 + 1.48, 1.74], [2.78, y1 + 1.8, 1.43]], 10);
  pen.edges("medium", new THREE.ConeGeometry(0.3, 0.35, 8), { pos: [2.82, y1 + 1.74, 1.39] });
  pen.box("faint", [3.18, y1, -1.82], [0.68, 0.54, 0.68]);
  pen.curve("medium", [[3.52, y1 + 0.54, -1.48], [3.4, y1 + 1.46, -1.62], [3.12, y1 + 1.86, -1.42]], 8);
  pen.edges("faint", new THREE.IcosahedronGeometry(0.52, 1), { pos: [3.2, y1 + 2.05, -1.45], noise: 0.48 });
  person(pen, 0.58, 0.9, { y: y1, h: 1.72, face: -1.1 });

  /* ------------------------------------------------------------------ */
  /* NIVEAU 2 : CHAMBRE, SALLE D'EAU ET RANGEMENTS                      */
  /* ------------------------------------------------------------------ */

  const y2 = floorTop(2);

  // Lit éloigné de la circulation et baie filtrée par la loggia.
  pen.box("medium", [X0 + WALL + 0.72, y2, -1.15], [2.65, 0.55, 2.05]);
  pen.rect("medium", [X0 + WALL + 0.72, y2 + 0.55, -1.15], [0, 0, 2.05], [0, 0.72, 0]);
  pen.rect("faint", [X0 + WALL + 0.88, y2 + 0.58, -0.86], [0.92, 0, 0], [0, 0, 0.66]);
  pen.rect("faint", [X0 + WALL + 1.82, y2 + 0.58, -0.86], [0.92, 0, 0], [0, 0, 0.66]);

  // Banquette-rangement sous fenêtre.
  pen.box("medium", [X0 + WALL + 0.68, y2, 1.52], [3.0, 0.48, 0.72]);
  for (let i = 1; i < 4; i++) {
    const x = X0 + WALL + 0.68 + i * 0.75;
    pen.seg("faint", [x, y2, 2.25], [x, y2 + 0.48, 2.25]);
  }

  // Dressing épais entre chambre et noyau : rangement structurel et écran phonique.
  builtInStorage(-0.15, y2, Z0 + 0.32, 2.75, 2.55, 0.75, 4);

  // Salle d'eau compacte, superposée à la gaine technique.
  pen.rect("medium", [2.55, y2, Z0 + 1.28], [1.5, 0, 0], [0, 2.55, 0]);
  pen.rect("medium", [2.55, y2, Z0 + 1.28], [0, 2.55, 0], [0, 0, 1.55]);
  pen.box("faint", [2.72, y2, Z0 + 1.45], [1.05, 0.12, 0.92]);
  pen.seg("medium", [3.78, y2 + 0.12, Z0 + 1.45], [3.78, y2 + 2.1, Z0 + 1.45]);
  pen.seg("faint", [2.74, y2 + 1.08, Z0 + 1.47], [3.75, y2 + 1.08, Z0 + 1.47]);
  pen.box("faint", [2.7, y2 + 0.76, Z0 + 2.65], [0.82, 0.12, 0.38]);

  // Petit bureau et assise près de la lumière, sans obstruer la baie.
  pen.box("faint", [-3.0, y2, Z0 + 0.42], [1.85, 0.78, 0.62]);
  pen.seg("medium", [-3.0, y2, Z0 + 1.04], [-3.0, y2 + 0.78, Z0 + 1.04]);
  pen.seg("medium", [-1.15, y2, Z0 + 1.04], [-1.15, y2 + 0.78, Z0 + 1.04]);
  pen.circle("medium", [X0 + WALL + 1.55, y2 + 0.3, 1.9], 0.42, { axis: "y", n: 14 });
  pen.circle("faint", [X0 + WALL + 1.55, y2 + 0.14, 1.9], 0.3, { axis: "y", n: 10 });

  /* ------------------------------------------------------------------ */
  /* DOUBLE EXPOSITION, LUMIÈRE ET CONFORT D'ÉTÉ                        */
  /* ------------------------------------------------------------------ */

  // Percements côté rue / fond, avec allège suffisante dans la chambre.
  for (let f = 0; f < LV; f++) {
    const y = floorTop(f);
    const sill = f === 2 ? 1.05 : 0.9;
    const h = f === 2 ? 1.45 : 1.7;
    windowOn(pen, [2.72, y + sill, Z0 - 0.02], [1.72, 0, 0], [0, h, 0], { rail: 4 });
    if (f > 0) windowOn(pen, [-4.85, y + sill, Z0 - 0.02], [1.72, 0, 0], [0, h, 0], { rail: 4 });
  }

  // Rayons solaires : entrée limitée par les casquettes, puis ombre portée des lames.
  for (let f = 0; f < LV; f++) {
    const y = floorTop(f);
    const startY = y + (f === 2 ? 2.25 : 2.55);
    for (let i = 0; i < 3; i++) {
      const z = LOG_Z0 + 1.05 + i * 1.45;
      pen.dashedCurve(
        [[LOG_X - 1.1, startY + 1.1, z], [X0 - 0.45, startY + 0.32, z + 0.18], [X0 + 2.1, y + 0.05, z + 0.82]],
        { dash: 0.32, gap: 0.42, opacity: f === 2 ? 0.22 : 0.38, div: 20 }
      );
    }

    // Ombres géométriques des brise-soleil sur le sol de la loggia et juste derrière la baie.
    for (let i = 0; i < 8; i++) {
      const z = LOG_Z0 + 0.55 + i * 0.68;
      pen.seg("faint", [LOG_X + 0.06, y + 0.025, z], [X0 + 1.65, y + 0.025, z + 0.72]);
    }
  }

  // Flaque lumineuse hachurée dans le séjour : la lumière traversante devient visible.
  cutHatch([-2.95, y1 + 0.025, 0.45], [4.5, 0, 1.05], [1.15, 0, 2.4], 7);

  // Flux d'air traversant, courbe légère afin de rester une indication environnementale.
  pen.dashedCurve(
    [[LOG_X - 0.8, y1 + 1.55, 0.8], [X0 + 0.25, y1 + 1.82, 0.45], [-0.2, y1 + 1.68, -0.28], [2.85, y1 + 1.8, Z0 - 0.65]],
    { dash: 0.48, gap: 0.42, opacity: 0.48, div: 28 }
  );

  /* ------------------------------------------------------------------ */
  /* EXTÉRIEUR ET ÉCHELLE HUMAINE                                      */
  /* ------------------------------------------------------------------ */

  // Sol en perspective, noue plantée et seuil accessibles.
  pen.rect("faint", [X0 - 6, 0.02, Z0 - 4], [W + 12, 0, 0], [0, 0, D + 10]);
  pen.seg("medium", [X0 - 6, 0.03, Z1 + 2.2], [X1 + 6, 0.03, Z1 + 2.2]);
  pen.seg("faint", [X0 - 5.2, 0.04, Z1 + 1.35], [X1 + 5.4, 0.04, Z1 + 1.35]);

  tree(pen, X0 - 5.9, 2.55, { h: 6.5, r: 2.05 });
  tuft(pen, X1 + 2.25, 0.03, Z1 + 0.78, 1.35);
  tuft(pen, X1 + 3.4, 0.03, Z1 - 1.15, 1.08);
  tuft(pen, X0 - 3.2, 0.03, Z1 + 0.95, 0.9);
  person(pen, 0.4, Z1 + 3.1, { y: 0.03, h: 1.72, face: 1.7 });

  return pen.build(ink);
}
