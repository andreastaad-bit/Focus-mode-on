import React, { useEffect, useRef, useState } from "react";
import { Segment, SessionData } from "../types";
import { globalAudioEngine } from "./AudioEngine";
import { Play, Pause, RotateCcw, FastForward, Headphones, Info, Sparkles } from "lucide-react";
import { Spectrogram } from "./Spectrogram";

// 1. Definición de Plantillas (Atmósferas)
const TEMPLATES = {
  lluvia: {
    id: 'lluvia',
    nombre: 'Lluvia Profunda',
    colorPrincipal: '#8BB5C8', 
    colorSecundario: '#5A7D8C',
    frecuenciaBase: 174,
    sonidoAmbiente: 'rain_ambient.mp3', // Asegúrate de que existan en tu carpeta de sonidos
    label: '174Hz - Alivio'
  },
  bosque: {
    id: 'bosque',
    nombre: 'Manantial Zen',
    colorPrincipal: '#A8C8B8', 
    colorSecundario: '#5F8571',
    frecuenciaBase: 432,
    sonidoAmbiente: 'forest_river.mp3',
    label: '432Hz - Naturaleza'
  },
  oceano: {
    id: 'oceano',
    nombre: 'Océano Alfa',
    colorPrincipal: '#2980b9', 
    colorSecundario: '#1a5276',
    frecuenciaBase: 528,
    sonidoAmbiente: 'ocean_waves.mp3',
    label: '528Hz - Energía'
  }
};

interface VideoPlayerProps {
  sessionData: SessionData;
  activeSegmentId: string;
  setActiveSegmentId: (id: string) => void;
  isFastTrack: boolean;
  setIsFastTrack: (val: boolean) => void;
  onTimeUpdate: (currentSeconds: number) => void;
  forceSec?: number | null;
  clearForceSec?: () => void;
  ambientVolume: number;
  binauralVolume: number;
  doodleVolume: number;
}

export function VideoPlayer({
  sessionData,
  activeSegmentId,
  setActiveSegmentId,
  isFastTrack,
  setIsFastTrack,
  onTimeUpdate,
  forceSec,
  clearForceSec,
  ambientVolume,
  binauralVolume,
  doodleVolume
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [selectedDoodleIndex, setSelectedDoodleIndex] = useState<number>(0);
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES.bosque);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const stateRef = useRef({
    isPlaying,
    currentTimeSec,
    isFastTrack,
    activeSegmentId,
    selectedDoodleIndex,
    lastBreathingPhaseId: "" as "inhale" | "hold_in" | "exhale" | "hold_out" | "",
  });

  const segments = sessionData.video_prompt.segments;
  const segmentOffsets = useRef<number[]>([]);
  const totalDurationSeconds = useRef<number>(140 * 60);

  useEffect(() => {
    let accSec = 0;
    const offsets: number[] = [];
    segments.forEach((seg) => {
      offsets.push(accSec);
      accSec += seg.duration_minutes * 60;
    });
    segmentOffsets.current = offsets;
    totalDurationSeconds.current = accSec;
  }, [segments]);

  useEffect(() => {
    stateRef.current = {
      ...stateRef.current,
      isPlaying,
      currentTimeSec,
      isFastTrack,
      activeSegmentId,
      selectedDoodleIndex
    };
  }, [isPlaying, currentTimeSec, isFastTrack, activeSegmentId, selectedDoodleIndex]);

  useEffect(() => {
    setCurrentTimeSec(0);
    stateRef.current.currentTimeSec = 0;
    previousTimeRef.current = null;
  }, [sessionData]);

  useEffect(() => {
    globalAudioEngine.setVolumes(binauralVolume, ambientVolume, doodleVolume);
  }, [ambientVolume, binauralVolume, doodleVolume]);

  // CORRECCIÓN: Lógica de audio unificada y reparada
  const handleAudioForSegment = (segId: string, subSegId?: string) => {
    if (!stateRef.current.isPlaying) {
      globalAudioEngine.stopAll();
      return;
    }

    globalAudioEngine.resume();
    globalAudioEngine.startAmbient(activeTemplate.sonidoAmbiente);

    if (segId === "block_1_alpha") {
      const seg1 = segments.find(s => s.id === "block_1_alpha");
      const beatHz1 = seg1?.audio?.beat_frequency_hz || 10;
      globalAudioEngine.startBinaural(activeTemplate.frecuenciaBase, beatHz1);
      globalAudioEngine.stopDoodleMusic();
    } else if (segId === "block_2_gamma") {
      const seg2 = segments.find(s => s.id === "block_2_gamma");
      const beatHz2 = seg2?.audio?.beat_frequency_hz || 40;
      globalAudioEngine.startBinaural(activeTemplate.frecuenciaBase, beatHz2);
      globalAudioEngine.stopDoodleMusic();
    } else if (segId === "break_1_doodle" && subSegId === "doodle_session") {
      globalAudioEngine.stopBinaural();
      globalAudioEngine.startDoodleMusic();
    } else {
        globalAudioEngine.stopBinaural();
        globalAudioEngine.stopDoodleMusic();
    }
  };

  const updateActiveSegmentFromSeconds = (secs: number) => {
    let targetSegIndex = 0;
    for (let i = 0; i < segments.length; i++) {
      const start = segmentOffsets.current[i];
      const end = start + segments[i].duration_minutes * 60;
      if (secs >= start && secs < end) {
        targetSegIndex = i;
        break;
      }
    }
    const nextSegId = segments[targetSegIndex].id;
    if (nextSegId !== activeSegmentId) {
      setActiveSegmentId(nextSegId);
      setTimeout(() => {
        const subSegId = getSubsegmentId(nextSegId, secs - segmentOffsets.current[targetSegIndex]);
        handleAudioForSegment(nextSegId, subSegId);
      }, 50);
    }
  };

  const getSubsegmentId = (segId: string, segmentRelSec: number): string | undefined => {
    if (segId === "break_1_doodle") {
      return segmentRelSec < 15 ? "prep_timer" : "doodle_session";
    }
    return undefined;
  };

  const animate = (time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaMs = time - previousTimeRef.current;
      if (stateRef.current.isPlaying) {
        const multiplier = stateRef.current.isFastTrack ? 120.0 : 1.0;
        const secondsToAdd = (deltaMs / 1000) * multiplier;
        let nextSeconds = stateRef.current.currentTimeSec + secondsToAdd;
        
        if (nextSeconds >= totalDurationSeconds.current) {
          nextSeconds = 0;
          setIsPlaying(false);
          globalAudioEngine.stopAll();
        }
        setCurrentTimeSec(nextSeconds);
        onTimeUpdate(nextSeconds);
        updateActiveSegmentFromSeconds(nextSeconds);
      }
    }
    previousTimeRef.current = time;
    renderFrame();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [activeSegmentId, selectedDoodleIndex, sessionData, activeTemplate]);

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    let activeSegIndex = segments.findIndex(s => s.id === stateRef.current.activeSegmentId);
    if (activeSegIndex === -1) activeSegIndex = 0;
    const seg = segments[activeSegIndex];
    const segStart = segmentOffsets.current[activeSegIndex];
    const segRelSec = stateRef.current.currentTimeSec - segStart;

    ctx.fillStyle = "#0A0F1A";
    ctx.fillRect(0, 0, w, h);

    if (seg.id === "block_1_alpha" || seg.id === "block_2_gamma") {
      drawRiverFlow(ctx, w, h, stateRef.current.currentTimeSec, seg.id);
      drawOverlays(ctx, w, h, seg, segRelSec);
    } else if (seg.id === "break_1_doodle") {
      if (segRelSec < 15) drawPrepTimer(ctx, w, h, segRelSec);
      else drawDoodleSession(ctx, w, h, Math.min((segRelSec - 15) / 585, 1.0), segRelSec - 15);
    } else if (seg.id === "break_2_breathing") {
      drawBoxBreathing(ctx, w, h, segRelSec);
    }
  };

  // --- DRAW RIVER (Corregido y vinculado a Template) ---
  const drawRiverFlow = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsedSec: number, segId: string) => {
    const mainColor = activeTemplate.colorPrincipal;
    const accentColor = activeTemplate.colorSecundario;
    const timeScale = elapsedSec * 0.4;
    
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#081C15");
    grad.addColorStop(0.5, "#0A0F1A");
    grad.addColorStop(1, "#040810");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const renderWaveLayer = (layerIdx: number, baseHeight: number, waveHeight: number, speedMult: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i <= 60; i++) {
        const x = (i / 60) * w;
        const slowSwell = Math.sin((i / 8) + timeScale * speedMult + layerIdx);
        const fastRipple = Math.cos((i / 2) - timeScale * 1.5 * speedMult + layerIdx * 2) * 2;
        const y = baseHeight + slowSwell * waveHeight + fastRipple;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.fill();
      ctx.restore();
    };

    renderWaveLayer(0, h * 0.45, 20, 0.4, accentColor, 0.15);
    renderWaveLayer(1, h * 0.55, 15, 0.7, mainColor, 0.20);
    renderWaveLayer(2, h * 0.70, 10, 1.0, "#FFFFFF", 0.10);

    ctx.save();
    ctx.font = "italic 300 13px 'Inter', sans-serif";
    ctx.fillStyle = mainColor;
    ctx.globalAlpha = 0.6;
    ctx.fillText(`${segId.toUpperCase()}  ·  ATMÓSFERA: ${activeTemplate.nombre.toUpperCase()}`, 25, 35);
    ctx.restore();
  };

  // --- DRAW OVERLAYS ---
  const drawOverlays = (ctx: CanvasRenderingContext2D, w: number, h: number, seg: Segment, relSec: number) => {
    const totalSec = seg.duration_minutes * 60;
    const remainingSec = Math.max(totalSec - relSec, 0);
    const m = Math.floor(remainingSec / 60);
    const s = Math.floor(remainingSec % 60);
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "300 24px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(timeStr, w - 24, h - 24);
    
    const progress = relSec / totalSec;
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(0, h - 4, w, 4);
    ctx.fillStyle = activeTemplate.colorPrincipal;
    ctx.fillRect(0, h - 4, w * progress, 4);
    ctx.restore();
  };

  // --- DRAW PREP TIMER ---
  const drawPrepTimer = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsedSec: number) => {
    const remaining = Math.max(15 - elapsedSec, 0);
    ctx.fillStyle = "#060A12";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#F5F0E8";
    ctx.font = "300 48px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(Math.ceil(remaining).toString(), w/2, h/2);
    ctx.font = "italic 300 16px 'Inter', sans-serif";
    ctx.fillText("Prepárate para fluir...", w/2, h/2 + 60);
  };

  // --- DRAW DOODLE ---
  const getDoodleCoordinates = (typeIdx: number, p: number) => {
    const cx = 350; const cy = 200;
    if (typeIdx === 1) { // Mandala
        const theta = p * Math.PI * 12;
        const r = 45 + 40 * Math.sin(6 * theta);
        return { x: cx + Math.cos(theta) * r, y: cy + Math.sin(theta) * r };
    }
    // Default: Luna
    const angle = -Math.PI * 0.7 + p * (Math.PI * 1.4);
    return { x: cx + Math.cos(angle) * 90, y: cy + Math.sin(angle) * 90 };
  };

  const drawDoodleSession = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, elapsedSec: number) => {
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, w, h);
    const pt = getDoodleCoordinates(stateRef.current.selectedDoodleIndex, progress);
    const lx = pt.x * (w / 700); const ly = pt.y * (h / 400);
    ctx.beginPath();
    ctx.arc(lx, ly, 8, 0, Math.PI * 2);
    ctx.fillStyle = activeTemplate.colorPrincipal;
    ctx.shadowBlur = 15;
    ctx.shadowColor = activeTemplate.colorPrincipal;
    ctx.fill();
  };

  // --- DRAW BOX BREATHING ---
  const drawBoxBreathing = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsedSec: number) => {
    ctx.fillStyle = "#0A0E17";
    ctx.fillRect(0, 0, w, h);
    const phaseIndex = Math.floor((elapsedSec % 16) / 4);
    const phases = [
      { label: "Inhala", color: "#A8D8EA" },
      { label: "Sostén", color: "#E8D5A3" },
      { label: "Exhala", color: "#B8E0B8" },
      { label: "Sostén", color: "#D4A8C8" }
    ];
    const cur = phases[phaseIndex];
    ctx.fillStyle = cur.color;
    ctx.font = "italic 300 32px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(cur.label, w/2, h/2);
  };

  const handleTogglePlay = () => {
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);
    stateRef.current.isPlaying = nextPlay;
    setTimeout(() => handleAudioForSegment(activeSegmentId), 50);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="relative aspect-video w-full bg-black">
        <canvas 
          ref={canvasRef} w-full h-full 
          width={720} height={405}
          className="w-full h-full cursor-pointer"
          onClick={handleTogglePlay}
        />
        {!isPlaying && (
          <button onClick={handleTogglePlay} className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center shadow-lg">
            <Play className="fill-current w-6 h-6 ml-1 text-slate-900" />
          </button>
        )}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/70 text-[10px] text-slate-300 border border-white/10">
          <Headphones className="w-3 h-3 text-teal-400" />
          <span>{activeTemplate.label.toUpperCase()}</span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-4">
        {/* Selector de Atmósfera */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Atmósfera:</span>
          {Object.values(TEMPLATES).map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTemplate(t);
                if(isPlaying) setTimeout(() => handleAudioForSegment(activeSegmentId), 50);
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold transition shrink-0 ${
                activeTemplate.id === t.id ? "bg-teal-500 text-slate-900" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {t.nombre}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400">{formatTime(currentTimeSec)}</span>
          <input 
            type="range" min={0} max={totalDurationSeconds.current} value={currentTimeSec}
            onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCurrentTimeSec(val);
                updateActiveSegmentFromSeconds(val);
            }}
            className="w-full h-1 bg-slate-800 appearance-none cursor-pointer accent-teal-400"
          />
          <span className="text-[11px] font-mono text-slate-400">{formatTime(totalDurationSeconds.current)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={handleTogglePlay} className="px-4 py-1.5 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2">
              {isPlaying ? <Pause size={14}/> : <Play size={14} fill="currentColor"/>}
              {isPlaying ? "Pausar" : "Iniciar Focus"}
            </button>
            <button onClick={() => { setIsPlaying(false); setCurrentTimeSec(0); globalAudioEngine.stopAll(); }} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs">
              <RotateCcw size={14}/>
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button onClick={() => setIsFastTrack(false)} className={`px-2 py-1 text-[10px] rounded ${!isFastTrack ? "bg-teal-500/20 text-teal-400" : "text-slate-500"}`}>Real</button>
            <button onClick={() => setIsFastTrack(true)} className={`px-2 py-1 text-[10px] rounded ${isFastTrack ? "bg-amber-500/20 text-amber-400" : "text-slate-500"}`}>Prueba</button>
          </div>
        </div>
      </div>

      <Spectrogram 
        activeSegmentId={activeSegmentId} 
        isPlaying={isPlaying} 
        currentTimeSec={currentTimeSec} 
        palette={{primary: activeTemplate.colorPrincipal, secondary: activeTemplate.colorSecundario, accent: "#FFF"}}
      />
    </div>
  );
}

export default VideoPlayer;
