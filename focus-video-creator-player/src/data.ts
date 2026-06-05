import { SessionData } from "./types";

export const INITIAL_SESSION_DATA: SessionData = {
  "video_prompt": {
    "meta": {
      "title": "Deep Focus + Creative Reset — 2h Session",
      "total_duration_minutes": 140,
      "format": "16:9",
      "resolution": "4K preferred / 1080p minimum",
      "frame_rate": 30,
      "target_audience": "personas que buscan concentración profunda, estudiantes, creadores",
      "youtube_tags": ["concentración", "focus", "ondas alfa", "ondas gamma", "binaural", "study", "deep work", "meditación activa", "doodle", "box breathing"],
      "thumbnail_concept": "río sereno al amanecer, tonos azul pálido y verde sage, sin texto perturbador"
    },

    "segments": [
      {
        "id": "block_1_alpha",
        "label": "Bloque 1 — Concentración Alfa",
        "start_time": "00:00:00",
        "end_time": "01:00:00",
        "duration_minutes": 60,
        "audio": {
          "type": "binaural_beats + ambient",
          "frequency_hz": "8–12",
          "wave_type": "alpha",
          "carrier_frequency_hz": 200,
          "beat_frequency_hz": 10,
          "ambient_layer": "sonido de río suave, sin música melódica",
          "volume_curve": "fade_in primeros 30s, constante el resto",
          "notes": "los audífonos son recomendados para efecto binaural; añadir aviso en descripción"
        },
        "visual": {
          "type": "video_loop_ambient",
          "scene": "río tranquilo filmado a nivel de agua",
          "movement": "flujo lento del agua, pequeñas ondulaciones superficiales",
          "color_palette": {
            "primary": "#A8C8B8",
            "secondary": "#D4E8E0",
            "accent": "#8BB5C8",
            "notes": "tonos verdes sage, azul grisáceo, blancos suaves — sin colores saturados"
          },
          "color_grade": "desaturado 20%, temperatura cálida +5, sombras levemente azules",
          "camera": "estática o paneo lentísimo, sin cortes abruptos",
          "overlay": {
            "clock": {
              "visible": true,
              "style": "minimalista, esquina inferior derecha",
              "format": "countdown 60:00 → 00:00",
              "font": "thin sans-serif, baja opacidad 30%"
            },
            "progress_bar": {
              "visible": true,
              "position": "bottom",
              "style": "línea delgada 1px, blanco 20% opacidad"
            }
          },
          "text_on_screen": "ninguno durante el bloque, silencio visual total"
        }
      },
      {
        "id": "break_1_doodle",
        "label": "Pausa Creativa — Doodle Guiado",
        "start_time": "01:00:00",
        "end_time": "01:10:00",
        "duration_minutes": 10,
        "sub_segments": [
          {
            "id": "prep_timer",
            "label": "Preparación — Temporizador 15 segundos",
            "duration_seconds": 15,
            "audio": {
              "type": "silencio total",
              "notes": "sin música, sin binaural, solo silencio para romper el estado alfa"
            },
            "visual": {
              "background": "#0A0F1A",
              "type": "prep_countdown",
              "element": "temporizador circular countdown",
              "timer_design": {
                "style": "círculo con trazo que se vacía en 15 segundos",
                "number": "dígitos grandes al centro, tipografía ligera",
                "color": "#F5F0E8",
                "animation": "suave, no parpadeante",
                "accompanying_text": "Toma tu lápiz y papel. Prepárate para fluir.",
                "text_position": "debajo del temporizador",
                "text_size": "pequeño, discreto"
              }
            }
          },
          {
            "id": "doodle_session",
            "label": "Doodle — Imagen Celestial en Movimiento",
            "duration_minutes": 9,
            "duration_seconds": 45,
            "audio": {
              "type": "ambient suave instrumental",
              "frequency_hz": null,
              "notes": "música muy suave, sin letra, puede ser piano o cuencos tibetanos a volumen bajo"
            },
            "visual": {
              "type": "animated_dot_drawing",
              "concept": "un punto luminoso que traza lentamente una imagen celestial",
              "image_options": [
                "luna creciente con estrellas en espiral",
                "mandala circular con rayos solares",
                "constelación conectada punto a punto",
                "flor de loto con pétalos geométricos",
                "ojo cósmico con detalles de galaxia"
              ],
              "dot_style": {
                "color": "#E8D5A3",
                "size": "8px",
                "glow": "blur (4px)",
                "trail": "rastro tenue que muestra el trazo completado, opacidad 60%"
              },
              "speed": "muy lento, el usuario puede seguirlo cómodamente con lápiz",
              "background": "#0A0F1A",
              "instruction_text": {
                "visible": true,
                "text": "Sigue el trazo con tu lápiz. No pienses. Solo fluye.",
                "position": "parte superior, fade out a los 10 segundos",
                "style": "itálica, baja opacidad"
              },
              "loop": false,
              "completion": {
                "final_frame": "imagen completa visible por 5 segundos",
                "transition": "fade out lento a negro"
              }
            }
          }
        ]
      },
      {
        "id": "block_2_gamma",
        "label": "Bloque 2 — Concentración Gamma",
        "start_time": "01:10:00",
        "end_time": "02:10:00",
        "duration_minutes": 60,
        "audio": {
          "type": "binaural_beats + ambient",
          "frequency_hz": "30–100",
          "wave_type": "gamma",
          "carrier_frequency_hz": 200,
          "beat_frequency_hz": 40,
          "ambient_layer": "sonido de río, mismo que bloque 1 pero sutilmente más nítido",
          "volume_curve": "fade_in primeros 20s, constante el resto",
          "notes": "40 Hz es el punto gamma más estudiado para cognición. Requiere audífonos."
        },
        "visual": {
          "type": "video_loop_ambient",
          "scene": "mismo río, mismo encuadre que Bloque 1",
          "movement": "idéntico al bloque 1 para no romper el estado de flow",
          "color_palette": {
            "primary": "#A8C8B8",
            "secondary": "#D4E8E0",
            "accent": "#8BB5C8",
            "notes": "mismos colores que bloque 1 — continuidad visual intencional"
          },
          "color_grade": "igual al bloque 1",
          "camera": "estática o paneo lentísimo",
          "overlay": {
            "clock": {
              "visible": true,
              "style": "minimalista, esquina inferior derecha",
              "format": "countdown 60:00 → 00:00",
              "font": "thin sans-serif, baja opacidad 30%"
            },
            "block_indicator": {
              "visible": true,
              "text": "Bloque 2",
              "position": "esquina superior izquierda, fade out a 10 segundos",
              "opacity": "20%"
            }
          },
          "text_on_screen": "ninguno durante el bloque"
        }
      },
      {
        "id": "break_2_breathing",
        "label": "Cierre — Respiración Box Breathing 4-4-4-4",
        "start_time": "02:10:00",
        "end_time": "02:20:00",
        "duration_minutes": 10,
        "audio": {
          "type": "ambient + cue_sounds",
          "notes": "música muy suave de fondo, sin binaural. Sonido tonal suave en cada cambio de fase (campana o bol tibetano)",
          "cue_sound_on_phase_change": true
        },
        "visual": {
          "type": "interactive_breathing_guide",
          "background": "#0A0F1A",
          "layout": "centrado, un solo elemento dominante en pantalla",
          "box_element": {
            "shape": "rectángulo redondeado",
            "size": "400x400px aproximado",
            "color": "#E2F1FF",
            "corner_radius": "16px"
          },
          "ball_element": {
            "shape": "círculo",
            "size": "22px",
            "color": "#E2F1FF",
            "glow": "blur(6px)",
            "motion": "se desplaza suavemente por los 4 lados del rectángulo siguiendo el ciclo"
          },
          "breathing_cycle": {
            "total_cycle_seconds": 16,
            "phases": [
              {
                "id": "inhale",
                "label": "Inhala",
                "counts": 4,
                "seconds": 4,
                "ball_direction": "sube por el lado izquierdo (abajo → arriba)",
                "instruction_text": "Inhala...",
                "counter_display": "1 · 2 · 3 · 4",
                "text_color": "#A8D8EA"
              },
              {
                "id": "hold_in",
                "label": "Sostén",
                "counts": 4,
                "seconds": 4,
                "ball_direction": "se desplaza por la parte superior (izquierda → derecha)",
                "instruction_text": "Sostén...",
                "counter_display": "1 · 2 · 3 · 4",
                "text_color": "#E8D5A3"
              },
              {
                "id": "exhale",
                "label": "Exhala",
                "counts": 4,
                "seconds": 4,
                "ball_direction": "baja por el lado derecho (arriba → abajo)",
                "instruction_text": "Exhala...",
                "counter_display": "1 · 2 · 3 · 4",
                "text_color": "#B8E0B8"
              },
              {
                "id": "hold_out",
                "label": "Sostén sin aire",
                "counts": 4,
                "seconds": 4,
                "ball_direction": "recorre la parte inferior (derecha → izquierda)",
                "instruction_text": "Sostén...",
                "counter_display": "1 · 2 · 3 · 4",
                "text_color": "#D4A8C8"
              }
            ],
            "repetitions": 37,
            "notes": "37 ciclos de 16s ≈ 9.8 minutos. El ciclo 38 es el fade out."
          },
          "closing_sequence": {
            "duration_seconds": 15,
            "content": "Sesión completada. Bien hecho.",
            "transition": "fade out lento a negro total",
            "final_frame": "negro 5 segundos, fin de video"
          }
        }
      }
    ],

    "production_notes": {
      "music_generation": {
        "tool_suggestions": ["Brain.fm", "MyNoise.net (binaural presets)", "Adobe Audition binaural plugin", "isochronic tones generator"],
        "alpha_track": "generar tono binaural 10 Hz con portadora de 200 Hz · exportar 60 min WAV",
        "gamma_track": "generar tono binaural 40 Hz con portadora de 200 Hz · exportar 60 min WAV",
        "disclaimer_on_video": "Usa audífonos para el efecto binaural. No recomendado para personas con epilepsia."
      },
      "river_footage": {
        "sources": ["Pexels.com — búsqueda: 'river slow motion 4K'", "Pixabay", "footage propio recomendado para diferenciación"],
        "loop_technique": "cortar en un frame neutro para loop invisible · mínimo 5 min de metraje base",
        "color_grading_software": "DaVinci Resolve (LUT personalizada), Premiere Pro o CapCut Pro"
      },
      "doodle_animation": {
        "tools": ["Adobe After Effects con plugin Motion Bro", "Procreate exportado como GIF con path animation", "Rive.app para animación de trazo"],
        "style_ref": "búsqueda: 'sacred geometry line animation' o 'dot tracing mandala video'"
      },
      "youtube_optimization": {
        "title_formula": "[Tiempo] de Concentración Profunda · Ondas Alfa + Gamma · Focus Total",
        "description_first_line": "2 horas de concentración guiada: Ondas Alfa para entrar en estado de flow, pausa creativa con doodle, Ondas Gamma para concentración máxima y cierre con box breathing.",
        "chapters": [
          "00:00 Bloque 1 — Concentración Alfa (8–12 Hz)",
          "01:00 Pausa Creativa — Doodle Guiado",
          "01:10 Bloque 2 — Concentración Gamma (40 Hz)",
          "02:10 Respiración 4-4-4-4 — Box Breathing"
        ],
        "end_screen": "últimos 20 segundos: recomendar siguiente video de la serie",
        "cards": "añadir card a los 45 min con playlist completa de la serie"
      }
    }
  }
};
