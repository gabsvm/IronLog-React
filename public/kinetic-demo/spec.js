// spec.js: Repyntra Kinetic Film launch trailer.
// Duration: 24.0s (51.2 beats at 128 BPM).
// High-energy kinetic typography, contrasting polarity, procedural sound cues,
// science-driven hypertrophy theme with Peak Signal branding.

import { Words, Strike, Graph, Fly, Counters, Chain, Progress, Logo } from './blocks.js';

export default {
  title: 'Repyntra — Peak Signal',
  bpm: 128,
  beats: 51.2,
  fps: 60,
  palette: {
    bg: '#050506',
    paper: '#F2F2F2',
    ink: '#09090B',
    accent: '#C4F13A',
    hot: '#10B981',
    muted: '#8E8E93',
  },
  hud: 'REPYNTRA  ·  PEAK SIGNAL',
  hudOut: [49.5, 51.2],
  logo: 'logo.svg',

  scenes: [
    // -------------------------------------------------------------------------
    // Scene 1 (0–4b): STOP GUESSING YOUR GAINS (Hook)
    // -------------------------------------------------------------------------
    [Words, 0, 4, {
      layout: 'punch3d',
      bg: '#050506',
      text: 'STOP GUESSING YOUR GAINS',
      accent: 'GAINS',
      charge: true,
      fx: ['vignette', 'scanlines', 'grain'],
      shots: [
        { at: 0.8, style: 'punch3d', text: 'STOP', color: 'paper', fx: 'punch', big: true },
        { at: 1.8, style: 'slam', text: 'GUESSING YOUR', ground: 'bg', color: 'paper', fx: 'hit' },
        { at: 2.8, style: 'punch3d', text: 'GAINS', color: 'accent', fx: 'punch', big: true, glow: 32 },
      ],
      exit: { type: 'zoom', at: 3.7, char: 0 },
    }],

    // -------------------------------------------------------------------------
    // Scene 2 (4–9.5b): Kill Junk Volume (Contrasting Light Polarity)
    // -------------------------------------------------------------------------
    [Strike, 4, 9.5, {
      bg: '#F2F2F2',
      strike: 'JUNK VOLUME.',
      reveal: 'EVIDENCE-BASED HYPERTROPHY.',
      tag: '// RIR & MEV-MRV ENGINE',
      strikeColor: '#C4F13A',
      no: 'NO',
      items: [
        {
          at: 4.2,
          word: 'JUNK VOLUME.',
          ground: 'paper',
          ui: {
            type: 'timeline',
            title: 'arbitrary_bro_split_v3',
            tag: 'OVERTRAINING · HIGH FATIGUE',
          },
        },
        {
          at: 6.8,
          word: 'PLATEAUS.',
          ground: 'paper',
          ui: {
            type: 'tiles',
            tiles: [
              ['EMPTY SETS', '✕', '0 RIR PROXIMITY'],
              ['RANDOM LOAD', '∿', 'NO PROGRESSION'],
              ['SYSTEMIC BURNOUT', '⚠', 'EXCEEDED MRV'],
              ['ZERO TRACKING', '∅', 'UNSCIENTIFIC'],
            ],
          },
        },
      ],
    }],

    // -------------------------------------------------------------------------
    // Scene 3 (9.5–13.5b): Auto-Regulated Intensity (Lime Polarity Flip)
    // -------------------------------------------------------------------------
    [Words, 9.5, 13.5, {
      layout: 'slam',
      bg: '#C4F13A',
      color: '#09090B',
      text: 'AUTO-REGULATED INTENSITY',
      sub: '// EVERY SET CALIBRATED TO YOUR RECOVERY',
      shots: [
        { at: 9.8, style: 'slam', text: 'AUTO-REGULATED', ground: 'accent', color: 'ink', fx: 'punch', big: true },
        {
          at: 11.2,
          style: 'slam',
          text: 'INTENSITY.',
          ground: 'accent',
          color: 'ink',
          fx: 'punch',
          dot: true,
          note: '// EVERY SET CALIBRATED TO YOUR RECOVERY',
          noteAt: 0.4,
        },
      ],
      exit: { type: 'flash', at: 13.0 },
    }],

    // -------------------------------------------------------------------------
    // Scene 4 (13.5–19.5b): Mesocycle Progression Graph (Scientific Foundation)
    // -------------------------------------------------------------------------
    [Graph, 13.5, 19.5, {
      bg: '#050506',
      tag: '// MESOCYCLE PROGRESSION · MEV → MAV → MRV',
      stat: '+38% STIMULUS',
      badge: 'PEAK ACCUMULATION',
      points: [0.18, 0.30, 0.44, 0.58, 0.74, 0.88, 0.96],
      bars: [0.22, 0.36, 0.48, 0.62, 0.78, 0.90, 0.98, 0.40],
      number: '0',
      label: 'FATIGUE',
      sub: 'AUTO-REGULATED HYPERTROPHY',
      ground: 'bg',
      portal: true,
    }],

    // -------------------------------------------------------------------------
    // Scene 5 (19.5–25.5b): RIR Fly-Through (3D Perspective)
    // -------------------------------------------------------------------------
    [Fly, 19.5, 25.5, {
      bg: '#050506',
      items: [
        'WEEK 1 · 3 RIR',
        'WEEK 2 · 2 RIR',
        'WEEK 3 · 1 RIR',
        'WEEK 4 · 0 RIR',
        'PEAK OVERREACH',
        'SMART DELOAD',
      ],
      sub: '// PRECISION FATIGUE MANAGEMENT',
      words: [
        ['WEEK 1 · 3 RIR', 'paper'],
        ['WEEK 2 · 2 RIR', 'accent'],
        ['WEEK 3 · 1 RIR', 'paper'],
        ['WEEK 4 · 0 RIR', 'accent'],
        ['PEAK OVERREACH', 'hot'],
        ['SMART DELOAD', 'accent'],
      ],
    }],

    // -------------------------------------------------------------------------
    // Scene 6 (25.5–31.5b): Counters & Architecture (Light Polarity Flip)
    // -------------------------------------------------------------------------
    [Counters, 25.5, 31.5, {
      bg: '#F2F2F2',
      tag: '// BUILT FOR SERIOUS LIFTERS',
      items: [
        { to: 56, suffix: '+', label: 'BIOMECHANICAL EXERCISES' },
        { to: 100, suffix: '%', label: 'OFFLINE-FIRST ENGINE' },
        { to: 0, suffix: ' MS', label: 'LATENCY BETWEEN SETS' },
      ],
      title: 'repyntra / engine.ts',
      counters: [
        ['56+', 'BIOMECHANICAL EXERCISES'],
        ['100%', 'OFFLINE-FIRST ENGINE'],
        ['0 MS', 'LATENCY BETWEEN SETS'],
      ],
      whipOut: [1700, 0, 0.13, 2],
    }],

    // -------------------------------------------------------------------------
    // Scene 7 (31.5–37.5b): Closed-Loop Biofeedback Chain (Adaptive System)
    // -------------------------------------------------------------------------
    [Chain, 31.5, 37.5, {
      bg: '#050506',
      tag: '// CLOSED-LOOP BIOFEEDBACK',
      steps: [
        { title: 'LOG RIR & LOAD', tag: 'STEP 01' },
        { title: 'RATE PUMP & JOINT PAIN', tag: 'STEP 02' },
        { title: 'SCORE SORENESS', tag: 'STEP 03' },
        { title: 'AUTO-SCALE NEXT WEEK', tag: 'STEP 04', active: true },
      ],
      nodes: [
        ['LOG SETS', 'RIR · LOAD · PROXIMITY', 'paper'],
        ['BIOFEEDBACK', 'PUMP · SORENESS · FATIGUE', 'paper'],
        ['AUTO-SCALE.', 'ADAPTIVE VOLUME ENGINE', 'accent'],
      ],
      whipOut: [0, -1100, 0.13],
    }],

    // -------------------------------------------------------------------------
    // Scene 8 (37.5–41.5b): No Fluff / Pure Hypertrophy (Split Punch)
    // -------------------------------------------------------------------------
    [Words, 37.5, 41.5, {
      layout: 'split',
      bg: '#C4F13A',
      color: '#09090B',
      top: 'NO FLUFF',
      bottom: 'PURE HYPERTROPHY',
      shots: [
        {
          at: 37.8,
          style: 'split',
          text: ['NO FLUFF.', 'PURE HYPERTROPHY.'],
          ground: 'accent',
          color: 'ink',
          fx: 'punch',
          big: true,
          second: 0.8,
          code: true,
          glitch: 1.2,
        },
      ],
      exit: { type: 'collapse', at: 40.5, end: 41.3 },
    }],

    // -------------------------------------------------------------------------
    // Scene 9 (41.5–45.5b): Progress / Mesocycle Initialization
    // -------------------------------------------------------------------------
    [Progress, 41.5, 45.5, {
      bg: '#050506',
      label: 'INITIALIZING MESOCYCLE ENGINE...',
      sub: '// CALCULATING TARGET SETS & RIR TARGETS',
      from: 0.05,
      to: 1.0,
      lines: ['INITIALIZING', 'MESOCYCLE ENGINE...'],
      ground: 'bg',
      doneRight: 'CALIBRATED',
      cards: [
        ['CHEST', 'bg', 'accent'],
        ['BACK', 'accent', 'ink'],
        ['QUADS', 'bg', 'paper'],
        ['DELTS', 'accent', 'ink'],
        ['ARMS', 'bg', 'accent'],
        ['HAMS', 'paper', 'ink'],
        ['CALVES', 'bg', 'accent'],
      ],
    }],

    // -------------------------------------------------------------------------
    // Scene 10 (45.5–51.2b): Peak Signal Brand Lockup (Final Call)
    // -------------------------------------------------------------------------
    [Logo, 45.5, 51.2, {
      bg: '#050506',
      name: 'REPYNTRA',
      tagline: 'SCIENCE-DRIVEN HYPERTROPHY SYSTEM',
      url: 'REPYNTRA · PEAK SIGNAL',
      small: 'REPYNTRA · PEAK SIGNAL',
      wordmark: 'REPYNTRA',
      mark: ['peak_companion', 'peak_dominant'],
      word: ['word_repy', 'word_ntra'],
    }],
  ],

  // Synchronized Karaoke Captions track
  captions: [
    [0, 3.8, [['STOP', 0.8], ['GUESSING', 1.8], ['YOUR', 2.3], ['GAINS.', 2.8]]],
    [4, 9.2, [['Kill', 4.2], ['the', 4.5], ['junk', 5], ['volume.', 5.5], ['Evidence-based', 7], ['hypertrophy.', 7.8]]],
    [9.5, 13.2, [['Auto-regulated', 9.8], ['training', 10.6], ['intensity.', 11.2]]],
    [13.5, 19.2, [['Periodized', 13.8], ['mesocycle', 14.5], ['progression.', 15.5]]],
    [19.5, 25.2, [['Targeted', 19.8], ['RIR', 20.6], ['fatigue', 21.6], ['management.', 22.8]]],
    [25.5, 31.2, [['Biomechanical', 25.8], ['precision.', 26.8], ['Zero', 28.5], ['friction.', 29.2]]],
    [31.5, 37.2, [['Closed-loop', 31.8], ['biofeedback', 32.8], ['engine.', 34]]],
    [37.5, 41.2, [['No', 37.8], ['fluff.', 38.3], ['Pure', 39.2], ['hypertrophy.', 39.8]]],
    [41.5, 45.2, [['Calibrating', 41.8], ['next', 42.6], ['mesocycle.', 43.5]]],
    [45.5, 51.2, [['Repyntra.', 46.5], ['Peak', 48], ['Signal.', 48.8]]],
  ],
};
