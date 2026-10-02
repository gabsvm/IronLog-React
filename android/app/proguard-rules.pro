# GainsLab release (R8) rules. Applied on top of proguard-android-optimize.txt
# (see android/app/build.gradle). Verified via assembleRelease + launch + logcat.

# --- Capacitor plugin surface: plugins are registered by class literal, but
# their @PluginMethod / @PermissionCallback entry points and the @CapacitorPlugin
# annotation itself are resolved reflectively at runtime. ---
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclasseswithmembernames class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
    @com.getcapacitor.annotation.PermissionCallback <methods>;
}
-keepattributes *Annotation*

# --- Own native entry points (manifest + plugin registry). ---
-keep class com.gainslab.pro.MainActivity { *; }
-keep class com.gainslab.pro.RestTimerReceiver { *; }
-keep class com.gainslab.pro.NativeBridgePlugin { *; }

# --- WebView JavascriptInterface methods are invoked by name from JS. None
# exist today; keep the rule so a future bridge method survives shrinking. ---
-keepclasseswithmembernames class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface

# --- Readable stack traces (logcat triage + Play Console deobfuscation via
# the mapping file saved to apk-out/). ---
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
