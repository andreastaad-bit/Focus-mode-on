import { Segment, SessionData } from "../types";
import { Sliders, Volume2, Youtube, ListOrdered, Hash, RotateCcw, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";

interface CustomizerPanelProps {
  sessionData: SessionData;
  setSessionData: (data: SessionData) => void;
  activeSegmentId: string;
  onJumpToSegment: (segId: string) => void;
  
  ambientVolume: number;
  setAmbientVolume: (val: number) => void;
  binauralVolume: number;
  setBinauralVolume: (val: number) => void;
  doodleVolume: number;
  setDoodleVolume: (val: number) => void;
}

export function CustomizerPanel({
  sessionData,
  setSessionData,
  activeSegmentId,
  onJumpToSegment,
  ambientVolume,
  setAmbientVolume,
  binauralVolume,
  setBinauralVolume,
  doodleVolume,
  setDoodleVolume
}: CustomizerPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const triggerCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const segments = sessionData.video_prompt.segments;

  // Calculate dynamic chapters listing from segment lengths
  const getDynamicChapters = (): { caption: string; absSec: number }[] => {
    let accSec = 0;
    const chapters: { caption: string; absSec: number }[] = [];
    
    segments.forEach((seg) => {
      chapters.push({ caption: seg.label, absSec: accSec });
      accSec += seg.duration_minutes * 60;
    });

    return chapters;
  };

  const formatAbsoluteTime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const chapters = getDynamicChapters();

  // Create copyable texts
  const chaptersText = chapters
    .map(c => `${formatAbsoluteTime(c.absSec)} ${c.caption}`)
    .join("\n");

  const tagsText = sessionData.video_prompt.meta.youtube_tags.join(", ");

  const descriptionText = `${sessionData.video_prompt.production_notes.youtube_optimization.description_first_line}

🎧 RECOMENDABLE USAR AURICULARES PARA CONSEGUIR EL EFECTO BINAURAL COMPLETO.
⚠️ ADVERTENCIA: Los tonos binaurales no son recomendados para personas con epilepsia o convulsiones.

TEMARIO Y MARCAS DE TIEMPO (CAPÍTULOS):
${chaptersText}

---
Detalles de la sesión:
- Formato: ${sessionData.video_prompt.meta.format} (Resolución: ${sessionData.video_prompt.meta.resolution})
- Tasa de fotogramas: ${sessionData.video_prompt.meta.frame_rate} fps
- Audiencia sugerida: ${sessionData.video_prompt.meta.target_audience}
- Concepto estético: ${sessionData.video_prompt.meta.thumbnail_concept}
- Mezcla de audio: Ondas Alfa (8-12 Hz) en Bloque 1, Música de meditación en Pausa Creativa, Ondas Gamma (40 Hz) en Bloque 2, Cierre con guía respiratoria Box Breathing (Tasa 4s).`;

  // Update specific segment duration
  const handleDurationChange = (segId: string, mins: number) => {
    const updated = { ...sessionData };
    const seg = updated.video_prompt.segments.find(s => s.id === segId);
    if (seg) {
      seg.duration_minutes = Math.max(1, mins);
      
      // Re-calculate start and end display ranges
      let accSec = 0;
      updated.video_prompt.segments.forEach((s) => {
        const startSec = accSec;
        accSec += s.duration_minutes * 60;
        const endSec = accSec;
        
        s.start_time = formatAbsoluteTime(startSec);
        s.end_time = formatAbsoluteTime(endSec);
      });

      // Update total duration
      updated.video_prompt.meta.total_duration_minutes = Math.ceil(accSec / 60);
      setSessionData(updated);
    }
  };

  // Update binaural beat frequency
  const handleBeatFreqChange = (segId: string, freq: number) => {
    const updated = { ...sessionData };
    const seg = updated.video_prompt.segments.find(s => s.id === segId);
    if (seg && seg.audio) {
      seg.audio.beat_frequency_hz = freq;
      setSessionData(updated);
    }
  };

  // Reset to default JSON structure
  const resetToDefault = () => {
    window.location.reload();
  };

  return (
    <div id="customizer_panel_container" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* LEFT COLUMN: Mixing Suite & Segment Tuners (3/5 width) */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {/* MIXING STUDIO PANEL */}
        <div id="mixing_studio_section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="w-5 h-5 text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">Consola de Mezclas y Audio</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Ambient Water Filter */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">RÍO SUAVE</span>
                <span className="text-teal-400 font-bold">{Math.round(ambientVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                id="volume_ambient_slider"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
              />
              <span className="text-[10px] text-slate-500 leading-tight">Canal de ruido rosa simulador de caudal fluvial.</span>
            </div>

            {/* Binaural Beats Gain */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">LATIDOS BINAURALES</span>
                <span className="text-teal-400 font-bold">{Math.round(binauralVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                id="volume_binaural_slider"
                value={binauralVolume}
                onChange={(e) => setBinauralVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
              />
              <span className="text-[10px] text-slate-500 leading-tight">Amplitud de ondas de choque portadoras.</span>
            </div>

            {/* Meditation chords Piano */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">MEDITACIÓN DOODLE</span>
                <span className="text-teal-400 font-bold">{Math.round(doodleVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.02"
                id="volume_doodle_slider"
                value={doodleVolume}
                onChange={(e) => setDoodleVolume(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300"
              />
              <span className="text-[10px] text-slate-500 leading-tight">Volumen de cuerdas y acordes para dibujar.</span>
            </div>
          </div>
        </div>

        {/* TIMELINE SEGMENTS TUNERS */}
        <div id="segment_tuners_section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">Estructura del Cronograma (Bloques)</h3>
            </div>
            
            <button
              onClick={resetToDefault}
              className="flex items-center gap-1.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 hover:text-white rounded text-[11px] text-slate-400 transition cursor-pointer select-none"
              title="Restaurar valores de fábrica"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar</span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {segments.map((seg) => {
              const isActive = seg.id === activeSegmentId;
              return (
                <div 
                  key={seg.id} 
                  id={`segment_row_${seg.id}`}
                  className={`p-4 rounded-lg border transition ${
                    isActive 
                      ? "bg-slate-950/90 border-teal-500/40 shadow-inner" 
                      : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isActive && <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />}
                      <span className="text-xs font-bold text-slate-200">{seg.label}</span>
                    </div>

                    <button
                      onClick={() => onJumpToSegment(seg.id)}
                      className="text-[10px] font-mono text-teal-400 hover:text-teal-300 hover:underline cursor-pointer"
                    >
                      Saltar a {seg.start_time}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Duration slider */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>Duración:</span>
                        <span className="text-slate-200 font-bold">{seg.duration_minutes} min ({seg.start_time} → {seg.end_time})</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="90"
                        id={`duration_slider_${seg.id}`}
                        value={seg.duration_minutes}
                        onChange={(e) => handleDurationChange(seg.id, parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-teal-400"
                      />
                    </div>

                    {/* Audio parameters customizations */}
                    {seg.audio && (seg.audio.wave_type === "alpha" || seg.audio.wave_type === "gamma") ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Afinación Ondas ({seg.audio.wave_type.toUpperCase()}):</span>
                          <span className="text-teal-300 font-bold">{seg.audio.beat_frequency_hz} Hz</span>
                        </div>
                        <input
                          type="range"
                          min={seg.audio.wave_type === "alpha" ? "8" : "30"}
                          max={seg.audio.wave_type === "alpha" ? "12" : "60"}
                          id={`freq_slider_${seg.id}`}
                          value={seg.audio.beat_frequency_hz || 10}
                          onChange={(e) => handleBeatFreqChange(seg.id, parseInt(e.target.value))}
                          className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-teal-400"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center text-[10px] text-slate-500 font-mono leading-none border-l border-slate-800 pl-3">
                        {seg.id === "break_1_doodle" 
                          ? "Fase guiada: 15s de preparación y dibujo libre" 
                          : "Guía de respiración: Loops de 16s (4s Inhala, 4s Sostén, 4s Exhala, 4s Sostén)"
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: YouTube Metadata & Exporter (2/5 width) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* YOUTUBE READY-TO-USE PRODUCTION SUITE */}
        <div id="youtube_suite_section" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4">
            <Youtube className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">Kit de Publicación de YouTube</h3>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Consigue y copia todos los textos listos para tu canal. Las marcas de tiempo se recalculan automáticamente conforme cambias los minutos en el editor.
          </p>

          <div className="flex flex-col gap-4 flex-grow">
            
            {/* Title Formula Option */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">FÓRMULA DE TÍTULO EXPORTABLE</span>
                <button
                  onClick={() => triggerCopy(
                    `[${sessionData.video_prompt.meta.total_duration_minutes} min] Ondas Alfa + Gamma · Deep Focus & Creative Reset (Estudio Profundo)`, 
                    "title"
                  )}
                  className="text-teal-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  {copiedSection === "title" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "title" ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
              <p className="text-xs text-slate-200 truncate pr-4 font-semibold italic">
                [{sessionData.video_prompt.meta.total_duration_minutes} Min] Ondas Alfa + Gamma · Deep Focus & Creative Reset (Estudio Profundo)
              </p>
            </div>

            {/* Chapters Markup */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40 flex-grow">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>ÍNDICE DE MARCAS DE TIEMPO (CAPÍTULOS)</span>
                </span>
                <button
                  onClick={() => triggerCopy(chaptersText, "chapters")}
                  className="text-teal-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  {copiedSection === "chapters" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "chapters" ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded border border-slate-900.5 max-h-32 overflow-y-auto whitespace-pre-wrap select-all">
                {chaptersText}
              </pre>
            </div>

            {/* Tags Box */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  <span>ETIQUETAS RECOMENDADAS (TAGS)</span>
                </span>
                <button
                  onClick={() => triggerCopy(tagsText, "tags")}
                  className="text-teal-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px]"
                >
                  {copiedSection === "tags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "tags" ? "Copiado!" : "Copiar"}</span>
                </button>
              </div>
              <p className="text-[10px] font-mono text-slate-300 leading-normal bg-slate-950 p-2.5 rounded border border-slate-900.5 max-h-16 overflow-y-auto whitespace-pre-wrap">
                {tagsText}
              </p>
            </div>

            {/* Complete formatted description */}
            <div className="flex flex-col gap-2 p-3 bg-slate-950/60 rounded-lg border border-slate-800/40 flex-grow">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-slate-400">DESCRIPCIÓN COMPLETA DEL VIDEO</span>
                <button
                  onClick={() => triggerCopy(descriptionText, "desc")}
                  className="text-teal-400 hover:text-white transition cursor-pointer flex items-center gap-1 text-[10px] uppercase.5"
                >
                  {copiedSection === "desc" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === "desc" ? "Copiado!" : "Copiar todo"}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={descriptionText}
                className="w-full h-32 text-[10px] font-mono text-slate-400 leading-normal bg-slate-950 p-2 border border-slate-900 rounded outline-none resize-none select-all focus:text-slate-300"
              />
            </div>

          </div>

          {/* Quick Disclaimer Alert Box */}
          <div className="mt-4 p-2.5 bg-slate-950 border-l-2 border-amber-500/50 rounded flex items-start gap-2">
            <span className="text-amber-400 font-mono text-xs font-bold shrink-0 mt-0.5">⚠️</span>
            <p className="text-[9.5px] text-slate-400 leading-normal font-sans">
              <strong>Nota de producción:</strong> Recuerda renderizar a mínimos de 1080p (4K ideal) a 30fps sin cortes de vídeo para asegurar la inmersión visual. Promociona el uso de auriculares en la introducción del metraje.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
export default CustomizerPanel;
