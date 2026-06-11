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

  return (
    <div className="flex flex-col bg-slate-900 rounded-xl overflow-hidde
