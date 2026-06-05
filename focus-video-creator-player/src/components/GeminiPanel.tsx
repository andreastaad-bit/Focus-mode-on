import React, { useState } from "react";
import { Sparkles, Loader2, PlaySquare, AlertCircle, RefreshCw, FileSliders, BookOpen, Compass, Lightbulb } from "lucide-react";
import { SessionData } from "../types";

interface GeminiPanelProps {
  onLoadSession: (data: SessionData) => void;
  onResetToDefault: () => void;
}

export function GeminiPanel({ onLoadSession, onResetToDefault }: GeminiPanelProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorStatus, setErrorStatus] = useState<{ code: string; msg: string } | null>(null);

  // THREE OFFLINE STUDY PRESETS FOR QUICK EXPERIMENTATION
  const handleLoadPreset = (presetType: "theta" | "beta" | "cosmic") => {
    let preset: SessionData | null = null;
    
    if (presetType === "theta") {
      preset = {
        "video_prompt": {
          "meta": {
            "title": "Theta Study Sprint — 45 Min Session",
            "total_duration_minutes": 45,
            "format": "16:9",
            "resolution": "1080p",
            "frame_rate": 30,
            "target_audience": "diseñadores, ilustradores, artistas en busca de máxima inspiración",
            "youtube_tags": ["estudio", "theta waves", "binaural beats", "creatividad", "flujo", "canvas doodle", "diseño"],
            "thumbnail_concept": "ilustración minimalista de un desierto al anochecer con tonos terracota y lila"
          },
          "segments": [
            {
              "id": "block_1_alpha",
              "label": "Bloque 1 — Inspiración Theta",
              "start_time": "00:00:00",
              "end_time": "00:20:00",
              "duration_minutes": 20,
              "audio": {
                "type": "binaural_beats + ambient",
                "frequency_hz": "4–7",
                "wave_type": "alpha", // maps inside video player
                "carrier_frequency_hz": 200,
                "beat_frequency_hz": 6, // 6Hz Theta beat
                "ambient_layer": "viento suave del desierto",
                "volume_curve": "fade_in 10s",
                "notes": "Auriculares recomendados"
              },
              "visual": {
                "type": "video_loop_ambient",
                "scene": "dunas ondulantes de arena al viento",
                "movement": "viento lento arrastrando granos finos",
                "color_palette": {
                  "primary": "#E29578", // Terracotta
                  "secondary": "#FFDDD2", // Warm sand
                  "accent": "#83C5BE" // Pastel desert turquoise
                }
              }
            },
            {
              "id": "break_1_doodle",
              "label": "Pausa Creativa — Mandala Espiritual",
              "start_time": "00:20:00",
              "end_time": "00:25:00",
              "duration_minutes": 5,
              "sub_segments": [
                {
                  "id": "prep_timer",
                  "label": "Preparación",
                  "duration_seconds": 15,
                  "audio": { "type": "silencio" },
                  "visual": { "type": "prep_countdown" }
                },
                {
                  "id": "doodle_session",
                  "label": "Doodle",
                  "duration_minutes": 4,
                  "duration_seconds": 45,
                  "audio": { "type": "ambient" },
                  "visual": { "type": "animated_dot_drawing" }
                }
              ]
            },
            {
              "id": "block_2_gamma",
              "label": "Bloque 2 — Concentración Theta Alta",
              "start_time": "00:25:00",
              "end_time": "00:40:00",
              "duration_minutes": 15,
              "audio": {
                "type": "binaural_beats + ambient",
                "frequency_hz": "4–7",
                "wave_type": "gamma", // maps inside video player
                "carrier_frequency_hz": 200,
                "beat_frequency_hz": 7,
                "ambient_layer": "viento sutil desierto nocturno"
              },
              "visual": {
                "type": "video_loop_ambient",
                "scene": "mismas dunas, oscurecidas"
              }
            },
            {
              "id": "break_2_breathing",
              "label": "Cierre — Respiración Rápida",
              "start_time": "00:40:00",
              "end_time": "00:45:00",
              "duration_minutes": 5,
              "audio": { "type": "ambient + cue" },
              "visual": { "type": "interactive_breathing_guide" }
            }
          ],
          "production_notes": {
            "music_generation": {
              "tool_suggestions": ["Brain.fm", "Audition"],
              "alpha_track": "Generar tono Theta 6Hz",
              "gamma_track": "Generar tono Theta 7Hz",
              "disclaimer_on_video": "Advertencia sobre epilepsia estándar"
            },
            "river_footage": {
              "sources": ["Pexels dunas desert"],
              "loop_technique": "Corte neutro loop invisible",
              "color_grading_software": "DaVinci LUT"
            },
            "doodle_animation": {
              "tools": ["Procreate GIF"],
              "style_ref": "Mandala geometry"
            },
            "youtube_optimization": {
              "title_formula": "[45 Min] Concentración Theta · Inspírate",
              "description_first_line": "Sesión rápida de ondas Theta para máxima fluidez artística.",
              "chapters": ["00:00 Bloque 1", "20:00 Pausa", "25:00 Bloque 2", "40:00 Cierre"],
              "end_screen": "Cards playlist",
              "cards": ""
            }
          }
        }
      };
    } else if (presetType === "beta") {
      preset = {
        "video_prompt": {
          "meta": {
            "title": "Beta Writer Marathon — 90 Min Focus",
            "total_duration_minutes": 90,
            "format": "16:9",
            "resolution": "4K",
            "frame_rate": 30,
            "target_audience": "escritores, redactores, bloggers, periodistas en busca de palabras fluidas",
            "youtube_tags": ["escritura", "ondas beta", "binaural beats", "maratón", "productiva", "doodle loto", "escritores"],
            "thumbnail_concept": "bosque lluvioso de pinos con niebla flotante, paleta verde abeto y gris carbón"
          },
          "segments": [
            {
              "id": "block_1_alpha",
              "label": "Bloque 1 — Bloque de Redacción Beta",
              "start_time": "00:00:00",
              "end_time": "00:40:00",
              "duration_minutes": 40,
              "audio": {
                "type": "binaural_beats + ambient",
                "frequency_hz": "12–15",
                "wave_type": "alpha",
                "carrier_frequency_hz": 200,
                "beat_frequency_hz": 15, // 15Hz Beta focus
                "ambient_layer": "sonido de lluvia persistente en pinos",
                "volume_curve": "fade_in 20s",
                "notes": "Efecto binaural recomendado"
              },
              "visual": {
                "type": "video_loop_ambient",
                "scene": "copas de pinos mecidas suavemente por el follaje y agua caer",
                "movement": "lluvia cayendo en diagonal, niebla densa subiendo",
                "color_palette": {
                  "primary": "#2D3A3A", // Abeto oscuro
                  "secondary": "#7D8C8B", // Niebla gris
                  "accent": "#A3B3B2" // Plata pálido
                }
              }
            },
            {
              "id": "break_1_doodle",
              "label": "Pausa Creativa — Flor de Loto Trimming",
              "start_time": "00:40:00",
              "end_time": "00:50:00",
              "duration_minutes": 10,
              "sub_segments": [
                {
                  "id": "prep_timer",
                  "label": "Preparación",
                  "duration_seconds": 15,
                  "audio": { "type": "silencio" },
                  "visual": { "type": "prep_countdown" }
                },
                {
                  "id": "doodle_session",
                  "label": "Doodle",
                  "duration_minutes": 9,
                  "duration_seconds": 45,
                  "audio": { "type": "piano suave" },
                  "visual": { "type": "animated_dot_drawing" }
                }
              ]
            },
            {
              "id": "block_2_gamma",
              "label": "Bloque 2 — Redacción Beta Aguda",
              "start_time": "00:50:00",
              "end_time": "01:20:00",
              "duration_minutes": 30,
              "audio": {
                "type": "binaural_beats + ambient",
                "frequency_hz": "12–15",
                "wave_type": "gamma",
                "carrier_frequency_hz": 200,
                "beat_frequency_hz": 14,
                "ambient_layer": "lluvia suave y truenos lejanos tímidos"
              },
              "visual": {
                "type": "video_loop_ambient",
                "scene": "mismo bosque, relámpagos lentos lejanos"
              }
            },
            {
              "id": "break_2_breathing",
              "label": "Cierre — Respiración de Integración Estilo Box",
              "start_time": "01:20:00",
              "end_time": "01:30:00",
              "duration_minutes": 10,
              "audio": { "type": "cuencos tibetanos" },
              "visual": { "type": "interactive_breathing_guide" }
            }
          ],
          "production_notes": {
            "music_generation": {
              "tool_suggestions": ["Brain.fm", "Premiere"],
              "alpha_track": "Generar tono Beta 15Hz",
              "gamma_track": "Generar tono Beta 14Hz",
              "disclaimer_on_video": "Estándar advertencia binaural"
            },
            "river_footage": {
              "sources": ["Pexels forest rain 4K"],
              "loop_technique": "Loop fundido cruzado",
              "color_grading_software": "Premiere LUTs"
            },
            "doodle_animation": {
              "tools": ["Procreate export"],
              "style_ref": "Lotus geometry tracing"
            },
            "youtube_optimization": {
              "title_formula": "[90 Min] Concentración Beta · Escribe sin Límites",
              "description_first_line": "Estudio acelerado de escritura con sonido de lluvia y foco Beta.",
              "chapters": ["00:00 Bloque Beta", "40:00 Descanso", "50:00 Enfoque 2", "80:00 Respiración"],
              "end_screen": "Card playlist",
              "cards": ""
            }
          }
        }
      };
    } else if (presetType === "cosmic") {
      preset = {
        "video_prompt": {
          "meta": {
            "title": "Cosmic Spark Focus Block — Gamma High-Power",
            "total_duration_minutes": 65,
            "format": "16:9",
            "resolution": "4K preferred",
            "frame_rate": 30,
            "target_audience": "estudiantes de ingenierías, programadores seniors, analistas de datos",
            "youtube_tags": ["estimulación gamma", "40 hz", "alta densidad", "hiperenfoque", "binaural", "ojo cósmico", "desafíos complejos"],
            "thumbnail_concept": "nebulosa estelar púrpura y magenta con un horizonte de agujero negro tranquilo"
          },
          "segments": [
            {
              "id": "block_1_alpha",
              "label": "Bloque 1 — Hiperenfoque Gamma 40 Hz",
              "start_time": "00:00:00",
              "end_time": "00:30:00",
              "duration_minutes": 30,
              "audio": {
                "type": "binaural_beats + ambient",
                "frequency_hz": "40",
                "wave_type": "alpha",
                "carrier_frequency_hz": 200,
                "beat_frequency_hz": 40, // Pure 40Hz
                "ambient_layer": "rumor de viento cósmico y sintetizadores espaciales",
                "volume_curve": "constante con fade-in suave",
                "notes": "Auriculares estéreo obligatorios"
              },
              "visual": {
                "type": "video_loop_ambient",
                "scene": "nebulosa estelar flotando suavemente, partículas de helio moviéndose",
                "movement": "gas cósmico derivando suavemente",
                "color_palette": {
                  "primary": "#4A154B", // Purple deep
                  "secondary": "#0A0E17", // Cosmic back
                  "accent": "#FF4081" // Hot magenta
                }
              }
            },
            {
              "id": "break_1_doodle",
              "label": "Pausa Creativa — Ojo Cósmico Tracing",
              "start_time": "00:30:00",
              "end_time": "00:35:00",
              "duration_minutes": 5,
              "sub_segments": [
                {
                  "id": "prep_timer",
                  "label": "Preparación",
                  "duration_seconds": 15,
                  "audio": { "type": "silencio" },
                  "visual": { "type": "prep" }
                },
                {
                  "id": "doodle_session",
                  "label": "Doodle",
                  "duration_minutes": 4,
                  "duration_seconds": 45,
                  "audio": { "type": "copas de cristal" },
                  "visual": { "type": "animated_dot_drawing" }
                }
              ]
            },
            {
              "id": "block_2_gamma",
              "label": "Bloque 2 — Hiperenfoque Gamma 50 Hz",
              "start_time": "00:35:00",
              "end_time": "01:00:00",
              "duration_minutes": 25,
              "audio": {
                "type": "binaural_beats + ambient",
                "frequency_hz": "50",
                "wave_type": "gamma",
                "carrier_frequency_hz": 200,
                "beat_frequency_hz": 50,
                "ambient_layer": "viento estelar denso"
              },
              "visual": {
                "type": "video_loop_ambient",
                "scene": "nebulosa en tonos magentas oscuros"
              }
            },
            {
              "id": "break_2_breathing",
              "label": "Cierre — Respiración Estelar",
              "start_time": "01:00:00",
              "end_time": "01:05:00",
              "duration_minutes": 5,
              "audio": { "type": "ambient" },
              "visual": { "type": "interactive_breathing_guide" }
            }
          ],
          "production_notes": {
            "music_generation": {
              "tool_suggestions": ["Brain.fm"],
              "alpha_track": "Generar 40Hz",
              "gamma_track": "Generar 50Hz",
              "disclaimer_on_video": "Advertencia fotosensibilidad habitual"
            },
            "river_footage": {
              "sources": ["Spacetelescope free footage"],
              "loop_technique": "Corte imperceptible",
              "color_grading_software": "After Effects curves"
            },
            "doodle_animation": {
              "tools": ["Rive.app"],
              "style_ref": "Cosmic eye sacred astronomy"
            },
            "youtube_optimization": {
              "title_formula": "[65 Min] Súper Enfoque Gamma de 40 Hz",
              "description_first_line": "Desata tu potencial mental complejo con este impulso electro-encefalográfico.",
              "chapters": ["00:00 Bloque 1", "30:00 Pausa", "35:00 Bloque 2", "60:00 Cierre"],
              "end_screen": "Card final",
              "cards": ""
            }
          }
        }
      };
    }

    if (preset) {
      onLoadSession(preset);
      setErrorStatus(null);
    }
  };

  // SEND PROMPT TO FULL-STACK BACKEND GATEWAY
  const handleGenerateAISession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch("/api/ai/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "KEY_MISSING") {
          setErrorStatus({
            code: "KEY_MISSING",
            msg: data.message,
          });
        } else {
          throw new Error(data.message || "Error procesando tu petición con Gemini.");
        }
        return;
      }

      onLoadSession(data);
      setPrompt("");
    } catch (err: any) {
      console.error(err);
      setErrorStatus({
        code: "GATEWAY_ERROR",
        msg: err?.message || "Imposible conectar con el servidor backend del applet. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ai_generator_panel_suite" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col gap-5">
      
      {/* Title block */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
        <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
        <div>
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider font-mono">Generador Inteligente Gemini (Server-Side)</h3>
          <p className="text-[10px] text-slate-500 font-sans mt-0.5">Diseña planes de enfoque personalizados al instante.</p>
        </div>
      </div>

      {/* Actual Core Form */}
      <form onSubmit={handleGenerateAISession} id="form_ai_prompt" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ai_prompt_input" className="text-xs font-medium text-slate-300 font-sans">
            Describe tu sesión ideal en lenguaje natural:
          </label>
          <textarea
            id="ai_prompt_input"
            rows={3}
            placeholder="Ej: Quiero una sesión rápida de 45 minutos para programar, con tonos lila e inspiración de ondas Theta relajantes en el desierto..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition resize-none leading-relaxed font-sans"
          />
        </div>

        <button
          type="submit"
          id="btn_submit_ai"
          disabled={isLoading || !prompt.trim()}
          className="flex items-center justify-center gap-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-lg transition disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 cursor-pointer select-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
              <span>Generando en Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-current text-slate-950" />
              <span>Generar Sesión con IA</span>
            </>
          )}
        </button>
      </form>

      {/* ERROR HANDLERS GUIDE */}
      {errorStatus && (
        <div id="ai_generation_error_pill" className="p-3 bg-slate-950 border-l-2 border-red-500/60 rounded flex flex-col gap-2">
          <div className="flex items-start gap-2 text-red-400">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold font-sans">{errorStatus.code === "KEY_MISSING" ? "Acceso de API Cerrado" : "Error de Servidor"}</span>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                {errorStatus.msg}
              </p>
            </div>
          </div>
          
          {errorStatus.code === "KEY_MISSING" && (
            <div className="text-[9px] text-slate-500 border-t border-slate-900 pt-2 leading-relaxed font-sans">
              <strong>Cómo añadir el secreto:</strong> Ve a <strong>Settings (Ajustes) &gt; Secrets (Secretos)</strong> en la barra superior derecha de Google AI Studio, añade una variable llamada <code>GEMINI_API_KEY</code> con tu clave, y listo.
            </div>
          )}
        </div>
      )}

      {/* QUICK OFFLINE PRESETS LOADING SECTORS */}
      <div id="quick_presets_section" className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 uppercase tracking-tight">
          <FileSliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Sprints y Plantillas Offline Rápidas:</span>
        </div>
        <p className="text-[10px] text-slate-500 font-sans leading-normal mb-1">
          ¿No tienes una API Key de Gemini configurada? Prueba estas plantillas prediseñadas al instante:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Preset 1: Theta */}
          <button
            onClick={() => handleLoadPreset("theta")}
            id="preset_btn_theta"
            className="flex items-center gap-1.5 p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-left text-[11px] text-slate-300 border border-slate-800/60 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="font-semibold truncate text-slate-200">Enfoque Theta (Crear)</span>
              <span className="text-[9px] text-slate-500">45 Min Sprint</span>
            </div>
          </button>

          {/* Preset 2: Beta */}
          <button
            onClick={() => handleLoadPreset("beta")}
            id="preset_btn_beta"
            className="flex items-center gap-1.5 p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-left text-[11px] text-slate-300 border border-slate-800/60 transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="font-semibold truncate text-slate-200 font-sans">Enfoque Beta (Escribir)</span>
              <span className="text-[9px] text-slate-500 font-sans">90 Min Maratón</span>
            </div>
          </button>

          {/* Preset 3: Cosmic Gamma */}
          <button
            onClick={() => handleLoadPreset("cosmic")}
            id="preset_btn_cosmic"
            className="flex items-center gap-1.5 p-2 bg-slate-950 hover:bg-slate-800 rounded-lg text-left text-[11px] text-slate-300 border border-slate-800/60 transition cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />
            <div className="flex flex-col overflow-hidden leading-tight">
              <span className="font-semibold truncate text-slate-200">Hiperenfoque (Gamma)</span>
              <span className="text-[9px] text-slate-500">65 Min Cósmico</span>
            </div>
          </button>
        </div>

        <button
          onClick={onResetToDefault}
          className="mt-2 text-center text-[10px] text-slate-500 underline hover:text-slate-400 transition cursor-pointer"
        >
          Volver a cargar la sesión original de 2 horas (Río al Amanecer)
        </button>
      </div>

    </div>
  );
}
export default GeminiPanel;
