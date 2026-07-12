import SocialHousing from "../components/sketches/SocialHousing.jsx";
import TertiaryTransformation from "../components/sketches/TertiaryTransformation.jsx";
import UrbanMix from "../components/sketches/UrbanMix.jsx";
import QualityHome from "../components/sketches/QualityHome.jsx";
import ClimateAdaptation from "../components/sketches/ClimateAdaptation.jsx";

/** Fond et encre de la page au repos. */
export const BASE = {
  bg: "#F2EDE3",
  ink: "#1F1B16",
};

/**
 * Les cinq thématiques de Baillance.fr.
 * `bg`   : couleur de fond de la section / du hero au survol
 * `ink`  : couleur du trait de crayon du croquis
 * `text` : couleur du texte posé sur `bg`
 */
export const THEMES = [
  {
    id: "logement-social",
    index: "01",
    label: "Logement social",
    bg: "#A94A2F",
    ink: "#F7E9DA",
    text: "#FBF1E6",
    Sketch: SocialHousing,
    lede: "Habiter dignement ne devrait jamais être un privilège.",
    body: "Le logement social s'invente aujourd'hui loin des standards d'hier : des architectures généreuses et accueillantes, des halls lumineux, des balcons plantés, des espaces communs qui créent du lien. Baillance explore les projets qui réconcilient qualité d'usage, beauté et accessibilité — parce que la ville inclusive commence à la porte d'entrée.",
    caption: "Élévation sur jardin — hall traversant, balcons plantés, toiture partagée.",
  },
  {
    id: "transformation-tertiaire",
    index: "02",
    label: "Transformation tertiaire",
    bg: "#161F3A",
    ink: "#DCD8C8",
    text: "#EDE9DB",
    Sketch: TertiaryTransformation,
    lede: "Des millions de mètres carrés de bureaux attendent une seconde vie.",
    body: "Plutôt que d'étaler la ville, transformons-la. Façades qui s'ouvrent en balcons, plateaux qui deviennent logements traversants, rooftops rendus aux habitants : la mutation du tertiaire obsolète est un gisement immense pour créer de l'habitat sans consommer un mètre carré de terre. Une révolution silencieuse, déjà à l'œuvre.",
    caption: "Un plateau de bureaux mute, travée après travée, en logements habités.",
  },
  {
    id: "urbanisme-et-mixite",
    index: "03",
    label: "Urbanisme et mixité",
    bg: "#9DAC8E",
    ink: "#222E1B",
    text: "#1E2917",
    Sketch: UrbanMix,
    lede: "La ville désirable se joue à hauteur de rue.",
    body: "Rez-de-chaussée animés, commerces, ateliers et logements entremêlés, tramways et vélos à la place du tout-voiture, canopée urbaine contre les îlots de chaleur : la mixité n'est pas un slogan, c'est un art de composer la ville. Baillance raconte les quartiers où l'on habite, travaille et flâne — sans jamais avoir besoin d'en partir.",
    caption: "Perspective de rue — tram, vélos, arcades et terrasses sous la canopée.",
  },
  {
    id: "logement-de-qualite",
    index: "04",
    label: "Logement de qualité",
    bg: "#E3D2B8",
    ink: "#4A3520",
    text: "#3D2C1A",
    Sketch: QualityHome,
    lede: "La qualité d'un logement se mesure les yeux fermés — et fenêtres ouvertes.",
    body: "Lumière naturelle traversante, hauteurs sous plafond retrouvées, acoustique soignée, matériaux pérennes : le logement de qualité n'est pas un luxe, c'est un standard à reconquérir. On n'habite pas des mètres carrés ; on habite l'espace, le calme et la lumière.",
    caption: "Perspective intérieure — la baie, le parquet, le silence.",
  },
  {
    id: "adaptation-climat",
    index: "05",
    label: "Adaptation au changement climatique",
    bg: "#C2CFD8",
    ink: "#22384A",
    text: "#1D3040",
    Sketch: ClimateAdaptation,
    lede: "Le confort d'été est le nouveau chauffage.",
    body: "Logements traversants, brise-soleil, ventilation naturelle, ombrage végétal, inertie des matériaux : face aux étés qui s'intensifient, l'architecture redécouvre des savoir-faire bioclimatiques éprouvés. Adapter l'habitat, c'est garantir des logements vivables — sans climatisation par défaut — pour les décennies à venir.",
    caption: "Coupe bioclimatique — l'air traverse, le soleil d'été reste dehors.",
  },
];
