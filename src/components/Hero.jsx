import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BASE, THEMES } from "../data/themes.jsx";
import LineScene from "./LineScene.jsx";
import SheetOverlay from "./SheetOverlay.jsx";

const EASE = [0.32, 0.72, 0, 1];

/* Mise en scène typographique : taille, style et décalage de chaque
   expression pour qu'elles s'entremêlent au centre de l'écran. */
const TYPO = {
  "logement-social": {
    size: "clamp(2.2rem, 6.8vw, 7.8rem)",
    style: { fontWeight: 420, x: "-5%" },
    italic: false,
  },
  "transformation-tertiaire": {
    size: "clamp(1.8rem, 5.3vw, 6.1rem)",
    style: { fontWeight: 330, x: "5.5%" },
    italic: true,
  },
  "urbanisme-et-mixite": {
    size: "clamp(2.1rem, 6.4vw, 7.4rem)",
    style: { fontWeight: 520, x: "-7%" },
    italic: false,
  },
  "logement-de-qualite": {
    size: "clamp(1.9rem, 5.6vw, 6.4rem)",
    style: { fontWeight: 340, x: "6.5%" },
    italic: true,
  },
  "adaptation-climat": {
    size: "clamp(1.15rem, 3.4vw, 3.9rem)",
    style: { fontWeight: 430, x: "-1.5%" },
    italic: false,
  },
};

/* Les cinq maquettes filaires, construites une seule fois par la scène. */
const HERO_MODELS = THEMES.map((t) => ({ id: t.id, build: t.build, el: t.el }));

export default function Hero() {
  const [active, setActive] = useState(null);
  const theme = active ? THEMES.find((t) => t.id === active) : null;

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <motion.section
      className="relative h-screen w-screen overflow-hidden"
      animate={{ backgroundColor: theme ? theme.bg : BASE.bg }}
      transition={{ duration: 0.7, ease: EASE }}
    >
      {/* ---------- header minimaliste ---------- */}
      <motion.header
        className="absolute inset-x-0 top-0 z-30 flex items-baseline justify-between px-6 py-5 sm:px-10"
        animate={{ color: theme ? theme.text : BASE.ink }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <a href="#" className="font-serif text-lg italic tracking-wide sm:text-xl">
          Baillance<span className="opacity-60">.fr</span>
        </a>
        <p className="hidden text-[0.62rem] font-medium uppercase tracking-[0.32em] opacity-60 sm:block">
          Habitat &middot; Urbanisme &middot; Évolution de l'immobilier
        </p>
      </motion.header>

      {/* ---------- maquette filaire 3D (Three.js + GSAP) ---------- */}
      <div className="absolute inset-0 z-0">
        <LineScene
          models={HERO_MODELS}
          activeId={active}
          interactive
          spinSpeed={0.085}
          zoom={1.16}
        />
        {/* habillage de planche : cadre, notes, cartouche */}
        <AnimatePresence>
          {theme && (
            <motion.div
              key={theme.id}
              className="absolute inset-0"
              style={{ color: theme.ink }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <SheetOverlay theme={theme} id="hero" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* léger vignettage papier */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse 120% 90% at 50% 42%, transparent 62%, rgba(20,14,8,0.09))",
        }}
      />

      {/* ---------- les cinq expressions entremêlées ---------- */}
      <nav
        className="relative z-20 flex h-full w-full flex-col items-center justify-center"
        aria-label="Thématiques"
        onMouseLeave={() => setActive(null)}
      >
        {THEMES.map((t) => {
          const typo = TYPO[t.id];
          const isActive = active === t.id;
          const isDimmed = active !== null && !isActive;
          return (
            <motion.button
              key={t.id}
              type="button"
              onMouseEnter={() => setActive(t.id)}
              onFocus={() => setActive(t.id)}
              onClick={() => scrollTo(t.id)}
              className="display-type relative block cursor-pointer whitespace-nowrap uppercase leading-[0.94] outline-none"
              style={{
                fontSize: typo.size,
                fontWeight: typo.style.fontWeight,
                fontStyle: typo.italic ? "italic" : "normal",
                marginTop: "-0.06em",
                translate: `${typo.style.x} 0`,
              }}
              animate={{
                color: theme ? theme.text : BASE.ink,
                opacity: isDimmed ? 0.1 : 1,
                scale: isActive ? 1.025 : 1,
              }}
              transition={{ duration: 0.55, ease: EASE }}
            >
              <motion.sup
                className="absolute -left-[1.9em] top-[0.55em] font-sans text-[0.17em] font-medium not-italic tracking-[0.25em]"
                animate={{ opacity: isDimmed ? 0 : 0.55 }}
                transition={{ duration: 0.4 }}
              >
                {t.index}
              </motion.sup>
              {t.label}
            </motion.button>
          );
        })}
      </nav>

      {/* ---------- pied du hero ---------- */}
      <motion.footer
        className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-6 pb-5 sm:px-10"
        animate={{ color: theme ? theme.text : BASE.ink }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <p className="max-w-[46ch] font-serif text-xs italic leading-relaxed opacity-60 sm:text-sm">
          {theme ? theme.lede : "Cinq regards sur la ville qui vient — survolez, puis entrez."}
        </p>
        <a
          href={`#${THEMES[0].id}`}
          onClick={(e) => {
            e.preventDefault();
            scrollTo(THEMES[0].id);
          }}
          className="flex items-center gap-3 text-[0.62rem] font-medium uppercase tracking-[0.32em] opacity-60 transition-opacity hover:opacity-100"
        >
          Défiler
          <motion.span
            aria-hidden
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm"
          >
            ↓
          </motion.span>
        </a>
      </motion.footer>
    </motion.section>
  );
}
