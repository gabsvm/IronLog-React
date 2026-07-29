package com.gainslab.ironlog.utils

import com.gainslab.ironlog.model.SessionExercise
import com.gainslab.ironlog.model.VolumeCountingMode
import com.gainslab.ironlog.model.WorkoutSet

/** Calculates external tonnage. A per-side load is performed twice. */
fun getSetLoadVolume(set: WorkoutSet, exercise: SessionExercise): Double {
    if (!set.completed || set.skipped == true) return 0.0
    val weight = set.weight.toDoubleOrNull() ?: return 0.0
    val reps = set.reps.toDoubleOrNull() ?: return 0.0
    val multiplier = if (exercise.volumeCountingMode == VolumeCountingMode.PER_SIDE) 2.0 else 1.0
    return weight * reps * multiplier
}
