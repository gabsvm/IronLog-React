package com.gainslab.ironlog

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.model.*
import com.gainslab.ironlog.store.*
import com.gainslab.ironlog.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

private data class AppTabItem(
    val label: String,
    val icon: ImageVector
)

@Composable
fun App() {
    val appStore: AppStore = remember {
        org.koin.core.context.GlobalContext.get().get()
    }
    val state by appStore.state.collectAsState()
    
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())
    val nutritionLogs by appStore.nutritionLogs.collectAsState(initial = emptyList())

    var selectedTab by remember { mutableStateOf(0) }
    var restTimerSeconds by remember { mutableStateOf(0) }
    var restTimerActive by remember { mutableStateOf(false) }
    var showProgramEditor by remember { mutableStateOf(false) }
    var showExercises by remember { mutableStateOf(false) }
    var showStats by remember { mutableStateOf(false) }
    var showCommandPalette by remember { mutableStateOf(false) }
    val tabs = remember {
        listOf(
            AppTabItem("Entrenar", Icons.Default.PlayArrow),
            AppTabItem("Historial", Icons.Default.DateRange),
            AppTabItem("Nutricion", Icons.Default.Favorite),
            AppTabItem("Ajustes", Icons.Default.Settings)
        )
    }
    
    LaunchedEffect(restTimerActive, restTimerSeconds) {
        if (restTimerActive && restTimerSeconds > 0) {
            kotlinx.coroutines.delay(1000)
            restTimerSeconds -= 1
            if (restTimerSeconds == 0) {
                restTimerActive = false
            }
        }
    }
    
    IronLogTheme(theme = state.colorTheme) {
        if (!state.hasSeenOnboarding) {
            com.gainslab.ironlog.ui.SetupWizardView(
                appStore = appStore,
                onComplete = {
                    appStore.setHasSeenOnboarding(true)
                }
            )
        } else if (showProgramEditor) {
            com.gainslab.ironlog.ui.ProgramEditView(
                appStore = appStore,
                onBack = { showProgramEditor = false }
            )
        } else if (showExercises) {
            com.gainslab.ironlog.ui.ExercisesView(
                appStore = appStore,
                onBack = { showExercises = false }
            )
        } else if (showStats) {
            com.gainslab.ironlog.ui.StatsView(
                appStore = appStore,
                onBack = { showStats = false }
            )
        } else {
            Scaffold(
                modifier = Modifier.fillMaxSize(),
                containerColor = OLED_Black,
                contentWindowInsets = WindowInsets(0.dp),
                bottomBar = {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .navigationBarsPadding()
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .background(Color(0xF20A0A0A))
                            .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(28.dp))
                            .padding(horizontal = 10.dp, vertical = 8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            NavButton(icon = Icons.Default.PlayArrow, label = "Entrenar", selected = selectedTab == 0) { selectedTab = 0 }
                            NavButton(icon = Icons.Default.Favorite, label = "Nutrición", selected = selectedTab == 1) { selectedTab = 1 }
                            NavButton(icon = Icons.Default.DateRange, label = "Historial", selected = selectedTab == 2) { selectedTab = 2 }
                            NavButton(icon = Icons.Default.Settings, label = "Ajustes", selected = selectedTab == 3) { selectedTab = 3 }
                        }
                    }
                }
            ) { paddingValues ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(OLED_Black)
                        .padding(paddingValues)
                ) {
                    AppBackdrop()
                    if (state.isStoreLoading) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        }
                    } else {
                        when (selectedTab) {
                            0 -> WorkoutTab(
                                state = state,
                                appStore = appStore,
                                onStartTimer = { seconds ->
                                    restTimerSeconds = seconds
                                    restTimerActive = true
                                },
                                onStartProgramEditor = { showProgramEditor = true },
                                onShowCommandPalette = { showCommandPalette = true }
                            )
                            1 -> PremiumNutritionTab(nutritionLogs = nutritionLogs, appStore = appStore)
                            2 -> PremiumHistoryTab(workoutLogs = workoutLogs)
                            3 -> PremiumSettingsTab(
                                state = state, 
                                appStore = appStore, 
                                onStartProgramEditor = { showProgramEditor = true }, 
                                onManageExercises = { showExercises = true },
                                onViewStats = { showStats = true }
                            )
                        }
                    }

                    AnimatedVisibility(
                        visible = restTimerActive && restTimerSeconds > 0,
                        enter = fadeIn(),
                        exit = fadeOut(),
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(top = 20.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(24.dp))
                                .background(
                                    Brush.horizontalGradient(
                                        listOf(
                                            MaterialTheme.colorScheme.primary,
                                            MaterialTheme.colorScheme.primary.copy(alpha = 0.82f)
                                        )
                                    )
                                )
                                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                                .padding(horizontal = 24.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                text = "DESCANSO",
                                color = Color.Black,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                letterSpacing = 1.sp
                            )
                            Text(
                                text = formatTime(restTimerSeconds),
                                color = Color.Black,
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp
                            )
                        }
                    }
                    
                    if (showCommandPalette) {
                        com.gainslab.ironlog.ui.CommandPaletteView(
                            onDismiss = { showCommandPalette = false },
                            onStartWorkout = { 
                                showCommandPalette = false
                                selectedTab = 0
                                appStore.setActiveSession(
                                    com.gainslab.ironlog.model.ActiveSession(
                                        id = kotlinx.datetime.Clock.System.now().toEpochMilliseconds(),
                                        dayIdx = -1,
                                        name = "Entrenamiento Libre",
                                        exercises = emptyList(),
                                        startTime = kotlinx.datetime.Clock.System.now().toEpochMilliseconds(),
                                        mesoId = -1,
                                        week = -1
                                    )
                                )
                            },
                            onCreateProgram = { showCommandPalette = false; selectedTab = 0; showProgramEditor = true }
                        )
                    }

                    if (!showCommandPalette && state.activeSession == null) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .navigationBarsPadding()
                                .padding(bottom = 84.dp)
                                .size(58.dp)
                                .clip(CircleShape)
                                .background(MaterialTheme.colorScheme.primary)
                                .clickable { showCommandPalette = true },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(Icons.Default.Add, contentDescription = "Abrir acciones", tint = Color.Black, modifier = Modifier.size(28.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NavButton(icon: ImageVector, label: String, selected: Boolean, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(18.dp))
            .clickable { onClick() }
            .padding(horizontal = 10.dp, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            tint = if (selected) MaterialTheme.colorScheme.primary else Text_Muted,
            modifier = Modifier.size(20.dp)
        )
        Text(
            text = label,
            color = if (selected) MaterialTheme.colorScheme.primary else Text_Muted,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
        Box(
            modifier = Modifier
                .width(18.dp)
                .height(3.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(if (selected) MaterialTheme.colorScheme.primary else Color.Transparent)
        )
    }
}

@Composable
private fun AppBackdrop() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        OLED_Black,
                        Color(0xFF06080D),
                        OLED_Black
                    )
                )
            )
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 24.dp)
                .size(320.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f))
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomStart)
                .offset(x = (-80).dp, y = 80.dp)
                .size(220.dp)
                .clip(CircleShape)
                .background(Color(0xFF122135))
        )
    }
}

@Composable
private fun SurfaceCard(
    modifier: Modifier = Modifier,
    contentPadding: PaddingValues = PaddingValues(20.dp),
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = Dark_Surface.copy(alpha = 0.94f)),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
        shape = RoundedCornerShape(24.dp)
    ) {
        Column(modifier = Modifier.padding(contentPadding), content = content)
    }
}

@Composable
private fun AccentChip(text: String, selected: Boolean = false) {
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(
                if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.14f)
                else Color.White.copy(alpha = 0.06f)
            )
            .border(
                1.dp,
                if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.08f),
                RoundedCornerShape(999.dp)
            )
            .padding(horizontal = 10.dp, vertical = 6.dp)
    ) {
        Text(
            text = text,
            color = if (selected) MaterialTheme.colorScheme.primary else Text_Muted,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun WorkoutTab(
    state: AppState,
    appStore: AppStore,
    onStartTimer: (Int) -> Unit,
    onStartProgramEditor: () -> Unit,
    onShowCommandPalette: () -> Unit
) {
    if (state.activeSession != null) {
        PremiumActiveSessionView(session = state.activeSession, appStore = appStore, onStartTimer = onStartTimer)
    } else if (state.activeMeso != null) {
        PremiumActiveMesoView(state = state, appStore = appStore, onShowCommandPalette = onShowCommandPalette)
    } else {
        NoMesoView(
            appStore = appStore, 
            exercises = state.exercises, 
            onStartProgramEditor = onStartProgramEditor,
            onShowCommandPalette = onShowCommandPalette
        )
    }
}

@Composable
fun HomeView(state: AppState, appStore: AppStore, onStartProgramEditor: () -> Unit, onShowCommandPalette: () -> Unit) {
    if (state.activeMeso == null) {
        NoMesoView(appStore = appStore, exercises = state.exercises, onStartProgramEditor = onStartProgramEditor, onShowCommandPalette = onShowCommandPalette)
    } else {
        PremiumActiveMesoView(state = state, appStore = appStore, onShowCommandPalette = onShowCommandPalette)
    }
}

@Composable
fun NoMesoView(appStore: AppStore, exercises: List<ExerciseDef>, onStartProgramEditor: () -> Unit, onShowCommandPalette: () -> Unit) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp)
    ) {
        item {
            SurfaceCard(contentPadding = PaddingValues(horizontal = 22.dp, vertical = 24.dp)) {
                Text(
                    text = "IRONLOG",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary,
                    letterSpacing = 2.sp
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "Comienza tu siguiente bloque",
                    fontSize = 30.sp,
                    lineHeight = 32.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Crea un mesociclo, inicia una sesion libre o usa acciones rapidas para empujar la experiencia nativa hacia la PWA.",
                    fontSize = 14.sp,
                    color = Text_Muted
                )
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccentChip("${exercises.size} ejercicios")
                    AccentChip("Modo premium", selected = true)
                }
            }
        }

        item {
            RoutineCard(
                title = "Crear Mesociclo Personalizado",
                subtitle = "Replica el flujo principal con una base visual mas cuidada",
                onClick = onStartProgramEditor
            )
            
            
            Button(
                onClick = onShowCommandPalette,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Dark_Surface)
            ) {
                Text("Acciones Rápidas", color = Text_White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ActiveMesoView(state: AppState, appStore: AppStore, onShowCommandPalette: () -> Unit) {
    val meso = state.activeMeso ?: return
    var selectedDayIdx by remember { mutableStateOf(0) }
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp)
    ) {
        item {
            SurfaceCard {
                Text(
                    text = meso.name ?: "Mesociclo",
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccentChip("Semana ${meso.week}", selected = true)
                    AccentChip("Objetivo ${meso.targetWeeks ?: "?"}")
                }
            }
        }

        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                state.program.forEachIndexed { idx, day ->
                    val isSelected = selectedDayIdx == idx
                    Box(
                        modifier = Modifier
                            .width(88.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Dark_Surface)
                            .border(1.dp, if (isSelected) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                            .clickable { selectedDayIdx = idx }
                            .padding(horizontal = 12.dp, vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "DÍA ${idx + 1}",
                            color = if (isSelected) MaterialTheme.colorScheme.primary else Text_Muted,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }

        item {
            val dayDef = state.program.getOrNull(selectedDayIdx)
            if (dayDef != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = dayDef.dayName.get("es"),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            dayDef.slots.take(3).forEach { slot ->
                                Box(modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(Color.White.copy(alpha = 0.1f))
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(text = slot.muscle.name, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(24.dp))
                        
                        Button(
                            onClick = {
                                val session = SessionBuilder.buildFromProgramDay(
                                    dayIdx = selectedDayIdx,
                                    programDay = dayDef,
                                    activeMeso = meso,
                                    exercises = state.exercises,
                                    logs = workoutLogs,
                                    lang = "es",
                                    rpFeedback = emptyMap(),
                                    rpEnabled = false
                                )
                                if (session != null) {
                                    appStore.setActiveSession(session)
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                                Text("INICIAR SESIÓN", color = Color.Black, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
        
        item {
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = onShowCommandPalette,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Dark_Surface)
            ) {
                Text("Acciones Rápidas", color = Text_White, fontWeight = FontWeight.Bold)
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    appStore.setActiveMeso(null)
                    appStore.setProgram(emptyList())
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                border = BorderStroke(1.dp, Color.Red.copy(alpha = 0.5f))
            ) {
                Text("TERMINAR MESOCICLO", color = Color.Red)
            }
        }
    }
}

@Composable
fun RoutineCard(title: String, subtitle: String, onClick: () -> Unit) {
    SurfaceCard(
        modifier = Modifier.clickable { onClick() },
        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 18.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text(text = subtitle, fontSize = 13.sp, color = Text_Muted, modifier = Modifier.padding(top = 6.dp))
                Spacer(modifier = Modifier.height(18.dp))
                Text(
                    text = "ABRIR CONSTRUCTOR",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    letterSpacing = 1.sp
                )
            }
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f))
                    .border(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f), RoundedCornerShape(16.dp)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
        }
    }
}

@Composable
fun PremiumActiveMesoView(state: AppState, appStore: AppStore, onShowCommandPalette: () -> Unit) {
    val meso = state.activeMeso ?: return
    var selectedDayIdx by remember { mutableStateOf(0) }
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())
    val dayDef = state.program.getOrNull(selectedDayIdx)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp)
    ) {
        item {
            SurfaceCard {
                Text(
                    text = meso.name ?: "Mesociclo",
                    fontSize = 30.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccentChip("Semana ${meso.week}", selected = true)
                    AccentChip("Objetivo ${meso.targetWeeks ?: "?"}")
                }
            }
        }

        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                state.program.forEachIndexed { idx, day ->
                    val isSelected = selectedDayIdx == idx
                    Box(
                        modifier = Modifier
                            .width(92.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Dark_Surface)
                            .border(
                                1.dp,
                                if (isSelected) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.1f),
                                RoundedCornerShape(14.dp)
                            )
                            .clickable { selectedDayIdx = idx }
                            .padding(horizontal = 12.dp, vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(
                                text = "DIA ${idx + 1}",
                                color = if (isSelected) MaterialTheme.colorScheme.primary else Text_Muted,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = day.dayName.get("es"),
                                color = Color.White,
                                fontWeight = FontWeight.Medium,
                                fontSize = 10.sp,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }
                    }
                }
            }
        }

        item {
            if (dayDef != null) {
                SurfaceCard {
                    Text(
                        text = dayDef.dayName.get("es"),
                        fontSize = 24.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "${dayDef.slots.size} bloques de trabajo listos para arrancar",
                        fontSize = 13.sp,
                        color = Text_Muted
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        dayDef.slots.take(5).forEach { slot ->
                            AccentChip(text = slot.muscle.name)
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = {
                            val session = SessionBuilder.buildFromProgramDay(
                                dayIdx = selectedDayIdx,
                                programDay = dayDef,
                                activeMeso = meso,
                                exercises = state.exercises,
                                logs = workoutLogs,
                                lang = "es",
                                rpFeedback = emptyMap(),
                                rpEnabled = false
                            )
                            if (session != null) {
                                appStore.setActiveSession(session)
                            }
                        },
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.Black)
                            Text("INICIAR SESION", color = Color.Black, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }

        item {
            SurfaceCard {
                Text("Controles del ciclo", color = Text_White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    "Acciones rapidas para seguir ajustando el bloque sin salir de la vista principal.",
                    color = Text_Muted,
                    fontSize = 13.sp
                )
                Spacer(modifier = Modifier.height(18.dp))

                Button(
                    onClick = onShowCommandPalette,
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Dark_SurfaceVariant)
                ) {
                    Text("Abrir acciones rapidas", color = Text_White, fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = {
                        appStore.setActiveMeso(null)
                        appStore.setProgram(emptyList())
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color.Red.copy(alpha = 0.45f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.Red)
                ) {
                    Text("Terminar mesociclo", fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun ActiveSessionView(
    session: ActiveSession,
    appStore: AppStore,
    onStartTimer: (Int) -> Unit
) {
    var exercisesList by remember(session) { mutableStateOf(session.exercises) }
    var showPlateCalculator by remember { mutableStateOf(false) }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(text = session.name, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text(text = "Semana ${session.week}", fontSize = 12.sp, color = Text_Muted)
                        Text(
                            text = "Calc. Discos", 
                            fontSize = 12.sp, 
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.clickable { showPlateCalculator = true }
                        )
                    }
                }
                
                Button(
                    onClick = {
                        val completedSession = Log(
                            id = session.id,
                            dayIdx = session.dayIdx,
                            name = session.name,
                            startTime = session.startTime ?: System.currentTimeMillis(),
                            endTime = System.currentTimeMillis(),
                            duration = (System.currentTimeMillis() - (session.startTime ?: System.currentTimeMillis())) / 1000,
                            mesoId = session.mesoId,
                            week = session.week,
                            exercises = exercisesList
                        )
                        appStore.saveWorkoutLog(completedSession)
                        appStore.setActiveSession(null)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Terminar", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }

        items(exercisesList, key = { it.instanceId }) { exercise ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = exercise.name.get("es"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = exercise.muscle.name,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                    )

                    // Sets Row Header
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("SERIE", fontSize = 11.sp, color = Text_Muted, modifier = Modifier.weight(1f))
                        Text("PESO (KG)", fontSize = 11.sp, color = Text_Muted, modifier = Modifier.weight(2f), textAlign = TextAlign.Center)
                        Text("REPS", fontSize = 11.sp, color = Text_Muted, modifier = Modifier.weight(2f), textAlign = TextAlign.Center)
                        Box(modifier = Modifier.weight(1.5f)) // Checkbox area
                    }

                    exercise.sets.forEach { set ->
                        var isChecked by remember { mutableStateOf(set.completed) }
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "${set.id}",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Text_Muted,
                                modifier = Modifier.weight(1f)
                            )
                            Text(
                                text = "${set.weight} kg",
                                fontSize = 14.sp,
                                color = Color.White,
                                modifier = Modifier.weight(2f),
                                textAlign = TextAlign.Center
                            )
                            Text(
                                text = "${set.reps}",
                                fontSize = 14.sp,
                                color = Color.White,
                                modifier = Modifier.weight(2f),
                                textAlign = TextAlign.Center
                            )
                            
                            Box(
                                modifier = Modifier.weight(1.5f),
                                contentAlignment = Alignment.CenterEnd
                            ) {
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { checked ->
                                        isChecked = checked
                                        // Update local list
                                        exercisesList = exercisesList.map { ex ->
                                            if (ex.instanceId == exercise.instanceId) {
                                                ex.copy(sets = ex.sets.map { s ->
                                                    if (s.id == set.id) s.copy(completed = checked) else s
                                                })
                                            } else ex
                                        }
                                        if (checked) {
                                            onStartTimer(90) // Start 90s rest timer
                                        }
                                    },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = MaterialTheme.colorScheme.primary,
                                        checkmarkColor = Color.Black
                                    )
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    
    if (showPlateCalculator) {
        com.gainslab.ironlog.ui.PlateCalculatorView(
            onDismiss = { showPlateCalculator = false }
        )
    }
}

@Composable
fun NutritionTab(nutritionLogs: List<NutritionLog>, appStore: AppStore) {
    var showAddFoodDialog by remember { mutableStateOf(false) }
    val today = remember {
        val todayDate = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
        "${todayDate.year.toString().padStart(4, '0')}-${todayDate.monthNumber.toString().padStart(2, '0')}-${todayDate.dayOfMonth.toString().padStart(2, '0')}"
    }
    val todayLog = nutritionLogs.find { it.date == today } ?: NutritionLog(date = today, entries = emptyList(), waterMl = 0.0)
    val waterCount = ((todayLog.waterMl ?: 0.0) / 250.0).toInt()
    
    val totalCalories = todayLog.entries.sumOf { it.calories }.toFloat()
    val totalProtein = todayLog.entries.sumOf { it.protein }.toFloat()
    val totalCarbs = todayLog.entries.sumOf { it.carbs }.toFloat()
    val totalFats = todayLog.entries.sumOf { it.fat }.toFloat()
    
    val goalCalories = 2500f
    val progress = if (goalCalories > 0f) totalCalories / goalCalories else 0f
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Text(text = "Seguimiento de Nutrición", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(modifier = Modifier.size(200.dp), contentAlignment = Alignment.Center) {
                        com.gainslab.ironlog.ui.MacroRing(
                            proteinProportion = totalProtein,
                            carbsProportion = totalCarbs,
                            fatsProportion = totalFats,
                            totalProgress = progress,
                            modifier = Modifier.fillMaxSize()
                        )
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("${totalCalories.toInt()}", fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color.White)
                            Text("/ ${goalCalories.toInt()} kcal", fontSize = 14.sp, color = Text_Muted)
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        MacroStat("Proteína", "${totalProtein.toInt()}g", Color(0xFFEF4444))
                        MacroStat("Carbs", "${totalCarbs.toInt()}g", Color(0xFF3B82F6))
                        MacroStat("Grasas", "${totalFats.toInt()}g", Color(0xFFF59E0B))
                    }
                }
            }
        }
        
        item {
            Button(
                onClick = { showAddFoodDialog = true },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Añadir Comida", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }

        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Registro de Agua", fontSize = 14.sp, color = Text_Muted)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("${waterCount * 250} ml", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        for (i in 1..6) {
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(if (i <= waterCount) Color(0xFF3B82F6) else Color.White.copy(alpha = 0.1f))
                                    .clickable {
                                        val nextCount = if (waterCount == i) i - 1 else i
                                        appStore.saveNutritionLog(
                                            todayLog.copy(waterMl = nextCount * 250.0)
                                        )
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "💧",
                                    fontSize = 18.sp,
                                    color = if (i <= waterCount) Color.White else Color.White.copy(alpha = 0.3f)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    
    if (showAddFoodDialog) {
        AddFoodDialog(
            onDismiss = { showAddFoodDialog = false },
            onAdd = { foodName, cals, p, c, f ->
                val entry = FoodEntry(
                    id = "food_${System.currentTimeMillis()}",
                    name = foodName,
                    calories = cals,
                    protein = p,
                    carbs = c,
                    fat = f,
                    mealType = "snack",
                    timestamp = System.currentTimeMillis()
                )
                val newLog = todayLog.copy(entries = todayLog.entries + entry)
                appStore.saveNutritionLog(newLog)
                showAddFoodDialog = false
            }
        )
    }
}

@Composable
fun PremiumNutritionTab(nutritionLogs: List<NutritionLog>, appStore: AppStore) {
    var showAddFoodDialog by remember { mutableStateOf(false) }
    val today = remember {
        val todayDate = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
        "${todayDate.year.toString().padStart(4, '0')}-${todayDate.monthNumber.toString().padStart(2, '0')}-${todayDate.dayOfMonth.toString().padStart(2, '0')}"
    }
    val todayLog = nutritionLogs.find { it.date == today } ?: NutritionLog(date = today, entries = emptyList(), waterMl = 0.0)
    val waterCount = ((todayLog.waterMl ?: 0.0) / 250.0).toInt()
    val totalCalories = todayLog.entries.sumOf { it.calories }.toFloat()
    val totalProtein = todayLog.entries.sumOf { it.protein }.toFloat()
    val totalCarbs = todayLog.entries.sumOf { it.carbs }.toFloat()
    val totalFats = todayLog.entries.sumOf { it.fat }.toFloat()
    val goalCalories = 2500f
    val progress = if (goalCalories > 0f) totalCalories / goalCalories else 0f

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            SurfaceCard {
                Text("Panel de nutricion", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
                Text("Resumen de calorias, macros y agua del dia actual.", fontSize = 13.sp, color = Text_Muted)
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccentChip("${totalCalories.toInt()} kcal", selected = true)
                    AccentChip("${todayLog.entries.size} comidas")
                }
            }
        }

        item {
            SurfaceCard {
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(modifier = Modifier.size(200.dp), contentAlignment = Alignment.Center) {
                            com.gainslab.ironlog.ui.MacroRing(
                                proteinProportion = totalProtein,
                                carbsProportion = totalCarbs,
                                fatsProportion = totalFats,
                                totalProgress = progress,
                                modifier = Modifier.fillMaxSize()
                            )
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${totalCalories.toInt()}", fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color.White)
                                Text("/ ${goalCalories.toInt()} kcal", fontSize = 14.sp, color = Text_Muted)
                            }
                        }
                        Spacer(modifier = Modifier.height(24.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            MacroStat("Proteina", "${totalProtein.toInt()}g", Color(0xFFEF4444))
                            MacroStat("Carbs", "${totalCarbs.toInt()}g", Color(0xFF3B82F6))
                            MacroStat("Grasas", "${totalFats.toInt()}g", Color(0xFFF59E0B))
                        }
                    }
                }
            }
        }

        item {
            Button(
                onClick = { showAddFoodDialog = true },
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Anadir comida", color = Color.Black, fontWeight = FontWeight.Black)
            }
        }

        item {
            SurfaceCard {
                Text("Hidratacion", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(6.dp))
                Text("${waterCount * 250} ml", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    for (i in 1..6) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(46.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (i <= waterCount) Color(0xFF3B82F6) else Color.White.copy(alpha = 0.08f))
                                .clickable {
                                    val nextCount = if (waterCount == i) i - 1 else i
                                    appStore.saveNutritionLog(todayLog.copy(waterMl = nextCount * 250.0))
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = "${i * 250}",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }

    if (showAddFoodDialog) {
        AddFoodDialog(
            onDismiss = { showAddFoodDialog = false },
            onAdd = { foodName, cals, p, c, f ->
                val entry = FoodEntry(
                    id = "food_${System.currentTimeMillis()}",
                    name = foodName,
                    calories = cals,
                    protein = p,
                    carbs = c,
                    fat = f,
                    mealType = "snack",
                    timestamp = System.currentTimeMillis()
                )
                appStore.saveNutritionLog(todayLog.copy(entries = todayLog.entries + entry))
                showAddFoodDialog = false
            }
        )
    }
}

@Composable
fun PremiumActiveSessionView(
    session: ActiveSession,
    appStore: AppStore,
    onStartTimer: (Int) -> Unit
) {
    var exercisesList by remember(session) { mutableStateOf(session.exercises) }
    var showPlateCalculator by remember { mutableStateOf(false) }

    fun updateSessionExercises(updatedExercises: List<SessionExercise>) {
        exercisesList = updatedExercises
        appStore.setActiveSession(session.copy(exercises = updatedExercises))
    }

    fun updateSet(
        exerciseInstanceId: Int,
        setId: Int,
        transform: (WorkoutSet) -> WorkoutSet
    ) {
        val updated = exercisesList.map { exercise ->
            if (exercise.instanceId == exerciseInstanceId) {
                exercise.copy(sets = exercise.sets.map { set ->
                    if (set.id == setId) transform(set) else set
                })
            } else exercise
        }
        updateSessionExercises(updated)
    }

    fun addSet(exerciseInstanceId: Int) {
        val updated = exercisesList.map { exercise ->
            if (exercise.instanceId == exerciseInstanceId) {
                val nextId = (exercise.sets.maxOfOrNull { it.id } ?: 0) + 1
                val lastSet = exercise.sets.lastOrNull()
                exercise.copy(
                    sets = exercise.sets + WorkoutSet(
                        id = nextId,
                        weight = lastSet?.weight ?: "",
                        reps = lastSet?.reps ?: "",
                        rpe = lastSet?.rpe ?: "",
                        completed = false,
                        type = lastSet?.type ?: SetType.REGULAR
                    )
                )
            } else exercise
        }
        updateSessionExercises(updated)
    }

    fun removeSet(exerciseInstanceId: Int, setId: Int) {
        val updated = exercisesList.map { exercise ->
            if (exercise.instanceId == exerciseInstanceId && exercise.sets.size > 1) {
                exercise.copy(sets = exercise.sets.filterNot { it.id == setId })
            } else exercise
        }
        updateSessionExercises(updated)
    }

    val totalSets = exercisesList.sumOf { it.sets.size }
    val completedSets = exercisesList.sumOf { exercise -> exercise.sets.count { it.completed } }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            SurfaceCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = session.name, fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AccentChip("Semana ${session.week}", selected = true)
                            AccentChip("Sesion activa")
                            AccentChip("$completedSets/$totalSets sets")
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Marca series completadas y usa el calculador de discos sin salir del flujo.",
                            fontSize = 13.sp,
                            color = Text_Muted
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(
                        onClick = { showPlateCalculator = true },
                        modifier = Modifier.weight(1f).height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Text_White)
                    ) {
                        Text("Calc. discos", fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = {
                            val completedSession = Log(
                                id = session.id,
                                dayIdx = session.dayIdx,
                                name = session.name,
                                startTime = session.startTime ?: System.currentTimeMillis(),
                                endTime = System.currentTimeMillis(),
                                duration = (System.currentTimeMillis() - (session.startTime ?: System.currentTimeMillis())) / 1000,
                                mesoId = session.mesoId,
                                week = session.week,
                                exercises = exercisesList
                            )
                            appStore.saveWorkoutLog(completedSession)
                            appStore.setActiveSession(null)
                        },
                        modifier = Modifier.weight(1f).height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Terminar", color = Color.Black, fontWeight = FontWeight.Black)
                    }
                }
            }
        }

        items(exercisesList, key = { it.instanceId }) { exercise ->
            SurfaceCard(contentPadding = PaddingValues(18.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = exercise.name.get("es"),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        AccentChip(text = exercise.muscle.name, selected = true)
                    }
                    OutlinedButton(
                        onClick = { addSet(exercise.instanceId) },
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Text_White),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                    ) {
                        Text("+ Serie", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("SERIE", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.weight(1f))
                    Text("PESO", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.weight(2f), textAlign = TextAlign.Center)
                    Text("REPS", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.weight(2f), textAlign = TextAlign.Center)
                    Text("RPE", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.weight(1.5f), textAlign = TextAlign.Center)
                    Text("OK", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.weight(1.2f), textAlign = TextAlign.End)
                }

                Spacer(modifier = Modifier.height(8.dp))

                exercise.sets.forEach { set ->
                    val isChecked = set.completed

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(if (isChecked) MaterialTheme.colorScheme.primary.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.03f))
                            .border(
                                1.dp,
                                if (isChecked) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Color.White.copy(alpha = 0.04f),
                                RoundedCornerShape(14.dp)
                            )
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "${set.id}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Text_Muted,
                            modifier = Modifier.weight(1f)
                        )
                        OutlinedTextField(
                            value = set.weight,
                            onValueChange = { value ->
                                updateSet(exercise.instanceId, set.id) { current -> current.copy(weight = value) }
                            },
                            singleLine = true,
                            modifier = Modifier.weight(2f),
                            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, color = Color.White, fontSize = 14.sp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.06f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                cursorColor = MaterialTheme.colorScheme.primary
                            )
                        )
                        OutlinedTextField(
                            value = set.reps,
                            onValueChange = { value ->
                                updateSet(exercise.instanceId, set.id) { current -> current.copy(reps = value) }
                            },
                            singleLine = true,
                            modifier = Modifier.weight(2f),
                            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, color = Color.White, fontSize = 14.sp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.06f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                cursorColor = MaterialTheme.colorScheme.primary
                            )
                        )
                        OutlinedTextField(
                            value = set.rpe,
                            onValueChange = { value ->
                                updateSet(exercise.instanceId, set.id) { current -> current.copy(rpe = value) }
                            },
                            singleLine = true,
                            modifier = Modifier.weight(1.5f),
                            textStyle = LocalTextStyle.current.copy(textAlign = TextAlign.Center, color = Color.White, fontSize = 14.sp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.35f),
                                unfocusedBorderColor = Color.White.copy(alpha = 0.06f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                cursorColor = MaterialTheme.colorScheme.primary
                            )
                        )

                        Box(
                            modifier = Modifier.weight(1.2f),
                            contentAlignment = Alignment.CenterEnd
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                TextButton(
                                    onClick = { removeSet(exercise.instanceId, set.id) },
                                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 0.dp),
                                    enabled = exercise.sets.size > 1
                                ) {
                                    Text("x", color = if (exercise.sets.size > 1) Color.Red else Text_Muted, fontWeight = FontWeight.Black)
                                }
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { checked ->
                                        updateSet(exercise.instanceId, set.id) { current -> current.copy(completed = checked) }
                                        if (checked) onStartTimer(90)
                                    },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = MaterialTheme.colorScheme.primary,
                                        checkmarkColor = Color.Black
                                    )
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }

    if (showPlateCalculator) {
        com.gainslab.ironlog.ui.PlateCalculatorView(
            onDismiss = { showPlateCalculator = false }
        )
    }
}

@Composable
fun MacroStat(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(modifier = Modifier.size(12.dp).clip(CircleShape).background(color))
        Spacer(modifier = Modifier.height(4.dp))
        Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
        Text(label, fontSize = 12.sp, color = Text_Muted)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddFoodDialog(
    onDismiss: () -> Unit,
    onAdd: (String, Double, Double, Double, Double) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var cals by remember { mutableStateOf("") }
    var p by remember { mutableStateOf("") }
    var c by remember { mutableStateOf("") }
    var f by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Dark_Surface,
        title = { Text("Añadir Comida Rápida", color = Color.White) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre (ej. Pollo con arroz)", color = Text_Muted) },
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = cals,
                        onValueChange = { cals = it },
                        label = { Text("Kcal", color = Text_Muted) },
                        modifier = Modifier.weight(1f),
                        colors = TextFieldDefaults.outlinedTextFieldColors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                    )
                    OutlinedTextField(
                        value = p,
                        onValueChange = { p = it },
                        label = { Text("Prot", color = Text_Muted) },
                        modifier = Modifier.weight(1f),
                        colors = TextFieldDefaults.outlinedTextFieldColors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                    )
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = c,
                        onValueChange = { c = it },
                        label = { Text("Carb", color = Text_Muted) },
                        modifier = Modifier.weight(1f),
                        colors = TextFieldDefaults.outlinedTextFieldColors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                    )
                    OutlinedTextField(
                        value = f,
                        onValueChange = { f = it },
                        label = { Text("Grasa", color = Text_Muted) },
                        modifier = Modifier.weight(1f),
                        colors = TextFieldDefaults.outlinedTextFieldColors(focusedTextColor = Color.White, unfocusedTextColor = Color.White)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onAdd(
                        name.ifEmpty { "Comida" },
                        cals.toDoubleOrNull() ?: 0.0,
                        p.toDoubleOrNull() ?: 0.0,
                        c.toDoubleOrNull() ?: 0.0,
                        f.toDoubleOrNull() ?: 0.0
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Guardar", color = Color.Black)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar", color = Text_Muted)
            }
        }
    )
}

@Composable
fun HistoryTab(workoutLogs: List<Log>) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 100.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(text = "Historial de Entrenamientos", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }

        if (workoutLogs.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Aún no tienes entrenamientos registrados.", color = Text_Muted, textAlign = TextAlign.Center)
                }
            }
        } else {
            items(workoutLogs) { log ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = Dark_Surface),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(text = log.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text(
                                text = "${log.duration / 60} min",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = "Semana ${log.week} • ${log.exercises.size} ejercicios",
                            fontSize = 12.sp,
                            color = Text_Muted,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun PremiumHistoryTab(workoutLogs: List<Log>) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SurfaceCard {
                Text("Historial de entrenamientos", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
                Text("Tus sesiones recientes y el volumen ejecutado en cada bloque.", fontSize = 13.sp, color = Text_Muted)
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccentChip("${workoutLogs.size} sesiones", selected = true)
                }
            }
        }

        if (workoutLogs.isEmpty()) {
            item {
                SurfaceCard {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Todavia no tienes entrenamientos registrados.", color = Text_Muted, textAlign = TextAlign.Center)
                    }
                }
            }
        } else {
            items(workoutLogs) { log ->
                SurfaceCard(contentPadding = PaddingValues(18.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(text = log.name, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Semana ${log.week} • ${log.exercises.size} ejercicios",
                                fontSize = 12.sp,
                                color = Text_Muted
                            )
                        }
                        AccentChip("${log.duration / 60} min", selected = true)
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsTab(
    state: AppState, 
    appStore: AppStore, 
    onStartProgramEditor: () -> Unit, 
    onManageExercises: () -> Unit,
    onViewStats: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(text = "Ajustes", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)

        Spacer(modifier = Modifier.height(16.dp))

        // Actions Card
        Card(
            colors = CardDefaults.cardColors(containerColor = Dark_Surface),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onStartProgramEditor() }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Add, contentDescription = null, tint = Text_White)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text("Crear Mesociclo Personalizado", color = Text_White, fontWeight = FontWeight.Medium)
                }
                Divider(color = Color.White.copy(alpha = 0.05f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onManageExercises() }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Settings, contentDescription = null, tint = Text_White)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text("Gestionar Ejercicios", color = Text_White, fontWeight = FontWeight.Medium)
                }
                Divider(color = Color.White.copy(alpha = 0.05f))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onViewStats() }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.Info, contentDescription = null, tint = Text_White)
                    Spacer(modifier = Modifier.width(16.dp))
                    Text("Ver Estadísticas", color = Text_White, fontWeight = FontWeight.Medium)
                }
            }
        }

        Card(
            colors = CardDefaults.cardColors(containerColor = Dark_Surface),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Tema de Color", fontSize = 14.sp, color = Text_Muted)
                Spacer(modifier = Modifier.height(16.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    ThemeColorPill(color = Primary_Iron, label = "Iron", selected = state.colorTheme == ColorTheme.IRON) {
                        appStore.setColorTheme(ColorTheme.IRON)
                    }
                    ThemeColorPill(color = Primary_Ocean, label = "Ocean", selected = state.colorTheme == ColorTheme.OCEAN) {
                        appStore.setColorTheme(ColorTheme.OCEAN)
                    }
                    ThemeColorPill(color = Primary_Forest, label = "Forest", selected = state.colorTheme == ColorTheme.FOREST) {
                        appStore.setColorTheme(ColorTheme.FOREST)
                    }
                }
                
                Spacer(modifier = Modifier.height(12.dp))
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    ThemeColorPill(color = Primary_Royal, label = "Royal", selected = state.colorTheme == ColorTheme.ROYAL) {
                        appStore.setColorTheme(ColorTheme.ROYAL)
                    }
                    ThemeColorPill(color = Primary_Sunset, label = "Sunset", selected = state.colorTheme == ColorTheme.SUNSET) {
                        appStore.setColorTheme(ColorTheme.SUNSET)
                    }
                    ThemeColorPill(color = Primary_Monochrome, label = "Mono", selected = state.colorTheme == ColorTheme.MONOCHROME) {
                        appStore.setColorTheme(ColorTheme.MONOCHROME)
                    }
                }
            }
        }
    }
}

@Composable
fun PremiumSettingsTab(
    state: AppState,
    appStore: AppStore,
    onStartProgramEditor: () -> Unit,
    onManageExercises: () -> Unit,
    onViewStats: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            SurfaceCard {
                Text("Ajustes", fontSize = 28.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(8.dp))
                Text("Herramientas principales, personalizacion visual y accesos rapidos de administracion.", fontSize = 13.sp, color = Text_Muted)
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccentChip("Tema ${state.colorTheme.name.lowercase()}", selected = true)
                }
            }
        }

        item {
            SurfaceCard(contentPadding = PaddingValues(0.dp)) {
                SettingsActionRow(
                    icon = Icons.Default.Add,
                    title = "Crear mesociclo personalizado",
                    subtitle = "Abrir el constructor y editar tu bloque activo"
                ) { onStartProgramEditor() }
                HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                SettingsActionRow(
                    icon = Icons.Default.Settings,
                    title = "Gestionar ejercicios",
                    subtitle = "Ajustar la biblioteca global y variantes"
                ) { onManageExercises() }
                HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                SettingsActionRow(
                    icon = Icons.Default.Info,
                    title = "Ver estadisticas",
                    subtitle = "Revisar PRs y volumen acumulado"
                ) { onViewStats() }
            }
        }

        item {
            SurfaceCard {
                Text("Tema de color", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Text_White)
                Spacer(modifier = Modifier.height(6.dp))
                Text("La base visual nativa ya toma este color como acento principal del shell.", fontSize = 13.sp, color = Text_Muted)
                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    ThemeColorPill(color = Primary_Iron, label = "Iron", selected = state.colorTheme == ColorTheme.IRON) {
                        appStore.setColorTheme(ColorTheme.IRON)
                    }
                    ThemeColorPill(color = Primary_Ocean, label = "Ocean", selected = state.colorTheme == ColorTheme.OCEAN) {
                        appStore.setColorTheme(ColorTheme.OCEAN)
                    }
                    ThemeColorPill(color = Primary_Forest, label = "Forest", selected = state.colorTheme == ColorTheme.FOREST) {
                        appStore.setColorTheme(ColorTheme.FOREST)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    ThemeColorPill(color = Primary_Royal, label = "Royal", selected = state.colorTheme == ColorTheme.ROYAL) {
                        appStore.setColorTheme(ColorTheme.ROYAL)
                    }
                    ThemeColorPill(color = Primary_Sunset, label = "Sunset", selected = state.colorTheme == ColorTheme.SUNSET) {
                        appStore.setColorTheme(ColorTheme.SUNSET)
                    }
                    ThemeColorPill(color = Primary_Monochrome, label = "Mono", selected = state.colorTheme == ColorTheme.MONOCHROME) {
                        appStore.setColorTheme(ColorTheme.MONOCHROME)
                    }
                }
            }
        }
    }
}

@Composable
private fun SettingsActionRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 18.dp, vertical = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Box(
            modifier = Modifier
                .size(42.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(Color.White.copy(alpha = 0.06f))
                .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        }

        Column(modifier = Modifier.weight(1f)) {
            Text(title, color = Text_White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
            Spacer(modifier = Modifier.height(2.dp))
            Text(subtitle, color = Text_Muted, fontSize = 12.sp)
        }
    }
}

@Composable
fun ThemeColorPill(color: Color, label: String, selected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .background(if (selected) color.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.04f))
            .border(1.dp, if (selected) color else Color.White.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(14.dp)
                .clip(CircleShape)
                .background(color)
        )
        Text(text = label, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = if (selected) color else Color.White)
    }
}

fun formatTime(totalSeconds: Int): String {
    val minutes = totalSeconds / 60
    val seconds = totalSeconds % 60
    return "${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}"
}
