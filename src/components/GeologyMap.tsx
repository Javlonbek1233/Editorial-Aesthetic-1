import React, { useState } from 'react';
import { GeologyHotspot } from '../types';
import { Compass, Info, AlertOctagon, HelpCircle, Activity, MoveHorizontal } from 'lucide-react';

interface GeologyMapProps {
  onSelectHotspot: (hotspot: GeologyHotspot) => void;
}

// Famous global geologic hotspots along tectonic plates
const HOTSPOTS: GeologyHotspot[] = [
  {
    id: 'krakatoa',
    name: 'Anak Krakatau',
    location: 'Sunda Strait, Indonesia',
    type: 'stratovolcano',
    coordinates: { x: 74, y: 58 },
    plateBoundary: 'Indo-Australian Plate subducting beneath Eurasian Plate (Convergent)',
    riskFactor: 'High',
    funFact: 'The August 1883 eruption of Krakatoa released energy equivalent to 200 megatons of TNT—making a sound heard 4,800 km away!'
  },
  {
    id: 'san_andreas',
    name: 'San Andreas Fault Line',
    location: 'California, USA',
    type: 'fault',
    coordinates: { x: 22, y: 32 },
    plateBoundary: 'Pacific Plate sliding past North American Plate (Transform)',
    riskFactor: 'High',
    funFact: 'San Francisco and Los Angeles are on opposite sides of the fault. At 4.6 cm/year slide, they will be adjacent neighbors in 12 million years!'
  },
  {
    id: 'mariana_trench',
    name: 'Mariana Trench Subduction Area',
    location: 'Western Pacific Ocean',
    type: 'trench',
    coordinates: { x: 79, y: 44 },
    plateBoundary: 'Pacific Plate subducting beneath the small Mariana Plate (Convergent Deep Subduction)',
    riskFactor: 'Moderate',
    funFact: 'The Challenger Deep is the lowest point on earth at 10,994 meters. Fitting Mt. Everest inside leaves almost 2 kilometers of water above it!'
  },
  {
    id: 'vesuvius',
    name: 'Mount Vesuvius',
    location: 'Naples, Italy',
    type: 'stratovolcano',
    coordinates: { x: 52, y: 28 },
    plateBoundary: 'African Plate subducting under Eurasian Plate (Convergent)',
    riskFactor: 'Cataclysmic',
    funFact: 'Vesuvius is famous for burying Pompeii. It is considered one of the most dangerous volcanoes in the world because 3 million people live in its immediate blast zone.'
  },
  {
    id: 'kilauea',
    name: 'Kilauea Shield Mt.',
    location: 'Hawaii, USA',
    type: 'shield',
    coordinates: { x: 12, y: 38 },
    plateBoundary: 'Intraplate Hotspot (Mantle Plume anomaly under Pacific Plate)',
    riskFactor: 'Low',
    funFact: 'Unlike gas-clogged explosive cones, Kilauea has erupted nearly continuously since 1983, creating new land with peaceful cooling rivers of basaltic slag.'
  },
  {
    id: 'mid_atlantic',
    name: 'Mid-Atlantic Ridge',
    location: 'Atlantic Ocean Seafloor',
    type: 'shield',
    coordinates: { x: 42, y: 45 },
    plateBoundary: 'North American Plate pulling away from Eurasian Plate (Divergent)',
    riskFactor: 'Low',
    funFact: 'Mainly submerged, this ridge forms the longest mountain range in the world. Iceland is one of the rare places where it rises directly onto land!'
  }
];

export default function GeologyMap({ onSelectHotspot }: GeologyMapProps) {
  const [selectedPin, setSelectedPin] = useState<GeologyHotspot | null>(null);
  const [boundaryTest, setBoundaryTest] = useState<'convergent' | 'divergent' | 'transform'>('convergent');
  const [plateTension, setPlateTension] = useState<number>(40);

  const getTectonicResultMessage = () => {
    if (boundaryTest === 'convergent') {
      return {
        stress: "Immense compressional forces",
        crustResult: "One plate slides underneath (subduction). Rock melts into gas-rich silicate magma magma which rises to surface.",
        hazard: "Stratovolcanoes with violent Plinian eruptions, devastating mega-thrust earthquakes (M9.0+), and deep trenches."
      };
    } else if (boundaryTest === 'divergent') {
      return {
        stress: "Tensional rift pulling apart",
        crustResult: "The crust thins and cracks. Low-viscosity asthenosphere magma floats up quietly to fill the gaps.",
        hazard: "Fissure eruptions, underwater shield volcanoes (Mid-Ocean Ridges), and shallow mini-earthquakes."
      };
    } else {
      return {
        stress: "Lateral shear friction stress",
        crustResult: "Plates lock side-by-side. Stress accumulates over centuries until friction fails and they suddenly snap.",
        hazard: "Highly destructive horizontal strike-slip shallow earthquakes (like San Andreas M7.8+). Volcanoes are rare here."
      };
    }
  };

  const plateMechanics = getTectonicResultMessage();

  const handleSelect = (pin: GeologyHotspot) => {
    setSelectedPin(pin);
    onSelectHotspot(pin);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white/5 p-4 sm:p-6 rounded-none border border-white/10 relative z-10">
      
      {/* Tectonic plate map panel */}
      <div className="lg:col-span-8 flex flex-col space-y-4">
        
        <div className="relative bg-black rounded-none border border-white/10 p-2 overflow-hidden aspect-[16/10] w-full">
          
          {/* Legend HUD overlay */}
          <div className="absolute top-3 left-3 z-10 bg-black/95 font-mono text-[9px] p-3.5 rounded-none border border-white/10 text-white/50 space-y-1.5 backdrop-blur-md pointer-events-none uppercase tracking-wider">
            <p className="text-white font-black uppercase mb-1.5 tracking-widest">🌋 PACIFIC RING OF FIRE HUD</p>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-none bg-[#FF4D00] animate-pulse inline-block" />
              <span>Stratovolcano (Conical Eruption)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-none bg-orange-400 inline-block" />
              <span>Shield Volcano (Effusive Lava)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rotate-45 bg-yellow-400 inline-block" />
              <span>Rupturing Fault / Deep Trench</span>
            </div>
          </div>

          {/* Interactive Plates Map (Draw of coordinates) */}
          <div className="relative w-full h-full bg-[#0a0a0a] rounded-none overflow-hidden border border-white/5">
            
            {/* Styled vector-style tectonic grids as background SVGs */}
            <svg className="absolute inset-0 w-full h-full opacity-35 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="none" />
              {/* Convergent lines */}
              <path d="M 120,40 C 220,90 320,180 340,320" stroke="#FF4D00" strokeWidth="2.5" fill="none" strokeDasharray="5,5" />
              <path d="M 450,120 C 510,180 580,220 620,290" stroke="#FF4D00" strokeWidth="2" fill="none" />
              {/* Divergent lines */}
              <path d="M 280,240 C 310,210 380,190 410,140" stroke="#3b82f6" strokeWidth="1.5" fill="none" />
              {/* Transform lines */}
              <line x1="140" y1="110" x2="160" y2="210" stroke="#eab308" strokeWidth="2" />
              {/* Mesh background grids */}
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#222" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Simulated Land masses outline for geographical recognition */}
            <div className="absolute inset-0 opacity-25 pointer-events-none font-mono text-[9px] text-white/40">
              <span className="absolute top-[28%] left-[18%] font-semibold uppercase tracking-wider">North America</span>
              <span className="absolute top-[34%] left-[64%] font-semibold uppercase tracking-wider">Eurasia</span>
              <span className="absolute top-[68%] left-[72%] font-semibold uppercase tracking-wider">Australia</span>
              <span className="absolute top-[64%] left-[28%] font-semibold uppercase tracking-wider">Pacific Margin</span>
            </div>

            {/* Glowing Hotspot Pins */}
            {HOTSPOTS.map((pin) => {
              const isActive = selectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  id={`hotspot-pin-${pin.id}`}
                  onClick={() => handleSelect(pin)}
                  style={{ left: `${pin.coordinates.x}%`, top: `${pin.coordinates.y}%` }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer p-2 focus:outline-none z-10"
                >
                  <span className="relative flex h-3.5 w-3.5">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-none opacity-75 ${
                      isActive ? 'bg-white' : (pin.type === 'stratovolcano' ? 'bg-[#FF4D00]' : 'bg-orange-400')
                    }`} />
                    <span className={`relative inline-flex rounded-none h-3.5 w-3.5 ${
                      isActive 
                        ? 'bg-white scale-125 ring-2 ring-[#FF4D00]' 
                        : (pin.type === 'stratovolcano' ? 'bg-[#FF4D00]' : (pin.type === 'shield' ? 'bg-orange-500' : 'bg-yellow-500'))
                    }`} />
                  </span>
                  
                  {/* Mini-Label */}
                  <span className="absolute left-6 top-0 hidden group-hover:inline-block bg-black text-white text-[10px] py-1 px-2.5 rounded-none border border-white/10 font-mono whitespace-nowrap z-30 uppercase tracking-wider">
                    {pin.name}
                  </span>
                </button>
              );
            })}

            {/* Click explanation hint */}
            <div className="absolute bottom-3 right-3 text-[9px] bg-black px-2.5 py-1.5 border border-white/10 font-mono text-white/40 rounded-none uppercase tracking-wider font-bold pointer-events-none">
              🎯 Click Glowing Pins to Explore Plate Boundaries
            </div>
          </div>

        </div>

        {/* Selected hotspot description */}
        <div className="bg-black/25 p-5 rounded-none border border-white/10 space-y-3 font-mono">
          {selectedPin ? (
            <div className="space-y-3 uppercase">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[#FF4D00] font-black text-xs tracking-widest">Hotspot Profile Selected</span>
                <span className="text-[10px] px-2.5 py-1 bg-[#FF4D00]/15 text-[#FF4D00] rounded-none font-bold border border-[#FF4D00]/30 tracking-widest">RISK: {selectedPin.riskFactor}</span>
              </div>
              <h3 className="text-sm font-black text-white tracking-wider font-sans leading-none">{selectedPin.name}</h3>
              <p className="text-[11px] text-white/50 tracking-wide"><strong>LOCATION:</strong> <span className="text-white">{selectedPin.location}</span></p>
              <p className="text-[11px] text-white/50 tracking-wide"><strong>TECTONIC MARGIN:</strong> <span className="text-white">{selectedPin.plateBoundary}</span></p>
              <div className="p-4 bg-white/5 rounded-none border border-white/10 mt-3">
                <p className="text-[11px] text-white/80 leading-relaxed font-serif normal-case italic">"{selectedPin.funFact}"</p>
              </div>
            </div>
          ) : (
            <div className="h-28 flex flex-col items-center justify-center text-center text-white/40 uppercase tracking-widest leading-loose">
              <Compass className="w-8 h-8 opacity-40 mb-2.5 text-[#FF4D00] animate-pulse" />
              <p className="text-xs font-bold">No Ring of Fire Hotspot Selected</p>
              <p className="text-[9px] text-white/30 tracking-wider">Select a blinking sector on the radar overlay above to diagnose regional tectonics.</p>
            </div>
          )}
        </div>

      </div>

      {/* Plate Collisions Education Interactive Dashboard */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        
        <div className="space-y-4">
          <h3 className="text-sm font-black text-[#FF4D00] uppercase tracking-[0.2em] font-sans">Tectonic Boundary Sandbox</h3>
          <p className="text-xs text-white/50">Interact with boundary plate operations to observe thermal crust reaction forces under seismic load factors.</p>
          
          {/* Plate Selector boundary buttons */}
          <div className="space-y-2">
            <label className="text-xs text-white/50 font-mono uppercase tracking-widest font-bold">TENSION VECTOR PATTERN</label>
            <div className="flex flex-col space-y-1.5">
              {(['convergent', 'divergent', 'transform'] as const).map((b) => (
                <button
                  key={b}
                  id={`boundary-type-${b}`}
                  onClick={() => setBoundaryTest(b)}
                  className={`flex items-center justify-between p-3.5 rounded-none border font-mono transition-all text-left cursor-pointer text-xs uppercase tracking-wider font-bold ${
                    boundaryTest === b 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{b} BOUNDARY</span>
                  <MoveHorizontal className={`w-4 h-4 ${b === 'convergent' ? 'rotate-90' : (b === 'divergent' ? 'scale-x-[-1]' : 'skew-x-12')}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Slider to compress/pull plates */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono font-bold tracking-wider">
              <span className="text-white/60 uppercase">Boundary Strain Tension</span>
              <span className="text-[#FF4D00]">{plateTension} Giga-Newtons</span>
            </div>
            <input
              id="plate-tension-slider"
              type="range"
              min="10"
              max="100"
              value={plateTension}
              onChange={(e) => setPlateTension(parseInt(e.target.value))}
              className="w-full accent-[#FF4D00] h-1 bg-white/10 appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-white/30 font-mono uppercase tracking-widest">
              <span>Stable Tension</span>
              <span>Rupture Critical Strain ({plateTension > 75 ? 'SURGE ALARM' : 'BUFFER SECURE'})</span>
            </div>
          </div>
        </div>

        {/* Plate geological consequence */}
        <div className="bg-white/5 p-5 rounded-none border border-white/10 space-y-4 font-mono flex-grow">
          <div className="flex items-center space-x-2 text-white font-bold border-b border-white/10 pb-2.5">
            <Info className="w-4 h-4 text-[#FF4D00]" />
            <h4 className="text-xs uppercase tracking-widest">Crustal Dynamics Feedback</h4>
          </div>
          <div className="space-y-3.5 text-xs text-white/80 leading-relaxed font-mono uppercase tracking-wider">
            <p>
              <strong className="text-white/40 block text-[9px] mb-0.5">Friction Vector</strong> 
              <span className={plateTension > 75 ? "text-red-400 font-bold animate-pulse" : "text-[#FF4D00] font-bold"}>{plateMechanics.stress}</span>
            </p>
            <p>
              <strong className="text-white/40 block text-[9px] mb-0.5">Crust Reaction</strong> 
              <span className="text-white/95 leading-normal lowercase first-letter:uppercase block">{plateMechanics.crustResult}</span>
            </p>
            <p>
              <strong className="text-white/40 block text-[9px] mb-0.5">Threat Level</strong> 
              <span className="text-white/95 leading-normal lowercase first-letter:uppercase block">{plateMechanics.hazard}</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
