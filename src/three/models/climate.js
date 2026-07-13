import * as THREE from "three";
import { Pen, windowOn, balustrade, tree, person, tuft, planterRow } from "../lineKit.js";

/**
 * ADAPTATION AU CHANGEMENT CLIMATIQUE — Coupe bioclimatique rigoureuse.
 * Corrections architecturales : Vraie épaisseur de coupe (inertie), 
 * fondations, hiérarchie des traits (fort/moyen/fin).
 * Améliorations climatiques : Puits canadien, lanterneau (effet cheminée),
 * toiture végétalisée profonde, noue d'infiltration, cuve eau de pluie,
 * ombres portées géométriques, protections solaires renforcées.
 */
export function buildClimate(ink) {
  const pen = new Pen({ wobble: 0.03 });

  const W = 15;   // x : -7.5 (nord-ouest) .. 7.5 (sud-est)
  const D = 8;    // z : profondeur
  const FH = 3.2; // Hauteur sous plafond
  const LV = 2;   // Nombre de niveaux
  const X0 = -W / 2;
  const X1 = W / 2;
  const Z0 = -D / 2;
  const Z1 = D / 2;
  
  // Nouvelles épaisseurs pour l'inertie thermique (murs et dalles massifs)
  const TH = 0.5; // Épaisseur des dalles (béton bas carbone / pierre)
  const WT = 0.6; // Épaisseur des murs (isolation par l'extérieur + masse)
  const RE = 0.7; // Épaisseur du substrat de la toiture végétalisée
  const yTop = LV * FH + (LV + 1) * TH;

  // Ligne de terre principale (trait très fort)
  pen.seg("strong", [X0 - 12, 0, Z1], [X0 - 6, 0, Z1]);
  // Noue d'infiltration à l'Ouest (bassin de rétention paysager)
  pen.seg("strong", [X0 - 6, 0, Z1], [X0 - 4.5, -0.6, Z1]);
  pen.seg("strong", [X0 - 4.5, -0.6, Z1], [X0 - 2.5, -0.6, Z1]);
  pen.seg("strong", [X0 - 2.5, -0.6, Z1], [X0, 0, Z1]);
  pen.seg("strong", [X1, 0, Z1], [X1 + 10, 0, Z1]);

  // Hachures du sol perméable extérieur
  pen.hatch("faint", [X0 - 11, 0, Z1 - 1], [9, 0, 0], [0, 0, -5], 12);
  pen.hatch("faint", [X1 + 1, 0, Z1 - 1], [8, 0, 0], [0, 0, -5], 10);

  // Puits canadien (Nord-Ouest) - prise d'air frais
  pen.box("medium", [X0 - 8.5, 0, Z1 - 2], [0.6, 1.2, 0.6]); // Borne d'aspiration
  pen.seg("strong", [X0 - 8.2, 0, Z1], [X0 - 8.2, -2.5, Z1]);
  pen.seg("strong", [X0 - 7.6, 0, Z1], [X0 - 7.6, -1.9, Z1]);
  pen.seg("strong", [X0 - 8.2, -2.5, Z1], [X0 + 0.5, -2.5, Z1]); // Tube enterré
  pen.seg("strong", [X0 - 7.6, -1.9, Z1], [X0 + 1.1, -1.9, Z1]);

  // Cuve de récupération des eaux de pluie (Sud-Est)
  pen.rect("strong", [X1 + 2, -2.8, Z1], [3, 0, 0], [0, 2, 0]);
  pen.hatch("faint", [X1 + 2.2, -2.6, Z1], [2.6, 0, 0], [0, 1.6, 0], 8); // Eau
  pen.seg("medium", [X1 + 0.5, yTop, Z1], [X1 + 0.5, -0.8, Z1]); // Descente de pluie
  pen.seg("medium", [X1 + 0.5, -0.8, Z1], [X1 + 2.5, -0.8, Z1]);

  // Mur de refend/façade Nord-Ouest coupé (Plein + Isolant)
  pen.rect("strong", [X0, 0, Z1], [WT, 0, 0], [0, yTop, 0]);
  pen.hatch("medium", [X0 + 0.1, 0.2, Z1], [WT - 0.2, 0, 0], [0, yTop - 0.4, 0], 40); // Inertie
  
  // Dalles lourdes coupées (plancher bas et intermédiaires)
  for (let f = 0; f <= LV; f++) {
    const y = f * (FH + TH);
    pen.rect("strong", [X0, y, Z1], [W, 0, 0], [0, TH, 0]);
    pen.hatch("medium", [X0 + WT, y + 0.1, Z1], [W - WT - 0.2, 0, 0], [0, TH - 0.2, 0], 6);
    // Ligne de fond (profondeur)
    if (f < LV) pen.seg("medium", [X0 + WT, y + TH, Z0], [X1, y + TH, Z0]);
  }
  // Fermeture du fond (mur opaque au fond de la perspective)
  pen.rect("strong", [X0, 0, Z0], [W, 0, 0], [0, yTop, 0]);

  const yRoof = LV * (FH + TH);
  // Complexe végétalisé (Terre/Substrat épais)
  pen.rect("strong", [X0, yRoof + TH, Z1], [W, 0, 0], [0, RE, 0]);
  pen.hatch("faint", [X0 + 0.2, yRoof + TH + 0.1, Z1], [W - 0.4, 0, 0], [0, RE - 0.2, 0], 25);
  pen.rect("medium", [X0, yRoof + TH, Z0], [W, 0, 0], [0, 0, D]); // Surface toit fond
  
  // Lanterneau pour extraction d'air chaud (Effet cheminée)
  const LX = X1 - 4; // Position du lanterneau
  pen.rect("strong", [LX, yRoof + TH + RE, Z1], [2, 0, 0], [0, 0.8, 0]); // Souche
  pen.seg("strong", [LX - 0.2, yRoof + TH + RE + 0.8, Z1], [LX + 2.4, yRoof + TH + RE + 1.2, Z1]); // Volet ouvert
  
  // Végétation de toiture (graminées et arbustes pour déphasage)
  for (let i = 0; i < 15; i++) {
    tuft(pen, X0 + 1 + i * 0.9, yRoof + TH + RE, Z0 + 1 + (i % 4) * 1.5, 1.2);
  }

  for (let f = 0; f < LV; f++) {
    const y = f * (FH + TH) + TH;
    // Vitrage en retrait pour profiter de l'ombre de la dalle
    windowOn(pen, [X1 - 0.5, y + 0.2, Z0 + 0.5], [0, 0, D - 1.0], [0, FH - 0.4, 0], { mullion: true });
    
    // Structure du brise-soleil fixée sur le nez de dalle
    const bsZ0 = Z0 + 0.2;
    const bsZ1 = Z1 - 0.2;
    pen.seg("strong", [X1 + 1.2, y, bsZ0], [X1 + 1.2, y + FH, bsZ0]);
    pen.seg("strong", [X1 + 1.2, y, bsZ1], [X1 + 1.2, y + FH, bsZ1]);
    
    // Lames orientées (calculées pour bloquer le soleil à 65° d'été)
    const slats = 14;
    for (let s = 0; s < slats; s++) {
      const sy = y + 0.3 + ((FH - 0.6) * s) / (slats - 1);
      // Profil de lame en forme d'aile d'avion (plus technique)
      pen.poly("medium", [
        [X1 + 0.8, sy, bsZ0], [X1 + 1.5, sy + 0.25, bsZ0], [X1 + 1.45, sy + 0.3, bsZ0]
      ]);
      pen.poly("faint", [
        [X1 + 0.8, sy, bsZ1], [X1 + 1.5, sy + 0.25, bsZ1], [X1 + 1.45, sy + 0.3, bsZ1]
      ]);
      pen.seg("faint", [X1 + 0.8, sy, bsZ0], [X1 + 0.8, sy, bsZ1]); // Arête avant
    }
  }

  for (let f = 0; f < LV; f++) {
    const y = f * (FH + TH) + TH;
    windowOn(pen, [X0 + WT, y + 0.2, Z0 + 1], [0, 0, 3.5], [0, FH - 0.4, 0], { mullion: true });
    
    // Persiennes coulissantes épaisses pour bloquer le soleil rasant d'Ouest
    const pZ = Z0 + 4.8;
    pen.box("medium", [X0 + WT - 0.8, y + 0.2, pZ], [0.8, FH - 0.4, 2.8]);
    for (let l = 1; l < 12; l++) {
      const ly = y + 0.2 + ((FH - 0.4) * l) / 12;
      pen.seg("faint", [X0 + WT - 0.7, ly, pZ + 0.1], [X0 + WT - 0.1, ly + 0.15, pZ + 2.7]);
    }
  }
  // Casquette végétalisée
  pen.box("medium", [X0 - 2, FH + TH, Z0 + 0.5], [2 + WT, 0.3, D - 1.0]);
  planterRow(pen, [X0 - 1.8, FH + TH + 0.3, Z0 + 1], [X0 - 1.8, FH + TH + 0.3, Z1 - 1], 4, 1.2);

  const y0 = TH;
  // Mur lourd intérieur (Pisé / Pierre) pour stocker la fraîcheur
  pen.rect("strong", [-1, y0, Z0], [1.5, 0, 0], [0, FH, 0]);
  pen.hatch("faint", [-0.8, y0 + 0.2, Z0], [1.1, 0, 0], [0, FH - 0.4, 0], 15);
  
  // Mobilier minimaliste
  pen.box("medium", [-3, y0, -1], [1.2, 0.6, 1.2]); // Table
  person(pen, -2.4, -0.2, { y: y0, h: 1.7, face: 1 });
  
  // Ventilateurs de plafond (brasseurs d'air) aux deux niveaux
  for (const fy of [FH + TH, 2 * FH + 2 * TH]) {
    pen.seg("medium", [3, fy - 0.1, 0], [3, fy - 0.6, 0]);
    pen.circle("medium", [3, fy - 0.6, 0], 0.2, { axis: "y", n: 12 });
    for (const a of [0, 2.09, 4.18]) {
      pen.poly("medium", [
        [3, fy - 0.6, 0], 
        [3 + Math.cos(a)*1.4, fy - 0.65, Math.sin(a)*1.4], 
        [3 + Math.cos(a-0.2)*1.3, fy - 0.65, Math.sin(a-0.2)*1.3]
      ]);
    }
  }

  const RS = 16; // Rayon de la course solaire
  pen.circle("faint", [0, 1, 0], RS, { axis: "z", n: 40, a0: Math.PI * 0.05, a1: Math.PI * 0.95 });

  // 1. SOLEIL D'ÉTÉ (Haut : ~65°)
  const aE = Math.PI * 0.36;
  const SE = [Math.cos(aE) * RS, 1 + Math.sin(aE) * RS, 0];
  pen.circle("strong", SE, 1.2, { axis: "z", n: 24 });
  // Rayon d'été bloqué par le brise-soleil
  pen.dashedCurve([[SE[0], SE[1], 0], [X1 + 1.2, yTop - 0.5, 0]], { dash: 0.5, gap: 0.4, opacity: 0.6 });
  
  // Onde de chaleur repoussée (Ombre portée au sol au RDC)
  // L'ombre du brise soleil (X1+1.5) tombe juste à l'extérieur du vitrage (X1-0.5)
  pen.hatch("medium", [X1 - 0.5, y0, Z0 + 0.5], [2, 0, 0], [0, 0, D - 1], 15); 

  // 2. SOLEIL D'HIVER (Bas : ~20°)
  const aH = Math.PI * 0.12;
  const SH = [Math.cos(aH) * RS, 1 + Math.sin(aH) * RS, 0];
  pen.circle("medium", SH, 0.9, { axis: "z", n: 16 });
  // Rayon d'hiver pénétrant loin dans le logement (chauffe la dalle et le mur lourd)
  pen.dashedCurve([[SH[0] - 1, SH[1] - 0.2, 0], [X1 - 0.5, FH/2, 0], [-0.5, y0 + 0.5, 0]], { dash: 0.8, gap: 0.6 });
  // Zone d'ensoleillement au sol (Captage passif)
  pen.hatch("faint", [-1, y0, Z0 + 1], [X1 - 0.5 + 1, 0, 0], [0, 0, D - 2], 20); // Dalle chauffée

  // Flux 1 : Air frais venant du puits canadien
  pen.dashedCurve(
    [[X0 - 8, -1, Z1 + 0.5], [X0 - 2, -1, Z1 + 0.5], [X0 + 1, y0 + 1, Z1 - 1], [3, y0 + 1.5, 0]], 
    { dash: 0.6, gap: 0.4, opacity: 0.8 }
  );
  
  // Flux 2 : Air chaud montant et évacué par le lanterneau (Tirage)
  pen.dashedCurve(
    [[0, y0 + 2, -1], [LX + 1, FH + TH + 1.5, -0.5], [LX + 1.2, yRoof + 1, 0], [LX + 3, yRoof + TH + RE + 2, 0]],
    { dash: 0.5, gap: 0.5, opacity: 0.6 }
  );
  // Flèches d'évacuation
  pen.poly("strong", [[LX + 2.8, yRoof + RE + TH + 1.7, 0], [LX + 3.2, yRoof + RE + TH + 2.1, 0], [LX + 2.5, yRoof + RE + TH + 2.2, 0]]);

  // Arbre à feuilles caduques au Sud (Ombre massive en été)
  tree(pen, X1 + 6, 0, { h: 9, r: 3.5, lean: -0.1 });
  // Ombre portée de l'arbre sur la façade Sud et le sol
  pen.hatch("faint", [X1 + 1.5, 0, Z0], [7, 0, 0], [0, 0, 6], 10);
  
  // Arbres persistants au Nord-Ouest (Coupent les vents froids d'hiver)
  tree(pen, X0 - 9, Z0 - 2, { h: 6, r: 2, type: "pine" });
  tree(pen, X0 - 11, Z1 + 1, { h: 7, r: 2.2, type: "pine" });

  return pen.build(ink);
}
