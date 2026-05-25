import React, { useEffect, useRef, useState } from 'react';
import { TsunamiParams } from '../types';
import { Shield, Anchor, TreePine, RefreshCw, Layers, Compass, HelpCircle } from 'lucide-react';

interface TsunamiSimulationProps {
  params: TsunamiParams;
  setParams: React.Dispatch<React.SetStateAction<TsunamiParams>>;
}

export default function TsunamiSimulation({ params, setParams }: TsunamiSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inundationLevel, setInundationLevel] = useState<number>(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

  // Restart/Trigger Simulation
  const startSimulation = () => {
    if (params.isSimulating) return;
    setParams(prev => ({
      ...prev,
      isSimulating: true,
      waveAmplitude: 0.1,
      damageAssessment: "Evaluating hydraulic forces..."
    }));
    setInundationLevel(0);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let waveX = 40; // Wave horizontal coordinate (starts left in deep ocean)
    let waveH = 10;  // Deep wave height (barely visible)

    const drawSimulation = () => {
      animId = requestAnimationFrame(drawSimulation);
      frame += 1 * speedMultiplier;

      const w = canvas.width;
      const h = canvas.height;

      // Dark sci-fi backdrop
      ctx.fillStyle = '#060505';
      ctx.fillRect(0, 0, w, h);

      // 1. Draw Seabed Slope (Rising shelf to coast)
      // Left coordinate: deep ocean bed (280px deep)
      // Mid-shelf rise
      // Right coordinate: coast shore (60px deep) & land (above sea line)
      ctx.fillStyle = '#1f1610'; // earth brown crust
      ctx.beginPath();
      ctx.moveTo(0, h * 0.9);
      ctx.lineTo(w * 0.4, h * 0.9);
      ctx.bezierCurveTo(w * 0.55, h * 0.9, w * 0.7, h * 0.76, w * 0.78, h * 0.76); // rising continental shelf
      ctx.lineTo(w * 0.85, h * 0.76); // coast sand beach
      ctx.lineTo(w * 0.95, h * 0.6);  // land hill
      ctx.lineTo(w, h * 0.6);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Bedrock hatching
      ctx.strokeStyle = '#2d2017';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < w; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, h * 0.88);
        ctx.lineTo(i - 20, h);
        ctx.stroke();
      }

      // Draw Seawall (if enabled)
      const seawallX = w * 0.82;
      const seawallY = h * 0.76;
      const seawallHeight = 35;
      if (params.seawallEnabled) {
        ctx.fillStyle = '#6b7280'; // gray concrete barrier
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.fillRect(seawallX, seawallY - seawallHeight, 14, seawallHeight);
        ctx.strokeRect(seawallX, seawallY - seawallHeight, 14, seawallHeight);
        
        ctx.fillStyle = '#374151';
        ctx.fillRect(seawallX + 4, seawallY - seawallHeight + 5, 6, seawallHeight - 10); // reinforcement bar design
      }

      // Draw Mangrove Forest defense buffer (if enabled)
      const mangroveX = w * 0.74;
      const mangroveY = h * 0.81;
      if (params.forestBufferEnabled) {
        ctx.fillStyle = '#065f46'; // dark teal-green trees
        ctx.strokeStyle = '#047857';
        for (let i = 0; i < 3; i++) {
          const mX = mangroveX + (i * 14);
          ctx.beginPath();
          ctx.arc(mX, mangroveY - 24, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          // trunk
          ctx.strokeStyle = '#3b2314';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(mX, mangroveY);
          ctx.lineTo(mX, mangroveY - 14);
          ctx.stroke();
        }
      }

      // Draw Coastal Buildings on land hill
      // Building 1: Brick apartments
      const b1X = w * 0.88;
      const b1Y = h * 0.70;
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(b1X, b1Y - 45, 24, 45);
      ctx.strokeStyle = '#450a0a';
      ctx.strokeRect(b1X, b1Y - 45, 24, 45);
      // Windows
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(b1X + 4, b1Y - 35, 4, 6);
      ctx.fillRect(b1X + 14, b1Y - 35, 4, 6);
      ctx.fillRect(b1X + 4, b1Y - 20, 4, 6);
      ctx.fillRect(b1X + 14, b1Y - 20, 4, 6);

      // Building 2: Coastal wooden cottage (vulnerable)
      const b2X = w * 0.84;
      const b2Y = h * 0.76;
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(b2X + 10, b2Y - 25);
      ctx.lineTo(b2X, b2Y - 15);
      ctx.lineTo(b2X + 20, b2Y - 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(b2X, b2Y - 15, 20, 15);

      // Normal base ocean sea level line (height at h * 0.74, e.g., above bed but below beach top)
      const baseCoastSeaY = h * 0.74; // reference sea level

      // 2. Wave Physics calculations
      let currentWaveY = baseCoastSeaY;
      
      if (params.isSimulating) {
        // Wave propagates rightwards
        waveX += 2.5 * speedMultiplier;

        // Wave shoaling transformation (highly educational!)
        // Speed slows down as wave approach coast shelf, but amplitude rises!
        // Shoaling amplitude multipliers starts at 1.0 (deep) and goes up to 8.0 (at beach)
        const distanceRatio = waveX / w;
        let shoalingMultiplier = 1.0;
        
        if (distanceRatio > 0.4) {
          // As wave transitions to continent shelf, amplitude swells
          shoalingMultiplier = 1.0 + Math.pow((distanceRatio - 0.4) * 1.6, 1.8) * 8.0;
        }

        // Deep wave amplitude is 1.5 pixels, but expands via shoaling up to 55+ pixels!
        const displacementPower = (params.epicenterMagnitude / 8) * 4.0;
        const liveAmplitude = displacementPower * shoalingMultiplier;

        // Save real-time amp in metrics HUD
        if (frame % 10 === 0 && distanceRatio < 0.9) {
          const meters = parseFloat(((liveAmplitude * 0.8) * (params.displacementVolume * 0.15 + 0.5)).toFixed(1));
          setParams(prev => ({ ...prev, waveAmplitude: meters }));
        }

        // Wave profile curve drawing helper
        // Using a smooth crested cos/sine pulse
        ctx.fillStyle = 'rgba(29, 78, 216, 0.75)'; // transparent water blue
        ctx.strokeStyle = '#60a5fa';               // glowing foam top
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(0, h);
        
        for (let x = 0; x <= w; x++) {
          // Calculate water level profile
          // Distance from wave epicenter peak
          const distFromPeak = x - waveX;
          
          // Width of the wave crest (compressing/shortening as it enters shallow water: wavelength decreases!)
          const wavelength = Math.max(15, 160 - distanceRatio * 110);
          
          let waveSurfaceOffset = 0;
          if (Math.abs(distFromPeak) < wavelength) {
            // Raised Cosine wave crest simulation (solitary wave model)
            const rad = (distFromPeak / wavelength) * Math.PI;
            waveSurfaceOffset = -liveAmplitude * (1 + Math.cos(rad)) * 0.5;
          }

          // Depth of ocean floor at this point
          let bedDepth = h * 0.9;
          if (x > w * 0.4 && x <= w * 0.78) {
            const shelfRiseRatio = (x - w * 0.4) / (w * 0.38);
            bedDepth = h * 0.9 - shelfRiseRatio * (h * 0.14);
          } else if (x > w * 0.78) {
            bedDepth = h * 0.76;
          }

          const surfaceY = baseCoastSeaY + waveSurfaceOffset;
          // Water shouldn't go below sea bottom
          const clampedSurfaceY = Math.min(bedDepth, surfaceY);
          ctx.lineTo(x, clampedSurfaceY);
        }

        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Shore Collision mitigation & impact calculus
        if (waveX >= actionBoundaryX(w, params)) {
          // Wave hitting shields/mangroves/cliffs
          let targetEnergy = params.waveAmplitude;
          let wallResistance = params.seawallEnabled ? 9.0 : 0;
          let forestResistance = params.forestBufferEnabled ? 4.5 : 0;
          
          const netDamageForce = Math.max(0, targetEnergy - wallResistance - forestResistance);

          // Animate building shaking or destruction
          if (netDamageForce > 12) {
            // Destroy cottage, severely damage apartments
            setParams(prev => ({
              ...prev,
              damageAssessment: `CRITICAL SHORE DAMAGE. Force: ${Math.round(netDamageForce)} kN/m². 
              The wooden cottage was totally shattered. 
              The concrete apartment ground floor collapsed. All seawall defenses breached!`
            }));
            // draw debris
            ctx.fillStyle = '#b45309';
            ctx.fillRect(b2X - 5, b2Y - 5, 8, 5);
            ctx.fillRect(b2X + 12, b2Y - 3, 10, 4);
          } else if (netDamageForce > 4) {
            setParams(prev => ({
              ...prev,
              damageAssessment: `MODERATE SHORE INUNDATION. Force: ${Math.round(netDamageForce)} kN/m². 
              The wooden cottage has major water intrusion. 
              The seawall and mangrove system successfully dampened 65% of the hydrostatic wave crest!`
            }));
          } else {
            setParams(prev => ({
              ...prev,
              damageAssessment: `DEFENSES STAND SOLID. Wave energy fully absorbed by engineering seawalls & bio-forest mangroves.`
            }));
          }

          // End simulation of wave sequence
          if (waveX > w + 80) {
            setParams(prev => ({ ...prev, isSimulating: false }));
            waveX = 40;
          }
        }
      } else {
        // Draw calm steady sea line
        ctx.fillStyle = 'rgba(29, 78, 216, 0.7)';
        ctx.beginPath();
        ctx.moveTo(0, h);
        
        // Steady flat sea level leading to beach
        ctx.lineTo(0, baseCoastSeaY);
        ctx.lineTo(w * 0.78, baseCoastSeaY);
        ctx.lineTo(w * 0.85, baseCoastSeaY + 5); // beach waterline
        ctx.lineTo(w * 0.85, h * 0.76);
        ctx.lineTo(w, h * 0.6);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
      }
    };

    const actionBoundaryX = (width: number, p: TsunamiParams) => {
      // Return pixel of first defense
      if (p.forestBufferEnabled) return width * 0.72;
      if (p.seawallEnabled) return width * 0.8;
      return width * 0.83;
    };

    drawSimulation();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [params.isSimulating, params.seawallEnabled, params.forestBufferEnabled, params.epicenterMagnitude, params.displacementVolume, speedMultiplier]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-stone-900/40 p-4 sm:p-6 rounded-2xl border border-stone-800">
      
      {/* Simulation Screen */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        <div className="relative overflow-hidden bg-black rounded-xl border border-stone-800 aspect-video lg:h-[400px] flex items-center justify-center">
          
          {/* Overlay Stats Head */}
          <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2 pointer-events-none">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-950 text-blue-400 border border-blue-900/60 font-mono uppercase tracking-wider backdrop-blur-md">
              <Anchor className="w-3 h-3 mr-1" /> TSUNAMI HYDRO-MODELING
            </span>
            <div className="bg-stone-950/80 p-3 rounded-lg border border-stone-800/80 backdrop-blur-md space-y-1 font-mono text-xs text-stone-400">
              <p>PROPAGATION SPEED: <span className="text-white font-semibold">{(800 - (waveX() * 0.7)).toFixed(0)} KM/H</span></p>
              <p>AMPLITUDE HEIGHT: <span className="text-blue-400 font-bold">{params.waveAmplitude} METERS</span></p>
              <p>DEFENSE REDUCTION: <span className="text-emerald-400 font-semibold">{params.seawallEnabled && params.forestBufferEnabled ? '90%' : params.seawallEnabled ? '65%' : params.forestBufferEnabled ? '35%' : '0%'}</span></p>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={640}
            height={400}
            className="w-full h-full"
          />

          {/* Shoaling mechanics helper text overlay */}
          {params.isSimulating && (
            <div className="absolute bottom-4 right-4 bg-[#050505]/95 border border-white/10 p-3 rounded-none max-w-xs text-[10px] font-mono text-white/70">
              <p className="text-[#FF4D00] font-black uppercase mb-1 tracking-widest">🌊 OCEAN WAVE SHOALING</p>
              <p className="uppercase leading-normal text-[9px]">As water depth decreases near shore, wavelength compresses, and massive energy transfers vertically. Wave height multiplies exponentially!</p>
            </div>
          )}
        </div>

        {/* Start button triggers */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white/5 rounded-none border border-white/10 space-y-3 sm:space-y-0">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Propagation Simulator</h4>
            <p className="text-xs text-white/50">Trigger subduction earthquake wave expansion across the continental shelf boundary.</p>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              id="tsunami-speed-toggle"
              onClick={() => setSpeedMultiplier(prev => prev === 1 ? 2 : (prev === 2 ? 0.5 : 1))}
              className="py-3.5 px-4 rounded-none border border-white/10 bg-transparent text-white/70 hover:text-white font-mono text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              SPEED: {speedMultiplier}x
            </button>
            <button
              id="tsunami-simulation-trigger"
              onClick={startSimulation}
              disabled={params.isSimulating}
              className={`flex-grow sm:flex-grow-0 px-8 py-4 rounded-none text-xs font-mono font-black tracking-widest flex items-center justify-center space-x-2 transition-colors cursor-pointer uppercase ${
                params.isSimulating 
                  ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed' 
                  : 'bg-[#FF4D00] text-black hover:bg-white'
              }`}
            >
              <Anchor className={`w-4 h-4 ${params.isSimulating ? 'animate-pulse' : ''}`} />
              <span>{params.isSimulating ? "WAVE MOVING..." : "DISPLACE SEABED"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Adjustments Panel */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        {/* Mitigation toggles and slide inputs */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#FF4D00] uppercase tracking-[0.2em] font-sans">Ocean Wave Settings</h3>
          
          {/* Seaway defenses */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-mono uppercase tracking-widest font-bold">COASTAL MITIGATION SCHEMES</label>
            
            {/* Concrete seawall toggle */}
            <button
              id="mitigation-seawall-toggle"
              onClick={() => setParams(prev => ({ ...prev, seawallEnabled: !prev.seawallEnabled }))}
              className={`w-full flex items-center justify-between p-3.5 rounded-none border font-mono transition-all text-left cursor-pointer ${
                params.seawallEnabled 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="w-4 h-4 text-[#FF4D00]" />
                <span className="text-xs font-bold font-mono">CONCRETE SEAWALL BARRIER</span>
              </div>
              <span className="text-[10px] font-bold">{params.seawallEnabled ? "ENABLED" : "DISABLED"}</span>
            </button>

            {/* Coastal mangrove forests toggle */}
            <button
              id="mitigation-mangroves-toggle"
              onClick={() => setParams(prev => ({ ...prev, forestBufferEnabled: !prev.forestBufferEnabled }))}
              className={`w-full flex items-center justify-between p-3.5 rounded-none border font-mono transition-all text-left cursor-pointer ${
                params.forestBufferEnabled 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <TreePine className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold font-mono">MANGROVE BIO-FOREST SHIELD</span>
              </div>
              <span className="text-[10px] font-bold">{params.forestBufferEnabled ? "ENABLED" : "DISABLED"}</span>
            </button>
          </div>

          {/* Trigger earthquake Richter scale value */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">SUBDUCTION FAULT EARTHQUAKE</span>
              <span className="text-[#FF4D00] font-bold">M {params.epicenterMagnitude.toFixed(1)}</span>
            </div>
            <input
              id="tsunami-epicenter-slider"
              type="range"
              min="6.5"
              max="9.5"
              step="0.1"
              value={params.epicenterMagnitude}
              onChange={(e) => setParams(prev => ({ ...prev, epicenterMagnitude: parseFloat(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>M 6.5 (Standard)</span>
              <span>M 9.5 (Basin swell)</span>
            </div>
          </div>

          {/* Water displacement volume */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">DISPLACEMENT VOLUME</span>
              <span className="text-[#FF4D00] font-bold">{params.displacementVolume} KM³</span>
            </div>
            <input
              id="tsunami-volume-slider"
              type="range"
              min="1"
              max="15"
              value={params.displacementVolume}
              onChange={(e) => setParams(prev => ({ ...prev, displacementVolume: parseInt(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>1 km³ (Compact)</span>
              <span>15 km³ (Massive)</span>
            </div>
          </div>
        </div>

        {/* Hazard assessment HUD block */}
        <div className="bg-white/5 p-5 rounded-none border border-white/10 space-y-4 font-mono">
          <div className="flex items-center space-x-2 text-white font-bold border-b border-white/10 pb-2.5">
            <Layers className="w-4 h-4 text-[#FF4D00]" />
            <h4 className="text-xs uppercase tracking-widest">Hydrostatic Loss Assessment</h4>
          </div>
          <div className="space-y-2 text-xs text-white/75 leading-relaxed font-mono">
            {params.isSimulating ? (
              <p className="text-[#FF4D00] animate-pulse font-bold uppercase tracking-wider">{params.damageAssessment}</p>
            ) : (
              <p className="text-white/40 uppercase text-[10px] tracking-wide">System ready. Adjust tectonic parameters and press "Displace Seabed" to run hydraulic testing modeling.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function waveX() {
  return 80;
}
