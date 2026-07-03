package com.gainslab.ironlog.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.animation.core.tween
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.animation.with
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.model.*
import androidx.compose.ui.graphics.Color
import com.gainslab.ironlog.store.AppStore
import com.gainslab.ironlog.theme.*
import com.gainslab.ironlog.utils.RecommendationEngine

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun SetupWizardView(
    appStore: AppStore,
    onComplete: () -> Unit
) {
    var step by remember { mutableStateOf(0) }
    
    // Simple state just for aesthetics since we are bypassing the recommendation engine for now
    var experience by remember { mutableStateOf("intermediate") }
    var daysPerWeek by remember { mutableStateOf(4) }
    var goal by remember { mutableStateOf("hypertrophy") }
    
    val handleNext: () -> Unit = {
        if (step < 3) {
            step++
        } else {
            // Run recommendation engine
            val profile = UserProfile(
                experience = when(experience) {
                    "beginner" -> ExperienceLevel.BEGINNER
                    "advanced" -> ExperienceLevel.ADVANCED
                    else -> ExperienceLevel.INTERMEDIATE
                },
                daysPerWeek = daysPerWeek,
                goal = when(goal) {
                    "strength" -> TrainingGoal.STRENGTH
                    else -> TrainingGoal.HYPERTROPHY
                },
                sessionDuration = SessionDuration.MEDIUM
            )
            
            val recommendation = RecommendationEngine.recommendProgram(profile)
            
            val newMeso = MesoCycle(
                id = System.currentTimeMillis(),
                name = "Mi Primer Mesociclo",
                mesoType = recommendation.mesoType,
                week = 1,
                targetWeeks = 6,
                duration = 6,
                plan = emptyList() // The plan matrix can be empty, we rely on the program in state
            )
            
            appStore.setProgram(recommendation.template)
            appStore.setActiveMeso(newMeso)
            
            onComplete()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(OLED_Black)
            .padding(24.dp)
    ) {
        // Progress
        LinearProgressIndicator(
            progress = (step + 1) / 4f,
            modifier = Modifier.fillMaxWidth().height(4.dp).padding(bottom = 24.dp),
            color = MaterialTheme.colorScheme.primary,
            trackColor = Dark_Surface
        )
        
        AnimatedContent(
            targetState = step,
            transitionSpec = {
                slideInHorizontally(
                    initialOffsetX = { it },
                    animationSpec = tween(300)
                ) with slideOutHorizontally(
                    targetOffsetX = { -it },
                    animationSpec = tween(300)
                )
            }
        ) { currentStep ->
            when (currentStep) {
                0 -> {
                    Column {
                        Text("¿Cuál es tu nivel?", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Text("Sé honesto, esto personalizará tu rutina.", color = Text_Muted, fontSize = 14.sp, modifier = Modifier.padding(bottom = 24.dp))
                        
                        WizardOption(
                            label = "Principiante", 
                            description = "Menos de 1 año entrenando de forma consistente.",
                            selected = experience == "beginner",
                            onClick = { experience = "beginner" }
                        )
                        WizardOption(
                            label = "Intermedio", 
                            description = "1 a 3 años de entrenamiento constante.",
                            selected = experience == "intermediate",
                            onClick = { experience = "intermediate" }
                        )
                        WizardOption(
                            label = "Avanzado", 
                            description = "Más de 3 años, técnica dominada.",
                            selected = experience == "advanced",
                            onClick = { experience = "advanced" }
                        )
                    }
                }
                1 -> {
                    Column {
                        Text("¿Cuántos días por semana?", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Text("Considera compromisos y descanso.", color = Text_Muted, fontSize = 14.sp, modifier = Modifier.padding(bottom = 24.dp))
                        
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            (2..6).forEach { d ->
                                Box(
                                    modifier = Modifier
                                        .size(60.dp)
                                        .background(if (daysPerWeek == d) MaterialTheme.colorScheme.primary else Dark_Surface, RoundedCornerShape(16.dp))
                                        .clickable { daysPerWeek = d },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "$d", 
                                        fontSize = 24.sp, 
                                        fontWeight = FontWeight.Bold, 
                                        color = if (daysPerWeek == d) Text_White else Text_Muted
                                    )
                                }
                            }
                        }
                    }
                }
                2 -> {
                    Column {
                        Text("¿Cuál es tu objetivo?", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Text("Puedes cambiar esto más adelante.", color = Text_Muted, fontSize = 14.sp, modifier = Modifier.padding(bottom = 24.dp))
                        
                        WizardOption(
                            label = "Hipertrofia", 
                            description = "Ganar masa muscular y tamaño.",
                            selected = goal == "hypertrophy",
                            onClick = { goal = "hypertrophy" }
                        )
                        WizardOption(
                            label = "Fuerza", 
                            description = "Aumentar 1RM en levantamientos principales.",
                            selected = goal == "strength",
                            onClick = { goal = "strength" }
                        )
                    }
                }
                3 -> {
                    Column {
                        Text("Todo listo", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Text("Comencemos creando tu primer mesociclo.", color = Text_Muted, fontSize = 14.sp, modifier = Modifier.padding(bottom = 24.dp))
                        
                        Button(
                            onClick = onComplete,
                            modifier = Modifier.fillMaxWidth().height(56.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) {
                            Text("Entrar a la app", color = Text_White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.weight(1f))
        
        if (step < 3) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                TextButton(onClick = { if (step > 0) step-- }, enabled = step > 0) {
                    Text("Atrás", color = if (step > 0) Text_Muted else Color.Transparent)
                }
                
                Button(
                    onClick = handleNext,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) {
                    Text("Siguiente", color = Text_White, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun WizardOption(label: String, description: String, selected: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp).clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.2f) else Dark_Surface),
        shape = RoundedCornerShape(16.dp),
        border = if (selected) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.primary) else null
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f)) {
                Text(label, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (selected) MaterialTheme.colorScheme.primary else Text_White)
                Text(description, fontSize = 12.sp, color = Text_Muted, modifier = Modifier.padding(top = 4.dp))
            }
            if (selected) {
                Icon(Icons.Default.Check, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            }
        }
    }
}
