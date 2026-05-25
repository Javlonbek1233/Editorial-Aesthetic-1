import React, { useState } from 'react';
import { ChatMessage, CustomScenarioResult, ScenarioTimelineStep } from '../types';
import { Send, Terminal, Cpu, RefreshCw, AlertTriangle, Play, HelpCircle, Compass } from 'lucide-react';

export default function AICopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'agnes',
      text: "Vessel status: SECURE. Seismic core online. I am AGNES (Advanced Geological Network and Exploration System). Input your geological questions or specify parameters on the right to simulate custom cross-disaster scenarios.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [errorChat, setErrorChat] = useState<string | null>(null);

  // Scenario Simulator variables
  const [sVolcano, setSVolcano] = useState<string>('stratovolcano');
  const [sMagnitude, setSMagnitude] = useState<number>(7.8);
  const [sLocation, setSLocation] = useState<string>('Cascadia Subduction Margin');
  const [isScenarioLoading, setIsScenarioLoading] = useState<boolean>(false);
  const [scenarioResult, setScenarioResult] = useState<CustomScenarioResult | null>(null);
  const [errorScenario, setErrorScenario] = useState<string | null>(null);

  // Chat conversation core handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatLoading) return;

    setErrorChat(null);
    const userText = inputMessage;
    setInputMessage('');

    const newUserMessage: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        })
      });

      const data = await response.json();
      if (response.status !== 200 || data.error) {
        throw new Error(data.error || "Failed content generation request");
      }

      const agnesResponse: ChatMessage = {
        id: Math.random().toString(),
        role: 'agnes',
        text: data.text || "Report empty. Try adjusting variables.",
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, agnesResponse]);
    } catch (err: any) {
      console.error(err);
      setErrorChat(err.message || 'Seismologist database timeout. Please check your GEMINI_API_KEY environment configuration inside Secrets.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Chronological custom scenario generator handler
  const triggerCustomScenario = async () => {
    if (isScenarioLoading) return;

    setIsScenarioLoading(true);
    setErrorScenario(null);
    setScenarioResult(null);

    try {
      const response = await fetch('/api/gemini/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volcanoType: sVolcano,
          magnitude: sMagnitude,
          location: sLocation
        })
      });

      const data = await response.json();
      if (response.status !== 200 || data.error) {
        throw new Error(data.error || "Simulation pipeline failed");
      }

      setScenarioResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorScenario(err.message || "Synthesis failure. Make sure your GEMINI_API_KEY is configured under Settings to synthesize complex multi-threat models.");
    } finally {
      setIsScenarioLoading(false);
    }
  };

  const getPresetPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
      
      {/* 1. AGNES Chat Console terminal */}
      <div className="lg:col-span-7 bg-black p-4 sm:p-6 rounded-none border border-white/10 flex flex-col justify-between h-[550px]">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
          <div className="flex items-center space-x-2.5 text-[#FF4D00] font-bold tracking-widest">
            <Terminal className="w-4 h-4 text-[#FF4D00]" />
            <span>AGNES TERMINAL CORE (ACTIVE)</span>
          </div>
          <div className="flex items-center space-x-1.5 text-white/30 uppercase tracking-widest text-[9px] font-bold">
            <span className="w-2 h-2 rounded-none bg-emerald-500 animate-pulse" />
            <span>SECURE PROXY</span>
          </div>
        </div>

        {/* Message Traces output */}
        <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 font-mono text-xs text-white/70">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex flex-col space-y-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Sender layout flag */}
              <span className="text-[9px] text-white/40 tracking-wider uppercase font-bold">
                {m.role === 'user' ? 'COGNITIVE OPERATOR' : 'A.G.N.E.S.'} — {m.timestamp}
              </span>
              
              {/* Dialogue balloon */}
              <div 
                className={`max-w-[85%] rounded-none p-3.5 leading-relaxed border ${
                  m.role === 'user' 
                    ? 'bg-[#FF4D00]/10 border-[#FF4D00] text-white' 
                    : 'bg-white/5 border-white/10 text-white/80'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {isChatLoading && (
            <div className="flex items-center space-x-2 text-white/40 animate-pulse font-mono text-[10px] uppercase tracking-wider">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF4D00]" />
              <span>AGNES IS TRACING CORRELATIONS...</span>
            </div>
          )}

          {errorChat && (
            <div className="bg-red-950/40 border border-red-900/60 p-4 rounded-none text-red-400 space-y-1.5 uppercase">
              <div className="flex items-center space-x-2 font-black text-[11px] tracking-wider">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-[#FF4D00]" />
                <span>GEOLOGIC API REPORT TIMEOUT</span>
              </div>
              <p className="text-[10px] leading-relaxed lowercase first-letter:uppercase">{errorChat}</p>
            </div>
          )}
        </div>

        {/* Text Area Form input */}
        <form onSubmit={handleSendMessage} className="space-y-3">
          {/* Quick preset suggestions */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              id="preset-ash-danger"
              onClick={() => getPresetPrompt("What is a pyroclastic density current?")}
              className="px-3 py-1.5 rounded-none bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-[9px] transition cursor-pointer font-mono uppercase tracking-wider font-bold"
            >
              “What is a pyroclastic cloud?”
            </button>
            <button
              type="button"
              id="preset-tsunami-wave"
              onClick={() => getPresetPrompt("Explain how subduction zone earthquakes trigger mega-tsunamis")}
              className="px-3 py-1.5 rounded-none bg-transparent border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-[9px] transition cursor-pointer font-mono uppercase tracking-wider font-bold"
            >
              “How do subduction earthquakes cause tsunamis?”
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="copilot-chat-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Query structural geology or survival vectors..."
              className="flex-1 bg-[#0c0c0c] border border-white/10 rounded-none px-4 py-3 text-xs focus:outline-none focus:border-[#FF4D00] font-mono text-white placeholder-white/30 uppercase tracking-wide"
            />
            <button
              type="submit"
              id="copilot-chat-submit"
              disabled={isChatLoading || !inputMessage.trim()}
              className="p-3.5 rounded-none bg-[#FF4D00] text-black hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>

      </div>

      {/* 2. Chronological Custom Scenario timeline forecaster */}
      <div className="lg:col-span-5 bg-white/5 p-4 sm:p-6 rounded-none border border-white/10 flex flex-col justify-between h-[550px] overflow-hidden">
        
        <div className="space-y-4 flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center space-x-2 text-[#FF4D00] font-sans border-b border-white/10 pb-2 flex-shrink-0">
            <Cpu className="w-5 h-5 text-[#FF4D00]" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Multi-Hazard Forecaster</h3>
          </div>
          
          {/* Custom controls selector */}
          <div className="space-y-3 font-mono text-xs flex-shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-white/40 block mb-1 uppercase tracking-widest font-bold">ERUPT VECTOR</label>
                <select
                  id="forecaster-volcano-select"
                  value={sVolcano}
                  onChange={(e) => setSVolcano(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-white/10 rounded-none px-2 py-2 text-white/80 focus:outline-none focus:border-[#FF4D00] text-[11px] uppercase font-bold tracking-wider"
                >
                  <option value="stratovolcano">Stratovolcano</option>
                  <option value="shield volcano">Shield Mount</option>
                  <option value="supervolcano caldera">Supervolcano caldera</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] text-white/40 block mb-1 uppercase tracking-widest font-bold">STRESS BRACKET</label>
                <select
                  id="forecaster-magnitude-select"
                  value={sMagnitude}
                  onChange={(e) => setSMagnitude(parseFloat(e.target.value))}
                  className="w-full bg-[#0c0c0c] border border-white/10 rounded-none px-2 py-2 text-white/80 focus:outline-none focus:border-[#FF4D00] text-[11px] uppercase font-bold tracking-wider"
                >
                  <option value="6.5">M 6.5 Strong</option>
                  <option value="7.8">M 7.8 Major</option>
                  <option value="9.1">M 9.1 Cataclysmic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-white/40 block mb-1 uppercase tracking-widest font-bold">GEOLOGICAL TARGET VECTOR</label>
              <input
                id="forecaster-location-input"
                type="text"
                value={sLocation}
                onChange={(e) => setSLocation(e.target.value)}
                placeholder="Zone target, e.g., Seattle coast"
                className="w-full bg-[#0c0c0c] border border-white/10 rounded-none px-2.5 py-2 text-white/80 focus:outline-none focus:border-[#FF4D00] text-[11px] placeholder-white/20 uppercase tracking-wider font-bold"
              />
            </div>

            <button
              id="trigger-forecaster-btn"
              onClick={triggerCustomScenario}
              disabled={isScenarioLoading}
              className="w-full py-3.5 rounded-none bg-[#FF4D00] hover:bg-white text-black hover:text-[#FF4D00] font-black tracking-widest text-xs flex items-center justify-center space-x-1.5 cursor-pointer uppercase border-none"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isScenarioLoading ? "SYNTHESIZING MODEL..." : "SYNTHESIZE SCENARIO"}</span>
            </button>
          </div>

          {/* Forecast display terminal body */}
          <div className="flex-1 overflow-y-auto bg-[#0a0a0a] rounded-none border border-white/10 p-5 font-mono text-xs">
            {isScenarioLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-3 uppercase tracking-widest">
                <RefreshCw className="w-7 h-7 text-[#FF4D00] animate-spin" />
                <p className="font-black text-xs text-white">Chronology Generator Active</p>
                <p className="text-[9px] text-white/30 leading-normal">Simulating tectonic shear lines, hydrothermal water column impacts, and seismic shockwave velocities...</p>
              </div>
            ) : errorScenario ? (
              <div className="text-red-400 space-y-2 uppercase">
                <p className="font-black text-[11px] tracking-widest flex items-center"><AlertTriangle className="w-4 h-4 mr-1 text-[#FF4D00]" /> Core Generator Fault</p>
                <p className="text-[10.5px] leading-relaxed lowercase first-letter:uppercase">{errorScenario}</p>
              </div>
            ) : scenarioResult ? (
              <div className="space-y-4">
                <div className="border-b border-white/10 pb-3">
                  <h4 className="text-[#FF4D00] font-black uppercase text-[10px] tracking-widest">GEOLOGIC FORECAST TIMELINE</h4>
                  <p className="text-white text-[13px] font-black uppercase mt-1 tracking-wider font-sans leading-tight">{scenarioResult.title}</p>
                </div>

                {/* Vertical timeline steps */}
                <div className="space-y-5 relative pl-3.5 border-l border-white/10">
                  {scenarioResult.timeline?.map((step: ScenarioTimelineStep, sIdx: number) => (
                    <div key={sIdx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[18.5px] top-1 w-2.5 h-2.5 rounded-none bg-[#FF4D00]" />
                      <p className="text-[#FF4D00] font-black text-[10px] uppercase tracking-wider">{step.time} — {step.title}</p>
                      <p className="text-[10.5px] text-white/70 leading-relaxed mt-1">{step.description}</p>
                    </div>
                  ))}
                </div>

                {/* Survival warning info */}
                {scenarioResult.survivalTip && (
                  <div className="mt-5 p-4 bg-white/5 border border-white/10 rounded-none text-emerald-400 text-[10.5px] uppercase tracking-wider">
                    <p className="font-black mb-1.5 text-white/95 text-[10px] tracking-widest">💡 SEISMOLOGIST CORE ADVICE</p>
                    <p className="leading-relaxed text-white/70 normal-case">{scenarioResult.survivalTip}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-white/40 uppercase tracking-widest leading-loose">
                <Terminal className="w-8 h-8 opacity-30 mb-2.5 text-[#FF4D00]" />
                <p className="text-xs font-black text-white">Tactical Forecaster Idle</p>
                <p className="text-[9px] text-white/30 tracking-wider">Configure your volcanic/seismic vectors above and click "Synthesize Scenario" to model localized destruction vectors.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
