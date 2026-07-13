import React, { useRef, useState } from "react";
import Hero from "./components/Hero.jsx";
import ThemeSection from "./components/ThemeSection.jsx";
import Intercalaire from "./components/Intercalaire.jsx";
import CarnetWord from "./components/CarnetWord.jsx";
import { BASE, THEMES } from "./data/themes.jsx";

export default function App() {
  const pageRef = useRef(null);
  const [carnetOpen, setCarnetOpen] = useState(false);
  const openCarnet = () => setCarnetOpen(true);

  return (
    <>
      {/* le Carnet lui-même — il recule à peine quand l'intercalaire s'ouvre */}
      <div ref={pageRef}>
        <main>
          <Hero />

          {THEMES.map((theme, i) => (
            <ThemeSection
              key={theme.id}
              theme={theme}
              flip={i % 2 === 1}
              onOpenCarnet={openCarnet}
            />
          ))}

          <footer
            className="flex flex-col items-center gap-6 px-6 py-20 text-center"
            style={{ backgroundColor: BASE.ink, color: BASE.bg }}
          >
            <p className="font-serif text-3xl italic sm:text-4xl">
              Baillance<span className="opacity-60">.fr</span>
            </p>
            <p className="max-w-md font-serif text-sm italic leading-relaxed opacity-70">
              Habiter, transformer, adapter — notes dessinées sur l'habitat, l'urbanisme et
              l'évolution de l'immobilier.
            </p>
            <p className="max-w-md font-serif text-sm italic leading-relaxed opacity-70">
              Les <CarnetWord onOpen={openCarnet}>Carnets</CarnetWord> paraissent par
              correspondance électronique.
            </p>
            <p className="text-[0.62rem] font-medium uppercase tracking-[0.32em] opacity-50">
              © {new Date().getFullYear()} Baillance — maquette d'intention
            </p>
          </footer>
        </main>
      </div>

      <Intercalaire open={carnetOpen} onClose={() => setCarnetOpen(false)} pageRef={pageRef} />
    </>
  );
}
