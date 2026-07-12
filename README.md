# Baillance.fr — maquette interactive

Maquette One-Page premium sur l'habitat, l'urbanisme et l'évolution de l'immobilier.
React + Tailwind CSS v4 + Framer Motion.

## Lancer le projet

```bash
npm install
npm run dev        # développement
npm run build      # build de production
npm run preview    # prévisualisation du build
```

## Architecture

- **Hero (100vh)** — cinq expressions typographiques entremêlées au centre (serif éditorial
  Fraunces). Au survol d'une expression : le fond entier change de couleur, un croquis
  d'architecte « main levée » apparaît derrière le texte avec une lente animation
  pseudo-3D (parallaxe souris + dérive continue), et les autres expressions s'estompent
  fortement. Au clic : scroll fluide vers la section correspondante.
- **5 sections split-screen** — croquis animé d'un côté, titre + texte éditorial de
  l'autre, fond à la couleur de la thématique (les côtés s'inversent une section sur deux).

## Les croquis

Chaque planche est un SVG dessiné à la main dans `src/components/sketches/` :
tracés fins multi-passes (la main « repasse » sur le trait), filtre
`feTurbulence + feDisplacementMap` pour le tremblé du crayon, hachures d'ombre,
lignes de construction, cotations, annotations manuscrites et cartouche d'agence.

| Thématique | Fond | Planche |
| --- | --- | --- |
| Logement social | Rouge terracotta | Élévation d'un immeuble accueillant, balcons plantés |
| Transformation tertiaire | Bleu nuit | Façade rideau qui mute en balcons résidentiels, grue |
| Urbanisme et mixité | Vert sauge | Perspective de rue : tram, vélos, canopée, rez-de-chaussée actifs |
| Logement de qualité | Beige chaud | Perspective intérieure : baie, lumière, acoustique |
| Adaptation au changement climatique | Gris perle | Coupe bioclimatique : traversant, brise-soleil, ventilation naturelle |
