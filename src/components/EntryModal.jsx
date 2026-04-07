import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './EntryModal.module.css'

const MOODS = ['radiant', 'good', 'still', 'heavy', 'dark']

const MOOD_META = {
  radiant: { label: 'Radiant', color: '#F0C060', energy: 30 },
  good:    { label: 'Good',    color: '#82C9A0', energy: 20 },
  still:   { label: 'Still',   color: '#9EB0C8', energy: 15 },
  heavy:   { label: 'Heavy',   color: '#B8A8C8', energy: 10 },
  dark:    { label: 'Dark',    color: '#999999', energy:  8 },
}

const QUIPS = {
  radiant: 'I can feel it. Today was yours.',
  good:    'Good days matter. I noticed.',
  still:   'Still is okay. I am here.',
  heavy:   'Heavy days count too. Rest with me.',
  dark:    'Even this. I am glad you wrote it down.',
}

function formatModalDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

export default function EntryModal({ dateStr, existingEntry, onClose, onSave }) {
  const [mood, setMood] = useState(existingEntry?.mood || null)
  const [text, setText] = useState(existingEntry?.text || '')
  const [mode, setMode] = useState(existingEntry ? 'read' : 'write')
  const [showEnergyAnim, setShowEnergyAnim] = useState(false)

  function handleSave() {
    if (!mood) return
    const entry = {
      date: dateStr,
      mood,
      text: text.trim(),
      energyGranted: MOOD_META[mood].energy,
    }
    setShowEnergyAnim(true)
    setTimeout(() => onSave(entry), 800)
  }

  return (
    <>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className={styles.sheet}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className={styles.pill} />
        <div className={styles.inner}>
          {/* Header */}
          <div className={styles.headerRow}>
            <span className={styles.dateStr}>{formatModalDate(dateStr)}</span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {mode === 'read' ? (
            <>
              {/* Read mode */}
              <div className={styles.moodRow}>
                {existingEntry?.mood && (
                  <div
                    className={`${styles.moodPill} ${styles.moodPillSelected}`}
                    style={{ background: MOOD_META[existingEntry.mood].color }}
                  >
                    <span className={styles.moodDot} style={{ background: '#fff' }} />
                    {MOOD_META[existingEntry.mood].label}
                  </div>
                )}
              </div>
              {existingEntry?.text && (
                <p className={styles.readText}>{existingEntry.text}</p>
              )}
              <button className={styles.editBtn} onClick={() => setMode('write')}>
                Edit
              </button>
            </>
          ) : (
            <>
              {/* Write mode */}
              <p className={styles.prompt}>How are you today?</p>

              <div className={styles.moodRow}>
                {MOODS.map(key => {
                  const meta = MOOD_META[key]
                  const selected = mood === key
                  return (
                    <button
                      key={key}
                      className={`${styles.moodPill} ${selected ? styles.moodPillSelected : ''}`}
                      style={selected ? { background: meta.color } : {}}
                      onClick={() => setMood(key)}
                      aria-label={`Set mood: ${meta.label}`}
                      aria-pressed={selected}
                    >
                      <span className={styles.moodDot} style={{ background: meta.color }} />
                      {meta.label}
                    </button>
                  )
                })}
              </div>

              <textarea
                className={styles.textarea}
                placeholder="Write anything. Or just the mood."
                value={text}
                onChange={e => setText(e.target.value)}
                aria-label="Journal entry"
              />

              <AnimatePresence>
                {mood && (
                  <motion.p
                    className={styles.quip}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {QUIPS[mood]}
                  </motion.p>
                )}
              </AnimatePresence>

              <div style={{ position: 'relative' }}>
                <button
                  className={styles.saveBtn}
                  disabled={!mood}
                  onClick={handleSave}
                >
                  {mood ? `Save  +${MOOD_META[mood].energy} energy` : 'Select a mood to save'}
                </button>

                <AnimatePresence>
                  {showEnergyAnim && mood && (
                    <motion.div
                      className={styles.energyFloat}
                      initial={{ opacity: 1, y: 0 }}
                      animate={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    >
                      +{MOOD_META[mood].energy} energy
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}
