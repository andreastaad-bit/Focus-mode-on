import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { globalAudioEngine } from "./AudioEngine";
import { Activity, Headphones } from "lucide-react";

interface SpectrogramProps {
  activeSegmentId: string;
  isPlaying: boolean;
  currentTimeSec: number;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function Spectrogram({
  activeSegmentId,
  isPlaying,
  currentTimeSec,
  palette
}: SpectrogramProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Historical spectrogram data
  // 2D grid: array of columns, each column has N bins
  const historyRef = useRef<number[][]>([]);
  const maxHistoryLength = 120; // Horizontal density of spectrogram scrolling

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Fit canvas to container size
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 100; // Fixed visualizer height
      }
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Initialize history with empty buffers
    const numBins = 32;
    historyRef.current = Array.from({ length: maxHistoryLength }, () => 
      Array(numBins).fill(0)
    );

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = 0;
    
    // We update the scroll history at a fixed interval (e.g., every 50ms) to ensure smooth pacing
    const historyUpdateIntervalMs = 50;
    let lastHistoryUpdateTime = 0;

    const tick = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const progress = timestamp - lastTime;
      
      const canvas = canvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      // 1. GATHER REAL-TIME DATA (Real node vs Simulated high-fidelity state)
      const numBins = 32;
      const currentData = new Array(numBins).fill(0);
      let hasRealAudio = false;

      // Attain real analyser
      const analyser = globalAudioEngine.getAnalyser();
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        
        // Sum check to check if we are getting real signal vs blank channel
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        
        if (sum > 0) {
          hasRealAudio = true;
          // Sub-sample real FFT binary bins down to our 32 visible spectral bands
          const step = Math.floor(dataArray.length / numBins);
          for (let i = 0; i < numBins; i++) {
            let localMax = 0;
            const startIdx = i * step;
            for (let j = 0; j < step; j++) {
              if (dataArray[startIdx + j] > localMax) {
                localMax = dataArray[startIdx + j];
              }
            }
            // Normalize level between 0 and 1
            currentData[i] = localMax / 255.0;
          }
        }
      }

      // If no real audio node is contributing signal (e.g. idle or blocked permissions),
      // we generate an extremely elegant mathematical state simulation matching the segment parameters!
      if (!hasRealAudio) {
        const t = timestamp / 1000;
        const isSegmentPlaying = isPlaying;
        
        for (let i = 0; i < numBins; i++) {
          let baseIntensity = 0;
          
          if (isSegmentPlaying) {
            if (activeSegmentId === "block_1_alpha") {
              // ALPHA WAVES: Carrier spike around bin 3, beat frequencies, rumbling low river on first bins
              const riverRumble = (Math.sin(t * 8 + i * 2.3) + 1.0) * 0.12 * Math.max(0, 1 - i / 10);
              const carrierPulse = i === 2 || i === 3 ? (Math.sin(t * 10) * 0.15 + 0.55) : 0;
              const alphaBeat = i === 1 ? (Math.sin(t * 5) * 0.12 + 0.35) : 0;
              baseIntensity = riverRumble + carrierPulse + alphaBeat;
            } else if (activeSegmentId === "block_2_gamma") {
              // GAMMA WAVES: Mid registers focus, fast vibrating peaks, and continuous static murmur
              const deepRiver = (Math.sin(t * 12 + i * 1.5) + 1.1) * 0.08 * Math.max(0, 1 - i / 6);
              const gammaBeat = i === 6 || i === 7 ? (Math.sin(t * 40) * 0.18 + 0.6) : 0;
              const highSibilance = (Math.sin(t * 15 - i * 3.4) + 1.0) * 0.05 * (i / numBins);
              baseIntensity = deepRiver + gammaBeat + highSibilance;
            } else if (activeSegmentId === "break_1_doodle") {
              // DOODLE CALMING PIANO: Dynamic sliding melodies, harmonic chord arches ascending/descending
              const chordsCycle = Math.floor(t / 5) % 4;
              let chordTargetBin = 5;
              if (chordsCycle === 0) chordTargetBin = 6;
              else if (chordsCycle === 1) chordTargetBin = 12;
              else if (chordsCycle === 2) chordTargetBin = 8;
              else chordTargetBin = 10;

              const melodicSpike = Math.max(0, 1 - Math.abs(i - chordTargetBin) / 3.5) * (Math.sin(t * 2.5) * 0.35 + 0.5);
              const harmonics = i > 15 ? (Math.sin(t * 4 + i * 0.7) + 1.0) * 0.07 : 0;
              baseIntensity = melodicSpike + harmonics;
            } else if (activeSegmentId === "break_2_breathing") {
              // BOX BREATHING: Constant absolute silence broken by periodic bell ringing decays!
              // Bell chimes play at phase switches (every 4 seconds)
              const timeInCycle = currentTimeSec % 4;
              const decay = Math.exp(-timeInCycle * 0.85); // elegant decay rate
              
              if (decay > 0.01) {
                // Stack singing bowls harmonics over bins 4(220Hz), 6(330Hz), 9(440Hz), 12(580Hz)
                const harmonicPeak1 = Math.max(0, 1 - Math.abs(i - 4) / 1.5) * 0.6;
                const harmonicPeak2 = Math.max(0, 1 - Math.abs(i - 6) / 1.5) * 0.45;
                const harmonicPeak3 = Math.max(0, 1 - Math.abs(i - 9) / 2) * 0.35;
                const harmonicPeak4 = Math.max(0, 1 - Math.abs(i - 12) / 2.5) * 0.25;
                baseIntensity = (harmonicPeak1 + harmonicPeak2 + harmonicPeak3 + harmonicPeak4) * decay;
              } else {
                // Quiet heartbeat resting breathing pulse
                const pulse = (Math.sin(t * 1.5) + 1.0) * 0.04 * (1 - i / numBins);
                baseIntensity = pulse;
              }
            }
          } else {
            // Idle ambient resting wave (gently breathing spectrum)
            const slowPulse = (Math.sin(t * 2 + i * 0.2) + 1.0) * 0.04 * Math.max(0, 1 - i / 15);
            baseIntensity = slowPulse;
          }

          // Bound intensity limit nicely
          currentData[i] = Math.min(Math.max(baseIntensity, 0.02), 0.98);
        }
      }

      // 2. SCROLL THE WATERFALL SPECTROGRAM HISTORICAL BUFFER
      if (timestamp - lastHistoryUpdateTime >= historyUpdateIntervalMs) {
        historyRef.current.shift();
        historyRef.current.push([...currentData]);
        lastHistoryUpdateTime = timestamp;
      }

      // 3. DRAW D3-STYLED VISUALS ON CANVAS
      ctx.clearRect(0, 0, w, h);

      // A. Draw historical Spectrogram Waterfall grid
      // We partition width slice by history length, and height strip by bin size.
      const colWidth = w / maxHistoryLength;
      const rowHeight = h / numBins;

      // D3 dynamic color interpolation scale between background slate colors and the active palette accents!
      const colorScale = d3.scaleLinear<string>()
        .domain([0, 0.1, 0.4, 0.8, 1.0])
        .range(["rgba(10, 15, 26, 0.0)", "rgba(13, 22, 40, 0.45)", palette.accent, palette.primary, palette.secondary]);

      for (let xIdx = 0; xIdx < maxHistoryLength; xIdx++) {
        const colData = historyRef.current[xIdx];
        const xPos = xIdx * colWidth;

        for (let yIdx = 0; yIdx < numBins; yIdx++) {
          const intensity = colData[yIdx];
          
          if (intensity > 0.03) {
            ctx.fillStyle = colorScale(intensity);
            // Height counts upside down so high frequencies rest on top
            const yPos = h - (yIdx + 1) * rowHeight;
            
            // Render slightly wider and taller block to eliminate gaps
            ctx.fillRect(xPos, yPos, colWidth + 0.6, rowHeight + 0.6);
          }
        }
      }

      // B. Draw Top Real-Time Liquid Wave curve overlay
      // We map the latest bin heights to coordinates, using D3 curve generators!
      const latestDataPoints: [number, number][] = currentData.map((intensity, idx) => {
        const binX = (idx / (numBins - 1)) * w;
        // Wave shifts upwards vertically depending on noise/amplitude
        const binY = h - (intensity * (h * 0.72)) - 10;
        return [binX, binY];
      });

      // Smooth closed line layout via D3
      const d3Line = d3.line<[number, number]>()
        .curve(d3.curveBasis);

      const d3Area = d3.area<[number, number]>()
        .y0(h)
        .curve(d3.curveBasis);

      // Create glowing linear gradient for the active wave
      const waveGrad = ctx.createLinearGradient(0, 0, 0, h);
      waveGrad.addColorStop(0, palette.primary);
      waveGrad.addColorStop(0.5, palette.accent);
      waveGrad.addColorStop(1, "rgba(5, 10, 20, 0.0)");

      // Render the area translucently
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = waveGrad;
      const areaPathString = d3Area(latestDataPoints);
      if (areaPathString) {
        const areaPath = new Path2D(areaPathString);
        ctx.fill(areaPath);
      }
      ctx.restore();

      // Render the glowing top stroke line
      ctx.save();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = palette.secondary;
      ctx.shadowColor = palette.primary;
      ctx.shadowBlur = 6;
      ctx.globalAlpha = 0.85;
      const strokePathString = d3Line(latestDataPoints);
      if (strokePathString) {
        const strokePath = new Path2D(strokePathString);
        ctx.stroke(strokePath);
      }
      ctx.restore();

      // C. Draw subtle decorative vertical axis grids or tags
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 0.5;
      // low freq, mid, high markers
      const markers = [0.25, 0.5, 0.75];
      markers.forEach(pct => {
        ctx.beginPath();
        ctx.moveTo(w * pct, 0);
        ctx.lineTo(w * pct, h);
        ctx.stroke();
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, activeSegmentId, palette, currentTimeSec]);

  return (
    <div id="audio_spectrogram_wrapper" className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/80 p-4 shadow-xl select-none">
      
      {/* Visual Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
          <Activity className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
            Espectrograma en Tiempo Real (D3.js Grid)
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-sans text-slate-500 font-medium">Bajas (Hz)</span>
          <div className="w-12 h-1 bg-gradient-to-r from-teal-500/20 via-sky-500/40 to-teal-400/80 rounded" />
          <span className="text-[10px] font-sans text-slate-500 font-medium">Altas (Hz)</span>
        </div>
      </div>

      {/* Canvas Graphic Area */}
      <div ref={containerRef} className="w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-900 shadow-inner relative">
        <canvas ref={canvasRef} className="block w-full h-24" />
        
        {/* Absolute indicators */}
        <div className="absolute top-2 left-2 text-[8px] font-mono font-bold tracking-widest text-[#A8C8B8] uppercase opacity-45 px-1 py-0.5 rounded bg-slate-950/75 select-none pointer-events-none">
          Live Waterfall
        </div>

        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <span className="text-[10px] font-bold tracking-widest text-teal-400/60 uppercase font-mono animate-pulse">
              [ PULSAR INICIAR SESIÓN PARA ACTIVAR ANÁLISIS ]
            </span>
          </div>
        )}
      </div>

      {/* Quick Spectrograph Info footer annotation */}
      <p className="text-[9.5px] text-slate-500 font-sans leading-relaxed mt-2.5 text-left flex items-start gap-1">
        <span className="text-teal-500 shrink-0 mt-0.5">※</span>
        <span>
          Esta consola de audio analiza 32 bandas del espectro acústico en tiempo real. Los picos bajos en el histograma de fondo representan el soplido del río y las ondas {activeSegmentId.includes("alpha") ? "Alfa (10Hz)" : activeSegmentId.includes("gamma") ? "Gamma (40Hz)" : "de descanso"}. Las elevaciones medias señalan acordes de piano de fase Doodle o la campana de respiración profunda.
        </span>
      </p>

    </div>
  );
}
export default Spectrogram;
