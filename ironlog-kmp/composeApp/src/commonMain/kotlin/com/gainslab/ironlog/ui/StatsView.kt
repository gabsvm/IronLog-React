package com.gainslab.ironlog.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.gainslab.ironlog.store.AppStore
import com.gainslab.ironlog.theme.*

@Composable
fun StatsView(
    appStore: AppStore,
    onBack: () -> Unit
) {
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())
    val appState by appStore.state.collectAsState()
    val exercises = appState.exercises
    
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
