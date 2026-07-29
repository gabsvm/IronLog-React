package com.gainslab.ironlog

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.text.BasicTextField
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
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.model.*
import com.gainslab.ironlog.store.*
import com.gainslab.ironlog.theme.*
import com.gainslab.ironlog.utils.getSetLoadVolume
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

private data class AppTabItem(
    val label: String,
    val icon: ImageVector
)

/** Keeps the one-second rest countdown out of the workout list's composition. */
private class RestTimerController {
    var seconds by mutableIntStateOf(0)
    var active by mutableStateOf(false)

    fun start(durationSeconds: Int) {
        seconds = durationSeconds.coerceAtLeast(0)
        active = seconds > 0
    }
}

@Composable
private fun RestTimerOverlay(controller: RestTimerController, modifier: Modifier = Modifier) {
    val seconds = controller.seconds
    val active = controller.active
    LaunchedEffect(active, seconds) {
        if (active && seconds > 0) {
            delay(1000)
            controller.seconds = seconds - 1
            if (controller.seconds == 0) controller.active = false
        }
    }
    AnimatedVisibility(visible = active && seconds > 0, enter = fadeIn(), exit = fadeOut(), modifier = modifier) {
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(24.dp))
                .background(Brush.horizontalGradient(listOf(MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.primary.copy(alpha = 0.82f))))
                .border(1.dp, Color.White.copy(alpha = 0.2f), RoundedCornerShape(24.dp))
                .padding(horizontal = 24.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("DESCANSO", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp, letterSpacing = 1.sp)
            Text(formatTime(seconds), color = Color.Black, fontWeight = FontWeight.Black, fontSize = 18.sp)
        }
    }
}

@Composable
fun App() {
    val appStore: AppStore = remember {
        org.koin.core.context.GlobalContext.get().get()
    }
    val authService: com.gainslab.ironlog.auth.AuthService = remember {
        org.koin.core.context.GlobalContext.get().get()
    }
    val state by appStore.state.collectAsState()
    
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())
    val nutritionLogs by appStore.nutritionLogs.collectAsState(initial = emptyList())

    var selectedTab by remember { mutableStateOf(0) }
    val restTimer = remember { RestTimerController() }
    val startRestTimer = remember(restTimer) { { seconds: Int -> restTimer.start(seconds) } }
    var showProgramEditor by remember { mutableStateOf(false) }
    var showExercises by remember { mutableStateOf(false) }
    var showStats by remember { mutableStateOf(false) }
    var showCommandPalette by remember { mutableStateOf(false) }
    var showAccount by remember { mutableStateOf(false) }
    var completedWorkoutLog by remember { mutableStateOf<Log?>(null) }
    val tabs = remember {
        listOf(
            AppTabItem("Entrenar", Icons.Default.PlayArrow),
            AppTabItem("Historial", Icons.Default.DateRange),
            AppTabItem("Nutricion", Icons.Default.Favorite),
            AppTabItem("Ajustes", Icons.Default.Settings)
        )
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
        } else if (showAccount) {
            com.gainslab.ironlog.ui.AccountView(
                authService = authService,
                appStore = appStore,
                onBack = { showAccount = false }
            )
        } else if (completedWorkoutLog != null) {
            SessionSummaryScreen(
                log = completedWorkoutLog!!,
                onClose = { completedWorkoutLog = null }
            )
        } else {
            Scaffold(
                modifier = Modifier.fillMaxSize(),
                containerColor = OLED_Black,
                contentWindowInsets = WindowInsets(0.dp),
                bottomBar = {
                    if (state.activeSession == null) {
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
                }
            ) { paddingValues ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(OLED_Black)
                        .padding(paddingValues)
                ) {
                    if (state.activeSession == null) AppBackdrop()
                    if (state.isStoreLoading) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                        }
                    } else {
                        when (selectedTab) {
                            0 -> WorkoutTab(
                                state = state,
                                appStore = appStore,
                                onStartTimer = startRestTimer,
                                onStartProgramEditor = { showProgramEditor = true },
                                onShowCommandPalette = { showCommandPalette = true },
                                onSessionCompleted = { completedWorkoutLog = it }
                            )
                            1 -> PremiumNutritionTab(nutritionLogs = nutritionLogs, appStore = appStore)
                            2 -> PremiumHistoryTab(workoutLogs = workoutLogs, appStore = appStore)
                            3 -> PremiumSettingsTab(
                                state = state,
                                appStore = appStore,
                                onStartProgramEditor = { showProgramEditor = true },
                                onManageExercises = { showExercises = true },
                                onViewStats = { showStats = true },
                                onManageAccount = { showAccount = true }
                            )
                        }
                    }

                    RestTimerOverlay(
                        controller = restTimer,
                        modifier = Modifier.align(Alignment.TopCenter).padding(top = 12.dp)
                    )
                    
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
    onShowCommandPalette: () -> Unit,
    onSessionCompleted: (Log) -> Unit
) {
    if (state.activeSession != null) {
        PremiumActiveSessionView(
            session = state.activeSession,
            appStore = appStore,
            onStartTimer = onStartTimer,
            onSessionCompleted = onSessionCompleted
        )
    } else if (state.activeMeso != null) {
        PremiumActiveMesoView(state = state, appStore = appStore, onShowCommandPalette = onShowCommandPalette)
    } else {
        NoMesoView(
            appStore = appStore, 
            exercises = state.exercises, 
            personalTemplates = state.personalTemplates,
            globalTemplates = state.globalTemplates,
            onStartProgramEditor = onStartProgramEditor,
            onShowCommandPalette = onShowCommandPalette
        )
    }
}

@Composable
fun HomeView(state: AppState, appStore: AppStore, onStartProgramEditor: () -> Unit, onShowCommandPalette: () -> Unit) {
    if (state.activeMeso == null) {
        NoMesoView(appStore = appStore, exercises = state.exercises, personalTemplates = state.personalTemplates, globalTemplates = state.globalTemplates, onStartProgramEditor = onStartProgramEditor, onShowCommandPalette = onShowCommandPalette)
    } else {
        PremiumActiveMesoView(state = state, appStore = appStore, onShowCommandPalette = onShowCommandPalette)
    }
}

@Composable
fun NoMesoView(appStore: AppStore, exercises: List<ExerciseDef>, personalTemplates: List<GlobalTemplate>, globalTemplates: List<GlobalTemplate>, onStartProgramEditor: () -> Unit, onShowCommandPalette: () -> Unit) {
    var showTemplates by remember { mutableStateOf(false) }
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
        item {
            OutlinedButton(
                onClick = { showTemplates = true },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(14.dp),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.4f)),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
            ) { Text("Explorar plantillas", fontWeight = FontWeight.Bold) }
        }
    }
    if (showTemplates) NativeTemplatePicker(
        personalTemplates = personalTemplates,
        globalTemplates = globalTemplates,
        onDismiss = { showTemplates = false },
        onSelect = { name, type, program ->
            appStore.setProgram(program)
            appStore.setActiveMeso(MesoCycle(System.currentTimeMillis(), name, type, 1, program.map { day -> day.slots.map { it.exerciseId } }, 5, false, null, 5))
            showTemplates = false
        }
    )
}

/** Lightweight input used in the repeated workout grid. Material text fields
 * are deliberately avoided here: a session can render dozens of these cells. */
@Composable
private fun WorkoutSetInput(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = LocalTextStyle.current.copy(
            color = Text_White,
            fontSize = 15.sp,
            textAlign = TextAlign.Center,
            fontWeight = FontWeight.SemiBold
        ),
        cursorBrush = androidx.compose.ui.graphics.SolidColor(MaterialTheme.colorScheme.primary),
        modifier = modifier
            .clip(RoundedCornerShape(9.dp))
            .background(Color.White.copy(alpha = 0.025f))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(9.dp))
            .padding(horizontal = 4.dp, vertical = 10.dp)
    )
}

@Composable
private fun NativeTemplatePicker(personalTemplates: List<GlobalTemplate>, globalTemplates: List<GlobalTemplate>, onDismiss: () -> Unit, onSelect: (String, String, List<ProgramDay>) -> Unit) {
    val templates = remember {
        listOf(
            Triple("Push / Pull / Legs", "hyp_1", com.gainslab.ironlog.utils.Templates.DEFAULT_TEMPLATE),
            Triple("Torso / Pierna", "hyp_2", com.gainslab.ironlog.utils.Templates.UPPER_LOWER_TEMPLATE),
            Triple("Full body ondulante", "wizard", com.gainslab.ironlog.utils.Templates.WIZARD_TEMPLATE),
            Triple("Resensibilizacion", "resensitization", com.gainslab.ironlog.utils.Templates.RESENS_TEMPLATE),
            Triple("Metabolitos", "metabolite", com.gainslab.ironlog.utils.Templates.METABOLITE_TEMPLATE)
        ) + globalTemplates.map { template -> Triple(template.title.es.ifBlank { template.name }, "global", template.program) } + personalTemplates.map { template -> Triple(template.title.es.ifBlank { template.name }, "custom", template.program) }
    }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Dark_Surface,
        title = { Text("Plantillas de entrenamiento", color = Text_White, fontWeight = FontWeight.Black) },
        text = {
            LazyColumn(modifier = Modifier.heightIn(max = 420.dp)) {
                items(templates, key = { it.second }) { template ->
                    TextButton(onClick = { onSelect(template.first, template.second, template.third) }, modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.fillMaxWidth()) {
                            Text(template.first, color = Text_White, fontWeight = FontWeight.Bold)
                            Text("${template.third.size} dias por semana", color = Text_Muted, fontSize = 12.sp)
                        }
                    }
                }
            }
        },
        confirmButton = {},
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cerrar", color = Text_Muted) } }
    )
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
    var showMesoSettings by remember { mutableStateOf(false) }
    var showSkipConfirmation by remember { mutableStateOf(false) }
    val workoutLogs by appStore.workoutLogs.collectAsState(initial = emptyList())
    val weekLogs = remember(workoutLogs, meso.id, meso.week) {
        workoutLogs.filter { it.mesoId == meso.id && it.week == meso.week }
    }
    val completedDays = remember(weekLogs) { weekLogs.filter { it.skipped != true }.map { it.dayIdx }.toSet() }
    val nextDayIdx = remember(completedDays, state.program) { state.program.indices.firstOrNull { it !in completedDays } }
    val completedCount = completedDays.size.coerceAtMost(state.program.size)
    val weeklyProgress = if (state.program.isEmpty()) 0f else completedCount.toFloat() / state.program.size
    val selectedDayLog = remember(weekLogs, selectedDayIdx) { weekLogs.lastOrNull { it.dayIdx == selectedDayIdx && it.skipped != true } }
    val weeklyVolume = remember(weekLogs) { weekLogs.filter { it.skipped != true }.sumOf { log -> log.exercises.sumOf { ex -> ex.sets.sumOf { set -> getSetLoadVolume(set, ex) } } } }
    val weeklyMinutes = remember(weekLogs) { weekLogs.filter { it.skipped != true }.sumOf { it.duration }.div(60) }
    val consistencyDays = remember(workoutLogs) {
        val today = Clock.System.now().toEpochMilliseconds()
        (0 until 28).map { dayOffset ->
            val start = today - (dayOffset + 1) * 86_400_000L
            val end = today - dayOffset * 86_400_000L
            workoutLogs.any { it.skipped != true && it.endTime in start..end }
        }.reversed()
    }
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
            SurfaceCard {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("Progreso semanal", color = Text_White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                        Text("$completedCount de ${state.program.size} sesiones completadas", color = Text_Muted, fontSize = 13.sp)
                    }
                    Text("${(weeklyProgress * 100).toInt()}%", color = MaterialTheme.colorScheme.primary, fontSize = 22.sp, fontWeight = FontWeight.Black)
                }
                Spacer(Modifier.height(12.dp))
                LinearProgressIndicator(progress = { weeklyProgress }, modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(8.dp)), color = MaterialTheme.colorScheme.primary, trackColor = Color.White.copy(alpha = 0.08f))
                nextDayIdx?.let { next -> Text("Siguiente: DIA ${next + 1} · ${state.program[next].dayName.get("es")}", color = Text_Muted, fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp)) }
                    ?: Text("Semana completa. Podes repetir una sesion o avanzar el ciclo.", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, modifier = Modifier.padding(top = 12.dp))
            }
        }

        item {
            SurfaceCard {
                Text("Recap de la semana", color = Text_White, fontWeight = FontWeight.Black, fontSize = 18.sp)
                Spacer(Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    SummaryMetric("Sesiones", "$completedCount")
                    SummaryMetric("Volumen", "${weeklyVolume.toInt()} kg")
                    SummaryMetric("Tiempo", "${weeklyMinutes} min")
                }
                Spacer(Modifier.height(14.dp))
                Text("Constancia · ultimos 28 dias", color = Text_Muted, fontSize = 12.sp)
                Spacer(Modifier.height(8.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    consistencyDays.forEach { trained ->
                        Box(modifier = Modifier.weight(1f).height(20.dp).clip(RoundedCornerShape(4.dp)).background(if (trained) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.07f)))
                    }
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
                        text = if (selectedDayLog != null) "Completada esta semana · podes repetirla" else "${dayDef.slots.size} bloques de trabajo listos para arrancar",
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
                            Text(if (selectedDayLog != null) "REPETIR SESION" else "INICIAR SESION", color = Color.Black, fontWeight = FontWeight.Black)
                        }
                    }
                    if (selectedDayLog == null) {
                        TextButton(onClick = { showSkipConfirmation = true }, modifier = Modifier.align(Alignment.End)) {
                            Text("Saltar sesion", color = Text_Muted, fontSize = 12.sp)
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

                Spacer(modifier = Modifier.height(8.dp))
                OutlinedButton(
                    onClick = { showMesoSettings = true },
                    modifier = Modifier.fillMaxWidth().height(46.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Text_White)
                ) { Text("Ajustar mesociclo", fontWeight = FontWeight.Bold) }

                if (completedCount == state.program.size && state.program.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = { appStore.setActiveMeso(meso.copy(week = meso.week + 1)) },
                        modifier = Modifier.fillMaxWidth().height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.45f)),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.primary)
                    ) { Text("Avanzar a semana ${meso.week + 1}", fontWeight = FontWeight.Bold) }
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

    if (showSkipConfirmation) {
        AlertDialog(
            onDismissRequest = { showSkipConfirmation = false }, containerColor = Dark_Surface,
            title = { Text("Saltar sesion?", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Text("Quedara registrada como omitida para que el progreso semanal sea fiel.", color = Text_Muted) },
            confirmButton = { Button(onClick = {
                appStore.saveWorkoutLog(Log(id = System.currentTimeMillis(), dayIdx = selectedDayIdx, name = dayDef?.dayName?.get("es") ?: "Sesion omitida", startTime = System.currentTimeMillis(), endTime = System.currentTimeMillis(), duration = 0, skipped = true, mesoId = meso.id, week = meso.week))
                showSkipConfirmation = false
            }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEAB308))) { Text("Saltar", color = Color.Black, fontWeight = FontWeight.Bold) } },
            dismissButton = { TextButton(onClick = { showSkipConfirmation = false }) { Text("Cancelar", color = Text_Muted) } }
        )
    }
    if (showMesoSettings) MesoSettingsDialog(meso = meso, onDismiss = { showMesoSettings = false }) { updated -> appStore.setActiveMeso(updated); showMesoSettings = false }
}

@Composable
private fun MesoSettingsDialog(meso: MesoCycle, onDismiss: () -> Unit, onSave: (MesoCycle) -> Unit) {
    var weeks by remember { mutableStateOf((meso.targetWeeks ?: meso.duration).toString()) }
    var note by remember { mutableStateOf(meso.note.orEmpty()) }
    var deload by remember { mutableStateOf(meso.isDeload == true) }
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Ajustar mesociclo", color = Text_White, fontWeight = FontWeight.Black) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            GoalInput("Semanas objetivo", weeks) { weeks = it }
            Row(verticalAlignment = Alignment.CenterVertically) { Checkbox(checked = deload, onCheckedChange = { deload = it }, colors = CheckboxDefaults.colors(checkedColor = MaterialTheme.colorScheme.primary)); Text("Semana de descarga", color = Text_White, fontSize = 13.sp) }
            GoalInput("Notas del bloque", note) { note = it }
        }
    }, confirmButton = { Button(onClick = { val target = (weeks.toIntOrNull() ?: meso.targetWeeks ?: meso.duration).coerceIn(1, 52); onSave(meso.copy(targetWeeks = target, duration = target, isDeload = deload, note = note.takeIf { it.isNotBlank() })) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar", color = Color.Black) } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } })
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
    var showGoalEditor by remember { mutableStateOf(false) }
    var editingFood by remember { mutableStateOf<FoodEntry?>(null) }
    var deletingFoodId by remember { mutableStateOf<String?>(null) }
    var selectedSection by remember { mutableStateOf(0) }
    val appState by appStore.state.collectAsState()
    val bodyLogs by appStore.bodyLogs.collectAsState(initial = emptyList())
    val cardioSessions by appStore.cardioSessions.collectAsState(initial = emptyList())
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
    val savedGoal = appState.nutritionGoal
    val savedMacros = appState.macroGoals
    val goalCalories = (savedGoal?.calories ?: savedMacros?.calories ?: 2500.0).toFloat()
    val progress = if (goalCalories > 0f) totalCalories / goalCalories else 0f

    if (selectedSection == 1) {
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 4.dp)) {
            NutritionSectionSelector(selectedSection) { selectedSection = it }
            NutritionBodySection(bodyLogs = bodyLogs, cardioSessions = cardioSessions, appStore = appStore, today = today)
        }
        return
    }
    if (selectedSection == 2) {
        Column(modifier = Modifier.fillMaxSize().padding(horizontal = 4.dp)) {
            NutritionSectionSelector(selectedSection) { selectedSection = it }
            NutritionHistorySection(nutritionLogs = nutritionLogs, bodyLogs = bodyLogs, cardioSessions = cardioSessions)
        }
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 4.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        item {
            NutritionSectionSelector(selectedSection) { selectedSection = it }
        }
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
                Spacer(modifier = Modifier.height(12.dp))
                TextButton(onClick = { showGoalEditor = true }) {
                    Text("Configurar objetivo", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
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
                            MacroStat("Proteina", "${totalProtein.toInt()}/${(savedGoal?.protein ?: savedMacros?.protein ?: 0.0).toInt()}g", Color(0xFFEF4444))
                            MacroStat("Carbs", "${totalCarbs.toInt()}/${(savedGoal?.carbs ?: savedMacros?.carbs ?: 0.0).toInt()}g", Color(0xFF3B82F6))
                            MacroStat("Grasas", "${totalFats.toInt()}/${(savedGoal?.fat ?: savedMacros?.fats ?: 0.0).toInt()}g", Color(0xFFF59E0B))
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

        if (todayLog.entries.isNotEmpty()) {
            val mealOrder = listOf("breakfast" to "Desayuno", "lunch" to "Almuerzo", "dinner" to "Cena", "snack" to "Snacks")
            mealOrder.forEach { (mealType, label) ->
                val entries = todayLog.entries.filter { it.mealType == mealType }
                if (entries.isNotEmpty()) item {
                    SurfaceCard {
                        Text(label, color = Text_White, fontSize = 17.sp, fontWeight = FontWeight.Black)
                        entries.forEach { entry ->
                            Row(modifier = Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Column(modifier = Modifier.weight(1f)) { Text(entry.name, color = Text_White, fontWeight = FontWeight.Bold, fontSize = 14.sp); Text("${entry.calories.toInt()} kcal · P ${entry.protein.toInt()}g · C ${entry.carbs.toInt()}g · G ${entry.fat.toInt()}g", color = Text_Muted, fontSize = 11.sp) }
                                TextButton(onClick = { editingFood = entry }, contentPadding = PaddingValues(horizontal = 4.dp)) { Text("Editar", color = MaterialTheme.colorScheme.primary, fontSize = 10.sp) }
                                TextButton(onClick = { deletingFoodId = entry.id }, contentPadding = PaddingValues(horizontal = 4.dp)) { Text("×", color = Color(0xFFEF4444), fontWeight = FontWeight.Black) }
                            }
                        }
                    }
                }
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
                if (appState.customFoods.none { it.name.equals(foodName, ignoreCase = true) }) {
                    appStore.setCustomFoods(appState.customFoods + CustomFood(id = "custom_${System.currentTimeMillis()}", name = foodName, calories = cals, protein = p, carbs = c, fat = f, isFavorite = true, createdAt = System.currentTimeMillis()))
                }
                showAddFoodDialog = false
            }
        )
    }

    editingFood?.let { entry ->
        FoodEntryEditorDialog(entry = entry, onDismiss = { editingFood = null }) { edited ->
            appStore.saveNutritionLog(todayLog.copy(entries = todayLog.entries.map { if (it.id == edited.id) edited else it }))
            editingFood = null
        }
    }
    deletingFoodId?.let { id ->
        AlertDialog(onDismissRequest = { deletingFoodId = null }, containerColor = Dark_Surface, title = { Text("Eliminar comida", color = Text_White) }, text = { Text("Se quitara de este dia.", color = Text_Muted) }, confirmButton = { Button(onClick = { appStore.saveNutritionLog(todayLog.copy(entries = todayLog.entries.filterNot { it.id == id })); deletingFoodId = null }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))) { Text("Eliminar", color = Color.Black) } }, dismissButton = { TextButton(onClick = { deletingFoodId = null }) { Text("Cancelar", color = Text_Muted) } })
    }

    if (showGoalEditor) {
        NutritionGoalDialog(
            currentGoal = savedGoal ?: NutritionGoal(
                calories = savedMacros?.calories ?: 2500.0,
                protein = savedMacros?.protein ?: 150.0,
                carbs = savedMacros?.carbs ?: 250.0,
                fat = savedMacros?.fats ?: 70.0
            ),
            onDismiss = { showGoalEditor = false },
            onSave = { goal ->
                appStore.setNutritionGoal(goal)
                appStore.setMacroGoals(MacroGoals(goal.calories, goal.protein, goal.carbs, goal.fat))
                showGoalEditor = false
            }
        )
    }
}

@Composable
private fun FoodEntryEditorDialog(entry: FoodEntry, onDismiss: () -> Unit, onSave: (FoodEntry) -> Unit) {
    var name by remember { mutableStateOf(entry.name) }; var calories by remember { mutableStateOf(entry.calories.toInt().toString()) }; var protein by remember { mutableStateOf(entry.protein.toInt().toString()) }; var carbs by remember { mutableStateOf(entry.carbs.toInt().toString()) }; var fat by remember { mutableStateOf(entry.fat.toInt().toString()) }
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Editar comida", color = Text_White, fontWeight = FontWeight.Black) }, text = { Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { GoalInput("Nombre", name) { name = it }; GoalInput("Calorias", calories) { calories = it }; GoalInput("Proteina", protein) { protein = it }; GoalInput("Carbohidratos", carbs) { carbs = it }; GoalInput("Grasas", fat) { fat = it } } }, confirmButton = { Button(onClick = { onSave(entry.copy(name = name.ifBlank { entry.name }, calories = calories.toDoubleOrNull() ?: entry.calories, protein = protein.toDoubleOrNull() ?: entry.protein, carbs = carbs.toDoubleOrNull() ?: entry.carbs, fat = fat.toDoubleOrNull() ?: entry.fat)) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar", color = Color.Black) } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } })
}

@Composable
private fun NutritionSectionSelector(selected: Int, onSelect: (Int) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 16.dp, bottom = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        listOf("Hoy", "Cuerpo", "Historial").forEachIndexed { index, label ->
            TextButton(
                onClick = { onSelect(index) },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.textButtonColors(
                    containerColor = if (selected == index) MaterialTheme.colorScheme.primary.copy(alpha = 0.16f) else Color.Transparent,
                    contentColor = if (selected == index) MaterialTheme.colorScheme.primary else Text_Muted
                )
            ) { Text(label, fontWeight = FontWeight.Bold) }
        }
    }
}

@Composable
private fun NutritionBodySection(
    bodyLogs: List<BodyLog>,
    cardioSessions: List<CardioSession>,
    appStore: AppStore,
    today: String
) {
    var showWeightDialog by remember { mutableStateOf(false) }
    var showCardioDialog by remember { mutableStateOf(false) }
    val latest = bodyLogs.maxByOrNull { it.date }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(top = 8.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            SurfaceCard {
                Text("Cuerpo y cardio", fontSize = 27.sp, fontWeight = FontWeight.Black, color = Text_White)
                Spacer(Modifier.height(6.dp))
                Text("Registra tu progreso y las sesiones aerobicas sin salir de la app.", fontSize = 13.sp, color = Text_Muted)
                Spacer(Modifier.height(16.dp))
                Text(latest?.let { "${it.weight} kg" } ?: "Sin peso registrado", fontSize = 30.sp, fontWeight = FontWeight.Black, color = Text_White)
                latest?.bodyFat?.let { Text("${it}% grasa corporal", color = Text_Muted, fontSize = 13.sp) }
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = { showWeightDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) { Text("Registrar peso", color = Color.Black, fontWeight = FontWeight.Black) }
            }
        }
        item {
            Button(
                onClick = { showCardioDialog = true },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.Black)
                Spacer(Modifier.width(8.dp))
                Text("Agregar cardio", color = Color.Black, fontWeight = FontWeight.Black)
            }
        }
        if (bodyLogs.isNotEmpty()) {
            item { Text("Ultimos registros", fontWeight = FontWeight.Black, color = Text_White, fontSize = 18.sp) }
            items(bodyLogs.sortedByDescending { it.date }.take(8), key = { "body_${it.id}" }) { log ->
                SurfaceCard {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column { Text("${log.weight} kg", color = Text_White, fontWeight = FontWeight.Black, fontSize = 20.sp); log.bodyFat?.let { Text("${it}% grasa", color = Text_Muted, fontSize = 12.sp) } }
                        Column(horizontalAlignment = Alignment.End) { Text(formatEpochDay(log.date), color = Text_Muted, fontSize = 12.sp); TextButton(onClick = { appStore.deleteBodyLog(log.id) }, contentPadding = PaddingValues(0.dp)) { Text("Eliminar", color = Color(0xFFEF4444), fontSize = 10.sp) } }
                    }
                    log.notes?.takeIf { it.isNotBlank() }?.let { Text(it, color = Text_Muted, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp)) }
                }
            }
        }

        if (cardioSessions.isNotEmpty()) {
            item { Text("Cardio reciente", fontWeight = FontWeight.Black, color = Text_White, fontSize = 18.sp) }
            items(cardioSessions.sortedByDescending { it.timestamp }.take(8), key = { "cardio_${it.id}" }) { session ->
                SurfaceCard {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(cardioLabel(session.activityType), color = Text_White, fontWeight = FontWeight.Black)
                            Text("${session.durationMin.toInt()} min" + (session.distanceKm?.let { " · ${it} km" } ?: ""), color = Text_Muted, fontSize = 13.sp)
                        }
                        Column(horizontalAlignment = Alignment.End) { Text(session.date, color = Text_Muted, fontSize = 12.sp); TextButton(onClick = { appStore.deleteCardioSession(session.id) }, contentPadding = PaddingValues(0.dp)) { Text("Eliminar", color = Color(0xFFEF4444), fontSize = 10.sp) } }
                    }
                }
            }
        }
    }

    if (showWeightDialog) WeightLogDialog(latest, onDismiss = { showWeightDialog = false }) { weight, fat, notes ->
        appStore.saveBodyLog(BodyLog(id = System.currentTimeMillis(), date = System.currentTimeMillis(), weight = weight, bodyFat = fat, notes = notes))
        showWeightDialog = false
    }
    if (showCardioDialog) CardioLogDialog(today, onDismiss = { showCardioDialog = false }) { type, duration, distance, calories, heartRate, notes ->
        appStore.saveCardioSession(CardioSession(id = "cardio_${System.currentTimeMillis()}", date = today, activityType = type, durationMin = duration, distanceKm = distance, caloriesBurned = calories, avgHeartRate = heartRate, notes = notes, timestamp = System.currentTimeMillis()))
        showCardioDialog = false
    }
}

@Composable
private fun NutritionHistorySection(nutritionLogs: List<NutritionLog>, bodyLogs: List<BodyLog>, cardioSessions: List<CardioSession>) {
    val days = nutritionLogs.sortedByDescending { it.date }.take(14)
    val averageCalories = if (days.isEmpty()) 0 else days.map { it.entries.sumOf { entry -> entry.calories } }.average().toInt()
    val averageProtein = if (days.isEmpty()) 0 else days.map { it.entries.sumOf { entry -> entry.protein } }.average().toInt()
    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(top = 8.dp, bottom = 110.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            SurfaceCard {
                Text("Historial reciente", fontSize = 27.sp, fontWeight = FontWeight.Black, color = Text_White)
                Spacer(Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    MiniMetric("Promedio", "$averageCalories kcal")
                    MiniMetric("Proteina", "$averageProtein g")
                    MiniMetric("Cardio", "${cardioSessions.size}")
                }
            }
        }
        item { Text("Ultimos 14 dias con registro", color = Text_Muted, fontSize = 13.sp) }
        items(days, key = { "nutrition_${it.date}" }) { day ->
            val calories = day.entries.sumOf { it.calories }.toInt()
            val protein = day.entries.sumOf { it.protein }.toInt()
            SurfaceCard {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column { Text(day.date, color = Text_White, fontWeight = FontWeight.Black); Text("${day.entries.size} comidas · ${protein} g proteina", color = Text_Muted, fontSize = 12.sp) }
                    Text("$calories kcal", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
                }
            }
        }
        if (days.isEmpty()) item { Text("Aun no hay dias de nutricion registrados.", modifier = Modifier.fillMaxWidth().padding(24.dp), color = Text_Muted, textAlign = TextAlign.Center) }
    }
}

@Composable
private fun MiniMetric(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = Text_White, fontWeight = FontWeight.Black, fontSize = 16.sp)
        Text(label, color = Text_Muted, fontSize = 11.sp)
    }
}

@Composable
private fun WeightLogDialog(latest: BodyLog?, onDismiss: () -> Unit, onSave: (Double, Double?, String?) -> Unit) {
    var weight by remember { mutableStateOf(latest?.weight?.toString() ?: "") }
    var fat by remember { mutableStateOf(latest?.bodyFat?.toString() ?: "") }
    var notes by remember { mutableStateOf("") }
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Registrar peso", color = Text_White, fontWeight = FontWeight.Black) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) { GoalInput("Peso (kg)", weight) { weight = it }; GoalInput("Grasa corporal (%) opcional", fat) { fat = it }; GoalInput("Notas opcionales", notes) { notes = it } }
    }, confirmButton = { Button(onClick = { weight.toDoubleOrNull()?.let { onSave(it, fat.toDoubleOrNull(), notes.takeIf(String::isNotBlank)) } }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar", color = Color.Black) } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } })
}

@Composable
private fun CardioLogDialog(date: String, onDismiss: () -> Unit, onSave: (CardioActivityType, Double, Double?, Double?, Double?, String?) -> Unit) {
    var selected by remember { mutableStateOf(CardioActivityType.RUNNING) }; var duration by remember { mutableStateOf("") }; var distance by remember { mutableStateOf("") }; var calories by remember { mutableStateOf("") }; var heartRate by remember { mutableStateOf("") }; var notes by remember { mutableStateOf("") }
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Agregar cardio", color = Text_White, fontWeight = FontWeight.Black) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) { listOf(CardioActivityType.RUNNING, CardioActivityType.CYCLING, CardioActivityType.WALKING).forEach { type -> TextButton(onClick = { selected = type }, colors = ButtonDefaults.textButtonColors(contentColor = if (selected == type) MaterialTheme.colorScheme.primary else Text_Muted)) { Text(cardioLabel(type), fontSize = 11.sp) } } }
            GoalInput("Duracion (min)", duration) { duration = it }; GoalInput("Distancia (km) opcional", distance) { distance = it }; GoalInput("Calorias opcional", calories) { calories = it }; GoalInput("FC media opcional", heartRate) { heartRate = it }; GoalInput("Notas opcionales", notes) { notes = it }
        }
    }, confirmButton = { Button(onClick = { duration.toDoubleOrNull()?.takeIf { it > 0 }?.let { onSave(selected, it, distance.toDoubleOrNull(), calories.toDoubleOrNull(), heartRate.toDoubleOrNull(), notes.takeIf(String::isNotBlank)) } }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar", color = Color.Black) } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } })
}

private fun cardioLabel(type: CardioActivityType): String = when (type) { CardioActivityType.RUNNING -> "Correr"; CardioActivityType.CYCLING -> "Bici"; CardioActivityType.SWIMMING -> "Nadar"; CardioActivityType.WALKING -> "Caminar"; CardioActivityType.ROWING -> "Remo"; CardioActivityType.ELLIPTICAL -> "Eliptica"; CardioActivityType.JUMP_ROPE -> "Soga"; CardioActivityType.HIIT -> "HIIT"; CardioActivityType.OTHER -> "Otro" }
private fun formatEpochDay(epochMillis: Long): String { val d = kotlinx.datetime.Instant.fromEpochMilliseconds(epochMillis).toLocalDateTime(TimeZone.currentSystemDefault()).date; return "${d.dayOfMonth.toString().padStart(2, '0')}/${d.monthNumber.toString().padStart(2, '0')}/${d.year}" }

@Composable
private fun NutritionGoalDialog(
    currentGoal: NutritionGoal,
    onDismiss: () -> Unit,
    onSave: (NutritionGoal) -> Unit
) {
    var calories by remember(currentGoal) { mutableStateOf(currentGoal.calories.toInt().toString()) }
    var protein by remember(currentGoal) { mutableStateOf(currentGoal.protein.toInt().toString()) }
    var carbs by remember(currentGoal) { mutableStateOf(currentGoal.carbs.toInt().toString()) }
    var fat by remember(currentGoal) { mutableStateOf(currentGoal.fat.toInt().toString()) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Dark_Surface,
        title = { Text("Objetivo nutricional", color = Text_White, fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                GoalInput("Calorias", calories) { calories = it }
                GoalInput("Proteina (g)", protein) { protein = it }
                GoalInput("Carbohidratos (g)", carbs) { carbs = it }
                GoalInput("Grasas (g)", fat) { fat = it }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onSave(NutritionGoal(
                        calories = calories.toDoubleOrNull() ?: currentGoal.calories,
                        protein = protein.toDoubleOrNull() ?: currentGoal.protein,
                        carbs = carbs.toDoubleOrNull() ?: currentGoal.carbs,
                        fat = fat.toDoubleOrNull() ?: currentGoal.fat
                    ))
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) { Text("Guardar", color = Color.Black, fontWeight = FontWeight.Bold) }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } }
    )
}

@Composable
private fun GoalInput(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        modifier = Modifier.fillMaxWidth(),
        textStyle = LocalTextStyle.current.copy(color = Text_White),
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor = Color.White.copy(alpha = 0.12f),
            focusedTextColor = Text_White,
            unfocusedTextColor = Text_White,
            focusedLabelColor = MaterialTheme.colorScheme.primary,
            unfocusedLabelColor = Text_Muted
        )
    )
}

@Composable
fun PremiumActiveSessionView(
    session: ActiveSession,
    appStore: AppStore,
    onStartTimer: (Int) -> Unit,
    onSessionCompleted: (Log) -> Unit
) {
    var exercisesList by remember(session) { mutableStateOf(session.exercises) }
    var showPlateCalculator by remember { mutableStateOf(false) }
    var pickerTargetInstanceId by remember { mutableStateOf<Int?>(null) }
    var exercisePickerQuery by remember { mutableStateOf("") }
    var setTypeTarget by remember { mutableStateOf<Pair<Int, Int>?>(null) }
    var warmupTarget by remember { mutableStateOf<SessionExercise?>(null) }
    var detailExercise by remember { mutableStateOf<SessionExercise?>(null) }
    var showRestSettings by remember { mutableStateOf(false) }
    var restPresetSeconds by remember { mutableStateOf(90) }
    var showProtocolTimer by remember { mutableStateOf(false) }
    var pendingFinish by remember { mutableStateOf<Log?>(null) }
    var showDiscardConfirmation by remember { mutableStateOf(false) }
    var supersetSourceInstanceId by remember { mutableStateOf<Int?>(null) }
    val appState by appStore.state.collectAsState()
    val previousLogs by appStore.workoutLogs.collectAsState(initial = emptyList())

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

    fun addWarmupSet(exerciseInstanceId: Int) {
        val updated = exercisesList.map { exercise ->
            if (exercise.instanceId == exerciseInstanceId) {
                val nextId = (exercise.sets.maxOfOrNull { it.id } ?: 0) + 1
                val reference = exercise.sets.firstOrNull()
                exercise.copy(sets = listOf(WorkoutSet(id = nextId, weight = reference?.weight ?: "", reps = "10", type = SetType.WARMUP)) + exercise.sets)
            } else exercise
        }
        updateSessionExercises(updated)
    }

    fun insertWarmupLadder(exerciseInstanceId: Int, targetWeight: Double) {
        val updated = exercisesList.map { exercise ->
            if (exercise.instanceId == exerciseInstanceId) {
                val firstId = (exercise.sets.maxOfOrNull { it.id } ?: 0) + 1
                val ladder = listOf(0.5 to 8, 0.7 to 5, 0.85 to 3).mapIndexed { index, (ratio, reps) ->
                    WorkoutSet(id = firstId + index, weight = (targetWeight * ratio).toInt().toString(), reps = reps.toString(), type = SetType.WARMUP)
                }
                exercise.copy(sets = ladder + exercise.sets)
            } else exercise
        }
        updateSessionExercises(updated)
    }

    fun requestFinish() {
        pendingFinish = Log(
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
    }

    fun moveExercise(instanceId: Int, delta: Int) {
        val from = exercisesList.indexOfFirst { it.instanceId == instanceId }
        val to = from + delta
        if (from !in exercisesList.indices || to !in exercisesList.indices) return
        val reordered = exercisesList.toMutableList()
        val item = reordered.removeAt(from)
        reordered.add(to, item)
        updateSessionExercises(reordered)
    }

    fun removeExercise(instanceId: Int) {
        updateSessionExercises(exercisesList.filterNot { it.instanceId == instanceId })
        if (supersetSourceInstanceId == instanceId) supersetSourceInstanceId = null
    }

    fun toggleSuperset(instanceId: Int) {
        val current = exercisesList.firstOrNull { it.instanceId == instanceId } ?: return
        if (current.supersetId != null) {
            updateSessionExercises(exercisesList.map { if (it.instanceId == instanceId) it.copy(supersetId = null) else it })
            return
        }
        val sourceId = supersetSourceInstanceId
        if (sourceId == null || sourceId == instanceId) {
            supersetSourceInstanceId = instanceId
            return
        }
        val groupId = "ss_${System.currentTimeMillis()}"
        updateSessionExercises(exercisesList.map {
            if (it.instanceId == sourceId || it.instanceId == instanceId) it.copy(supersetId = groupId) else it
        })
        supersetSourceInstanceId = null
    }

    fun selectExercise(definition: ExerciseDef) {
        val target = pickerTargetInstanceId
        val existing = exercisesList.firstOrNull { it.instanceId == target }
        val seedSets = existing?.sets?.map { set ->
            set.copy(weight = "", reps = "", rpe = "", completed = false)
        } ?: List(3) { index -> WorkoutSet(id = index + 1) }
        val sessionExercise = SessionExercise(
            id = definition.id,
            name = definition.name,
            muscle = definition.muscle,
            instructions = definition.instructions,
            defaultCardioType = definition.defaultCardioType,
            videoId = definition.videoId,
            isBodyweight = definition.isBodyweight,
            volumeCountingMode = definition.volumeCountingMode,
            isIsometric = definition.isIsometric,
            isometricTargetSecs = definition.isometricTargetSecs,
            skillFamily = definition.skillFamily,
            skillLevel = definition.skillLevel,
            progressionNext = definition.progressionNext,
            progressionPrev = definition.progressionPrev,
            defaultRestSeconds = definition.defaultRestSeconds,
            source = definition.source,
            instanceId = existing?.instanceId ?: System.currentTimeMillis().toInt(),
            slotLabel = definition.muscle.name,
            sets = seedSets
        )
        updateSessionExercises(
            if (existing == null) exercisesList + sessionExercise
            else exercisesList.map { if (it.instanceId == target) sessionExercise else it }
        )
        pickerTargetInstanceId = null
        exercisePickerQuery = ""
    }

    val totalSets = exercisesList.sumOf { it.sets.size }
    val completedSets = exercisesList.sumOf { exercise -> exercise.sets.count { it.completed } }

    Box(modifier = Modifier.fillMaxSize()) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 12.dp),
        contentPadding = PaddingValues(top = 12.dp, bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            SurfaceCard(contentPadding = PaddingValues(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = session.name, fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Spacer(modifier = Modifier.height(6.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AccentChip("Semana ${session.week}", selected = true)
                            AccentChip("$completedSets/$totalSets series")
                        }
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedButton(
                    onClick = { showPlateCalculator = true },
                    modifier = Modifier.fillMaxWidth().height(44.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.08f)),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Text_White)
                ) { Text("Calculador de discos", fontWeight = FontWeight.Bold) }
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    TextButton(onClick = { pickerTargetInstanceId = -1 }) { Text("+ Ejercicio", color = Text_White, fontSize = 11.sp) }
                    TextButton(onClick = { showRestSettings = true }) { Text("Descanso ${restPresetSeconds}s", color = Text_Muted, fontSize = 11.sp) }
                    TextButton(onClick = { showProtocolTimer = true }) { Text("Protocolos", color = MaterialTheme.colorScheme.primary, fontSize = 11.sp) }
                    TextButton(onClick = { showDiscardConfirmation = true }) { Text("Descartar", color = Color(0xFFEF4444), fontSize = 11.sp) }
                }
            }
        }

        items(exercisesList, key = { it.instanceId }) { exercise ->
            SurfaceCard(contentPadding = PaddingValues(14.dp)) {
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
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            AccentChip(text = exercise.muscle.name, selected = true)
                            exercise.supersetId?.let { AccentChip("Superserie", selected = true) }
                            TextButton(onClick = { detailExercise = exercise }, contentPadding = PaddingValues(0.dp)) { Text("Detalle", color = MaterialTheme.colorScheme.primary, fontSize = 11.sp) }
                        }
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
                Row(
                    modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(2.dp)
                ) {
                    TextButton(onClick = { warmupTarget = exercise }) { Text("Warm-up", color = Color(0xFFFACC15), fontSize = 11.sp) }
                    TextButton(onClick = { moveExercise(exercise.instanceId, -1) }) { Text("Subir", color = Text_Muted, fontSize = 11.sp) }
                    TextButton(onClick = { moveExercise(exercise.instanceId, 1) }) { Text("Bajar", color = Text_Muted, fontSize = 11.sp) }
                    TextButton(onClick = { toggleSuperset(exercise.instanceId) }) {
                        val isSource = supersetSourceInstanceId == exercise.instanceId
                        Text(
                            when {
                                exercise.supersetId != null -> "Quitar SS"
                                isSource -> "Elegí pareja"
                                else -> "Superserie"
                            },
                            color = if (exercise.supersetId != null || isSource) MaterialTheme.colorScheme.primary else Text_Muted,
                            fontSize = 11.sp
                        )
                    }
                    TextButton(onClick = { pickerTargetInstanceId = exercise.instanceId }) { Text("Reemplazar", color = MaterialTheme.colorScheme.primary, fontSize = 11.sp) }
                    TextButton(onClick = { removeExercise(exercise.instanceId) }) { Text("Quitar", color = Color(0xFFEF4444), fontSize = 11.sp) }
                }
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("SERIE", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.width(88.dp))
                    Text("PESO", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.width(72.dp), textAlign = TextAlign.Center)
                    Text("REPS", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.width(72.dp), textAlign = TextAlign.Center)
                    if (appState.appSettings.showRir) Text("RIR", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.width(52.dp), textAlign = TextAlign.Center)
                    Text("OK", fontSize = 10.sp, color = Text_Muted, modifier = Modifier.width(62.dp), textAlign = TextAlign.Center)
                }

                Spacer(modifier = Modifier.height(8.dp))

                exercise.sets.forEachIndexed { setIndex, set ->
                    val isChecked = set.completed

                    if (!set.hintWeight.isNullOrBlank() || !set.hintReps.isNullOrBlank()) {
                        Text(
                            text = "Anterior: ${set.hintWeight ?: "-"} kg × ${set.hintReps ?: "-"}",
                            color = Text_Muted,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(start = 8.dp, bottom = 3.dp)
                        )
                    }

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
                            .padding(horizontal = 12.dp, vertical = 5.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = if (set.type == SetType.WARMUP) "W" else "${setIndex + 1}",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Text_Muted,
                            modifier = Modifier.width(30.dp)
                        )
                        Text(
                            text = set.type.name.replace('_', ' '),
                            color = if (set.type == SetType.REGULAR) Text_Muted else MaterialTheme.colorScheme.primary,
                            fontSize = 8.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.width(58.dp).clickable { setTypeTarget = exercise.instanceId to set.id }
                        )
                        WorkoutSetInput(
                            value = set.weight,
                            onValueChange = { value ->
                                updateSet(exercise.instanceId, set.id) { current -> current.copy(weight = value) }
                            },
                            modifier = Modifier.width(72.dp).height(44.dp)
                        )
                        WorkoutSetInput(
                            value = set.reps,
                            onValueChange = { value ->
                                updateSet(exercise.instanceId, set.id) { current -> current.copy(reps = value) }
                            },
                            modifier = Modifier.width(72.dp).height(44.dp)
                        )
                        if (appState.appSettings.showRir) WorkoutSetInput(
                            value = set.rpe,
                            onValueChange = { value ->
                                updateSet(exercise.instanceId, set.id) { current -> current.copy(rpe = value) }
                            },
                            modifier = Modifier.width(52.dp).height(44.dp)
                        )

                        Box(
                            modifier = Modifier.width(62.dp),
                            contentAlignment = Alignment.CenterEnd
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    "×",
                                    color = if (exercise.sets.size > 1) Color.Red else Text_Muted,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 18.sp,
                                    modifier = Modifier.padding(6.dp).clickable(enabled = exercise.sets.size > 1) { removeSet(exercise.instanceId, set.id) }
                                )
                                Checkbox(
                                    checked = isChecked,
                                    onCheckedChange = { checked ->
                                        updateSet(exercise.instanceId, set.id) { current -> current.copy(completed = checked) }
                                        if (checked) onStartTimer(restPresetSeconds)
                                    },
                                    colors = CheckboxDefaults.colors(
                                        checkedColor = MaterialTheme.colorScheme.primary,
                                        checkmarkColor = Color.Black
                                    )
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))
                }
            }
        }
    }

        Surface(
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth(),
            color = OLED_Black.copy(alpha = 0.96f),
            shadowElevation = 14.dp
        ) {
            Button(
                onClick = ::requestFinish,
                modifier = Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 16.dp, vertical = 10.dp).height(52.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Finalizar entrenamiento", color = Color.Black, fontWeight = FontWeight.Black)
            }
        }
    }

    if (showPlateCalculator) {
        com.gainslab.ironlog.ui.PlateCalculatorView(
            onDismiss = { showPlateCalculator = false }
        )
    }

    warmupTarget?.let { exercise ->
        WarmupPlannerDialog(
            exercise = exercise,
            onDismiss = { warmupTarget = null },
            onInsert = { targetWeight -> insertWarmupLadder(exercise.instanceId, targetWeight); warmupTarget = null }
        )
    }

    detailExercise?.let { exercise ->
        ExerciseRuntimeDetailDialog(exercise = exercise, onDismiss = { detailExercise = null })
    }

    if (showRestSettings) RestPresetDialog(
        currentSeconds = restPresetSeconds,
        onDismiss = { showRestSettings = false },
        onSave = { restPresetSeconds = it; showRestSettings = false }
    )

    if (showProtocolTimer) ProtocolTimerDialog(onDismiss = { showProtocolTimer = false })

    if (showDiscardConfirmation) {
        AlertDialog(
            onDismissRequest = { showDiscardConfirmation = false }, containerColor = Dark_Surface,
            title = { Text("Descartar sesion?", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Text("Se perderan las series sin guardar de esta sesion.", color = Text_Muted) },
            confirmButton = { Button(onClick = { appStore.setActiveSession(null); showDiscardConfirmation = false }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))) { Text("Descartar", color = Color.Black, fontWeight = FontWeight.Bold) } },
            dismissButton = { TextButton(onClick = { showDiscardConfirmation = false }) { Text("Cancelar", color = Text_Muted) } }
        )
    }

    pendingFinish?.let { completedLog ->
        val prs = remember(completedLog, previousLogs) { detectSessionPrs(completedLog, previousLogs.filter { it.id != completedLog.id }) }
        FinishWorkoutDialog(
            prs = prs,
            onDismiss = { pendingFinish = null },
            onConfirm = { feedback ->
                val finalized = completedLog.copy(note = feedback.takeIf { it.isNotBlank() })
                appStore.saveWorkoutLog(finalized)
                appStore.setActiveSession(null)
                pendingFinish = null
                onSessionCompleted(finalized)
            }
        )
    }

    setTypeTarget?.let { (exerciseInstanceId, setId) ->
        AlertDialog(
            onDismissRequest = { setTypeTarget = null },
            containerColor = Dark_Surface,
            title = { Text("Tipo de serie", color = Text_White, fontWeight = FontWeight.Black) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    SetType.entries.forEach { type ->
                        TextButton(
                            onClick = {
                                updateSet(exerciseInstanceId, setId) { it.copy(type = type) }
                                setTypeTarget = null
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(type.name.replace('_', ' '), color = if (type == SetType.REGULAR) Text_White else MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { setTypeTarget = null }) { Text("Cancelar", color = Text_Muted) } }
        )
    }

    if (pickerTargetInstanceId != null) {
        val candidates = remember(appState.exercises, exercisePickerQuery) {
            val query = exercisePickerQuery.trim()
            appState.exercises.filter { query.isBlank() || it.name.get("es").contains(query, ignoreCase = true) }.take(40)
        }
        AlertDialog(
            onDismissRequest = { pickerTargetInstanceId = null },
            containerColor = Dark_Surface,
            title = { Text(if (pickerTargetInstanceId == -1) "Anadir ejercicio" else "Reemplazar ejercicio", color = Text_White, fontWeight = FontWeight.Black) },
            text = {
                Column {
                    OutlinedTextField(
                        value = exercisePickerQuery,
                        onValueChange = { exercisePickerQuery = it },
                        label = { Text("Buscar ejercicio") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.12f),
                            focusedTextColor = Text_White,
                            unfocusedTextColor = Text_White,
                            focusedLabelColor = MaterialTheme.colorScheme.primary,
                            unfocusedLabelColor = Text_Muted
                        )
                    )
                    Spacer(Modifier.height(8.dp))
                    LazyColumn(modifier = Modifier.heightIn(max = 360.dp)) {
                        items(candidates, key = { it.id }) { definition ->
                            TextButton(onClick = { selectExercise(definition) }, modifier = Modifier.fillMaxWidth()) {
                                Column(modifier = Modifier.fillMaxWidth()) {
                                    Text(definition.name.get("es"), color = Text_White, fontWeight = FontWeight.Bold)
                                    Text(definition.muscle.name, color = Text_Muted, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = { TextButton(onClick = { pickerTargetInstanceId = null }) { Text("Cancelar", color = Text_Muted) } }
        )
    }
}

@Composable
private fun SessionSummaryScreen(log: Log, onClose: () -> Unit) {
    val completedSets = log.exercises.sumOf { exercise -> exercise.sets.count { it.completed } }
    val totalSets = log.exercises.sumOf { it.sets.size }
    val volume = log.exercises.sumOf { exercise -> exercise.sets.sumOf { set -> getSetLoadVolume(set, exercise) } }
    val durationMinutes = (log.duration / 60).coerceAtLeast(1)

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(horizontal = 4.dp),
        contentPadding = PaddingValues(top = 16.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SurfaceCard {
                Text("Sesion completada", color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                Spacer(Modifier.height(8.dp))
                Text(log.name, color = Text_White, fontSize = 30.sp, fontWeight = FontWeight.Black)
                Spacer(Modifier.height(8.dp))
                Text("El registro ya quedo guardado offline y estara listo para sincronizar cuando lo decidas.", color = Text_Muted, fontSize = 13.sp)
            }
        }
        item {
            SurfaceCard {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    SummaryMetric("Duracion", "${durationMinutes} min")
                    SummaryMetric("Series", "$completedSets/$totalSets")
                    SummaryMetric("Volumen", "${volume.toInt()} kg")
                }
            }
        }
        item {
            SurfaceCard {
                Text("Ejercicios", color = Text_White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(10.dp))
                log.exercises.forEachIndexed { index, exercise ->
                    Text(exercise.name.get("es"), color = Text_White, fontWeight = FontWeight.Bold)
                    Text("${exercise.sets.count { it.completed }}/${exercise.sets.size} series completadas", color = Text_Muted, fontSize = 12.sp)
                    if (index != log.exercises.lastIndex) Spacer(Modifier.height(12.dp))
                }
            }
        }
        item {
            Button(
                onClick = onClose,
                modifier = Modifier.fillMaxWidth().height(54.dp),
                shape = RoundedCornerShape(18.dp),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) { Text("Volver a entrenar", color = Color.Black, fontWeight = FontWeight.Black) }
        }
    }
}

@Composable
private fun SummaryMetric(label: String, value: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, color = Text_White, fontSize = 18.sp, fontWeight = FontWeight.Black)
        Text(label, color = Text_Muted, fontSize = 11.sp)
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
private fun WarmupPlannerDialog(exercise: SessionExercise, onDismiss: () -> Unit, onInsert: (Double) -> Unit) {
    var target by remember { mutableStateOf(exercise.sets.firstOrNull { it.type != SetType.WARMUP }?.weight ?: "") }
    val targetValue = target.toDoubleOrNull() ?: 0.0
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Warm-up progresivo", color = Text_White, fontWeight = FontWeight.Black) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(exercise.name.get("es"), color = Text_Muted, fontSize = 13.sp)
            GoalInput("Peso de trabajo (kg)", target) { target = it }
            if (targetValue > 0) Text("50% × 8 · ${(targetValue * .5).toInt()} kg\n70% × 5 · ${(targetValue * .7).toInt()} kg\n85% × 3 · ${(targetValue * .85).toInt()} kg", color = MaterialTheme.colorScheme.primary, fontSize = 13.sp)
        }
    }, confirmButton = { Button(onClick = { if (targetValue > 0) onInsert(targetValue) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Insertar", color = Color.Black) } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } })
}

@Composable
private fun ExerciseRuntimeDetailDialog(exercise: SessionExercise, onDismiss: () -> Unit) {
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text(exercise.name.get("es"), color = Text_White, fontWeight = FontWeight.Black) }, text = {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(exercise.muscle.name, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            Text(exercise.instructions?.get("es")?.ifBlank { "Sin instrucciones cargadas." } ?: "Sin instrucciones cargadas.", color = Text_Muted, fontSize = 13.sp)
            exercise.defaultRestSeconds?.let { Text("Descanso sugerido: ${it}s", color = Text_White, fontSize = 13.sp) }
            exercise.progressionPrev?.let { Text("Progresion previa: $it", color = Text_Muted, fontSize = 12.sp) }
            exercise.progressionNext?.let { Text("Siguiente progresion: $it", color = Text_Muted, fontSize = 12.sp) }
            exercise.videoId?.let { Text("Video: $it", color = Text_Muted, fontSize = 12.sp) }
        }
    }, confirmButton = { TextButton(onClick = onDismiss) { Text("Cerrar", color = MaterialTheme.colorScheme.primary) } })
}

@Composable
private fun RestPresetDialog(currentSeconds: Int, onDismiss: () -> Unit, onSave: (Int) -> Unit) {
    var value by remember { mutableStateOf(currentSeconds.toString()) }
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Descanso entre series", color = Text_White, fontWeight = FontWeight.Black) }, text = { Column { GoalInput("Segundos", value) { value = it }; Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) { listOf(60, 90, 120, 180).forEach { seconds -> TextButton(onClick = { value = seconds.toString() }) { Text("${seconds}s", color = Text_Muted, fontSize = 11.sp) } } } } }, confirmButton = { Button(onClick = { onSave((value.toIntOrNull() ?: currentSeconds).coerceIn(15, 900)) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar", color = Color.Black) } }, dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } })
}

@Composable
private fun ProtocolTimerDialog(onDismiss: () -> Unit) {
    var protocol by remember { mutableStateOf("EMOM") }
    var remaining by remember { mutableStateOf(60) }
    var running by remember { mutableStateOf(false) }
    LaunchedEffect(running, remaining) { if (running && remaining > 0) { delay(1000); remaining -= 1 } else if (remaining == 0) running = false }
    AlertDialog(onDismissRequest = onDismiss, containerColor = Dark_Surface, title = { Text("Timer de protocolo", color = Text_White, fontWeight = FontWeight.Black) }, text = {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row { listOf("EMOM", "Tabata", "Intervalos").forEach { name -> TextButton(onClick = { protocol = name; remaining = if (name == "Tabata") 20 else 60; running = false }) { Text(name, color = if (protocol == name) MaterialTheme.colorScheme.primary else Text_Muted, fontSize = 11.sp) } } }
            Text(formatTime(remaining), color = Text_White, fontSize = 40.sp, fontWeight = FontWeight.Black)
            Text(if (protocol == "Tabata") "20s trabajo / 10s descanso" else if (protocol == "EMOM") "Nueva ronda cada minuto" else "Intervalo configurable", color = Text_Muted, fontSize = 12.sp)
            Button(onClick = { running = !running }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text(if (running) "Pausar" else "Iniciar", color = Color.Black) }
        }
    }, confirmButton = {}, dismissButton = { TextButton(onClick = onDismiss) { Text("Cerrar", color = Text_Muted) } })
}

private fun detectSessionPrs(candidate: Log, previous: List<Log>): List<String> {
    val historicalMax = mutableMapOf<String, Double>()
    previous.filter { it.skipped != true }.flatMap { it.exercises }.forEach { ex -> ex.sets.filter { it.completed }.forEach { set -> historicalMax[ex.id] = maxOf(historicalMax[ex.id] ?: 0.0, set.weight.toDoubleOrNull() ?: 0.0) } }
    return candidate.exercises.mapNotNull { ex ->
        val current = ex.sets.filter { it.completed }.maxOfOrNull { it.weight.toDoubleOrNull() ?: 0.0 } ?: return@mapNotNull null
        if (current > 0 && current > (historicalMax[ex.id] ?: 0.0)) "${ex.name.get("es")}: ${current} kg" else null
    }
}

private fun buildHistoryCsv(logs: List<Log>): String {
    val header = "fecha,sesion,semana,ejercicio,serie,tipo,peso_kg,reps,rpe,completada"
    val rows = logs.sortedByDescending { it.endTime }.flatMap { log ->
        log.exercises.flatMap { exercise ->
            exercise.sets.map { set ->
                listOf(
                    formatEpochDay(log.endTime), log.name, log.week.toString(), exercise.name.get("es"), set.id.toString(), set.type.name,
                    set.weight, set.reps, set.rpe, set.completed.toString()
                ).joinToString(",") { value -> "\"${value.replace("\"", "\"\"")}\"" }
            }
        }
    }
    return (listOf(header) + rows).joinToString("\n")
}

@Composable
private fun FinishWorkoutDialog(prs: List<String>, onDismiss: () -> Unit, onConfirm: (String) -> Unit) {
    var feedback by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Dark_Surface,
        title = { Text(if (prs.isEmpty()) "Cerrar entrenamiento" else "Nuevos PRs", color = Text_White, fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                if (prs.isNotEmpty()) prs.forEach { Text("★ $it", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold) }
                GoalInput("Como te sentiste? (opcional)", feedback) { feedback = it }
            }
        },
        confirmButton = { Button(onClick = { onConfirm(feedback) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar sesion", color = Color.Black) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Volver", color = Text_Muted) } }
    )
}

@Composable
fun PremiumHistoryTab(workoutLogs: List<Log>, appStore: AppStore) {
    var expandedLogId by remember { mutableStateOf<Long?>(null) }
    var pendingDelete by remember { mutableStateOf<Log?>(null) }
    var lastDeleted by remember { mutableStateOf<Log?>(null) }
    var csvCopied by remember { mutableStateOf(false) }
    val clipboard = LocalClipboardManager.current
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
                Spacer(modifier = Modifier.height(8.dp))
                TextButton(onClick = { clipboard.setText(AnnotatedString(buildHistoryCsv(workoutLogs))); csvCopied = true }) {
                    Text(if (csvCopied) "CSV copiado al portapapeles" else "Copiar CSV", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                }
            }
        }

        lastDeleted?.let { deleted ->
            item {
                SurfaceCard {
                    Text("Registro eliminado", color = Text_White, fontWeight = FontWeight.Bold)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text(deleted.name, color = Text_Muted, fontSize = 12.sp)
                        TextButton(onClick = { appStore.saveWorkoutLog(deleted); lastDeleted = null }) { Text("Deshacer", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold) }
                    }
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
            items(workoutLogs, key = { it.id }) { log ->
                val isExpanded = expandedLogId == log.id
                val volume = log.exercises.sumOf { exercise -> exercise.sets.sumOf { set -> getSetLoadVolume(set, exercise) } }
                SurfaceCard(contentPadding = PaddingValues(18.dp), modifier = Modifier.clickable { expandedLogId = if (isExpanded) null else log.id }) {
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
                    if (isExpanded) {
                        Spacer(Modifier.height(14.dp))
                        Text("${volume.toInt()} kg de volumen · ${log.exercises.sumOf { it.sets.count { set -> set.completed } }} series completadas", color = Text_Muted, fontSize = 12.sp)
                        Spacer(Modifier.height(10.dp))
                        log.exercises.forEach { exercise ->
                            Text("• ${exercise.name}: ${exercise.sets.count { it.completed }}/${exercise.sets.size} series", color = Text_White, fontSize = 13.sp, modifier = Modifier.padding(vertical = 2.dp))
                        }
                        TextButton(onClick = { pendingDelete = log }, modifier = Modifier.align(Alignment.End)) {
                            Text("Eliminar registro", color = Color(0xFFF87171), fontWeight = FontWeight.Bold)
                        }
                    } else {
                        Spacer(Modifier.height(10.dp))
                        log.exercises.take(3).forEach { exercise ->
                            val best = exercise.sets.filter { it.completed }.maxByOrNull { it.weight.toDoubleOrNull() ?: 0.0 }
                            Text("${exercise.name.get("es")}: " + (best?.let { "${it.weight} kg × ${it.reps}" } ?: "sin series"), color = Text_Muted, fontSize = 12.sp, modifier = Modifier.padding(vertical = 2.dp))
                        }
                    }
                }
            }
        }
    }
    pendingDelete?.let { log ->
        AlertDialog(
            onDismissRequest = { pendingDelete = null },
            containerColor = Dark_Surface,
            title = { Text("Eliminar entrenamiento", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Text("Se eliminara '${log.name}' del historial local. Esta accion no se puede deshacer.", color = Text_Muted) },
            confirmButton = { Button(onClick = { appStore.deleteWorkoutLog(log.id); lastDeleted = log; pendingDelete = null }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE05252))) { Text("Eliminar", color = Color.Black, fontWeight = FontWeight.Bold) } },
            dismissButton = { TextButton(onClick = { pendingDelete = null }) { Text("Cancelar", color = Text_Muted) } }
        )
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
    onViewStats: () -> Unit,
    onManageAccount: () -> Unit
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
                HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                SettingsActionRow(
                    icon = Icons.Default.Favorite,
                    title = "Cuenta y sincronizacion",
                    subtitle = "Ingresar, importar tu PWA o subir este dispositivo"
                ) { onManageAccount() }
                if (state.activeMeso != null && state.program.isNotEmpty()) {
                    HorizontalDivider(color = Color.White.copy(alpha = 0.05f))
                    SettingsActionRow(
                        icon = Icons.Default.Add,
                        title = "Guardar rutina como plantilla privada",
                        subtitle = "Disponible en Plantillas y sincronizada con tu cuenta"
                    ) { appStore.saveCurrentProgramAsPersonalTemplate(state.activeMeso.name ?: "Mi rutina") }
                }
            }
        }

        item {
            SurfaceCard {
                Text("Preferencias de entrenamiento", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Text_White)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Estas preferencias se guardan en el dispositivo y se aplican en el flujo de entrenamiento.", fontSize = 13.sp, color = Text_Muted)
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column { Text("Mostrar RIR", color = Text_White, fontWeight = FontWeight.Bold); Text("Muestra el campo de esfuerzo junto a cada serie", color = Text_Muted, fontSize = 11.sp) }
                    Switch(checked = state.appSettings.showRir, onCheckedChange = { appStore.setAppSettings(state.appSettings.copy(showRir = it)) })
                }
                Spacer(modifier = Modifier.height(10.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column { Text("Mantener pantalla activa", color = Text_White, fontWeight = FontWeight.Bold); Text("Preferencia guardada para las sesiones", color = Text_Muted, fontSize = 11.sp) }
                    Switch(checked = state.appSettings.keepScreenOn, onCheckedChange = { appStore.setAppSettings(state.appSettings.copy(keepScreenOn = it)) })
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text("Idioma", color = Text_Muted, fontSize = 12.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(selected = state.appSettings.language == Lang.ES, onClick = { appStore.setAppSettings(state.appSettings.copy(language = Lang.ES)) }, label = { Text("Español") })
                    FilterChip(selected = state.appSettings.language == Lang.EN, onClick = { appStore.setAppSettings(state.appSettings.copy(language = Lang.EN)) }, label = { Text("English") })
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text("Tema", color = Text_Muted, fontSize = 12.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Theme.entries.forEach { option -> FilterChip(selected = state.appSettings.theme == option, onClick = { appStore.setAppSettings(state.appSettings.copy(theme = option)) }, label = { Text(option.name.lowercase().replaceFirstChar { it.uppercase() }) }) }
                }
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
