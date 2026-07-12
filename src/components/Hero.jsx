import React, { useCallback, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { BASE, THEMES } from "../data/themes.jsx";

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

export default function Hero() {
  const [active, setActive] = useState(null);
  const theme = active ? THEMES.find((t) => t.id === active) : null;
  const sectionRef = useRef(null);

  /* Parallaxe : la position de la souris incline très légèrement la
     planche de croquis, comme si on la regardait en volume. */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 42, damping: 16, mass: 0.9 });
  const sy = useSpring(my, { stiffness: 42, damping: 16, mass: 0.9 });
  const px = useTransform(sx, (v) => v * 22);
  const py = useTransform(sy, (v) => v * 14);
  const rx = useTransform(sy, (v) => v * -2.4);
  const ry = useTransform(sx, (v) => v * 3.2);

  const onMouseMove = useCallback(
    (e) => {
      const r = sectionRef.current?.getBoundingClientRect();
      if (!r) return;
      mx.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      my.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    },
    [mx, my]
  );

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <motion.section
      ref={sectionRef}
      onMouseMove={onMouseMove}
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

      {/* ---------- croquis d'arrière-plan ---------- */}
      <div className="absolute inset-0 z-0" style={{ perspective: 1100 }}>
        <AnimatePresence>
          {theme && (
            <motion.div
              key={theme.id}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.045 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.65, ease: EASE }}
              style={{ color: theme.ink }}
            >
              {/* couche parallaxe pilotée par la souris */}
              <motion.div
                className="h-full w-full"
                style={{ x: px, y: py, rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
              >
                {/* dérive continue, très lente : la planche “respire” */}
                <motion.div
                  className="h-full w-full p-6 sm:p-10"
                  animate={{ rotate: [-0.7, 0.7], y: [-7, 7], scale: [1, 1.018] }}
                  transition={{
                    duration: 16,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                  }}
                >
                  <theme.Sketch id={`hero-${theme.id}`} />
                </motion.div>
              </motion.div>
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
