import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import DotGrid from '../components/DotGrid'
import EntryModal from '../components/EntryModal'
import PetEnergyBar from '../components/PetEnergyBar'
import NavBar from '../components/NavBar'
import styles from './DiaryScreen.module.css'

// ── Mood metadata ──────────────────────────────────────────────────────────
const MOOD_META = {
  radiant: { label: 'Radiant', color: '#F0C060', energy: 30 },
  good:    { label: 'Good',    color: '#82C9A0', energy: 20 },
  still:   { label: 'Still',   color: '#9EB0C8', energy: 15 },
  heavy:   { label: 'Heavy',   color: '#B8A8C8', energy: 10 },
  dark:    { label: 'Dark',    color: '#999999', energy:  8 },
}

// Map old mood keys (from HomeScreen pet-generated entries) to new ones
const MOOD_MAP = {
  calm: 'still', happy: 'good', proud: 'radiant',
  grateful: 'good', tired: 'heavy', anxious: 'heavy', sad: 'dark',
  // New moods map to themselves
  radiant: 'radiant', good: 'good', still: 'still', heavy: 'heavy', dark: 'dark',
}

// ── Seed entries for demo ──────────────────────────────────────────────────
const SEED_ENTRIES = [
  // January
  { date: '2026-01-03', mood: 'good',    text: 'Solid start to the year.', energyGranted: 20 },
  { date: '2026-01-06', mood: 'radiant', text: 'Best run in months.', energyGranted: 30 },
  { date: '2026-01-08', mood: 'still',   text: '', energyGranted: 15 },
  { date: '2026-01-12', mood: 'heavy',   text: 'Hard week at work.', energyGranted: 10 },
  { date: '2026-01-15', mood: 'good',    text: 'Getting back on track.', energyGranted: 20 },
  { date: '2026-01-19', mood: 'dark',    text: '', energyGranted: 8 },
  { date: '2026-01-22', mood: 'still',   text: 'Quiet day.', energyGranted: 15 },
  { date: '2026-01-26', mood: 'good',    text: 'Yoga class finally happened.', energyGranted: 20 },
  { date: '2026-01-30', mood: 'radiant', text: 'Finished the chapter.', energyGranted: 30 },
  // February
  { date: '2026-02-02', mood: 'good',    text: 'Morning routine stuck.', energyGranted: 20 },
  { date: '2026-02-04', mood: 'still',   text: '', energyGranted: 15 },
  { date: '2026-02-07', mood: 'heavy',   text: 'Tired. Wrote anyway.', energyGranted: 10 },
  { date: '2026-02-10', mood: 'good',    text: '', energyGranted: 20 },
  { date: '2026-02-13', mood: 'radiant', text: 'Cooked properly for the first time in weeks.', energyGranted: 30 },
  { date: '2026-02-17', mood: 'still',   text: 'Snow day. Stayed in.', energyGranted: 15 },
  { date: '2026-02-20', mood: 'good',    text: '', energyGranted: 20 },
  { date: '2026-02-23', mood: 'dark',    text: 'Low. Writing helps.', energyGranted: 8 },
  { date: '2026-02-26', mood: 'still',   text: '', energyGranted: 15 },
  // March
  { date: '2026-03-03', mood: 'good',    text: 'Spring starting to show.', energyGranted: 20 },
  { date: '2026-03-06', mood: 'radiant', text: 'Hit the goal.', energyGranted: 30 },
  { date: '2026-03-09', mood: 'heavy',   text: 'Restart after a week off.', energyGranted: 10 },
  { date: '2026-03-12', mood: 'good',    text: '', energyGranted: 20 },
  { date: '2026-03-14', mood: 'still',   text: 'Steady.', energyGranted: 15 },
  { date: '2026-03-17', mood: 'radiant', text: 'Long walk, cleared my head.', energyGranted: 30 },
  { date: '2026-03-20', mood: 'good',    text: '', energyGranted: 20 },
  { date: '2026-03-24', mood: 'heavy',   text: 'Hard one.', energyGranted: 10 },
  { date: '2026-03-27', mood: 'still',   text: '', energyGranted: 15 },
  { date: '2026-03-31', mood: 'good',    text: 'End of month.', energyGranted: 20 },
]

const SEED_ENERGY = SEED_ENTRIES.reduce((sum, e) => sum + e.energyGranted, 0)

// ── Utility ────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function currentMonthLabel() {
  const now = new Date()
  return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function DiaryScreen({ go, profile, updateProfile }) {
  const petName = profile?.petName || 'your companion'
  const goal = profile?.goal || ''
  const generatedEntry = profile?.generatedDiaryEntry || null

  // --- Entries state (user entries + pet entries all live here) ---
  const [entries, setEntries] = useState(() => {
    try {
      const raw = localStorage.getItem('nuzzle-diary-entries-v2')
      const stored = raw ? JSON.parse(raw) : null
      if (Array.isArray(stored) && stored.length) return stored
    } catch {}
    return SEED_ENTRIES
  })

  // --- Pet entries: separate array for pet-generated diary entries ---
  const [petEntries, setPetEntries] = useState(() => {
    try {
      const raw = localStorage.getItem('nuzzle-diary-pet-entries')
      const stored = raw ? JSON.parse(raw) : null
      if (Array.isArray(stored)) return stored
    } catch {}
    return []
  })

  const [totalEnergy, setTotalEnergy] = useState(() => {
    try {
      const raw = localStorage.getItem('nuzzle-diary-energy')
      const val = raw ? parseInt(raw, 10) : NaN
      if (!isNaN(val)) return val
    } catch {}
    return SEED_ENERGY
  })

  const [selectedDate, setSelectedDate] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  // --- Handle incoming pet-generated diary entry from HomeScreen ---
  useEffect(() => {
    if (!generatedEntry) return

    // Normalize mood key to new system
    const normalizedMood = MOOD_MAP[generatedEntry.mood] || 'still'
    const petEntry = {
      ...generatedEntry,
      mood: normalizedMood,
      petGenerated: true,
    }

    // Add to pet entries if not already there for that date
    setPetEntries(prev => {
      if (prev.some(e => e.date === petEntry.date)) return prev
      const next = [...prev, petEntry]
      try { localStorage.setItem('nuzzle-diary-pet-entries', JSON.stringify(next)) } catch {}
      return next
    })

    // Also add a dot on the grid for the pet entry (if user hasn't written their own)
    setEntries(prev => {
      if (prev.some(e => e.date === petEntry.date)) return prev
      const dotEntry = {
        date: petEntry.date,
        mood: normalizedMood,
        text: '',
        energyGranted: MOOD_META[normalizedMood]?.energy || 15,
        petGenerated: true,
      }
      const next = [...prev, dotEntry]
      const nextEnergy = next.reduce((sum, e) => sum + (e.energyGranted || 0), 0)
      setTotalEnergy(nextEnergy)
      persist(next, nextEnergy)
      return next
    })

    // Auto-open the pet entry after a short delay
    const timer = setTimeout(() => {
      setSelectedDate(petEntry.date)
      setModalOpen(true)
    }, 400)

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist entries & energy
  function persist(nextEntries, nextEnergy) {
    try {
      localStorage.setItem('nuzzle-diary-entries-v2', JSON.stringify(nextEntries))
      localStorage.setItem('nuzzle-diary-energy', String(nextEnergy))
    } catch {}
  }

  // Persist entries whenever they change
  useEffect(() => {
    persist(entries, totalEnergy)
  }, [entries, totalEnergy])

  function handleDayTap(dateStr) {
    setSelectedDate(dateStr)
    setModalOpen(true)
  }

  function handleSave(entry) {
    // Replace any pet-generated placeholder with the user's real entry
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== entry.date)
      const next = [...filtered, entry]
      const nextEnergy = next.reduce((sum, e) => sum + (e.energyGranted || 0), 0)
      setTotalEnergy(nextEnergy)
      return next
    })

    setModalOpen(false)
  }

  // Find pet entry for the selected date (if any)
  const selectedPetEntry = selectedDate
    ? petEntries.find(e => e.date === selectedDate) || null
    : null

  // Find user entry for the selected date
  const selectedUserEntry = selectedDate
    ? entries.find(e => e.date === selectedDate && !e.petGenerated) || null
    : null

  // If there's only a pet-generated dot (no user entry), pass null as existingEntry
  const selectedExisting = selectedDate
    ? entries.find(e => e.date === selectedDate)
    : null
  const existingForModal = selectedExisting?.petGenerated ? null : selectedExisting

  return (
    <div className={styles.root}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.topBarBack} onClick={() => go?.('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l-5-5 5-5" stroke="#111" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.topBarTitle}>{currentMonthLabel()}</span>
        <span className={styles.topBarEnergy}>{totalEnergy} energy</span>
      </div>

      {/* Dot grid */}
      <div className={styles.scrollArea}>
        <DotGrid entries={entries} onDayTap={handleDayTap} />
      </div>

      {/* Footer: energy bar + shop */}
      <div className={styles.footer}>
        <PetEnergyBar totalEnergy={totalEnergy} petName={petName} />
        <button className={styles.shopBtn} onClick={() => console.log('Shop coming soon')}>
          Visit shop
        </button>
      </div>

      {/* NavBar */}
      <NavBar active="diary" go={go} />

      {/* Entry modal */}
      <AnimatePresence>
        {modalOpen && selectedDate && (
          <EntryModal
            dateStr={selectedDate}
            existingEntry={existingForModal}
            petEntry={selectedPetEntry}
            petName={petName}
            goal={goal}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
