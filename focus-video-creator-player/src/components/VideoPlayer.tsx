import React, { useEffect, useRef, useState } from "react";
import { Segment, SubSegment, SessionData } from "../types";
import { globalAudioEngine } from "./AudioEngine";
import { Play, Pause, RotateCcw, FastForward, Headphones, Info, Compass, HelpCircle } from "lucide-react";
import { Spectrogram } from "./Spectrogram";

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
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [selectedDoodleIndex, setSelectedDoodleIndex] = useState<number>(0);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Keep a reference to current values for the animation/render loop
  const stateRef = useRef({
    isPlaying,
    currentTimeSec,
    isFastTrack,
    activeSegmentId,
    selectedDoodleIndex,
    lastBreathingPhaseId: "" as "inhale" | "hold_in" | "exhale" | "hold_out" | "",
  });

  // Calculate session timeline metrics
  const segments = sessionData.video_prompt.segments;
  
  // Pre-calculate segment boundaries (absolute starting seconds in the timelines)
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

  // Synchronize state references
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.currentTimeSec = currentTimeSec;
    stateRef.current.isFastTrack = isFastTrack;
    stateRef.current.activeSegmentId = activeSegmentId;
    stateRef.current.selectedDoodleIndex = selectedDoodleIndex;
  }, [isPlaying, currentTimeSec, isFastTrack, activeSegmentId, selectedDoodleIndex]);

  useEffect(() => {
    setCurrentTimeSec(0);
    stateRef.current.currentTimeSec = 0;
    previousTimeRef.current = null;
  }, [sessionData]);

  // Handle external scrubs
  useEffect(() => {
    if (forceSec !== undefined && forceSec !== null) {
      setCurrentTimeSec(forceSec);
      updateActiveSegmentFromSeconds(forceSec);
      if (clearForceSec) clearForceSec();
    }
  }, [forceSec]);

  // Handle volume adjustments on the fly
  useEffect(() => {
    globalAudioEngine.setVolumes(binauralVolume, ambientVolume, doodleVolume);
  }, [ambientVolume, binauralVolume, doodleVolume]);

  // Initialize and update Audio states on Segment Transitions
  const handleAudioForSegment = (segId: string, subSegId?: string) => {
    if (!stateRef.current.isPlaying) {
      globalAudioEngine.stopAll();
      return;
    }

    if (segId === "block_1_alpha") {
      globalAudioEngine.resume();
      globalAudioEngine.startAmbient();
      globalAudioEngine.startBinaural(200, 10); // Alpha 10 Hz beat
      globalAudioEngine.stopDoodleMusic();
    } else if (segId === "block_2_gamma") {
      globalAudioEngine.resume();
      globalAudioEngine.startAmbient();
      globalAudioEngine.startBinaural(200, 40); // Gamma 40 Hz beat
      globalAudioEngine.stopDoodleMusic();
    } else if (segId === "break_1_doodle") {
      globalAudioEngine.stopBinaural();
      if (subSegId === "prep_timer") {
        globalAudioEngine.stopAmbient();
        globalAudioEngine.stopDoodleMusic();
      } else {
        // Doodle trace session
        globalAudioEngine.startDoodleMusic();
        globalAudioEngine.stopAmbient();
      }
    } else if (segId === "break_2_breathing") {
      globalAudioEngine.stopBinaural();
      globalAudioEngine.stopAmbient();
      globalAudioEngine.stopDoodleMusic();
      // Chimes are played programmatically on phase transitions inside drawing loop!
    } else {
      globalAudioEngine.stopAll();
    }
  };

  // Convert absolute session seconds to segment index and internal relative seconds
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
    // Handle end bounds boundary
    if (secs >= totalDurationSeconds.current) {
      targetSegIndex = segments.length - 1;
    }

    const nextSegId = segments[targetSegIndex].id;
    if (nextSegId !== activeSegmentId) {
      setActiveSegmentId(nextSegId);
      // Trigger major segment change audio switch
      setTimeout(() => {
        const subSegId = getSubsegmentId(nextSegId, secs - segmentOffsets.current[targetSegIndex]);
        handleAudioForSegment(nextSegId, subSegId);
      }, 50);
    }
  };

  const getSubsegmentId = (segId: string, segmentRelSec: number): string | undefined => {
    if (segId === "break_1_doodle") {
      // 15 seconds prep, rest is doodle trace (585 seconds)
      if (segmentRelSec < 15) return "prep_timer";
      return "doodle_session";
    }
    return undefined;
  };

  // The primary animation and ticks loop
  const animate = (time: number) => {
    if (previousTimeRef.current !== null) {
      const deltaMs = time - previousTimeRef.current;
      
      if (stateRef.current.isPlaying) {
        // Mode multiplier:
        // Real-Time: 1s in real world = 1s in session
        // Fast-Track: 1s in real world = 120s (2 mins) in session
        const multiplier = stateRef.current.isFastTrack ? 120.0 : 1.0;
        const secondsToAdd = (deltaMs / 1000) * multiplier;
        
        let nextSeconds = stateRef.current.currentTimeSec + secondsToAdd;
        
        if (nextSeconds >= totalDurationSeconds.current) {
          nextSeconds = 0; // Loop or top boundary stop
          setIsPlaying(false);
          globalAudioEngine.stopAll();
        }

        setCurrentTimeSec(nextSeconds);
        onTimeUpdate(nextSeconds);
        updateActiveSegmentFromSeconds(nextSeconds);
      }
    }

    previousTimeRef.current = time;

    // Render current frame to the canvas
    renderFrame();

    requestRef.current = requestAnimationFrame(animate);
  };

 useEffect(() => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    previousTimeRef.current = null;
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [activeSegmentId, selectedDoodleIndex, sessionData]);

  // Render method based on segment type
  const renderFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fluid canvas resize layout responsiveness
    const w = canvas.width;
    const h = canvas.height;

    // Recover active relative offset seconds
    let activeSegIndex = segments.findIndex(s => s.id === stateRef.current.activeSegmentId);
    if (activeSegIndex === -1) activeSegIndex = 0;
    const seg = segments[activeSegIndex];
    const segStart = segmentOffsets.current[activeSegIndex];
    const segRelSec = stateRef.current.currentTimeSec - segStart;

    // Solid base clean background
    ctx.fillStyle = "#0A0F1A"; // slate black base night
    ctx.fillRect(0, 0, w, h);

    if (seg.id === "block_1_alpha" || seg.id === "block_2_gamma") {
      // 1 & 3: Serene Sage River Flow rendering
      drawRiverFlow(ctx, w, h, stateRef.current.currentTimeSec, seg.id);
      drawOverlays(ctx, w, h, seg, segRelSec);
    } else if (seg.id === "break_1_doodle") {
      // 2: Doodle screen
      const isPrep = segRelSec < 15;
      if (isPrep) {
        drawPrepTimer(ctx, w, h, segRelSec);
      } else {
        const doodleRelSec = segRelSec - 15; // starts from 0
        const durationSec = 9 * 60 + 45; // 585s
        const progress = Math.min(doodleRelSec / durationSec, 1.0);
        drawDoodleSession(ctx, w, h, progress, doodleRelSec);
      }
    } else if (seg.id === "break_2_breathing") {
      // 4: Interactive Box Breathing
      drawBoxBreathing(ctx, w, h, segRelSec);
    }
  };

  // --- DRAW RIVER ---
  const drawRiverFlow = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsedSec: number, segId: string) => {
    // Colors from Palette
    // Sage Green: #A8C8B8
    // Soft Cream: #D4E8E0
    // Accent Blue-Gray: #8BB5C8
    const timeScale = elapsedSec * 0.4;
    
    // Smooth river gradient base
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#081C15"); // Deep forest dark river water
    grad.addColorStop(0.5, "#0A2820");
    grad.addColorStop(1, "#041410");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Cascading river wave layers using multiple sin/cos combinations (smooth flow)
    const renderWaveLayer = (layerIdx: number, baseHeight: number, waveHeight: number, speedMult: number, color: string, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, h);

      const segmentsCount = 60;
      for (let i = 0; i <= segmentsCount; i++) {
        const x = (i / segmentsCount) * w;
        
        // Combine a main flow sine wave with high-freq subtle ripples
        const slowSwell = Math.sin((i / 8) + timeScale * speedMult + layerIdx);
        const fastRipple = Math.cos((i / 2) - timeScale * 1.5 * speedMult + layerIdx * 2) * 2;
        const swellShift = Math.sin(timeScale * 0.1 + layerIdx) * waveHeight * 0.3;

        const y = baseHeight + slowSwell * waveHeight + fastRipple + swellShift;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // Drawn backing to frontwaves layers
    renderWaveLayer(0, h * 0.40, 24, 0.4, "#8BB5C8", 0.12); // Accent Blue
    renderWaveLayer(1, h * 0.48, 18, 0.6, "#A8C8B8", 0.16); // Sage primary
    renderWaveLayer(2, h * 0.55, 14, 0.8, "#D4E8E0", 0.18); // Soft Cream reflection
    renderWaveLayer(3, h * 0.64, 20, 0.5, "#8BB5C8", 0.15); // Layer 4 ripples
    renderWaveLayer(4, h * 0.72, 12, 1.1, "#A8C8B8", 0.22); // Fast foreground sage ripples

    // Slow starry floating dust specs to depict sunrise particles
    ctx.save();
    ctx.fillStyle = "#E8D5A3";
    for (let i = 0; i < 15; i++) {
      const seed = Math.sin(i * 123.456) * 500;
      const x = Math.abs(seed + timeScale * 15) % (w + 40) - 20;
      const y = Math.abs(Math.cos(i * 88.2) * (h - 100)) + 50 + Math.sin(timeScale * 0.2 + i) * 15;
      const size = Math.abs(Math.sin(i + timeScale * 0.1)) * 2 + 1;
      ctx.globalAlpha = 0.3 * Math.abs(Math.sin(timeScale * 0.05 + i));
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Soft glow header text
    ctx.save();
    ctx.font = "italic 300 13px 'Inter', sans-serif";
    ctx.fillStyle = "#8BB5C8";
    ctx.globalAlpha = 0.45;
    ctx.textAlign = "left";
    ctx.fillText(segId === "block_1_alpha" ? "ALPHA WAVES  ·  FOCUS FLOW" : "GAMMA WAVES  ·  COGNITIVE FOCUS", 25, 35);
    ctx.restore();
  };

  // --- DRAW OVERLAYS FOR BLOCKS ---
  const drawOverlays = (ctx: CanvasRenderingContext2D, w: number, h: number, seg: Segment, relSec: number) => {
    const totalSec = seg.duration_minutes * 60;
    const remainingSec = Math.max(totalSec - relSec, 0);
    
    // Countdown clock format
    const m = Math.floor(remainingSec / 60);
    const s = Math.floor(remainingSec % 60);
    const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // 1. Digital Clock (bottom-right 30% opacity, minimal thin sans-serif)
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "300 24px 'Inter', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(timeStr, w - 24, h - 24);
    ctx.restore();

    // 2. Block/Phase Tag Indicator (top-right overlay)
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#D4E8E0";
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(seg.label.toUpperCase(), w - 25, 35);
    ctx.restore();

    // 3. Progress Bar (1px height line, 20% opacity white)
    ctx.save();
    const progress = relSec / totalSec;
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(0, h - 3, w, 3); // base tracking path
    
    ctx.fillStyle = "#A8C8B8"; // sage active progress color!
    ctx.fillRect(0, h - 3, w * progress, 3);
    ctx.restore();
  };

  // --- DRAW PREP TIMER ---
  const drawPrepTimer = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsedSec: number) => {
    const duration = 15;
    const remaining = Math.max(duration - elapsedSec, 0);
    const percentage = remaining / duration;
    
    // Background glow radial
    const radial = ctx.createRadialGradient(w/2, h/2, 20, w/2, h/2, 200);
    radial.addColorStop(0, "#0D1627");
    radial.addColorStop(1, "#060A12");
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    const radius = 64;
    const cx = w / 2;
    const cy = h / 2 - 20;

    // Draw background track ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw active sweeping arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -Math.PI / 2, (-Math.PI / 2) + Math.PI * 2 * percentage, true);
    ctx.strokeStyle = "#F5F0E8"; // Ivory color
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();

    // Large Countdown Text in Center
    ctx.save();
    ctx.fillStyle = "#F5F0E8";
    ctx.font = "300 48px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(Math.ceil(remaining).toString(), cx, cy);
    ctx.restore();

    // Instructional Text Below
    ctx.save();
    ctx.fillStyle = "#F5F0E8";
    ctx.globalAlpha = 0.85;
    ctx.font = "italic 300 16px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Toma tu lápiz y papel. Prepárate para fluir.", cx, cy + radius + 45);
    
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#8BB5C8";
    ctx.globalAlpha = 0.4;
    ctx.fillText("DOODLE PREPARATION PHASE", cx, cy + radius + 75);
    ctx.restore();
  };

  // --- DRAW DOODLE guided tracing ---
  const getDoodleCoordinates = (typeIdx: number, p: number): { x: number; y: number } => {
    // Return standard centered drawing point calculations
    const cx = 350;
    const cy = 200;

    switch (typeIdx) {
      case 0: {
        // Luna creciente con estrellas en espiral
        if (p < 0.6) {
          const lp = p / 0.6;
          // Crescent moon outer arc
          const angle = -Math.PI * 0.7 + lp * (Math.PI * 1.4);
          const r = 90;
          return { x: cx + Math.cos(angle) * r - 20, y: cy + Math.sin(angle) * r };
        } else {
          const sp = (p - 0.6) / 0.4;
          // Spiral trace stars offset
          const theta = sp * Math.PI * 6;
          const r = 30 + sp * 50;
          return { x: cx + Math.cos(theta) * r + 40, y: cy + Math.sin(theta) * r };
        }
      }
      case 1: {
        // Mandala circular con pétalos
        const theta = p * Math.PI * 12; // 6 loops total
        const petaledRadius = 45 + 40 * Math.sin(6 * theta);
        return { x: cx + Math.cos(theta) * petaledRadius, y: cy + Math.sin(theta) * petaledRadius };
      }
      case 2: {
        // Constelación conectada (Ursa Major style nodes)
        const nodes = [
          { x: cx - 120, y: cy - 40 },
          { x: cx - 70, y: cy - 50 },
          { x: cx - 20, y: cy - 20 },
          { x: cx + 20, y: cy + 35 },
          { x: cx + 55, y: cy + 45 },
          { x: cx + 120, y: cy + 40 },
          { x: cx + 90, y: cy - 30 },
          { x: cx + 20, y: cy + 35 } // loop-back
        ];
        const segCount = nodes.length - 1;
        const currentSegIndex = Math.min(Math.floor(p * segCount), segCount - 1);
        const segProgress = (p * segCount) - currentSegIndex;
        const n1 = nodes[currentSegIndex];
        const n2 = nodes[currentSegIndex + 1];
        return {
          x: n1.x + (n2.x - n1.x) * segProgress,
          y: n1.y + (n2.y - n1.y) * segProgress
        };
      }
      case 3: {
        // Flor de loto geométrica
        const lobes = 8;
        const theta = p * Math.PI * 2;
        const sineMultiplier = Math.abs(Math.sin(lobes * theta / 2));
        const r = 30 + 75 * sineMultiplier;
        return { x: cx + Math.sin(theta) * r, y: cy - Math.cos(theta) * r + 20 };
      }
      case 4:
      default: {
        // Ojo Cósmico con galaxias
        if (p < 0.4) {
          const l1p = p / 0.4;
          // Outer eye top lid curve
          const x = -130 + 260 * l1p;
          const y = -45 * Math.sin(l1p * Math.PI);
          return { x: cx + x, y: cy + y };
        } else if (p < 0.8) {
          const l2p = (p - 0.4) / 0.4;
          // Outer eye bottom lid curve
          const x = 130 - 260 * l2p;
          const y = 45 * Math.sin(l2p * Math.PI);
          return { x: cx + x, y: cy + y };
        } else {
          const pupilProg = (p - 0.8) / 0.2;
          // Inner pupil circle
          const angle = pupilProg * Math.PI * 2;
          const r = 35;
          return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
        }
      }
    }
  };

  const drawDoodleSession = (ctx: CanvasRenderingContext2D, w: number, h: number, progress: number, elapsedSec: number) => {
    // Beautiful deep starry navy backdrop
    ctx.fillStyle = "#030712";
    ctx.fillRect(0, 0, w, h);

    // Subtle star clusters backdrop
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    for (let i = 0; i < 40; i++) {
      const seedVal = Math.sin(i * 456.789);
      const sx = Math.abs(seedVal * 123456) % w;
      const sy = Math.abs(seedVal * 789123) % h;
      ctx.globalAlpha = 0.08 + Math.abs(Math.sin(elapsedSec * 0.05 + i)) * 0.12;
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.restore();

    const drawIdx = stateRef.current.selectedDoodleIndex;

    // Draw the completed drawing trace as a subtle fine gold guide path
    ctx.save();
    ctx.strokeStyle = "rgba(232, 213, 163, 0.55)"; // Fine warm gold trail
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#E8D5A3";
    ctx.shadowBlur = 1;
    ctx.beginPath();
    
    const steps = 300;
    const currentMaxStep = Math.ceil(progress * steps);
    for (let i = 0; i <= currentMaxStep; i++) {
      const t = i / steps;
      const pt = getDoodleCoordinates(drawIdx, t);
      // Remap slightly to match actual canvas view size appropriately
      const scaleX = w / 700;
      const scaleY = h / 400;
      const canvasX = pt.x * scaleX;
      const canvasY = pt.y * scaleY;
      
      if (i === 0) ctx.moveTo(canvasX, canvasY);
      else ctx.lineTo(canvasX, canvasY);
    }
    ctx.stroke();
    ctx.restore();

    // Glowing Lead Drawing Dot (The Brush)
    const leadPt = getDoodleCoordinates(drawIdx, progress);
    const scaleX = w / 700;
    const scaleY = h / 400;
    const lx = leadPt.x * scaleX;
    const ly = leadPt.y * scaleY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#E8D5A3";
    ctx.fill();
    ctx.restore();

    // Instructional overlay fadeout in first 10 seconds of Doodle
    if (elapsedSec < 10) {
      const op = 1.0 - (elapsedSec / 10);
      ctx.save();
      ctx.globalAlpha = op * 0.7;
      ctx.fillStyle = "#E8D5A3";
      ctx.font = "italic 400 15px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Sigue el trazo con tu lápiz. No pienses. Solo fluye.", w / 2, 50);
      ctx.restore();
    }

    // Displays doodle concepts labels
    ctx.save();
    ctx.fillStyle = "#E8D5A3";
    ctx.globalAlpha = 0.25;
    ctx.font = "500 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    const titleOptions = [
      "LUNA CELESTIAL Y ESPIRAL DE ESTRELLAS",
      "MANDALA SAGRADO CIRCULAR",
      "CONSTELACIÓN ESTELAR MAJESTUOSA",
      "PÉTALOS DE FLOR DE LOTO GEOMÉTRICA",
      "OJO CÓSMICO DE LA GALAXIA LEJANA"
    ];
    ctx.fillText(`DOODLE: ${titleOptions[drawIdx]} (${Math.floor(progress * 100)}% COMPLETADO)`, w / 2, h - 30);
    ctx.restore();
  };

  // --- DRAW BOX BREATHING ---
  const drawBoxBreathing = (ctx: CanvasRenderingContext2D, w: number, h: number, elapsedSec: number) => {
    // 0A0F1A deep cosmic navy night
    ctx.fillStyle = "#0A0E17";
    ctx.fillRect(0, 0, w, h);

    const period = 16; // 16 seconds full loop
    const cycleRel = elapsedSec % period;
    const phaseIndex = Math.floor(cycleRel / 4); // 4 phases, 4s each
    const phaseRelSec = cycleRel % 4;
    
    // Four Box Breathing Phases
    // 0 = Inhale, 1 = Hold-in, 2 = Exhale, 3 = Hold-out
    const phases = [
      { id: "inhale", label: "Inhala", color: "#A8D8EA" },
      { id: "hold_in", label: "Sostén", color: "#E8D5A3" },
      { id: "exhale", label: "Exhala", color: "#B8E0B8" },
      { id: "hold_out", label: "Sostén sin aire", color: "#D4A8C8" }
    ];

    const curPhase = phases[phaseIndex];

    // Trigger Tibetan bowl strike on phase changes in real-time
    if (curPhase.id !== stateRef.current.lastBreathingPhaseId) {
      if (stateRef.current.isPlaying) {
        globalAudioEngine.playChime();
      }
      stateRef.current.lastBreathingPhaseId = curPhase.id as "inhale" | "hold_in" | "exhale" | "hold_out";
    }

    // Dynamic scale depending on canvas bounds
    const boxSize = Math.min(w * 0.45, h * 0.65);
    const bx = w / 2 - boxSize / 2;
    const by = h / 2 - boxSize / 2;

    // Draw centering Box border
    ctx.save();
    ctx.strokeStyle = "rgba(226, 241, 255, 0.12)";
    ctx.shadowBlur = 10;
    ctx.shadowColor = curPhase.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Draw rounded box coordinates
    const r = 16; // corner radius
    ctx.moveTo(bx + r, by);
    ctx.lineTo(bx + boxSize - r, by);
    ctx.quadraticCurveTo(bx + boxSize, by, bx + boxSize, by + r);
    ctx.lineTo(bx + boxSize, by + boxSize - r);
    ctx.quadraticCurveTo(bx + boxSize, by + boxSize, bx + boxSize - r, by + boxSize);
    ctx.lineTo(bx + r, by + boxSize);
    ctx.quadraticCurveTo(bx, by + boxSize, bx, by + boxSize - r);
    ctx.lineTo(bx, by + r);
    ctx.quadraticCurveTo(bx, by, bx + r, by);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Determine target ball position along border perimeter
    let ballX = bx;
    let ballY = by + boxSize;
    const progress = phaseRelSec / 4; // 0 to 1 inside current phase

    if (phaseIndex === 0) {
      // Inhale: Ascend left edge (Bottom to Top)
      ballX = bx;
      ballY = (by + boxSize) - (boxSize * progress);
    } else if (phaseIndex === 1) {
      // Hold: Cross top edge (Left to Right)
      ballX = bx + (boxSize * progress);
      ballY = by;
    } else if (phaseIndex === 2) {
      // Exhale: Descend right edge (Top to Bottom)
      ballX = bx + boxSize;
      ballY = by + (boxSize * progress);
    } else if (phaseIndex === 3) {
      // Hold Out: Recur bottom edge (Right to Left)
      ballX = (bx + boxSize) - (boxSize * progress);
      ballY = by + boxSize;
    }

    // Keep ball within round coordinates elegantly
    // Draw target glowing guide ball
    ctx.save();
    ctx.shadowBlur = 15;
    ctx.shadowColor = curPhase.color;
    ctx.fillStyle = curPhase.color;
    ctx.beginPath();
    ctx.arc(ballX, ballY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Drawing instructions centered inside the Box Breathing box
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Dynamic breathe text
    ctx.fillStyle = curPhase.color;
    ctx.font = "italic 300 28px 'Inter', sans-serif";
    ctx.fillText(curPhase.label, w / 2, h / 2 - 25);

    // Pulsing visual bubble depending on count ticks
    const bubbleSize = 35 + Math.sin(phaseRelSec * Math.PI / 2) * 12;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2 + 30, bubbleSize, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, 0.04)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Display counts (1 - 2 - 3 - 4) based on progress
    ctx.fillStyle = "#E2F1FF";
    ctx.globalAlpha = 0.8;
    ctx.font = "300 18px 'JetBrains Mono', monospace";
    
    const countNum = Math.floor(phaseRelSec) + 1;
    let subStr = "·   ·   ·   ·";
    if (countNum === 1) subStr = "1   ·   ·   ·";
    else if (countNum === 2) subStr = "1   2   ·   ·";
    else if (countNum === 3) subStr = "1   2   3   ·";
    else if (countNum === 4) subStr = "1   2   3   4";
    ctx.fillText(subStr, w / 2, h / 2 + 30);
    
    ctx.restore();

    // Global counts of repetitions
    const totalCycles = 37;
    const currentCycleNum = Math.floor(elapsedSec / period) + 1;
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = 0.25;
    ctx.font = "500 10px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`BOX BREATHING  ·  CICLO ${currentCycleNum} DE ${totalCycles}`, w / 2, h - 35);
    ctx.restore();
  };

  // Convert seconds to readable display timestamps
  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    const nextPlay = !isPlaying;
    setIsPlaying(nextPlay);
    stateRef.current.isPlaying = nextPlay;
    
    // Recover sub segment offset if doodle
    let activeSegIndex = segments.findIndex(s => s.id === stateRef.current.activeSegmentId);
    if (activeSegIndex === -1) activeSegIndex = 0;
    const seg = segments[activeSegIndex];
    const segStart = segmentOffsets.current[activeSegIndex];
    const subSegId = getSubsegmentId(seg.id, stateRef.current.currentTimeSec - segStart);

    setTimeout(() => {
      handleAudioForSegment(seg.id, subSegId);
    }, 50);
  };

  const handleReset = () => {
    setIsPlaying(false);
    stateRef.current.isPlaying = false;
    setCurrentTimeSec(0);
    onTimeUpdate(0);
    updateActiveSegmentFromSeconds(0);
    globalAudioEngine.stopAll();
  };

  // Interactive timeline scroller seek trigger
  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTimeSec(val);
    stateRef.current.currentTimeSec = val;
    onTimeUpdate(val);
    
    // Find target segment
    let targetSegIndex = 0;
    for (let i = 0; i < segments.length; i++) {
      const start = segmentOffsets.current[i];
      const end = start + segments[i].duration_minutes * 60;
      if (val >= start && val < end) {
        targetSegIndex = i;
        break;
      }
    }
    if (val >= totalDurationSeconds.current) {
      targetSegIndex = segments.length - 1;
    }

    const nextSegId = segments[targetSegIndex].id;
    // Force update regardless of whether segment changed
    setActiveSegmentId(nextSegId);
    stateRef.current.activeSegmentId = nextSegId;
    
    const subSegId = getSubsegmentId(
      nextSegId, 
      val - segmentOffsets.current[targetSegIndex]
    );
    
    // Trigger audio for the new position immediately
    setTimeout(() => {
      handleAudioForSegment(nextSegId, subSegId);
    }, 50);
  };

  const getActivePalette = () => {
    const seg = segments.find(s => s.id === activeSegmentId);
    if (seg && seg.visual && seg.visual.color_palette) {
      return {
        primary: seg.visual.color_palette.primary || "#A8C8B8",
        secondary: seg.visual.color_palette.secondary || "#D4E8E0",
        accent: seg.visual.color_palette.accent || "#8BB5C8"
      };
    }
    if (activeSegmentId === "block_2_gamma") {
      return {
        primary: "#8A2BE2",
        secondary: "#FF69B4",
        accent: "#DA70D6"
      };
    }
    if (activeSegmentId === "break_1_doodle") {
      return {
        primary: "#E8D5A3",
        secondary: "#FFFDF9",
        accent: "#F0B548"
      };
    }
    if (activeSegmentId === "break_2_breathing") {
      return {
        primary: "#B8E0B8",
        secondary: "#E2F1FF",
        accent: "#A8D8EA"
      };
    }
    return {
      primary: "#A8C8B8",
      secondary: "#D4E8E0",
      accent: "#8BB5C8"
    };
  };

  return (
    <div id="video_player_module" className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      
      {/* 2D HTML5 Responsive Video Preview Frame */}
      <div className="relative aspect-video w-full bg-black leading-none">
        <canvas 
          ref={canvasRef} 
          width={720} 
          height={405} 
          id="focus_video_canvas"
          className="w-full h-full block cursor-pointer"
          onClick={handleTogglePlay}
        />
        
        {/* Play overlay on pause */}
        {!isPlaying && (
          <button 
            onClick={handleTogglePlay}
            id="play_canvas_overlay"
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-teal-500/90 text-slate-950 flex items-center justify-center hover:bg-teal-400 hover:scale-105 active:scale-95 transition cursor-pointer shadow-lg outline-none"
          >
            <Play className="fill-current w-6 h-6 ml-1" />
          </button>
        )}

        {/* Headphones indicator warning */}
        <div id="headphones_pill" className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 text-slate-300 text-[10px] font-mono border border-white/5 pointer-events-none">
          <Headphones className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span>AURICULARES RECOMENDADOS (BINAURAL)</span>
        </div>

        {/* Active playback velocity indicator */}
        {isFastTrack && (
          <div id="fast_mode_pill" className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/80 text-amber-950 text-[10px] font-bold tracking-wider animate-pulse pointer-events-none shadow-md">
            <FastForward className="w-3.5 h-3.5" />
            <span>MODO PRUEBA RÁPIDA (120x)</span>
          </div>
        )}
      </div>

      {/* Main Bar Controls Panel */}
      <div id="player_controls_bar" className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col gap-3">
        
        {/* Timeline Range Scroller */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-400 w-16 text-left shrink-0">
            {formatTime(currentTimeSec)}
          </span>
          <input 
            type="range"
            min={0}
            id="video_timeline_seek"
            max={totalDurationSeconds.current}
            value={currentTimeSec}
            onChange={handleTimelineChange}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
          />
          <span className="text-[11px] font-mono text-slate-400 w-16 text-right shrink-0">
            {formatTime(totalDurationSeconds.current)}
          </span>
        </div>

        {/* Action Buttons Panel */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlay}
              id="btn_play_pause"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition ${
                isPlaying 
                ? "bg-slate-800 text-teal-400 border border-teal-500/20 hover:bg-slate-700" 
                : "bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold"
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="fill-current w-3.5 h-3.5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              id="btn_reset_player"
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition"
              title="Reiniciar reproducción"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>

          {/* Preset Doodle selector only visible if active index is in doodle break */}
          {activeSegmentId === "break_1_doodle" && currentTimeSec - segmentOffsets.current[1] >= 15 && (
            <div id="doodle_selector_group" className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <span className="text-[10px] font-mono text-slate-400 px-2 shrink-0 uppercase">Dibujo celestial:</span>
              <select
                id="select_doodle_type"
                value={selectedDoodleIndex}
                onChange={(e) => setSelectedDoodleIndex(parseInt(e.target.value))}
                className="bg-slate-950 border-none outline-none text-teal-300 text-xs py-0.5 px-2 rounded font-medium cursor-pointer"
              >
                <option value={0}>Luna Creciente</option>
                <option value={1}>Mandala Sagrado</option>
                <option value={2}>Constelación</option>
                <option value={3}>Flor de Loto</option>
                <option value={4}>Ojo Cósmico</option>
              </select>
            </div>
          )}

          {/* Mode Switch Controller */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 border border-slate-800 rounded-lg select-none shrink-0">
            <button
              onClick={() => {
                setIsFastTrack(false);
                stateRef.current.isFastTrack = false;
              }}
              id="btn_mode_real"
              className={`px-3 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                !isFastTrack 
                ? "bg-teal-500/15 text-teal-300 border border-teal-500/30" 
                : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Real (2h 20m)
            </button>
            <button
              onClick={() => {
                setIsFastTrack(true);
                stateRef.current.isFastTrack = true;
              }}
              id="btn_mode_fast"
              className={`flex items-center gap-1 px-3 py-1 rounded text-[10px] font-semibold transition cursor-pointer ${
                isFastTrack 
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold" 
                : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FastForward className="w-3 h-3" />
              <span>Simulador-Prueba (70s)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Dynamic Sound Spectrogram Analyzer Display */}
      <Spectrogram 
        activeSegmentId={activeSegmentId}
        isPlaying={isPlaying}
        currentTimeSec={currentTimeSec}
        palette={getActivePalette()}
      />

      {/* Under-Player Guidance Notes */}
      <div id="player_guidance_footer" className="p-3 bg-slate-950 border-t border-slate-900 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
          {activeSegmentId === "block_1_alpha" && (
            <span><strong>Ondas Alfa (10 Hz):</strong> El cerebro entra en un estado de concentración relajada ideal para programar, diseñar o leer. Los sintetizadores de agua simulan el fluir de un río.</span>
          )}
          {activeSegmentId === "break_1_doodle" && (
            <span><strong>Pausa Creativa — Doodle:</strong> Detiene el estado de concentración para descansar. Sigue el trazo luminoso dorado con un lápiz o con el dedo en un papel para liberar fatiga cognitiva.</span>
          )}
          {activeSegmentId === "block_2_gamma" && (
            <span><strong>Ondas Gamma (40 Hz):</strong> Estimula la resolución de problemas abstractos, procesamiento de alta velocidad e integración cognitiva profunda. Perfecto para tareas de alta demanda.</span>
          )}
          {activeSegmentId === "break_2_breathing" && (
            <span><strong>Box Breathing (Respiración Cuadrada 4-4-4-4):</strong> Reduce la frecuencia cardíaca, estabiliza el estrés de forma científicamente probada. Inhala, sostén, exhala, sostén, siguiendo la esfera de luz.</span>
          )}
        </p>
      </div>
    </div>
  );
}
export default VideoPlayer;
