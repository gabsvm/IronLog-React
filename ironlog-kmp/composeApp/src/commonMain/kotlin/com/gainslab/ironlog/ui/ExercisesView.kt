package com.gainslab.ironlog.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.model.ExerciseDef
import com.gainslab.ironlog.model.LocalizedText
import com.gainslab.ironlog.model.MuscleGroup
import com.gainslab.ironlog.model.VolumeCountingMode
import com.gainslab.ironlog.store.AppStore
import com.gainslab.ironlog.theme.*
import kotlinx.datetime.Clock

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExercisesView(
    appStore: AppStore,
    onBack: () -> Unit
) {
    val appState by appStore.state.collectAsState()
    val exercises = appState.exercises
    var mode by remember { mutableStateOf("list") } // "list" or "create"
    
    // Create state
    var newName by remember { mutableStateOf("") }
    var newMuscle by remember { mutableStateOf(MuscleGroup.CHEST) }
    var newVolumeCountingMode by remember { mutableStateOf(VolumeCountingMode.TOTAL) }

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
            IconButton(onClick = { 
                if (mode == "create") mode = "list" else onBack() 
            }) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Volver", tint = Text_White)
            }
            Text(
                text = if (mode == "create") "Nuevo Ejercicio" else "Ejercicios", 
                fontSize = 20.sp, 
                fontWeight = FontWeight.Bold, 
                color = Text_White
            )
        }

        if (mode == "list") {
            Box(modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(bottom = 100.dp)
                ) {
                    val sortedExercises = exercises.sortedBy { it.name.es }
                    items(sortedExercises) { ex ->
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(text = ex.name.es, color = Text_White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(Color.White.copy(alpha = 0.1f))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    ) {
                                        Text(text = ex.muscle.name, color = Text_Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                    if (ex.volumeCountingMode == VolumeCountingMode.PER_SIDE) {
                                        Text("×2 por lado", color = MaterialTheme.colorScheme.primary, fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
                                    }
                                }
                                IconButton(onClick = {
                                    val newExercises = exercises.toMutableList()
                                    newExercises.removeAll { it.id == ex.id }
                                    appStore.setExercises(newExercises)
                                }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Eliminar", tint = Text_Muted)
                                }
                            }
                        }
                    }
                }

                FloatingActionButton(
                    onClick = { mode = "create" },
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(24.dp),
                    containerColor = MaterialTheme.colorScheme.primary
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Crear Ejercicio", tint = Color.Black)
                }
            }
        } else {
            // Create Mode
            Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                OutlinedTextField(
                    value = newName,
                    onValueChange = { newName = it },
                    label = { Text("Nombre del Ejercicio", color = Text_Muted) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Text_White,
                        unfocusedTextColor = Text_White,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = Dark_SurfaceVariant
                    )
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                Text("MÚSCULO PRINCIPAL", color = Text_Muted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                
                // Grid-like layout for muscles using FlowRow would be ideal, but Compose Multiplatform 1.6+ supports it.
                // Let's use simple nested rows/columns or a LazyVerticalGrid.
                // Since MuscleGroup has ~10 elements, we can chunk them.
                val muscles = MuscleGroup.values()
                val chunkedMuscles = muscles.toList().chunked(2)
                
                LazyColumn(modifier = Modifier.weight(1f)) {
                    items(chunkedMuscles) { rowMuscles ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            rowMuscles.forEach { m ->
                                val isSelected = newMuscle == m
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .padding(bottom = 8.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.1f) else Color.White.copy(alpha = 0.05f))
                                        .border(
                                            1.dp,
                                            if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.3f) else Color.White.copy(alpha = 0.05f),
                                            RoundedCornerShape(12.dp)
                                        )
                                        .clickable { newMuscle = m }
                                        .padding(16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = m.name,
                                        color = if (isSelected) MaterialTheme.colorScheme.primary else Text_Muted,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp
                                    )
                                }
                            }
                        }
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = newVolumeCountingMode == VolumeCountingMode.PER_SIDE,
                        onCheckedChange = { newVolumeCountingMode = if (it) VolumeCountingMode.PER_SIDE else VolumeCountingMode.TOTAL },
                        colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)
                    )
                    Column {
                        Text("Carga por lado", color = Text_White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text("El tonelaje contará peso × reps × 2.", color = Text_Muted, fontSize = 11.sp)
                    }
                }
                
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = { mode = "list" },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Dark_SurfaceVariant)
                    ) {
                        Text("Cancelar", color = Text_White)
                    }
                    Button(
                        onClick = {
                            if (newName.isNotBlank()) {
                                val newEx = ExerciseDef(
                                    id = "custom_${Clock.System.now().toEpochMilliseconds()}",
                                    name = LocalizedText(newName, newName),
                                    muscle = newMuscle,
                                    volumeCountingMode = newVolumeCountingMode
                                )
                                appStore.setExercises(exercises + newEx)
                                newName = ""
                                newVolumeCountingMode = VolumeCountingMode.TOTAL
                                mode = "list"
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = newName.isNotBlank(),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Guardar", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
