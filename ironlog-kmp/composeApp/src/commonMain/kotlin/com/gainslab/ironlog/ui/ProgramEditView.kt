package com.gainslab.ironlog.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
fun ProgramEditView(appStore: AppStore, onBack: () -> Unit) {
    val appState by appStore.state.collectAsState()
    val exercises = appState.exercises
    val starterDay = ProgramDay(
        id = "day_${Clock.System.now().toEpochMilliseconds()}",
        dayName = LocalizedText("Day 1", "Día 1"),
        slots = listOf(ProgramSlot(MuscleGroup.CHEST, 3, "8-12", setType = SetType.REGULAR))
    )
    var programDays by remember(appState.program) { mutableStateOf(appState.program.ifEmpty { listOf(starterDay) }) }
    var mesoName by remember { mutableStateOf("Mesociclo Personalizado") }
    var mesoType by remember { mutableStateOf("hyp_1") }
    var targetWeeks by remember { mutableStateOf(4) }
    var showTypePicker by remember { mutableStateOf(false) }
    var showStartConfirmation by remember { mutableStateOf(false) }
    var dayToDelete by remember { mutableStateOf<Int?>(null) }
    var pickingForSlot by remember { mutableStateOf<Pair<Int, Int>?>(null) }
    var supersetSource by remember { mutableStateOf<Pair<Int, Int>?>(null) }

    fun updateSlot(dayIndex: Int, slotIndex: Int, transform: (ProgramSlot) -> ProgramSlot) {
        val days = programDays.toMutableList()
        val slots = days[dayIndex].slots.toMutableList()
        slots[slotIndex] = transform(slots[slotIndex])
        days[dayIndex] = days[dayIndex].copy(slots = slots)
        programDays = days
    }

    fun toggleSuperset(dayIndex: Int, slotIndex: Int) {
        val current = programDays[dayIndex].slots[slotIndex]
        if (current.supersetId != null) {
            updateSlot(dayIndex, slotIndex) { it.copy(supersetId = null) }
            return
        }
        val source = supersetSource
        if (source == null || source == dayIndex to slotIndex) {
            supersetSource = dayIndex to slotIndex
            return
        }
        val groupId = "ss_${System.currentTimeMillis()}"
        updateSlot(source.first, source.second) { it.copy(supersetId = groupId) }
        updateSlot(dayIndex, slotIndex) { it.copy(supersetId = groupId) }
        supersetSource = null
    }

    Column(Modifier.fillMaxSize().background(OLED_Black)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "Volver", tint = Text_White) }
            Text("Programa y mesociclo", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Text_White)
            Spacer(Modifier.weight(1f))
            Button(
                onClick = { showStartConfirmation = true },
                enabled = programDays.isNotEmpty(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) { Text("Iniciar", color = Color.Black, fontWeight = FontWeight.Bold) }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
            contentPadding = PaddingValues(bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text("CONFIGURACIÓN DEL MESOCICLO", color = Text_Muted, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = mesoName, onValueChange = { mesoName = it }, modifier = Modifier.fillMaxWidth(),
                    label = { Text("Nombre") },
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White, focusedBorderColor = MaterialTheme.colorScheme.primary, unfocusedBorderColor = Dark_SurfaceVariant)
                )
                Spacer(Modifier.height(10.dp))
                ExposedDropdownMenuBox(expanded = showTypePicker, onExpandedChange = { showTypePicker = it }) {
                    OutlinedTextField(
                        value = when (mesoType) { "hyp_1" -> "Hipertrofia"; "strength" -> "Fuerza"; else -> "Personalizado" },
                        onValueChange = {}, readOnly = true, modifier = Modifier.fillMaxWidth().menuAnchor(), label = { Text("Tipo") },
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White, focusedBorderColor = MaterialTheme.colorScheme.primary, unfocusedBorderColor = Dark_SurfaceVariant)
                    )
                    ExposedDropdownMenu(expanded = showTypePicker, onDismissRequest = { showTypePicker = false }) {
                        listOf("hyp_1" to "Hipertrofia", "strength" to "Fuerza", "custom" to "Personalizado").forEach { (value, label) ->
                            DropdownMenuItem(text = { Text(label) }, onClick = { mesoType = value; showTypePicker = false })
                        }
                    }
                }
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Duración", color = Text_White, modifier = Modifier.weight(1f))
                    TextButton(onClick = { targetWeeks = (targetWeeks - 1).coerceAtLeast(1) }) { Text("−", fontSize = 22.sp) }
                    Text("$targetWeeks semanas", color = Text_White, fontWeight = FontWeight.Bold)
                    TextButton(onClick = { targetWeeks++ }) { Text("+", fontSize = 22.sp) }
                }
            }

            itemsIndexed(programDays) { dayIndex, day ->
                Card(colors = CardDefaults.cardColors(containerColor = Dark_Surface), border = BorderStroke(1.dp, Color.White.copy(alpha = .07f))) {
                    Column(Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            OutlinedTextField(
                                value = day.dayName.es,
                                onValueChange = { name -> programDays = programDays.mapIndexed { i, current -> if (i == dayIndex) current.copy(dayName = LocalizedText(name, name)) else current } },
                                modifier = Modifier.weight(1f), singleLine = true, label = { Text("Nombre del día") },
                                colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White, focusedBorderColor = MaterialTheme.colorScheme.primary, unfocusedBorderColor = Dark_SurfaceVariant)
                            )
                            IconButton(onClick = { dayToDelete = dayIndex }) { Icon(Icons.Default.Delete, "Eliminar día", tint = Color(0xFFF87171)) }
                        }
                        day.slots.forEachIndexed { slotIndex, slot ->
                            Spacer(Modifier.height(10.dp))
                            SlotEditor(slot, exercises, isSupersetSource = supersetSource == dayIndex to slotIndex, onChange = { updateSlot(dayIndex, slotIndex) { it.copy(muscle = slot.muscle, setTarget = slot.setTarget, reps = slot.reps, setType = slot.setType) } }, onUpdate = { transform -> updateSlot(dayIndex, slotIndex, transform) }, onPickExercise = { pickingForSlot = dayIndex to slotIndex }, onToggleSuperset = { toggleSuperset(dayIndex, slotIndex) }, onDelete = {
                                val days = programDays.toMutableList(); days[dayIndex] = day.copy(slots = day.slots.filterIndexed { i, _ -> i != slotIndex }); programDays = days
                            })
                        }
                        TextButton(onClick = {
                            val days = programDays.toMutableList(); days[dayIndex] = day.copy(slots = day.slots + ProgramSlot(MuscleGroup.CHEST, 3, "8-12", setType = SetType.REGULAR)); programDays = days
                        }, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.Add, null); Spacer(Modifier.width(6.dp)); Text("Añadir ejercicio", color = MaterialTheme.colorScheme.primary) }
                    }
                }
            }
            item {
                OutlinedButton(onClick = {
                    programDays = programDays + ProgramDay("day_${Clock.System.now().toEpochMilliseconds()}", LocalizedText("New Day", "Nuevo Día"))
                }, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.Add, null); Spacer(Modifier.width(6.dp)); Text("Añadir día") }
            }
        }
    }

    if (showStartConfirmation) {
        AlertDialog(
            onDismissRequest = { showStartConfirmation = false }, containerColor = Dark_Surface,
            title = { Text("Iniciar mesociclo", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Text("Se guardará el programa y se iniciará la semana 1.", color = Text_Muted) },
            confirmButton = { Button(onClick = {
                appStore.setProgram(programDays)
                appStore.setActiveMeso(MesoCycle(
                    id = Clock.System.now().toEpochMilliseconds(),
                    name = mesoName.ifBlank { "Mesociclo" },
                    mesoType = mesoType,
                    week = 1,
                    plan = programDays.map { day -> day.slots.map { it.exerciseId } },
                    targetWeeks = targetWeeks,
                    duration = 5
                ))
                showStartConfirmation = false
                onBack()
            }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Iniciar", color = Color.Black) } },
            dismissButton = { TextButton(onClick = { showStartConfirmation = false }) { Text("Cancelar", color = Text_Muted) } }
        )
    }

    dayToDelete?.let { index ->
        AlertDialog(
            onDismissRequest = { dayToDelete = null }, containerColor = Dark_Surface,
            title = { Text("Eliminar día", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Text("Se perderán los ejercicios configurados en este día.", color = Text_Muted) },
            confirmButton = { Button(onClick = { programDays = programDays.filterIndexed { i, _ -> i != index }; dayToDelete = null }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFB91C1C))) { Text("Eliminar") } },
            dismissButton = { TextButton(onClick = { dayToDelete = null }) { Text("Cancelar", color = Text_Muted) } }
        )
    }

    pickingForSlot?.let { (dayIndex, slotIndex) ->
        var query by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { pickingForSlot = null }, containerColor = Dark_Surface,
            title = { Text("Elegir ejercicio", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Column {
                OutlinedTextField(value = query, onValueChange = { query = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Buscar") }, colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                Spacer(Modifier.height(8.dp))
                LazyColumn(Modifier.heightIn(max = 290.dp)) {
                    items(exercises.filter { it.name.es.contains(query, true) }.take(80)) { exercise ->
                        TextButton(onClick = { updateSlot(dayIndex, slotIndex) { it.copy(exerciseId = exercise.id, muscle = exercise.muscle) }; pickingForSlot = null }, modifier = Modifier.fillMaxWidth()) {
                            Text("${exercise.name.es} · ${exercise.muscle.name}", color = Text_White)
                        }
                    }
                }
            } },
            confirmButton = { TextButton(onClick = { pickingForSlot = null }) { Text("Cerrar", color = Text_Muted) } }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SlotEditor(slot: ProgramSlot, exercises: List<ExerciseDef>, isSupersetSource: Boolean, onChange: () -> Unit, onUpdate: ((ProgramSlot) -> ProgramSlot) -> Unit, onPickExercise: () -> Unit, onToggleSuperset: () -> Unit, onDelete: () -> Unit) {
    var muscleExpanded by remember { mutableStateOf(false) }
    var typeExpanded by remember { mutableStateOf(false) }
    Card(colors = CardDefaults.cardColors(containerColor = Dark_SurfaceVariant.copy(alpha = .45f))) {
        Column(Modifier.padding(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                ExposedDropdownMenuBox(expanded = muscleExpanded, onExpandedChange = { muscleExpanded = it }, modifier = Modifier.weight(1f)) {
                    OutlinedTextField(value = slot.muscle.name, onValueChange = {}, readOnly = true, modifier = Modifier.menuAnchor(), label = { Text("Músculo") }, textStyle = LocalTextStyle.current.copy(fontSize = 12.sp), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                    ExposedDropdownMenu(expanded = muscleExpanded, onDismissRequest = { muscleExpanded = false }) { MuscleGroup.values().forEach { muscle -> DropdownMenuItem(text = { Text(muscle.name) }, onClick = { onUpdate { it.copy(muscle = muscle) }; muscleExpanded = false }) } }
                }
                Spacer(Modifier.width(8.dp))
                OutlinedTextField(value = slot.setTarget.toString(), onValueChange = { value -> value.toIntOrNull()?.let { sets -> onUpdate { it.copy(setTarget = sets.coerceIn(1, 30)) } } }, modifier = Modifier.width(78.dp), label = { Text("Series") }, textStyle = LocalTextStyle.current.copy(color = Text_White), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                IconButton(onClick = onDelete) { Icon(Icons.Default.Delete, "Quitar ejercicio", tint = Text_Muted) }
            }
            Spacer(Modifier.height(8.dp))
            Row {
                OutlinedTextField(value = slot.reps.orEmpty(), onValueChange = { value -> onUpdate { it.copy(reps = value) } }, modifier = Modifier.weight(1f), label = { Text("Repeticiones") }, textStyle = LocalTextStyle.current.copy(color = Text_White), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                Spacer(Modifier.width(8.dp))
                ExposedDropdownMenuBox(expanded = typeExpanded, onExpandedChange = { typeExpanded = it }, modifier = Modifier.weight(1f)) {
                    OutlinedTextField(value = (slot.setType ?: SetType.REGULAR).name, onValueChange = {}, readOnly = true, modifier = Modifier.menuAnchor(), label = { Text("Tipo") }, textStyle = LocalTextStyle.current.copy(fontSize = 12.sp), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                    ExposedDropdownMenu(expanded = typeExpanded, onDismissRequest = { typeExpanded = false }) { SetType.values().forEach { type -> DropdownMenuItem(text = { Text(type.name) }, onClick = { onUpdate { it.copy(setType = type) }; typeExpanded = false }) } }
                }
            }
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                Checkbox(
                    checked = slot.isAVT == true,
                    onCheckedChange = { enabled ->
                        onUpdate {
                            it.copy(
                                isAVT = enabled,
                                setType = if (enabled) SetType.AVT_HOP else it.setType,
                                avtRounds = if (enabled) it.avtRounds ?: 4 else null,
                                avtStartReps = if (enabled) it.avtStartReps ?: 6 else null
                            )
                        }
                    },
                    colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)
                )
                Text("AVT / hops", color = Text_White, fontSize = 12.sp)
                if (slot.isAVT == true) {
                    Spacer(Modifier.width(8.dp))
                    OutlinedTextField(
                        value = (slot.avtRounds ?: 4).toString(),
                        onValueChange = { value -> value.toIntOrNull()?.let { rounds -> onUpdate { it.copy(avtRounds = rounds.coerceIn(1, 20)) } } },
                        modifier = Modifier.width(78.dp), label = { Text("Hops") }, singleLine = true,
                        textStyle = LocalTextStyle.current.copy(color = Text_White, fontSize = 12.sp),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White)
                    )
                    Spacer(Modifier.width(6.dp))
                    OutlinedTextField(
                        value = (slot.avtStartReps ?: 6).toString(),
                        onValueChange = { value -> value.toIntOrNull()?.let { reps -> onUpdate { it.copy(avtStartReps = reps.coerceIn(1, 50)) } } },
                        modifier = Modifier.width(78.dp), label = { Text("Reps") }, singleLine = true,
                        textStyle = LocalTextStyle.current.copy(color = Text_White, fontSize = 12.sp),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White)
                    )
                }
            }
            TextButton(onClick = onPickExercise, modifier = Modifier.fillMaxWidth()) {
                val selected = exercises.find { it.id == slot.exerciseId }
                Text(selected?.name?.es ?: "Elegir ejercicio específico", color = if (selected == null) Text_Muted else MaterialTheme.colorScheme.primary)
            }
            TextButton(onClick = onToggleSuperset, modifier = Modifier.fillMaxWidth()) {
                Text(
                    when {
                        slot.supersetId != null -> "Quitar superserie"
                        isSupersetSource -> "Elegí el segundo ejercicio"
                        else -> "Vincular superserie"
                    },
                    color = if (slot.supersetId != null || isSupersetSource) MaterialTheme.colorScheme.primary else Text_Muted,
                    fontSize = 12.sp
                )
            }
        }
    }
}
