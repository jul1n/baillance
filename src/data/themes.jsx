import { buildSocial } from "../three/models/social.js";
import { buildTertiary } from "../three/models/tertiary.js";
import { buildUrban } from "../three/models/urban.js";
import { buildQuality } from "../three/models/quality.js";
import { buildClimate } from "../three/models/climate.js";

/** Fond et encre de la page au repos. */
export const BASE = {
  bg: "#F2EDE3",
  ink: "#1F1B16",
};

/**
 * Les cinq thématiques de Baillance.fr.
 * `bg`    : couleur de fond de la section / du hero au survol
 * `ink`   : couleur du trait de la maquette filaire 3D
 * `text`  : couleur du texte posé sur `bg`
 * `build` : constructeur du modèle 3D (THREE.Group de traits)
 * `notes` : annotations manuscrites en marge de la planche
 */
export const THEMES = [
  {
    id: "logement-social",
    index: "01",
    label: "Logement social",
    bg: "#A94A2F",
    ink: "#F7E9DA",
    text: "#FBF1E6",
    build: () => buildSocial("#F7E9DA"),
    el: 0.6,
    lede: "Habiter dignement ne devrait jamais relever d'une exception.",
    body: "Le logement social est devenu le point de rencontre des grandes tensions contemporaines : crise du logement, sobriété foncière, exigences environnementales, contraintes budgétaires et attentes croissantes des habitants. Les analyses abondent, les injonctions parfois se contredisent, et il devient difficile de distinguer les évolutions profondes des réponses circonstancielles.\n\nLes Carnets Baillance proposent une lecture transversale de ces mutations, à travers les projets, les politiques publiques et les innovations qui dessinent progressivement le logement social de demain.",
    caption: "Axonométrie sur jardin — hall traversant, balcons plantés, toiture partagée.",
    stamp1: "carnet n°01",
    stamp2: "logement social — axonométrie, éch. 1:200",
    notes: [
      { x: 118, y: 118, text: "balcons filants plantés" },
      { x: 1082, y: 132, text: "toiture partagée", anchor: "end" },
      { x: 118, y: 664, text: "hall traversant, ouvert sur le parvis", size: 15 },
    ],
  },
  {
    id: "transformation-tertiaire",
    index: "02",
    label: "Transformation tertiaire",
    bg: "#161F3A",
    ink: "#DCD8C8",
    text: "#EDE9DB",
    build: () => buildTertiary("#DCD8C8"),
    el: 0.52,
    lede: "La ville possède déjà une partie des logements dont elle aura besoin demain.",
    body: "Alors que des millions de mètres carrés de bureaux perdent progressivement leur fonction initiale, les besoins en logements demeurent considérables. Entre contraintes réglementaires, faisabilité économique, qualité d'usage et attentes locales, la transformation du bâti existant reste un sujet souvent abordé sous un angle unique.\n\nBaillance explore cette mutation dans toute sa complexité, en analysant les projets qui réinventent l'existant et interrogent une nouvelle manière de fabriquer la ville sans poursuivre son étalement.",
    caption: "Le plateau mute, travée après travée — la grue greffe les balcons.",
    stamp1: "carnet n°02",
    stamp2: "mutation tertiaire → résidentiel, sans étalement",
    notes: [
      { x: 118, y: 118, text: "hier, une façade rideau" },
      { x: 1082, y: 132, text: "demain, des balcons habités", anchor: "end" },
      { x: 118, y: 664, text: "réversibilité : la trame de bureaux devient logements", size: 15 },
    ],
  },
  {
    id: "urbanisme-et-mixite",
    index: "03",
    label: "Urbanisme et mixité",
    bg: "#9DAC8E",
    ink: "#222E1B",
    text: "#1E2917",
    build: () => buildUrban("#222E1B"),
    el: 0.58,
    lede: "Une ville ne se résume jamais à la somme de ses bâtiments.",
    body: "Densité, mobilité, végétalisation, commerces, équipements, mixité fonctionnelle, acceptabilité locale : chaque décision urbaine modifie un équilibre dont les effets ne deviennent parfois visibles que plusieurs années plus tard. Dans ce foisonnement d'enjeux, il devient difficile de relier les choix d'aujourd'hui aux usages de demain.\n\nLes Carnets Baillance observent les territoires où ces équilibres se construisent, afin de mieux comprendre ce qui rend une ville durablement habitable.",
    caption: "Axonométrie d'angle — tram, vélos, arcades, terrasses et canopée.",
    stamp1: "carnet n°03",
    stamp2: "la ville mixte — axonométrie d'îlot",
    notes: [
      { x: 118, y: 118, text: "rez-de-chaussée actifs" },
      { x: 1082, y: 132, text: "canopée contre les îlots de chaleur", anchor: "end" },
      { x: 118, y: 664, text: "tram, vélos — la rue apaisée", size: 15 },
    ],
  },
  {
    id: "logement-de-qualite",
    index: "04",
    label: "Logement de qualité",
    bg: "#E3D2B8",
    ink: "#4A3520",
    text: "#3D2C1A",
    build: () => buildQuality("#4A3520"),
    el: 0.4,
    lede: "La qualité d'un logement se mesure autant par ce que l'on ressent que par ce que l'on calcule.",
    body: "Surface, performance énergétique, coût de construction, réglementation, industrialisation : les indicateurs se multiplient sans toujours traduire la qualité réelle d'un logement. Pourtant, lumière, proportions, acoustique, confort d'été ou générosité des espaces continuent de façonner silencieusement notre manière d'habiter.\n\nBaillance s'intéresse à cette qualité souvent difficile à mesurer mais immédiatement perceptible, en étudiant les projets qui replacent l'usage au cœur de la conception.",
    caption: "Coupe habitée — trois niveaux généreux ouverts sur la lumière.",
    stamp1: "carnet n°04",
    stamp2: "la qualité d'habiter — coupe perspective",
    notes: [
      { x: 118, y: 118, text: "3,40 m sous plafond" },
      { x: 1082, y: 132, text: "lumière traversante", anchor: "end" },
      { x: 118, y: 664, text: "matériaux pérennes, acoustique soignée", size: 15 },
    ],
  },
  {
    id: "adaptation-climat",
    index: "05",
    label: "Adaptation au changement climatique",
    bg: "#C2CFD8",
    ink: "#22384A",
    text: "#1D3040",
    build: () => buildClimate("#22384A"),
    el: 0.44,
    lede: "Le climat redéfinit progressivement notre manière de construire et d'habiter.",
    body: "Confort d'été, ressources en eau, îlots de chaleur, végétalisation, résilience des bâtiments, evolution des normes : les réponses se multiplient à mesure que les épisodes climatiques s'intensifient. Entre innovations, effets d'annonce et retour à des principes bioclimatiques éprouvés, il devient parfois difficile de distinguer les adaptations durables des réponses conjoncturelles.\n\nLes Carnets Baillance analysent les stratégies qui permettent d'adapter l'habitat aux décennies à venir, sans perdre de vue la qualité architecturale ni la qualité d'usage.",
    caption: "Coupe bioclimatique — l'air traverse, le soleil d'été reste dehors.",
    stamp1: "carnet n°05",
    stamp2: "coupe bioclimatique — le confort d'été",
    notes: [
      { x: 118, y: 118, text: "brise-soleil au sud" },
      { x: 1082, y: 132, text: "soleil d'été haut, d'hiver bas", anchor: "end" },
      { x: 118, y: 664, text: "ventilation naturelle traversante", size: 15 },
    ],
  },
];
