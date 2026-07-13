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
    lede: "Habiter dignement ne devrait jamais être un privilège.",
    body: "Le logement social s'invente aujourd'hui loin des standards d'hier : des architectures généreuses et accueillantes, des halls lumineux, des balcons plantés, des espaces communs qui créent du lien. Baillance explore les projets qui réconcilient qualité d'usage, beauté et accessibilité — parce que la ville inclusive commence à la porte d'entrée.",
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
    lede: "Des millions de mètres carrés de bureaux attendent une seconde vie.",
    body: "Plutôt que d'étaler la ville, transformons-la. Façades qui s'ouvrent en balcons, plateaux qui deviennent logements traversants, rooftops rendus aux habitants : la mutation du tertiaire obsolète est un gisement immense pour créer de l'habitat sans consommer un mètre carré de terre. Une révolution silencieuse, déjà à l'œuvre.",
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
    lede: "La ville désirable se joue à hauteur de rue.",
    body: "Rez-de-chaussée animés, commerces, ateliers et logements entremêlés, tramways et vélos à la place du tout-voiture, canopée urbaine contre les îlots de chaleur : la mixité n'est pas un slogan, c'est un art de composer la ville. Baillance raconte les quartiers où l'on habite, travaille et flâne — sans jamais avoir besoin d'en partir.",
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
    lede: "La qualité d'un logement se mesure les yeux fermés — et fenêtres ouvertes.",
    body: "Lumière naturelle traversante, hauteurs sous plafond retrouvées, acoustique soignée, matériaux pérennes : le logement de qualité n'est pas un luxe, c'est un standard à reconquérir. On n'habite pas des mètres carrés ; on habite l'espace, le calme et la lumière.",
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
    lede: "Le confort d'été est le nouveau chauffage.",
    body: "Logements traversants, brise-soleil, ventilation naturelle, ombrage végétal, inertie des matériaux : face aux étés qui s'intensifient, l'architecture redécouvre des savoir-faire bioclimatiques éprouvés. Adapter l'habitat, c'est garantir des logements vivables — sans climatisation par défaut — pour les décennies à venir.",
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
