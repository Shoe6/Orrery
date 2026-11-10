import type { OriginProfile } from '../types'

const PROFILES_KEY = 'orerry.origin_profiles'
const SELECTED_PROFILE_KEY = 'orerry.selected_profile_id'

export const ProfileManager = {
  getProfiles(): OriginProfile[] {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as OriginProfile[]
      return [...parsed].sort((a, b) => a.name.localeCompare(b.name))
    } catch {
      return []
    }
  },

  saveProfile(profile: OriginProfile): OriginProfile[] {
    const profiles = this.getProfiles()
    const existingIndex = profiles.findIndex((it) => it.id === profile.id)

    if (existingIndex >= 0) {
      profiles[existingIndex] = profile
    } else {
      profiles.push(profile)
    }

    const sorted = [...profiles].sort((a, b) => a.name.localeCompare(b.name))
    this.persistProfiles(sorted)
    return sorted
  },

  deleteProfile(profileId: string): OriginProfile[] {
    const remaining = this.getProfiles().filter((profile) => profile.id !== profileId)
    this.persistProfiles(remaining)

    const selected = this.getSelectedProfileId()
    if (selected === profileId) {
      this.setSelectedProfileId(remaining[0]?.id ?? null)
    }

    return remaining
  },

  getSelectedProfileId(): string | null {
    return localStorage.getItem(SELECTED_PROFILE_KEY)
  },

  setSelectedProfileId(profileId: string | null): void {
    if (!profileId) {
      localStorage.removeItem(SELECTED_PROFILE_KEY)
      return
    }
    localStorage.setItem(SELECTED_PROFILE_KEY, profileId)
  },

  createProfileId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`
  },

  persistProfiles(profiles: OriginProfile[]): void {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  },
}
