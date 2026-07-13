import React, { useRef, useState, useEffect } from "react";
import Hero from "./components/Hero.jsx";
import ThemeSection from "./components/ThemeSection.jsx";
import Intercalaire from "./components/Intercalaire.jsx";
import CarnetWord from "./components/CarnetWord.jsx";
import { BASE, THEMES } from "./data/themes.jsx";

export default function App() {
  const pageRef = useRef(null);
  const [carnetOpen, setCarnetOpen] = useState(false);
  const openCarnet = () => setCarnetOpen(true);

  // Suivi global de la souris pour la lumière et l'ombre dynamique
  useEffect(() => {
    const handlePointerMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty("--mouse-x", x);
      document.documentElement.style.setProperty("--mouse-y", y);
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

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
            className="flex flex-col items-center gap-6 px-6 py-10 text-center"
            style={{ backgroundColor: BASE.ink, color: BASE.bg }}
          >
            <p className="font-serif text-sm italic leading-relaxed opacity-70 sm:whitespace-nowrap">
              Chaque <CarnetWord onOpen={openCarnet}>Carnet</CarnetWord> prolonge une recherche menée et éditée par Julien Houssin.
            </p>
          </footer>
        </main>
      </div>

      <Intercalaire open={carnetOpen} onClose={() => setCarnetOpen(false)} pageRef={pageRef} />
    </>
  );
}
