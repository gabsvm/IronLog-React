package com.gainslab.ironlog.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.gainslab.ironlog.auth.AuthService
import com.gainslab.ironlog.db.CloudStateData
import com.gainslab.ironlog.db.SyncService
import com.gainslab.ironlog.model.ActivityLevel
import com.gainslab.ironlog.model.Gender
import com.gainslab.ironlog.model.UserProfile
import com.gainslab.ironlog.store.AppStore
import com.gainslab.ironlog.theme.Dark_Surface
import com.gainslab.ironlog.theme.OLED_Black
import com.gainslab.ironlog.theme.Text_Muted
import com.gainslab.ironlog.theme.Text_White
import kotlinx.coroutines.launch

@Composable
fun AccountView(
    authService: AuthService,
    appStore: AppStore,
    onBack: () -> Unit
) {
    val authState by authService.state.collectAsState()
    val appState by appStore.state.collectAsState()
    val scope = rememberCoroutineScope()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isRegisterMode by remember { mutableStateOf(false) }
    var isWorking by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    var pendingCloudSnapshot by remember { mutableStateOf<CloudStateData?>(null) }
    var showBackupImport by remember { mutableStateOf(false) }
    var backupPayload by remember { mutableStateOf("") }
    var showProfileEditor by remember { mutableStateOf(false) }
    val clipboard = LocalClipboardManager.current

    Column(modifier = Modifier.fillMaxSize().background(OLED_Black)) {
        Row(modifier = Modifier.fillMaxWidth().padding(12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Volver", tint = Text_White)
            }
            Column {
                Text("Cuenta y sincronizacion", fontSize = 21.sp, fontWeight = FontWeight.Black, color = Text_White)
                Text("La nube nunca reemplaza datos locales sin confirmacion.", fontSize = 12.sp, color = Text_Muted)
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp),
            contentPadding = PaddingValues(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            if (authState.isLoading || isWorking) {
                item {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            if (!authState.isSignedIn) {
                item {
                    AccountCard {
                        Text(if (isRegisterMode) "Crear cuenta" else "Iniciar sesion", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(Modifier.height(12.dp))
                        AccountInput("Email", email) { email = it }
                        Spacer(Modifier.height(8.dp))
                        AccountInput("Contrasena", password) { password = it }
                        Spacer(Modifier.height(12.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    isWorking = true
                                    val result = if (isRegisterMode) authService.register(email, password) else authService.signIn(email, password)
                                    isWorking = false
                                    if (result.isSuccess) {
                                        if (isRegisterMode) {
                                            status = "Cuenta creada y conectada. Tu copia local queda lista para sincronizarse."
                                        } else {
                                            isWorking = true
                                            val snapshot = SyncService.downloadState()
                                            if (snapshot != null) {
                                                appStore.restoreFromCloud(snapshot)
                                                status = "Sesion de la nube restaurada en este dispositivo."
                                            } else {
                                                status = "Cuenta conectada. No encontramos una copia cloud previa."
                                            }
                                            isWorking = false
                                        }
                                    } else {
                                        status = result.exceptionOrNull()?.message ?: "No se pudo iniciar sesion."
                                    }
                                }
                            },
                            enabled = email.isNotBlank() && password.length >= 6 && !isWorking,
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) { Text(if (isRegisterMode) "Crear cuenta" else "Ingresar", color = Color.Black, fontWeight = FontWeight.Bold) }
                        TextButton(onClick = { isRegisterMode = !isRegisterMode }) {
                            Text(if (isRegisterMode) "Ya tengo cuenta" else "Crear una cuenta nueva", color = MaterialTheme.colorScheme.primary)
                        }
                        TextButton(onClick = {
                            scope.launch {
                                isWorking = true
                                val result = authService.resetPassword(email)
                                isWorking = false
                                if (result.isSuccess) status = "Te enviamos el email para restablecer la contrasena."
                            }
                        }, enabled = email.isNotBlank() && !isWorking) {
                            Text("Olvide mi contrasena", color = Text_Muted)
                        }
                    }
                }
            } else {
                item {
                    AccountCard {
                        Text("Conectado como", fontSize = 12.sp, color = Text_Muted)
                        Text(authState.email.orEmpty(), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Text_White)
                        Spacer(Modifier.height(16.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    isWorking = true
                                    val snapshot = SyncService.downloadState()
                                    isWorking = false
                                    if (snapshot == null) status = "No encontramos una copia cloud para esta cuenta."
                                    else pendingCloudSnapshot = snapshot
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                        ) { Text("Descargar datos de la PWA", color = Color.Black, fontWeight = FontWeight.Bold) }
                        Spacer(Modifier.height(8.dp))
                        Button(
                            onClick = {
                                scope.launch {
                                    isWorking = true
                                    runCatching { appStore.uploadToCloud() }
                                        .onSuccess { status = "Datos locales subidos correctamente." }
                                        .onFailure { status = it.message ?: "No se pudo subir la copia local." }
                                    isWorking = false
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Dark_Surface)
                        ) { Text("Subir esta copia local", color = Text_White, fontWeight = FontWeight.Bold) }
                        TextButton(onClick = { scope.launch { authService.signOut() } }) {
                            Text("Cerrar sesion", color = Text_Muted)
                        }
                    }
                }
            }

            item {
                AccountCard {
                    val profile = appState.userProfile
                    Text("Perfil físico", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Text_White)
                    Spacer(Modifier.height(6.dp))
                    Text(
                        listOfNotNull(
                            profile?.bodyWeight?.let { "${it.toInt()} kg" },
                            profile?.height?.let { "${it.toInt()} cm" },
                            profile?.bodyFat?.let { "${it}% grasa" }
                        ).ifEmpty { listOf("Completá tus datos para métricas más precisas.") }.joinToString(" · "),
                        fontSize = 12.sp, color = Text_Muted
                    )
                    TextButton(onClick = { showProfileEditor = true }) { Text("Editar perfil", color = MaterialTheme.colorScheme.primary) }
                }
            }

            item {
                AccountCard {
                    Text("Backup local", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Text_White)
                    Spacer(Modifier.height(6.dp))
                    Text("Exporta una copia JSON local o importa una copia previamente guardada.", fontSize = 12.sp, color = Text_Muted)
                    Spacer(Modifier.height(12.dp))
                    Button(onClick = { scope.launch { clipboard.setText(AnnotatedString(appStore.exportLocalBackup())); status = "Backup JSON copiado al portapapeles." } }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Dark_Surface)) { Text("Copiar backup JSON", color = Text_White, fontWeight = FontWeight.Bold) }
                    TextButton(onClick = { showBackupImport = true }) { Text("Importar backup JSON", color = MaterialTheme.colorScheme.primary) }
                }
            }

            authState.error?.let { error -> item { Text(error, color = Color(0xFFEF4444)) } }
            status?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.primary) } }
        }
    }

    pendingCloudSnapshot?.let { snapshot ->
        AlertDialog(
            onDismissRequest = { pendingCloudSnapshot = null },
            containerColor = Dark_Surface,
            title = { Text("Reemplazar datos locales?", color = Text_White, fontWeight = FontWeight.Black) },
            text = { Text("Se importaran rutina, sesiones, nutricion, cardio, peso y objetivos desde la nube. Esta accion reemplaza los datos locales actuales.", color = Text_Muted) },
            confirmButton = {
                Button(onClick = {
                    scope.launch {
                        isWorking = true
                        appStore.restoreFromCloud(snapshot)
                        isWorking = false
                        pendingCloudSnapshot = null
                        status = "Datos de la PWA importados en el almacenamiento nativo."
                    }
                }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) {
                    Text("Importar", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = { TextButton(onClick = { pendingCloudSnapshot = null }) { Text("Cancelar", color = Text_Muted) } }
        )
    }

    if (showBackupImport) {
        AlertDialog(
            onDismissRequest = { showBackupImport = false },
            containerColor = Dark_Surface,
            title = { Text("Importar backup local", color = Text_White, fontWeight = FontWeight.Black) },
            text = {
                Column {
                    Text("Pega el JSON exportado. Reemplazara los datos locales al confirmar.", color = Text_Muted, fontSize = 12.sp)
                    Spacer(Modifier.height(8.dp))
                    OutlinedTextField(
                        value = backupPayload,
                        onValueChange = { backupPayload = it },
                        modifier = Modifier.fillMaxWidth().height(180.dp),
                        textStyle = androidx.compose.ui.text.TextStyle(color = Text_White),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = MaterialTheme.colorScheme.primary,
                            unfocusedBorderColor = Color.White.copy(alpha = .12f)
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        appStore.importLocalBackup(backupPayload)
                            .onSuccess {
                                status = "Backup local importado."
                                showBackupImport = false
                                backupPayload = ""
                            }
                            .onFailure { status = "El backup no es valido." }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                ) { Text("Importar", color = Color.Black) }
            },
            dismissButton = { TextButton(onClick = { showBackupImport = false }) { Text("Cancelar", color = Text_Muted) } }
        )
    }

    if (showProfileEditor) {
        ProfileEditorDialog(
            initial = appState.userProfile ?: UserProfile(),
            onDismiss = { showProfileEditor = false },
            onSave = { profile -> appStore.setUserProfile(profile); showProfileEditor = false; status = "Perfil actualizado." }
        )
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
private fun ProfileEditorDialog(initial: UserProfile, onDismiss: () -> Unit, onSave: (UserProfile) -> Unit) {
    var weight by remember(initial) { mutableStateOf(initial.bodyWeight?.toString().orEmpty()) }
    var height by remember(initial) { mutableStateOf(initial.height?.toString().orEmpty()) }
    var bodyFat by remember(initial) { mutableStateOf(initial.bodyFat?.toString().orEmpty()) }
    var age by remember(initial) { mutableStateOf(initial.age?.toString().orEmpty()) }
    var gender by remember(initial) { mutableStateOf(initial.gender ?: Gender.OTHER) }
    var activity by remember(initial) { mutableStateOf(initial.activityLevel ?: ActivityLevel.MODERATE) }
    var genderOpen by remember { mutableStateOf(false) }
    var activityOpen by remember { mutableStateOf(false) }
    AlertDialog(
        onDismissRequest = onDismiss, containerColor = Dark_Surface,
        title = { Text("Perfil físico", color = Text_White, fontWeight = FontWeight.Black) },
        text = { LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            item { ProfileField("Peso (kg)", weight) { weight = it } }
            item { ProfileField("Altura (cm)", height) { height = it } }
            item { ProfileField("Grasa corporal (%)", bodyFat) { bodyFat = it } }
            item { ProfileField("Edad", age) { age = it } }
            item {
                ExposedDropdownMenuBox(expanded = genderOpen, onExpandedChange = { genderOpen = it }) {
                    OutlinedTextField(value = gender.name, onValueChange = {}, readOnly = true, modifier = Modifier.fillMaxWidth().menuAnchor(), label = { Text("Género") }, textStyle = androidx.compose.ui.text.TextStyle(color = Text_White), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                    DropdownMenu(expanded = genderOpen, onDismissRequest = { genderOpen = false }) { Gender.entries.forEach { option -> DropdownMenuItem(text = { Text(option.name) }, onClick = { gender = option; genderOpen = false }) } }
                }
            }
            item {
                ExposedDropdownMenuBox(expanded = activityOpen, onExpandedChange = { activityOpen = it }) {
                    OutlinedTextField(value = activity.name, onValueChange = {}, readOnly = true, modifier = Modifier.fillMaxWidth().menuAnchor(), label = { Text("Actividad") }, textStyle = androidx.compose.ui.text.TextStyle(color = Text_White), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
                    DropdownMenu(expanded = activityOpen, onDismissRequest = { activityOpen = false }) { ActivityLevel.entries.forEach { option -> DropdownMenuItem(text = { Text(option.name) }, onClick = { activity = option; activityOpen = false }) } }
                }
            }
        } },
        confirmButton = { Button(onClick = { onSave(initial.copy(bodyWeight = weight.toDoubleOrNull(), height = height.toDoubleOrNull(), bodyFat = bodyFat.toDoubleOrNull(), age = age.toIntOrNull(), gender = gender, activityLevel = activity)) }, colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)) { Text("Guardar", color = Color.Black) } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancelar", color = Text_Muted) } }
    )
}

@Composable
private fun ProfileField(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(value = value, onValueChange = onValueChange, modifier = Modifier.fillMaxWidth(), label = { Text(label) }, singleLine = true, textStyle = androidx.compose.ui.text.TextStyle(color = Text_White), colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Text_White, unfocusedTextColor = Text_White))
}

@Composable
private fun AccountCard(content: @Composable () -> Unit) {
    androidx.compose.material3.Card(
        colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = Dark_Surface),
        modifier = Modifier.fillMaxWidth()
    ) { Column(modifier = Modifier.padding(18.dp)) { content() } }
}

@Composable
private fun AccountInput(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
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
}
