import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const BackgroundCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    // Scene & Camera setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 300;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    containerRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x3b82f6, 2, 600); // Blue light
    pointLight1.position.set(200, 200, 100);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xa855f7, 2, 600); // Purple light
    pointLight2.position.set(-200, -200, 100);
    scene.add(pointLight2);

    // Floating 3D Geometric Objects (Awwwards Style)
    const objectsGroup = new THREE.Group();

    // 1. Central Wireframe TorusKnot
    const torusKnotGeo = new THREE.TorusKnotGeometry(45, 12, 100, 16);
    const torusKnotMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.2,
    });
    const torusKnot = new THREE.Mesh(torusKnotGeo, torusKnotMat);
    torusKnot.position.set(0, 0, -50);
    objectsGroup.add(torusKnot);

    // 2. Wireframe Icosahedron
    const icoGeo = new THREE.IcosahedronGeometry(30, 1);
    const icoMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    const icoMesh = new THREE.Mesh(icoGeo, icoMat);
    icoMesh.position.set(-220, 120, -100);
    objectsGroup.add(icoMesh);

    // 3. Floating Octahedron
    const octGeo = new THREE.OctahedronGeometry(25, 0);
    const octMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      wireframe: true,
      transparent: true,
      opacity: 0.25,
    });
    const octMesh = new THREE.Mesh(octGeo, octMat);
    octMesh.position.set(240, -140, -80);
    objectsGroup.add(octMesh);

    scene.add(objectsGroup);

    // Glowing Ambient Particles
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(0x3b82f6); // Blue
    const color2 = new THREE.Color(0x8b5cf6); // Violet
    const color3 = new THREE.Color(0x06b6d4); // Cyan

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 900;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 500;

      const randColor = [color1, color2, color3][Math.floor(Math.random() * 3)];
      colors[i * 3] = randColor.r;
      colors[i * 3 + 1] = randColor.g;
      colors[i * 3 + 2] = randColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Cursor tracking with lerp
    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - window.innerWidth / 2) * 0.04;
      targetY = (e.clientY - window.innerHeight / 2) * 0.04;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth cursor lerp
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Rotate geometries
      torusKnot.rotation.x += 0.003;
      torusKnot.rotation.y += 0.005;

      icoMesh.rotation.x += 0.004;
      icoMesh.rotation.z += 0.003;

      octMesh.rotation.y += 0.005;
      octMesh.rotation.x += 0.002;

      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

      // Move camera with mouse lerp
      camera.position.x += (mouseX - camera.position.x) * 0.04;
      camera.position.y += (-mouseY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      torusKnotGeo.dispose();
      torusKnotMat.dispose();
      icoGeo.dispose();
      icoMat.dispose();
      octGeo.dispose();
      octMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70"
      aria-hidden="true"
    />
  );
};
