package com.gainslab.ironlog.utils

import com.gainslab.ironlog.model.*

object Templates {
    val WIZARD_TEMPLATE = listOf(
        ProgramDay(
            id = "wiz_heavy",
            dayName = LocalizedText("Day 1: Heavy (5-8 Reps)", "Día 1: Pesado (5-8 Reps)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "bp_bar", reps = "5-8"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "pullup", reps = "5-8"),
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 3, exerciseId = "sq_bar", reps = "5-8"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 3, exerciseId = "sldl", reps = "5-8"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 3, exerciseId = "ohp", reps = "5-8"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 3, exerciseId = "curl_bar", reps = "5-8"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 3, exerciseId = "dips", reps = "5-8")
            )
        ),
        ProgramDay(
            id = "wiz_light",
            dayName = LocalizedText("Day 2: Light (12-15 Reps)", "Día 2: Liviano (12-15 Reps)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "pec_fly", reps = "12-15"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "pullover_db", reps = "12-15"),
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 3, exerciseId = "leg_ext", reps = "12-15"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 3, exerciseId = "leg_curl", reps = "12-15"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 3, exerciseId = "lat_raise", reps = "12-15"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 3, exerciseId = "curl_cable", reps = "12-15"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 3, exerciseId = "tri_push", reps = "12-15")
            )
        ),
        ProgramDay(
            id = "wiz_medium",
            dayName = LocalizedText("Day 3: Medium (8-12 Reps)", "Día 3: Medio (8-12 Reps)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "bp_inc_bar", reps = "8-12"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "row_db", reps = "8-12"),
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 3, exerciseId = "leg_press", reps = "8-12"),
                ProgramSlot(muscle = MuscleGroup.GLUTES, setTarget = 3, exerciseId = "glute_bridge", reps = "8-12"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 3, exerciseId = "ohp_db", reps = "8-12"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 3, exerciseId = "curl_ez", reps = "8-12"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 3, exerciseId = "tri_ext", reps = "8-12")
            )
        )
    )

    val UPPER_LOWER_TEMPLATE = listOf(
        ProgramDay(
            id = "ul_1",
            dayName = LocalizedText("Upper Power", "Torso Fuerza"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 4, exerciseId = "bp_bar"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 4, exerciseId = "row_mach"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 3, exerciseId = "ohp"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 3, exerciseId = "curl_bar"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 3, exerciseId = "skull_crusher")
            )
        ),
        ProgramDay(
            id = "ul_2",
            dayName = LocalizedText("Lower Power", "Pierna Fuerza"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 4, exerciseId = "sq_hack"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 4, exerciseId = "rdl"),
                ProgramSlot(muscle = MuscleGroup.CALVES, setTarget = 4, exerciseId = "calf_raise"),
                ProgramSlot(muscle = MuscleGroup.ABS, setTarget = 3, exerciseId = "abs_cable")
            )
        ),
        ProgramDay(
            id = "ul_3",
            dayName = LocalizedText("Upper Hypertrophy", "Torso Hipertrofia"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "bp_inc_wide"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "lat_pull"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 4, exerciseId = "lat_raise"),
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "pec_fly"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 3, exerciseId = "tri_push")
            )
        ),
        ProgramDay(
            id = "ul_4",
            dayName = LocalizedText("Lower Hypertrophy", "Pierna Hipertrofia"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 4, exerciseId = "leg_press"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 4, exerciseId = "leg_curl"),
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 3, exerciseId = "leg_ext"),
                ProgramSlot(muscle = MuscleGroup.CALVES, setTarget = 4, exerciseId = "calf_raise")
            )
        )
    )

    val DEFAULT_TEMPLATE = listOf(
        ProgramDay(
            id = "d_push",
            dayName = LocalizedText("Push (Chest/Shoulders/Tri)", "Empuje (Pecho/Hombro/Tri)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "bp_flat"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 3, exerciseId = "ohp"),
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, exerciseId = "bp_inc"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 3, exerciseId = "lat_raise"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 3, exerciseId = "tri_push")
            )
        ),
        ProgramDay(
            id = "d_pull",
            dayName = LocalizedText("Pull (Back/Biceps)", "Tracción (Espalda/Biceps)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "lat_pull"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "row_cable"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 3, exerciseId = "pullup"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 3, exerciseId = "curl_ez"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 3, exerciseId = "curl_db")
            )
        ),
        ProgramDay(
            id = "d_legs",
            dayName = LocalizedText("Legs", "Pierna"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 3, exerciseId = "sq_hack"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 3, exerciseId = "rdl"),
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 3, exerciseId = "leg_ext"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 3, exerciseId = "leg_curl"),
                ProgramSlot(muscle = MuscleGroup.CALVES, setTarget = 4, exerciseId = "calf_raise")
            )
        )
    )

    val RESENS_TEMPLATE = listOf(
        ProgramDay(
            id = "res_1",
            dayName = LocalizedText("Full Body A (Low Vol)", "Cuerpo Completo A (Bajo Vol)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 2, exerciseId = "leg_press"),
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 2, exerciseId = "bp_flat"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 2, exerciseId = "row_mach"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 2, exerciseId = "lat_raise"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 2, exerciseId = "curl_ez")
            )
        ),
        ProgramDay(
            id = "res_2",
            dayName = LocalizedText("Full Body B (Low Vol)", "Cuerpo Completo B (Bajo Vol)"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 2, exerciseId = "rdl"),
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 2, exerciseId = "bp_inc"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 2, exerciseId = "lat_pull"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 2, exerciseId = "tri_push"),
                ProgramSlot(muscle = MuscleGroup.ABS, setTarget = 2, exerciseId = "abs_cable")
            )
        )
    )

    val METABOLITE_TEMPLATE = listOf(
        ProgramDay(
            id = "meta_1",
            dayName = LocalizedText("Metabolite Upper", "Metabolitos Torso"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 4, exerciseId = "pec_fly", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.BACK, setTarget = 4, exerciseId = "row_cable", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.SHOULDERS, setTarget = 4, exerciseId = "lat_raise_cable", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.BICEPS, setTarget = 4, exerciseId = "curl_cable", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.TRICEPS, setTarget = 4, exerciseId = "tri_push", reps = "20-30")
            )
        ),
        ProgramDay(
            id = "meta_2",
            dayName = LocalizedText("Metabolite Lower", "Metabolitos Pierna"),
            slots = listOf(
                ProgramSlot(muscle = MuscleGroup.QUADS, setTarget = 4, exerciseId = "leg_ext", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.HAMSTRINGS, setTarget = 4, exerciseId = "leg_curl", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.CALVES, setTarget = 5, exerciseId = "calf_raise", reps = "20-30"),
                ProgramSlot(muscle = MuscleGroup.ABS, setTarget = 4, exerciseId = "abs_cable", reps = "20-30")
            )
        )
    )
}

data class RecommendationResult(
    val template: List<ProgramDay>,
    val mesoType: String,
    val reasonKey: String,
    val adjustedVolume: Boolean = false
)

object RecommendationEngine {
    fun recommendProgram(profile: UserProfile): RecommendationResult {
        val daysPerWeek = profile.daysPerWeek
        val goal = profile.goal
        val sessionDuration = profile.sessionDuration

        var selectedTemplate = Templates.DEFAULT_TEMPLATE
        var selectedType = "hyp_1"
        var reason = "rec_default"

        // 1. Logic based on Frequency
        if (daysPerWeek <= 2) {
            selectedTemplate = Templates.RESENS_TEMPLATE
            selectedType = "resensitization"
            reason = "rec_low_freq"
        } else if (daysPerWeek == 3) {
            selectedTemplate = Templates.WIZARD_TEMPLATE
            selectedType = "wizard"
            reason = "rec_wizard"
        } else if (daysPerWeek == 4) {
            selectedTemplate = Templates.UPPER_LOWER_TEMPLATE
            selectedType = "hyp_2"
            reason = "rec_4_day"
        } else {
            selectedTemplate = Templates.DEFAULT_TEMPLATE
            selectedType = "hyp_1"
            reason = "rec_ppl"
        }

        // 2. Goal Overrides
        if (goal == TrainingGoal.ENDURANCE) {
            selectedTemplate = Templates.METABOLITE_TEMPLATE
            selectedType = "metabolite"
            reason = "rec_endurance"
        }

        // 3. Time Constraints (Volume Adjustment)
        var finalTemplate = selectedTemplate
        var adjustedVolume = false

        if (sessionDuration == SessionDuration.SHORT) {
            finalTemplate = finalTemplate.map { day ->
                day.copy(slots = day.slots.map { slot ->
                    slot.copy(setTarget = maxOf(2, slot.setTarget - 1))
                })
            }
            adjustedVolume = true
        }

        return RecommendationResult(
            template = finalTemplate,
            mesoType = selectedType,
            reasonKey = reason,
            adjustedVolume = adjustedVolume
        )
    }
}
