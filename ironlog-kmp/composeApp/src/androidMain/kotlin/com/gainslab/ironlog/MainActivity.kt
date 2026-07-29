package com.gainslab.ironlog

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
import com.gainslab.ironlog.store.AppStore
import kotlinx.coroutines.launch
import org.koin.core.context.GlobalContext

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val appStore: AppStore = GlobalContext.get().get()
        lifecycleScope.launch {
            appStore.state.collect { state ->
                if (state.appSettings.keepScreenOn) {
                    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                } else {
                    window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
                }
            }
        }
        setContent {
            App()
        }
    }
}
