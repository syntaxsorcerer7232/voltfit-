package com.example.music

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.music.ui.screens.LoginScreen
import com.example.music.ui.screens.MainMusicScreen
import com.example.music.ui.screens.SignUpScreen
import com.example.music.ui.screens.SplashScreen
import com.example.music.viewmodel.AuthViewModel
import com.example.music.viewmodel.MusicViewModel

@Composable
fun MusicNavHost(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel = viewModel(),
    musicViewModel: MusicViewModel = viewModel()
) {
    NavHost(navController = navController, startDestination = "splash") {
        composable("splash") {
            SplashScreen(
                onSplashComplete = {
                    val isLoggedIn = authViewModel.currentUser != null
                    if (isLoggedIn) {
                        navController.navigate("main") {
                            popUpTo("splash") { inclusive = true }
                        }
                    } else {
                        navController.navigate("login") {
                            popUpTo("splash") { inclusive = true }
                        }
                    }
                }
            )
        }
        
        composable("login") {
            LoginScreen(
                authViewModel = authViewModel,
                onLoginSuccess = {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                    }
                },
                onNavigateToSignUp = {
                    navController.navigate("signup")
                }
            )
        }
        
        composable("signup") {
            SignUpScreen(
                authViewModel = authViewModel,
                onSignUpSuccess = {
                    navController.navigate("main") {
                        popUpTo("login") { inclusive = true }
                        popUpTo("signup") { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                }
            )
        }
        
        composable("main") {
            MainMusicScreen(
                musicViewModel = musicViewModel,
                onSignOut = {
                    authViewModel.signOut()
                    navController.navigate("login") {
                        popUpTo(0)
                    }
                }
            )
        }
    }
}
