import { useState } from "react";
import { INITIAL_SESSION_DATA } from "./data";
import { SessionData } from "./types";
import { VideoPlayer } from "./components/VideoPlayer";
import { CustomizerPanel } from "./components/CustomizerPanel";
import { GeminiPanel } from "./components/GeminiPanel";
import { Compass, Headphones, Sparkles, Youtube, Layers, AlertCircle, Info, HelpCircle } from "lucide-react";

export default function App() {
  // Session Configuration Data State
  const [sessionData, setSessionData] = useState<SessionData>(INITIAL_SESSION_DATA);

  // Active Segment Identifier
  const [activeSegmentId, setActiveSegmentId] = useState<string>("block_1_alpha");

  // Playback Speeds toggles (Fast track is 120x)
  const [isFastTrack, setIsFastTrack] = useState<boolean>(true);

  // Master playback elapsed time tracked
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);

  // Force seek position coordinates
  const [forceSec, setForceSec] = useState<number | null>(null);

  // Mixing Console Volumetrics Slider State
  const [ambientVolume, setAmbientVolume] = useState<number>(0.2);
  const [binauralVolume, setBinauralVolume] = useState<number>(0.1);
  const [doodleVolume, setDoodleVolume] = useState<number>(0.15);

  const meta = sessionData.video_prompt.meta;
  const segments = sessionData.video_prompt.segments;

  return (
    <div id="app_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-300">
      
      {/* HEADER SECTION BAR */}
      <header id="main_header" className="bg-slate-900/40 border-b border-slate-800/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div id="branding_badge" className="p-2 bg-gradient-to-tr from-teal-500/20 to-sky-500/20 rounded-xl border border-teal-500/20 shadow-inner">
              <Compass className="w-6 h-6 text-teal-400 rotate-12" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 font-sans tracking-tight">Estudio de Producción Auditiva</h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Focus Video & YouTube Creator</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Active Video Settings Badges */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Total:</span>
              <span className="text-xs font-bold text-teal-400 font-mono">{meta.total_duration_minutes} min</span>
              <span className="text-slate-700 font-mono">|</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">{meta.resolution}</span>
              <span className="text-slate-700 font-mono">|</span>
              <span className="text-xs font-semibold text-slate-300 font-mono">{meta.frame_rate}fps</span>
            </div>
          </div>

        </div>
      </header>

      {/* CORE WORKSPACE */}
      <main id="main_content" className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-6 py-6 flex flex-col gap-8">
        
        {/* UPPER BANNER HERO WITH METADATA BRIEF */}
        <div id="meta_brief_banner" className="bg-gradient-to-r from-slate-900/60 to-slate-800/10 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row items-start justify-between gap-6 relative overflow-hidden">
          {/* Subtle decoration vector arches */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-teal-500/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col gap-2 max-w-2xl relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[10px] font-mono font-bold uppercase rounded border border-teal-500/20 tracking-wider">
                PROYECTO ACTIVO DE VIDEO
              </span>
            </div>
            <h2 id="active_video_title" className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight leading-tight">
              {meta.title}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl font-sans">
              <strong>Audiencia Objetivo:</strong> {meta.target_audience}. 
              Esta sesión guiada se compone de Ondas Alfa estimuladoras en el Bloque 1, una pausa de dibujo Doodle en lápiz para evitar sobrecarga cognitiva, Ondas Gamma cognitivas en el Bloque 2, y cierra con relajación cuadrada Box Breathing.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl relative z-10 shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold font-sans">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Aviso de Salud Importante</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs font-sans">
              Las frecuencias son generadas en estéreo para crear ondas binaurales. No recomendado para personas con epilepsia fotosensible o antecedentes de convulsiones. Use auriculares.
            </p>
          </div>
        </div>

        {/* WORK BENCH BENTO-GRID SYSTEM */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 1. LEFT GRID: Simulator Interactive Player & AI Designer Prompt (3/5 width) */}
          <div className="lg:col-span-3 flex flex-col gap-8">
            
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  <span>Simulador de Video en Tiempo Real</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Vista Previa Interactiva 16:9</span>
              </div>
              <VideoPlayer 
                sessionData={sessionData}
                activeSegmentId={activeSegmentId}
                setActiveSegmentId={setActiveSegmentId}
                isFastTrack={isFastTrack}
                setIsFastTrack={setIsFastTrack}
                onTimeUpdate={(sec) => setCurrentTimeSec(sec)}
                forceSec={forceSec}
                clearForceSec={() => setForceSec(null)}
                ambientVolume={ambientVolume}
                binauralVolume={binauralVolume}
                doodleVolume={doodleVolume}
              />
            </div>

            {/* AI Generator prompt panel */}
            <div className="flex flex-col gap-2">
              <span id="label_ai_designer" className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Diseño Personalizado con IA</span>
              </span>
              <GeminiPanel 
                onLoadSession={(data) => {
                  setSessionData(data);
                  setActiveSegmentId(data.video_prompt.segments[0].id);
                  setForceSec(0);
                  setCurrentTimeSec(0);
                }}
                onResetToDefault={() => {
                  setSessionData(INITIAL_SESSION_DATA);
                  setActiveSegmentId(INITIAL_SESSION_DATA.video_prompt.segments[0].id);
                  setForceSec(0);
                  setCurrentTimeSec(0);
                }}
              />
            </div>

          </div>

          {/* 2. RIGHT GRID: Phase Trackers Lists & Visual Indicators (2/5 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* PIPELINE PHASES TRACKING VIEWPORTS */}
            <div id="pipeline_trackers_viewcard" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800/60">
                <Layers className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">Progreso de la Sesión</h3>
              </div>

              <div className="flex flex-col gap-3">
                {segments.map((seg, idx) => {
                  const isActive = seg.id === activeSegmentId;
                  
                  // Calculate percentage progress inside this segment
                  let progressPercent = 0;
                  if (isActive) {
                    let totalSec = seg.duration_minutes * 60;
                    
                    // Recover previous segments offset
                    let prevSecSum = 0;
                    for (let j = 0; j < idx; j++) {
                      prevSecSum += segments[j].duration_minutes * 60;
                    }
                    const relSec = Math.max(currentTimeSec - prevSecSum, 0);
                    progressPercent = Math.min((relSec / totalSec) * 100, 100);
                  }

                  return (
                    <div 
                      key={seg.id}
                      onClick={() => {
                        // Calculate first seconds offset
                        let accOffset = 0;
                        for (let j = 0; j < idx; j++) {
                          accOffset += segments[j].duration_minutes * 60;
                        }
                        setForceSec(accOffset);
                      }}
                      id={`tracker_segment_card_${seg.id}`}
                      className={`p-3 rounded-lg border transition text-left cursor-pointer select-none relative overflow-hidden ${
                        isActive 
                        ? "bg-slate-950 border-teal-500/40 text-slate-200" 
                        : "bg-slate-950/30 border-slate-800/60 text-slate-400 hover:border-slate-800 hover:text-slate-300"
                      }`}
                    >
                      {/* Floating progress backdrop background */}
                      {isActive && (
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-teal-500/5 transition-all duration-300 pointer-events-none" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      )}

                      <div className="flex items-center justify-between text-xs font-mono relative z-10">
                        <span className="font-semibold text-[11px] truncate uppercase">{seg.label}</span>
                        <span className="text-[10px] text-slate-500 shrink-0 font-bold">{seg.duration_minutes}m ({seg.start_time})</span>
                      </div>
                      
                      {seg.audio && (
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-sans relative z-10 truncate">
                          <Headphones className="w-3 h-3 text-teal-400 shrink-0" />
                          <span>{seg.audio.notes || seg.audio.type}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Simple Help Info */}
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/40 mt-1 flex items-start gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-slate-400 leading-normal font-sans">
                  Haciendo clic sobre cualquier bloque en este panel saltarás directamente a su inicio en el vídeo simulado para poder experimentar sus sonidos y visuales específicas de forma inmediata.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* 3. FULL-WIDTH LOWER ROW: Sliders Mixer, Timing Tuners and Copyable Publication Markdown Suite */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Youtube className="w-4 h-4 text-red-500" />
            <span>Consola de Ajuste de Tiempos y Kit de Edición</span>
          </span>
          <CustomizerPanel 
            sessionData={sessionData}
            setSessionData={setSessionData}
            activeSegmentId={activeSegmentId}
            onJumpToSegment={(segId) => {
              const idx = segments.findIndex(s => s.id === segId);
              if (idx !== -1) {
                let offset = 0;
                for (let j = 0; j < idx; j++) {
                  offset += segments[j].duration_minutes * 60;
                }
                setForceSec(offset);
              }
            }}
            ambientVolume={ambientVolume}
            setAmbientVolume={setAmbientVolume}
            binauralVolume={binauralVolume}
            setBinauralVolume={setBinauralVolume}
            doodleVolume={doodleVolume}
            setDoodleVolume={setDoodleVolume}
          />
        </div>

      </main>

      {/* FOOTER */}
      <footer id="global_footer" className="bg-slate-950 border-t border-slate-900 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs font-sans">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4.5 h-4.5 text-teal-500/50" />
            <span>Focus Video Station &copy; 2026. Diseñado para Creadores de Contenido.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[11px] text-slate-600">
              <Headphones className="w-3.5 h-3.5" />
              <span>Sonido Binaural 24-bit</span>
            </span>
            <span className="font-mono text-[10px] text-slate-600">v1.1.0 (Full-Stack Express)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

