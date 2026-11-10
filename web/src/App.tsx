import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { DashboardScreen } from './components/DashboardScreen'
import { ProfileManagerScreen } from './components/ProfileManagerScreen'
import { ProfileManager } from './storage/ProfileManager'
import type { OriginProfile } from './types'
import './App.css'

function App() {
  const [profiles, setProfiles] = useState<OriginProfile[]>(() => ProfileManager.getProfiles())
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(() =>
    ProfileManager.getSelectedProfileId(),
  )

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  )

  useEffect(() => {
    if (profiles.length === 0) {
      setSelectedProfileId(null)
      ProfileManager.setSelectedProfileId(null)
      return
    }

    if (!selectedProfileId) {
      const firstProfileId = profiles[0].id
      setSelectedProfileId(firstProfileId)
      ProfileManager.setSelectedProfileId(firstProfileId)
      return
    }

    const selectedStillExists = profiles.some((profile) => profile.id === selectedProfileId)
    if (!selectedStillExists) {
      const fallbackProfileId = profiles[0].id
      setSelectedProfileId(fallbackProfileId)
      ProfileManager.setSelectedProfileId(fallbackProfileId)
    }
  }, [profiles, selectedProfileId])

  const handleProfileSelected = (profileId: string) => {
    if (!profileId) {
      setSelectedProfileId(null)
      ProfileManager.setSelectedProfileId(null)
      return
    }

    setSelectedProfileId(profileId)
    ProfileManager.setSelectedProfileId(profileId)
  }

  const handleSaveProfile = (profile: OriginProfile) => {
    const nextProfiles = ProfileManager.saveProfile(profile)
    setProfiles(nextProfiles)
    if (!selectedProfileId) {
      setSelectedProfileId(profile.id)
      ProfileManager.setSelectedProfileId(profile.id)
    }
  }

  const handleDeleteProfile = (profileId: string) => {
    const nextProfiles = ProfileManager.deleteProfile(profileId)
    setProfiles(nextProfiles)
    setSelectedProfileId(ProfileManager.getSelectedProfileId())
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <DashboardRoute
            profiles={profiles}
            selectedProfile={selectedProfile}
            onProfileSelected={handleProfileSelected}
          />
        }
      />
      <Route
        path="/profiles"
        element={
          <ProfileManagerRoute
            profiles={profiles}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function DashboardRoute({
  profiles,
  selectedProfile,
  onProfileSelected,
}: {
  profiles: OriginProfile[]
  selectedProfile: OriginProfile | null
  onProfileSelected: (profileId: string) => void
}) {
  const navigate = useNavigate()

  useEffect(() => {
    if (profiles.length === 0) {
      navigate('/profiles', { replace: true })
    }
  }, [navigate, profiles.length])

  return (
    <DashboardScreen
      profiles={profiles}
      selectedProfile={selectedProfile}
      onProfileSelected={onProfileSelected}
      onOpenProfileManager={() => navigate('/profiles')}
    />
  )
}

function ProfileManagerRoute({
  profiles,
  onSaveProfile,
  onDeleteProfile,
}: {
  profiles: OriginProfile[]
  onSaveProfile: (profile: OriginProfile) => void
  onDeleteProfile: (profileId: string) => void
}) {
  const navigate = useNavigate()

  return (
    <ProfileManagerScreen
      profiles={profiles}
      onSaveProfile={onSaveProfile}
      onDeleteProfile={onDeleteProfile}
      onBack={() => navigate('/')}
    />
  )
}

export default App
