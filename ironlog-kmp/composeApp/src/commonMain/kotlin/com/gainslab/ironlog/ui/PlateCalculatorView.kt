package com.gainslab.ironlog.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.theme.*
import kotlin.math.floor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PlateCalculatorView(
    onDismiss: () -> Unit
) {
    var weightInput by remember { mutableStateOf("100") }
    var barWeight by remember { mutableStateOf(20.0) } // Default Olympic bar

    // Available plates
    val plates = listOf(25.0, 20.0, 15.0, 10.0, 5.0, 2.5, 1.25)

    // Calculate required plates per side
    val targetWeight = weightInput.toDoubleOrNull() ?: 0.0
    val weightPerSide = maxOf(0.0, (targetWeight - barWeight) / 2.0)
    
    val platesToUse = mutableListOf<Pair<Double, Int>>()
    var remaining = weightPerSide
    
    for (plate in plates) {
        val count = floor(remaining / plate).toInt()
        if (count > 0) {
            platesToUse.add(Pair(plate, count))
            remaining -= (plate * count)
        }
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Dark_Surface,
        title = { Text("Calculadora de Discos", color = Color.White) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = weightInput,
                    onValueChange = { weightInput = it },
                    label = { Text("Peso Total (kg)", color = Text_Muted) },
                    colors = TextFieldDefaults.outlinedTextFieldColors(
                        focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = Color.White.copy(alpha = 0.1f)
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                // Bar Weight Selection
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    listOf(10.0, 15.0, 20.0).forEach { bw ->
                        Button(
                            onClick = { barWeight = bw },
                            modifier = Modifier.weight(1f),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (barWeight == bw) MaterialTheme.colorScheme.primary else Color.White.copy(alpha = 0.1f)
                            )
                        ) {
                            Text("${bw.toInt()} kg", color = if (barWeight == bw) Color.Black else Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text("Discos por lado:", fontWeight = FontWeight.Bold, color = Color.White)

                if (platesToUse.isEmpty()) {
                    Text("Solo la barra", color = Text_Muted)
                } else {
                    platesToUse.forEach { (plate, count) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Color.White.copy(alpha = 0.05f), RoundedCornerShape(8.dp))
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${plate} kg", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Text("x $count", color = MaterialTheme.colorScheme.primary, fontSize = 18.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("Cerrar", color = Color.Black, fontWeight = FontWeight.Bold)
            }
        }
    )
}
