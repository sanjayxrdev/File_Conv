import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';
import {
  Scan,
  FileText,
  Table,
  Video,
  Sparkle,
  Lightning,
  ArrowsClockwise,
  Cube,
  Eye,
  Camera,
  Stack,
  Flame
} from '@phosphor-icons/react';

type CameraAngle = 'isometric' | 'front' | 'top' | 'exploded';
type ActiveEffect = 'laser' | 'flip' | 'vortex' | 'explode';

export const Hero3DCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const [activeAngle, setActiveAngle] = useState<CameraAngle>('isometric');
  const [activeEffect, setActiveEffect] = useState<ActiveEffect>('laser');
  const [isHovered, setIsHovered] = useState(false);

  const stateRef = useRef<{
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    mainGroup: THREE.Group;
    bookGroup: THREE.Group;
    pages: THREE.Group[];
    laserGroup: THREE.Group;
    laserMesh: THREE.Mesh;
    laserGridMesh: THREE.LineSegments;
    orbitPills: Array<{
      group: THREE.Group;
      angle: number;
      radius: number;
      speed: number;
      yOffset: number;
      ext: string;
      color: number;
      beamLine: THREE.Line;
      beamGeo: THREE.BufferGeometry;
    }>;
    particles: THREE.Points;
    targetCamPos: THREE.Vector3;
    targetCamLook: THREE.Vector3;
    activeAngle: CameraAngle;
    activeEffect: ActiveEffect;
    reqId: number;
  } | null>(null);

  // Sync state changes to animation loop
  useEffect(() => {
    if (!stateRef.current) return;
    stateRef.current.activeAngle = activeAngle;
    stateRef.current.activeEffect = activeEffect;

    // Update target camera position based on angle
    if (activeAngle === 'isometric') {
      stateRef.current.targetCamPos.set(6, 4, 11);
    } else if (activeAngle === 'front') {
      stateRef.current.targetCamPos.set(0, 0, 11);
    } else if (activeAngle === 'top') {
      stateRef.current.targetCamPos.set(0, 10, 5);
    } else if (activeAngle === 'exploded') {
      stateRef.current.targetCamPos.set(7, 3, 9);
    }
  }, [activeAngle, activeEffect]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 560;
    const height = container.clientHeight || 460;

    // 1. Scene & Lighting
    const scene = new THREE.Scene();

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(6, 4, 11);

    // 3. Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 15, 10);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-10, -5, -10);
    scene.add(dirLight2);

    const isDark = theme === 'dark';

    // Theme Color Palette
    const surfaceColor = isDark ? 0x111218 : 0xFFFFFF;
    const borderColor = isDark ? 0xF4F4F5 : 0x111111;
    const subBorderColor = isDark ? 0x27272A : 0xE2E8F0;
    const purpleAccent = isDark ? 0xC084FC : 0x7E22CE;
    const emeraldAccent = isDark ? 0x34D399 : 0x10B981;
    const blueAccent = isDark ? 0x60A5FA : 0x2563EB;
    const amberAccent = isDark ? 0xFBBF24 : 0xD97706;
    const redAccent = isDark ? 0xF87171 : 0xEF4444;

    // 4. Main Transform Pivot Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 5. 3D Bevelled Rounded Document Book / Multi-Page System
    const createRoundedShape = (w: number, h: number, r: number) => {
      const s = new THREE.Shape();
      const x = -w / 2;
      const y = -h / 2;
      s.moveTo(x + r, y);
      s.lineTo(x + w - r, y);
      s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r);
      s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h);
      s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r);
      s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };

    const bookGroup = new THREE.Group();
    mainGroup.add(bookGroup);

    const pageWidth = 3.4;
    const pageHeight = 4.6;
    const pageShape = createRoundedShape(pageWidth, pageHeight, 0.2);

    const extrudeSettings = {
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    };

    const pageGeo = new THREE.ExtrudeGeometry(pageShape, extrudeSettings);

    const pages: THREE.Group[] = [];
    const pageCount = 4;

    for (let p = 0; p < pageCount; p++) {
      const pagePivot = new THREE.Group();
      // Set pivot on the spine (left edge)
      pagePivot.position.set(-pageWidth / 2, 0, (p - pageCount / 2) * 0.18);

      const pageMat = new THREE.MeshStandardMaterial({
        color: surfaceColor,
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: p === pageCount - 1 ? 0.98 : 0.85,
      });

      const pageMesh = new THREE.Mesh(pageGeo, pageMat);
      pageMesh.position.set(pageWidth / 2, 0, 0);

      // Solid crisp wireframe outline
      const edgeGeo = new THREE.EdgesGeometry(pageGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: p === pageCount - 1 ? borderColor : subBorderColor,
        linewidth: 2,
      });
      const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
      pageMesh.add(edgeLines);

      // Add realistic procedural content to the top page
      if (p === pageCount - 1) {
        // Heading Block
        const hGeo = new THREE.PlaneGeometry(2.0, 0.2);
        const hMat = new THREE.MeshBasicMaterial({ color: purpleAccent });
        const hMesh = new THREE.Mesh(hGeo, hMat);
        hMesh.position.set(-0.35, 1.5, 0.1);
        pageMesh.add(hMesh);

        // Body Text Lines
        for (let l = 0; l < 4; l++) {
          const lGeo = new THREE.PlaneGeometry(2.4 - (l === 3 ? 0.8 : 0), 0.08);
          const lMat = new THREE.MeshBasicMaterial({ color: subBorderColor });
          const lMesh = new THREE.Mesh(lGeo, lMat);
          lMesh.position.set(-0.15 - (l === 3 ? 0.4 : 0), 1.1 - l * 0.35, 0.1);
          pageMesh.add(lMesh);
        }

        // 3D Tabular Matrix Grid
        const tableW = 2.6;
        const tableH = 1.6;
        const cols = 3;
        const rows = 3;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const cW = tableW / cols - 0.06;
            const cH = tableH / rows - 0.06;
            const cGeo = new THREE.PlaneGeometry(cW, cH);
            const cEdges = new THREE.EdgesGeometry(cGeo);
            const cMat = new THREE.LineBasicMaterial({
              color: r === 0 ? emeraldAccent : subBorderColor,
            });
            const cMesh = new THREE.LineSegments(cEdges, cMat);
            cMesh.position.set(
              (c - 1) * (tableW / cols),
              -0.6 - r * (tableH / rows),
              0.1
            );
            pageMesh.add(cMesh);
          }
        }
      }

      pagePivot.add(pageMesh);
      bookGroup.add(pagePivot);
      pages.push(pagePivot);
    }

    // 6. Docling AI Holographic Scanning Laser Grid
    const laserGroup = new THREE.Group();
    mainGroup.add(laserGroup);

    // Horizontal Scanning Beam
    const laserBeamGeo = new THREE.BoxGeometry(4.4, 0.06, 0.8);
    const laserBeamMat = new THREE.MeshBasicMaterial({
      color: purpleAccent,
      transparent: true,
      opacity: 0.9,
    });
    const laserMesh = new THREE.Mesh(laserBeamGeo, laserBeamMat);
    laserGroup.add(laserMesh);

    // Glowing Laser Wireframe Box Projection
    const laserGridGeo = new THREE.BoxGeometry(4.2, 0.6, 0.8);
    const laserGridEdges = new THREE.EdgesGeometry(laserGridGeo);
    const laserGridMat = new THREE.LineBasicMaterial({
      color: purpleAccent,
      transparent: true,
      opacity: 0.4,
    });
    const laserGridMesh = new THREE.LineSegments(laserGridEdges, laserGridMat);
    laserGroup.add(laserGridMesh);

    // 7. Orbiting 3D Format Node Capsules
    const formatDefs = [
      { ext: 'PDF', color: redAccent, radius: 4.8, speed: 0.012, yOffset: 0.6, angle: 0 },
      { ext: 'DOCX', color: blueAccent, radius: 4.5, speed: 0.015, yOffset: -0.8, angle: (Math.PI * 2) / 5 },
      { ext: 'OCR', color: purpleAccent, radius: 5.2, speed: 0.009, yOffset: 1.4, angle: (Math.PI * 4) / 5 },
      { ext: 'CSV', color: emeraldAccent, radius: 4.9, speed: 0.013, yOffset: -1.2, angle: (Math.PI * 6) / 5 },
      { ext: 'MP4', color: amberAccent, radius: 4.3, speed: 0.017, yOffset: 0.0, angle: (Math.PI * 8) / 5 },
    ];

    // Texture Sprite Generator
    const createPillSprite = (ext: string, colorHex: number) => {
      const cv = document.createElement('canvas');
      cv.width = 160;
      cv.height = 80;
      const cx = cv.getContext('2d');
      if (cx) {
        cx.fillStyle = isDark ? '#14151E' : '#FFFFFF';
        cx.strokeStyle = isDark ? '#323444' : '#CBD5E1';
        cx.lineWidth = 4;
        cx.beginPath();
        cx.roundRect(8, 8, 144, 64, 16);
        cx.fill();
        cx.stroke();

        cx.font = 'bold 32px monospace';
        cx.fillStyle = isDark ? '#F4F4F5' : '#111111';
        cx.textAlign = 'center';
        cx.textBaseline = 'middle';
        cx.fillText(`.${ext}`, 80, 40);
      }
      const tex = new THREE.CanvasTexture(cv);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(1.5, 0.75, 1);
      return sprite;
    };

    const orbitPills: any[] = [];

    formatDefs.forEach((fmt) => {
      const pillGroup = new THREE.Group();

      // Inner 3D Sphere Node
      const sphereGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: fmt.color,
        roughness: 0.2,
        metalness: 0.8,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      pillGroup.add(sphere);

      // Sprite Label
      const sprite = createPillSprite(fmt.ext, fmt.color);
      pillGroup.add(sprite);

      // 3D Connecting Laser Ray
      const beamGeo = new THREE.BufferGeometry();
      beamGeo.setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)]);
      const beamMat = new THREE.LineBasicMaterial({
        color: fmt.color,
        transparent: true,
        opacity: 0.45,
      });
      const beamLine = new THREE.Line(beamGeo, beamMat);
      mainGroup.add(beamLine);

      mainGroup.add(pillGroup);

      orbitPills.push({
        group: pillGroup,
        angle: fmt.angle,
        radius: fmt.radius,
        speed: fmt.speed,
        yOffset: fmt.yOffset,
        ext: fmt.ext,
        color: fmt.color,
        beamLine,
        beamGeo,
      });
    });

    // 8. Concentric 3D Data Particle Cloud
    const particleCount = 64;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const rad = 3.2 + Math.random() * 4.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = rad * Math.sin(ph) * Math.cos(th);
      positions[i * 3 + 1] = rad * Math.sin(ph) * Math.sin(th);
      positions[i * 3 + 2] = rad * Math.cos(ph);
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: purpleAccent,
      size: 0.12,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    mainGroup.add(particles);

    // 9. Interactive Drag & Momentum Physics
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let rotVelX = 0;
    let rotVelY = 0;
    let targetRotY = 0.2;
    let targetRotX = 0.1;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        rotVelY = dx * 0.006;
        rotVelX = dy * 0.006;
        prevX = e.clientX;
        prevY = e.clientY;
      } else {
        const rect = container.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        targetRotY = nx * 0.4 + 0.2;
        targetRotX = -ny * 0.3 + 0.1;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 10. Animation Loop
    let laserDir = 1;
    const clock = new THREE.Clock();
    const targetCamPos = new THREE.Vector3(6, 4, 11);
    const targetCamLook = new THREE.Vector3(0, 0, 0);

    const animate = () => {
      const reqId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const currentEffect = stateRef.current?.activeEffect || 'laser';

      // Camera Smooth Interpolation
      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(targetCamLook);

      // Drag / Hover Rotation
      if (isDragging) {
        mainGroup.rotation.y += rotVelY;
        mainGroup.rotation.x += rotVelX;
      } else {
        mainGroup.rotation.y += (targetRotY - mainGroup.rotation.y) * 0.05;
        mainGroup.rotation.x += (targetRotX - mainGroup.rotation.x) * 0.05;
      }
      rotVelX *= 0.92;
      rotVelY *= 0.92;

      // Effect 1: Docling AI Laser Sweep
      if (currentEffect === 'laser' || currentEffect === 'vortex') {
        laserGroup.visible = true;
        laserGroup.position.y += 0.04 * laserDir;
        if (laserGroup.position.y > 2.2) laserDir = -1;
        if (laserGroup.position.y < -2.2) laserDir = 1;
      } else {
        laserGroup.visible = false;
      }

      // Effect 2: 3D Page Flip Physics
      pages.forEach((page, idx) => {
        let targetAngle = 0;
        let targetZ = (idx - pageCount / 2) * 0.18;

        if (currentEffect === 'flip') {
          // Flip pages smoothly one after another
          const flipPhase = (elapsed * 1.5 + idx * 0.8) % (Math.PI * 2);
          targetAngle = Math.sin(flipPhase) > 0 ? -Math.sin(flipPhase) * 1.4 : 0;
        } else if (currentEffect === 'explode') {
          targetZ = (idx - pageCount / 2) * 1.4;
          targetAngle = (idx - pageCount / 2) * 0.15;
        }

        page.rotation.y += (targetAngle - page.rotation.y) * 0.08;
        page.position.z += (targetZ - page.position.z) * 0.08;
      });

      // Effect 3: Orbiting Format Capsules & Live Laser Rays
      const speedMult = currentEffect === 'vortex' ? 3.0 : 1.0;
      orbitPills.forEach((pill) => {
        pill.angle += pill.speed * speedMult;
        const px = Math.cos(pill.angle) * pill.radius;
        const pz = Math.sin(pill.angle) * pill.radius;
        const py = pill.yOffset + Math.sin(elapsed * 2 + pill.angle) * 0.3;

        pill.group.position.set(px, py, pz);
        pill.group.quaternion.copy(camera.quaternion);

        // Update Laser Beam to Document Center
        pill.beamGeo.setFromPoints([
          new THREE.Vector3(px, py, pz),
          new THREE.Vector3(0, Math.sin(elapsed * 2) * 0.1, 0),
        ]);
      });

      // Ambient Particle Motion
      particles.rotation.y = elapsed * 0.06 * speedMult;
      particles.rotation.x = Math.sin(elapsed * 0.04) * 0.1;

      renderer.render(scene, camera);
    };

    const reqId = requestAnimationFrame(animate);

    stateRef.current = {
      scene,
      renderer,
      camera,
      mainGroup,
      bookGroup,
      pages,
      laserGroup,
      laserMesh,
      laserGridMesh,
      orbitPills,
      particles,
      targetCamPos,
      targetCamLook,
      activeAngle,
      activeEffect,
      reqId,
    };

    const handleResize = () => {
      if (!containerRef.current || !stateRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      stateRef.current.camera.aspect = w / h;
      stateRef.current.camera.updateProjectionMatrix();
      stateRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-full h-full min-h-[420px] sm:min-h-[480px] relative flex flex-col items-center justify-center select-none"
    >
      {/* 3D WebGL Canvas Surface */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[360px] sm:min-h-[420px] cursor-grab active:cursor-grabbing relative"
        title="Click and drag to spin 3D engine in 360°"
      />

      {/* Floating 3D Control Center Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-card-lg bg-surface-card border border-surface-border shadow-sm text-xs font-mono">
        {/* Effect Selector */}
        <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-card border border-surface-border">
          <button
            onClick={() => setActiveEffect('laser')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all text-[11px] font-semibold ${
              activeEffect === 'laser'
                ? 'bg-ink-primary text-surface-canvas shadow-xs'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
            title="Docling AI Laser Scanner"
          >
            <Scan className="w-3.5 h-3.5" weight="bold" />
            <span>Docling Scan</span>
          </button>

          <button
            onClick={() => setActiveEffect('flip')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all text-[11px] font-semibold ${
              activeEffect === 'flip'
                ? 'bg-ink-primary text-surface-canvas shadow-xs'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
            title="3D Page Flip Physics"
          >
            <Stack className="w-3.5 h-3.5" weight="bold" />
            <span>3D Flip</span>
          </button>

          <button
            onClick={() => setActiveEffect('explode')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all text-[11px] font-semibold ${
              activeEffect === 'explode'
                ? 'bg-ink-primary text-surface-canvas shadow-xs'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
            title="Explode 3D Stack"
          >
            <Cube className="w-3.5 h-3.5" weight="bold" />
            <span>Explode</span>
          </button>

          <button
            onClick={() => setActiveEffect('vortex')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-all text-[11px] font-semibold ${
              activeEffect === 'vortex'
                ? 'bg-ink-primary text-surface-canvas shadow-xs'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
            title="Vortex High-Speed Processing"
          >
            <Flame className="w-3.5 h-3.5" weight="bold" />
            <span>Turbo</span>
          </button>
        </div>

        {/* Camera Angle Selector */}
        <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-card border border-surface-border">
          <button
            onClick={() => setActiveAngle('isometric')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              activeAngle === 'isometric'
                ? 'bg-ink-primary text-surface-canvas'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            3D Iso
          </button>
          <button
            onClick={() => setActiveAngle('front')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              activeAngle === 'front'
                ? 'bg-ink-primary text-surface-canvas'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setActiveAngle('top')}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
              activeAngle === 'top'
                ? 'bg-ink-primary text-surface-canvas'
                : 'text-ink-muted hover:text-ink-primary'
            }`}
          >
            Top
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-mono text-ink-muted mt-2 opacity-70">
        <span>&bull; Drag to rotate in 360°</span>
        <span>&bull; Switch camera views & effects</span>
      </div>
    </div>
  );
};

export default Hero3DCanvas;
