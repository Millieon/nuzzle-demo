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

// Pet responses after user saves — the companion reacts to the mood
const PET_BY_MOOD = {
  radiant: ["That warmth — I feel it too when you're like this.", 'Radiant days should be written down.'],
  good:    ['I love the ones that feel light. Keep this one close.', 'Good days are worth keeping.'],
  still:   ["That quietness — I feel it too when you're like this.", 'Calm days are worth keeping.'],
  heavy:   ['You still showed up, even tired. That matters.', "Rest is part of the work. You're allowed."],
  dark:    ["I'm here. That's all, for now.", "You didn't have to write today. But you did."],
}

function formatModalDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`
}

// Generate pet response via Claude API, with static fallback
async function generatePetResponse(petName, moodKey, userText, goal) {
  try {
    const moodLabel = MOOD_META[moodKey]?.label || moodKey
    const prompt = `You are ${petName}, a gentle virtual companion inside Nuzzle, a habit app.
Your person just wrote a diary entry. Their mood is "${moodLabel}".
${userText ? `They wrote: "${userText}"` : 'They only logged their mood, no text.'}
${goal ? `Their goal is: "${goal}"` : ''}

Write a single short sentence (max 20 words) responding to their entry — warm, quiet, present.
No emoji. No exclamation marks. Do not use "proud", "amazing", "journey", or "you've got this".
Speak as if you were sitting beside them. Return only your response, nothing else.`

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 60,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) throw new Error('API error')
    const data = await response.json()
    const reply = data.content?.[0]?.text?.trim()
    if (reply) return reply
  } catch {
    // Fall through to static fallback
  }

  const opts = PET_BY_MOOD[moodKey] || PET_BY_MOOD.still
  return opts[Math.floor(Math.random() * opts.length)]
}

export default function EntryModal({ dateStr, existingEntry, petEntry, petName, goal, onClose, onSave }) {
  const [mood, setMood] = useState(existingEntry?.mood || null)
  const [text, setText] = useState(existingEntry?.text || '')
  const [mode, setMode] = useState(() => {
    if (petEntry && !existingEntry) return 'pet'
    if (existingEntry) return 'read'
    return 'write'
  })
  const [showEnergyAnim, setShowEnergyAnim] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!mood || saving) return
    setSaving(true)

    const petResponse = await generatePetResponse(petName || 'your companion', mood, text.trim(), goal)

    const entry = {
      date: dateStr,
      mood,
      text: text.trim(),
      energyGranted: MOOD_META[mood].energy,
      petResponse,
      petGenerated: false,
    }
    setShowEnergyAnim(true)
    setTimeout(() => {
      setSaving(false)
      onSave(entry)
    }, 800)
  }

  const name = petName || 'your companion'

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

          {/* ── Pet-generated entry view ── */}
          {mode === 'pet' && petEntry && (
            <>
              <p className={styles.petTag}>written by {name}</p>
              <p className={styles.readText}>{petEntry.text}</p>
              <div className={styles.divider} />
              <p className={styles.prompt}>Want to add your own thoughts?</p>
              <button
                className={styles.saveBtn}
                onClick={() => setMode('write')}
              >
                Continue writing
              </button>
            </>
          )}

          {/* ── Read mode (user's own entry) ── */}
          {mode === 'read' && (
            <>
              <div className={styles.moodRow}>
                {existingEntry?.mood && MOOD_META[existingEntry.mood] && (
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

              {/* Pet response */}
              {existingEntry?.petResponse && (
                <>
                  <div className={styles.divider} />
                  <p className={styles.quip}>&ldquo;{existingEntry.petResponse}&rdquo;</p>
                  <span className={styles.petSig}>&mdash; {name}</span>
                </>
              )}

              <button className={styles.editBtn} onClick={() => setMode('write')}>
                Edit
              </button>
            </>
          )}

          {/* ── Write mode ── */}
          {mode === 'write' && (
            <>
              {/* If pet wrote something, show it above the user's input */}
              {petEntry && (
                <div className={styles.petPreview}>
                  <span className={styles.petPreviewLabel}>{name} wrote:</span>
                  <p className={styles.petPreviewText}>&ldquo;{petEntry.text.slice(0, 100)}{petEntry.text.length > 100 ? '...' : ''}&rdquo;</p>
                  <div className={styles.divider} />
                </div>
              )}

              <p className={styles.prompt}>
                {petEntry ? 'Add your own thoughts' : 'How are you today?'}
              </p>

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
                autoFocus
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
                  disabled={!mood || saving}
                  onClick={handleSave}
                >
                  {saving ? 'Sharing...' : mood ? `Share with ${name}  +${MOOD_META[mood].energy} energy` : 'Select a mood to save'}
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
