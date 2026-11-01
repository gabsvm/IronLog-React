import openpyxl, glob, os, re, json

files = sorted(glob.glob('C:/Dev/rp-templates-extracted/*.xlsx'))

# Muscle mapping helper: maps RP slot label to (MuscleGroup, default exerciseId in defaultLibrary, default en note, default es note)
SLOT_MAPPINGS = {
    # Quads
    'quad': ('QUADS', 'sq_bar', 'Quads (Squat / Leg Press / Hack)', 'Cuádriceps (Sentadilla / Prensa / Hack)'),
    'quads': ('QUADS', 'sq_bar', 'Quads (Squat / Leg Press / Hack)', 'Cuádriceps (Sentadilla / Prensa / Hack)'),
    
    # Hamstrings
    'hamstrings hip hinge': ('HAMSTRINGS', 'rdl', 'Hamstring Hinge (RDL / SLDL / Good Morning)', 'Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)'),
    'hip hinge hams': ('HAMSTRINGS', 'rdl', 'Hamstring Hinge (RDL / SLDL / Good Morning)', 'Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)'),
    'hamstring hip hinge': ('HAMSTRINGS', 'rdl', 'Hamstring Hinge (RDL / SLDL / Good Morning)', 'Isquios Bisagra (RDL / Piernas Rígidas / Buenos Días)'),
    'hamstrings isolation': ('HAMSTRINGS', 'leg_curl', 'Hamstring Isolation (Seated/Lying Leg Curl)', 'Isquios Aislamiento (Curl Femoral Sentado/Tumbado)'),
    'isolation hams': ('HAMSTRINGS', 'leg_curl', 'Hamstring Isolation (Seated/Lying Leg Curl)', 'Isquios Aislamiento (Curl Femoral Sentado/Tumbado)'),
    'hamstring isolation': ('HAMSTRINGS', 'leg_curl', 'Hamstring Isolation (Seated/Lying Leg Curl)', 'Isquios Aislamiento (Curl Femoral Sentado/Tumbado)'),
    
    # Glutes
    'glute': ('GLUTES', 'glute_bridge', 'Glutes (Bridge / Lunge / Sumo DL)', 'Glúteos (Puente / Zancadas / Peso Muerto Sumo)'),
    'glutes': ('GLUTES', 'glute_bridge', 'Glutes (Bridge / Lunge / Sumo DL)', 'Glúteos (Puente / Zancadas / Peso Muerto Sumo)'),
    
    # Calves
    'calves': ('CALVES', 'calf_raise', 'Calves (Standing / Machine / Leg Press)', 'Gemelos (De Pie / Máquina / Prensa)'),
    'calf': ('CALVES', 'calf_raise', 'Calves (Standing / Machine / Leg Press)', 'Gemelos (De Pie / Máquina / Prensa)'),
    
    # Chest
    'incline push': ('CHEST', 'bp_inc_bar', 'Incline Push (Barbell / DB / Machine)', 'Empuje Inclinado (Barra / Mancuerna / Máquina)'),
    'incline chest': ('CHEST', 'bp_inc_bar', 'Incline Push (Barbell / DB / Machine)', 'Empuje Inclinado (Barra / Mancuerna / Máquina)'),
    'horizontal push': ('CHEST', 'bp_bar', 'Horizontal Push (Bench / DB / Machine Press)', 'Empuje Horizontal (Banca Plana / Mancuerna / Máquina)'),
    'horizontal chest': ('CHEST', 'bp_bar', 'Horizontal Push (Bench / DB / Machine Press)', 'Empuje Horizontal (Banca Plana / Mancuerna / Máquina)'),
    'chest isolation': ('CHEST', 'pec_fly', 'Chest Isolation (Pec Dec / Cable Flye / DB Flye)', 'Aislamiento Pecho (Pec Dec / Aperturas Polea)'),
    'chest isolation or triceps': ('CHEST', 'pec_fly', 'Chest Isolation or Triceps', 'Aislamiento Pecho o Tríceps'),
    
    # Back
    'vertical pull': ('BACK', 'lat_pull', 'Vertical Pull (Pulldowns / Pullups / Chinups)', 'Tracción Vertical (Jalones / Dominadas)'),
    'vertical back': ('BACK', 'lat_pull', 'Vertical Pull (Pulldowns / Pullups / Chinups)', 'Tracción Vertical (Jalones / Dominadas)'),
    'horizontal pull': ('BACK', 'bent_barbell_row', 'Horizontal Pull (Barbell / DB / Cable Row)', 'Tracción Horizontal (Remo Barra / Mancuerna / Polea)'),
    'horizonal back': ('BACK', 'bent_barbell_row', 'Horizontal Pull (Barbell / DB / Cable Row)', 'Tracción Horizontal (Remo Barra / Mancuerna / Polea)'),
    'horizontal back': ('BACK', 'bent_barbell_row', 'Horizontal Pull (Barbell / DB / Cable Row)', 'Tracción Horizontal (Remo Barra / Mancuerna / Polea)'),
    
    # Shoulders
    'front delts': ('SHOULDERS', 'ohp', 'Front Delts (Standing/Seated Overhead Press)', 'Deltoide Frontal (Press Militar Barra / Mancuerna)'),
    'front delt': ('SHOULDERS', 'ohp', 'Front Delts (Standing/Seated Overhead Press)', 'Deltoide Frontal (Press Militar Barra / Mancuerna)'),
    'side delts': ('SHOULDERS', 'lat_raise', 'Side Delts (Lateral Raises / Upright Row)', 'Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)'),
    'side delt': ('SHOULDERS', 'lat_raise', 'Side Delts (Lateral Raises / Upright Row)', 'Deltoide Lateral (Elevaciones Laterales / Remo al Cuello)'),
    'rear delts': ('SHOULDERS', 'rear_delt_fly', 'Rear Delts (Facepulls / Rear Delt Flyes)', 'Deltoide Posterior (Pájaros / Facepulls)'),
    'rear delt': ('SHOULDERS', 'rear_delt_fly', 'Rear Delts (Facepulls / Rear Delt Flyes)', 'Deltoide Posterior (Pájaros / Facepulls)'),
    'rear delts or side delts': ('SHOULDERS', 'rear_delt_fly', 'Rear or Side Delts', 'Deltoide Posterior o Lateral'),
    'rear or side delts': ('SHOULDERS', 'rear_delt_fly', 'Rear or Side Delts', 'Deltoide Posterior o Lateral'),
    
    # Arms
    'biceps': ('BICEPS', 'curl_bar', 'Biceps (Barbell / DB / Cable Curl)', 'Bíceps (Curl Barra / Mancuerna / Polea)'),
    'bicep': ('BICEPS', 'curl_bar', 'Biceps (Barbell / DB / Cable Curl)', 'Bíceps (Curl Barra / Mancuerna / Polea)'),
    'triceps': ('TRICEPS', 'tri_push', 'Triceps (Pushdowns / Dips / Skullcrushers)', 'Tríceps (Extensiones en Polea / Fondos / Press Francés)'),
    'tricep': ('TRICEPS', 'tri_push', 'Triceps (Pushdowns / Dips / Skullcrushers)', 'Tríceps (Extensiones en Polea / Fondos / Press Francés)'),
    'horizontal triceps': ('TRICEPS', 'tri_push', 'Horizontal Triceps (Pushdowns / Dips / Skullcrushers)', 'Tríceps Horizontal (Polea / Fondos / Francés)'),
    'vertical triceps': ('TRICEPS', 'tri_ext', 'Vertical Triceps (Overhead Triceps Extensions)', 'Tríceps Vertical (Extensiones por encima de la cabeza)'),
    
    # Traps & Abs
    'traps': ('TRAPS', 'shrug_db', 'Traps (Barbell / DB Shrugs)', 'Trapecios (Encogimientos Barra / Mancuerna)'),
    'trap': ('TRAPS', 'shrug_db', 'Traps (Barbell / DB Shrugs)', 'Trapecios (Encogimientos Barra / Mancuerna)'),
    'abs': ('ABS', 'knee_raise', 'Abs (Hanging Knee/Leg Raises / Cable Crunches)', 'Abdomen (Elevaciones de Piernas / Encogimientos Polea)'),
}

DAY_TITLE_TRANSLATIONS = {
    'push emphasis': ('Push Emphasis', 'Énfasis en Empuje'),
    'legs emphasis': ('Legs Emphasis', 'Énfasis en Piernas'),
    'pull emphasis': ('Pull Emphasis', 'Énfasis en Tracción / Espalda'),
    'upper body': ('Upper Body', 'Torso / Tren Superior'),
    'lower body': ('Lower Body', 'Pierna / Tren Inferior'),
    'heavy quads': ('Heavy Quads', 'Cuádriceps Pesado'),
    'heavy glutes': ('Heavy Glutes', 'Glúteos Pesado'),
    'high rep quads': ('High Rep Quads', 'Cuádriceps Reps Altas'),
    'high rep hams': ('High Rep Hamstrings', 'Isquios Reps Altas'),
    'chest upper': ('Chest Upper', 'Pecho y Tren Superior'),
    'back upper': ('Back Upper', 'Espalda y Tren Superior'),
    'shoulders/arms upper': ('Shoulders & Arms Upper', 'Hombros y Brazos'),
    'glute/ham focused legs': ('Glute & Hamstring Focused Legs', 'Piernas (Glúteo e Isquios)'),
    'quads focused legs': ('Quad Focused Legs', 'Piernas (Enfoque Cuádriceps)'),
    'quad focused legs': ('Quad Focused Legs', 'Piernas (Enfoque Cuádriceps)'),
    'chest focused upper': ('Chest Focused Upper', 'Tren Superior (Enfoque Pecho)'),
    'back focused upper': ('Back Focused Upper', 'Tren Superior (Enfoque Espalda)'),
    'arms focused upper': ('Arms Focused Upper', 'Tren Superior (Enfoque Brazos)'),
    'quad focused lower': ('Quad Focused Lower', 'Tren Inferior (Enfoque Cuádriceps)'),
    'glute focused lower': ('Glute Focused Lower', 'Tren Inferior (Enfoque Glúteos)'),
    'ham calf shoulder focused': ('Hamstrings, Calves & Shoulders', 'Isquios, Gemelos y Hombro'),
    'triceps front delts': ('Triceps & Front Delts', 'Tríceps y Deltoide Frontal'),
    'triceps front delts push': ('Triceps & Front Delts Push', 'Empuje Tríceps y Deltoide Frontal'),
    'front delts triceps push': ('Front Delts & Triceps Push', 'Empuje Deltoide Frontal y Tríceps'),
    'biceps side rear delts': ('Biceps, Side & Rear Delts', 'Bíceps, Lateral y Posterior'),
    'biceps side rear delts pull': ('Biceps, Side & Rear Delts Pull', 'Tirón Bíceps, Lateral y Posterior'),
    'bicep rear/side delt': ('Biceps, Rear & Side Delts', 'Bíceps, Posterior y Lateral'),
    'tricep/ front delt': ('Triceps & Front Delts', 'Tríceps y Deltoide Frontal'),
    'front, side delts, triceps upper': ('Delts & Triceps Upper', 'Deltoides y Tríceps Torso'),
    'rear, side delts, biceps upper': ('Rear Delts & Biceps Upper', 'Deltoide Posterior y Bíceps Torso'),
    'chest/back, shoulders/arms': ('Chest, Back, Shoulders & Arms', 'Pecho, Espalda, Hombros y Brazos'),
    'legs, chest': ('Legs & Chest', 'Piernas y Pecho'),
    'legs, back': ('Legs & Back', 'Piernas y Espalda'),
    'arms': ('Arms & Shoulders', 'Brazos y Hombros'),
    'chest': ('Chest & Push', 'Pecho y Empuje'),
    'back': ('Back & Pull', 'Espalda y Tracción'),
    'chest/back': ('Chest & Back', 'Pecho y Espalda'),
    'chest/quads': ('Chest & Quads', 'Pecho y Cuádriceps'),
    'back/hams': ('Back & Hamstrings', 'Espalda e Isquios'),
    'shoulders/arms': ('Shoulders & Arms', 'Hombros y Brazos'),
    'legs lower rep, lower sets': ('Legs (Lower Reps & Sets)', 'Piernas (Menos Volumen / Más Pesado)'),
    'push': ('Push Day', 'Día Empuje'),
    'pull': ('Pull Day', 'Día Tirón'),
    'legs': ('Legs Day', 'Día Pierna'),
    'quad focused': ('Quad Focused', 'Enfoque Cuádriceps'),
    'glute focused': ('Glute Focused', 'Enfoque Glúteos'),
    'upper body push': ('Upper Body Push', 'Tren Superior Empuje'),
    'upper body pull': ('Upper Body Pull', 'Tren Superior Tirón'),
    'ham calf focused': ('Hamstrings & Calves', 'Isquios y Gemelos'),
    'upper body shoulders arms': ('Shoulders & Arms Upper', 'Hombros y Brazos Torso'),
}

def translate_day_title(day_num, raw_title):
    clean = raw_title.lower().strip()
    if clean in DAY_TITLE_TRANSLATIONS:
        en, es = DAY_TITLE_TRANSLATIONS[clean]
        return {'en': f"Day {day_num}: {en}", 'es': f"Día {day_num}: {es}"}
    for k, (en, es) in DAY_TITLE_TRANSLATIONS.items():
        if k in clean:
            return {'en': f"Day {day_num}: {en}", 'es': f"Día {day_num}: {es}"}
    return {'en': f"Day {day_num}: {raw_title}", 'es': f"Día {day_num}: {raw_title}"}

def resolve_slot(label):
    l = label.lower().strip()
    if l in SLOT_MAPPINGS:
        return SLOT_MAPPINGS[l]
    for k, v in SLOT_MAPPINGS.items():
        if k in l:
            return v
    return ('CHEST', 'bp_bar', label, label)

# Metadata for each program
METADATA = {
    '[RP MPT Novice-Intermediate] 3x - Full Body - original.xlsx': {
        'id': 'rp_fb_3x',
        'order': 20,
        'title': {'en': 'RP MPT Full Body (3 Days)', 'es': 'RP MPT Cuerpo Completo (3 Días)'},
        'description': {
            'en': 'Official Renaissance Periodization 3-day full body rotation. Alternates Push, Legs, and Pull emphasis with scientific MEV volume landmarks.',
            'es': 'Rutina oficial Renaissance Periodization de cuerpo completo en 3 días. Alterna énfasis en Empuje, Piernas y Tirón con volumen MEV optimizado.'
        }
    },
    '[RP MPT Novice-Intermediate] 5x - Full Body 2.0.xlsx': {
        'id': 'rp_fb_5x',
        'order': 21,
        'title': {'en': 'RP MPT Full Body (5 Days)', 'es': 'RP MPT Cuerpo Completo (5 Días)'},
        'description': {
            'en': 'High-frequency 5-day full body split by Dr. Mike Israetel. Distributes volume across Chest Upper, Quad Legs, Back Upper, Glute/Ham Legs, and Shoulders/Arms.',
            'es': 'Rutina de alta frecuencia en 5 días por el Dr. Mike Israetel. Distribuye el volumen entre Pecho Torso, Pierna Cuádriceps, Espalda Torso, Glúteo/Isquio y Hombros/Brazos.'
        }
    },
    '[RP MPT Novice-Intermediate] 6x - Full Body 2.0.xlsx': {
        'id': 'rp_fb_6x',
        'order': 22,
        'title': {'en': 'RP MPT Full Body (6 Days)', 'es': 'RP MPT Cuerpo Completo (6 Días)'},
        'description': {
            'en': 'Elite 6-day hypertrophy frequency split. Alternates Chest Upper, Quad Lower, Arms Upper, Glute Lower, Back Upper, and Ham/Calf/Shoulder focus.',
            'es': 'Rutina élite de 6 días de alta frecuencia. Alterna Pecho Torso, Cuádriceps Pierna, Brazos Torso, Glúteos Pierna, Espalda Torso e Isquios/Gemelos.'
        }
    },
    '[RP MPT Novice-Intermediate] 3x - Arms&Delts.xlsx': {
        'id': 'rp_arms_3x',
        'order': 23,
        'title': {'en': 'RP MPT Arms & Delts (3 Days)', 'es': 'RP MPT Brazos y Hombros (3 Días)'},
        'description': {
            'en': '3-Day arm and shoulder specialization template. Places high priority on biceps, triceps, side and rear delts while maintaining torso and leg mass.',
            'es': 'Especialización en brazos y deltoides en 3 días. Prioriza bíceps, tríceps, hombro lateral y posterior manteniendo masa en torso y piernas.'
        }
    },
    '[RP MPT Novice-Intermediate] 4x - Arms&Delts.xlsx': {
        'id': 'rp_arms_4x',
        'order': 24,
        'title': {'en': 'RP MPT Arms & Delts (4 Days)', 'es': 'RP MPT Brazos y Hombros (4 Días)'},
        'description': {
            'en': '4-Day hypertrophy split with dedicated Triceps/Front Delts and Biceps/Side-Rear Delts priority sessions alongside compounds.',
            'es': 'Especialización de 4 días con sesiones dedicadas a Tríceps/Deltoide Frontal y Bíceps/Lateral-Posterior combinadas con ejercicios compuestos.'
        }
    },
    '[RP MPT Novice-Intermediate] 5x - Arms&Delts 2.0.xlsx': {
        'id': 'rp_arms_5x',
        'order': 25,
        'title': {'en': 'RP MPT Arms & Delts (5 Days)', 'es': 'RP MPT Brazos y Hombros (5 Días)'},
        'description': {
            'en': '5-Day high-volume arm and delt specialization. Maximum adaptive volume for cannons and boulder shoulders with periodized recovery days.',
            'es': 'Especialización de 5 días de alto volumen para brazos y hombros. Máximo volumen adaptativo (MAV) con días de recuperación estructurados.'
        }
    },
    '[RP MPT Novice-Intermediate] 6x - Arms&Delts.xlsx': {
        'id': 'rp_arms_6x',
        'order': 26,
        'title': {'en': 'RP MPT Arms & Delts (6 Days)', 'es': 'RP MPT Brazos y Hombros (6 Días)'},
        'description': {
            'en': 'Ultimate 6-day arm and shoulder specialization split. High-frequency arm blasting with optimized systemic fatigue management.',
            'es': 'Máxima especialización en 6 días para brazos y deltoides. Alta frecuencia con gestión científica de la fatiga sistémica.'
        }
    },
    '[RP MPT Novice-Intermediate] 3x - Chest&Back.xlsx': {
        'id': 'rp_cb_3x',
        'order': 27,
        'title': {'en': 'RP MPT Chest & Back (3 Days)', 'es': 'RP MPT Pecho y Espalda (3 Días)'},
        'description': {
            'en': '3-Day torso specialization routine. Concentrates maximal volume on upper/horizontal chest and lat/upper-back thickness.',
            'es': 'Especialización de torso en 3 días. Concentra volumen máximo en pecho y amplitud/grosor de espalda manteniendo las piernas.'
        }
    },
    '[RP MPT Novice-Intermediate] 4x - Chest&Back.xlsx': {
        'id': 'rp_cb_4x',
        'order': 28,
        'title': {'en': 'RP MPT Chest & Back (4 Days)', 'es': 'RP MPT Pecho y Espalda (4 Días)'},
        'description': {
            'en': '4-Day Chest & Back specialization split. Alternating dedicated Chest-emphasis and Back-emphasis sessions for maximum upper body growth.',
            'es': 'Especialización en 4 días alternando días de Pecho y días de Espalda para maximizar el crecimiento del tren superior.'
        }
    },
    '[RP MPT Novice-Intermediate] 5x - Chest&Back.xlsx': {
        'id': 'rp_cb_5x',
        'order': 29,
        'title': {'en': 'RP MPT Chest & Back (5 Days)', 'es': 'RP MPT Pecho y Espalda (5 Días)'},
        'description': {
            'en': '5-Day torso hypertrophy split. High frequency horizontal/incline pushes, vertical/horizontal pulls, and isolation finishers.',
            'es': 'Rutina de 5 días de hipertrofia para torso. Alta frecuencia en empujes y tracciones con aislamiento de soporte.'
        }
    },
    '[RP MPT Novice-Intermediate] 6x - Chest&Back 2.0.xlsx': {
        'id': 'rp_cb_6x',
        'order': 30,
        'title': {'en': 'RP MPT Chest & Back (6 Days)', 'es': 'RP MPT Pecho y Espalda (6 Días)'},
        'description': {
            'en': '6-Day high-frequency Chest & Back builder. 3 dedicated chest days and 3 dedicated back days distributed throughout the week.',
            'es': 'Rutina de 6 días de alta frecuencia para pecho y espalda. 3 días dedicados a pecho y 3 días dedicados a espalda a lo largo de la semana.'
        }
    },
    '[RP MPT Novice-Intermediate] 4x - Legs.xlsx': {
        'id': 'rp_legs_4x',
        'order': 31,
        'title': {'en': 'RP MPT Legs Focus (4 Days)', 'es': 'RP MPT Especialización Pierna (4 Días)'},
        'description': {
            'en': '4-Day lower body specialization. Heavy Quads, Heavy Glutes, High-Rep Quads, and High-Rep Hamstrings/Calves with upper body maintenance.',
            'es': 'Especialización en pierna de 4 días: Cuádriceps Pesado, Glúteos Pesado, Cuádriceps Reps Altas e Isquios/Gemelos con mantenimiento de torso.'
        }
    },
    '[RP MPT Novice-Intermediate] 5x - Legs.xlsx': {
        'id': 'rp_legs_5x',
        'order': 32,
        'title': {'en': 'RP MPT Legs Focus (5 Days)', 'es': 'RP MPT Especialización Pierna (5 Días)'},
        'description': {
            'en': '5-Day lower body specialization. 3 targeted leg workouts per week covering quads, glutes, hamstrings, and calves with dedicated upper days.',
            'es': 'Especialización en pierna de 5 días. 3 entrenamientos de pierna por semana cubriendo cuádriceps, glúteos, isquios y gemelos con días de torso.'
        }
    },
    '[RP MPT Novice-Intermediate] 6x - Legs.xlsx': {
        'id': 'rp_legs_6x',
        'order': 33,
        'title': {'en': 'RP MPT Legs Focus (6 Days)', 'es': 'RP MPT Especialización Pierna (6 Días)'},
        'description': {
            'en': '6-Day extreme lower body specialization. Quad-focused, Glute-focused, and Hamstring/Calf-focused days alternated with upper push and pull maintenance.',
            'es': 'Especialización extrema en piernas de 6 días. Días dedicados a Cuádriceps, Glúteos e Isquios/Gemelos alternados con empuje y tirón de mantenimiento.'
        }
    },
    '[RP MPT Advanced] 6x V2_Advanced_ArmsShoulders_6Day A_S_6_K_1.xlsx': {
        'id': 'rp_adv_arms_6x',
        'order': 34,
        'title': {'en': 'RP MPT Advanced Arms & Delts (6 Days)', 'es': 'RP MPT Avanzado Brazos y Deltoides (6 Días)'},
        'description': {
            'en': 'Advanced 6-day specialization by RP for experienced lifters. High volume thresholds, advanced arm angle variations, and microcycle fatigue management.',
            'es': 'Rutina avanzada de 6 días por RP para atletas experimentados. Umbrales altos de volumen, variación de ángulos y gestión precisa de la fatiga.'
        }
    },
    '[RP MPT Advanced] 6x A_L_6_K_1.xlsx': {
        'id': 'rp_adv_legs_6x',
        'order': 35,
        'title': {'en': 'RP MPT Advanced Legs (6 Days)', 'es': 'RP MPT Avanzado Piernas (6 Días)'},
        'description': {
            'en': 'Advanced 6-day lower body specialization for seasoned lifters. Periodized Quad, Glute, and Hamstring loading for massive lower body hypertrophy.',
            'es': 'Especialización avanzada en piernas de 6 días para atletas experimentados. Sobrecarga progresiva en cuádriceps, glúteos e isquios para máxima masa.'
        }
    },
}

all_parsed_programs = []

for filename, meta in METADATA.items():
    filepath = os.path.join('C:/Dev/rp-templates-extracted', filename)
    wb = openpyxl.load_workbook(filepath, data_only=True)
    sheet_name = 'Mesocycle 1 Basic Hypertrophy'
    if sheet_name not in wb.sheetnames:
        sheet_name = wb.sheetnames[0]
    ws = wb[sheet_name]
    
    days = []
    curr_day = None
    
    for r in range(8, 75):
        c2 = str(ws.cell(r, 2).value or '').strip()
        c3 = str(ws.cell(r, 3).value or '').strip()
        c8 = str(ws.cell(r, 8).value or '').strip()
        sets = ws.cell(r, 9).value
        
        matched_day = False
        for val, title in [(c3, c2), (c8, c2)]:
            m = re.search(r'Day\s*(\d+)', val, re.I)
            if m:
                day_num = int(m.group(1))
                curr_day = {
                    'day_idx': day_num,
                    'title': title,
                    'dayName': translate_day_title(day_num, title),
                    'slots': []
                }
                days.append(curr_day)
                matched_day = True
                break
        
        if matched_day:
            continue
            
        if curr_day and c2 and sets is not None:
            if not any(k in c2.lower() for k in ['rest', 'week', 'exercise', 'day', 'choose', 'rating']):
                try:
                    s_int = int(sets)
                    muscle, ex_id, note_en, note_es = resolve_slot(c2)
                    curr_day['slots'].append({
                        'muscle': muscle,
                        'exerciseId': ex_id,
                        'setTarget': s_int,
                        'reps': '12-15' if muscle in ['CALVES', 'ABS'] else '8-12',
                        'notes': f"{note_en} — {note_es}"
                    })
                except:
                    pass
    
    all_parsed_programs.append({
        'meta': meta,
        'days': days
    })

print(f"Parsed {len(all_parsed_programs)} distinct RP programs.")

# Generate TypeScript file
ts_output = """import { ProgramDay, GlobalTemplate, MuscleGroup } from '../types';

const ASSETS_BASE = (import.meta as any).env?.VITE_ASSETS_BASE || '';

export const RP_GUIDELINE_IMAGES: string[] = Array.from(
    { length: 18 },
    (_, i) => `${ASSETS_BASE}/assets/templates/rp/rp_guide_${String(i + 1).padStart(2, '0')}.png`
);
"""

template_const_names = []

for prog in all_parsed_programs:
    meta = prog['meta']
    prog_id = meta['id']
    const_prog_name = f"{prog_id.upper()}_PROGRAM"
    const_tpl_name = f"{prog_id.upper()}_TEMPLATE"
    template_const_names.append(const_tpl_name)
    
    # Days definition
    ts_output += f"\nexport const {const_prog_name}: ProgramDay[] = [\n"
    for d_idx, day in enumerate(prog['days'], 1):
        day_id = f"{prog_id}_d{d_idx}"
        day_name_en = day['dayName']['en'].replace("'", "\\'")
        day_name_es = day['dayName']['es'].replace("'", "\\'")
        ts_output += f"    {{\n"
        ts_output += f"        id: '{day_id}',\n"
        ts_output += f"        dayName: {{ en: '{day_name_en}', es: '{day_name_es}' }},\n"
        ts_output += f"        slots: [\n"
        for slot in day['slots']:
            slot_notes = slot['notes'].replace("'", "\\'")
            ts_output += f"            {{ muscle: '{slot['muscle']}' as MuscleGroup, setTarget: {slot['setTarget']}, exerciseId: '{slot['exerciseId']}', reps: '{slot['reps']}', notes: '{slot_notes}' }},\n"
        ts_output += f"        ]\n"
        ts_output += f"    }},\n"
    ts_output += f"];\n\n"
    
    # Template definition
    title_en = meta['title']['en'].replace("'", "\\'")
    title_es = meta['title']['es'].replace("'", "\\'")
    desc_en = meta['description']['en'].replace("'", "\\'")
    desc_es = meta['description']['es'].replace("'", "\\'")
    
    ts_output += f"export const {const_tpl_name}: GlobalTemplate = {{\n"
    ts_output += f"    id: '{prog_id}',\n"
    ts_output += f"    name: '{prog_id}',\n"
    ts_output += f"    title: {{ en: '{title_en}', es: '{title_es}' }},\n"
    ts_output += f"    description: {{\n"
    ts_output += f"        en: '{desc_en}',\n"
    ts_output += f"        es: '{desc_es}'\n"
    ts_output += f"    }},\n"
    ts_output += f"    isPro: false,\n"
    ts_output += f"    order: {meta['order']},\n"
    ts_output += f"    guidelineImages: RP_GUIDELINE_IMAGES,\n"
    ts_output += f"    program: {const_prog_name}\n"
    ts_output += f"}};\n"

ts_output += "\nexport const RP_ALL_TEMPLATES: GlobalTemplate[] = [\n"
for cname in template_const_names:
    ts_output += f"    {cname},\n"
ts_output += "];\n"

with open('data/rpTemplates.ts', 'w', encoding='utf-8') as out_f:
    out_f.write(ts_output)

print(f"Successfully generated data/rpTemplates.ts with {len(template_const_names)} templates!")
