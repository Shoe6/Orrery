package com.orerry.app

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController

private object Routes {
    const val Dashboard = "dashboard"
    const val ProfileManager = "profile_manager"
}

@Composable
fun AppNavigation(
    viewModel: MainStateViewModel,
    modifier: Modifier = Modifier,
    navController: NavHostController = rememberNavController()
) {
    val profiles by viewModel.profiles.collectAsStateWithLifecycle()
    val selectedProfile by viewModel.selectedProfile.collectAsStateWithLifecycle()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    LaunchedEffect(profiles, selectedProfile) {
        if (selectedProfile == null && profiles.isNotEmpty()) {
            viewModel.selectProfile(profiles.first())
        }
    }

    LaunchedEffect(profiles, currentRoute) {
        if (profiles.isEmpty() && currentRoute != Routes.ProfileManager) {
            navController.navigate(Routes.ProfileManager) {
                popUpTo(Routes.Dashboard)
                launchSingleTop = true
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Routes.Dashboard,
        modifier = modifier
    ) {
        composable(Routes.Dashboard) {
            DashboardScreen(
                profiles = profiles,
                selectedProfile = selectedProfile,
                onProfileSelected = viewModel::selectProfile,
                onOpenProfileManager = {
                    navController.navigate(Routes.ProfileManager)
                }
            )
        }

        composable(Routes.ProfileManager) {
            ProfileManagerScreen(
                profiles = profiles,
                onSaveProfile = viewModel::saveProfile,
                onDeleteProfile = viewModel::deleteProfile,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
