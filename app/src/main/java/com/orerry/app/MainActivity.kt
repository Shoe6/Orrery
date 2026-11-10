package com.orerry.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val profileDao = AppDatabase.getDatabase(applicationContext).profileDao()

        val factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                if (modelClass.isAssignableFrom(MainStateViewModel::class.java)) {
                    return MainStateViewModel(profileDao) as T
                }
                throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
            }
        }

        val mainStateViewModel = ViewModelProvider(this, factory)[MainStateViewModel::class.java]

        setContent {
            MaterialTheme {
                AppNavigation(viewModel = mainStateViewModel)
            }
        }
    }
}
