export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  notes?: string;
}

export interface ClockOverlay {
  visible: boolean;
  style: string;
  format: string; // countdown 60:00 -> 00:00
  font: string;
}

export interface ProgressBarOverlay {
  visible: boolean;
  position: string;
  style: string;
}

export interface BlockIndicatorOverlay {
  visible: boolean;
  text: string;
  position: string;
  opacity: string;
}

export interface VisualOverlay {
  clock?: ClockOverlay;
  progress_bar?: ProgressBarOverlay;
  block_indicator?: BlockIndicatorOverlay;
}

export interface AudioSettings {
  type: string; // binaural_beats + ambient, ambient suave instrumental, ambient + cue_sounds, etc.
  frequency_hz?: string | number | null;
  wave_type?: string; // alpha, gamma
  carrier_frequency_hz?: number;
  beat_frequency_hz?: number;
  ambient_layer?: string;
  volume_curve?: string;
  notes?: string;
  cue_sound_on_phase_change?: boolean;
}

export interface VisualSettings {
  type: string; // video_loop_ambient, animated_dot_drawing, interactive_breathing_guide, etc.
  scene?: string;
  movement?: string;
  color_palette?: ColorPalette;
  color_grade?: string;
  camera?: string;
  overlay?: VisualOverlay;
  text_on_screen?: string;
  element?: string;
  timer_design?: any;
  // Doodle specific
  concept?: string;
  image_options?: string[];
  dot_style?: {
    color: string;
    size: string; // e.g. "6–10px"
    glow: string;
    trail: string;
  };
  speed?: string;
  background?: string;
  instruction_text?: {
    visible: boolean;
    text: string;
    position: string;
    style: string;
  };
  loop?: boolean;
  completion?: {
    final_frame: string;
    transition: string;
  };
  // Breathing specific
  layout?: string;
  box_element?: {
    shape: string;
    size: string;
    color: string;
    corner_radius: string;
  };
  ball_element?: {
    shape: string;
    size: string;
    color: string;
    glow: string;
    motion: string;
  };
  breathing_cycle?: {
    total_cycle_seconds: number;
    phases: BreathingPhase[];
    repetitions: number;
    notes?: string;
  };
  closing_sequence?: {
    duration_seconds: number;
    content: string;
    transition: string;
    final_frame: string;
  };
}

export interface BreathingPhase {
  id: "inhale" | "hold_in" | "exhale" | "hold_out";
  label: string;
  counts: number;
  seconds: number;
  ball_direction: string;
  instruction_text: string;
  counter_display: string;
  text_color: string;
}

export interface SubSegment {
  id: string;
  label: string;
  duration_seconds?: number;
  duration_minutes?: number;
  audio: AudioSettings;
  visual: VisualSettings;
}

export interface Segment {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  audio?: AudioSettings;
  visual?: VisualSettings;
  sub_segments?: SubSegment[];
}

export interface Meta {
  title: string;
  total_duration_minutes: number;
  format: string;
  resolution: string;
  frame_rate: number;
  target_audience: string;
  youtube_tags: string[];
  thumbnail_concept: string;
}

export interface ProductionNotes {
  music_generation: {
    tool_suggestions: string[];
    alpha_track: string;
    gamma_track: string;
    disclaimer_on_video: string;
  };
  river_footage: {
    sources: string[];
    loop_technique: string;
    color_grading_software: string;
  };
  doodle_animation: {
    tools: string[];
    style_ref: string;
  };
  youtube_optimization: {
    title_formula: string;
    description_first_line: string;
    chapters: string[];
    end_screen: string;
    cards: string;
  };
}

export interface VideoPrompt {
  meta: Meta;
  segments: Segment[];
  production_notes: ProductionNotes;
}

export interface SessionData {
  video_prompt: VideoPrompt;
}
