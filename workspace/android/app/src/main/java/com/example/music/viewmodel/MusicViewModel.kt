package com.example.music.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.music.model.Track
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MusicViewModel : ViewModel() {
    private val firestore = FirebaseFirestore.getInstance()
    private val _tracks = MutableStateFlow<List<Track>>(emptyList())
    val tracks: StateFlow<List<Track>> = _tracks.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    init {
        fetchTracks()
    }

    private fun fetchTracks() {
        _isLoading.value = true
        firestore.collection("tracks")
            .addSnapshotListener { snapshot, error ->
                _isLoading.value = false
                if (error != null) {
                    return@addSnapshotListener
                }
                val trackList = snapshot?.documents?.mapNotNull { it.toObject(Track::class.java) } ?: emptyList()
                _tracks.value = trackList
            }
    }
}
