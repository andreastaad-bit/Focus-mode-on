import React, { useEffect, useRef, useState } from "react";
import { Segment, SessionData } from "../types";
import { globalAudioEngine } from "./AudioEngine";
import { Play, Pause, RotateCcw, FastForward, Headphones, Info } from "lucide-react";
import { Spectrogram } from "./Spectrogram";

// 1. Configuración de Plantillas
const TEMPLATES: any = {
  lluvia: {
    id: 'lluvia',
    nombre: 'Lluvia Profunda',
    colorPrincipal: '#8BB5C8', 
    colorSecundario: '#5A7D8C',
    frecuenciaBase: 174,
    label: '174Hz - Alivio'
  },
  bosque: {
    id: 'bosque',
    nombre: 'Manantial Zen',
    colorPrincipal: '#A8C8B8', 
    colorSecundario: '#5F8571',
    frecuenciaBase: 432,
    label: '432Hz - Naturaleza'
  },
  oceano: {
    id: 'oceano',
    nombre: 'Océano Alfa',
    colorPrincipal: '#2980b9', 
    colorSecundario: '#1a5276',
    frecuenciaBase: 528,
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
  ambientVolume,
  binauralVolume,
  doodleVolume
}: VideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES.bosque);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  
  // Seguridad: Verificar que sessionData existe
  const segments = sessionData?.video_prompt?.segments || [];
  const segmentOffsets = useRef<number[]>([]);
  const totalDurationSeconds = useRef(0);

  const stateRef = useRef({ 
    isPlaying, 
    currentTimeSec, 
    activeSegmentId, 
    isFastTrack 
  });

  useEffect(() => {
    let acc = 0;
    const offsets: number[] = [];
    segments.forEach(s => {
      offsets.push(acc);
      acc += s.duration_minutes * 60;
    });
    segmentOffsets.current = offsets;
    totalDurationSeconds.current = acc;
  }, [segments]);

  useEffect(() => {
    stateRef.current = { isPlaying, currentTimeSec, activeSegmentId, isFastTrack };
  }, [isPlaying, currentTimeSec, activeSegmentId, isFastTrack]);

  useEffect(() => {
    if (globalAudioEngine && globalAudioEngine.setVolumes) {
        globalAudioEngine.setVolumes(binauralVolume, ambientVolume, doodleVolume);
    }
  }, [ambientVolume, binauralVolume, doodleVolume]);

  const handleAudioForSegment = (segId: string, time: number) => {
    if (!stateRef.current.isPlaying || !globalAudioEngine) return;

    const segIdx = segments.findIndex(s => s.id === segId);
    if (segIdx === -1) return;
    const relSec = time - segmentOffsets.current[segIdx];

    try {
        globalAudioEngine.resume();

        if (segId === "break_1_doodle" && relSec >= 15) {
            globalAudioEngine.stopBinaural();
            globalAudioEngine.stopAmbient();
            if (globalAudioEngine.startDoodleMusic) globalAudioEngine.startDoodleMusic();
        } else if (segId.includes("block")) {
            if (globalAudioEngine.stopDoodleMusic) globalAudioEngine.stopDoodleMusic();
            globalAudioEngine.startAmbient();
            const beatHz = segId === "block_1_alpha" ? 10 : 40;
            globalAudioEngine.startBinaural(activeTemplate.frecuenciaBase, beatHz);
        } else {
            globalAudioEngine.stopBinaural();
            if (globalAudioEngine.stopDoodleMusic) globalAudioEngine.stopDoodleMusic();
        }
    } catch (e) {
        console.error("Audio Engine Error:", e);
    }
  };

  const syncSegmentAndTime = (newTime: number) => {
    if (segments.length === 0) return;
    let targetIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      if (newTime >= segmentOffsets.current[i]) targetIdx = i;
    }
    const nextSegId = segments[targetIdx].id;
    setCurrentTimeSec(newTime);
    setActiveSegmentId(nextSegId);
    onTimeUpdate(newTime);
    handleAudioForSegment(nextSegId, newTime);
  };

  const animate = (time: number) => {
    if (previousTimeRef.current !== null && stateRef.current.isPlaying) {
      const delta = (time - previousTimeRef.current) / 1000;
      const multiplier = stateRef.current.isFastTrack ? 120 : 1;
      const nextTime = stateRef.current.currentTimeSec + (delta * multiplier);

      if (nextTime >= totalDurationSeconds.current) {
        setIsPlaying(false);
        if (globalAudioEngine) globalAudioEngine.stopAll();
      } else {
        syncSegmentAndTime(nextTime);
      }
    }
    previousTimeRef.current = time;
    renderFrame();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [activeTemplate, isPlaying]);

  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const currentId = stateRef.current.activeSegmentId;
    const segIdx = segments.findIndex(s => s.id === currentId);
    
    // Evitar errores si no encuentra el segmento
    if (segIdx === -1) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);
        return;
    }

    const relSec = stateRef.current.currentTimeSec - segmentOffsets.current[segIdx];

    ctx.fillStyle = "#0A0F1A";
    ctx.fillRect(0, 0, w, h);

    if (currentId.includes("block")) {
        drawRiver(ctx, w, h);
    } else if (currentId === "break_1_doodle") {
        if (relSec < 15) drawTimer(ctx, w, h, 15 - relSec);
        else drawDoodle(ctx, w, h, (relSec - 15) / 585);
    } else {
        // Fondo por defecto para otros bloques (respiración, etc.)
        ctx.fillStyle = "#0A0F1A";
        ctx.fillRect(0, 0, w, h);
    }
  };

  const drawRiver = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = activeTemplate.colorPrincipal + "22";
    ctx.beginPath();
    ctx.arc(w/2, h/2, 100 + Math.sin(Date.now()/1000)*20, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#FFF";
    ctx.font = "12px Inter";
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.5;
    ctx.fillText(`MODO: ${activeTemplate.nombre.toUpperCase()}`, w/2, h - 20);
    ctx.globalAlpha = 1;
  };

  const drawTimer = (ctx: CanvasRenderingContext2D, w: number, h: number, rem: number) => {
    ctx.fillStyle = "#FFF";
    ctx.font = "30px Inter";
    ctx.textAlign = "center";
    ctx.fillText(`Prepárate: ${Math.ceil(rem)}s`, w/2, h/2);
  };

  const drawDoodle = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
    const cx = w / 2; const cy = h / 2;
    // Función matemática para la figura (Espirales rítmicas)
    const getCoords = (p: number) => {
        const loops = 12; 
        const angle = p * Math.PI * loops;
        const r = p * (h / 2.5);
        return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    };

    ctx.strokeStyle = activeTemplate.colorPrincipal;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    // Dibujar rastro
    for (let i = 0; i <= progress; i += 0.002) {
        const p = getCoords(i);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Punto guía
    const head = getCoords(progress);
    ctx.fillStyle = "#FFF";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#FFF";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 6, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    stateRef.current.isPlaying = next;
    setTimeout(() => handleAudioForSegment(activeSegmentId, currentTimeSec), 50);
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <div className="relative aspect-video bg-black">
        <canvas ref={canvasRef} width={720} height={405} className="w-full h-full" onClick={handleTogglePlay}/>
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={handleTogglePlay}>
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center">
                    <Play size={32} fill="currentColor" className="ml-1 text-slate-900" />
                </div>
            </div>
        )}
      </div>

      <div className="p-4 bg-slate-950 space-y-4">
        <div className="flex gap-2 overflow-x-auto">
            {Object.values(TEMPLATES).map((t: any) => (
                <button 
                    key={t.id} 
                    onClick={() => {
                        setActiveTemplate(t);
                        if(isPlaying) setTimeout(() => handleAudioForSegment(activeSegmentId, currentTimeSec), 50);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap transition ${activeTemplate.id === t.id ? 'bg-teal-500 text-slate-900' : 'bg-slate-800 text-slate-400'}`}
                >
                    {t.nombre}
                </button>
            ))}
        </div>

        <input 
            type="range" min={0} max={totalDurationSeconds.current || 100} value={currentTimeSec}
            onChange={(e) => syncSegmentAndTime(parseFloat(e.target.value))}
            className="w-full accent-teal-500"
        />

        <div className="flex justify-between items-center">
            <button onClick={handleTogglePlay} className="text-teal-400 p-2 bg-slate-800 rounded-lg">
                {isPlaying ? <Pause size={20}/> : <Play size={20} fill="currentColor"/>}
            </button>
            <span className="font-mono text-xs text-slate-400">
                {Math.floor(currentTimeSec / 60)}:{(currentTimeSec % 60).toFixed(0).padStart(2, '0')}
            </span>
            <button 
                onClick={() => setIsFastTrack(!isFastTrack)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${isFastTrack ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}
            >
                MODO PRUEBA
            </button>
        </div>
      </div>
      
      {activeTemplate && (
          <Spectrogram 
            activeSegmentId={activeSegmentId} 
            isPlaying={isPlaying} 
            currentTimeSec={currentTimeSec} 
            palette={{primary: activeTemplate.colorPrincipal, secondary: activeTemplate.colorSecundario, accent: "#FFF"}}
          />
      )}
    </div>
  );
}

export default VideoPlayer;
