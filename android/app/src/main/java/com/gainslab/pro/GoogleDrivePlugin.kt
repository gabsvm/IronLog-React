package com.gainslab.pro

import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope

/**
 * U10: Google Drive backup authorization for the Android app. The WebView
 * cannot run Google's web OAuth flow, so the token comes from Play services
 * (AuthorizationClient) and the web layer talks to the Drive REST API itself.
 *
 * Only the `drive.appdata` scope: the app sees its own hidden folder, never
 * the user's files. Requires an Android OAuth client (package + signing
 * SHA-1) in the Google Cloud project; no client ID lives in the app.
 */
@CapacitorPlugin(name = "GoogleDrive")
class GoogleDrivePlugin : Plugin() {
    private var launcher: ActivityResultLauncher<IntentSenderRequest>? = null
    private var pendingCall: PluginCall? = null

    private val request: AuthorizationRequest
        get() = AuthorizationRequest.builder()
            .setRequestedScopes(listOf(Scope(DRIVE_APPDATA)))
            .build()

    override fun load() {
        launcher = activity.activityResultRegistry.register(
            "gainslab-drive-auth",
            ActivityResultContracts.StartIntentSenderForResult(),
        ) { result ->
            val call = pendingCall ?: return@register
            pendingCall = null
            try {
                val auth = Identity.getAuthorizationClient(activity).getAuthorizationResultFromIntent(result.data)
                resolveToken(call, auth)
            } catch (e: Exception) {
                call.reject("authorization cancelled", "CANCELLED", e)
            }
        }
    }

    override fun handleOnDestroy() {
        launcher?.unregister()
        launcher = null
        super.handleOnDestroy()
    }

    private fun resolveToken(call: PluginCall, auth: AuthorizationResult) {
        val token = auth.accessToken
        if (token.isNullOrBlank()) {
            call.reject("no token", "NO_TOKEN")
            return
        }
        call.resolve(JSObject().put("accessToken", token))
    }

    /**
     * Returns an access token. `interactive = false` never shows UI (used to
     * check whether the user already granted access).
     */
    @PluginMethod
    fun authorize(call: PluginCall) {
        val interactive = call.getBoolean("interactive", true) ?: true
        Identity.getAuthorizationClient(activity)
            .authorize(request)
            .addOnSuccessListener { auth ->
                val pending = auth.pendingIntent
                if (auth.hasResolution() && pending != null) {
                    if (!interactive) {
                        call.reject("consent required", "CONSENT_REQUIRED")
                        return@addOnSuccessListener
                    }
                    val l = launcher
                    if (l == null) {
                        call.reject("not ready")
                        return@addOnSuccessListener
                    }
                    pendingCall?.reject("superseded", "CANCELLED")
                    pendingCall = call
                    l.launch(IntentSenderRequest.Builder(pending.intentSender).build())
                } else {
                    resolveToken(call, auth)
                }
            }
            .addOnFailureListener { e -> call.reject("authorization failed", "FAILED", e) }
    }

    /** Drops a token the web layer found invalid (401) so the next call refreshes it. */
    @PluginMethod
    fun clearToken(call: PluginCall) {
        val token = call.getString("accessToken")
        if (token.isNullOrBlank()) {
            call.resolve()
            return
        }
        try {
            com.google.android.gms.auth.GoogleAuthUtil.clearToken(context, token)
        } catch (_: Exception) {
            // best effort
        }
        call.resolve()
    }

    companion object {
        private const val DRIVE_APPDATA = "https://www.googleapis.com/auth/drive.appdata"
    }
}
