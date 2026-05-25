import React, { useState } from 'react';
import { VolcanoParams, EarthquakeParams, TsunamiParams, GeologyHotspot } from './types';
import VolcanoSimulation from './components/VolcanoSimulation';
import EarthquakeSimulation from './components/EarthquakeSimulation';
import TsunamiSimulation from './components/TsunamiSimulation';
import GeologyMap from './components/GeologyMap';
import SurvivalGuides from './components/SurvivalGuides';
import AICopilot from './components/AICopilot';
import { Flame, Activity, ShieldCheck, Compass, HelpCircle, Terminal, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'volcano' | 'earthquake' | 'tsunami' | 'map' | 'survival' | 'copilot'>('volcano');

  // Unified global parameters simulation managers
  const [volcanoParams, setVolcanoParams] = useState<VolcanoParams>({
    type: 'stratovolcano',
    viscosity: 75,
    gasConcentration: 80,
    chamberDepth: 8,
    pressure: 45.2,
    isErupting: false,
    eruptionIntensity: 4,
    ashColumnHeight: 0
  });

  const [earthquakeParams, setEarthquakeParams] = useState<EarthquakeParams>({
    magnitude: 7.2,
    depth: 18,
    faultType: 'strike-slip',
    isRupturing: false,
    epicenterX: 120,
    epicenterY: 100
  });

  const [tsunamiParams, setTsunamiParams] = useState<TsunamiParams>({
    epicenterMagnitude: 8.6,
    displacementVolume: 8,
    shoreSpeed: 120,
    seawallEnabled: true,
    forestBufferEnabled: false,
    isSimulating: false,
    waveAmplitude: 0.1,
    damageAssessment: "Idle. Displace Seabed to trigger hydraulic tests."
  });

  // Tectonic Plate Hotspot Link Router (unifies maps and simulations)
  const handleHotspotAction = (hotspot: GeologyHotspot) => {
    if (hotspot.type === 'stratovolcano') {
      setVolcanoParams({
        type: 'stratovolcano',
        viscosity: hotspot.id === 'krakatoa' ? 85 : 75,
        gasConcentration: 90,
        chamberDepth: 7,
        pressure: 62.5,
        isErupting: false,
        eruptionIntensity: hotspot.id === 'krakatoa' ? 6 : 5,
        ashColumnHeight: 0
      });
      setActiveTab('volcano');
    } else if (hotspot.type === 'shield') {
      setVolcanoParams({
        type: 'shield',
        viscosity: 15,
        gasConcentration: 25,
        chamberDepth: 3,
        pressure: 12.0,
        isErupting: false,
        eruptionIntensity: 1,
        ashColumnHeight: 0
      });
      setActiveTab('volcano');
    } else if (hotspot.type === 'fault') {
      setEarthquakeParams({
        magnitude: 7.9,
        depth: 12,
        faultType: 'strike-slip',
        isRupturing: false,
        epicenterX: 150,
        epicenterY: 100
      });
      setActiveTab('earthquake');
    } else if (hotspot.type === 'trench') {
      setTsunamiParams(prev => ({
        ...prev,
        epicenterMagnitude: 9.1,
        displacementVolume: 12,
        isSimulating: false,
        waveAmplitude: 0.1,
        damageAssessment: "Seabed configured for Cataclysmic M9.1 fault thrust displacement. Launch modeling!"
      }));
      setActiveTab('tsunami');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F5] selection:bg-[#FF4D00] selection:text-black flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Graphic Peak from editorial guidelines */}
      <div className="absolute top-[80px] right-0 left-0 h-[600px] z-0 opacity-25 pointer-events-none select-none">
        <svg className="w-full h-full" viewBox="0 0 1024 600" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 600L250 150L450 400L700 50L1024 600H0Z" fill="url(#paint0_linear_bg)" />
          <defs>
            <linearGradient id="paint0_linear_bg" x1="512" y1="50" x2="512" y2="600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF4D00" />
              <stop offset="1" stopColor="#050505" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#050505] to-transparent"></div>
      </div>

      {/* 1. Dramatic Scientific Top Header */}
      <header className="border-b border-white/10 bg-[#050505]/95 px-4 sm:px-8 py-5 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-4 select-none">
            <div className="w-10 h-10 bg-[#FF4D00] flex items-center justify-center font-black italic text-2xl text-black select-none">
              X
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter uppercase text-white flex items-center">
                VOLCANO<span className="text-[#FF4D00]">X</span>
              </h1>
              <p className="text-[9px] text-white/40 font-mono uppercase tracking-[0.2em] font-semibold">Scientific Simulation Terminal</p>
            </div>
          </div>

          {/* Core HUD status parameters */}
          <div className="flex flex-wrap gap-4 font-mono text-[10px] tracking-widest justify-center text-white/50">
            <div className="bg-white/5 px-3 py-1.5 border border-white/10 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4D00] animate-pulse" />
              <span>VOLC. HAZARD: <strong className="text-[#FF4D00]">VEI-{volcanoParams.isErupting ? volcanoParams.eruptionIntensity : 'STANDBY'}</strong></span>
            </div>
            <div className="bg-white/5 px-3 py-1.5 border border-white/10 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              <span>FAULT ACCUMULATION: <strong className="text-yellow-400">72% STRAIN</strong></span>
            </div>
            <div className="bg-white/5 px-3 py-1.5 border border-white/10 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>TSUNAMI SEAWALLS: <strong className="text-emerald-400">{tsunamiParams.seawallEnabled ? 'SECURED' : 'UNARMED'}</strong></span>
            </div>
          </div>

        </div>
      </header>

      {/* 2. Main Simulation & Dashboard Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">
        
        {/* Navigation Tab selection panel */}
        <div className="flex flex-wrap gap-1 p-1 bg-white/5 rounded-none border border-white/10 max-w-4xl">
          {(['volcano', 'earthquake', 'tsunami', 'map', 'survival', 'copilot'] as const).map((tab) => {
            let label = "Volcanology";
            let Icon = Flame;
            
            if (tab === 'earthquake') { label = "Seismicity"; Icon = Activity; }
            if (tab === 'tsunami') { label = "Tsunami Waves"; Icon = ShieldCheck; }
            if (tab === 'map') { label = "Plate Margins"; Icon = Compass; }
            if (tab === 'survival') { label = "Survival Corps"; Icon = HelpCircle; }
            if (tab === 'copilot') { label = "AI AGNES Console"; Icon = Terminal; }

            const isSelected = activeTab === tab;

            return (
              <button
                key={tab}
                id={`navigation-tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`flex-grow sm:flex-grow-0 py-3 px-5 font-sans text-xs font-bold tracking-[0.15em] flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer uppercase ${
                  isSelected 
                    ? 'bg-[#FF4D00] text-black font-extrabold' 
                    : 'bg-transparent text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Dashboard Section with dynamic animation limits */}
        <div className="transition-all duration-300">
          {activeTab === 'volcano' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#FF4D00] font-black">SYSTEM DECONSTRUCTION ID: V-4929</div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.1em] flex items-center italic">
                  <Flame className="w-5 h-5 mr-2 text-[#FF4D00]" /> MAGMA CHAMBER & CRATER VENT MODELER
                </h2>
                <p className="text-sm text-white/70 font-serif border-l-2 border-[#FF4D05] pl-4 leading-relaxed max-w-4xl">
                  Adjust silica concentration (viscosity) versus pressurized volatiles to predict eruption intensity and ash cloud distribution dynamically.
                </p>
              </div>
              <VolcanoSimulation params={volcanoParams} setParams={setVolcanoParams} />
            </div>
          )}

          {activeTab === 'earthquake' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#FF4D00] font-black">SEISMOLOGICAL SENSOR GROUP: E-9118</div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.1em] flex items-center italic">
                  <Activity className="w-5 h-5 mr-2 text-[#FF4D00]" /> SEISMIC FAULT STRAIN RELEASES
                </h2>
                <p className="text-sm text-white/70 font-serif border-l-2 border-[#FF4D05] pl-4 leading-relaxed max-w-4xl">
                  Simulate compressional or transform shearing. Observe hypocenter rupture velocities and S-wave sheer intervals.
                </p>
              </div>
              <EarthquakeSimulation params={earthquakeParams} setParams={setEarthquakeParams} />
            </div>
          )}

          {activeTab === 'tsunami' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#FF4D00] font-black">HYDROLOGIC SHORELINE VECTOR: T-5052</div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.1em] flex items-center italic">
                  <ShieldCheck className="w-5 h-5 mr-2 text-[#FF4D00]" /> TSUNAMI SHOALING WAVE PROPAGATION
                </h2>
                <p className="text-sm text-white/70 font-serif border-l-2 border-[#FF4D05] pl-4 leading-relaxed max-w-4xl">
                  Simulate oceanic seabed displacement and wave shoaling mechanics as depth transitions near coastal defenses or mangrove buffers.
                </p>
              </div>
              <TsunamiSimulation params={tsunamiParams} setParams={setTsunamiParams} />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#FF4D00] font-black">PLATE MARGIN TELEMETRY: M-0182</div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.1em] flex items-center italic">
                  <Compass className="w-5 h-5 mr-2 text-[#FF4D00]" /> RING OF FIRE TECTONIC RADAR
                </h2>
                <p className="text-sm text-white/70 font-serif border-l-2 border-[#FF4D05] pl-4 leading-relaxed max-w-4xl">
                  Select key subduction and transform fault hotspots along tectonic plates to analyze localized geological pressures.
                </p>
              </div>
              <GeologyMap onSelectHotspot={handleHotspotAction} />
            </div>
          )}

          {activeTab === 'survival' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#FF4D00] font-black">TACTICAL SAFETY RESPONSE: S-2299</div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.1em] flex items-center italic">
                  <HelpCircle className="w-5 h-5 mr-2 text-[#FF4D00]" /> CRISIS SURVIVAL DRILLS & GEAR DESIGN
                </h2>
                <p className="text-sm text-white/70 font-serif border-l-2 border-[#FF4D05] pl-4 leading-relaxed max-w-4xl">
                  Prepare your survival go-bag with particle masks and eye-sealed goggles, and solve essential geological survival trivia.
                </p>
              </div>
              <SurvivalGuides />
            </div>
          )}

          {activeTab === 'copilot' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-[0.4em] text-[#FF4D00] font-black">AI RESTRUCTURING ENGINES: A-9149</div>
                <h2 className="text-2xl font-black text-white uppercase tracking-[0.1em] flex items-center italic">
                  <Terminal className="w-5 h-5 mr-2 text-[#FF4D00]" /> AGNES GEOLOGIC MODEL SYNTHESIZER
                </h2>
                <p className="text-sm text-white/70 font-serif border-l-2 border-[#FF4D05] pl-4 leading-relaxed max-w-4xl">
                  Leverage artificial intelligence to generate predictive disaster chronologies or cross-examine regional tectonic threats.
                </p>
              </div>
              <AICopilot />
            </div>
          )}
        </div>

      </main>

      {/* 3. Exquisite Editorial Grid Footer matching the Design HTML */}
      <footer className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 border-t border-white/10 z-20 bg-[#050505] relative select-none">
        <div className="border-r border-b sm:border-b-0 border-white/10 p-6 bg-white/5">
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 font-mono">Simulation Mode</div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Magma Viscosity</span>
            <span className="text-xs text-[#FF4D00] font-mono font-bold tracking-widest">
              {volcanoParams.viscosity > 50 ? 'DENSE SILICA' : 'FLUID BASALT'}
            </span>
          </div>
        </div>
        <div className="border-r border-b sm:border-b-0 border-white/10 p-6">
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 font-mono">Tsunami Threat Info</div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Buoy Array</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">NOMINAL DETECT</span>
          </div>
        </div>
        <div className="border-r border-b md:border-b-0 border-white/10 p-6">
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 font-mono">Seismographic Logging</div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Fault Tension</span>
            <span className="text-xs text-[#FF4D00] font-mono font-bold">{earthquakeParams.magnitude.toFixed(1)} RICHTER</span>
          </div>
        </div>
        <div className="p-6">
          <div className="text-[9px] uppercase tracking-widest text-white/40 mb-2 font-mono">Regional Vulnerability</div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-white">Mitigation Grade</span>
            <span className="text-xs text-white/80 font-mono font-bold">94.8% PREPARED</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
