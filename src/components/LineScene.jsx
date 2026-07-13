import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Scène filaire Three.js pilotée par GSAP.
 *
 * - caméra orthographique en axonométrie, comme une planche d'archi ;
 * - le modèle actif tourne réellement sur lui-même (turntable continu) ;
 * - la souris incline la caméra (vraie parallaxe 3D, amortie) ;
 * - GSAP anime les transitions entre modèles (rotation + « mise en
 *   traits » : les lignes de construction montent avant les traits
 *   forts) et, en option, une rotation liée au scroll (ScrollTrigger).
 *
 * `models` : [{ id, build: (ink) => THREE.Group }]  (construits une fois)
 */
export default function LineScene({
  models,
  activeId,
  interactive = false,
  scrollDrive = false,
  spinSpeed = 0.07,
  spinDirection = 1,
  zoom = 1,
  lookHeight = 0.34,
  className = "",
}) {
  const hostRef = useRef(null);
  const S = useRef({
    entries: {},
    currentId: null,
    mouse: { x: 0, y: 0 },
    scrollRot: 0,
    visible: false,
    revealed: false,
    pendingIntro: null,
  }).current;

  /* ------------------------- init (une fois) ------------------------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return undefined; // pas de WebGL : le fond thématique reste seul
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;";
    renderer.domElement.classList.add("dynamic-shadow");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -400, 400);
    const rig = { az: -Math.PI / 4, el: 0.62, look: 6 };
    S.rig = rig;

    /* construit et normalise chaque modèle : centré, posé au sol,
       mis à l'échelle commune (visée ≈ 30 unités hors-tout) */
    for (const m of models) {
      const inner = m.build();
      const box = new THREE.Box3().setFromObject(inner);
      const size = box.getSize(new THREE.Vector3());
      const c = box.getCenter(new THREE.Vector3());
      const pivot = new THREE.Group();
      inner.position.set(-c.x, -box.min.y, -c.z);
      pivot.add(inner);
      const wrap = new THREE.Group();
      wrap.add(pivot);
      const k = 30 / Math.max(size.x, size.z, size.y * 1.35);
      wrap.scale.setScalar(k);
      wrap.visible = false;
      wrap.userData = {
        spin: (Math.random() - 0.5) * 0.6,
        h: size.y * k,
        el: m.el ?? 0.62,
        pivot,
        mats: inner.userData.mats || [],
      };
      scene.add(wrap);
      S.entries[m.id] = wrap;
    }

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      const halfH = 19 / zoom;
      const halfW = (halfH * w) / h;
      cam.left = -halfW;
      cam.right = halfW;
      cam.top = halfH;
      cam.bottom = -halfH;
      cam.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* boucle : rotation réelle + caméra parallaxe */
    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05);
      if (!S.visible) return;
      const wrap = S.entries[S.currentId];
      if (wrap) {
        wrap.userData.spin += dt * spinSpeed * spinDirection;
        wrap.rotation.y = wrap.userData.spin + S.scrollRot;
        rig.look = wrap.userData.h * lookHeight;
      }
      const az = rig.az + S.mouse.x * 0.17;
      const el = rig.el + S.mouse.y * 0.11;
      cam.position.set(
        Math.cos(el) * Math.sin(az) * 120,
        Math.sin(el) * 120 + rig.look,
        Math.cos(el) * Math.cos(az) * 120
      );
      cam.lookAt(0, rig.look, 0);
      renderer.render(scene, cam);
    };
    loop();

    /* ne rend que lorsque visible ; déclenche l'intro différée */
    const io = new IntersectionObserver(
      ([e]) => {
        S.visible = e.isIntersecting;
        if (e.isIntersecting && S.pendingIntro) {
          const id = S.pendingIntro;
          S.pendingIntro = null;
          S.runIntro(id);
        }
      },
      { threshold: 0.12 }
    );
    io.observe(host);

    /* parallaxe souris amortie par GSAP */
    let onMove = null;
    if (interactive) {
      onMove = (e) => {
        const r = host.getBoundingClientRect();
        gsap.to(S.mouse, {
          x: ((e.clientX - r.left) / r.width - 0.5) * 2,
          y: ((e.clientY - r.top) / r.height - 0.5) * 2,
          duration: 1.1,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      window.addEventListener("mousemove", onMove);
    }

    /* rotation et tracé progressif pilotés par le scroll de la section */
    let st = null;
    if (scrollDrive) {
      const isMobile = window.innerWidth < 1024;
      st = ScrollTrigger.create({
        trigger: host,
        scroller: isMobile ? ".horizontal-scroll-container" : window,
        horizontal: isMobile,
        start: isMobile ? "left right" : "top bottom",
        end: isMobile ? "right left" : "bottom top",
        scrub: 1, // scrubbing plus direct
        onUpdate: (self) => {
          // Rotation qui suit exactement le scroll (180 degrés)
          S.scrollRot = (self.progress - 0.5) * Math.PI * spinDirection;
        },
        onEnter: () => {
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        },
        onEnterBack: () => {
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
        }
      });
    }

    /* --- transitions d'entrée / sortie, partagées avec l'effet actif --- */
    S.runIntro = (id) => {
      const wrap = S.entries[id];
      if (!wrap) return;
      wrap.visible = true;
      const { mats, pivot } = wrap.userData;
      gsap.killTweensOf([pivot.rotation, pivot.scale, ...mats]);
      // la caméra s'incline vers le point de vue propre à la planche
      gsap.to(S.rig, { el: wrap.userData.el, duration: 1.4, ease: "power2.inOut" });
      // « mise en traits » : estompé → moyen → fort, comme un dessin qui monte
      const sorted = [...mats].sort(
        (a, b) => a.userData.baseOpacity - b.userData.baseOpacity
      );
      sorted.forEach((mat, i) => {
        mat.opacity = 0;
        gsap.to(mat, {
          opacity: mat.userData.baseOpacity,
          duration: 0.55,
          delay: 0.08 + i * 0.14,
          ease: "power2.out",
        });
      });
      gsap.fromTo(
        pivot.rotation,
        { y: -0.55 * spinDirection },
        { y: 0, duration: 1.35, ease: "power3.out" }
      );
      gsap.fromTo(
        pivot.scale,
        { x: 0.94, y: 0.94, z: 0.94 },
        { x: 1, y: 1, z: 1, duration: 1.1, ease: "power2.out" }
      );
    };
    S.runOutro = (id) => {
      const wrap = S.entries[id];
      if (!wrap) return;
      const { mats, pivot } = wrap.userData;
      gsap.killTweensOf([pivot.rotation, pivot.scale, ...mats]);
      mats.forEach((mat) => {
        gsap.to(mat, { opacity: 0, duration: 0.3, ease: "power1.in" });
      });
      gsap.to(pivot.rotation, {
        y: 0.3 * spinDirection,
        duration: 0.35,
        ease: "power1.in",
        onComplete: () => {
          wrap.visible = false;
          pivot.rotation.y = 0;
        },
      });
    };
    S.ready = true;
    if (S.queuedActive !== undefined) {
      const q = S.queuedActive;
      S.queuedActive = undefined;
      S.apply(q);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      if (onMove) window.removeEventListener("mousemove", onMove);
      if (st) st.kill();
      for (const wrap of Object.values(S.entries)) {
        for (const child of wrap.userData.pivot.children[0]?.children ?? []) {
          child.geometry?.dispose();
        }
        wrap.userData.mats.forEach((m) => m.dispose());
      }
      renderer.dispose();
      host.contains(renderer.domElement) && host.removeChild(renderer.domElement);
      S.entries = {};
      S.ready = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --------------------- changement de modèle actif --------------------- */
  useEffect(() => {
    S.apply = (id) => {
      const prev = S.currentId;
      if (prev === id) return;
      S.currentId = id;
      if (prev) S.runOutro(prev);
      if (id) {
        if (S.visible) S.runIntro(id);
        else S.pendingIntro = id; // l'intro attend d'entrer dans le viewport
      }
    };
    if (!S.ready) {
      S.queuedActive = activeId;
      return;
    }
    S.apply(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div
      ref={hostRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden="true"
    />
  );
}
