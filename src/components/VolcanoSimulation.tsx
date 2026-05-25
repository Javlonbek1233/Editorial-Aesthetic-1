import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { VolcanoParams } from '../types';
import { Flame, Info, AlertTriangle, RefreshCw, Layers, Eye, Compass } from 'lucide-react';

interface VolcanoSimulationProps {
  params: VolcanoParams;
  setParams: React.Dispatch<React.SetStateAction<VolcanoParams>>;
}

export default function VolcanoSimulation({ params, setParams }: VolcanoSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'xray'>('3d');
  
  // Real-time calculation of Eruption potential & classification
  const calculateGeology = () => {
    const viscosity = params.viscosity;
    const gas = params.gasConcentration;
    const type = params.type;

    // dynamic PSI/MPa pressure calculation
    let basePressure = (viscosity * 0.4) + (gas * 0.7) - (params.chamberDepth * 1.5);
    basePressure = Math.max(5, Math.min(150, basePressure));

    // VEI index estimate (Volcanic Explosiveness Index 0 to 8)
    let vei = 0;
    if (type === 'stratovolcano') {
      vei = Math.floor(2 + (viscosity * 0.03) + (gas * 0.035));
    } else if (type === 'shield') {
      vei = Math.floor(0 + (viscosity * 0.015) + (gas * 0.01));
    } else { // supervolcano
      vei = Math.floor(6 + (viscosity * 0.01) + (gas * 0.01));
    }
    vei = Math.max(0, Math.min(8, vei));

    // Ash Column Height (km) - Plinian cloud index
    const ashHeight = params.isErupting 
      ? Math.round(Math.pow(vei, 1.6) * 4.5 + (gas * 0.15) + 1)
      : 0;

    return { pressure: parseFloat(basePressure.toFixed(1)), vei, ashHeight };
  };

  const { pressure, vei, ashHeight } = calculateGeology();

  // Update dynamic params on render if they mismatch
  useEffect(() => {
    if (params.pressure !== pressure || params.eruptionIntensity !== vei || params.ashColumnHeight !== ashHeight) {
      setParams(prev => ({
        ...prev,
        pressure,
        eruptionIntensity: vei,
        ashColumnHeight: ashHeight
      }));
    }
  }, [params.viscosity, params.gasConcentration, params.chamberDepth, params.type, params.isErupting, pressure, vei, ashHeight, setParams]);

  const toggleErupt = () => {
    setParams(prev => ({ ...prev, isErupting: !prev.isErupting }));
  };

  // Three.js Render System
  useEffect(() => {
    if (!containerRef.current || viewMode !== '3d') return;

    const width = containerRef.current.clientWidth;
    const height = 450;

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0707);
    scene.fog = new THREE.FogExp2(0x0a0707, 0.015);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 8, 28);
    camera.lookAt(0, 3, 0);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // LIGHTS
    const ambientLight = new THREE.AmbientLight(0x331111, 0.6);
    scene.add(ambientLight);

    const magmaLight = new THREE.PointLight(0xff4500, 4, 30);
    magmaLight.position.set(0, 4, 0);
    scene.add(magmaLight);

    const sunLight = new THREE.DirectionalLight(0xffaa66, 0.4);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    // MOUNTAIN (Volcano Cone)
    // Create custom profile based on volcano type
    let radiusTop = 1;
    let radiusBottom = 16;
    let coneHeight = 8;
    
    if (params.type === 'shield') {
      radiusTop = 1.8;
      radiusBottom = 26;
      coneHeight = 3.5;
    } else if (params.type === 'supervolcano') {
      // caldera: massive collapsed depression
      radiusTop = 6;
      radiusBottom = 24;
      coneHeight = 2.0;
    }

    const volcanoGeom = new THREE.CylinderGeometry(radiusTop, radiusBottom, coneHeight, 32, 16, true);
    // Displace vertices to create organic rocky ridges
    const posAttr = volcanoGeom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      // Don't displace base or crater edge too much to keep integrity
      if (y > -coneHeight / 2 && y < coneHeight / 2) {
        const theta = Math.random() * Math.PI * 2;
        const displace = (Math.random() - 0.5) * (params.type === 'shield' ? 0.3 : 0.8);
        posAttr.setX(i, posAttr.getX(i) + Math.cos(theta) * displace);
        posAttr.setZ(i, posAttr.getZ(i) + Math.sin(theta) * displace);
      }
    }
    volcanoGeom.computeVertexNormals();

    const volcanoMat = new THREE.MeshStandardMaterial({
      color: 0x3c3535,
      roughness: 0.95,
      metalness: 0.1,
      flatShading: true,
    });
    const volcanoMesh = new THREE.Mesh(volcanoGeom, volcanoMat);
    volcanoMesh.position.y = coneHeight / 2;
    scene.add(volcanoMesh);

    // Lava crater reservoir
    const lavaGeom = new THREE.CylinderGeometry(radiusTop - 0.1, radiusTop - 0.1, 0.4, 32);
    const lavaMat = new THREE.MeshBasicMaterial({
      color: 0xff3700,
    });
    const lavaPlume = new THREE.Mesh(lavaGeom, lavaMat);
    lavaPlume.position.y = coneHeight;
    scene.add(lavaPlume);

    // TERRAIN FLOOR
    const floorGeom = new THREE.PlaneGeometry(100, 100, 16, 16);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x141010, roughness: 0.9 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    scene.add(floor);

    // ERUPTION PARTICLES (LAVA + SMOKE)
    const particleCount = params.isErupting ? Math.min(2500, (vei + 1) * 350) : 0;
    const particlesGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    const velocity: Array<{x: number, y: number, z: number, life: number, maxLife: number, isAsh: boolean}> = [];

    const activeEruptionPower = (params.eruptionIntensity + 1) * 1.5;

    for (let i = 0; i < particleCount; i++) {
      // Spawn within top crater area
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * (radiusTop - 0.2);
      positions[i * 3] = Math.cos(angle) * dist;
      positions[i * 3 + 1] = coneHeight;
      positions[i * 3 + 2] = Math.sin(angle) * dist;

      const isAsh = Math.random() < (params.viscosity / 100); // thick magma = more ash
      const maxLife = 60 + Math.random() * 120;

      velocity.push({
        x: (Math.random() - 0.5) * (activeEruptionPower * 0.4),
        y: (Math.random() * 0.5 + 0.5) * activeEruptionPower,
        z: (Math.random() - 0.5) * (activeEruptionPower * 0.4),
        life: 0,
        maxLife,
        isAsh
      });

      // Colors
      if (isAsh) {
        // Ash dust gray
        colors[i * 3] = 0.4 + Math.random() * 0.15;
        colors[i * 3 + 1] = 0.38 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.38 + Math.random() * 0.1;
        sizes[i] = 1.0 + Math.random() * 3.5;
      } else {
        // Glowing hot magma (orange-red)
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.2 + Math.random() * 0.5;
        colors[i * 3 + 2] = 0.0;
        sizes[i] = 0.5 + Math.random() * 1.8;
      }
    }

    particlesGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Custom Particle Shader / Point Material
    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particleSystem = new THREE.Points(particlesGeom, pointsMaterial);
    scene.add(particleSystem);

    // Caldera indicator if supervolcano
    let RingMesh: THREE.LineLoop | null = null;
    if (params.type === 'supervolcano') {
      const ringGeom = new THREE.RingGeometry(5.8, 6.2, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, opacity: 0.3, transparent: true });
      RingMesh = new THREE.LineLoop(ringGeom, ringMat as any);
      RingMesh.position.y = coneHeight + 0.1;
      scene.add(RingMesh);
    }

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      volcanoMesh.rotation.y += 0.03 * delta;

      // Pulse crater glowing reservoir
      const time = clock.getElapsedTime();
      const pulse = Math.sin(time * 5.0) * 0.15 + 0.85;
      magmaLight.intensity = (params.isErupting ? 15 : 4) * pulse;
      
      if (params.isErupting) {
        lavaMat.color.setRGB(1.0, 0.25 * pulse + 0.2, 0.0);
      } else {
        lavaMat.color.setRGB(0.5, 0.1, 0.0);
      }

      // Update particle positions
      if (params.isErupting && particleCount > 0) {
        const posArr = particlesGeom.attributes.position;
        for (let i = 0; i < particleCount; i++) {
          const vel = velocity[i];
          vel.life++;

          let pX = posArr.getX(i);
          let pY = posArr.getY(i);
          let pZ = posArr.getZ(i);

          // Update physics
          pX += vel.x * delta * 5;
          pY += vel.y * delta * 5;
          pZ += vel.z * delta * 5;

          // Apply volcanic gravity deceleration
          vel.y -= 3.2 * delta; 

          // Wind draft at peak of column
          if (vel.isAsh && pY > coneHeight + 2) {
            pX += Math.sin(time + i) * 0.15 * delta * vei;
            pZ += Math.cos(time * 0.5 + i) * 0.15 * delta * vei;
            vel.y += 1.2 * delta; // Ash drifts up from high thermal columns
          }

          // Respawn dead particles
          if (vel.life > vel.maxLife || pY < 0) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * (radiusTop - 0.2);
            pX = Math.cos(angle) * dist;
            pY = coneHeight;
            pZ = Math.sin(angle) * dist;
            vel.life = 0;
            vel.x = (Math.random() - 0.5) * (activeEruptionPower * 0.4);
            vel.y = (Math.random() * 0.5 + 0.5) * activeEruptionPower;
            vel.z = (Math.random() - 0.5) * (activeEruptionPower * 0.4);
          }

          posArr.setX(i, pX);
          posArr.setY(i, pY);
          posArr.setZ(i, pZ);
        }
        particlesGeom.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      volcanoGeom.dispose();
      volcanoMat.dispose();
      lavaGeom.dispose();
      lavaMat.dispose();
      floorGeom.dispose();
      floorMat.dispose();
      particlesGeom.dispose();
      pointsMaterial.dispose();
      if (RingMesh) {
        RingMesh.geometry.dispose();
        (RingMesh.material as any).dispose();
      }
    };
  }, [params.type, params.isErupting, params.viscosity, params.gasConcentration, params.chamberDepth, viewMode, vei]);

  // 2D Canvas X-Ray Conduit Internal System
  useEffect(() => {
    if (viewMode !== 'xray' || !canvas2DRef.current) return;

    const canvas = canvas2DRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cycle = 0;

    const drawConduit = () => {
      animId = requestAnimationFrame(drawConduit);
      cycle += 0.05;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0f0b0b';
      ctx.fillRect(0, 0, w, h);

      // Draw Earth mantle layer
      ctx.fillStyle = '#1c1313';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.4);
      ctx.lineTo(w, h * 0.4);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Volcano profiles
      ctx.strokeStyle = '#443d3d';
      ctx.lineWidth = 4;
      ctx.fillStyle = '#2d2525';
      ctx.beginPath();
      
      if (params.type === 'stratovolcano') {
        ctx.moveTo(w * 0.15, h * 0.42);
        ctx.quadraticCurveTo(w * 0.4, h * 0.42, w * 0.46, h * 0.15);
        ctx.lineTo(w * 0.54, h * 0.15);
        ctx.quadraticCurveTo(w * 0.6, h * 0.42, w * 0.85, h * 0.42);
      } else if (params.type === 'shield') {
        ctx.moveTo(w * 0.05, h * 0.42);
        ctx.quadraticCurveTo(w * 0.35, h * 0.4, w * 0.44, h * 0.3);
        ctx.lineTo(w * 0.56, h * 0.3);
        ctx.quadraticCurveTo(w * 0.65, h * 0.4, w * 0.95, h * 0.42);
      } else { // Caldera supervolcano
        ctx.moveTo(w * 0.1, h * 0.42);
        ctx.quadraticCurveTo(w * 0.33, h * 0.42, w * 0.36, h * 0.35);
        ctx.lineTo(w * 0.42, h * 0.38);
        ctx.lineTo(w * 0.58, h * 0.38);
        ctx.lineTo(w * 0.64, h * 0.35);
        ctx.quadraticCurveTo(w * 0.67, h * 0.42, w * 0.9, h * 0.42);
      }
      ctx.lineTo(w, h * 0.42);
      ctx.lineTo(w, 0); // sky
      ctx.lineTo(0, 0);
      ctx.closePath();
      
      // Draw volcano structure filling
      ctx.fillStyle = '#261e1e';
      ctx.beginPath();
      if (params.type === 'stratovolcano') {
        ctx.moveTo(w * 0.15, h * 0.42);
        ctx.quadraticCurveTo(w * 0.4, h * 0.42, w * 0.46, h * 0.15);
        ctx.lineTo(w * 0.54, h * 0.15);
        ctx.quadraticCurveTo(w * 0.6, h * 0.42, w * 0.85, h * 0.42);
      } else if (params.type === 'shield') {
        ctx.moveTo(w * 0.05, h * 0.42);
        ctx.quadraticCurveTo(w * 0.35, h * 0.4, w * 0.44, h * 0.3);
        ctx.lineTo(w * 0.56, h * 0.3);
        ctx.quadraticCurveTo(w * 0.65, h * 0.4, w * 0.95, h * 0.42);
      } else {
        ctx.moveTo(w * 0.1, h * 0.42);
        ctx.quadraticCurveTo(w * 0.33, h * 0.42, w * 0.36, h * 0.35);
        ctx.lineTo(w * 0.42, h * 0.38);
        ctx.lineTo(w * 0.58, h * 0.38);
        ctx.lineTo(w * 0.64, h * 0.35);
        ctx.quadraticCurveTo(w * 0.67, h * 0.42, w * 0.9, h * 0.42);
      }
      ctx.lineTo(w, h * 0.42);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Earth crust rock border lines
      ctx.strokeStyle = '#2f2424';
      ctx.lineWidth = 1.5;
      for (let i = h * 0.45; i < h; i += 30) {
        ctx.beginPath();
        ctx.moveTo(0, i + Math.sin(i + cycle) * 5);
        ctx.lineTo(w * 0.4, i + Math.cos(i + cycle) * 3);
        ctx.moveTo(w * 0.6, i + Math.cos(i + cycle) * 3);
        ctx.lineTo(w, i + Math.sin(i + cycle) * 5);
        ctx.stroke();
      }

      // Draw Magma Chamber (Bubble at bottom depth)
      // chamberDepth in km translates to pixel depth
      const chamberY = h * 0.45 + (params.chamberDepth / 15) * (h * 0.4);
      const chamberRadiusX = 40 + (params.gasConcentration * 0.3);
      const chamberRadiusY = 25 + (params.viscosity * 0.2);

      // Pulse color
      const colorPulseVal = 180 + Math.sin(cycle * 1.5) * 40;
      const magmaColor = `rgb(${Math.floor(colorPulseVal)}, ${Math.floor(colorPulseVal * 0.25)}, 10)`;

      ctx.fillStyle = magmaColor;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#ff3c00';
      ctx.beginPath();
      ctx.ellipse(w * 0.5, chamberY, chamberRadiusX, chamberRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset shadow

      // Draw Conduit (Pipe from chamber to vent center)
      const ventY = params.type === 'stratovolcano' ? h * 0.15 : (params.type === 'shield' ? h * 0.3 : h * 0.38);
      ctx.strokeStyle = magmaColor;
      ctx.lineWidth = params.viscosity > 60 ? 10 : 18; // high viscosity is tighter/restricted
      ctx.beginPath();
      ctx.moveTo(w * 0.5, chamberY);
      ctx.quadraticCurveTo(w * 0.48 + Math.sin(cycle) * 4, (chamberY + ventY) * 0.5, w * 0.5, ventY);
      ctx.stroke();

      // Bubbles ascending in conduit
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < 6; i++) {
        const bubbleY = chamberY - ((cycle * 15 + i * 40) % (chamberY - ventY));
        const bubbleOffset = Math.sin(bubbleY * 0.05 + cycle) * 4;
        ctx.beginPath();
        ctx.arc(w * 0.5 + bubbleOffset, bubbleY, 2 + (params.gasConcentration * 0.04), 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels the chambers
      ctx.fillStyle = '#ff6a00';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('ACTIVE MAGMA RESERVOIR', w * 0.5 + chamberRadiusX + 10, chamberY + 4);
      ctx.fillStyle = '#a19797';
      ctx.font = '10px monospace';
      ctx.fillText(`DEPTH: ${params.chamberDepth} km`, w * 0.5 + chamberRadiusX + 10, chamberY + 18);
      ctx.fillText(`GAS SATURATION: ${params.gasConcentration}%`, w * 0.5 + chamberRadiusX + 10, chamberY + 30);

      ctx.fillText('CONDUIT CHANNEL', w * 0.5 - 120, (chamberY + ventY) * 0.5);
      ctx.beginPath();
      ctx.moveTo(w * 0.5 - 20, (chamberY + ventY) * 0.5 - 4);
      ctx.lineTo(w * 0.5 - 5, (chamberY + ventY) * 0.5 - 4);
      ctx.strokeStyle = '#666';
      ctx.stroke();

      // Draw gas pressure meter on side
      ctx.fillStyle = '#221515';
      ctx.fillRect(15, h - 140, 24, 110);
      const barHeight = (params.pressure / 150) * 100;
      ctx.fillStyle = params.pressure > 80 ? '#ef4444' : (params.pressure > 40 ? '#f97316' : '#22c55e');
      ctx.fillRect(17, h - 32 - barHeight, 20, barHeight);
      ctx.fillStyle = '#ffffff';
      ctx.font = '8px monospace';
      ctx.fillText('PRESS.', 12, h - 148);
      ctx.fillText(`${Math.round(params.pressure)}MPa`, 10, h - 15);

      // Draw Eruption Spray if isErupting
      if (params.isErupting) {
        ctx.fillStyle = '#ff4500';
        for (let s = 0; s < 15; s++) {
          const randX = (Math.random() - 0.5) * 40;
          const randY = ventY - Math.random() * (vei * 25 + 20);
          ctx.beginPath();
          ctx.arc(w * 0.5 + randX, randY, Math.random() * 3 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        // Ash cloud billowing
        ctx.fillStyle = 'rgba(60, 53, 53, 0.7)';
        ctx.beginPath();
        ctx.arc(w * 0.5, ventY - 40, params.ashColumnHeight * 1.5 + 10, 0, Math.PI * 2);
        ctx.arc(w * 0.5 - 25, ventY - 55, params.ashColumnHeight * 1.2 + 5, 0, Math.PI * 2);
        ctx.arc(w * 0.5 + 25, ventY - 60, params.ashColumnHeight * 1.3 + 8, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawConduit();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [params.type, params.isErupting, params.viscosity, params.gasConcentration, params.chamberDepth, params.pressure, viewMode, vei, ashHeight]);

  // Geological descriptions based on inputs
  const getVolcanicExplanation = () => {
    const { viscosity, gasConcentration, type } = params;
    if (type === 'shield') {
      return {
        lavaStyle: "Mafic (Basaltic) - highly fluid, very low silica content.",
        danger: "Effusive flow hazards (destroying roads/infrastructure) but minimal global explosion risk.",
        example: "Mauna Loa / Kilauea (Hawaii). The low viscosity allows gases to escape smoothly, bubbling up in spectacular fire fountains rather than shattering the rock structure explosive-style.",
        alertLevel: "Standard Yellow monitoring."
      };
    } else if (type === 'stratovolcano') {
      if (viscosity > 60 && gasConcentration > 60) {
        return {
          lavaStyle: "Felsic / Rhyolitic - extreme silica count, mud-thick consistency.",
          danger: "Plinian eruption with colossal ash columns, catastrophic Pyroclastic Density Currents (PDCs) moving at 400 km/h, and volcanic bombs.",
          example: "Mt. Vesuvius (79 AD) or Mt. Pinatubo (1991). Gas bubbles are locked under immense pressure in the high-viscosity magma; when the cap fractures, they expand violently and tear the magma into ash.",
          alertLevel: "RED ALERT: Catastrophe status imminent."
        };
      } else {
        return {
          lavaStyle: "Intermediate (Andesitic) lava flow.",
          danger: "Phreatic blasts, growing lava domes, medium scale lahars (volcanic mudslides).",
          example: "Mt. St. Helens (USA) or Merapi (Indonesia).",
          alertLevel: "Orange Watch status."
        };
      }
    } else {
      return {
        lavaStyle: "Rhyolitic Ultra-magma chamber containing thousands of cubic kilometers of molten material.",
        danger: "Global climatic winter, continental ash devastation, caldera collapse trigger.",
        example: "Yellowstone Caldera (USA) or Toba (Indonesia). The chamber pressure easily exceeds 100 MPa, with major threat vector of worldwide starvation from agricultural blockades.",
        alertLevel: "EVACUATE CONTINENT (Theoretical Level)."
      };
    }
  };

  const explanation = getVolcanicExplanation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/5 p-4 sm:p-6 rounded-none border border-white/10 relative z-10">
      
      {/* Simulation Screen */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="relative group overflow-hidden bg-black rounded-none border border-white/10 aspect-video lg:h-[450px] flex items-center justify-center">
          
          {/* Overlay Stats Grid */}
          <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-none">
            <span className="inline-flex items-center px-2.5 py-1 rounded-none text-xs font-semibold bg-black/90 text-[#FF4D00] border border-[#FF4D00]/50 font-mono uppercase tracking-[0.2em] backdrop-blur-md">
              <Compass className="w-3 h-3 mr-1 animate-pulse" /> VOLCANIC EXPLOSION RADAR
            </span>
            <div className="bg-[#050505]/95 p-4 rounded-none border border-white/10 backdrop-blur-md space-y-1.5 font-mono text-xs text-white/60">
              <p className="uppercase tracking-wider">VOLCANO: <span className="text-white font-bold">{params.type}</span></p>
              <p className="uppercase tracking-wider">PRESSURE: <span className={`${params.pressure > 80 ? 'text-[#FF4D00]' : 'text-amber-400'} font-bold`}>{params.pressure} MPa</span></p>
              <p className="uppercase tracking-wider">VEI INDEX: <span className="text-[#FF4D00] font-bold">VEI-{params.eruptionIntensity}</span></p>
              {params.isErupting && (
                <p className="text-[#FF4D00] animate-pulse font-bold uppercase tracking-wider">ASH COLUMN: {params.ashColumnHeight} KM</p>
              )}
            </div>
          </div>

          {/* Toggle View Options */}
          <div className="absolute top-4 right-4 z-10 flex space-x-0">
            <button
              id="view-mode-3d-btn"
              onClick={() => setViewMode('3d')}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center transition cursor-pointer ${viewMode === '3d' ? 'bg-[#FF4D00] text-black' : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'}`}
            >
              <Eye className="w-3.5 h-3.5 mr-1.5" /> 3D CRATER
            </button>
            <button
              id="view-mode-xray-btn"
              onClick={() => setViewMode('xray')}
              className={`px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center transition cursor-pointer ${viewMode === 'xray' ? 'bg-[#FF4D00] text-black' : 'bg-white/5 text-white/50 border border-white/10 border-l-0 hover:text-white'}`}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" /> CONDUIT X-RAY
            </button>
          </div>

          {/* Simulation Display */}
          {viewMode === '3d' ? (
            <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          ) : (
            <canvas
              ref={canvas2DRef}
              width={640}
              height={450}
              className="w-full h-full"
            />
          )}

          {/* Warning Banner during Eruption */}
          {params.isErupting && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/95 border-2 border-[#FF4D00] p-4 rounded-none flex items-center space-x-3 pointer-events-none animate-pulse font-mono">
              <AlertTriangle className="text-[#FF4D00] w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-xs text-[#FF4D00] font-black tracking-widest uppercase">WARNING: COLLOSAL EXPLOSIVE ERUPTION ACTIVE</p>
                <p className="text-[10px] text-white/80 uppercase">Pyroclastic Flows (PDCs) & high-altitude ash columns in progress.</p>
              </div>
            </div>
          )}
        </div>

        {/* Start Button & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white/5 rounded-none border border-white/10 space-y-3 sm:space-y-0">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Simulation Controller</h4>
            <p className="text-xs text-white/50">Initiate thermodynamic blasts or adjust parameters to test physical stress limits.</p>
          </div>
          <button
            id="erupt-simulation-trigger"
            onClick={toggleErupt}
            className={`w-full sm:w-auto px-8 py-4 rounded-none text-xs font-mono font-black tracking-widest flex items-center justify-center space-x-2 transition-colors cursor-pointer uppercase ${
              params.isErupting 
                ? 'bg-white text-black hover:bg-[#FF4D00]' 
                : 'bg-[#FF4D00] text-black hover:bg-white'
            }`}
          >
            <Flame className={`w-4 h-4 ${params.isErupting ? 'animate-pulse' : ''}`} />
            <span>{params.isErupting ? "Cease Eruption" : "Initiate Simulation"}</span>
          </button>
        </div>
      </div>

      {/* Parameters Panel */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        {/* Magma Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#FF4D00] uppercase tracking-[0.2em] font-sans">Magma Chamber Settings</h3>
          
          {/* Volcano Type Selector */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-mono uppercase tracking-widest font-bold">VOLCANO MORPHOLOGY</label>
            <div className="grid grid-cols-3 gap-1">
              {(['stratovolcano', 'shield', 'supervolcano'] as const).map((t) => (
                <button
                  key={t}
                  id={`volcano-type-${t}`}
                  onClick={() => setParams(prev => ({ ...prev, type: t }))}
                  className={`py-2.5 px-1 text-[9px] font-mono font-bold uppercase tracking-widest rounded-none border transition-all text-center cursor-pointer ${
                    params.type === t 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Viscosity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">SILICA CONTENT (VISCOSITY)</span>
              <span className="text-[#FF4D00] font-bold">{params.viscosity}%</span>
            </div>
            <input
              id="magma-viscosity-slider"
              type="range"
              min="1"
              max="100"
              value={params.viscosity}
              onChange={(e) => setParams(prev => ({ ...prev, viscosity: parseInt(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>Fluid basaltic</span>
              <span>Thick silicic</span>
            </div>
          </div>

          {/* Gas Volatiles Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">GAS VOLATILES (H2O, CO2, SO2)</span>
              <span className="text-[#FF4D00] font-bold">{params.gasConcentration}%</span>
            </div>
            <input
              id="magma-gas-slider"
              type="range"
              min="1"
              max="100"
              value={params.gasConcentration}
              onChange={(e) => setParams(prev => ({ ...prev, gasConcentration: parseInt(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>Silent venting</span>
              <span>Shattering</span>
            </div>
          </div>

          {/* Chamber Depth */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">CHAMBER DEPTH</span>
              <span className="text-[#FF4D00] font-bold">{params.chamberDepth} KM</span>
            </div>
            <input
              id="magma-chamber-depth-slider"
              type="range"
              min="1"
              max="15"
              value={params.chamberDepth}
              onChange={(e) => setParams(prev => ({ ...prev, chamberDepth: parseInt(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>Shallow</span>
              <span>Deep crust</span>
            </div>
          </div>
        </div>

        {/* Educational Physics readout */}
        <div className="bg-white/5 p-5 rounded-none border border-white/10 space-y-4 font-mono">
          <div className="flex items-center space-x-2 text-white font-bold border-b border-white/10 pb-2.5">
            <Info className="w-4 h-4 text-[#FF4D00]" />
            <h4 className="text-xs uppercase tracking-widest">Geologic Diagnosis</h4>
          </div>
          <div className="space-y-3 text-xs text-white/75 leading-relaxed">
            <p>
              <strong className="text-white/90 uppercase tracking-wider block text-[10px] mb-0.5">Magma Composition</strong>
              {explanation.lavaStyle}
            </p>
            <p>
              <strong className="text-white/90 uppercase tracking-wider block text-[10px] mb-0.5">Primary Hazards</strong>
              {explanation.danger}
            </p>
            <p>
              <strong className="text-white/90 uppercase tracking-wider block text-[10px] mb-0.5">Historical Analogy</strong>
              {explanation.example}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
