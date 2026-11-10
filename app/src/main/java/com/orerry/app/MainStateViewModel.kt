package com.orerry.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class MainStateViewModel(
    private val profileDao: ProfileDao
) : ViewModel() {

    val profiles: StateFlow<List<OriginProfile>> = profileDao.getAllProfiles()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5_000),
            initialValue = emptyList()
        )

    private val _selectedProfile = MutableStateFlow<OriginProfile?>(null)
    val selectedProfile: StateFlow<OriginProfile?> = _selectedProfile.asStateFlow()

    fun selectProfile(profile: OriginProfile) {
        _selectedProfile.value = profile
    }

    fun saveProfile(profile: OriginProfile) {
        viewModelScope.launch {
            profileDao.insert(profile)
            if (_selectedProfile.value == null) {
                _selectedProfile.value = profile
            }
        }
    }

    fun deleteProfile(profile: OriginProfile) {
        viewModelScope.launch {
            profileDao.delete(profile)
            if (_selectedProfile.value?.id == profile.id) {
                val remaining = profiles.value.filterNot { it.id == profile.id }
                _selectedProfile.value = remaining.firstOrNull()
            }
        }
    }
}
