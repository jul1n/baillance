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

Chaque « croquis » est un **véritable modèle 3D** de 6 000 à 12 000 traits, dessiné comme une
planche d'architecte : axonométries écorchées (dernier niveau coupé à 1,20 m pour lire le
plan) et coupes perspectives. Les traits situés derrière les volumes sont masqués (dessin en
parties cachées) par des volumes invisibles qui n'écrivent que la profondeur.

- `lineKit.js` — le « crayon 3D » : quatre poids de trait (fort / moyen / estompé / fin),
  léger tremblé déterministe, hachures, tirets et traits d'axe, lettrage au normographe,
  cotes, trame structurelle repérée, repères de niveau, isolant en coupe, volumes masquants,
  et vocabulaire d'architecture (baies avec tableaux, balustrades, arbres, silhouettes…).
- `planKit.js` — le plan d'étage : repère local (quarts de tour, symétrie), murs coupés et
  pochés, cloisons, portes et leur débattement, portes-fenêtres, mobilier (lits, séjour,
  cuisines, salles d'eau, rangements, bureaux), escalier à deux volées, ascenseur, gaines,
  poteaux, et un T4 traversant paramétrable réutilisé d'une planche à l'autre.
- `sectionKit.js` — la coupe : béton poché, isolant, terre, planchers en couches (parquet,
  chape, résilient, dalle, faux plafond), murs en couches, cotes verticales.
- `models/*.js` — les cinq planches, générées procéduralement :
  - **logement social** : barre R+4 écorchée, trois T4 traversants (deux en miroir autour
    d'une gaine commune), coursive au nord, tour d'escalier, toiture partagée sur l'aile basse ;
  - **transformation tertiaire** : dernier niveau écorché, plateau de bureaux (trame 7,20,
    noyau, faux plancher, postes de travail) à l'ouest, deux T4 dans la même trame à l'est ;
  - **urbanisme et mixité** : îlot haussmannien en gradins — boulangerie, cabinet, logements
    se lisent niveau par niveau, chaque ressaut étant une coupe ;
  - **logement de qualité** : axonométrie éclatée d'un duplex traversant — séjour en double
    hauteur, bibliothèque, piano, loggia de 2 m, suite parentale, bureau en mezzanine —, rives
    des planchers en coupe et « carotte » éclatée du plancher acoustique, présentée de face
    et balancée doucement ;
  - **adaptation au climat** : coupe sur une travée d'un immeuble bioclimatique R+3, présentée
    de face et balancée doucement : quatre niveaux meublés, façade nord en fibre de bois,
    dalles apparentes, cheminée de ventilation, jardins d'hiver, brise-soleil, photovoltaïque,
    angles solaires de 65° et 20°, flux d'air, puits canadien, noue, cuve, annotations.
- `LineScene.jsx` — rendu Three.js (caméra orthographique axonométrique, fond transparent)
  animé par **GSAP** : rotation continue réelle du modèle (turntable) — ou, pour les planches
  qui n'ont qu'une face lisible (coupe, axonométrie éclatée), balancement borné à ±43° autour
  de la vue principale, y compris au glisser —, parallaxe souris amortie, transitions entre modèles avec « mise en traits » (les lignes de construction
  montent avant les traits forts), bascule d'élévation de caméra propre à chaque planche,
  et rotation liée au scroll via ScrollTrigger dans les sections.
- `SheetOverlay.jsx` — l'habillage de planche par-dessus la 3D : cadre de feuille,
  annotations manuscrites, cartouche « BAILLANCE », rose du nord.

| Thématique | Fond | Planche 3D |
| --- | --- | --- |
| Logement social | Rouge terracotta | Axonométrie écorchée : T4 traversants meublés, coursive, tour d'escalier, toiture partagée |
| Transformation tertiaire | Bleu nuit | Dernier niveau écorché : bureaux d'un côté, logements de l'autre, grue en treillis |
| Urbanisme et mixité | Vert sauge | Îlot haussmannien en gradins : commerce, cabinet, logements ; dôme, tram, canopée |
| Logement de qualité | Beige chaud | Axonométrie éclatée d'un duplex : double hauteur, mezzanine, plancher acoustique |
| Adaptation au changement climatique | Gris perle | Coupe sur une travée : jardins d'hiver, cheminée de ventilation, cycles du soleil, de l'air et de l'eau |
