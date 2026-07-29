package com.gainslab.ironlog.store

import com.gainslab.ironlog.model.*
import kotlinx.datetime.Clock
import kotlin.math.max

object SessionBuilder {

    private var idCounter = Clock.System.now().toEpochMilliseconds()
    private fun uid(): Int {
        idCounter += 1
        return (idCounter % Int.MAX_VALUE).toInt()
    }

    private fun getLastLogForExercise(exerciseId: String, logs: List<Log>): List<WorkoutSet>? {
        for (log in logs.sortedByDescending { it.endTime }) {
            val ex = log.exercises.find { it.id == exerciseId }
            if (ex != null && ex.sets.isNotEmpty()) {
                return ex.sets
            }
        }
        return null
    }

    fun buildFromProgramDay(
        dayIdx: Int,
        programDay: ProgramDay?,
        activeMeso: MesoCycle,
        exercises: List<ExerciseDef>,
        logs: List<Log>,
        lang: String,
        rpFeedback: Map<String, Map<String, Map<String, Any>>>, // Simplified for now
        rpEnabled: Boolean
    ): ActiveSession? {
        if (programDay == null) return null

        val dayNameSafe = if (lang == "es") programDay.dayName.es else programDay.dayName.en
        val safeDayName = dayNameSafe.ifEmpty { "Día ${dayIdx + 1}" }

        val mesoPlan = activeMeso.plan
        val dayPlan = if (dayIdx < mesoPlan.size) mesoPlan[dayIdx] else emptyList()
        val isDeload = activeMeso.isDeload == true

        val sessionExs = programDay.slots.mapIndexedNotNull { sIdx, slotDef ->
            val exId = if (sIdx < dayPlan.size) dayPlan[sIdx] else null
            
            // Priority: exact ID match -> same-muscle fallback -> typed placeholder
            var exDef = if (exId != null) exercises.find { it.id == exId } else null
            if (exDef == null) exDef = exercises.find { it.muscle == slotDef.muscle }
            if (exDef == null) {
                exDef = ExerciseDef(
                    id = "placeholder_${slotDef.muscle.name}_$sIdx",
                    name = LocalizedText(slotDef.muscle.name, slotDef.muscle.name),
                    muscle = slotDef.muscle
                )
            }

            var setTarget = slotDef.setTarget
            if (setTarget <= 0) setTarget = 3 // default

            // RP Feedback adjustments omitted for brevity/complexity in first pass,
            // we will just respect setTarget + deload logic.
            if (isDeload) {
                setTarget = max(1, (setTarget + 1) / 2) // roughly ceil(setTarget/2)
            }

            val lastSets = getLastLogForExercise(exDef.id, logs)

            val initialSets = if (slotDef.isAVT == true) {
                val roundId = uid()
                List((slotDef.avtRounds ?: 4).coerceIn(1, 20)) {
                    WorkoutSet(
                        id = uid(),
                        weight = "",
                        reps = slotDef.avtStartReps?.toString() ?: "6",
                        rpe = "",
                        completed = false,
                        type = SetType.AVT_HOP,
                        avtRoundId = roundId,
                        isLastHop = false
                    )
                }
            } else {
                List(setTarget) { i ->
                    val lastSet = lastSets?.getOrNull(i)
                    WorkoutSet(
                        id = uid(),
                        weight = "",
                        reps = "",
                        rpe = "",
                        completed = false,
                        type = slotDef.setType ?: SetType.REGULAR,
                        hintWeight = lastSet?.weight,
                        hintReps = lastSet?.reps,
                        prevWeight = lastSet?.weight,
                        prevReps = lastSet?.reps
                    )
                }
            }

            SessionExercise(
                id = exDef.id,
                name = exDef.name,
                muscle = exDef.muscle,
                instructions = exDef.instructions,
                defaultCardioType = exDef.defaultCardioType,
                videoId = exDef.videoId,
                isBodyweight = exDef.isBodyweight,
                volumeCountingMode = exDef.volumeCountingMode,
                isIsometric = exDef.isIsometric,
                isometricTargetSecs = exDef.isometricTargetSecs,
                skillFamily = exDef.skillFamily,
                skillLevel = exDef.skillLevel,
                progressionNext = exDef.progressionNext,
                progressionPrev = exDef.progressionPrev,
                defaultRestSeconds = exDef.defaultRestSeconds,
                source = exDef.source,

                instanceId = uid(),
                slotLabel = slotDef.muscle.name,
                targetReps = slotDef.reps,
                supersetId = slotDef.supersetId,
                sets = initialSets
            )
        }

        return ActiveSession(
            id = Clock.System.now().toEpochMilliseconds(),
            dayIdx = dayIdx,
            name = "${activeMeso.week} • $safeDayName",
            exercises = sessionExs,
            startTime = Clock.System.now().toEpochMilliseconds(),
            mesoId = activeMeso.id,
            week = activeMeso.week
        )
    }
}
