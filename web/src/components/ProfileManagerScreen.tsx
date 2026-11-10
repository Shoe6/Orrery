import { useState } from 'react'
import type { FormEvent } from 'react'
import { ProfileManager } from '../storage/ProfileManager'
import type { OriginProfile } from '../types'

interface ProfileManagerScreenProps {
  profiles: OriginProfile[]
  onSaveProfile: (profile: OriginProfile) => void
  onDeleteProfile: (profileId: string) => void
  onBack: () => void
}

export function ProfileManagerScreen({
  profiles,
  onSaveProfile,
  onDeleteProfile,
  onBack,
}: ProfileManagerScreenProps) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('1981-04-24')
  const [birthTime, setBirthTime] = useState('07:36')
  const [latitude, setLatitude] = useState('43.0398')
  const [longitude, setLongitude] = useState('-77.0930')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const lat = Number(latitude.trim())
    const lon = Number(longitude.trim())
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())
    const isValidTime = /^\d{2}:\d{2}$/.test(birthTime.trim())

    if (!name.trim() || Number.isNaN(lat) || Number.isNaN(lon) || !isValidDate || !isValidTime) {
      setErrorMessage('Invalid input. Use ISO date, 24h time, and numeric coordinates.')
      return
    }

    const profile: OriginProfile = {
      id: ProfileManager.createProfileId(),
      name: name.trim(),
      birthDate: birthDate.trim(),
      birthTime: birthTime.trim(),
      latitude: lat,
      longitude: lon,
    }

    onSaveProfile(profile)
    setErrorMessage(null)
    setName('')
  }

  return (
    <div className="profile-page">
      <header className="top-bar glass">
        <button className="ghost-btn" onClick={onBack}>
          Back
        </button>
        <h1>Origin Profile Registry</h1>
      </header>

      <form className="profile-form glass" onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label>
          Birth Date (yyyy-MM-dd)
          <input value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </label>

        <label>
          Birth Time (HH:mm)
          <input value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </label>

        <div className="coord-grid">
          <label>
            Latitude
            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} />
          </label>

          <label>
            Longitude
            <input value={longitude} onChange={(e) => setLongitude(e.target.value)} />
          </label>
        </div>

        <button type="submit" className="primary-btn" disabled={!name.trim()}>
          Save
        </button>

        {errorMessage && <p className="error-text">{errorMessage}</p>}
      </form>

      <section className="saved-list">
        <h2>Saved Profiles</h2>
        <div className="profile-list">
          {profiles.map((profile) => (
            <article key={profile.id} className="profile-card glass">
              <div>
                <h3>{profile.name}</h3>
                <p>{`${profile.birthDate} ${profile.birthTime} | ${profile.latitude}, ${profile.longitude}`}</p>
              </div>
              <button className="delete-btn" onClick={() => onDeleteProfile(profile.id)}>
                Delete
              </button>
            </article>
          ))}
          {profiles.length === 0 && <p className="empty-msg">No saved profiles</p>}
        </div>
      </section>
    </div>
  )
}
