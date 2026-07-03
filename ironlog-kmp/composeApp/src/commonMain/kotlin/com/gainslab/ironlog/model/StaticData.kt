package com.gainslab.ironlog.model

object StaticData {
    val EXERCISES_JSON = """[
  {
    "id": "cardio_run",
    "name": {
      "en": "Running (Steady)",
      "es": "Correr (Ritmo Constante)"
    },
    "muscle": "CARDIO",
    "defaultCardioType": "steady",
    "videoId": "brFHyOTtwNs"
  },
  {
    "id": "cardio_hiit_sprint",
    "name": {
      "en": "HIIT Sprints",
      "es": "Sprints HIIT"
    },
    "muscle": "CARDIO",
    "defaultCardioType": "hiit",
    "instructions": {
      "en": "High intensity intervals.",
      "es": "Intervalos de alta intensidad."
    },
    "videoId": "Mp8qJ57971Y"
  },
  {
    "id": "cardio_tabata",
    "name": {
      "en": "Tabata Protocol",
      "es": "Protocolo Tabata"
    },
    "muscle": "CARDIO",
    "defaultCardioType": "tabata",
    "instructions": {
      "en": "20s Work / 10s Rest x 8 Rounds.",
      "es": "20s Trabajo / 10s Descanso x 8 Rondas."
    },
    "videoId": "a_L3b7d7rYs"
  },
  {
    "id": "cardio_cycle",
    "name": {
      "en": "Cycling",
      "es": "Ciclismo"
    },
    "muscle": "CARDIO",
    "defaultCardioType": "steady",
    "videoId": "4g7z3v3Yy34"
  },
  {
    "id": "cardio_elliptical",
    "name": {
      "en": "Elliptical",
      "es": "Elíptica"
    },
    "muscle": "CARDIO",
    "defaultCardioType": "steady",
    "videoId": "8Z7t6j5G9V0"
  },
  {
    "id": "cardio_row",
    "name": {
      "en": "Rowing Machine",
      "es": "Remo (Ergómetro)"
    },
    "muscle": "CARDIO",
    "defaultCardioType": "steady",
    "videoId": "H0r_ZGCx2l8"
  },
  {
    "id": "farmers_walk",
    "name": {
      "en": "Farmers Walk",
      "es": "Paseo de Granjero"
    },
    "muscle": "TRAPS",
    "instructions": {
      "en": "Walk tall, heavy dumbbells. 30-60s.",
      "es": "Camina erguido con mancuernas pesadas. 30-60s."
    },
    "videoId": "rt12T74g3ms"
  },
  {
    "id": "bp_flat",
    "name": {
      "en": "Machine Chest Press",
      "es": "Press Pecho Máquina"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Standard volume builder.",
      "es": "Añade volumen de forma segura."
    },
    "videoId": "NwzUje3z0qY"
  },
  {
    "id": "bp_inc",
    "name": {
      "en": "Incline Dumbbell Press",
      "es": "Press Inclinado Mancuernas"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Focus on upper chest. Get a deep stretch.",
      "es": "Enfoque en pecho superior. Busca un estiramiento profundo."
    },
    "videoId": "8iPEnn-ltC8"
  },
  {
    "id": "bp_bar",
    "name": {
      "en": "Barbell Bench Press",
      "es": "Press Banca Barra"
    },
    "muscle": "CHEST",
    "videoId": "rT7DgCr-3pg"
  },
  {
    "id": "bp_inc_bar",
    "name": {
      "en": "Incline Barbell Press",
      "es": "Press Inclinado Barra"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Regular grip, control the descent. Touches upper chest.",
      "es": "Agarre regular, controla la bajada. Toca la parte superior del pecho."
    },
    "videoId": "SrqOu55lr00"
  },
  {
    "id": "bp_inc_wide",
    "name": {
      "en": "Wide Grip Incline Press",
      "es": "Press Inclinado Agarre Ancho"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Wider grip to bias chest. Pause at the bottom.",
      "es": "Agarre más ancho para enfatizar el pecho. Haz una pausa en la parte inferior."
    },
    "videoId": "SrqOu55lr00"
  },
  {
    "id": "bp_mach_inc",
    "name": {
      "en": "Machine Incline Press",
      "es": "Press Inclinado Máquina"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Constant tension for upper pecs.",
      "es": "Tensión constante para pectorales superiores."
    },
    "videoId": "NwzUje3z0qY"
  },
  {
    "id": "pec_fly",
    "name": {
      "en": "Pec Dec Flye",
      "es": "Aperturas Pec Dec"
    },
    "muscle": "CHEST",
    "videoId": "eGjt4lkiwuc"
  },
  {
    "id": "diamond_pushup",
    "name": {
      "en": "Diamond Pushups",
      "es": "Flexiones Diamante"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Hands close together. Hits triceps and inner chest.",
      "es": "Manos juntas. Enfatiza tríceps y pecho interno."
    },
    "videoId": "J0DnG1_S92I",
    "isBodyweight": true
  },
  {
    "id": "pushup",
    "name": {
      "en": "Push Ups",
      "es": "Flexiones"
    },
    "muscle": "CHEST",
    "isBodyweight": true,
    "videoId": "IODxDxX7oi4"
  },
  {
    "id": "bp_paused",
    "name": {
      "en": "Paused Bench Press",
      "es": "Press Banca Pausado"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "1-2s pause on chest. No bounce.",
      "es": "Pausa 1-2s en el pecho. Sin rebote."
    },
    "videoId": "rT7DgCr-3pg"
  },
  {
    "id": "lat_pull",
    "name": {
      "en": "Lat Pulldown",
      "es": "Jalón al Pecho"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Prone, neutral, or supine grip. Focus on back width.",
      "es": "Agarre prono, neutro o supino. Enfocado en la amplitud de espalda."
    },
    "videoId": "CAwf7n6Luuc"
  },
  {
    "id": "lat_pull_supine",
    "name": {
      "en": "Supine Lat Pulldown",
      "es": "Jalón Supino (Chin-grip)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Underhand grip. Great for lats.",
      "es": "Agarre supino (palmas hacia ti). Excelente para dorsales."
    },
    "videoId": "8hKEjE58Jzo"
  },
  {
    "id": "lat_prayer",
    "name": {
      "en": "Cable Lat Prayer",
      "es": "Pullover Polea Alta"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Isolation movement for back width. Keep tension constant.",
      "es": "Movimiento de aislamiento para ancho de espalda. Mantén tensión constante."
    },
    "videoId": "F_iF87c4gD8"
  },
  {
    "id": "pullover_db",
    "name": {
      "en": "Dumbbell Pullover",
      "es": "Pullover con Mancuerna"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Old school lat builder. Stretch.",
      "es": "Constructor de dorsales de la vieja escuela. Estira bien."
    },
    "videoId": "5_J5E68rFfE"
  },
  {
    "id": "row_mach",
    "name": {
      "en": "Machine Row",
      "es": "Remo en Máquina"
    },
    "muscle": "BACK",
    "videoId": "H75im9hGYUE"
  },
  {
    "id": "row_cable",
    "name": {
      "en": "Cable Row",
      "es": "Remo en Polea"
    },
    "muscle": "BACK",
    "videoId": "GZbfZ033f74"
  },
  {
    "id": "row_db",
    "name": {
      "en": "Dumbbell Row (Kroc)",
      "es": "Remo Mancuerna (Kroc)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Heavy, high reps. Use straps if needed.",
      "es": "Pesado, altas repeticiones. Usa straps si es necesario."
    },
    "videoId": "roCP6wCXPqq"
  },
  {
    "id": "pendlay_row",
    "name": {
      "en": "Pendlay Row",
      "es": "Remo Pendlay"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Explosive off the floor. Reset each rep.",
      "es": "Explosivo desde el suelo. Resetea en cada repetición."
    },
    "videoId": "hUYmnfkHQ98"
  },
  {
    "id": "pullup",
    "name": {
      "en": "Pull Ups",
      "es": "Dominadas"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Strict technique, full range of motion.",
      "es": "Técnica estricta, rango de movimiento completo."
    },
    "videoId": "eGo4IYlbE5g",
    "isBodyweight": true
  },
  {
    "id": "chinup",
    "name": {
      "en": "Chin Ups",
      "es": "Dominadas Supinas"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Palms facing you. Hits biceps more.",
      "es": "Palmas hacia ti. Enfatiza bíceps."
    },
    "videoId": "mRy9m2Q9_1I",
    "isBodyweight": true
  },
  {
    "id": "rack_pull",
    "name": {
      "en": "Rack Pull",
      "es": "Rack Pull"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Start just below knees. Heavy trap/back load.",
      "es": "Inicia justo bajo la rodilla. Carga pesada para trapecios/espalda."
    },
    "videoId": "u9Fz88jX8HQ"
  },
  {
    "id": "sq_bar",
    "name": {
      "en": "Barbell Squat",
      "es": "Sentadilla con Barra"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "The king of legs. Hit depth.",
      "es": "El rey de las piernas. Rompe la paralela."
    },
    "videoId": "MVMVx5g0Zsk"
  },
  {
    "id": "sq_paused",
    "name": {
      "en": "Paused Squat",
      "es": "Sentadilla Pausada"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Pause 1-2s at the bottom.",
      "es": "Pausa 1-2s en el fondo."
    },
    "videoId": "MVMVx5g0Zsk"
  },
  {
    "id": "sq_hack",
    "name": {
      "en": "Hack Squat",
      "es": "Sentadilla Hack"
    },
    "muscle": "QUADS",
    "videoId": "EdzE55jqUbs"
  },
  {
    "id": "leg_ext",
    "name": {
      "en": "Leg Extension",
      "es": "Extensiones de Cuádriceps"
    },
    "muscle": "QUADS",
    "videoId": "YyvSfVjQeL0"
  },
  {
    "id": "leg_press",
    "name": {
      "en": "Leg Press",
      "es": "Prensa de Piernas"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Maintenance volume. Full ROM.",
      "es": "Volumen de mantenimiento. Rango completo."
    },
    "videoId": "IZxyjW7MPJQ"
  },
  {
    "id": "rdl",
    "name": {
      "en": "Romanian Deadlift",
      "es": "Peso Muerto Rumano"
    },
    "muscle": "HAMSTRINGS",
    "videoId": "JCXUYuzwNrM"
  },
  {
    "id": "deadlift",
    "name": {
      "en": "Deadlift (Conventional)",
      "es": "Peso Muerto (Convencional)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Total body strength. Keep spine neutral.",
      "es": "Fuerza total. Mantén la columna neutra."
    },
    "videoId": "r4MzxtBKyNE"
  },
  {
    "id": "sldl",
    "name": {
      "en": "Stiff Leg Deadlift",
      "es": "Peso Muerto Piernas Rígidas"
    },
    "muscle": "HAMSTRINGS",
    "instructions": {
      "en": "Minimal knee bend. Hamstring focus.",
      "es": "Mínima flexión de rodilla. Enfoque en isquios."
    },
    "videoId": "1uDiW5--rAE"
  },
  {
    "id": "good_morning",
    "name": {
      "en": "Good Morning",
      "es": "Buenos Días"
    },
    "muscle": "HAMSTRINGS",
    "instructions": {
      "en": "Hinge at hips, keep back straight.",
      "es": "Bisagra de cadera, espalda recta."
    },
    "videoId": "d_1D8x_hM7o"
  },
  {
    "id": "glute_bridge",
    "name": {
      "en": "Glute Bridge",
      "es": "Puente de Glúteos"
    },
    "muscle": "GLUTES",
    "videoId": "8Z7t6j5G9V0"
  },
  {
    "id": "leg_curl",
    "name": {
      "en": "Seated Leg Curl",
      "es": "Curl Femoral Sentado"
    },
    "muscle": "HAMSTRINGS",
    "videoId": "OrxowZ454Po"
  },
  {
    "id": "lying_curl",
    "name": {
      "en": "Lying Leg Curl",
      "es": "Curl Femoral Tumbado"
    },
    "muscle": "HAMSTRINGS",
    "videoId": "1Tq3QdYUuHs"
  },
  {
    "id": "calf_raise",
    "name": {
      "en": "Calf Raise",
      "es": "Elevación de Talones"
    },
    "muscle": "CALVES",
    "videoId": "gwLzBJYoWlI"
  },
  {
    "id": "lunges",
    "name": {
      "en": "Walking Lunges",
      "es": "Zancadas (Lunges)"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Knee touches ground gently.",
      "es": "Rodilla toca suelo suavemente."
    },
    "videoId": "D7KaRcUTQeE"
  },
  {
    "id": "lunge_reverse",
    "name": {
      "en": "Reverse Lunges",
      "es": "Zancadas Inversas"
    },
    "muscle": "QUADS",
    "videoId": "7pK8da5r6g"
  },
  {
    "id": "ohp",
    "name": {
      "en": "Overhead Press",
      "es": "Press Militar"
    },
    "muscle": "SHOULDERS",
    "videoId": "QAQ64hK4Xxs"
  },
  {
    "id": "ohp_db",
    "name": {
      "en": "Seated DB Press",
      "es": "Press Militar Mancuernas"
    },
    "muscle": "SHOULDERS",
    "videoId": "qEwK657kfLM"
  },
  {
    "id": "lat_raise",
    "name": {
      "en": "Lateral Raise",
      "es": "Elevaciones Laterales"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Standard dumbbell raises for capped delts.",
      "es": "Elevaciones estándar para hombros redondos 'capitaneados'."
    },
    "videoId": "3VcKaXpzqRo"
  },
  {
    "id": "lat_raise_cable",
    "name": {
      "en": "Cable Lateral Raise",
      "es": "Elev. Laterales Polea"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Maintain constant tension throughout the movement.",
      "es": "Mantén tensión constante durante todo el movimiento."
    },
    "videoId": "PzmPFkm-ldk"
  },
  {
    "id": "lat_raise_mach",
    "name": {
      "en": "Machine Lateral Raise",
      "es": "Elev. Laterales Máquina"
    },
    "muscle": "SHOULDERS",
    "videoId": "3VcKaXpzqRo"
  },
  {
    "id": "lat_raise_seat",
    "name": {
      "en": "Seated Lateral Raise",
      "es": "Elev. Laterales Sentado"
    },
    "muscle": "SHOULDERS",
    "videoId": "3VcKaXpzqRo"
  },
  {
    "id": "face_pull",
    "name": {
      "en": "Face Pull",
      "es": "Face Pull"
    },
    "muscle": "SHOULDERS",
    "videoId": "rep-qVOkqgk"
  },
  {
    "id": "shrug_db",
    "name": {
      "en": "Dumbbell Shrugs",
      "es": "Encogimientos Mancuerna"
    },
    "muscle": "TRAPS",
    "videoId": "g6qbq4Lf1FI"
  },
  {
    "id": "rear_delt_fly",
    "name": {
      "en": "Rear Delt Fly",
      "es": "Pájaros (Deltoides Post.)"
    },
    "muscle": "SHOULDERS",
    "videoId": "0P6CNhTR_Y8"
  },
  {
    "id": "curl_ez",
    "name": {
      "en": "EZ Bar Curl",
      "es": "Curl Barra Z"
    },
    "muscle": "BICEPS",
    "instructions": {
      "en": "Strict curls. Range 5-10 or 10-15.",
      "es": "Curl estricto. Rangos de 5-10 o 10-15 reps."
    },
    "videoId": "kwG2ipFRgfo"
  },
  {
    "id": "curl_bar",
    "name": {
      "en": "Barbell Curl",
      "es": "Curl con Barra"
    },
    "muscle": "BICEPS",
    "instructions": {
      "en": "Can use Myo-reps here for volume.",
      "es": "Puedes usar Myo-reps aquí para meter volumen rápido."
    },
    "videoId": "kwG2ipFRgfo"
  },
  {
    "id": "curl_db",
    "name": {
      "en": "Dumbbell Curl",
      "es": "Curl con Mancuernas"
    },
    "muscle": "BICEPS",
    "videoId": "sAq_ocpRh_I"
  },
  {
    "id": "curl_hammer",
    "name": {
      "en": "Hammer Curl",
      "es": "Curl Martillo"
    },
    "muscle": "BICEPS",
    "instructions": {
      "en": "Neutral grip. Hits brachialis.",
      "es": "Agarre neutro. Enfatiza braquial."
    },
    "videoId": "zC3nLlEvin4"
  },
  {
    "id": "curl_cable",
    "name": {
      "en": "Cable Curl",
      "es": "Curl en Polea"
    },
    "muscle": "BICEPS",
    "instructions": {
      "en": "High reps (15-20). Constant tension.",
      "es": "Altas repeticiones (15-20). Tensión constante."
    },
    "videoId": "AsAVcaJ8-Y"
  },
  {
    "id": "curl_preacher",
    "name": {
      "en": "Preacher Curl",
      "es": "Curl Predicador"
    },
    "muscle": "BICEPS",
    "videoId": "fIWP-FRFnU"
  },
  {
    "id": "skull_crusher",
    "name": {
      "en": "Skull Crushers",
      "es": "Rompecráneos (Skullcrusher)"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Keep elbows tucked in.",
      "es": "Mantén los codos cerrados hacia dentro."
    },
    "videoId": "d_KZxkY_0cM"
  },
  {
    "id": "db_tri_ext",
    "name": {
      "en": "DB Tricep Extension",
      "es": "Extensión Tríceps Mancuerna"
    },
    "muscle": "TRICEPS",
    "videoId": "nRiJVZDpdL0"
  },
  {
    "id": "tri_push",
    "name": {
      "en": "Tricep Pushdown",
      "es": "Extensión Tríceps Polea"
    },
    "muscle": "TRICEPS",
    "videoId": "2-LAMcpzOD8"
  },
  {
    "id": "tri_ext",
    "name": {
      "en": "Overhead Extension",
      "es": "Extensión sobre Cabeza"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Focus on the long head stretch.",
      "es": "Enfócate en el estiramiento de la cabeza larga."
    },
    "videoId": "nRiJVZDpdL0"
  },
  {
    "id": "jm_press",
    "name": {
      "en": "JM Press / Smith Tri",
      "es": "Press JM / Smith Tríceps"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Giant set style: aim for 50-60 total reps.",
      "es": "Estilo 'Giant Set': busca 50-60 reps totales con descansos cortos."
    },
    "videoId": "2t4B3-1Z9G4"
  },
  {
    "id": "dips",
    "name": {
      "en": "Weighted Dips",
      "es": "Fondos Lastrados"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Leaning forward hits chest, upright hits triceps.",
      "es": "Inclinado enfoca pecho, vertical enfoca tríceps."
    },
    "videoId": "2z8DdPdFfD4",
    "isBodyweight": true
  },
  {
    "id": "abs_cable",
    "name": {
      "en": "Cable Crunch",
      "es": "Crunch en Polea"
    },
    "muscle": "ABS",
    "videoId": "6GMkpQ08jLQ"
  },
  {
    "id": "leg_raise",
    "name": {
      "en": "Hanging Leg Raise",
      "es": "Elevación de Piernas"
    },
    "muscle": "ABS",
    "videoId": "hdng3NzbzKs",
    "isBodyweight": true
  },
  {
    "id": "knee_raise",
    "name": {
      "en": "Knee Raise",
      "es": "Elevación de Rodillas"
    },
    "muscle": "ABS",
    "videoId": "9pFL2fX8K-M",
    "isBodyweight": true
  },
  {
    "id": "wrist_curl",
    "name": {
      "en": "Wrist Curl",
      "es": "Curl de Muñeca"
    },
    "muscle": "FOREARMS",
    "instructions": {
      "en": "Marathon sets: 50-60 reps with short breaks.",
      "es": "Series maratón: 50-60 repeticiones con descansos cortos."
    },
    "videoId": "3Vq7J2V5y0"
  },
  {
    "id": "forearm_pushup",
    "name": {
      "en": "Forearm Bar Pushups",
      "es": "Flexiones Antebrazo en Barra"
    },
    "muscle": "FOREARMS",
    "instructions": {
      "en": "Lean on bar, push with fingers/wrists.",
      "es": "Apóyate en la barra, empuja usando dedos y muñecas."
    },
    "videoId": "8xXJ2qM_5Z0",
    "isBodyweight": true
  },
  {
    "id": "finger_curl",
    "name": {
      "en": "Finger Curls",
      "es": "Curl de Dedos"
    },
    "muscle": "FOREARMS",
    "instructions": {
      "en": "Roll barbell down to fingertips and curl back up.",
      "es": "Deja rodar la barra hasta la punta de los dedos y sube."
    },
    "videoId": "3Vq7J2V5y0"
  },
  {
    "id": "neck_curl",
    "name": {
      "en": "Neck Curls (Plate)",
      "es": "Flexión de Cuello (Disco)"
    },
    "muscle": "NECK",
    "instructions": {
      "en": "Lying on bench, plate on forehead. Control.",
      "es": "Tumbado en banco, disco en la frente. Controla."
    },
    "videoId": "wJ8s3s7_2s"
  },
  {
    "id": "neck_ext",
    "name": {
      "en": "Neck Extension",
      "es": "Extensión de Cuello"
    },
    "muscle": "NECK",
    "instructions": {
      "en": "Use harness or plate. Look up.",
      "es": "Usa arnés o disco. Mira hacia arriba."
    },
    "videoId": "wJ8s3s7_2s"
  },
  {
    "id": "cf_clean",
    "name": {
      "en": "Power Clean",
      "es": "Power Clean"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Pull bar from floor, receive in quarter squat. Hips drive the bar up.",
      "es": "Arranca la barra del piso y recíbela en cuarto de sentadilla. Las caderas impulsan la barra."
    },
    "videoId": "GdZBJlhrlNQ"
  },
  {
    "id": "cf_clean_jerk",
    "name": {
      "en": "Clean & Jerk",
      "es": "Clean & Jerk"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Full clean + split or squat jerk overhead. Competition move.",
      "es": "Clean completo + jerk dividido o press de sentadilla. Movimiento de competencia."
    },
    "videoId": "2lE21qkjkuQ"
  },
  {
    "id": "cf_snatch",
    "name": {
      "en": "Snatch",
      "es": "Arrancada (Snatch)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Wide grip, pull bar from floor to overhead in one movement.",
      "es": "Agarre ancho, jala la barra del piso hasta arriba en un movimiento."
    },
    "videoId": "KT_NRXeAzrk"
  },
  {
    "id": "cf_hang_clean",
    "name": {
      "en": "Hang Power Clean",
      "es": "Hang Power Clean"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Start from hang position (above knee). Hip drive is everything.",
      "es": "Comienza desde posición colgante (sobre la rodilla). El impulso de cadera lo es todo."
    },
    "videoId": "l3JVMRBxTFM"
  },
  {
    "id": "cf_hang_snatch",
    "name": {
      "en": "Hang Power Snatch",
      "es": "Hang Power Snatch"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Wide grip hang snatch. Focus on hip extension and full arm lockout.",
      "es": "Snatch de agarre ancho desde colgado. Enfócate en la extensión de cadera y bloqueo de brazos."
    },
    "videoId": "_MKDkzIDFMA"
  },
  {
    "id": "cf_thruster",
    "name": {
      "en": "Thruster",
      "es": "Thruster"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Front squat + push press in one fluid movement. Core of Fran WOD.",
      "es": "Sentadilla frontal + press en un movimiento fluido. El núcleo del WOD Fran."
    },
    "videoId": "L219ltjMlMk"
  },
  {
    "id": "cf_deadlift",
    "name": {
      "en": "Deadlift (CF)",
      "es": "Peso Muerto (CF)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Hip hinge, neutral spine, bar close to legs. Staple midline movement.",
      "es": "Bisagra de cadera, columna neutra, barra cerca de las piernas. Movimiento esencial de línea media."
    },
    "videoId": "op9kVnSso6Q"
  },
  {
    "id": "cf_ohs",
    "name": {
      "en": "Overhead Squat",
      "es": "Sentadilla sobre la Cabeza"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Wide grip, bar pressed to full extension overhead. Most demanding midline stability move.",
      "es": "Agarre ancho, barra en extensión completa. El movimiento de estabilidad de línea media más exigente."
    },
    "videoId": "RD_vUnqwqqI"
  },
  {
    "id": "cf_mu",
    "name": {
      "en": "Muscle Up (Bar)",
      "es": "Muscle Up (Barra)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "False grip, aggressive kip, transition above the bar. Master strict first.",
      "es": "Agarre falso, kip agresivo, transición sobre la barra. Domina el estricto primero."
    },
    "videoId": "D8_O3hsWPts",
    "isBodyweight": true
  },
  {
    "id": "cf_ring_mu",
    "name": {
      "en": "Ring Muscle Up",
      "es": "Muscle Up en Anillas"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "False grip on rings, pull high, transition through support position.",
      "es": "Agarre falso en anillas, jala alto, transición a posición de soporte."
    },
    "videoId": "zeL9jg0iq9A",
    "isBodyweight": true
  },
  {
    "id": "cf_ring_dip",
    "name": {
      "en": "Ring Dip",
      "es": "Fondos en Anillas"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Turn rings out at top. Master stability before adding reps.",
      "es": "Rota las anillas hacia afuera arriba. Domina la estabilidad antes de agregar reps."
    },
    "videoId": "HoE-C85ZlCE",
    "isBodyweight": true
  },
  {
    "id": "cf_hspu",
    "name": {
      "en": "Handstand Push Up",
      "es": "Press de Parada de Cabeza"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Kick to wall, lower head to mat, press back up. Scale with pike push-ups.",
      "es": "Patada a la pared, baja cabeza al piso, presiona arriba. Escala con pike push-ups."
    },
    "videoId": "q3_jHqSRb0U",
    "isBodyweight": true
  },
  {
    "id": "cf_kipping_pullup",
    "name": {
      "en": "Kipping Pull-Up",
      "es": "Pull-Up con Kip"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Hip kip drives you above the bar. NOT a replacement for strict pull-ups.",
      "es": "El kip de cadera te impulsa sobre la barra. NO reemplaza las dominadas estrictas."
    },
    "videoId": "LeMkL3-G3AY",
    "isBodyweight": true
  },
  {
    "id": "cf_butterfly_pu",
    "name": {
      "en": "Butterfly Pull-Up",
      "es": "Pull-Up Mariposa"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Circular hip cycle for higher rep efficiency. Requires good kipping base.",
      "es": "Ciclo circular de cadera para mayor eficiencia en reps. Requiere buena base de kip."
    },
    "videoId": "GnQ5SnMp9yQ",
    "isBodyweight": true
  },
  {
    "id": "cf_toes_to_bar",
    "name": {
      "en": "Toes to Bar",
      "es": "Pies a la Barra (T2B)"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Full shoulder extension, kip, bring feet to bar contact. Core compression drill.",
      "es": "Extensión completa de hombros, kip, lleva pies a la barra. Trabajo de compresión de core."
    },
    "videoId": "K-tEfm4xeGI",
    "isBodyweight": true
  },
  {
    "id": "cf_knees_to_elbow",
    "name": {
      "en": "Knees to Elbows",
      "es": "Rodillas a Codos (K2E)"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Hanging from bar, bring knees up to touch elbows.",
      "es": "Colgado de la barra, lleva las rodillas a tocar los codos."
    },
    "videoId": "YNIG7ozZFGg",
    "isBodyweight": true
  },
  {
    "id": "cf_ghd",
    "name": {
      "en": "GHD Sit-Up",
      "es": "Sit-Up en GHD"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Full hip extension on GHD machine. High injury risk without prior conditioning.",
      "es": "Extensión completa de cadera en máquina GHD. Alto riesgo sin acondicionamiento previo."
    },
    "videoId": "Yb6xDl8XeI4"
  },
  {
    "id": "cf_hsw",
    "name": {
      "en": "Handstand Walk",
      "es": "Caminata de Manos"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Kick up to handstand, shift weight between hands to move forward.",
      "es": "Patada a parada de manos, desplaza peso entre manos para avanzar."
    },
    "videoId": "g1pb2aK2we4",
    "isBodyweight": true
  },
  {
    "id": "cf_double_under",
    "name": {
      "en": "Double Under (Jump Rope)",
      "es": "Double Under (Cuerda)"
    },
    "muscle": "CARDIO",
    "instructions": {
      "en": "Jump rope passes under feet twice per jump. Relaxed wrists, minimal jump height.",
      "es": "La cuerda pasa dos veces debajo de los pies por salto. Muñecas relajadas, mínima altura."
    },
    "videoId": "K4DhVimPYqk",
    "isBodyweight": true
  },
  {
    "id": "cf_box_jump",
    "name": {
      "en": "Box Jump",
      "es": "Salto al Cajón"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Swing arms, jump, land softly with bent knees on box. Step down safely.",
      "es": "Balancea brazos, salta, aterriza suave con rodillas flexionadas en el cajón. Baja caminando."
    },
    "videoId": "NBY9-kTuHEk",
    "isBodyweight": true
  },
  {
    "id": "cf_wall_ball",
    "name": {
      "en": "Wall Ball",
      "es": "Wall Ball"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Squat, drive ball to target (10ft/3m), catch on the way down. Constant cycle.",
      "es": "Sentadilla, lanza el balón al objetivo (3m), atrápalo bajando. Ciclo constante."
    },
    "videoId": "zJzxTGFRUCQ"
  },
  {
    "id": "cf_kb_swing",
    "name": {
      "en": "Kettlebell Swing",
      "es": "Swing con Kettlebell"
    },
    "muscle": "HAMSTRINGS",
    "instructions": {
      "en": "Hip hinge—NOT a squat—drives bell to eye level (Russian) or overhead (American CF style).",
      "es": "Bisagra de cadera—NO sentadilla—impulsa la pesa al nivel de los ojos (Ruso) o arriba (Americano CF)."
    },
    "videoId": "44sc7IM3D-0"
  },
  {
    "id": "cf_burpee",
    "name": {
      "en": "Burpee",
      "es": "Burpee"
    },
    "muscle": "CARDIO",
    "instructions": {
      "en": "Drop to floor, push-up, jump up, clap overhead. Keep moving.",
      "es": "Cae al piso, lagartija, salta y aplaude arriba. Mantén el movimiento."
    },
    "videoId": "818i7ONFWj4",
    "isBodyweight": true
  },
  {
    "id": "cf_burpee_bar",
    "name": {
      "en": "Bar-facing Burpee",
      "es": "Burpee de Cara a la Barra"
    },
    "muscle": "CARDIO",
    "instructions": {
      "en": "Burpee facing the barbell, two-foot jump over bar.",
      "es": "Burpee de cara a la barra, salto con ambos pies por encima."
    },
    "videoId": "3MvYf7TUNHw",
    "isBodyweight": true
  },
  {
    "id": "cf_row_cal",
    "name": {
      "en": "Rowing (Calories)",
      "es": "Remo (Calorías)"
    },
    "muscle": "CARDIO",
    "instructions": {
      "en": "Drive with legs first, then lean back, then arms. Return in reverse. Keep stroke rate moderate.",
      "es": "Empuja con piernas primero, luego inclínate atrás, luego brazos. Regresa en orden inverso."
    },
    "videoId": "H0r_ZGCx2l8"
  },
  {
    "id": "cf_ski_erg",
    "name": {
      "en": "Ski Erg",
      "es": "Ski Erg"
    },
    "muscle": "CARDIO",
    "instructions": {
      "en": "Double pole pull action. Hinge from hips, drive handles down hard.",
      "es": "Movimiento de tracción de doble palo. Bisagra de cadera, empuja handles fuerte hacia abajo."
    },
    "videoId": "oGmqLFuRGWk"
  },
  {
    "id": "cf_assault_bike",
    "name": {
      "en": "Assault Bike (Calories)",
      "es": "Assault Bike (Calorías)"
    },
    "muscle": "CARDIO",
    "instructions": {
      "en": "Push and pull handlebars while pedaling. All-out effort. Soul-crushing but effective.",
      "es": "Empuja y jala el manubrio mientras pedaleas. Esfuerzo total. Brutal pero efectivo."
    },
    "videoId": "ZvPNl7exoTQ"
  },
  {
    "id": "cf_slam_ball",
    "name": {
      "en": "Slam Ball",
      "es": "Slam Ball"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Raise overhead, slam to ground with full power. Pick up and repeat.",
      "es": "Eleva sobre la cabeza, golpea al suelo con toda la fuerza. Recoge y repite."
    },
    "videoId": "Y-8kBH9IfkE"
  },
  {
    "id": "cf_sandbag_carry",
    "name": {
      "en": "Sandbag Carry (50m)",
      "es": "Carga de Bolsa de Arena (50m)"
    },
    "muscle": "TRAPS",
    "instructions": {
      "en": "Bear hug or shoulder carry a heavy sandbag for distance.",
      "es": "Lleva un saco pesado de arena en abrazo o en hombro por una distancia."
    },
    "videoId": "C7J4wTSgJvA"
  },
  {
    "id": "cf_devil_press",
    "name": {
      "en": "Devil Press",
      "es": "Devil Press"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Burpee + dumbbell snatch. Full-body posterior chain movement.",
      "es": "Burpee + snatch con mancuernas. Movimiento de cadena posterior de cuerpo completo."
    },
    "videoId": "nTiLKyE7c6I"
  },
  {
    "id": "cal_incline_pu",
    "name": {
      "en": "Incline Push-Up",
      "es": "Push-Up Inclinado"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Hands on elevated surface. Easier than floor push-ups. Step 1 in push progression.",
      "es": "Manos en superficie elevada. Más fácil que push-ups en el piso. Paso 1 en la progresión."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_knee_pu",
    "name": {
      "en": "Knee Push-Up",
      "es": "Push-Up en Rodillas"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Modified push-up from knees. Focus on perfect form before progressing.",
      "es": "Push-up modificado desde las rodillas. Enfócate en forma perfecta antes de progresar."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_pu_std",
    "name": {
      "en": "Push-Up",
      "es": "Push-Up"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Wrists under shoulders, rigid plank body. Touch chest to floor.",
      "es": "Muñecas bajo los hombros, cuerpo rígido como tabla. Pecho al piso."
    },
    "videoId": "IODxDxX7oi4",
    "isBodyweight": true
  },
  {
    "id": "cal_wide_pu",
    "name": {
      "en": "Wide Push-Up",
      "es": "Push-Up Ancho"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Wider hand placement for more chest emphasis.",
      "es": "Manos más separadas para mayor énfasis en pecho."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_diamond_pu",
    "name": {
      "en": "Diamond Push-Up",
      "es": "Push-Up Diamante"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Thumbs touching, index fingers touching. Maximum tricep recruitment.",
      "es": "Pulgares y dedos índice tocándose. Máxima activación de tríceps."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_archer_pu",
    "name": {
      "en": "Archer Push-Up",
      "es": "Push-Up Arquero"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "One arm bends while the other extends straight. Unilateral load.",
      "es": "Un brazo se dobla mientras el otro se extiende. Carga unilateral."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_pike_pu",
    "name": {
      "en": "Pike Push-Up",
      "es": "Push-Up en Pico"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Inverted V position, lower head to floor. Handstand push-up precursor.",
      "es": "Posición de V invertida, baja la cabeza al piso. Precursor del HSPU."
    },
    "isBodyweight": true,
    "skillFamily": "handstand",
    "skillLevel": 1,
    "progressionNext": "cal_wall_hs"
  },
  {
    "id": "cal_1arm_pu",
    "name": {
      "en": "One-Arm Push-Up",
      "es": "Push-Up a Un Brazo"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Feet wide for stability. Progress from archer pu. Elite upper body strength indicator.",
      "es": "Pies separados para estabilidad. Progresa desde archer pu. Indicador élite de fuerza."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_planche_lean",
    "name": {
      "en": "Planche Lean",
      "es": "Inclinación de Planche"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Lean forward over hands in push-up position. Load wrists and shoulders progressively.",
      "es": "Inclínate hacia adelante sobre las manos en posición de push-up. Carga de muñecas y hombros."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "planche",
    "skillLevel": 1,
    "progressionNext": "cal_tuck_planche"
  },
  {
    "id": "cal_tuck_planche",
    "name": {
      "en": "Tuck Planche",
      "es": "Planche Encogido (Tuck)"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Both feet off ground, knees tucked to chest, body horizontal. Protract scapulae hard.",
      "es": "Pies en el aire, rodillas al pecho, cuerpo horizontal. Protracción escapular fuerte."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "planche",
    "skillLevel": 2,
    "progressionPrev": "cal_planche_lean",
    "progressionNext": "cal_adv_tuck_planche"
  },
  {
    "id": "cal_adv_tuck_planche",
    "name": {
      "en": "Advanced Tuck Planche",
      "es": "Planche Tuck Avanzado"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Hips from tuck planche, extend hips while keeping knees bent.",
      "es": "Desde tuck, extiende las caderas manteniendo rodillas dobladas."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "planche",
    "skillLevel": 3,
    "progressionPrev": "cal_tuck_planche",
    "progressionNext": "cal_straddle_planche"
  },
  {
    "id": "cal_straddle_planche",
    "name": {
      "en": "Straddle Planche",
      "es": "Planche con Piernas Abiertas"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Legs wide and horizontal. Easier than full planche due to reduced lever arm.",
      "es": "Piernas abiertas y horizontales. Más fácil que el planche completo por menor brazo de palanca."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "planche",
    "skillLevel": 4,
    "progressionPrev": "cal_adv_tuck_planche",
    "progressionNext": "cal_full_planche"
  },
  {
    "id": "cal_full_planche",
    "name": {
      "en": "Full Planche",
      "es": "Planche Completo"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Legs together horizontal. Elite-level move, years of progression required.",
      "es": "Piernas juntas horizontales. Movimiento de élite. Años de progresión requeridos."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "planche",
    "skillLevel": 5,
    "progressionPrev": "cal_straddle_planche"
  },
  {
    "id": "cal_dip_std",
    "name": {
      "en": "Parallel Bar Dip",
      "es": "Fondos en Barras Paralelas"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Lower until shoulders below elbows, press back up. Lean forward slightly for chest, upright for triceps.",
      "es": "Baja hasta que hombros estén bajo los codos. Inclínate para pecho, erguido para tríceps."
    },
    "videoId": "wjUmnZH528Y",
    "isBodyweight": true
  },
  {
    "id": "cal_dead_hang",
    "name": {
      "en": "Dead Hang",
      "es": "Colgado Pasivo"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Hang from bar with full arm extension. Builds grip and shoulder health. 30–60s sets.",
      "es": "Cuélgate de la barra con brazos extendidos. Construye agarre y salud de hombros. Series de 30–60s."
    },
    "isBodyweight": true,
    "isIsometric": true
  },
  {
    "id": "cal_scap_pull",
    "name": {
      "en": "Scapular Pull-Up",
      "es": "Dominada Escapular"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "From dead hang, retract and depress scapulae WITHOUT bending elbows. Foundation of all pulling.",
      "es": "Desde colgado, retrae las escápulas sin doblar los codos. Base de todo trabajo de tracción."
    },
    "isBodyweight": true,
    "skillFamily": "front_lever",
    "skillLevel": 1,
    "progressionNext": "cal_tuck_fl"
  },
  {
    "id": "cal_au_pullup",
    "name": {
      "en": "Australian Pull-Up (Rows)",
      "es": "Dominada Australiana (Remo)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Horizontal pull from low bar or rings. Body inclined, feet on floor. Best pull-up starter.",
      "es": "Tracción horizontal desde barra baja o anillas. Cuerpo inclinado, pies en el suelo."
    },
    "isBodyweight": true,
    "skillFamily": "muscle_up",
    "skillLevel": 1,
    "progressionNext": "cal_neg_pullup"
  },
  {
    "id": "cal_neg_pullup",
    "name": {
      "en": "Negative Pull-Up",
      "es": "Dominada Excéntrica"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Jump to top position, lower very slowly (5–10s). Fastest path to first pull-up.",
      "es": "Salta a la posición alta, baja muy despacio (5–10s). El camino más rápido a la primera dominada."
    },
    "isBodyweight": true,
    "skillFamily": "muscle_up",
    "skillLevel": 2,
    "progressionPrev": "cal_au_pullup",
    "progressionNext": "cal_pullup"
  },
  {
    "id": "cal_pullup",
    "name": {
      "en": "Pull-Up",
      "es": "Dominada"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Dead hang to chin over bar. Full ROM, no kipping. King of upper body pulling.",
      "es": "Desde colgado hasta mentón sobre la barra. ROM completo, sin kip. Rey del tirón superior."
    },
    "videoId": "eGo4IYlbE5g",
    "isBodyweight": true,
    "skillFamily": "muscle_up",
    "skillLevel": 3,
    "progressionPrev": "cal_neg_pullup",
    "progressionNext": "cal_neg_mu"
  },
  {
    "id": "cal_chinup",
    "name": {
      "en": "Chin-Up",
      "es": "Dominada Supina"
    },
    "muscle": "BICEPS",
    "instructions": {
      "en": "Supinated grip (palms toward you). More bicep involvement. Often first pull-up variant achieved.",
      "es": "Agarre supino (palmas hacia ti). Mayor activación de bíceps. Generalmente la primera variante lograda."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_l_pullup",
    "name": {
      "en": "L-Sit Pull-Up",
      "es": "Dominada en L"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Maintain L-sit position throughout the pull. Requires strong core compression.",
      "es": "Mantén la posición en L durante toda la dominada. Requiere fuerte compresión de core."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_wide_grip_pu",
    "name": {
      "en": "Wide Grip Pull-Up",
      "es": "Dominada Agarre Ancho"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Hands wider than shoulders. More lat engagement, less range of motion.",
      "es": "Manos más anchas que los hombros. Mayor activación del dorsal, menor rango de movimiento."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_comm_pullup",
    "name": {
      "en": "Commando Pull-Up",
      "es": "Dominada Commando"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Parallel grip, alternate which side the head goes on each rep.",
      "es": "Agarre paralelo, alterna el lado hacia donde va la cabeza en cada rep."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_tuck_fl",
    "name": {
      "en": "Tuck Front Lever",
      "es": "Front Lever Encogido (Tuck)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "From hang, retract scapulae, pull knees to chest, hold body horizontal.",
      "es": "Desde colgado, retrae escápulas, lleva rodillas al pecho, mantén cuerpo horizontal."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "front_lever",
    "skillLevel": 2,
    "progressionPrev": "cal_scap_pull",
    "progressionNext": "cal_straddle_fl"
  },
  {
    "id": "cal_straddle_fl",
    "name": {
      "en": "Straddle Front Lever",
      "es": "Front Lever Abierto"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Legs wide in straddled position for reduced lever difficulty.",
      "es": "Piernas abiertas para reducir la palanca y la dificultad."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "front_lever",
    "skillLevel": 3,
    "progressionPrev": "cal_tuck_fl",
    "progressionNext": "cal_full_fl"
  },
  {
    "id": "cal_full_fl",
    "name": {
      "en": "Full Front Lever",
      "es": "Front Lever Completo"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Body perfectly horizontal, legs together. One of the most impressive calisthenics holds.",
      "es": "Cuerpo perfectamente horizontal, piernas juntas. Una de las poses más impactantes de la calistenia."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "front_lever",
    "skillLevel": 4,
    "progressionPrev": "cal_straddle_fl"
  },
  {
    "id": "cal_german_hang",
    "name": {
      "en": "German Hang",
      "es": "Colgado Alemán"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Hang behind bar with arms extended. Shoulder mobility work. First step to back lever.",
      "es": "Cuelga detrás de la barra con brazos extendidos. Trabajo de movilidad. Primer paso al back lever."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "back_lever",
    "skillLevel": 1,
    "progressionNext": "cal_tuck_bl"
  },
  {
    "id": "cal_tuck_bl",
    "name": {
      "en": "Tuck Back Lever",
      "es": "Back Lever Encogido (Tuck)"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "From inverted hang, extend backwards to horizontal with knees tucked.",
      "es": "Desde colgado invertido, extiéndete hacia atrás horizontal con rodillas recogidas."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "back_lever",
    "skillLevel": 2,
    "progressionPrev": "cal_german_hang",
    "progressionNext": "cal_straddle_bl"
  },
  {
    "id": "cal_straddle_bl",
    "name": {
      "en": "Straddle Back Lever",
      "es": "Back Lever Abierto"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Legs wide for reduced lever difficulty.",
      "es": "Piernas abiertas para reducir la dificultad de la palanca."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "back_lever",
    "skillLevel": 3,
    "progressionPrev": "cal_tuck_bl",
    "progressionNext": "cal_full_bl"
  },
  {
    "id": "cal_full_bl",
    "name": {
      "en": "Full Back Lever",
      "es": "Back Lever Completo"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Full horizontal extension behind the bar. Shoulder dislocate mobility required.",
      "es": "Extensión horizontal completa detrás de la barra. Requiere movilidad de dislocación de hombros."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "back_lever",
    "skillLevel": 4,
    "progressionPrev": "cal_straddle_bl"
  },
  {
    "id": "cal_neg_mu",
    "name": {
      "en": "Negative Muscle Up",
      "es": "Muscle Up Negativo"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "Jump to top position of muscle up, lower slowly through transition. Builds the hardest part.",
      "es": "Salta a la posición alta del muscle up, baja despacio por la transición. Construye la parte más difícil."
    },
    "isBodyweight": true,
    "skillFamily": "muscle_up",
    "skillLevel": 3,
    "progressionPrev": "cal_pullup",
    "progressionNext": "cal_bar_mu"
  },
  {
    "id": "cal_bar_mu",
    "name": {
      "en": "Bar Muscle Up (Strict)",
      "es": "Muscle Up en Barra (Estricto)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "From dead hang, explosive pull, transition over bar, lockout. Requires full front lever pulling strength.",
      "es": "Desde colgado, jalón explosivo, transición sobre la barra, bloqueo. Requiere fuerza de front lever."
    },
    "isBodyweight": true,
    "skillFamily": "muscle_up",
    "skillLevel": 4,
    "progressionPrev": "cal_neg_mu",
    "progressionNext": "cal_ring_mu"
  },
  {
    "id": "cal_ring_mu",
    "name": {
      "en": "Ring Muscle Up",
      "es": "Muscle Up en Anillas"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "False grip on rings. More demanding than bar due to ring instability. Peak of upper body pulling.",
      "es": "Agarre falso en anillas. Más exigente que la barra por la inestabilidad. Cima del tirón superior."
    },
    "isBodyweight": true,
    "skillFamily": "muscle_up",
    "skillLevel": 5,
    "progressionPrev": "cal_bar_mu"
  },
  {
    "id": "cal_plank",
    "name": {
      "en": "Plank",
      "es": "Plancha (Plank)"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Forearms or hands, rigid body from ankles to head. Squeeze glutes and abs tight.",
      "es": "En antebrazos o manos, cuerpo rígido de tobillos a cabeza. Aprieta glúteos y abdomen."
    },
    "isBodyweight": true,
    "isIsometric": true
  },
  {
    "id": "cal_tuck_lsit",
    "name": {
      "en": "Tuck L-Sit",
      "es": "L-Sit Encogido (Tuck)"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Knees to chest version. Build core compression and scapular depression strength.",
      "es": "Versión con rodillas al pecho. Construye compresión de core y fuerza de depresión escapular."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "lsit",
    "skillLevel": 1,
    "progressionNext": "cal_one_leg_lsit"
  },
  {
    "id": "cal_one_leg_lsit",
    "name": {
      "en": "One-Leg L-Sit",
      "es": "L-Sit Una Pierna"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "One leg tucked, one extended. Transition from tuck to full L-sit.",
      "es": "Una pierna encogida, una extendida. Transición del tuck al L-sit completo."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "lsit",
    "skillLevel": 2,
    "progressionPrev": "cal_tuck_lsit",
    "progressionNext": "cal_lsit"
  },
  {
    "id": "cal_lsit",
    "name": {
      "en": "L-Sit (Full)",
      "es": "L-Sit Completo"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Arms straight, legs parallel to floor. Depression of scapulae required. Ultimate core compression.",
      "es": "Brazos rectos, piernas paralelas al piso. Depresión escapular necesaria. Máxima compresión de core."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "lsit",
    "skillLevel": 3,
    "progressionPrev": "cal_one_leg_lsit",
    "progressionNext": "cal_vsit"
  },
  {
    "id": "cal_vsit",
    "name": {
      "en": "V-Sit",
      "es": "V-Sit"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Like L-sit but legs above 45°. Extreme compression and hip flexor strength.",
      "es": "Como el L-sit pero piernas por encima de 45°. Compresión extrema y fuerza de flexores de cadera."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "lsit",
    "skillLevel": 4,
    "progressionPrev": "cal_lsit"
  },
  {
    "id": "cal_dragon_flag",
    "name": {
      "en": "Dragon Flag",
      "es": "Dragon Flag"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "Rocky's move. Body rigid from shoulders, lower and raise keeping perfect alignment.",
      "es": "El movimiento de Rocky. Cuerpo rígido desde hombros, baja y sube manteniendo alineación perfecta."
    },
    "videoId": "MbiEMBiXHKs",
    "isBodyweight": true
  },
  {
    "id": "cal_ab_wheel",
    "name": {
      "en": "Ab Wheel Rollout",
      "es": "Rueda Abdominal"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "From knees or toes, roll out to extended position, pull back in. Full core anti-extension.",
      "es": "Desde rodillas o pies, rueda hacia adelante, regresa tirando. Anti-extensión completa de core."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_hanging_lraise",
    "name": {
      "en": "Hanging Leg Raise",
      "es": "Elevación de Piernas Colgado"
    },
    "muscle": "ABS",
    "instructions": {
      "en": "From dead hang, raise straight legs to 90° or higher without swinging.",
      "es": "Desde colgado, eleva las piernas rectas a 90° o más sin balancearte."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_squat_bw",
    "name": {
      "en": "Bodyweight Squat",
      "es": "Sentadilla con Peso Corporal"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Feet shoulder width, knees tracking over toes, hip crease below parallel.",
      "es": "Pies al ancho de hombros, rodillas alineadas con pies, cadera bajo la rodilla."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_bulgariansq",
    "name": {
      "en": "Bulgarian Split Squat",
      "es": "Sentadilla Búlgara"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Rear foot elevated, front foot stepped out. Best single-leg hypertrophy tool.",
      "es": "Pie trasero elevado, pie delantero extendido. La mejor herramienta de hipertrofia unilateral."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_pistol",
    "name": {
      "en": "Pistol Squat",
      "es": "Sentadilla a Una Pierna (Pistol)"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "One-leg squat to full depth. Requires hip flexibility, ankle mobility, and leg strength.",
      "es": "Sentadilla a una pierna con profundidad completa. Flexibilidad de cadera, movilidad de tobillo y fuerza."
    },
    "videoId": "qDcniqddTeE",
    "isBodyweight": true
  },
  {
    "id": "cal_shrimp_sq",
    "name": {
      "en": "Shrimp Squat",
      "es": "Sentadilla Camarón"
    },
    "muscle": "QUADS",
    "instructions": {
      "en": "Hold rear foot behind you, lower to knee tap. Even more demanding than pistol.",
      "es": "Sostén el pie trasero detrás, baja hasta tocar la rodilla. Más exigente que el pistol."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_nordic_curl",
    "name": {
      "en": "Nordic Hamstring Curl",
      "es": "Curl Nórdico (Nordic)"
    },
    "muscle": "HAMSTRINGS",
    "instructions": {
      "en": "Anchor feet, lower body with hamstrings only, catch with hands. Injury prevention gold standard.",
      "es": "Ancla pies, baja el cuerpo solo con isquios, atrapa con manos. Estándar de prevención de lesiones."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_glute_bridge_bw",
    "name": {
      "en": "Single-Leg Glute Bridge",
      "es": "Puente de Glúteo a Una Pierna"
    },
    "muscle": "GLUTES",
    "instructions": {
      "en": "One leg on floor, hips extend to full height. Step toward hip thrust progression.",
      "es": "Una pierna en el piso, caderas a extensión completa. Paso hacia la progresión del hip thrust."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_wall_hs",
    "name": {
      "en": "Wall Handstand Hold",
      "es": "Pino Contra la Pared"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Kick up against wall, build time up to 60s. Must master before going freestanding.",
      "es": "Patada a la pared, construye tiempo hasta 60s. Debe dominarse antes de intentarlo libre."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "handstand",
    "skillLevel": 2,
    "progressionPrev": "cal_pike_pu",
    "progressionNext": "cal_handstand"
  },
  {
    "id": "cal_handstand",
    "name": {
      "en": "Freestanding Handstand",
      "es": "Parada de Manos Libre"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Balance on hands without wall. Fingertip pressure is your brake. Requires months of practice.",
      "es": "Equilibrio en manos sin pared. La presión de las yemas es tu freno. Requiere meses de práctica."
    },
    "isBodyweight": true,
    "isIsometric": true,
    "skillFamily": "handstand",
    "skillLevel": 3,
    "progressionPrev": "cal_wall_hs",
    "progressionNext": "cf_hspu"
  },
  {
    "id": "cal_freestand_hs",
    "name": {
      "en": "Handstand (Extended)",
      "es": "Parada de Manos (Extendida)"
    },
    "muscle": "SHOULDERS",
    "instructions": {
      "en": "Extended freestanding handstand with clean lines. Work toward 30s+ holds.",
      "es": "Pino libre extendido con líneas limpias. Trabaja hacia holds de 30s+."
    },
    "isBodyweight": true,
    "isIsometric": true
  },
  {
    "id": "cal_skin_cat",
    "name": {
      "en": "Skin the Cat",
      "es": "Skin the Cat (Rotación de Hombros)"
    },
    "muscle": "BACK",
    "instructions": {
      "en": "From hang, tuck and rotate backward through to German hang. Improves shoulder mobility.",
      "es": "Desde colgado, encuérvate y rota hacia atrás hasta el colgado alemán. Mejora movilidad de hombros."
    },
    "isBodyweight": true
  },
  {
    "id": "cal_ring_support",
    "name": {
      "en": "Ring Support Hold",
      "es": "Soporte en Anillas"
    },
    "muscle": "TRICEPS",
    "instructions": {
      "en": "Hold support position on rings, arms locked, rings turned out. Foundation move.",
      "es": "Sostén posición de soporte en anillas, brazos bloqueados, anillas rotadas hacia afuera."
    },
    "isBodyweight": true,
    "isIsometric": true
  },
  {
    "id": "cal_iron_cross",
    "name": {
      "en": "Iron Cross (Rings)",
      "es": "Cruz de Hierro (Anillas)"
    },
    "muscle": "CHEST",
    "instructions": {
      "en": "Arms extended horizontally from rings, body vertical. Elite-level gymnastic strength.",
      "es": "Brazos extendidos horizontalmente desde las anillas, cuerpo vertical. Fuerza gimnástica de élite."
    },
    "isBodyweight": true,
    "isIsometric": true
  }
]"""
    
    val TEMPLATES_JSON = """[
  {
    "id": "nh_ult_beginner",
    "name": "NH Ultimate Beginner",
    "title": {
      "en": "Ultimate Hypertrophy (Beginner)",
      "es": "Hipertrofia Definitiva (Principiante)"
    },
    "description": {
      "en": "Natural Hypertrophy - 3 days/week full body with exact supersets.",
      "es": "Natural Hypertrophy - 3 días/semana full body con superseries exactas."
    },
    "isPro": false,
    "order": 200,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday",
          "es": "Lunes"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 2,
            "reps": "6-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_beg_m_1",
            "notes": "Squat + DB Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 2,
            "reps": "8-10",
            "exerciseId": "curl_db",
            "supersetId": "ss_beg_m_1"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 2,
            "reps": "6-8",
            "exerciseId": "dips",
            "supersetId": "ss_beg_m_2",
            "notes": "Dips + DB Rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 2,
            "reps": "10-12",
            "exerciseId": "row_db",
            "supersetId": "ss_beg_m_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "tri_push",
            "supersetId": "gs_beg_m_3",
            "notes": "Triceps + Lateral Raises + Crunches (Giant Set)"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "gs_beg_m_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "8-10",
            "exerciseId": "abs_cable",
            "supersetId": "gs_beg_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday",
          "es": "Miércoles"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 2,
            "reps": "6-8",
            "exerciseId": "ohp",
            "supersetId": "ss_beg_w_1",
            "notes": "OHP + Hammer Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 2,
            "reps": "8-10",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_beg_w_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "lat_pull",
            "supersetId": "ss_beg_w_2",
            "notes": "Lat Pulldowns + Leg Curls"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_beg_w_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "leg_ext",
            "supersetId": "gs_beg_w_3",
            "notes": "Leg Extensions + Cable Flyes + Neck Curls (Giant Set)"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "gs_beg_w_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "gs_beg_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday",
          "es": "Viernes"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 2,
            "reps": "8-10",
            "exerciseId": "rdl",
            "supersetId": "ss_beg_f_1",
            "notes": "RDLs + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 2,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_beg_f_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "10-12",
            "exerciseId": "pushup",
            "supersetId": "ss_beg_f_2",
            "notes": "Pushups + Preacher Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "8-10",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_beg_f_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 2,
            "reps": "8-10",
            "exerciseId": "leg_press",
            "supersetId": "gs_beg_f_3",
            "notes": "Leg Press + Skullcrushers + Leg Raises (Giant Set)"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 2,
            "reps": "10-12",
            "exerciseId": "skull_crusher",
            "supersetId": "gs_beg_f_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 2,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "gs_beg_f_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_ult_novice",
    "name": "NH Ultimate Novice",
    "title": {
      "en": "Ultimate Hypertrophy (Novice)",
      "es": "Hipertrofia Definitiva (Novato)"
    },
    "description": {
      "en": "Natural Hypertrophy - Balanced 3 days novice routine with options and supersets.",
      "es": "Natural Hypertrophy - Rutina de novato de 3 días con opciones de superseries."
    },
    "isPro": false,
    "order": 201,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday",
          "es": "Lunes"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_nov_m_1",
            "notes": "Squat/Hack + EZ/DB Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "curl_ez",
            "supersetId": "ss_nov_m_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "dips",
            "supersetId": "ss_nov_m_2",
            "notes": "Dips/Bench + DB Rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_nov_m_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "tri_push",
            "supersetId": "gs_nov_m_3",
            "notes": "Triceps + Lateral raises + Crunches (Giant Set)"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "gs_nov_m_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "10-12",
            "exerciseId": "abs_cable",
            "supersetId": "gs_nov_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday",
          "es": "Miércoles"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "ohp",
            "supersetId": "ss_nov_w_1",
            "notes": "OHP + Hammer/Reverse Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_nov_w_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "4-6",
            "exerciseId": "chinup",
            "supersetId": "ss_nov_w_2",
            "notes": "Chin-ups + Leg curls"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_nov_w_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "lunges",
            "supersetId": "gs_nov_w_3",
            "notes": "Split squats + Cable flies + Neck curls (Giant Set)"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "10-12",
            "exerciseId": "pec_fly",
            "supersetId": "gs_nov_w_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "gs_nov_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday",
          "es": "Viernes"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "rdl",
            "supersetId": "ss_nov_f_1",
            "notes": "RDLs + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_nov_f_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_nov_f_2",
            "notes": "Incline press + Preacher curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "8-10",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_nov_f_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "leg_press",
            "supersetId": "gs_nov_f_3",
            "notes": "Leg press + Skullcrushers + Leg raises (Giant Set)"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "skull_crusher",
            "supersetId": "gs_nov_f_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "gs_nov_f_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_ult_bridge",
    "name": "NH Ultimate Bridge",
    "title": {
      "en": "Ultimate Hypertrophy (Bridge)",
      "es": "Hipertrofia Definitiva (Puente)"
    },
    "description": {
      "en": "Natural Hypertrophy - Transition program introducing 4-day high frequency split.",
      "es": "Natural Hypertrophy - Rutina puente de 4 días (Lunes, Miércoles, Viernes, Sábado)."
    },
    "isPro": true,
    "order": 202,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday",
          "es": "Lunes"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_bri_m_1",
            "notes": "Squats + EZ/DB curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "curl_db",
            "supersetId": "ss_bri_m_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "dips",
            "supersetId": "ss_bri_m_2",
            "notes": "Dips + DB Rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_bri_m_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "tri_push",
            "supersetId": "gs_bri_m_3",
            "notes": "Triceps + Lateral raises + Sit-ups"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "gs_bri_m_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "abs_cable",
            "supersetId": "gs_bri_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday",
          "es": "Miércoles"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "ohp",
            "supersetId": "ss_bri_w_1",
            "notes": "OHP + Hammer/Reverse curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_bri_w_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "chinup",
            "supersetId": "ss_bri_w_2",
            "notes": "Chin-ups + Leg curls"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_bri_w_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "lunges",
            "supersetId": "gs_bri_w_3",
            "notes": "Split squats + Cable flies + Neck curls"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "gs_bri_w_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "gs_bri_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday",
          "es": "Viernes"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "rdl",
            "supersetId": "ss_bri_f_1",
            "notes": "RDLs + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_bri_f_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "leg_press",
            "supersetId": "ss_bri_f_2",
            "notes": "Leg press + Machine rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "row_mach",
            "supersetId": "ss_bri_f_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "lat_raise",
            "supersetId": "gs_bri_f_3",
            "notes": "Upright rows + Leg raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "gs_bri_f_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Saturday",
          "es": "Sábado"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_bri_s_1",
            "notes": "Incline Press + DB pullovers"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_bri_s_1"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-10",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_bri_s_2",
            "notes": "Preacher curls + Skullcrushers"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_bri_s_2"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_ult_intermediate",
    "name": "NH Ultimate Intermediate",
    "title": {
      "en": "Ultimate Hypertrophy (Intermediate)",
      "es": "Hipertrofia Definitiva (Intermedio)"
    },
    "description": {
      "en": "Natural Hypertrophy - Fully structured 5-day Upper/Lower split.",
      "es": "Natural Hypertrophy - Split Torso/Pierna completo de 5 días de alta frecuencia."
    },
    "isPro": true,
    "order": 203,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper)",
          "es": "Lunes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-8",
            "exerciseId": "bp_bar",
            "supersetId": "ss_int_m_1",
            "notes": "Bench + DB Rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_int_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "ohp",
            "supersetId": "ss_int_m_2",
            "notes": "OHP + EZ preacher curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_int_m_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "tri_push",
            "supersetId": "gs_int_m_3",
            "notes": "Triceps + Lateral raises + Sit-ups"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "gs_int_m_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "abs_cable",
            "supersetId": "gs_int_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Tuesday (Lower)",
          "es": "Martes (Piernas)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_int_t_1",
            "notes": "Squat + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_int_t_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "sq_hack",
            "supersetId": "ss_int_t_2",
            "notes": "Power shrugs + Leg curls"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_int_t_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "lunges",
            "supersetId": "gs_int_t_3",
            "notes": "Split squats + Neck curls"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "gs_int_t_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Wednesday (Arms)",
          "es": "Miércoles (Brazos)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_int_w_1",
            "notes": "Close grip bench + DB pullovers"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_int_w_1"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_int_w_2",
            "notes": "JM Press/Skullcrushers + Preacher curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_int_w_2"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "curl_hammer",
            "supersetId": "gs_int_w_3",
            "notes": "Hammer curls + Upright rows + Russian twists"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "lat_raise",
            "supersetId": "gs_int_w_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "abs_cable",
            "supersetId": "gs_int_w_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Friday (Upper)",
          "es": "Viernes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_int_f_1",
            "notes": "Incline press + Krock rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "10-12",
            "exerciseId": "row_db",
            "supersetId": "ss_int_f_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "chinup",
            "supersetId": "ss_int_f_2",
            "notes": "Chin-ups + Triceps pushdowns"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "tri_push",
            "supersetId": "ss_int_f_2"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "pec_fly",
            "supersetId": "ss_int_f_3",
            "notes": "DB flies + Bayesian curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "curl_cable",
            "supersetId": "ss_int_f_3"
          }
        ]
      },
      {
        "id": "d5",
        "dayName": {
          "en": "Saturday (Lower)",
          "es": "Sábado (Piernas)"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "rdl",
            "supersetId": "ss_int_s_1",
            "notes": "RDLs + Standing calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "calf_raise",
            "supersetId": "ss_int_s_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "leg_press",
            "supersetId": "ss_int_s_2",
            "notes": "Leg press + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_ext",
            "supersetId": "ss_int_s_2"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "30m",
            "exerciseId": "farmers_walk",
            "supersetId": "ss_int_s_3",
            "notes": "Farmers walk + Cable crunches"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "abs_cable",
            "supersetId": "ss_int_s_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_ult_advanced",
    "name": "NH Ultimate Advanced",
    "title": {
      "en": "Ultimate Hypertrophy (Advanced)",
      "es": "Hipertrofia Definitiva (Avanzado)"
    },
    "description": {
      "en": "Natural Hypertrophy - Pure 6-day hypertrophy routine with targeted daily focus.",
      "es": "Natural Hypertrophy - Rutina de volumen estricto de 6 días para atletas avanzados."
    },
    "isPro": true,
    "order": 204,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper)",
          "es": "Lunes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-8",
            "exerciseId": "bp_flat",
            "supersetId": "ss_adv_m_1",
            "notes": "Bench + DB Rows + EZ curls"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_adv_m_1"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_ez",
            "supersetId": "ss_adv_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "ohp",
            "supersetId": "ss_adv_m_2",
            "notes": "OHP + Neutral chin-ups + Sit-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "chinup",
            "supersetId": "ss_adv_m_2"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "abs_cable",
            "supersetId": "ss_adv_m_2"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Tuesday (Lower)",
          "es": "Martes (Piernas)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_adv_t_1",
            "notes": "Squat + Seated calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "calf_raise",
            "supersetId": "ss_adv_t_1"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "shrug_db",
            "notes": "Power shrugs + Leg curls"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_adv_t_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "lunges",
            "supersetId": "gs_adv_t_3",
            "notes": "Split squats + Neck curls"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "gs_adv_t_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Wednesday (Upper)",
          "es": "Miércoles (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_adv_w_1",
            "notes": "Close grip bench + DB pullovers + Preacher curls"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_adv_w_1"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_adv_w_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "chinup",
            "supersetId": "ss_adv_w_2",
            "notes": "Chin-ups + Knee raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "knee_raise",
            "supersetId": "ss_adv_w_2"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Thursday (Lower)",
          "es": "Jueves (Piernas)"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "rdl",
            "supersetId": "ss_adv_th_1",
            "notes": "RDLs + Standing calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "calf_raise",
            "supersetId": "ss_adv_th_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "leg_press",
            "supersetId": "ss_adv_th_2",
            "notes": "Leg press + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_ext",
            "supersetId": "ss_adv_th_2"
          }
        ]
      },
      {
        "id": "d5",
        "dayName": {
          "en": "Friday (Upper)",
          "es": "Viernes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_adv_f_1",
            "notes": "Incline press + Krock rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_adv_f_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "chinup",
            "supersetId": "ss_adv_f_2",
            "notes": "Chin-ups + Skullcrushers + Cable crunches"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_adv_f_2"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "abs_cable",
            "supersetId": "ss_adv_f_2"
          }
        ]
      },
      {
        "id": "d6",
        "dayName": {
          "en": "Saturday (Lower)",
          "es": "Sábado (Piernas)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "sq_hack",
            "supersetId": "ss_adv_s_1",
            "notes": "Hack Squats + Seated calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "calf_raise",
            "supersetId": "ss_adv_s_1"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "30m",
            "exerciseId": "farmers_walk",
            "supersetId": "ss_adv_s_2",
            "notes": "Farmers walk + Incline rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_cable",
            "supersetId": "ss_adv_s_2"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "leg_curl",
            "supersetId": "ss_adv_s_3",
            "notes": "Hyperextensions + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "calf_raise",
            "supersetId": "ss_adv_s_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_baki",
    "name": "NH Baki Hanma Weight Training",
    "title": {
      "en": "Baki Hanma Weight Training",
      "es": "Baki Hanma Weight Training"
    },
    "description": {
      "en": "Natural Hypertrophy - 3 day advanced physical strength program mimicking Baki.",
      "es": "Natural Hypertrophy - Entrenamiento de pesas avanzado 3 días emulando a Baki Hanma."
    },
    "isPro": true,
    "order": 205,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Day 1",
          "es": "Día 1"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_baki_1",
            "notes": "Squat + Shrugs"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "shrug_db",
            "supersetId": "ss_baki_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "rdl",
            "supersetId": "ss_baki_2",
            "notes": "RDLs + Pull-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "pullup",
            "supersetId": "ss_baki_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_baki_3",
            "notes": "Skullcrushers + Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "curl_db",
            "supersetId": "ss_baki_3"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "pushup",
            "supersetId": "gs_baki_4",
            "notes": "Pushups + Leg raises + Neck curls + Calf raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "gs_baki_4"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "neck_curl",
            "supersetId": "gs_baki_4"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "calf_raise",
            "supersetId": "gs_baki_4"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Day 2",
          "es": "Día 2"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_bar",
            "supersetId": "ss_baki_w_1",
            "notes": "Bench + Horizontal shrugs"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "shrug_db",
            "supersetId": "ss_baki_w_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "ohp",
            "supersetId": "ss_baki_w_2",
            "notes": "OHP + Chin-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "chinup",
            "supersetId": "ss_baki_w_2"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "good_morning",
            "supersetId": "ss_baki_w_3",
            "notes": "Hyperextensions + Ring rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "row_mach",
            "supersetId": "ss_baki_w_3"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "diamond_pushup",
            "supersetId": "gs_baki_w_4",
            "notes": "Diamond push-ups + Crunches + Neck side raises + Calf raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "abs_cable",
            "supersetId": "gs_baki_w_4"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "lat_raise",
            "supersetId": "gs_baki_w_4"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Day 3",
          "es": "Día 3"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "2-5",
            "exerciseId": "deadlift",
            "notes": "Deadlifts"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "sq_paused",
            "supersetId": "ss_baki_f_1",
            "notes": "Pause squats + Pull-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "pullup",
            "supersetId": "ss_baki_f_1"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "shrug_db",
            "supersetId": "ss_baki_f_2",
            "notes": "Shrugs + Face pulls"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "face_pull",
            "supersetId": "ss_baki_f_2"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "pushup",
            "supersetId": "gs_baki_f_3",
            "notes": "Pushups + Leg raises + Neck curls + Calf raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "gs_baki_f_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "neck_ext",
            "supersetId": "gs_baki_f_3"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "calf_raise",
            "supersetId": "gs_baki_f_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_toji",
    "name": "NH Toji Fushiguro (V-Taper)",
    "title": {
      "en": "Toji Fushiguro (V-Taper Workout)",
      "es": "Toji Fushiguro (Espalda V)"
    },
    "description": {
      "en": "Natural Hypertrophy - Aesthetic V-Taper workout based on Toji.",
      "es": "Natural Hypertrophy - Entrenamiento estético de espalda en V basado en Toji."
    },
    "isPro": true,
    "order": 206,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday",
          "es": "Lunes"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "dips",
            "supersetId": "ss_toji_m_1",
            "notes": "Weighted dips + Shrugs"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "shrug_db",
            "supersetId": "ss_toji_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "lat_raise_cable",
            "supersetId": "ss_toji_m_2",
            "notes": "Lateral raises + Reverse crunches"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_toji_m_2"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "chinup",
            "supersetId": "ss_toji_m_3",
            "notes": "Weighted chin-ups + Split-squats"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "lunges",
            "supersetId": "ss_toji_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday",
          "es": "Miércoles"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "ohp_db",
            "supersetId": "ss_toji_w_1",
            "notes": "DB OHP + Neck curls"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "ss_toji_w_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_toji_w_2",
            "notes": "Rows + Katana extensions"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "tri_push",
            "supersetId": "ss_toji_w_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "rear_delt_fly",
            "supersetId": "ss_toji_w_3",
            "notes": "Reverse flies + Hammer curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_toji_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday",
          "es": "Viernes"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_toji_f_1",
            "notes": "Close grip bench + Preacher curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_toji_f_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_toji_f_2",
            "notes": "Pullovers + Russian twists"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "abs_cable",
            "supersetId": "ss_toji_f_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_toji_f_3",
            "notes": "Upright rows + Split-squats"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "lunges",
            "supersetId": "ss_toji_f_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Saturday",
          "es": "Sábado"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "ohp",
            "supersetId": "ss_toji_s_1",
            "notes": "Machine shoulder press + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_ext",
            "supersetId": "ss_toji_s_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "row_db",
            "supersetId": "ss_toji_s_2",
            "notes": "Incline DB rows + Triceps pushdowns"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "tri_push",
            "supersetId": "ss_toji_s_2"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "30m",
            "exerciseId": "farmers_walk",
            "supersetId": "ss_toji_s_3",
            "notes": "Farmers walks + Y raises"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "lat_raise",
            "supersetId": "ss_toji_s_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_doom_slayer",
    "name": "NH Doom Slayer PPL",
    "title": {
      "en": "Doom Slayer PPL",
      "es": "Doom Slayer PPL"
    },
    "description": {
      "en": "Natural Hypertrophy - Extremely high volume Pull/Push/Legs.",
      "es": "Natural Hypertrophy - PPL de altísimo volumen basado en Doom Slayer."
    },
    "isPro": true,
    "order": 207,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Pull 1",
          "es": "Tirón 1"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "row_cable",
            "supersetId": "ss_doom_pull1_1",
            "notes": "Barbell row OR T-bar row + Cable crunches"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "abs_cable",
            "supersetId": "ss_doom_pull1_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "lat_pull",
            "supersetId": "ss_doom_pull1_2",
            "notes": "Machine high row OR Lat pulldowns + Upright rows"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_doom_pull1_2"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_ext",
            "supersetId": "ss_doom_pull1_3",
            "notes": "Neck extensions + Curls + Farmers walk"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "curl_db",
            "supersetId": "ss_doom_pull1_3"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "30m",
            "exerciseId": "farmers_walk",
            "supersetId": "ss_doom_pull1_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Push 1",
          "es": "Empuje 1"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "dips",
            "supersetId": "ss_doom_push1_1",
            "notes": "Dips OR Bench press + Rear delts"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "rear_delt_fly",
            "supersetId": "ss_doom_push1_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "ohp",
            "supersetId": "ss_doom_push1_2",
            "notes": "AD press OR Military press + Hammer curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_doom_push1_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise_cable",
            "supersetId": "ss_doom_push1_3",
            "notes": "Lateral raises + Crossbody extensions + Chest flyes"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "tri_push",
            "supersetId": "ss_doom_push1_3"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "pec_fly",
            "supersetId": "ss_doom_push1_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Legs 1",
          "es": "Piernas 1"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "sq_bar",
            "supersetId": "ss_doom_legs1_1",
            "notes": "Barbell back squat + Neck flexions"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "neck_curl",
            "supersetId": "ss_doom_legs1_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "leg_curl",
            "supersetId": "ss_doom_legs1_2",
            "notes": "Hyperextensions + Russian twists"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "abs_cable",
            "supersetId": "ss_doom_legs1_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "leg_ext",
            "supersetId": "ss_doom_legs1_3",
            "notes": "Leg extensions + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_doom_legs1_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Pull 2",
          "es": "Tirón 2"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "3-5",
            "exerciseId": "pullup",
            "supersetId": "ss_doom_pull2_1",
            "notes": "Weighted pull-ups + Face-pulls"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "face_pull",
            "supersetId": "ss_doom_pull2_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "row_db",
            "supersetId": "ss_doom_pull2_2",
            "notes": "Kroc rows OR Meadows rows + Pronation twists"
          },
          {
            "muscle": "FOREARMS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "wrist_curl",
            "supersetId": "ss_doom_pull2_2"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "shrug_db",
            "supersetId": "ss_doom_pull2_3",
            "notes": "Power shrugs + Preacher curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "curl_preacher",
            "supersetId": "ss_doom_pull2_3"
          }
        ]
      },
      {
        "id": "d5",
        "dayName": {
          "en": "Push 2",
          "es": "Empuje 2"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "bp_inc",
            "supersetId": "ss_doom_push2_1",
            "notes": "Incline press + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "neck_ext",
            "supersetId": "ss_doom_push2_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_doom_push2_2",
            "notes": "Converging chest press + Decline sit-ups"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "abs_cable",
            "supersetId": "ss_doom_push2_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "jm_press",
            "supersetId": "ss_doom_push2_3",
            "notes": "JM press + Hammer preacher curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_doom_push2_3"
          }
        ]
      },
      {
        "id": "d6",
        "dayName": {
          "en": "Legs 2",
          "es": "Piernas 2"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 2,
            "reps": "6-12",
            "exerciseId": "rdl",
            "supersetId": "ss_doom_legs2_1",
            "notes": "RDLs + DB rear delt swings"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 2,
            "reps": "8-12",
            "exerciseId": "rear_delt_fly",
            "supersetId": "ss_doom_legs2_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "sq_hack",
            "supersetId": "ss_doom_legs2_2",
            "notes": "Smith machine squat + Calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "calf_raise",
            "supersetId": "ss_doom_legs2_2"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_doom_legs2_3",
            "notes": "GHR or Nordic hamstring curls + Dead-hangs"
          },
          {
            "muscle": "FOREARMS",
            "setTarget": 3,
            "reps": "1min",
            "exerciseId": "farmers_walk",
            "supersetId": "ss_doom_legs2_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_superman",
    "name": "NH Superman Aesthetics",
    "title": {
      "en": "Superman Aesthetics (Henry Cavill)",
      "es": "Superman Aesthetics (Henry Cavill)"
    },
    "description": {
      "en": "Natural Hypertrophy - Build the Man of Steel physique with exact supersets.",
      "es": "Natural Hypertrophy - Construye el físico del Hombre de Acero con superseries."
    },
    "isPro": true,
    "order": 208,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper)",
          "es": "Lunes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "4-10",
            "exerciseId": "bp_bar",
            "supersetId": "ss_sup_m_1",
            "notes": "Bench press OR Dips + Rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "row_mach",
            "supersetId": "ss_sup_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "ohp",
            "supersetId": "ss_sup_m_2",
            "notes": "OHP + DB or EZ bar curls + Sit-ups"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "curl_ez",
            "supersetId": "ss_sup_m_2"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "abs_cable",
            "supersetId": "ss_sup_m_2"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "ss_sup_m_3",
            "notes": "Cable flies + Upright rows"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_sup_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday (Lower)",
          "es": "Miércoles (Piernas)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_sup_w_1",
            "notes": "Squats + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "neck_ext",
            "supersetId": "ss_sup_w_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "rdl",
            "supersetId": "ss_sup_w_2",
            "notes": "RDLs + Behind the back curls + Calf raises"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "curl_cable",
            "supersetId": "ss_sup_w_2"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_sup_w_2"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "lat_pull",
            "supersetId": "ss_sup_w_3",
            "notes": "Lat pulldowns + French press"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "tri_push",
            "supersetId": "ss_sup_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday (Full Body)",
          "es": "Viernes (Full Body)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "bp_inc",
            "supersetId": "ss_sup_f_1",
            "notes": "Incline press + Krock rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_sup_f_1"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "30m",
            "exerciseId": "farmers_walk",
            "supersetId": "ss_sup_f_2",
            "notes": "Farmers carry + Cable lateral raises"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "lat_raise_cable",
            "supersetId": "ss_sup_f_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "leg_ext",
            "supersetId": "gs_sup_f_3",
            "notes": "Leg extensions + Hammer curls + Neck curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "curl_hammer",
            "supersetId": "gs_sup_f_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "neck_curl",
            "supersetId": "gs_sup_f_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_gentleman_split",
    "name": "NH Gentleman Split Complete",
    "title": {
      "en": "Gentleman Split Complete",
      "es": "Gentleman Split Completo"
    },
    "description": {
      "en": "Natural Hypertrophy - The legendary 5-day classic upper/lower/arm/posterior chain split.",
      "es": "Natural Hypertrophy - El legendario split clásico de 5 días (OHP/Squat/Bench/Deadlift/Arms)."
    },
    "isPro": true,
    "order": 209,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper OHP)",
          "es": "Lunes (Torso OHP)"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "2-5",
            "exerciseId": "ohp",
            "notes": "Barbell OHP heavy"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_ez",
            "supersetId": "ss_gent_m_1",
            "notes": "EZ bar curls + skull-crushers + rows"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_gent_m_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "pendlay_row",
            "supersetId": "ss_gent_m_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "chinup",
            "supersetId": "ss_gent_m_2",
            "notes": "Chin-ups + cable lateral + shrugs"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise_cable",
            "supersetId": "ss_gent_m_2"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "shrug_db",
            "supersetId": "ss_gent_m_2"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Tuesday (Lower Squats)",
          "es": "Martes (Pierna Sentadilla)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "notes": "Heavy squats 1-3 sets"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "4-8",
            "exerciseId": "sq_paused",
            "notes": "Back-off set or variation"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "sldl",
            "supersetId": "ss_gent_t_1",
            "notes": "SL Deadlifts + weighted pull-ups + leg raises"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-6",
            "exerciseId": "pullup",
            "supersetId": "ss_gent_t_1"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_gent_t_1"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "calf_raise",
            "supersetId": "ss_gent_t_2",
            "notes": "Calf raises + neck work"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "neck_curl",
            "supersetId": "ss_gent_t_2"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Thursday (Upper Bench)",
          "es": "Jueves (Torso Banca)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "4-6",
            "exerciseId": "bp_bar",
            "notes": "Heavy Bench Press"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "ohp_db",
            "supersetId": "ss_gent_th_1",
            "notes": "DB OHP + French press"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "tri_ext",
            "supersetId": "ss_gent_th_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-6",
            "exerciseId": "chinup",
            "supersetId": "ss_gent_th_2",
            "notes": "Weighted chin-ups + knee raises + wrist curls"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "knee_raise",
            "supersetId": "ss_gent_th_2"
          },
          {
            "muscle": "FOREARMS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "wrist_curl",
            "supersetId": "ss_gent_th_2"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Friday (Lower Deadlifts)",
          "es": "Viernes (Pierna Peso Muerto)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "2-5",
            "exerciseId": "deadlift",
            "notes": "Heavy conventional deadlifts"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "sq_hack",
            "notes": "Squat variation or deadlift back-off"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "rack_pull",
            "supersetId": "ss_gent_f_1",
            "notes": "Rack pulls + unweighted pull-ups + leg raises"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "pullup",
            "supersetId": "ss_gent_f_1"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_gent_f_1"
          }
        ]
      },
      {
        "id": "d5",
        "dayName": {
          "en": "Saturday (Arms/Shoulders)",
          "es": "Sábado (Brazos/Hombros)"
        },
        "slots": [
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_gent_s_1",
            "notes": "Hammer curls + DB OHP + French press + Seal rows"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "ohp_db",
            "supersetId": "ss_gent_s_1"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "tri_ext",
            "supersetId": "ss_gent_s_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_cable",
            "supersetId": "ss_gent_s_1"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_silver_era",
    "name": "NH Silver Era Reeves",
    "title": {
      "en": "Silver Era Aesthetics (Steve Reeves)",
      "es": "Alineación de la Era de Plata (Steve Reeves)"
    },
    "description": {
      "en": "Natural Hypertrophy - High classic frequency and volume for ultimate symmetric aesthetics.",
      "es": "Natural Hypertrophy - Alta frecuencia clásica para estética y simetría perfectas."
    },
    "isPro": true,
    "order": 210,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday",
          "es": "Lunes"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "sq_bar",
            "supersetId": "ss_reev_m_1",
            "notes": "Barbell or Hack Squats + Seal rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-15",
            "exerciseId": "row_cable",
            "supersetId": "ss_reev_m_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_reev_m_2",
            "notes": "Incline Press + Reverse Curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_reev_m_2"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "rdl",
            "supersetId": "ss_reev_m_3",
            "notes": "RDLs + Upright rows + Neck curls"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_reev_m_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "ss_reev_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday",
          "es": "Miércoles"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-10",
            "exerciseId": "pendlay_row",
            "supersetId": "ss_reev_w_1",
            "notes": "Rows or Good mornings + Shrugs"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "12-20",
            "exerciseId": "shrug_db",
            "supersetId": "ss_reev_w_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "dips",
            "supersetId": "ss_reev_w_2",
            "notes": "Weighted Dips or Close Grip Bench + Split squats"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "lunges",
            "supersetId": "ss_reev_w_2"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "4-6",
            "exerciseId": "chinup",
            "supersetId": "ss_reev_w_3",
            "notes": "Weighted chin-ups + DB Shoulder press + Leg curls"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "ohp_db",
            "supersetId": "ss_reev_w_3"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_reev_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday",
          "es": "Viernes"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "3-5",
            "exerciseId": "deadlift",
            "supersetId": "ss_reev_f_1",
            "notes": "Conventional deadlifts + Triceps extension"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "10-12",
            "exerciseId": "tri_push",
            "supersetId": "ss_reev_f_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "ohp",
            "supersetId": "ss_reev_f_2",
            "notes": "Barbell OHP or BTN + DB pullovers"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_reev_f_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "8-15",
            "exerciseId": "leg_press",
            "supersetId": "ss_reev_f_3",
            "notes": "Leg press + DB/Cable chest flies + Hammer curls"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "pec_fly",
            "supersetId": "ss_reev_f_3"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_reev_f_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_apollonian",
    "name": "NH Apollonian Physique",
    "title": {
      "en": "Apollonian Physique",
      "es": "Físico Apolíneo"
    },
    "description": {
      "en": "Natural Hypertrophy - Upper, Lower, Hybrid split designed for clean proportion and flow.",
      "es": "Natural Hypertrophy - Split Torso/Pierna/Híbrido enfocado en proporciones clásicas."
    },
    "isPro": true,
    "order": 211,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper)",
          "es": "Lunes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_bar",
            "supersetId": "ss_apol_m_1",
            "notes": "Bench Press OR Dips + DB rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_apol_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "ohp_db",
            "supersetId": "ss_apol_m_2",
            "notes": "DB OHP + Abs"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_apol_m_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_apol_m_3",
            "notes": "Skull crushers or French press + Hammer curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_apol_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday (Lower/Hybrid)",
          "es": "Miércoles (Pierna/Híbrido)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "3-5",
            "exerciseId": "deadlift",
            "notes": "Deadlifts or RDLs"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "rdl"
          },
          {
            "muscle": "CALVES",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "calf_raise"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "pullup",
            "supersetId": "ss_apol_w_1",
            "notes": "Weighted pull-ups + Lunges + Shrugs"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lunges",
            "supersetId": "ss_apol_w_1"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "shrug_db",
            "supersetId": "ss_apol_w_1"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday (Arms/Upper Hybrid)",
          "es": "Viernes (Brazos/Torso Híbrido)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_apol_f_1",
            "notes": "Close grip bench or pushups + Seal rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "pendlay_row",
            "supersetId": "ss_apol_f_1"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "curl_db"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "lat_raise",
            "notes": "Lateral raises"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "tri_push"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_alex_eubank",
    "name": "NH Revamped Greek God (Eubank)",
    "title": {
      "en": "Revamped Greek God Program",
      "es": "Programa Dios Griego Mejorado (Alex Eubank)"
    },
    "description": {
      "en": "Natural Hypertrophy - Revamped 4 days aesthetic program emphasizing high density.",
      "es": "Natural Hypertrophy - Programa estético de 4 días enfocado en alta densidad."
    },
    "isPro": true,
    "order": 212,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Chest/Back/Shoulders/Triceps)",
          "es": "Lunes (Pecho/Espalda/Hombro/Tríceps)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "bp_bar",
            "supersetId": "ss_eub_m_1",
            "notes": "Bench Press + Straight arm pulldown"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_prayer",
            "supersetId": "ss_eub_m_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_eub_m_2",
            "notes": "Barbell Row + DB shoulder press"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "ohp_db",
            "supersetId": "ss_eub_m_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "8-10",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_eub_m_3",
            "notes": "Skull-crushers + lateral raises + Decline sit-ups"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_eub_m_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "10-20",
            "exerciseId": "abs_cable",
            "supersetId": "ss_eub_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday (Legs/Arms)",
          "es": "Miércoles (Pierna/Brazo)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_eub_w_1",
            "notes": "Squats + Neck curls"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "ss_eub_w_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "rdl",
            "supersetId": "ss_eub_w_2",
            "notes": "RDLs + EZ bar curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_ez",
            "supersetId": "ss_eub_w_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "15-18",
            "exerciseId": "leg_ext",
            "supersetId": "ss_eub_w_3",
            "notes": "Extensions + Hammer curls + Seated calf raises"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_eub_w_3"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_eub_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Thursday (Chest/Back/Shoulders/Triceps)",
          "es": "Jueves (Pecho/Espalda/Hombro/Tríceps)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_eub_th_1",
            "notes": "Incline DB Press + Close grip pulldown"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-15",
            "exerciseId": "lat_pull",
            "supersetId": "ss_eub_th_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "row_cable",
            "supersetId": "ss_eub_th_2",
            "notes": "Seated rows + Flat DB fly"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "ss_eub_th_2"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_eub_th_3",
            "notes": "DB Skullcrushers + Upright rows + V sit-ups"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "8-10",
            "exerciseId": "lat_raise",
            "supersetId": "ss_eub_th_3"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "abs_cable",
            "supersetId": "ss_eub_th_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Saturday (Legs/Arms)",
          "es": "Sábado (Pierna/Brazo)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "3-5",
            "exerciseId": "deadlift",
            "supersetId": "ss_eub_s_1",
            "notes": "Deadlifts + Neck curls"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "10-15",
            "exerciseId": "neck_curl",
            "supersetId": "ss_eub_s_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "leg_press",
            "supersetId": "ss_eub_s_2",
            "notes": "Leg Press + Weighted chin-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "chinup",
            "supersetId": "ss_eub_s_2"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_eub_s_3",
            "notes": "Pinwheel curls + Leg curls + Standing calf raises"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "leg_curl",
            "supersetId": "ss_eub_s_3"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_eub_s_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_bald_omni_hybrid",
    "name": "NH Hybrid Calisthenics (Bald Omni Man)",
    "title": {
      "en": "The PERFECT Hybrid Calisthenics Program",
      "es": "El Programa de Calistenia Híbrida PERFECTO"
    },
    "description": {
      "en": "Natural Hypertrophy & Bald Omni Man collaboration combining heavy metal with rings.",
      "es": "Colaboración de Natural Hypertrophy y Bald Omni Man uniendo calistenia con hierros."
    },
    "isPro": true,
    "order": 213,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper)",
          "es": "Lunes (Torso)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 6,
            "reps": "10-15",
            "exerciseId": "pushup",
            "supersetId": "ss_hybrid_m_1",
            "notes": "Weighted push-ups (deficit) + Reverse curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 6,
            "reps": "8-15",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_hybrid_m_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "pullup",
            "supersetId": "ss_hybrid_m_2",
            "notes": "Ring rows or BB rows + EZ/DB curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_ez",
            "supersetId": "ss_hybrid_m_2"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "ss_hybrid_m_3",
            "notes": "Incline cable flies + Lying extensions"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_hybrid_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday (Lower)",
          "es": "Miércoles (Piernas)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 5,
            "reps": "6-12",
            "exerciseId": "sq_bar",
            "supersetId": "ss_hybrid_w_1",
            "notes": "Heel elevated squats + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 5,
            "reps": "10-20",
            "exerciseId": "neck_ext",
            "supersetId": "ss_hybrid_w_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 5,
            "reps": "4-10",
            "exerciseId": "chinup",
            "supersetId": "ss_hybrid_w_2",
            "notes": "Weighted chin-ups + Hanging knee raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 5,
            "reps": "AMRAP",
            "exerciseId": "knee_raise",
            "supersetId": "ss_hybrid_w_2"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "rdl",
            "notes": "RDLs or Hyperextensions"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday (Push)",
          "es": "Viernes (Empuje)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 6,
            "reps": "AMRAP",
            "exerciseId": "pushup",
            "supersetId": "ss_hybrid_f_1",
            "notes": "Handstand or decline ring push-ups + crossbody cable curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 6,
            "reps": "10-20",
            "exerciseId": "curl_cable",
            "supersetId": "ss_hybrid_f_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "ss_hybrid_f_2",
            "notes": "Ring guillotine flies + tricep extension"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "tri_push",
            "supersetId": "ss_hybrid_f_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_hybrid_f_3",
            "notes": "Upright rows + ring rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "pullup",
            "supersetId": "ss_hybrid_f_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Saturday (Pull)",
          "es": "Sábado (Tracción)"
        },
        "slots": [
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "rdl",
            "supersetId": "ss_hybrid_s_1",
            "notes": "RDLs or stiff legged deadlifts + neck flexions"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "10-20",
            "exerciseId": "neck_curl",
            "supersetId": "ss_hybrid_s_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "pullup",
            "supersetId": "ss_hybrid_s_2",
            "notes": "Weighted pullups + Hanging leg raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_hybrid_s_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lunges",
            "notes": "Split squats or sissy squats"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_guts",
    "name": "NH Guts Training Program",
    "title": {
      "en": "Guts Training Program (Berserk)",
      "es": "Programa de Guts (Berserk)"
    },
    "description": {
      "en": "Natural Hypertrophy - Survive and grow with the brute force of the Black Swordsman.",
      "es": "Natural Hypertrophy - Sobrevive y crece con la fuerza bruta del Espadachín Negro."
    },
    "isPro": true,
    "order": 214,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper - Chest/Shoulders)",
          "es": "Lunes (Torso - Pecho/Hombros)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "4-8",
            "exerciseId": "bp_bar",
            "supersetId": "ss_guts_m_1",
            "notes": "Bench press OR Dips OR Weighted Push-ups + Pullovers"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_guts_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "ohp",
            "supersetId": "ss_guts_m_2",
            "notes": "Barbell OR DB OHP + Weighted Chin-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "chinup",
            "supersetId": "ss_guts_m_2"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "diamond_pushup",
            "supersetId": "gs_guts_m_3",
            "notes": "Diamond push-ups + Behind the head extensions + Neck curls"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "tri_ext",
            "supersetId": "gs_guts_m_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "neck_curl",
            "supersetId": "gs_guts_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Wednesday (Upper - Back/Traps)",
          "es": "Miércoles (Torso - Espalda/Trapecios)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "pendlay_row",
            "supersetId": "ss_guts_w_1",
            "notes": "Barbell rows OR Deadlifts (alternate weekly) + Single leg calves"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "calf_raise",
            "supersetId": "ss_guts_w_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "good_morning",
            "supersetId": "ss_guts_w_2",
            "notes": "Zercher/SSB Good mornings OR Weighted pull-ups"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "3-5",
            "exerciseId": "pullup",
            "supersetId": "ss_guts_w_2"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "pullover_db",
            "supersetId": "gs_guts_w_3",
            "notes": "Hyperextensions + Supinated finger curls + DB Curls"
          },
          {
            "muscle": "FOREARMS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "finger_curl",
            "supersetId": "gs_guts_w_3"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "4-10",
            "exerciseId": "curl_db",
            "supersetId": "gs_guts_w_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Friday (Upper - Arms)",
          "es": "Viernes (Torso - Brazos)"
        },
        "slots": [
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_bar",
            "supersetId": "ss_guts_f_1",
            "notes": "Barbell curls + Skull crushers"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "skull_crusher",
            "supersetId": "ss_guts_f_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_guts_f_2",
            "notes": "Close grip bench OR Diamond push-ups + Hammer curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_guts_f_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "ohp_db",
            "supersetId": "gs_guts_f_3",
            "notes": "DB OHP OR Decline push-ups + Finger curls + Neck curls"
          },
          {
            "muscle": "FOREARMS",
            "setTarget": 3,
            "reps": "8-15",
            "exerciseId": "finger_curl",
            "supersetId": "gs_guts_f_3"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "gs_guts_f_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Saturday (Legs)",
          "es": "Sábado (Piernas)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "5",
            "exerciseId": "deadlift",
            "supersetId": "ss_guts_s_1",
            "notes": "Deadlifts OR Zercher squats + Shrugs"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "shrug_db",
            "supersetId": "ss_guts_s_1"
          },
          {
            "muscle": "QUADS",
            "setTarget": 3,
            "reps": "4",
            "exerciseId": "sq_paused",
            "notes": "Pause squats OR Block pulls"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "face_pull",
            "supersetId": "ss_guts_s_2",
            "notes": "Face-pulls + DB leg raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "leg_raise",
            "supersetId": "ss_guts_s_2"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_kratos",
    "name": "NH Kratos Advanced",
    "title": {
      "en": "Kratos Program (Advanced)",
      "es": "Programa de Kratos (Avanzado)"
    },
    "description": {
      "en": "Natural Hypertrophy - Built for war and godly hypertrophic dominance.",
      "es": "Natural Hypertrophy - Diseñado para la guerra y la dominación muscular."
    },
    "isPro": true,
    "order": 215,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Monday (Upper 1)",
          "es": "Lunes (Torso 1)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_kratos_m_1",
            "notes": "Close grip bench OR Dips + DB or Meadows rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "row_db",
            "supersetId": "ss_kratos_m_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "ohp_db",
            "supersetId": "ss_kratos_m_2",
            "notes": "DB press OR Arnold press + Triceps extensions"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "tri_ext",
            "supersetId": "ss_kratos_m_2"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "pullover_db",
            "supersetId": "ss_kratos_m_3",
            "notes": "DB pullovers + Neck curls"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "ss_kratos_m_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Tuesday (Lower 1)",
          "es": "Martes (Piernas 1)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "10-12",
            "exerciseId": "pendlay_row",
            "supersetId": "ss_kratos_t_1",
            "notes": "Barbell rows + Seated OR Standing calf raises"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_kratos_t_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "rack_pull",
            "supersetId": "ss_kratos_t_2",
            "notes": "Block pulls + Russian twists"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "abs_cable",
            "supersetId": "ss_kratos_t_2"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "leg_press",
            "supersetId": "ss_kratos_t_3",
            "notes": "Leg press OR Split squats + Pinwheel curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "8-12",
            "exerciseId": "curl_hammer",
            "supersetId": "ss_kratos_t_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Thursday (Upper 2)",
          "es": "Jueves (Torso 2)"
        },
        "slots": [
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "ohp",
            "supersetId": "ss_kratos_th_1",
            "notes": "DB/BB OHP OR Viking press + Seal rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "row_cable",
            "supersetId": "ss_kratos_th_1"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "6-8",
            "exerciseId": "chinup",
            "supersetId": "ss_kratos_th_2",
            "notes": "Weighted chin-ups + Neck extensions"
          },
          {
            "muscle": "NECK",
            "setTarget": 3,
            "reps": "15-20",
            "exerciseId": "neck_ext",
            "supersetId": "ss_kratos_th_2"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_kratos_th_3",
            "notes": "Lateral raises + Cable curls"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "curl_cable",
            "supersetId": "ss_kratos_th_3"
          }
        ]
      },
      {
        "id": "d4",
        "dayName": {
          "en": "Friday (Lower 2)",
          "es": "Viernes (Piernas 2)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "6-8",
            "exerciseId": "sq_bar",
            "supersetId": "ss_kratos_f_1",
            "notes": "Squats or Hack squats + Hang pulls"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "shrug_db",
            "supersetId": "ss_kratos_f_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 3,
            "reps": "8-12",
            "exerciseId": "rdl",
            "supersetId": "ss_kratos_f_2",
            "notes": "RDLs OR Block-pulls + Decline sit-ups"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "12-15",
            "exerciseId": "abs_cable",
            "supersetId": "ss_kratos_f_2"
          },
          {
            "muscle": "GLUTES",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "glute_bridge",
            "supersetId": "ss_kratos_f_3",
            "notes": "Hip thrusts + Power shrugs"
          },
          {
            "muscle": "TRAPS",
            "setTarget": 4,
            "reps": "8-10",
            "exerciseId": "shrug_db",
            "supersetId": "ss_kratos_f_3"
          }
        ]
      }
    ]
  },
  {
    "id": "nh_kinobody",
    "name": "NH Kinobody Hollywood",
    "title": {
      "en": "Superhero Aesthetics (Kinobody)",
      "es": "Superhero Aesthetics (Kinobody)"
    },
    "description": {
      "en": "Natural Hypertrophy - Rest-Pause emphasis for a dense, angular Hollywood physique.",
      "es": "Natural Hypertrophy - Énfasis en Rest-Pause para un físico Hollywood denso y angular."
    },
    "isPro": true,
    "order": 216,
    "program": [
      {
        "id": "d1",
        "dayName": {
          "en": "Tuesday (Shoulders & Back)",
          "es": "Martes (Hombros y Espalda)"
        },
        "slots": [
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "5-8",
            "exerciseId": "pullup",
            "supersetId": "ss_kino_t_1",
            "notes": "Weighted pull-ups (Rest-Pause on last set) + Abs/Calves/Neck"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_kino_t_1"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "ohp",
            "supersetId": "ss_kino_t_2",
            "notes": "Seated/Standing OHP + DB Rows"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "6-12",
            "exerciseId": "row_db",
            "supersetId": "ss_kino_t_2"
          },
          {
            "muscle": "CHEST",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "pec_fly",
            "supersetId": "ss_kino_t_3",
            "notes": "DB flyes + Cable lateral raises"
          },
          {
            "muscle": "SHOULDERS",
            "setTarget": 4,
            "reps": "10-15",
            "exerciseId": "lat_raise",
            "supersetId": "ss_kino_t_3"
          }
        ]
      },
      {
        "id": "d2",
        "dayName": {
          "en": "Thursday (Lower Body)",
          "es": "Jueves (Piernas)"
        },
        "slots": [
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "12-15",
            "exerciseId": "lunges",
            "supersetId": "ss_kino_th_1",
            "notes": "Bulgarian split squats (Rest-Pause on last set) + Neck"
          },
          {
            "muscle": "NECK",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "neck_curl",
            "supersetId": "ss_kino_th_1"
          },
          {
            "muscle": "HAMSTRINGS",
            "setTarget": 4,
            "reps": "6-12",
            "exerciseId": "rdl",
            "supersetId": "ss_kino_th_2",
            "notes": "RDLs + Leg extensions"
          },
          {
            "muscle": "QUADS",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "leg_ext",
            "supersetId": "ss_kino_th_2"
          },
          {
            "muscle": "CALVES",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "calf_raise",
            "supersetId": "ss_kino_th_3",
            "notes": "Calf raises + Hanging leg raises"
          },
          {
            "muscle": "ABS",
            "setTarget": 4,
            "reps": "AMRAP",
            "exerciseId": "leg_raise",
            "supersetId": "ss_kino_th_3"
          }
        ]
      },
      {
        "id": "d3",
        "dayName": {
          "en": "Saturday (Chest & Arms)",
          "es": "Sábado (Pecho y Brazos)"
        },
        "slots": [
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_inc",
            "supersetId": "ss_kino_s_1",
            "notes": "Incline Bench (Rest-Pause on last set) + Abs/Neck"
          },
          {
            "muscle": "ABS",
            "setTarget": 3,
            "reps": "AMRAP",
            "exerciseId": "abs_cable",
            "supersetId": "ss_kino_s_1"
          },
          {
            "muscle": "CHEST",
            "setTarget": 3,
            "reps": "6-10",
            "exerciseId": "bp_flat",
            "supersetId": "ss_kino_s_2",
            "notes": "Bench Press + Machine Row"
          },
          {
            "muscle": "BACK",
            "setTarget": 3,
            "reps": "10-12",
            "exerciseId": "row_cable",
            "supersetId": "ss_kino_s_2"
          },
          {
            "muscle": "BICEPS",
            "setTarget": 4,
            "reps": "6-10",
            "exerciseId": "curl_db",
            "supersetId": "ss_kino_s_3",
            "notes": "Incline curls + Triceps pushdowns"
          },
          {
            "muscle": "TRICEPS",
            "setTarget": 4,
            "reps": "15-20",
            "exerciseId": "tri_push",
            "supersetId": "ss_kino_s_3"
          }
        ]
      }
    ]
  }
]"""
    
    val TWO_BLOCK_PROTOCOLS_JSON = """[
  {
    "id": "tbm_acc_time_volume",
    "phase": "accumulation",
    "blockNumber": 1,
    "name": {
      "en": "Time-Volume Training",
      "es": "Time-Volume Training"
    },
    "primarySetType": "time_volume",
    "short": {
      "en": "Density training: 3-rep sets every 10s within 15-min blocks. Front-loads volume, no failure.",
      "es": "Densidad: series de 3 reps cada 10s en bloques de 15 min. Carga front-loaded, sin fallo."
    },
    "long": {
      "en": "Pick a weight you could do for 10–12 reps. Do 3 reps, rest 10s. Repeat with the same weight and 10s rest until you can no longer hit 3. Then bump rest to 20s, then 30s, etc., always with 3-rep sets. Keep going for 15 min (large parts) or 7.5 min (small parts). NEVER go to failure — stop the moment a 3rd rep would be a struggle. PROGRESSION: if you can hold 10s rest for at least 1/3 of the block (5 min for large, 2.5 min for small), increase the weight next time.",
      "es": "Elige un peso para 10–12 reps. Haz 3 reps, descansa 10s. Repite con el mismo peso y 10s hasta que ya no puedas 3. Sube descanso a 20s, luego 30s, etc., siempre con series de 3. Continúa 15 min (grandes) o 7,5 min (pequeños). NUNCA al fallo — para cuando la 3ª rep sería difícil. PROGRESIÓN: si mantienes 10s al menos 1/3 del bloque (5 min grandes / 2,5 min pequeños), sube el peso la próxima vez."
    },
    "keyRules": {
      "en": [
        "Large muscles (Chest/Back/Quads): 15-min blocks",
        "Small muscles (Shoulders/Arms/Hams/Calves/Abs): 7.5-min blocks",
        "Calves+Abs can share a block (alternate exercises, no rest)",
        "Increase weight only if you hold 10s rest for 1/3 of the block",
        "Use only the SAME exercise within a block"
      ],
      "es": [
        "Músculos grandes (Pecho/Espalda/Cuádriceps): bloques de 15 min",
        "Pequeños (Hombros/Brazos/Isquios/Gemelos/Abs): bloques de 7,5 min",
        "Gemelos+Abs pueden compartir bloque (alterna sin descanso)",
        "Sube peso sólo si mantienes 10s al menos 1/3 del bloque",
        "Usa el MISMO ejercicio en todo el bloque"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 10,
        "repRange": "3",
        "days": [
          {
            "day": 1,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 1
              },
              {
                "group": "BACK",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "muscles": [
              {
                "group": "QUADS",
                "sets": 1
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "ABS",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 1
              },
              {
                "group": "BACK",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 5,
            "muscles": [
              {
                "group": "QUADS",
                "sets": 1
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "ABS",
                "sets": 1
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 10,
        "repRange": "3",
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 10,
        "repRange": "3",
        "days": []
      }
    ]
  },
  {
    "id": "tbm_acc_cluster",
    "phase": "accumulation",
    "blockNumber": 2,
    "name": {
      "en": "Cluster Training",
      "es": "Cluster Training"
    },
    "primarySetType": "cluster",
    "short": {
      "en": "Break a normal set into mini-sets with 10s in-set rest. Hit 20+ reps with a 10RM weight.",
      "es": "Rompe la serie en mini-series con 10s descanso intra-serie. 20+ reps con tu 10RM."
    },
    "long": {
      "en": "Use a weight you can do for 10 reps. Do 4 reps, set the weight down, rest 10s. Pick up and do 4 more. Repeat for 6 mini-sets (24 total reps). That is ONE cluster set. Take prescribed inter-set rest then repeat the cluster set per the day's schedule. Days 4–5 use Pyramid Clusters: 1-2-3-2-1 reps with 10s rest using a 5–6RM weight.",
      "es": "Peso para 10 reps. Haz 4 reps, baja la barra, 10s descanso. Levanta y haz 4 más. Repite 6 mini-series (24 reps totales). Eso es UNA serie cluster. Toma el descanso inter-serie del día. Días 4–5 usan Pyramid Clusters: 1-2-3-2-1 reps con 10s descanso usando peso de 5–6RM."
    },
    "keyRules": {
      "en": [
        "Week 1: 4 mini-sets x 3 reps, 2 min between cluster sets",
        "Week 2: 5 mini-sets x 3 reps, 90s rest",
        "Week 3: 6 mini-sets x 3 reps, 1 min rest",
        "Days 4-5 use Pyramid Clusters (1-2-3-2-1) with a 5-6RM",
        "Same exercise within a cluster set; you may swap between rounds"
      ],
      "es": [
        "Semana 1: 4 mini-series x 3 reps, 2 min entre cluster sets",
        "Semana 2: 5 mini x 3, 90s descanso",
        "Semana 3: 6 mini x 3, 1 min descanso",
        "Días 4-5: Pyramid Clusters (1-2-3-2-1) con peso de 5-6RM",
        "Mismo ejercicio dentro del cluster; puedes cambiar entre rondas"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 120,
        "repRange": "4x3",
        "setsPerLarge": 2,
        "setsPerSmall": 1,
        "days": [
          {
            "day": 1,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "muscles": [
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "label": {
              "en": "Pyramid Clusters",
              "es": "Pyramid Clusters"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 5,
            "label": {
              "en": "Pyramid Clusters",
              "es": "Pyramid Clusters"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 90,
        "repRange": "5x3",
        "setsPerLarge": 3,
        "setsPerSmall": 1,
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 60,
        "repRange": "6x3",
        "setsPerLarge": 3,
        "setsPerSmall": 2,
        "days": []
      }
    ]
  },
  {
    "id": "tbm_acc_rest_pause",
    "phase": "accumulation",
    "blockNumber": 3,
    "name": {
      "en": "Rest-Pause Training",
      "es": "Rest-Pause Training"
    },
    "primarySetType": "rest_pause",
    "short": {
      "en": "1 working set near failure → 20s rest → more reps → 20s rest → more reps. Stop 1 rep shy.",
      "es": "1 serie de trabajo cerca del fallo → 20s descanso → más reps → 20s → más reps. Queda a 1 rep."
    },
    "long": {
      "en": "\"10-rep start\" days: weight is your 10RM. Hit 9–10 reps (1 shy of failure), rest 20s, get as many more as you can (~3–5), rest 20s, final mini-set (~1–2). That counts as ONE rest-pause set. Take prescribed rest between rest-pause sets. \"5-rep start\" days use a heavier weight starting with 5 reps. NEVER go to true failure — keep one rep in the tank. INCREASE the weight every time you repeat an exercise.",
      "es": "Días \"10-rep start\": peso = 10RM. Llega a 9–10 reps (1 antes del fallo), 20s descanso, saca todas las que puedas (~3–5), 20s, mini-serie final (~1–2). Eso es UNA serie rest-pause. Toma descanso inter-serie. Días \"5-rep start\" usan peso más alto comenzando con 5 reps. NUNCA al fallo real — deja 1 rep en el banco. SUBE el peso cada vez que repites un ejercicio."
    },
    "keyRules": {
      "en": [
        "Use mass-builders: squat, deadlift, bench, OHP, rows, dips, BB curls",
        "20s rest WITHIN the rest-pause sequence (3 mini-sets per \"set\")",
        "Inter-set rest: Week 1=2 min, Week 2=90s, Week 3=1 min",
        "Stop 1 rep shy of failure on EVERY mini-set",
        "Increase weight each week even as rest drops"
      ],
      "es": [
        "Usa ejercicios de masa: sentadilla, peso muerto, press banca, OHP, remos, fondos, curl con barra",
        "20s descanso DENTRO de la secuencia rest-pause (3 mini-series por \"set\")",
        "Descanso inter-serie: Semana 1=2 min, Semana 2=90s, Semana 3=1 min",
        "Para 1 rep antes del fallo en CADA mini-serie",
        "Sube el peso cada semana aunque baje el descanso"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 120,
        "repRange": "10-RP",
        "setsPerLarge": 2,
        "setsPerSmall": 1,
        "days": [
          {
            "day": 1,
            "label": {
              "en": "10-rep start",
              "es": "10-rep start"
            },
            "muscles": [
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "label": {
              "en": "10-rep start",
              "es": "10-rep start"
            },
            "muscles": [
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "label": {
              "en": "5-rep start",
              "es": "5-rep start"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              }
            ]
          },
          {
            "day": 5,
            "label": {
              "en": "5-rep start",
              "es": "5-rep start"
            },
            "muscles": [
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 90,
        "repRange": "10-RP",
        "setsPerLarge": 3,
        "setsPerSmall": 1,
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 60,
        "repRange": "10-RP",
        "setsPerLarge": 3,
        "setsPerSmall": 2,
        "days": []
      }
    ]
  },
  {
    "id": "tbm_acc_vhf",
    "phase": "accumulation",
    "blockNumber": 4,
    "name": {
      "en": "Very High Frequency (VHF)",
      "es": "Very High Frequency (VHF)"
    },
    "primarySetType": "regular",
    "short": {
      "en": "Train EVERY muscle EVERY day, 6 days in a row, low sets, never to failure.",
      "es": "Entrena CADA músculo CADA día, 6 días seguidos, pocas series, sin fallo."
    },
    "long": {
      "en": "Hit every body part every day with very low volume per session (1–3 sets) and never to failure. Twice a week use IN-SET SUPERSETS: alternate reps of an isolation move and a compound move within one set (e.g. lying tricep extension + close-grip bench). On the final set, rep out the stronger compound. Rest drops 90s→60s→45s across the 3 weeks; rep range drops 12–15→10–12→8–10 (and 10–12→8–10→6–8 on heavier days).",
      "es": "Entrena cada parte cada día con muy poco volumen (1–3 series) y sin fallo. Dos veces por semana usa IN-SET SUPERSETS: alterna reps de un movimiento de aislamiento y uno compuesto en la misma serie (p.ej. extensión + press cerrado). En la última serie, saca reps al fallo del compuesto. Descanso baja 90s→60s→45s en 3 semanas; rango de reps baja 12-15→10-12→8-10 (y 10-12→8-10→6-8 en días pesados)."
    },
    "keyRules": {
      "en": [
        "Train 6 days in a row, every muscle every day",
        "Days 3 & 6: In-Set Supersets (alternate isolation + compound reps in one set)",
        "NEVER train to failure — leave 2+ reps in the tank",
        "Rest: Week 1 = 90s, Week 2 = 60s, Week 3 = 45s"
      ],
      "es": [
        "Entrena 6 días seguidos, cada músculo cada día",
        "Días 3 y 6: In-Set Supersets (alterna aislamiento + compuesto en una serie)",
        "NUNCA al fallo — deja 2+ reps en reserva",
        "Descanso: Sem 1 = 90s, Sem 2 = 60s, Sem 3 = 45s"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 90,
        "repRange": "12-15",
        "setsPerLarge": 2,
        "setsPerSmall": 1,
        "days": [
          {
            "day": 1,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "label": {
              "en": "In-Set Supersets",
              "es": "In-Set Supersets"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 4,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 5,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 6,
            "label": {
              "en": "In-Set Supersets",
              "es": "In-Set Supersets"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 60,
        "repRange": "10-12",
        "setsPerLarge": 3,
        "setsPerSmall": 1,
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 45,
        "repRange": "8-10",
        "setsPerLarge": 3,
        "setsPerSmall": 2,
        "days": []
      }
    ]
  },
  {
    "id": "tbm_int_low_rep",
    "phase": "intensification",
    "blockNumber": 1,
    "name": {
      "en": "Low-Rep Strength (5-3-1)",
      "es": "Fuerza Bajas Reps (5-3-1)"
    },
    "primarySetType": "top",
    "short": {
      "en": "Simple 5-3-1: heavier each set. 3 sets per body part. No failure, no intensity tricks.",
      "es": "Simple 5-3-1: más pesado cada serie. 3 series por músculo. Sin fallo, sin trucos."
    },
    "long": {
      "en": "3 sets per muscle: first set of 5, then 3, then 1 — adding weight each set. The single-rep set is 95–98% of 1RM, NOT a true max attempt. NEVER go to failure. If you fail the rep count (e.g. 4 on the 5-rep set), keep that same weight on the next set instead of going up. If 5 felt easy and you could do more, STOP and add more weight than planned to the 3-rep set.",
      "es": "3 series por músculo: primero 5, luego 3, luego 1 — subiendo peso cada serie. La serie de 1 rep es 95–98% de tu 1RM, NO un intento real al máximo. NUNCA al fallo. Si fallas el conteo (p.ej. 4 en la de 5), mantén el mismo peso en la siguiente en vez de subir. Si las 5 fueron fáciles y podías más, PARA y sube más peso al set de 3."
    },
    "keyRules": {
      "en": [
        "Same rep scheme all 3 weeks: 5-3-1, increasing weight each set",
        "Stay 1 rep shy of failure on every set",
        "Single rep ≠ max attempt (save that for deload week)",
        "Use same exercises across the 3 weeks"
      ],
      "es": [
        "Mismo esquema las 3 semanas: 5-3-1, subiendo peso cada serie",
        "Queda a 1 rep del fallo en cada serie",
        "La rep única ≠ intento al máximo (eso es para deload)",
        "Usa los mismos ejercicios durante las 3 semanas"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 180,
        "repRange": "5-3-1",
        "setsPerLarge": 3,
        "setsPerSmall": 3,
        "days": [
          {
            "day": 1,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 3
              },
              {
                "group": "BACK",
                "sets": 3
              },
              {
                "group": "BICEPS",
                "sets": 3
              },
              {
                "group": "TRICEPS",
                "sets": 3
              }
            ]
          },
          {
            "day": 2,
            "muscles": [
              {
                "group": "QUADS",
                "sets": 3
              },
              {
                "group": "SHOULDERS",
                "sets": 3
              },
              {
                "group": "HAMSTRINGS",
                "sets": 3
              },
              {
                "group": "CALVES",
                "sets": 3
              },
              {
                "group": "TRAPS",
                "sets": 3
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "muscles": [
              {
                "group": "CHEST",
                "sets": 3
              },
              {
                "group": "BACK",
                "sets": 3
              },
              {
                "group": "BICEPS",
                "sets": 3
              },
              {
                "group": "TRICEPS",
                "sets": 3
              }
            ]
          },
          {
            "day": 5,
            "muscles": [
              {
                "group": "QUADS",
                "sets": 3
              },
              {
                "group": "SHOULDERS",
                "sets": 3
              },
              {
                "group": "HAMSTRINGS",
                "sets": 3
              },
              {
                "group": "CALVES",
                "sets": 3
              },
              {
                "group": "TRAPS",
                "sets": 3
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 180,
        "repRange": "5-3-1",
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 180,
        "repRange": "5-3-1",
        "days": []
      }
    ]
  },
  {
    "id": "tbm_int_single_cluster",
    "phase": "intensification",
    "blockNumber": 2,
    "name": {
      "en": "Single-Rep Cluster",
      "es": "Cluster de 1 Rep"
    },
    "primarySetType": "cluster",
    "short": {
      "en": "Singles at ~90% 1RM with 10s rest — get 10–12 reps with near-max weight.",
      "es": "Singles al ~90% 1RM con 10s descanso — saca 10–12 reps con peso casi máximo."
    },
    "long": {
      "en": "Use 88–92% of 1RM. Do 1 rep, rack the bar, rest 10s. Unrack, do 1 rep, rest 10s. Repeat for 10–12 mini-sets total. With 95%, target 5–7 mini-sets. Days 4–5 use BOTTOM-START: set the bar in the rack pins at the bottom of the ROM (squat, bench, OHP) so each rep starts from a dead stop. This kills elastic rebound and forces full muscular work.",
      "es": "Usa 88–92% del 1RM. 1 rep, racka, 10s descanso. Desracka, 1 rep, 10s. Repite 10–12 mini-series totales. Al 95%, apunta a 5–7 mini-series. Días 4–5 usan BOTTOM-START: pon la barra en los pines al fondo del ROM (sentadilla, banca, OHP) — cada rep parte de paro muerto. Elimina el rebote elástico y fuerza el trabajo muscular total."
    },
    "keyRules": {
      "en": [
        "Single reps with 10s rest, ~90% 1RM",
        "Days 4-5: BOTTOM-START (bar in rack at bottom of ROM)",
        "Lower-rep days (5-7 reps) use 95% of 1RM",
        "Same scheme all 3 weeks"
      ],
      "es": [
        "Reps únicas con 10s descanso, ~90% 1RM",
        "Días 4-5: BOTTOM-START (barra en pines al fondo del ROM)",
        "Días de menos reps (5-7) usan 95% del 1RM",
        "Mismo esquema las 3 semanas"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 120,
        "repRange": "10-12x1",
        "setsPerLarge": 2,
        "setsPerSmall": 1,
        "days": [
          {
            "day": 1,
            "label": {
              "en": "10-12 singles @ 90%",
              "es": "10-12 singles @ 90%"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "label": {
              "en": "10-12 singles @ 90%",
              "es": "10-12 singles @ 90%"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "label": {
              "en": "5-7 singles @ 95% (Bottom-Start)",
              "es": "5-7 singles @ 95% (Bottom-Start)"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 5,
            "label": {
              "en": "5-7 singles @ 95% (Bottom-Start)",
              "es": "5-7 singles @ 95% (Bottom-Start)"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 120,
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 120,
        "days": []
      }
    ]
  },
  {
    "id": "tbm_int_triple_add",
    "phase": "intensification",
    "blockNumber": 3,
    "name": {
      "en": "Triple Add Sets",
      "es": "Triple Add Sets"
    },
    "primarySetType": "triple_add",
    "short": {
      "en": "Inverse drop set: light high-rep → 10s → moderate → 10s → heavy low-rep. Hits all 3 fiber types.",
      "es": "Drop set inverso: ligero altas reps → 10s → moderado → 10s → pesado bajas reps. Activa los 3 tipos de fibra."
    },
    "long": {
      "en": "Start LIGHT and work UP (inverse of a normal drop set). Part 1: light weight, 20–30 reps (Type I endurance fibers). Rest 10s while changing weight. Part 2: about double the load, 6–8 reps (Type IIa fibers). Rest 10s. Part 3: heavy weight, 1–3 reps (Type IIb explosive fibers + connective tissue). The whole thing is ONE set. Days 3–5 of the week use Low-Rep Strength (3-2-1) — Triple Add twice a week is enough.",
      "es": "Empieza LIGERO y sube (inverso al drop set normal). Parte 1: peso ligero, 20–30 reps (fibras Tipo I de resistencia). 10s descanso para cambiar peso. Parte 2: aprox. el doble, 6–8 reps (Tipo IIa). 10s. Parte 3: peso pesado, 1–3 reps (Tipo IIb explosivas + tejido conectivo). Todo eso es UNA serie. Días 4–5 usan Fuerza Bajas Reps (3-2-1) — 2 veces a la semana de Triple Add basta."
    },
    "keyRules": {
      "en": [
        "Inverse drop: LIGHT → MODERATE → HEAVY (not heavy to light)",
        "10s between parts of one Triple Add set",
        "Part 2 weight is roughly double Part 1",
        "Days 1-2: Triple Add | Days 4-5: 3-2-1 Low-Rep Strength"
      ],
      "es": [
        "Drop inverso: LIGERO → MODERADO → PESADO (no al revés)",
        "10s entre partes de una serie Triple Add",
        "Parte 2 ≈ doble del peso de la Parte 1",
        "Días 1-2: Triple Add | Días 4-5: Fuerza Bajas Reps 3-2-1"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 120,
        "repRange": "TA + 3-2-1",
        "setsPerLarge": 2,
        "setsPerSmall": 2,
        "days": [
          {
            "day": 1,
            "label": {
              "en": "Triple Add Sets",
              "es": "Triple Add Sets"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 2
              },
              {
                "group": "TRICEPS",
                "sets": 2
              }
            ]
          },
          {
            "day": 2,
            "label": {
              "en": "Triple Add Sets",
              "es": "Triple Add Sets"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 2
              },
              {
                "group": "HAMSTRINGS",
                "sets": 2
              },
              {
                "group": "CALVES",
                "sets": 1
              },
              {
                "group": "TRAPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "label": {
              "en": "Low-Rep 3-2-1",
              "es": "Bajas Reps 3-2-1"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 3
              },
              {
                "group": "BACK",
                "sets": 3
              },
              {
                "group": "BICEPS",
                "sets": 3
              },
              {
                "group": "TRICEPS",
                "sets": 3
              }
            ]
          },
          {
            "day": 5,
            "label": {
              "en": "Low-Rep 3-2-1",
              "es": "Bajas Reps 3-2-1"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 3
              },
              {
                "group": "SHOULDERS",
                "sets": 3
              },
              {
                "group": "HAMSTRINGS",
                "sets": 3
              },
              {
                "group": "CALVES",
                "sets": 3
              },
              {
                "group": "TRAPS",
                "sets": 3
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 120,
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 120,
        "days": []
      }
    ]
  },
  {
    "id": "tbm_int_ceo",
    "phase": "intensification",
    "blockNumber": 4,
    "name": {
      "en": "Compound Exercise Overload (CEO)",
      "es": "Compound Exercise Overload (CEO)"
    },
    "primarySetType": "time_volume",
    "short": {
      "en": "ONE exercise for 40 min: 3-rep sets, 30s rest, drop weight when you fail 3 reps. Massive specificity.",
      "es": "UN ejercicio durante 40 min: series de 3 reps, 30s descanso, baja peso al fallar las 3. Especificidad brutal."
    },
    "long": {
      "en": "Single compound (squat, bench, or deadlift variant) for an ENTIRE 40-min session. Start with a weight you could normally do for ~6 reps. Do 3 reps, rest 30s (20s for upper-body lifts like bench/curl), do 3 more, rest 30s. Continue until you can no longer hit 3 reps cleanly. Drop 20 lbs total (10 per side for squat/DL, 10 lbs total / 5 per side for bench), keep going. NEVER go to failure — keep a \"do-or-die\" rep in you. On the final set, rest 2 min then rep out with the last weight (typically 5–8 reps). Days are rotated: Squat → Bench → Deadlift.",
      "es": "UN compuesto (sentadilla, banca o peso muerto) durante TODA la sesión de 40 min. Empieza con peso para ~6 reps normalmente. 3 reps, 30s descanso (20s en lifts de tren superior), 3 reps, 30s. Continúa hasta que ya no puedas 3 limpias. Baja 20 lb total (10 por lado en sq/DL, 10 lb total / 5 por lado en banca), sigue. NUNCA al fallo — mantén la \"rep do-or-die\". En la última serie, descansa 2 min y haz reps al fallo con el último peso (5–8 reps típico). Días rotan: Sentadilla → Banca → Peso Muerto."
    },
    "keyRules": {
      "en": [
        "Pick ONE compound for the entire 40-min session",
        "3 reps per set, 30s rest (20s for upper-body lifts)",
        "Drop weight 20 lb (or 10 lb upper) when you fail 3 clean reps",
        "NEVER go to failure — leave do-or-die rep in you",
        "Final set: rest 2 min, then max-rep burnout",
        "Load small plates first — easier to strip mid-session"
      ],
      "es": [
        "Elige UN compuesto para los 40 min completos",
        "3 reps por serie, 30s descanso (20s en tren superior)",
        "Baja 20 lb (o 10 lb tren superior) al fallar las 3 limpias",
        "NUNCA al fallo — mantén la rep do-or-die",
        "Última serie: 2 min descanso + reps al fallo",
        "Carga discos pequeños primero — más fácil quitarlos"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 30,
        "repRange": "3 reps, 40 min",
        "setsPerLarge": 1,
        "setsPerSmall": 1,
        "days": [
          {
            "day": 1,
            "label": {
              "en": "CEO Squat — 40 min",
              "es": "CEO Sentadilla — 40 min"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 3,
            "label": {
              "en": "CEO Bench — 40 min",
              "es": "CEO Banca — 40 min"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 1
              }
            ]
          },
          {
            "day": 4,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 5,
            "label": {
              "en": "CEO Deadlift — 40 min",
              "es": "CEO Peso Muerto — 40 min"
            },
            "muscles": [
              {
                "group": "BACK",
                "sets": 1
              }
            ]
          }
        ]
      },
      {
        "week": 2,
        "restSeconds": 30,
        "days": []
      },
      {
        "week": 3,
        "restSeconds": 30,
        "days": []
      }
    ]
  },
  {
    "id": "tbm_deload",
    "phase": "deload",
    "blockNumber": 1,
    "name": {
      "en": "Deload Week",
      "es": "Semana de Deload"
    },
    "primarySetType": "top",
    "short": {
      "en": "4 days off → 1 fun day (optional) → 1 day off → 1RM strength test.",
      "es": "4 días off → 1 día divertido (opcional) → 1 día off → test de 1RM."
    },
    "long": {
      "en": "OFF: Days 1, 2, and 4 are fully off. FUN (Day 3, optional): light work on exercises you enjoy that are not main mass-builders (Concentration Curls, etc). MAX OUT (Day 5): test 1RM on the lifts you most want to know. Use ramping/feeler sets — never max cold. Sequence: warm-up at ~50% for 5–6 reps, then ~70% for 3 reps, then ~85% for 1, then ~92% for 1 (feeler), rest 2–3 min and GO. Lift you most care about FIRST (others may be lower due to fatigue).",
      "es": "OFF: Días 1, 2 y 4 totalmente libres. FUN (Día 3, opcional): trabajo ligero con ejercicios que te gusten que no son principales (Concentration Curls, etc.). MAX OUT (Día 5): test de 1RM en los lifts que más te importan. Usa rampas/feeler sets — nunca al máximo en frío. Secuencia: calentamiento al ~50% por 5–6 reps, ~70% por 3, ~85% por 1, ~92% por 1 (feeler), descansa 2–3 min y VAMOS. El lift que más te importa PRIMERO (los demás bajan por fatiga)."
    },
    "keyRules": {
      "en": [
        "Days 1, 2, 4: Off completely",
        "Day 3 (optional): Fun light exercises — no main mass-builders",
        "Day 5: 1RM test on the lifts you want to track",
        "Ramp: 50% x5 → 70% x3 → 85% x1 → 92% x1 → 100% x1",
        "Most-important lift FIRST",
        "No max out without a spotter on bench press"
      ],
      "es": [
        "Días 1, 2 y 4: Off completos",
        "Día 3 (opcional): Ejercicios divertidos ligeros — nada principal",
        "Día 5: Test 1RM en los lifts que quieras trackear",
        "Rampa: 50% x5 → 70% x3 → 85% x1 → 92% x1 → 100% x1",
        "El lift más importante PRIMERO",
        "No hagas max en banca sin spotter"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 180,
        "days": [
          {
            "day": 1,
            "muscles": [],
            "label": {
              "en": "Off",
              "es": "Off"
            }
          },
          {
            "day": 2,
            "muscles": [],
            "label": {
              "en": "Off",
              "es": "Off"
            }
          },
          {
            "day": 3,
            "label": {
              "en": "Fun Day (optional)",
              "es": "Día Divertido (opcional)"
            },
            "muscles": [
              {
                "group": "BICEPS",
                "sets": 3
              },
              {
                "group": "CALVES",
                "sets": 3
              },
              {
                "group": "ABS",
                "sets": 3
              }
            ]
          },
          {
            "day": 4,
            "muscles": [],
            "label": {
              "en": "Off",
              "es": "Off"
            }
          },
          {
            "day": 5,
            "label": {
              "en": "1RM Max Out",
              "es": "Test 1RM"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 5
              },
              {
                "group": "QUADS",
                "sets": 5
              },
              {
                "group": "BACK",
                "sets": 5
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "tbm_one_week",
    "phase": "one_week",
    "blockNumber": 1,
    "name": {
      "en": "One-Week Mass",
      "es": "One-Week Mass"
    },
    "primarySetType": "cluster",
    "short": {
      "en": "Compressed: 2 days Accumulation + 2 days Intensification, repeat weekly.",
      "es": "Comprimido: 2 días Acumulación + 2 días Intensificación, repite semanalmente."
    },
    "long": {
      "en": "Take any Accumulation method and any Intensification method and run 2 days of each per week. Mon/Tue: Accumulation (e.g. Cluster Training Week-1 Day-1 then Day-2). Thu/Sat: Intensification (e.g. Low-Rep 5-3-1 Day-1 then Day-2). Either repeat exact workouts the next week or progress to Week-2 of that method. Lets you \"sample\" methods or commit to one and progress slowly.",
      "es": "Toma un método de Acumulación y uno de Intensificación y haz 2 días de cada uno por semana. Lun/Mar: Acumulación (p.ej. Cluster Training Sem-1 Día-1 luego Día-2). Jue/Sáb: Intensificación (p.ej. 5-3-1 Día-1 luego Día-2). Repite los workouts exactos la siguiente semana o progresa a Sem-2 del método. Te permite \"probar\" métodos o comprometerte con uno y progresar lento."
    },
    "keyRules": {
      "en": [
        "Pick 1 Accumulation method + 1 Intensification method",
        "Mon/Tue = Accumulation | Thu/Sat = Intensification",
        "Each week: repeat or progress",
        "Use for sampling methods OR slow committed progress"
      ],
      "es": [
        "Elige 1 método de Acumulación + 1 de Intensificación",
        "Lun/Mar = Acumulación | Jue/Sáb = Intensificación",
        "Cada semana: repite o progresa",
        "Útil para probar métodos O progreso lento comprometido"
      ]
    },
    "schedule": [
      {
        "week": 1,
        "restSeconds": 120,
        "days": [
          {
            "day": 1,
            "label": {
              "en": "Accumulation Day 1",
              "es": "Acumulación Día 1"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 2
              },
              {
                "group": "BACK",
                "sets": 2
              },
              {
                "group": "BICEPS",
                "sets": 1
              },
              {
                "group": "TRICEPS",
                "sets": 1
              }
            ]
          },
          {
            "day": 2,
            "label": {
              "en": "Accumulation Day 2",
              "es": "Acumulación Día 2"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 2
              },
              {
                "group": "SHOULDERS",
                "sets": 1
              },
              {
                "group": "HAMSTRINGS",
                "sets": 1
              },
              {
                "group": "CALVES",
                "sets": 1
              }
            ]
          },
          {
            "day": 3,
            "muscles": [],
            "label": {
              "en": "Rest",
              "es": "Descanso"
            }
          },
          {
            "day": 4,
            "label": {
              "en": "Intensification Day 1",
              "es": "Intensificación Día 1"
            },
            "muscles": [
              {
                "group": "CHEST",
                "sets": 3
              },
              {
                "group": "BACK",
                "sets": 3
              },
              {
                "group": "BICEPS",
                "sets": 3
              },
              {
                "group": "TRICEPS",
                "sets": 3
              }
            ]
          },
          {
            "day": 5,
            "label": {
              "en": "Intensification Day 2",
              "es": "Intensificación Día 2"
            },
            "muscles": [
              {
                "group": "QUADS",
                "sets": 3
              },
              {
                "group": "SHOULDERS",
                "sets": 3
              },
              {
                "group": "HAMSTRINGS",
                "sets": 3
              },
              {
                "group": "CALVES",
                "sets": 3
              }
            ]
          }
        ]
      }
    ]
  }
]"""
    
    val TWO_BLOCK_PHILOSOPHY_JSON = """{
  "en": {
    "title": "Two Block Mass — Accumulation + Intensification",
    "body": "A 6-week mesocycle: 3 weeks of volume-based Accumulation push you toward acute overtraining, then 3 weeks of low-volume heavy Intensification rebound you into super-compensation. Build muscle in the first half, build strength in the second, then deload and run another combo. Pick any 1 of the 4 Accumulation blocks and any 1 of the 4 Intensification blocks per cycle.",
    "cycle": "6-week cycle = 3 wk Accumulation → 3 wk Intensification → 1 wk Deload (optional)"
  },
  "es": {
    "title": "Two Block Mass — Acumulación + Intensificación",
    "body": "Mesociclo de 6 semanas: 3 semanas de Acumulación basada en volumen te empujan al sobreentreno agudo, luego 3 semanas de Intensificación pesada y de bajo volumen te rebotan a supercompensación. Construye músculo en la primera mitad, fuerza en la segunda, deload y otra combinación. Elige 1 de los 4 bloques de Acumulación y 1 de los 4 de Intensificación por ciclo.",
    "cycle": "Ciclo de 6 semanas = 3 sem Acumulación → 3 sem Intensificación → 1 sem Deload (opcional)"
  }
}"""
}
