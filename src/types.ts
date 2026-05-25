export interface VolcanoParams {
  type: 'stratovolcano' | 'shield' | 'supervolcano';
  viscosity: number;          // 1 to 100
  gasConcentration: number;   // 1 to 100
  chamberDepth: number;       // km (1 to 15)
  pressure: number;           // calculated dynamic megapascal value
  isErupting: boolean;
  eruptionIntensity: number;  // VEI index value 1-8
  ashColumnHeight: number;    // calculated km
}

export interface EarthquakeParams {
  magnitude: number;          // Richter scale 1 to 10
  depth: number;              // km (5 to 150)
  faultType: 'strike-slip' | 'normal' | 'reverse';
  isRupturing: boolean;
  epicenterX: number;         // visual epicenter canvas placement
  epicenterY: number;
}

export interface TsunamiParams {
  epicenterMagnitude: number;
  displacementVolume: number; // cubic km
  shoreSpeed: number;         // km/h
  seawallEnabled: boolean;
  forestBufferEnabled: boolean;
  isSimulating: boolean;
  waveAmplitude: number;      // current height of wave in meters
  damageAssessment: string;
}

export interface GeologyHotspot {
  id: string;
  name: string;
  location: string;
  type: 'stratovolcano' | 'shield' | 'trench' | 'fault';
  coordinates: { x: number; y: number }; // Percentage offsets on grid map
  plateBoundary: string; // Tectonic plates involved
  riskFactor: 'Low' | 'Moderate' | 'High' | 'Cataclysmic';
  funFact: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of options
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agnes';
  text: string;
  timestamp: string;
}

export interface ScenarioTimelineStep {
  time: string;
  title: string;
  description: string;
}

export interface CustomScenarioResult {
  title: string;
  timeline: ScenarioTimelineStep[];
  warnings: string[];
  mitigation: string[];
  survivalTip: string;
}
