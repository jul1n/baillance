import React from "react";
import { motion } from "framer-motion";

const EASE = [0.32, 0.72, 0, 1];

/**
 * Section de contenu d'une thématique : croquis animé d'un côté,
 * texte éditorial de l'autre. Les côtés s'inversent une section
 * sur deux.
 */
export default function ThemeSection({ theme, flip = false }) {
  const { Sketch } = theme;

  return (
    <section
      id={theme.id}
      className="relative grid min-h-screen w-full overflow-hidden lg:grid-cols-2"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* ---------- côté croquis ---------- */}
      <div
        className={`relative min-h-[52vh] overflow-hidden lg:min-h-screen ${
          flip ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <motion.div
          className="absolute inset-0"
          style={{ color: theme.ink }}
          initial={{ opacity: 0, scale: 1.06 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {/* la planche garde sa lente respiration 3D */}
          <motion.div
            className="h-[110%] w-[110%] -translate-x-[5%] -translate-y-[5%]"
            animate={{ rotate: [-1.1, 1.1], y: [-9, 9], scale: [1, 1.02] }}
            transition={{ duration: 18, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          >
            <Sketch id={`sec-${theme.id}`} />
          </motion.div>
        </motion.div>
        {/* légende de planche */}
        <motion.p
          className="absolute bottom-5 left-6 z-10 max-w-[38ch] font-serif text-xs italic leading-relaxed opacity-70 sm:left-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 0.7, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
        >
          {theme.caption}
        </motion.p>
      </div>

      {/* ---------- côté texte ---------- */}
      <div
        className={`relative flex items-center px-7 py-16 sm:px-14 lg:px-20 xl:px-24 ${
          flip ? "lg:order-1" : "lg:order-2"
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, ease: EASE }}
          className="max-w-xl"
        >
          <div className="mb-8 flex items-center gap-4">
            <span className="font-sans text-xs font-medium tracking-[0.3em] opacity-60">
              {theme.index}
            </span>
            <span className="h-px w-16 bg-current opacity-40" aria-hidden />
            <span className="font-sans text-[0.62rem] font-medium uppercase tracking-[0.32em] opacity-60">
              Carnet Baillance
            </span>
          </div>

          <h2 className="display-type mb-8 text-balance text-4xl uppercase leading-[1.02] sm:text-5xl xl:text-6xl">
            {theme.label}
          </h2>

          <p className="mb-6 font-serif text-xl italic leading-snug opacity-90 sm:text-2xl">
            {theme.lede}
          </p>

          <p className="font-serif text-base leading-relaxed opacity-80 sm:text-lg">
            {theme.body}
          </p>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-10 inline-flex items-center gap-3 border-b border-current pb-1 text-[0.66rem] font-medium uppercase tracking-[0.3em] opacity-70 transition-opacity hover:opacity-100"
          >
            Revenir aux thématiques <span aria-hidden>↑</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
