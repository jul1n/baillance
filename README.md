# Baillance.fr — maquette interactive

Maquette One-Page premium sur l'habitat, l'urbanisme et l'évolution de l'immobilier.
React + Tailwind CSS v4 + Framer Motion + **Three.js** + **GSAP**.

## Lancer le projet

```bash
npm install
npm run dev        # développement
npm run build      # build de production
npm run preview    # prévisualisation du build
```

## Architecture

- **Hero (100vh)** — cinq expressions typographiques entremêlées au centre (serif éditorial
  Fraunces). Au survol d'une expression : le fond entier change de couleur, une **maquette
  filaire 3D** apparaît derrière le texte, et les autres expressions s'estompent fortement.
  Au clic : scroll fluide vers la section correspondante.
- **5 sections split-screen** — maquette 3D animée d'un côté, titre + texte éditorial de
  l'autre, fond à la couleur de la thématique (les côtés s'inversent une section sur deux).
- **Intercalaire de correspondance** (`Intercalaire.jsx`) — cliquer une occurrence du mot
  « Carnet » (œilleton des sections, mention du pied de page) insère une feuille de calque
  dans le Carnet : le fond recule à peine et perd du contraste, la feuille monte de 36 px
  (rotation X 2° → 0), le filet périphérique se dessine, puis titre, texte, champ et actions
  apparaissent en séquence (~1,25 s, easing power2/power3, sans rebond). Three.js n'y sert
  qu'à la profondeur : deux calques esquissés entre le Carnet et la feuille, parallaxe
  souris ≤ 2 px (`IntercalaireDepth.jsx`), désactivés sur mobile, petites configurations et
  `prefers-reduced-motion`. Fermeture « page tournée » (glissement latéral + fondu) par le
  lien « poursuivre la lecture », Échap, le clic hors feuille ou l'annotation « fermer » —
  la lecture n'est jamais bloquée. Dialogue accessible : focus piégé, focus visible façon
  trait de repérage, `aria-live` sur la confirmation.

## Les maquettes 3D (`src/three`)

Chaque « croquis » est un **véritable modèle 3D** de milliers de traits, dans l'esprit des
axonométries d'architecte : trames de fenêtres, garde-corps barreaudés, corniches, mansardes
hachurées, lucarnes, cheminées, mobilier, végétation, personnages d'échelle.

- `lineKit.js` — le « crayon 3D » : trois poids de trait (fort / moyen / estompé), léger
  tremblé déterministe des sommets, hachures, courbes en tirets, et vocabulaire
  d'architecture réutilisable (fenêtres, balustrades, arbres, silhouettes…).
- `models/*.js` — les cinq planches, générées procéduralement.
- `LineScene.jsx` — rendu Three.js (caméra orthographique axonométrique, fond transparent)
  animé par **GSAP** : rotation continue réelle du modèle (turntable), parallaxe souris
  amortie, transitions entre modèles avec « mise en traits » (les lignes de construction
  montent avant les traits forts), bascule d'élévation de caméra propre à chaque planche,
  et rotation liée au scroll via ScrollTrigger dans les sections.
- `SheetOverlay.jsx` — l'habillage de planche par-dessus la 3D : cadre de feuille,
  annotations manuscrites, cartouche « BAILLANCE », rose du nord.

| Thématique | Fond | Planche 3D |
| --- | --- | --- |
| Logement social | Rouge terracotta | Axonométrie de deux volumes en L : balcons plantés, hall traversant, toiture partagée |
| Transformation tertiaire | Bleu nuit | Plateau de bureaux en mutation : façade rideau, balcons greffés, grue en treillis |
| Urbanisme et mixité | Vert sauge | Îlot haussmannien d'angle : mansardes, dôme, tram, vélos, terrasse, canopée |
| Logement de qualité | Beige chaud | Coupe habitée sur trois niveaux : escalier balancé, grande baie, mobilier |
| Adaptation au changement climatique | Gris perle | Coupe bioclimatique : brise-soleil, flux d'air, course du soleil été/hiver |
