import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07060f, 0.0015);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      4000,
    );
    camera.position.set(0, 0, 380);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("WebGL not available, skipping 3D background.", err);
      return;
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color("#a78bfa"),
      new THREE.Color("#c4b5fd"),
      new THREE.Color("#f0abfc"),
      new THREE.Color("#7c3aed"),
      new THREE.Color("#60a5fa"),
      new THREE.Color("#ffffff"),
    ];
    for (let i = 0; i < COUNT; i++) {
      const r = 240 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const c = palette[Math.floor(Math.random() * palette.length)]!;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const crystalGeo = new THREE.IcosahedronGeometry(90, 1);
    const crystalMat = new THREE.MeshBasicMaterial({
      color: 0xc4b5fd,
      wireframe: true,
      transparent: true,
      opacity: 0.14,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    scene.add(crystal);

    const ringGeoA = new THREE.TorusGeometry(160, 0.5, 8, 140);
    const ringMatA = new THREE.MeshBasicMaterial({
      color: 0xa78bfa,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    const ringA = new THREE.Mesh(ringGeoA, ringMatA);
    ringA.rotation.x = Math.PI / 2.5;
    scene.add(ringA);

    const ringGeoB = new THREE.TorusGeometry(210, 0.4, 8, 140);
    const ringMatB = new THREE.MeshBasicMaterial({
      color: 0xf0abfc,
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
    });
    const ringB = new THREE.Mesh(ringGeoB, ringMatB);
    ringB.rotation.x = -Math.PI / 3;
    scene.add(ringB);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollTarget = 0;
    let scrollProgress = 0;

    const onMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      scrollTarget = Math.min(Math.max(window.scrollY / max, 0), 1);
    };
    onScroll();
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame++;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      scrollProgress += (scrollTarget - scrollProgress) * 0.05;

      camera.position.x = mouse.x * 12;
      camera.position.y = -scrollProgress * 40 - mouse.y * 12;
      camera.position.z = 380 + scrollProgress * 30;
      camera.lookAt(0, 0, 0);

      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0002;

      crystal.rotation.x = frame * 0.0015 + mouse.y * 0.1;
      crystal.rotation.y = frame * 0.002 + mouse.x * 0.1;

      ringA.rotation.z = frame * 0.0012;
      ringB.rotation.z = -frame * 0.0014;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      particleGeo.dispose();
      particleMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      ringGeoA.dispose();
      ringMatA.dispose();
      ringGeoB.dispose();
      ringMatB.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-60"
      aria-hidden="true"
    />
  );
}
