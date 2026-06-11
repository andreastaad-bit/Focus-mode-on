// Reemplaza el contenido de VideoPlayer.tsx con este bloque corregido

import React, { useEffect, useRef, useState } from "react";
import { Segment, SessionData } from "../types";
import { globalAudioEngine } from "./AudioEngine";
import { Play, Pause, RotateCcw, FastForward, Headphones, Info } from "lucide-react";
import { Spectrogram } from "./Spectrogram";

const TEMPLATES = {
  lluvia: {
    id: 'lluvia',
    nombre: 'Lluvia Profunda',
    colorPrincipal: '#8BB5C8', 
    colorSecundario: '#5A7D8C',
    frecuenciaBase: 174,
    sonidoAmbiente: 'rain_ambient.mp3',
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
  const [selectedDoodleIndex, setSelectedDoodleIndex] = useState(0);
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES.bosque);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const segments = sessionData.video_prompt.segments;
  const segmentOffsets = useRef<number[]>([]);
  const totalDurationSeconds = useRef(0);

  // Referencia de estado para el bucle de animación (evita cierres de variables antiguos)
  const stateRef = useRef({ isPlaying, currentTimeSec, activeSegmentId, isFastTrack });

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
    globalAudioEngine.setVolumes(binauralVolume, ambientVolume, doodleVolume);
  }, [ambientVolume, binauralVolume, doodleVolume]);

  const handleAudioForSegment = (segId: string, time: number) => {
    if (!stateRef.current.isPlaying) {
      globalAudioEngine.stopAll();
      return;
    }

    // Calcular en qué sub-segmento estamos
    const segIdx = segments.findIndex(s => s.id === segId);
    const relSec = time - segmentOffsets.current[segIdx];

    globalAudioEngine.resume();

    if (segId === "break_1_doodle" && relSec >= 15) {
      // CAMBIO DE MÚSICA PARA DOODLE
      globalAudioEngine.stopBinaural();
      globalAudioEngine.stopAmbient();
      globalAudioEngine.startDoodleMusic(); // Asegúrate que este método cargue un sonido distinto
    } else if (segId.includes("block")) {
      // MODO CONCENTRACIÓN
      globalAudioEngine.stopDoodleMusic();
      globalAudioEngine.startAmbient(activeTemplate.sonidoAmbiente);
      const beatHz = segId === "block_1_alpha" ? 10 : 40;
      globalAudioEngine.startBinaural(activeTemplate.frecuenciaBase, beatHz);
    } else {
      globalAudioEngine.stopBinaural();
      globalAudioEngine.stopDoodleMusic();
    }
  };

  const syncSegmentAndTime = (newTime: number) => {
    let targetIdx = 0;
    for (let i = 0; i < segments.length; i++) {
      if (newTime >= segmentOffsets.current[i]) targetIdx = i;
    }
    const nextSegId = segments[targetIdx].id;
    
    setCurrentTimeSec(newTime);
    setActiveSegmentId(nextSegId);
    onTimeUpdate(newTime);
    
    // Forzar actualización de audio
    handleAudioForSegment(nextSegId, newTime);
  };

  const animate = (time: number) => {
    if (previousTimeRef.current !== null && stateRef.current.isPlaying) {
      const delta = (time - previousTimeRef.current) / 1000;
      const multiplier = stateRef.current.isFastTrack ? 120 : 1;
      const nextTime = stateRef.current.currentTimeSec + (delta * multiplier);

      if (nextTime >= totalDurationSeconds.current) {
        setIsPlaying(false);
        globalAudioEngine.stopAll();
      } else {
        // Solo actualizamos el segmento si cruzamos la frontera
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
    const segIdx = segments.findIndex(s => s.id === stateRef.current.activeSegmentId);
    const relSec = stateRef.current.currentTimeSec - segmentOffsets.current[segIdx];

    ctx.fillStyle = "#0A0F1A";
    ctx.fillRect(0, 0, w, h);

    if (stateRef.current.activeSegmentId.includes("block")) {
        drawRiver(ctx, w, h);
    } else if (stateRef.current.activeSegmentId === "break_1_doodle") {
        if (relSec < 15) drawTimer(ctx, w, h, 15 - relSec);
        else drawDoodle(ctx, w, h, (relSec - 15) / 585);
    }
  };

  const drawRiver = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = activeTemplate.colorPrincipal + "33";
    ctx.beginPath();
    // Simplicidad para el ejemplo:
    ctx.arc(w/2, h/2, 50 + Math.sin(Date.now()/500)*10, 0, Math.PI*2);
    ctx.fill();
  };

  const drawTimer = (ctx: CanvasRenderingContext2D, w: number, h: number, rem: number) => {
    ctx.fillStyle = "#FFF";
    ctx.font = "40px Inter";
    ctx.textAlign = "center";
    ctx.fillText(`Prepárate: ${Math.ceil(rem)}`, w/2, h/2);
  };

  // DOODLE CORREGIDO: Dibuja el rastro completo
  const drawDoodle = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number) => {
    const cx = w / 2; const cy = h / 2;
    const getCoords = (p: number) => {
        const angle = p * Math.PI * 10; // Más vueltas = más rápido
        const r = p * 150;
        return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
    };

    // Dibujar el rastro (camino recorrido)
    ctx.strokeStyle = activeTemplate.colorPrincipal;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= progress; i += 0.001) {
        const p = getCoords(i);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    // Dibujar el punto guía
    const head = getCoords(progress);
    ctx.fillStyle = "#FFF";
    ctx.beginPath();
    ctx.arc(head.x, head.y, 8, 0, Math.PI*2);
    ctx.fill();
  };

 // ... (dentro de tu función VideoPlayer, después de todas las funciones de dibujo)

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <div className="relative aspect-video bg-black">
        <canvas 
          ref={canvasRef} 
          width={720} 
          height={405} 
          className="w-full h-full cursor-pointer" 
          onClick={handleTogglePlay}
        />
        
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={handleTogglePlay}
          >
            <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center shadow-inner hover:scale-110 transition-transform">
              <Play size={40} className="text-slate-900 ml-2" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Indicador de Atmósfera Actual */}
        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 text-[10px] text-slate-300 border border-white/10">
          <Headphones className="w-3 h-3 text-teal-400" />
          <span>{activeTemplate.label}</span>
        </div>
      </div>

      <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-5">
        
        {/* 1. Selector de Atmósfera */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Cambiar Atmósfera:</span>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Object.values(TEMPLATES).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTemplate(t);
                  if (isPlaying) setTimeout(() => handleAudioForSegment(activeSegmentId, currentTimeSec), 50);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
                  activeTemplate.id === t.id 
                  ? "bg-teal-500 text-slate-900 shadow-lg shadow-teal-500/20" 
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {t.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Barra de Progreso / Timeline */}
        <div className="space-y-1">
          <input 
            type="range" 
            min={0} 
            max={totalDurationSeconds.current} 
            value={currentTimeSec}
            onChange={(e) => syncSegmentAndTime(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500 hover:accent-teal-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{Math.floor(currentTimeSec / 60)}:{(currentTimeSec % 60).toFixed(0).padStart(2, '0')}</span>
            <span>{Math.floor(totalDurationSeconds.current / 60)}:00</span>
          </div>
        </div>

        {/* 3. Controles Principales */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleTogglePlay}
              className={`p-3 rounded-xl transition-all ${
                isPlaying ? "bg-slate-800 text-teal-400 border border-teal-500/30" : "bg-teal-500 text-slate-900"
              }`}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            </button>
            
            <button 
              onClick={() => {
                setIsPlaying(false);
                setCurrentTimeSec(0);
                globalAudioEngine.stopAll();
              }}
              className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Selector de Modo */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setIsFastTrack(false)} 
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${!isFastTrack ? "bg-slate-800 text-teal-400" : "text-slate-500"}`}
            >
              REAL
            </button>
            <button 
              onClick={() => setIsFastTrack(true)} 
              className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold rounded-lg transition ${isFastTrack ? "bg-amber-500/20 text-amber-500" : "text-slate-500"}`}
            >
              <FastForward size={12} />
              PRUEBA
            </button>
          </div>
        </div>
      </div>

      <Spectrogram 
        activeSegmentId={activeSegmentId} 
        isPlaying={isPlaying} 
        currentTimeSec={currentTimeSec} 
        palette={{
          primary: activeTemplate.colorPrincipal, 
          secondary: activeTemplate.colorSecundario, 
          accent: "#FFFFFF"
        }}
      />
    </div>
  );
}

export default VideoPlayer;
