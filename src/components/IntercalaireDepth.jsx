import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

/**
 * Profondeur discrète entre le Carnet et la feuille intercalaire :
 * deux calques esquissés (contour fin + voile ivoire) suspendus
 * en retrait, avec une parallaxe souris limitée à 1–2 px.
 * Rien de démonstratif — juste l'épaisseur du carnet.
 */
export default function IntercalaireDepth() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.domElement.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(22, 1, 0.1, 60);
    cam.position.set(0, 0, 17);

    /* deux feuilles en retrait, à peine plus larges que l'intercalaire */
    const sheets = [];
    const makeSheet = (z, edge, veil) => {
      const g = new THREE.Group();
      const w = 8.6;
      const h = 11;
      const pts = [
        [-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2],
      ].map((p) => new THREE.Vector3(p[0], p[1], 0));
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0x2a251d, transparent: true, opacity: edge })
      );
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: 0xf4eee0, transparent: true, opacity: veil })
      );
      g.add(plane);
      g.add(line);
      g.position.z = z;
      scene.add(g);
      sheets.push(g);
    };
    makeSheet(-1.3, 0.22, 0.32);
    makeSheet(-2.7, 0.13, 0.2);

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    /* parallaxe : ±0.014 unité monde ≈ 1–2 px à l'écran */
    const par = { x: 0, y: 0 };
    const onMove = (e) => {
      gsap.to(par, {
        x: e.clientX / window.innerWidth - 0.5,
        y: e.clientY / window.innerHeight - 0.5,
        duration: 1.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    };
    window.addEventListener("mousemove", onMove);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      sheets.forEach((s, i) => {
        const k = 0.014 * (i + 1);
        s.position.x = -par.x * k * 2;
        s.position.y = par.y * k * 2;
      });
      renderer.render(scene, cam);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMove);
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      renderer.dispose();
      if (host.contains(renderer.domElement)) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={hostRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
