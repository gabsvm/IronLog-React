package com.gainslab.ironlog.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.model.*
import com.gainslab.ironlog.store.AppStore
import com.gainslab.ironlog.theme.*
import kotlinx.datetime.Clock

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProgramEditView(
    appStore: AppStore,
    onBack: () -> Unit
) {
    val appState by appStore.state.collectAsState()
    val exercises = appState.exercises
    var mesoName by remember { mutableStateOf("Mesociclo Personalizado") }
    var targetWeeks by remember { mutableStateOf(4) }
    
    var programDays by remember { mutableStateOf(
        listOf(
            ProgramDay(
                id = "day_${Clock.System.now().toEpochMilliseconds()}",
                dayName = LocalizedText("Day 1", "Día 1"),
                slots = listOf(ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, reps = "8-12", setType = SetType.REGULAR))
            )
        )
    )}

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(OLED_Black)
    ) {
        // Top Bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Volver", tint = Text_White)
            }
            Text(text = "Crear Mesociclo", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Text_White)
            Spacer(modifier = Modifier.weight(1f))
            Button(
                onClick = {
                    val plan = programDays.map { day -> 
                        day.slots.map { slot -> 
                            exercises.find { it.muscle == slot.muscle }?.id 
                        }
                    }
                    val meso = MesoCycle(
                        id = Clock.System.now().toEpochMilliseconds(),
                        name = mesoName,
                        mesoType = "custom",
                        week = 1,
                        targetWeeks = targetWeeks,
                        plan = plan,
                        duration = 5
                    )
                    appStore.setProgram(programDays)
                    appStore.setActiveMeso(meso)
                    onBack()
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Iniciar", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 100.dp)
        ) {
            // General Settings
            item {
                Text("Configuracin", color = Text_Muted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = mesoName,
                    onValueChange = { mesoName = it },
                    label = { Text("Nombre del Mesociclo", color = Text_Muted) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Text_White,
                        unfocusedTextColor = Text_White,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = Dark_SurfaceVariant
                    )
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Semanas:", color = Text_White, modifier = Modifier.weight(1f))
                    Button(onClick = { if (targetWeeks > 1) targetWeeks-- }) { Text("-") }
                    Text(text = targetWeeks.toString(), color = Text_White, modifier = Modifier.padding(horizontal = 16.dp))
                    Button(onClick = { targetWeeks++ }) { Text("+") }
                }
                Spacer(modifier = Modifier.height(24.dp))
            }

            // Days loop
            itemsIndexed(programDays) { dayIdx, day ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.05f))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = day.dayName.es,
                                onValueChange = { newName ->
                                    val newDays = programDays.toMutableList()
                                    newDays[dayIdx] = day.copy(dayName = LocalizedText(newName, newName))
                                    programDays = newDays
                                },
                                modifier = Modifier.weight(1f),
                                textStyle = LocalTextStyle.current.copy(color = Text_White, fontWeight = FontWeight.Bold),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color.Transparent,
                                    unfocusedBorderColor = Color.Transparent
                                )
                            )
                            IconButton(onClick = {
                                val newDays = programDays.toMutableList()
                                newDays.removeAt(dayIdx)
                                programDays = newDays
                            }) {
                                Icon(Icons.Default.Delete, contentDescription = "Eliminar Día", tint = Color.Red)
                            }
                        }
                        
                        day.slots.forEachIndexed { slotIdx, slot ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Simplified Slot UI
                                var expanded by remember { mutableStateOf(false) }
                                
                                ExposedDropdownMenuBox(
                                    expanded = expanded,
                                    onExpandedChange = { expanded = !expanded },
                                    modifier = Modifier.weight(2f)
                                ) {
                                    OutlinedTextField(
                                        value = slot.muscle.name,
                                        onValueChange = {},
                                        readOnly = true,
                                        modifier = Modifier.menuAnchor(),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedTextColor = MaterialTheme.colorScheme.primary,
                                            unfocusedTextColor = MaterialTheme.colorScheme.primary
                                        ),
                                        textStyle = LocalTextStyle.current.copy(fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    )
                                    ExposedDropdownMenu(
                                        expanded = expanded,
                                        onDismissRequest = { expanded = false }
                                    ) {
                                        MuscleGroup.values().forEach { muscle ->
                                            DropdownMenuItem(
                                                text = { Text(muscle.name) },
                                                onClick = {
                                                    val newDays = programDays.toMutableList()
                                                    val newSlots = day.slots.toMutableList()
                                                    newSlots[slotIdx] = slot.copy(muscle = muscle)
                                                    newDays[dayIdx] = day.copy(slots = newSlots)
                                                    programDays = newDays
                                                    expanded = false
                                                }
                                            )
                                        }
                                    }
                                }
                                
                                Spacer(modifier = Modifier.width(8.dp))
                                
                                OutlinedTextField(
                                    value = slot.setTarget.toString(),
                                    onValueChange = { newVal ->
                                        val sets = newVal.toIntOrNull()
                                        if (sets != null) {
                                            val newDays = programDays.toMutableList()
                                            val newSlots = day.slots.toMutableList()
                                            newSlots[slotIdx] = slot.copy(setTarget = sets)
                                            newDays[dayIdx] = day.copy(slots = newSlots)
                                            programDays = newDays
                                        }
                                    },
                                    modifier = Modifier.weight(1f),
                                    label = { Text("Sets", fontSize = 10.sp) },
                                    textStyle = LocalTextStyle.current.copy(fontSize = 14.sp, color = Text_White),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedTextColor = Text_White,
                                        unfocusedTextColor = Text_White
                                    )
                                )
                                
                                IconButton(onClick = {
                                    val newDays = programDays.toMutableList()
                                    val newSlots = day.slots.toMutableList()
                                    newSlots.removeAt(slotIdx)
                                    newDays[dayIdx] = day.copy(slots = newSlots)
                                    programDays = newDays
                                }) {
                                    Icon(Icons.Default.Delete, contentDescription = "Quitar Slot", tint = Text_Muted, modifier = Modifier.size(20.dp))
                                }
                            }
                        }

                        Button(
                            onClick = {
                                val newDays = programDays.toMutableList()
                                val newSlots = day.slots.toMutableList()
                                newSlots.add(ProgramSlot(muscle = MuscleGroup.CHEST, setTarget = 3, reps = "8-12", setType = SetType.REGULAR))
                                newDays[dayIdx] = day.copy(slots = newSlots)
                                programDays = newDays
                            },
                            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Dark_SurfaceVariant)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Add Slot", tint = Text_White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Añadir Ejercicio", color = Text_White)
                        }
                    }
                }
            }

            item {
                Button(
                    onClick = {
                        val newDays = programDays.toMutableList()
                        newDays.add(
                            ProgramDay(
                                id = "day_${Clock.System.now().toEpochMilliseconds()}",
                                dayName = LocalizedText("Nuevo Día", "Nuevo Día"),
                                slots = emptyList()
                            )
                        )
                        programDays = newDays
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Dark_SurfaceVariant)
                ) {
                    Text("Añadir Día", color = Text_White)
                }
            }
        }
    }
}

