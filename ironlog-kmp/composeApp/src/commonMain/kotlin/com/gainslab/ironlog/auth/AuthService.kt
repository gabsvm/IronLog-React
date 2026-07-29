package com.gainslab.ironlog.auth

import dev.gitlive.firebase.Firebase
import dev.gitlive.firebase.auth.auth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

data class AuthState(
    val email: String? = null,
    val isLoading: Boolean = true,
    val error: String? = null
) {
    val isSignedIn: Boolean get() = email != null
}

/** Firebase email/password access shared by the Android and future iOS shells. */
class AuthService {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init {
        scope.launch {
            Firebase.auth.authStateChanged.collect { user ->
                _state.value = AuthState(email = user?.email, isLoading = false)
            }
        }
    }

    suspend fun signIn(email: String, password: String): Result<Unit> = runAction {
        Firebase.auth.signInWithEmailAndPassword(email.trim(), password)
    }

    suspend fun register(email: String, password: String): Result<Unit> = runAction {
        Firebase.auth.createUserWithEmailAndPassword(email.trim(), password)
    }

    suspend fun resetPassword(email: String): Result<Unit> = runAction {
        Firebase.auth.sendPasswordResetEmail(email.trim())
    }

    suspend fun signOut() = Firebase.auth.signOut()

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }

    private suspend fun runAction(action: suspend () -> Unit): Result<Unit> = runCatching {
        _state.value = _state.value.copy(isLoading = true, error = null)
        action()
    }.onFailure { error ->
        _state.value = _state.value.copy(isLoading = false, error = error.message ?: "No se pudo completar la autenticacion.")
    }
}
