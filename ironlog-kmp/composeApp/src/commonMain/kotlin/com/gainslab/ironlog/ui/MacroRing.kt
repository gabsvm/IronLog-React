package com.gainslab.ironlog.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke

@Composable
fun MacroRing(
    modifier: Modifier = Modifier,
    proteinProportion: Float, // 0.0 to 1.0 based on total macros
    carbsProportion: Float,
    fatsProportion: Float,
    totalProgress: Float, // 0.0 to 1.0 (Calories consumed / Goal calories)
    proteinColor: Color = Color(0xFFEF4444),
    carbsColor: Color = Color(0xFF3B82F6),
    fatsColor: Color = Color(0xFFF59E0B),
    trackColor: Color = Color(0xFF1E1E1E),
    strokeWidth: Float = 40f
) {
    Box(modifier = modifier) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val center = Offset(size.width / 2, size.height / 2)
            val radius = (size.minDimension - strokeWidth) / 2
            val topLeft = Offset(center.x - radius, center.y - radius)
            val arcSize = Size(radius * 2, radius * 2)

            // Draw track (background ring)
            drawCircle(
                color = trackColor,
                radius = radius,
                center = center,
                style = Stroke(width = strokeWidth)
            )

            // If we have progress, draw the arcs
            if (totalProgress > 0f) {
                // Calculate angles
                // Total sweep angle is proportional to totalProgress (capped at 1.0, 360 degrees)
                val clampedProgress = totalProgress.coerceAtMost(1f)
                val totalSweepAngle = 360f * clampedProgress

                // If proportions are 0 (no food), avoid division by zero
                val totalMacros = proteinProportion + carbsProportion + fatsProportion
                if (totalMacros > 0f) {
                    val pSweep = (proteinProportion / totalMacros) * totalSweepAngle
                    val cSweep = (carbsProportion / totalMacros) * totalSweepAngle
                    val fSweep = (fatsProportion / totalMacros) * totalSweepAngle

                    // Start angle is -90f (top)
                    var currentStartAngle = -90f

                    // Draw Protein
                    if (pSweep > 0f) {
                        drawArc(
                            color = proteinColor,
                            startAngle = currentStartAngle,
                            sweepAngle = pSweep,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                        )
                        currentStartAngle += pSweep
                    }

                    // Draw Carbs
                    if (cSweep > 0f) {
                        drawArc(
                            color = carbsColor,
                            startAngle = currentStartAngle,
                            sweepAngle = cSweep,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                        )
                        currentStartAngle += cSweep
                    }

                    // Draw Fats
                    if (fSweep > 0f) {
                        drawArc(
                            color = fatsColor,
                            startAngle = currentStartAngle,
                            sweepAngle = fSweep,
                            useCenter = false,
                            topLeft = topLeft,
                            size = arcSize,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Butt)
                        )
                    }
                } else {
                    // Just draw a generic color if there are calories but no macros logged yet
                    drawArc(
                        color = proteinColor,
                        startAngle = -90f,
                        sweepAngle = totalSweepAngle,
                        useCenter = false,
                        topLeft = topLeft,
                        size = arcSize,
                        style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                    )
                }
            }
        }
    }
}
