package com.gainslab.ironlog.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import com.gainslab.ironlog.model.ColorTheme

val OLED_Black = Color(0xFF000000)
val Dark_Surface = Color(0xFF121212)
val Dark_SurfaceVariant = Color(0xFF1E1E1E)
val Text_White = Color(0xFFF4F4F5)
val Text_Muted = Color(0xFFA1A1AA)

// Primary brand colors
val Primary_Iron = Color(0xFFC1F13B)
val Primary_Ocean = Color(0xFF3B82F6)
val Primary_Forest = Color(0xFF10B981)
val Primary_Royal = Color(0xFFA855F7)
val Primary_Sunset = Color(0xFFF97316)
val Primary_Monochrome = Color(0xFF71717A)

fun getThemeColorScheme(theme: ColorTheme): ColorScheme {
    val primaryColor = when (theme) {
        ColorTheme.IRON -> Primary_Iron
        ColorTheme.OCEAN -> Primary_Ocean
        ColorTheme.FOREST -> Primary_Forest
        ColorTheme.ROYAL -> Primary_Royal
        ColorTheme.SUNSET -> Primary_Sunset
        ColorTheme.MONOCHROME -> Primary_Monochrome
    }
    
    return darkColorScheme(
        primary = primaryColor,
        background = OLED_Black,
        surface = Dark_Surface,
        surfaceVariant = Dark_SurfaceVariant,
        onBackground = Text_White,
        onSurface = Text_White,
        onSurfaceVariant = Text_Muted
    )
}

@Composable
fun IronLogTheme(
    theme: ColorTheme = ColorTheme.IRON,
    content: @Composable () -> Unit
) {
    val colorScheme = getThemeColorScheme(theme)
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
