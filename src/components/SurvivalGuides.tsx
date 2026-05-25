import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { Backpack, ShieldAlert, CheckSquare, Square, Award, ArrowRight, RefreshCw, Layers, Flame, Compass } from 'lucide-react';

// Highly educational survival trivia challenges
const SURVIVAL_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    question: "During a major earthquake, you are indoors. What is the safest immediate course of action?",
    options: [
      "Run outside immediately to get clear of walls",
      "Drop, Cover, and Hold On under a sturdy table",
      "Take an elevator down to the basement refuge",
      "Stand under a doorway archway structural frame"
    ],
    correctAnswer: 1,
    explanation: "Drop, Cover, and Hold On is the gold standard. Running tries to traverse shifting flooring while debris/masonry falls outwards. Elevators will lock up, and modern drywall doorframes offer no structural protection over standard ceilings."
  },
  {
    id: 2,
    question: "Which item is critically unique for a volcanic ashfall go-bag that is usually missing in normal storm preparedness kits?",
    options: [
      "Water purification tablets",
      "Thermal blankets",
      "Goggles & N95 / PM2.5 respirator dust mask",
      "Handheld metal compass"
    ],
    correctAnswer: 2,
    explanation: "Volcanic ash consists of microscopic sharp shards of pulverized volcanic glass and rock. Breathing it tears alveolar lung walls (causing silicosis) and gets in eyes causing corneal scratching. Regular surgical masks do not block this; N95 filters and goggles are absolutely required."
  },
  {
    id: 3,
    question: "You are at a beach and notice the sea level suddenly and dramatically recedes, exposing ocean corals and sea creatures. What does this mean?",
    options: [
      "An astronomical low tide anomaly is active",
      "An offshore tsunami crest is forming. Climb to high ground immediately!",
      "A subterranean fault has opened underneath pulling water into crust",
      "The local subduction zone has temporarily locked solid"
    ],
    correctAnswer: 1,
    explanation: "This is a classic Tsunami warning sign called 'drawback' (wave trough arrival). In deep water, tsunami waves are wide and shallow, but when approaching shore the bottom friction slows down the leading edge of the crest, drawing beach water rapidly into the swell. It means a towering wave wall will crash within 3 to 15 minutes. Climb immediately to 30 meters height or move 2 km inland."
  },
  {
    id: 4,
    question: "What is a 'Lahar', and when is it a hazard?",
    options: [
      "A fast-flowing mixture of water and volcanic debris/ash sliding down slopes",
      "A deep sub-surface slow creep along a transform fault",
      "A poisonous cloud of carbonic gases venting from volcanic craters",
      "A sonic shockwave generated during hyper-Plinian eruptions"
    ],
    correctAnswer: 0,
    explanation: "Lahars are liquid mudslides composed of deep volcanic ash mixed with rainwater or melting glaciers. They have the consistency of wet concrete, move quickly (up to 80 km/h) down river valleys, and can bury entire cities miles away from active vents."
  }
];

// Go-bag supply checklist items
interface SupplyItem {
  id: string;
  name: string;
  category: 'critical' | 'utility' | 'medical';
  description: string;
}

const SUPPLIES_DB: SupplyItem[] = [
  { id: 'mask', name: 'N95 Particle Mask', category: 'critical', description: 'Blocks sharp volcanic glass ash dust.' },
  { id: 'goggles', name: 'Sealed Eye Goggles', category: 'critical', description: 'Protects eyes from corrosive sulfur gas and abrasive dust.' },
  { id: 'radio', name: 'FM Handcrank Radio', category: 'utility', description: 'Receives vital civil instructions when cellular towers collapse.' },
  { id: 'flashlight', name: 'LED Torch + Extra Batteries', category: 'utility', description: 'Essential during dark skies blocked by heavy ash clouds.' },
  { id: 'water', name: '3 Liters of Sealed Water', category: 'critical', description: 'Critical because ashfall contaminates local surface reservoirs.' },
  { id: 'whistle', name: 'Heavy Rescue Whistle', category: 'critical', description: 'Allows searches to locate you if trapped under ceiling rubble.' },
  { id: 'aid_kit', name: 'Trauma Bandage First-Aid Kit', category: 'medical', description: 'Treats abrasions and compression gashes.' },
  { id: 'blanket', name: 'Mylar Emergency Blanket', category: 'utility', description: 'Retains 90% body heat in volcanic winters or rain disasters.' }
];

export default function SurvivalGuides() {
  const [backpack, setBackpack] = useState<string[]>(['water', 'flashlight']);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [survivalCategory, setSurvivalCategory] = useState<'earthquake' | 'volcano' | 'tsunami'>('volcano');

  const toggleBackpackItem = (id: string) => {
    setBackpack(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
  };

  const submitAnswer = () => {
    if (selectedOption === null || isAnswered) return;
    
    const currentQuestion = SURVIVAL_QUIZ[currentQuizIndex];
    if (selectedOption === currentQuestion.correctAnswer) {
      setScore(prev => prev + 1);
    }
    setIsAnswered(true);
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    if (currentQuizIndex + 1 < SURVIVAL_QUIZ.length) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizFinished(false);
  };

  // Evaluate Backpack preparedness count
  const calculatePreparedness = () => {
    const hasAshProtection = backpack.includes('mask') && backpack.includes('goggles');
    const hasLifeSupport = backpack.includes('water') && backpack.includes('aid_kit');
    const hasComms = backpack.includes('radio') && backpack.includes('flashlight');

    let percent = Math.round((backpack.length / SUPPLIES_DB.length) * 100);

    return { percent, hasAshProtection, hasLifeSupport, hasComms };
  };

  const prep = calculatePreparedness();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
      
      {/* Go-Bag compiler module */}
      <div className="lg:col-span-4 bg-white/5 p-4 sm:p-6 rounded-none border border-white/10 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-[#FF4D00] font-sans">
            <Backpack className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Survival Go-Bag Compiler</h3>
          </div>
          <p className="text-xs text-white/50">Assemble an emergency tactical backpack. Select critical assets to unlock localized hazard resistances.</p>
          
          {/* Packing checklist selector items */}
          <div className="space-y-1.5 mt-4 max-h-[300px] overflow-y-auto pr-1">
            {SUPPLIES_DB.map((item) => {
              const checked = backpack.includes(item.id);
              return (
                <button
                  key={item.id}
                  id={`bag-item-${item.id}`}
                  onClick={() => toggleBackpackItem(item.id)}
                  className={`w-full flex items-start text-left p-3 rounded-none border font-mono transition-all text-xs cursor-pointer ${
                    checked 
                      ? 'bg-white text-black border-white' 
                      : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="mr-2.5 pt-0.5">
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#FF4D00] flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-white/20 flex-shrink-0" />
                    )}
                  </span>
                  <div>
                    <p className="font-bold text-[11px] uppercase tracking-wider">{item.name}</p>
                    <p className="text-[10px] text-white/55 leading-normal mt-0.5">{item.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ready stats HUD */}
        <div className="bg-black/40 p-4 rounded-none border border-white/10 space-y-3 font-mono mt-4">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
            <span className="text-white/40">Emergency Safety Rating</span>
            <span className={`font-black ${prep.percent > 70 ? 'text-emerald-400' : (prep.percent > 40 ? 'text-[#FF4D00]' : 'text-red-500')}`}>
              {prep.percent}% PREPARED
            </span>
          </div>
          
          {/* progress bar */}
          <div className="w-full bg-white/10 rounded-none h-1 overflow-hidden">
            <div 
              style={{ width: `${prep.percent}%` }}
              className={`h-full transition-all duration-300 ${prep.percent > 70 ? 'bg-emerald-400' : (prep.percent > 40 ? 'bg-[#FF4D00]' : 'bg-red-500')}`} 
            />
          </div>

          <div className="space-y-1.5 text-[9px] pt-1 text-white/60 tracking-wider">
            <div className="flex justify-between">
              <span>VOLCANIC ASH SHIELD:</span>
              <span className={prep.hasAshProtection ? "text-emerald-400 font-bold" : "text-white/30"}>
                {prep.hasAshProtection ? "SECURED (MASK+GOGGLES)" : "VULNERABLE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>BASIC LIFE HYDRATION:</span>
              <span className={prep.hasLifeSupport ? "text-emerald-400 font-bold" : "text-white/30"}>
                {prep.hasLifeSupport ? "SECURED" : "VULNERABLE"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Guide protocols & survival checklists */}
      <div className="lg:col-span-8 bg-white/5 p-4 sm:p-6 rounded-none border border-white/10 flex flex-col justify-between">
        
        {/* Guides layout */}
        <div className="space-y-4 font-mono">
          <div className="flex border-b border-white/10">
            {(['volcano', 'earthquake', 'tsunami'] as const).map((cat) => (
              <button
                key={cat}
                id={`survival-tab-${cat}`}
                onClick={() => setSurvivalCategory(cat)}
                className={`py-2 px-4 text-xs font-mono font-bold tracking-widest relative transition-colors cursor-pointer uppercase ${
                  survivalCategory === cat ? 'text-[#FF4D00] border-b-2 border-[#FF4D00]' : 'text-white/50 hover:text-white'
                }`}
              >
                {cat === 'volcano' ? <Flame className="w-3.5 h-3.5 inline mr-1" /> : (cat === 'earthquake' ? <Award className="w-3.5 h-3.5 inline mr-1" /> : <Compass className="w-3.5 h-3.5 inline mr-1" />)}
                <span>{cat} GUIDE</span>
              </button>
            ))}
          </div>

          {/* Detailed instructional content */}
          <div className="p-5 bg-black/40 rounded-none border border-white/10 font-mono text-xs text-white/70 leading-relaxed max-h-[220px] overflow-y-auto">
            {survivalCategory === 'volcano' && (
              <div className="space-y-3">
                <h4 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center"><ShieldAlert className="w-4 h-4 text-[#FF4D00] mr-2" /> ASHFALL & PYROCLASTIC PROTOCOL</h4>
                <p>1. <strong className="text-[#FF4D00]">Seal Inhabitation Barriers:</strong> Turn off standard air conditioning units (HVAC). Block window jambs with wet towels to neutralize fine silica dust leakage.</p>
                <p>2. <strong className="text-white/90">Water Reservoir Care:</strong> Do not consume local surface water. Volcanic ash quickly dissolves toxic heavy metals (lead, arsenic) and hydrofluoric acids into local rivers.</p>
                <p>3. <strong className="text-white/90">Pyroclastic Flows (PDCs):</strong> These are superheated gas clouds (up to 800°C) traveling down slopes at hurricane speeds. Structural walls offer zero safety; absolute prior evacuation is the only mitigation trigger.</p>
                <p>4. <strong className="text-white/90">Goggles over Contacts:</strong> Never wear contact lenses during ashfall — silica dust gets trapped beneath the lens, scratching the cornea permanently.</p>
              </div>
            )}
            {survivalCategory === 'earthquake' && (
              <div className="space-y-3">
                <h4 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center"><ShieldAlert className="w-4 h-4 text-[#FF4D00] mr-2" /> STRUCTURAL FRACTURING PROTOCOL</h4>
                <p>1. <strong className="text-[#FF4D00]">Stay Inside standard walls:</strong> Do not sprint outside during the active peak shaking. Most injuries occur as external brick masonry facade, glass canopies, and fire escapes shear off outside door paths.</p>
                <p>2. <strong className="text-white/90">Crawl, Cover, Hold On:</strong> Stabilize under a dense dining table or wood frame desk. Hold onto its legs tightly—otherwise, shaking moves the desk away from your cover.</p>
                <p>3. <strong className="text-white/90">Secondary Fire Hazard:</strong> Instantly shut off local main gas valves after shaking ceases. Structural fissures usually tear gas main headers, and sparks trigger urban firestorms.</p>
                <p>4. <strong className="text-white/90">Trapped under loads:</strong> Do not scream continuously (inhaling concrete drywall dust). Tap metallic pipes rhythmically (three taps) with stones to alert sound-sensing search responders.</p>
              </div>
            )}
            {survivalCategory === 'tsunami' && (
              <div className="space-y-3">
                <h4 className="text-white font-black uppercase text-[11px] tracking-widest flex items-center"><ShieldAlert className="w-4 h-4 text-[#FF4D00] mr-2" /> HYDRODYNAMIC EXTREME PROTOCOL</h4>
                <p>1. <strong className="text-[#FF4D00]">Ascend Immediately:</strong> If you feel high coastal shaking or observe drawback seawater drying out sea animals, flee to heights of 30+ meters instantly.</p>
                <p>2. <strong className="text-white/90">Vertical Refuge Selection:</strong> If flat land blocks runaways, seek refuge on the 4th floor or higher of a heavily reinforced steel-ductile reinforced concrete building.</p>
                <p>3. <strong className="text-white/90">Double Wave Threat:</strong> Tsunami headers are NOT a single wave—they are a series of bore surges spaced 10 to 45 minutes apart. The first wave is rarely the largest; never return to beach levels until official seismologists lift civil warnings.</p>
              </div>
            )}
          </div>
        </div>

        {/* Trivia survival game */}
        <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
          <div className="flex items-center justify-between font-mono">
            <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center">
              <Award className="w-4.5 h-4.5 mr-2 text-[#FF4D00]" /> Survival Trivia Challenge
            </h3>
            <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">SCORE: {score} / {SURVIVAL_QUIZ.length}</span>
          </div>

          {quizFinished ? (
            <div className="bg-black/45 p-6 rounded-none border border-white/10 text-center space-y-3 font-mono">
              <p className="text-[#FF4D00] font-black uppercase text-xs tracking-widest">🎓 Survival Training Session Concluded!</p>
              <p className="text-[11px] text-white/70 uppercase">Total Score: {score} out of {SURVIVAL_QUIZ.length} questions correctly identified.</p>
              {score === SURVIVAL_QUIZ.length ? (
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">Grade: Master Seismologist Officer. Ultimate Preparedness status secured.</p>
              ) : (
                <p className="text-orange-400 text-[10px] font-black uppercase tracking-wider">Grade: Cadet. Review survival notes to reinforce geological knowledge reserves.</p>
              )}
              <button
                id="reset-trivia-quiz-btn"
                onClick={resetQuiz}
                className="mt-4 text-xs text-black hover:text-[#FF4D00] hover:bg-black font-black flex items-center justify-center space-x-2 border border-transparent px-6 py-3 rounded-none bg-white transition cursor-pointer uppercase tracking-widest"
              >
                <RefreshCw className="w-3.5 h-3.5" /> <span>RESTART DRILL</span>
              </button>
            </div>
          ) : (
            <div className="bg-black/20 p-4 sm:p-5 rounded-none border border-white/10 font-mono space-y-3">
              <p className="text-white text-xs font-bold leading-relaxed tracking-wide uppercase">
                Q{currentQuizIndex + 1}: {SURVIVAL_QUIZ[currentQuizIndex].question}
              </p>

              {/* Multiple Choice Radio Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {SURVIVAL_QUIZ[currentQuizIndex].options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isAnsweredCorrectly = idx === SURVIVAL_QUIZ[currentQuizIndex].correctAnswer;
                  
                  let optionClass = "bg-transparent border-white/10 text-white/60 hover:text-white hover:bg-white/5";
                  if (isSelected && !isAnswered) {
                    optionClass = "bg-[#FF4D00] border-[#FF4D00] text-black font-black";
                  } else if (isAnswered) {
                    if (isAnsweredCorrectly) {
                      optionClass = "bg-emerald-950/40 border-emerald-600 text-emerald-400 font-bold";
                    } else if (isSelected) {
                      optionClass = "bg-red-950/40 border-red-800 text-red-400 font-bold";
                    } else {
                      optionClass = "bg-black/40 opacity-30 text-white/30 border-white/5";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      id={`quiz-option-${idx}`}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={isAnswered}
                      className={`py-3 px-4 text-left text-[11px] rounded-none font-mono border transition-all cursor-pointer ${optionClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanatory detail box */}
              {isAnswered && (
                <div className="mt-3 p-4 bg-black/50 rounded-none border border-white/10 text-[10.5px] leading-relaxed text-white/80 uppercase">
                  <p className="font-bold text-[#FF4D00] mb-1 tracking-widest">
                    {selectedOption === SURVIVAL_QUIZ[currentQuizIndex].correctAnswer ? "✓ EXCELLENT REACTION COGNITION" : "✗ STRATEGY INSUFFICIENT"}
                  </p>
                  <p>{SURVIVAL_QUIZ[currentQuizIndex].explanation}</p>
                </div>
              )}

              {/* Actions submit/next buttons */}
              <div className="flex justify-end pt-2">
                {!isAnswered ? (
                  <button
                    id="submit-quiz-answer-btn"
                    onClick={submitAnswer}
                    disabled={selectedOption === null}
                    className={`px-5 py-2.5 rounded-none font-mono text-xs font-black transition-all text-black bg-white hover:bg-[#FF4D00] cursor-pointer tracking-wider uppercase ${
                      selectedOption === null ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    SUBMIT EVALUATION
                  </button>
                ) : (
                  <button
                    id="next-quiz-question-btn"
                    onClick={nextQuestion}
                    className="px-5 py-2.5 rounded-none font-mono text-xs font-black transition-all bg-[#FF4D00] text-black hover:bg-white border-none flex items-center space-x-1 cursor-pointer tracking-wider uppercase"
                  >
                    <span>CONTINUE DRILL</span> <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
