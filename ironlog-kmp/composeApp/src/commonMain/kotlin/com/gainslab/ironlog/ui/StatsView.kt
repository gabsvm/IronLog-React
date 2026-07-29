package com.gainslab.ironlog.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.model.MuscleGroup
import com.gainslab.ironlog.model.SetType
import com.gainslab.ironlog.store.AppStore
import com.gainslab.ironlog.utils.getSetLoadVolume
import com.gainslab.ironlog.theme.*

@Composable
fun StatsView(
    appStore: AppStore,
    onBack: () -> Unit
) {
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())
    val cardioSessions by appStore.cardioSessions.collectAsState(initial = emptyList())
    val appState by appStore.state.collectAsState()
    val exercises = appState.exercises
    var selectedExerciseId by remember { mutableStateOf<String?>(null) }
    
    val volumeData = remember(workoutLogs, exercises) {
        val counts = mutableMapOf<MuscleGroup, Int>()
        workoutLogs.forEach { log ->
            if (log.skipped != true) {
                log.exercises.forEach { exLog ->
                    val exDef = exercises.find { it.id == exLog.id }
                    if (exDef != null) {
                        val completedSets = exLog.sets.count { it.completed }
                        counts[exDef.muscle] = (counts[exDef.muscle] ?: 0) + completedSets
                    }
                }
            }
        }
        counts.entries.sortedByDescending { it.value }.take(10)
    }

    // Calculate Personal Records (Max weight per exercise)
    val prData = remember(workoutLogs, exercises) {
        val maxWeights = mutableMapOf<String, Double>()
        workoutLogs.forEach { log ->
            if (log.skipped != true) {
                log.exercises.forEach { exLog ->
                    val maxWeight = exLog.sets.filter { it.completed }.maxOfOrNull { it.weight.toDoubleOrNull() ?: 0.0 } ?: 0.0
                    if (maxWeight > 0) {
                        val currentMax = maxWeights[exLog.id] ?: 0.0
                        if (maxWeight > currentMax) {
                            maxWeights[exLog.id] = maxWeight
                        }
                    }
                }
            }
        }
        maxWeights.mapNotNull { entry ->
            val ex = exercises.find { it.id == entry.key }
            if (ex != null) Pair(ex, entry.value) else null
        }.sortedByDescending { it.second }.take(5)
    }

    val exerciseOptions = remember(workoutLogs, exercises) {
        val loggedIds = workoutLogs.flatMap { log -> log.exercises.map { it.id } }.toSet()
        exercises.filter { it.id in loggedIds }.sortedBy { it.name.get("es") }
    }
    LaunchedEffect(exerciseOptions) {
        if (selectedExerciseId == null || exerciseOptions.none { it.id == selectedExerciseId }) {
            selectedExerciseId = exerciseOptions.firstOrNull()?.id
        }
    }
    val selectedExercise = exerciseOptions.firstOrNull { it.id == selectedExerciseId }
    val exerciseTrend = remember(workoutLogs, selectedExerciseId) {
        if (selectedExerciseId == null) emptyList() else workoutLogs
            .filter { it.skipped != true }
            .sortedBy { it.endTime }
            .mapNotNull { log ->
                val sessionExercise = log.exercises.firstOrNull { it.id == selectedExerciseId } ?: return@mapNotNull null
                val completed = sessionExercise.sets.filter { it.completed }
                if (completed.isEmpty()) return@mapNotNull null
                val volume = completed.sumOf { getSetLoadVolume(it, sessionExercise) }
                val estimated1Rm = completed.maxOfOrNull { set ->
                    val weight = set.weight.toDoubleOrNull() ?: 0.0
                    val reps = set.reps.toDoubleOrNull() ?: 0.0
                    weight * (1.0 + reps / 30.0)
                } ?: 0.0
                Triple(log, volume, estimated1Rm)
            }.takeLast(12)
    }
    val totalVolume = remember(workoutLogs) { workoutLogs.filter { it.skipped != true }.sumOf { log -> log.exercises.sumOf { exercise -> exercise.sets.sumOf { set -> getSetLoadVolume(set, exercise) } } } }
    val totalMinutes = remember(workoutLogs) { workoutLogs.filter { it.skipped != true }.sumOf { it.duration / 60 } }
    val setTypeDistribution = remember(workoutLogs) {
        workoutLogs.filter { it.skipped != true }.flatMap { it.exercises }.flatMap { it.sets }.filter { it.completed }
            .groupingBy { it.type }.eachCount().entries.sortedByDescending { it.value }
    }
    val cardioMinutes = remember(cardioSessions) { cardioSessions.sumOf { it.durationMin }.toInt() }
    val cardioDistance = remember(cardioSessions) { cardioSessions.sumOf { it.distanceKm ?: 0.0 } }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(OLED_Black)
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Volver", tint = Text_White)
            }
            Text(text = "Estadísticas", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Text_White)
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            item {
                Card(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp), colors = CardDefaults.cardColors(containerColor = Dark_Surface), shape = RoundedCornerShape(16.dp)) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("Resumen general", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(modifier = Modifier.height(14.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            OverviewMetric("Sesiones", "${workoutLogs.count { it.skipped != true }}")
                            OverviewMetric("Volumen", "${totalVolume.toInt()} kg")
                            OverviewMetric("Tiempo", "${totalMinutes} min")
                        }
                    }
                }
            }
            if (exerciseOptions.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                        colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Text("Progreso por ejercicio", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("Elegí un ejercicio para revisar su volumen y 1RM estimado.", color = Text_Muted, fontSize = 12.sp)
                            Spacer(modifier = Modifier.height(10.dp))
                            exerciseOptions.take(8).forEach { exercise ->
                                val selected = exercise.id == selectedExerciseId
                                Row(
                                    modifier = Modifier.fillMaxWidth().clickable { selectedExerciseId = exercise.id }.padding(vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(exercise.name.get("es"), color = if (selected) MaterialTheme.colorScheme.primary else Text_White, fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium, fontSize = 13.sp)
                                    Text(exercise.muscle.name, color = Text_Muted, fontSize = 10.sp)
                                }
                            }
                            selectedExercise?.let { exercise ->
                                Spacer(modifier = Modifier.height(10.dp))
                                Text("${exercise.name.get("es")} · ultimas ${exerciseTrend.size} sesiones", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                exerciseTrend.asReversed().forEach { (log, volume, oneRm) ->
                                    Row(modifier = Modifier.fillMaxWidth().padding(top = 7.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Sem. ${log.week}", color = Text_Muted, fontSize = 12.sp)
                                        Text("${volume.toInt()} kg", color = Text_White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                        Text("1RM ${oneRm.toInt()} kg", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                                if (exerciseTrend.isNotEmpty()) {
                                    val maxVolume = exerciseTrend.maxOf { it.second }.coerceAtLeast(1.0)
                                    Spacer(modifier = Modifier.height(12.dp))
                                    Text("Volumen por sesion", color = Text_Muted, fontSize = 11.sp)
                                    Row(modifier = Modifier.fillMaxWidth().height(62.dp), horizontalArrangement = Arrangement.spacedBy(4.dp), verticalAlignment = Alignment.Bottom) {
                                        exerciseTrend.takeLast(10).forEach { (_, volume, _) ->
                                            Box(modifier = Modifier.weight(1f).fillMaxHeight(fraction = (volume / maxVolume).toFloat().coerceAtLeast(.06f)).clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)).background(MaterialTheme.colorScheme.primary))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("Tipos de serie", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(modifier = Modifier.height(12.dp))
                        if (setTypeDistribution.isEmpty()) Text("No hay series completadas aun.", color = Text_Muted, fontSize = 13.sp)
                        else {
                            val maxCount = setTypeDistribution.maxOf { it.value }.coerceAtLeast(1)
                            setTypeDistribution.take(6).forEach { (type, count) ->
                                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(type.name.replace('_', ' '), color = Text_Muted, fontSize = 11.sp, modifier = Modifier.weight(.4f))
                                    Box(modifier = Modifier.weight(.45f).height(7.dp).clip(RoundedCornerShape(4.dp)).background(Color.White.copy(alpha = .08f))) {
                                        Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(count.toFloat() / maxCount).background(MaterialTheme.colorScheme.primary))
                                    }
                                    Text("$count", color = Text_White, fontSize = 11.sp, modifier = Modifier.weight(.15f).padding(start = 8.dp))
                                }
                            }
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text("Cardio y capacidad", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            OverviewMetric("Sesiones", "${cardioSessions.size}")
                            OverviewMetric("Tiempo", "$cardioMinutes min")
                            OverviewMetric("Distancia", "${"%.1f".format(cardioDistance)} km")
                        }
                    }
                }
            }

            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("Volumen Muscular", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        val maxVol = volumeData.maxOfOrNull { it.value }?.coerceAtLeast(10) ?: 10
                        
                        if (volumeData.isEmpty()) {
                            Text("No hay datos de entrenamiento aún.", color = Text_Muted, fontSize = 14.sp)
                        } else {
                            volumeData.forEach { (muscle, count) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = muscle.name,
                                        color = Text_Muted,
                                        fontSize = 12.sp,
                                        modifier = Modifier.weight(0.3f)
                                    )
                                    
                                    Box(
                                        modifier = Modifier
                                            .weight(0.6f)
                                            .height(8.dp)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(Color.White.copy(alpha = 0.05f))
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .fillMaxHeight()
                                                .fillMaxWidth(fraction = count.toFloat() / maxVol)
                                                .background(
                                                    when {
                                                        count < 6 -> Color(0xFFEAB308) // MV
                                                        count < 12 -> Color(0xFF22C55E) // MEV
                                                        count <= 22 -> Color(0xFF3B82F6) // MAV
                                                        else -> Color(0xFFEF4444) // MRV
                                                    }
                                                )
                                        )
                                    }
                                    
                                    Text(
                                        text = "$count",
                                        color = Text_White,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.weight(0.1f).padding(start = 8.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
            
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("Récords Personales (PRs)", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        if (prData.isEmpty()) {
                            Text("No hay PRs registrados aún.", color = Text_Muted, fontSize = 14.sp)
                        } else {
                            prData.forEach { (exercise, weight) ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(exercise.name.get("es"), color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                                        Text(exercise.muscle.name, color = MaterialTheme.colorScheme.primary, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                    
                                    Text(
                                        text = "${weight} kg",
                                        color = Color.White,
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.Black
                                    )
                                }
                                Divider(color = Color.White.copy(alpha = 0.05f))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OverviewMetric(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = Text_White, fontWeight = FontWeight.Black, fontSize = 15.sp)
        Text(label, color = Text_Muted, fontSize = 10.sp)
    }
}
