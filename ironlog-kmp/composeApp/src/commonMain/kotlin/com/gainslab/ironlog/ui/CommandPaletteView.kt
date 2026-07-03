package com.gainslab.ironlog.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommandPaletteView(
    onDismiss: () -> Unit,
    onStartWorkout: () -> Unit,
    onCreateProgram: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = OLED_Black,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .padding(bottom = 32.dp)
        ) {
            Text(
                text = "Acciones Rápidas", 
                fontSize = 20.sp, 
                fontWeight = FontWeight.Bold, 
                color = Text_White,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            CommandActionItem(
                title = "Entrenamiento Libre",
                description = "Inicia una sesión sin plan predefinido",
                icon = Icons.Default.PlayArrow,
                onClick = {
                    onStartWorkout()
                    onDismiss()
                }
            )

            CommandActionItem(
                title = "Crear Mesociclo",
                description = "Diseña una nueva rutina",
                icon = Icons.Default.Add,
                onClick = {
                    onCreateProgram()
                    onDismiss()
                }
            )
            
            CommandActionItem(
                title = "Historial",
                description = "Ver tus entrenamientos pasados",
                icon = Icons.Default.DateRange,
                onClick = {
                    // Navigate to history (can be handled by main navigation)
                    onDismiss()
                }
            )
        }
    }
}

@Composable
fun CommandActionItem(title: String, description: String, icon: ImageVector, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.2f), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
        }
        
        Column(modifier = Modifier.padding(start = 16.dp)) {
            Text(text = title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Text_White)
            Text(text = description, fontSize = 12.sp, color = Text_Muted)
        }
    }
}
