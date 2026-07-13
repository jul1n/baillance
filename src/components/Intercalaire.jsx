import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import IntercalaireDepth from "./IntercalaireDepth.jsx";

/* Préférences & capacités, évaluées à l'ouverture. */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canAfford3D = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine)").matches &&
  window.innerWidth >= 768 &&
  (navigator.hardwareConcurrency ?? 8) >= 4 &&
  !prefersReducedMotion();

/**
 * L'intercalaire — une feuille de calque insérée dans le Carnet.
 * Ouverture ≈ 1,25 s : le Carnet recule à peine et perd un peu de
 * contraste, la feuille monte de 36 px (rotation X 2° → 0), le filet
 * périphérique se dessine, puis titre, texte, champ et actions
 * apparaissent en séquence. Fermeture comme une page que l'on tourne.
 */
export default function Intercalaire({ open, onClose, pageRef }) {
  const [mounted, setMounted] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const closingRef = useRef(false);
  const lastFocusRef = useRef(null);
  const reduced = useRef(false);
  const with3D = useRef(false);

  /* ------------------------------ ouverture ------------------------------ */
  useEffect(() => {
    if (open) {
      reduced.current = prefersReducedMotion();
      with3D.current = canAfford3D();
      lastFocusRef.current = document.activeElement;
      closingRef.current = false;
      setSent(false);
      setInvalid(false);
      setErrorMsg(null);
      setLoading(false);
      setEmail("");
      setMounted(true);
    }
  }, [open]);

  useLayoutEffect(() => {
    if (!mounted) return undefined;
    const root = rootRef.current;
    const sheet = sheetRef.current;
    const page = pageRef?.current;
    document.body.style.overflow = "hidden";
    sheet.focus({ preventScroll: true });

    const ctx = gsap.context(() => {
      if (reduced.current) {
        gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" });
        gsap.set(".ic-seq, .ic-marks", { opacity: 1, y: 0 });
        gsap.set(".ic-frame", { strokeDashoffset: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      /* le Carnet recule très légèrement et perd un peu de contraste */
      if (page) {
        gsap.set(page, {
          transformOrigin: `50% ${window.scrollY + window.innerHeight / 2}px`,
        });
        tl.to(page, { scale: 0.986, filter: "contrast(0.95) brightness(0.99)", duration: 0.9 }, 0);
      }
      tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
      /* la feuille arrive du bas, rotation X 2° → 0 */
      tl.fromTo(
        sheet,
        { y: 36, opacity: 0, rotationX: 2, transformPerspective: 1200 },
        { y: 0, opacity: 1, rotationX: 0, duration: 0.85 },
        0.05
      );
      /* le filet périphérique se dessine */
      tl.fromTo(
        ".ic-frame",
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 0.75, ease: "power2.out" },
        0.3
      );
      tl.fromTo(".ic-marks", { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" }, 0.75);
      /* apparition séquencée du contenu */
      tl.fromTo(
        ".ic-seq",
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.09, ease: "power2.out" },
        0.42
      );
    }, root);

    const onMove = (e) => {
      if (reduced.current || !with3D.current) return;
      const rect = sheet.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const normX = x / (rect.width / 2);
      const normY = y / (rect.height / 2);

      gsap.to(sheet, {
        rotationY: normX * 5,
        rotationX: -normY * 5,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.4,
        overwrite: "auto",
      });
    };

    const onLeave = () => {
      if (reduced.current || !with3D.current) return;
      gsap.to(sheet, {
        rotationY: 0,
        rotationX: 0,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.6,
        overwrite: "auto",
      });
    };

    window.addEventListener("mousemove", onMove);
    sheet.addEventListener("mouseleave", onLeave);

    return () => {
      ctx.revert();
      document.body.style.overflow = "";
      if (page) gsap.set(page, { clearProps: "all" });
      window.removeEventListener("mousemove", onMove);
      sheet.removeEventListener("mouseleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* ------------------------------ fermeture ------------------------------ */
  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = rootRef.current;
    const sheet = sheetRef.current;
    const page = pageRef?.current;
    const finish = () => {
      setMounted(false);
      onClose?.();
      lastFocusRef.current?.focus?.();
    };
    if (reduced.current) {
      gsap.to(root, { opacity: 0, duration: 0.2, ease: "power1.in", onComplete: finish });
      return;
    }
    const tl = gsap.timeline({ onComplete: finish });
    /* une page que l'on tourne : glissement latéral + fondu */
    tl.to(sheet, {
      x: 46,
      rotationY: -3,
      transformPerspective: 1400,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
    }, 0);
    tl.to(root, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0.15);
    if (page) tl.to(page, { scale: 1, filter: "none", duration: 0.6, ease: "power2.out" }, 0.05);
  };

  /* Échap ferme, où que soit le focus (il peut retomber sur <body>
     quand le formulaire laisse place à la confirmation) */
  useEffect(() => {
    if (!mounted) return undefined;
    const onDocKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener("keydown", onDocKey, true);
    return () => document.removeEventListener("keydown", onDocKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  /* après l'enregistrement, le champ disparaît : on repose le focus */
  useEffect(() => {
    if (sent) sheetRef.current?.focus({ preventScroll: true });
  }, [sent]);

  /* clavier : Tab reste dans la feuille */
  const onKeyDown = (e) => {
    if (e.key === "Tab") {
      const items = sheetRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled])'
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setLoading(true);
    setErrorMsg(null);

    try {
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL || "/api/subscribe";
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), source: "Carnets Baillance" }),
        });
        if (!response.ok) throw new Error("Erreur serveur");
      } else {
        // En développement, simuler une attente
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      setSent(true);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement", err);
      setErrorMsg("Une erreur est survenue, veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ic-title"
      onKeyDown={onKeyDown}
    >
      {/* voile ivoire plus prononcé pour un meilleur contraste */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(228, 222, 208, 0.88)" }}
        onMouseDown={close}
      />

      {/* profondeur three.js, seulement si la machine peut se le permettre */}
      {with3D.current && <IntercalaireDepth />}

      {/* ------------------------- la feuille ------------------------- */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-y-auto p-4 sm:p-8">
        <div
          ref={sheetRef}
          tabIndex={-1}
          className="paper-grain pointer-events-auto relative my-auto w-full max-w-[41rem] px-7 py-10 outline-none sm:px-14 sm:py-14"
          style={{
            backgroundColor: "#FCFAF7",
            color: "#1F1B16",
            boxShadow: "0 1px 0 rgba(31,27,22,0.08), 0 18px 50px -30px rgba(31,27,22,0.35)",
          }}
        >
          {/* filet périphérique, tracé progressivement */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
            fill="none"
          >
            <rect
              className="ic-frame"
              stroke="currentColor" strokeWidth="1" strokeOpacity="0.75"
              pathLength="1" strokeDasharray="1"
              style={{ x: 10, y: 10, width: "calc(100% - 20px)", height: "calc(100% - 20px)" }}
            />
            <rect
              className="ic-frame"
              stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.45"
              pathLength="1" strokeDasharray="1"
              style={{ x: 15, y: 15, width: "calc(100% - 30px)", height: "calc(100% - 30px)" }}
            />
          </svg>

          {/* repères de cotation : croix d'angle + ticks de mi-feuille */}
          <div className="ic-marks pointer-events-none absolute inset-0" aria-hidden="true">
            {[
              ["left-[3px] top-[9.5px]", "left-[9.5px] top-[3px]"],
              ["right-[3px] top-[9.5px]", "right-[9.5px] top-[3px]"],
              ["left-[3px] bottom-[9.5px]", "left-[9.5px] bottom-[3px]"],
              ["right-[3px] bottom-[9.5px]", "right-[9.5px] bottom-[3px]"],
            ].map(([hz, vt], i) => (
              <React.Fragment key={i}>
                <span className={`absolute ${hz} h-px w-[14px] bg-current opacity-65`} />
                <span className={`absolute ${vt} h-[14px] w-px bg-current opacity-65`} />
              </React.Fragment>
            ))}
            <span className="absolute left-1/2 top-[4px] h-[11px] w-px -translate-x-1/2 bg-current opacity-60" />
            <span className="absolute bottom-[4px] left-1/2 h-[11px] w-px -translate-x-1/2 bg-current opacity-60" />
            <span className="absolute left-[4px] top-1/2 h-px w-[11px] -translate-y-1/2 bg-current opacity-60" />
            <span className="absolute right-[4px] top-1/2 h-px w-[11px] -translate-y-1/2 bg-current opacity-60" />
          </div>

          {/* fermer, en annotation discrète */}
          <button
            type="button"
            onClick={close}
            className="ic-seq ic-focus absolute right-5 top-4 font-sans text-[0.6rem] font-medium uppercase tracking-[0.28em] opacity-75 transition-opacity hover:opacity-100"
            aria-label="Fermer la lettre d'information"
          >
            fermer ✕
          </button>

          {/* en-tête technique */}
          <header className="ic-seq">
            <p className="font-sans text-[0.6rem] font-medium uppercase tracking-[0.3em] opacity-70">
              Intercalaire — correspondance
            </p>
          </header>

          <div className="ic-seq mt-5 h-px w-14 bg-current opacity-50" aria-hidden="true" />

          {/* titre */}
          <h2
            id="ic-title"
            className="ic-seq display-type mt-6 text-3xl italic leading-tight sm:text-4xl"
            style={{ fontWeight: 380 }}
          >
            Les Carnets Baillance
          </h2>

          {/* texte */}
          <p className="ic-seq mt-5 max-w-[46ch] font-serif text-[0.98rem] leading-relaxed opacity-95 sm:text-base">
            paraissent sous la forme d'une correspondance
            électronique. Chaque nouveau numéro est adressé dès sa publication à
            celles et ceux qui souhaitent en être destinataires.
          </p>

          {/* champ + actions / confirmation */}
          <div className="mt-8 min-h-[7.5rem]" aria-live="polite">
            {sent ? (
              <p className="font-serif text-base italic leading-relaxed opacity-95">
                Adresse enregistrée. Le prochain Carnet vous sera adressé dès sa
                publication.
              </p>
            ) : (
              <form onSubmit={submit} noValidate>
                <label
                  htmlFor="ic-email"
                  className="sr-only"
                >
                  Adresse de courriel
                </label>
                <input
                  id="ic-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                     setEmail(e.target.value);
                     if (invalid) setInvalid(false);
                  }}
                  aria-invalid={invalid || undefined}
                  aria-describedby={invalid ? "ic-email-err" : undefined}
                  placeholder="Renseignez ici votre adresse de courriel"
                  className="ic-seq ic-input mt-2 w-full max-w-[26rem] bg-transparent pb-2 font-serif text-lg italic placeholder:not-italic placeholder:opacity-75"
                />
                {invalid && (
                  <p id="ic-email-err" className="mt-2 font-serif text-sm italic opacity-85">
                    Cette adresse semble incomplète — vérifiez-la, puis reprenez.
                  </p>
                )}
                {errorMsg && (
                  <p className="mt-2 font-serif text-sm italic opacity-85 text-red-800">
                    {errorMsg}
                  </p>
                )}
                <div className="ic-seq mt-7">
                  <button
                    type="submit"
                    disabled={loading}
                    className="ic-focus border border-current bg-transparent px-6 py-2.5 font-sans text-[0.66rem] font-medium uppercase tracking-[0.28em] transition-colors hover:bg-[#1F1B16] hover:text-[#F8F4EB] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Enregistrement..." : "Recevoir les prochains Carnets"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* cartouche éditorial */}
          <footer className="ic-seq mt-10 flex items-end justify-between border-t border-current/25 pt-3">
            <p className="font-sans text-[0.56rem] font-medium uppercase tracking-[0.26em] opacity-70">
              Carnets Baillance
            </p>
            <p className="font-serif text-[0.68rem] italic opacity-70">f. C/1</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
