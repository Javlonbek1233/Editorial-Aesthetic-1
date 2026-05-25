import React, { useEffect, useRef, useState } from 'react';
import { EarthquakeParams } from '../types';
import { ShieldAlert, Activity, RefreshCw, Zap, Compass, Flame } from 'lucide-react';

interface EarthquakeSimulationProps {
  params: EarthquakeParams;
  setParams: React.Dispatch<React.SetStateAction<EarthquakeParams>>;
}

export default function EarthquakeSimulation({ params, setParams }: EarthquakeSimulationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const seismographRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'seismograph' | 'cross-section'>('seismograph');
  const [sArrivalDelay, setSArrivalDelay] = useState<number>(0);
  const [shakingIntensity, setShakingIntensity] = useState<number>(0);

  // Trigger earthquake rupture function
  const triggerRupture = () => {
    if (params.isRupturing) return;
    setParams(prev => ({ ...prev, isRupturing: true }));
    
    // Simulate shaking intensity that decays over time
    setShakingIntensity(params.magnitude * 1.5);
    
    // S-P arrival gap is proportional to depth & distance (e.g. 3 to 15 seconds)
    const delay = Math.round(3 + (params.depth * 0.05));
    setSArrivalDelay(delay);

    setTimeout(() => {
      setParams(prev => ({ ...prev, isRupturing: false }));
      setShakingIntensity(0);
    }, 12000); // 12 seconds simulation duration
  };

  // Seismograph real-time stream animation
  useEffect(() => {
    if (activeTab !== 'seismograph' || !seismographRef.current) return;

    const canvas = seismographRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const dataPoints: number[] = new Array(canvas.width).fill(0);
    let triggerTime = 0;

    const renderSeismograph = () => {
      animId = requestAnimationFrame(renderSeismograph);
      t += 1;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0a0707';
      ctx.fillRect(0, 0, w, h);

      // Draw grid lines
      ctx.strokeStyle = '#1a1010';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw baseline center
      const centerY = h / 2;
      ctx.strokeStyle = '#2d1a1a';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(w, centerY);
      ctx.stroke();

      // Shift points left
      dataPoints.shift();

      // Push new wave point based on time since rupture
      let targetAmplitude = 0;
      if (params.isRupturing) {
        if (triggerTime === 0) {
          triggerTime = t;
        }

        const elapsed = t - triggerTime;
        const sWaveStart = sArrivalDelay * 35; // speed translation constant
        
        if (elapsed < 30) {
          // 1. Core rupture initial fracture (sudden vertical jump)
          targetAmplitude = (Math.random() - 0.5) * (params.magnitude * 15);
        } else if (elapsed < sWaveStart) {
          // 2. Primus (P-waves) - Faster, compressional waves (low amplitude)
          const pAmp = params.magnitude * 2.5;
          targetAmplitude = Math.sin(t * 0.4) * pAmp + (Math.random() - 0.5) * pAmp;
        } else if (elapsed >= sWaveStart && elapsed < sWaveStart + 180) {
          // 3. Secondary (S-waves) - Slower S-wave arrives (shear waves, MASSIVE amplitude)
          const sAmp = params.magnitude * 7.5;
          targetAmplitude = Math.sin(t * 0.15) * sAmp + (Math.random() - 0.5) * (sAmp * 1.5);
        } else {
          // 4. Surface waves & decay coda
          const decayCoeff = Math.max(0, 1 - (elapsed - sWaveStart - 180) / 150);
          const codaAmp = params.magnitude * 4 * decayCoeff;
          targetAmplitude = Math.sin(t * 0.08) * codaAmp + (Math.random() - 0.5) * codaAmp;
        }
      } else {
        triggerTime = 0;
        // Background microseisms (always happening)
        targetAmplitude = (Math.random() - 0.5) * 1.2;
      }

      dataPoints.push(targetAmplitude);

      // Plot seismogram traces
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, centerY + dataPoints[0]);
      for (let i = 1; i < w; i++) {
        // Highlight wave names
        ctx.lineTo(i, centerY + dataPoints[i]);
      }

      // Dynamic color: Green for microseism, Yellow for P, bright neon Red for shearing S-wave
      if (params.isRupturing) {
        const elapsed = t - triggerTime;
        if (elapsed > sArrivalDelay * 35) {
          ctx.strokeStyle = '#ef4444'; // Extreme shearing
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#ef4444';
        } else {
          ctx.strokeStyle = '#f59e0b'; // P-wave
          ctx.shadowBlur = 2;
          ctx.shadowColor = '#f59e0b';
        }
      } else {
        ctx.strokeStyle = '#10b981'; // quiet green tracing
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw explanatory HUD tags
      if (params.isRupturing) {
        const elapsed = t - triggerTime;
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px monospace';
        
        ctx.fillText('RUPTURE START', 10, 20);
        
        if (elapsed > 30) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`P-WAVE ACTIVE (COMPRESSIONAL)`, 10, 35);
        }
        if (elapsed > sArrivalDelay * 35) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`⚠️ S-WAVE ARRIVAL (DREADED SHEAR): DELAY ${sArrivalDelay}s`, 10, h - 25);
        }
      }
    };

    renderSeismograph();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [params.isRupturing, params.magnitude, sArrivalDelay, activeTab]);

  // Fault Cross section live animation
  useEffect(() => {
    if (activeTab !== 'cross-section' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let cycle = 0;

    const renderFault = () => {
      animId = requestAnimationFrame(renderFault);
      cycle += 0.05;

      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0a0707';
      ctx.fillRect(0, 0, w, h);

      // Fault dividing line at 45 degrees
      ctx.strokeStyle = '#3e2525';
      ctx.lineWidth = 3;
      
      const startX = w * 0.4;
      const startY = h * 0.2;
      const endX = w * 0.6;
      const endY = h * 0.8;

      // Displacement animation offset during rupture
      let displacementOffset = 0;
      if (params.isRupturing) {
        displacementOffset = Math.sin(cycle * 6.0) * 8 * (params.magnitude / 10);
      }

      // Draw Left Block (Footwall)
      ctx.fillStyle = '#221a1a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.5 + displacementOffset);
      ctx.lineTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(0, h * 0.95);
      ctx.closePath();
      ctx.fill();

      // Draw Right Block (Hangingwall)
      ctx.fillStyle = '#2b1010';
      ctx.beginPath();
      ctx.moveTo(w, h * 0.5 - displacementOffset);
      ctx.lineTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(w, h * 0.95);
      ctx.closePath();
      ctx.fill();

      // Fault Line Trace
      ctx.strokeStyle = params.isRupturing ? '#ef4444' : '#552222';
      ctx.shadowBlur = params.isRupturing ? 15 : 0;
      ctx.shadowColor = '#ef4444';
      ctx.lineWidth = params.isRupturing ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw focus point hypocenter (Depth coordinate)
      const depthRatio = params.depth / 150; // Map km up to 150
      const hypocenterX = startX + (endX - startX) * depthRatio;
      const hypocenterY = startY + (endY - startY) * depthRatio;

      if (params.isRupturing) {
        // Concentric stress release ripples
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        for (let r = 1; r < 5; r++) {
          const radius = (cycle * 25 * r) % 180;
          ctx.beginPath();
          ctx.arc(hypocenterX, hypocenterY, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Draw hypocenter dot
      ctx.fillStyle = '#ff3700';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3c00';
      ctx.beginPath();
      ctx.arc(hypocenterX, hypocenterY, 8 + Math.sin(cycle * 4) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Text markers
      ctx.fillStyle = '#a19797';
      ctx.font = '10px monospace';
      ctx.fillText('FOOTWALL BLOCK', w * 0.1, h * 0.4);
      ctx.fillText('HANGINGWALL BLOCK', w * 0.65, h * 0.4);

      ctx.fillStyle = '#ff3700';
      ctx.fillText(`HYPOCENTER FOCUS (DEPTH: ${params.depth} km)`, hypocenterX + 15, hypocenterY + 4);

      // Fault stress arrows showing movement vectors
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      if (params.faultType === 'normal') {
        // Tensional pulling apart
        ctx.fillText('TENSIONAL EXTENSION (PULLING APART)', 10, 20);
        drawArrow(ctx, w * 0.25, 75, w * 0.15, 75); // left arrow
        drawArrow(ctx, w * 0.75, 75, w * 0.85, 75); // right arrow
      } else if (params.faultType === 'reverse') {
        // Compressional pushing together
        ctx.fillText('COMPRESSIONAL COMPRESSION (THRUST/REVERSE)', 10, 20);
        drawArrow(ctx, w * 0.15, 75, w * 0.25, 75); // push in
        drawArrow(ctx, w * 0.85, 75, w * 0.75, 75); // push in
      } else {
        ctx.fillText('TRANSFORM BOUNDARY (SLIDING STRIKE-SLIP)', 10, 20);
        drawArrow(ctx, w * 0.2, h * 0.35, w * 0.2, h * 0.25); // slide up
        drawArrow(ctx, w * 0.8, h * 0.25, w * 0.8, h * 0.35); // slide down
      }
    };

    const drawArrow = (context: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
      const headlen = 8;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      context.beginPath();
      context.moveTo(fromX, fromY);
      context.lineTo(toX, toY);
      context.stroke();
      
      context.beginPath();
      context.moveTo(toX, toY);
      context.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      context.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      context.closePath();
      context.fillStyle = '#fff';
      context.fill();
    };

    renderFault();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [params.isRupturing, params.magnitude, params.depth, params.faultType, activeTab]);

  // Educational Damage effects descriptors based on Richter magnitude
  const getRichterEffects = () => {
    const mag = params.magnitude;
    if (mag < 3) {
      return {
        level: "Micro / Minor - Richter < 3.0",
        shaking: "Barely felt. Seismographs record small microseis bumps, no civil structures compromised.",
        energy: "Equates to exploding a few cases of dynamic sticks. Happen 100,000+ times daily globally."
      };
    } else if (mag >= 3 && mag < 5) {
      return {
        level: "Light - Richter 3.0 to 4.9",
        shaking: "Felt inside by many. Hanging chinaware rattles, parked cars wave slightly, sleeping people may wake.",
        energy: "Equates to medium sub-surface quarry blasts. Minor falling ornaments."
      };
    } else if (mag >= 5 && mag < 7) {
      return {
        level: "Moderate to Strong - Richter 5.0 to 6.9",
        shaking: "Severe structural shaking. Plasters crack, old brick chimneys collapse, brick masonry suffers severe shearing loads, furniture flips over.",
        energy: "Equates to atomic-grade explosions (e.g. Hiroshima bomb displacement). Critical damage in packed urban domains without ductile steel designs."
      };
    } else if (mag >= 7 && mag < 9) {
      return {
        level: "Major - Richter 7.0 to 8.9",
        shaking: "Disastrous destruction. Reinforced frame buildings fracture, bridge piers collapse, subterranean pipes shear, major landsliding and ground liquefaction.",
        energy: "Equivalent to 1,000,000 tons of TNT. Entire towns can be leveled. If coastal, triggers major Subduction Tsunami waves."
      };
    } else {
      return {
        level: "Great / Mega-Thrust - Richter 9.0+",
        shaking: "Cataclysmic epic crust deformation. Fault displacement of up to 40 meters. Massive surface ruptures block topography, waves physically throw items upwards.",
        energy: "Surpasses standard volcanic energy models, altering Earth's planetary rotation slightly. Triggers basin-wide colossal tsunami corridors (e.g., Sendai 2011, Sumatra 2004)."
      };
    }
  };

  const effects = getRichterEffects();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/5 p-4 sm:p-6 rounded-none border border-white/10 relative z-10">
      
      {/* Interactive Graphing Feed */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        {/* Toggle Graph Panel */}
        <div className="flex border-b border-white/10">
          <button
            id="earthquake-tab-seismograph"
            onClick={() => setActiveTab('seismograph')}
            className={`py-2 px-4 text-xs font-mono font-bold tracking-widest relative transition-colors cursor-pointer uppercase ${
              activeTab === 'seismograph' ? 'text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-1.5" /> LIVE SEISMOGRAPH (P & S TRACE)
          </button>
          <button
            id="earthquake-tab-crosssection"
            onClick={() => setActiveTab('cross-section')}
            className={`py-2 px-4 text-xs font-mono font-bold tracking-widest relative transition-colors cursor-pointer uppercase ${
              activeTab === 'cross-section' ? 'text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-white/50 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-1.5" /> FAULT ZONE PLATES X-RAY
          </button>
        </div>

        {/* View screen with dynamic camera shakes during rupture */}
        <div 
          style={{ transform: shakingIntensity > 0 ? `translate(${(Math.random() - 0.5) * shakingIntensity}px, ${(Math.random() - 0.5) * shakingIntensity}px)` : 'none' }}
          className="relative overflow-hidden bg-black rounded-none border border-white/10 aspect-video lg:h-[400px] flex items-center justify-center transition"
        >
          {activeTab === 'seismograph' ? (
            <canvas
              ref={seismographRef}
              width={640}
              height={400}
              className="w-full h-full"
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={640}
              height={400}
              className="w-full h-full"
            />
          )}

          {/* Epicenter Warning Screen flashing */}
          {params.isRupturing && (
            <div className="absolute top-4 right-4 bg-black/90 border border-[#FF4D00] px-3.5 py-1.5 rounded-none text-[10px] font-mono text-[#FF4D00] animate-pulse uppercase tracking-widest">
              🚨 STRESS RUPTURE PROPAGATION ACTIVE
            </div>
          )}
        </div>

        {/* Control Button block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 bg-white/5 rounded-none border border-white/10 space-y-3 sm:space-y-0">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Seismic Fracture Trigger</h4>
            <p className="text-xs text-white/50">Discharge stored strain forces to trace initial P compressions against deep shear currents.</p>
          </div>
          <button
            id="earthquake-simulation-trigger"
            onClick={triggerRupture}
            disabled={params.isRupturing}
            className={`w-full sm:w-auto px-8 py-4 rounded-none text-xs font-mono font-black tracking-widest flex items-center justify-center space-x-2 transition-colors cursor-pointer uppercase ${
              params.isRupturing 
                ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed' 
                : 'bg-[#FF4D00] text-black hover:bg-white'
            }`}
          >
            <Activity className={`w-4 h-4 ${params.isRupturing ? 'animate-pulse' : ''}`} />
            <span>{params.isRupturing ? "Fracturing..." : "Release Strain Stress"}</span>
          </button>
        </div>
      </div>

      {/* Adjustments Sidebar */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        {/* Sliders and settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#FF4D00] uppercase tracking-[0.2em] font-sans">Seismicity Settings</h3>
          
          {/* Fault Tectonic Type */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-mono uppercase tracking-widest font-bold">FAULT SHEARING SLIP</label>
            <div className="grid grid-cols-3 gap-1">
              {(['strike-slip', 'normal', 'reverse'] as const).map((f) => (
                <button
                  key={f}
                  id={`fault-type-${f}`}
                  onClick={() => setParams(prev => ({ ...prev, faultType: f }))}
                  className={`py-2.5 px-1 text-[9px] font-mono font-bold uppercase tracking-widest rounded-none border transition-all text-center cursor-pointer ${
                    params.faultType === f 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Richter Magnitude */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">RICHTER MAGNITUDE (M)</span>
              <span className="text-[#FF4D00] font-bold">M {params.magnitude.toFixed(1)}</span>
            </div>
            <input
              id="earthquake-magnitude-slider"
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={params.magnitude}
              onChange={(e) => setParams(prev => ({ ...prev, magnitude: parseFloat(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>M 1.0 (ambient)</span>
              <span>M 10.0 (planetary)</span>
            </div>
          </div>

          {/* Depth of Slip */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-white/60 uppercase tracking-wider font-bold">HYPOCENTER FOCUS DEPTH</span>
              <span className="text-[#FF4D00] font-bold">{params.depth} KM</span>
            </div>
            <input
              id="earthquake-depth-slider"
              type="range"
              min="5"
              max="150"
              value={params.depth}
              onChange={(e) => setParams(prev => ({ ...prev, depth: parseInt(e.target.value) }))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>5 km (shallow risk)</span>
              <span>150 km (deep mantle)</span>
            </div>
          </div>
        </div>

        {/* Richter Education HUD Box */}
        <div className="bg-white/5 p-5 rounded-none border border-white/10 space-y-4 font-mono">
          <div className="flex items-center space-x-2 text-white font-bold border-b border-white/10 pb-2.5">
            <ShieldAlert className="w-4 h-4 text-[#FF4D00]" />
            <h4 className="text-xs uppercase tracking-widest">Richter Damage Forecast</h4>
          </div>
          <div className="space-y-3 text-xs text-white/75 leading-relaxed">
            <p>
              <strong className="text-white/90 uppercase tracking-wider block text-[10px] mb-0.5 font-sans">Scale Bracket</strong> 
              <span className="text-[#FF4D00] font-bold">{effects.level}</span>
            </p>
            <p>
              <strong className="text-white/90 uppercase tracking-wider block text-[10px] mb-0.5 font-sans">Epicentral Shaking</strong> 
              {effects.shaking}
            </p>
            <p>
              <strong className="text-white/90 uppercase tracking-wider block text-[10px] mb-0.5 font-sans">Kinetic Energy Equivalent</strong> 
              {effects.energy}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
