import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './DiaryScreen.module.css'

// ─── Moods — words only, no emoji ────────────────────────────────────────────
const MOODS = [
  { id: 'calm',     label: 'Calm'      },
  { id: 'happy',    label: 'Light'     },
  { id: 'proud',    label: 'Proud'     },
  { id: 'grateful', label: 'Grateful'  },
  { id: 'tired',    label: 'Tired'     },
  { id: 'anxious',  label: 'Unsettled' },
  { id: 'sad',      label: 'Heavy'     },
]

// Greyscale left-rule shade per mood — the only visual indicator
const MOOD_SHADE = {
  calm: '#c8c4bc', happy: '#b4b8b0', proud: '#a4a4a0',
  grateful: '#b8b0a8', tired: '#c4c4c8', anxious: '#b8b8c0', sad: '#a8b0b8',
}

const todayStr = new Date().toISOString().slice(0, 10)

const SEED = [
  { id: 1, date: '2026-03-25', mood: 'calm',
    text: 'Managed the breathing exercise before the chaos started. Only 3 minutes but it felt different today.',
    petResponse: 'Three minutes of stillness matters more than you think. I noticed you were calmer when you came back.' },
  { id: 2, date: '2026-03-26', mood: 'tired',
    text: "Skipped the walk. A long call ran over and I couldn't face it. Feeling a bit rubbish about it honestly.",
    petResponse: "Some days the couch wins. That's okay. You showed up yesterday, and I'll be here tomorrow." },
  { id: 3, date: '2026-03-27', mood: 'proud',
    text: "Wrote 350 words — more than the goal. Didn't even notice I'd gone over until I checked the count.",
    petResponse: 'I saw that. You were in the zone for a while. That quiet focus — I love watching that.' },
  { id: 4, date: '2026-03-28', mood: 'happy',
    text: 'Evening walk turned into an hour. Met a dog at the park — reminded me why I started all of this.',
    petResponse: 'You came home with different energy. I felt it from across the room.' },
  { id: 5, date: '2026-03-29', mood: 'anxious',
    text: 'Hard to focus today. Mind kept jumping. Did half the things on my list and quietly gave up.',
    petResponse: "Half counts. And scattered days happen. You still opened the app — that's not nothing." },
  { id: 6, date: '2026-03-30', mood: 'grateful',
    text: "Realised I've been doing this for a week. The writing habit especially feels like it's actually forming.",
    petResponse: "A week is real. A week is a foundation. I've been watching it build." },
  { id: 7, date: '2026-03-31', mood: 'calm',
    text: "Rest day. No tasks, no pressure. Just existed. Sometimes that's the whole thing.",
    petResponse: 'Rest is part of it too. You were softer today. I liked that.' },
]

const PET_BY_MOOD = {
  calm:     ["That quietness — I feel it too when you're like this.", 'Calm days are worth keeping.'],
  happy:    ['I love the ones that feel light. Keep this one close.', 'Good days should be written down.'],
  proud:    ["Keep this one. You'll want to read it on a harder day.", 'That feeling was real. It was.'],
  grateful: ["Gratitude is a kind of seeing. I'm glad you see these things.", 'These are the ones worth collecting.'],
  tired:    ['You still showed up, even tired. That matters.', "Rest is part of the work. You're allowed."],
  anxious:  ['I stayed close today. I hope you felt that.', "You made it through. That's more than you know."],
  sad:      ["I'm here. That's all, for now.", "You didn't have to write today. But you did. I'm with you."],
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return {
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day:   String(d.getDate()),
    full:  d.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}

// ─── Letter card ──────────────────────────────────────────────────────────────
function LetterCard({ entry, onClick, index }) {
  const { month, day } = fmtDate(entry.date)
  const shade = MOOD_SHADE[entry.mood] || '#c0bdb8'
  const rot = ((entry.id * 1.618) % 5) - 2.5

  return (
    <motion.button
      className={styles.letter}
      style={{ '--shade': shade, '--rot': `${rot}deg` }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.78, rotate: rot }}
      animate={{ opacity: 1, scale: 1, rotate: rot }}
      transition={{ duration: 0.32, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, rotate: 0, scale: 1.08, zIndex: 20,
        transition: { duration: 0.16, ease: 'easeOut' } }}
      whileTap={{ scale: 0.95 }}
    >
      <span className={styles.fold} />
      <span className={styles.rule} />
      <span className={styles.cardMonth}>{month}</span>
      <span className={styles.cardDay}>{day}</span>
      <span className={styles.cardMoodLabel}>
        {MOODS.find(m => m.id === entry.mood)?.label}
      </span>
    </motion.button>
  )
}

// ─── Open letter overlay ──────────────────────────────────────────────────────
function OpenLetter({ entry, petName, onClose }) {
  const { full } = fmtDate(entry.date)
  const moodLabel = MOODS.find(m => m.id === entry.mood)?.label || ''

  return (
    <motion.div className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div className={styles.openLetter}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.openTopFold} />
        <div className={styles.openMeta}>
          <span className={styles.openDate}>{full}</span>
          <span className={styles.openMoodTag}>{moodLabel}</span>
        </div>
        <p className={styles.openBody}>{entry.text}</p>
        <div className={styles.openDivider}>
          <span /><span className={styles.openDot} /><span />
        </div>
        <p className={styles.openResponse}>&#8220;{entry.petResponse}&#8221;</p>
        <span className={styles.openSig}>— {petName}</span>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </motion.div>
    </motion.div>
  )
}

// ─── Write panel ──────────────────────────────────────────────────────────────
function WritePanel({ petName, onClose, onSave }) {
  const [text, setText] = useState('')
  const [mood, setMood] = useState('calm')
  const [saving, setSaving] = useState(false)

  function handleSave() {
    if (!text.trim()) return
    setSaving(true)
    const opts = PET_BY_MOOD[mood] || PET_BY_MOOD.calm
    const petResponse = opts[Math.floor(Math.random() * opts.length)]
    setTimeout(() => { onSave({ text: text.trim(), mood, petResponse }); setSaving(false) }, 800)
  }

  return (
    <motion.div className={styles.writePanel}
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 34 }}
    >
      <div className={styles.writeHandle} />
      <p className={styles.writeDay}>{new Date().toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      <p className={styles.writeHeading}>What happened?</p>

      <textarea
        className={styles.writeInput}
        placeholder="Even a small moment counts…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        autoFocus
      />

      <div className={styles.moodRow}>
        {MOODS.map(m => (
          <button key={m.id}
            className={`${styles.moodChip} ${mood === m.id ? styles.moodChipActive : ''}`}
            onClick={() => setMood(m.id)}
          >{m.label}</button>
        ))}
      </div>

      <div className={styles.writeFooter}>
        <button className={styles.cancelBtn} onClick={onClose} disabled={saving}>Cancel</button>
        <button className={styles.saveBtn} onClick={handleSave} disabled={!text.trim() || saving}>
          {saving
            ? <span className={styles.savingDots}>{[0,1,2].map(i => <span key={i} style={{ animationDelay:`${i*0.16}s`}} />)}</span>
            : `Share with ${petName}`}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DiaryScreen({ go, profile }) {
  const petName = profile?.petName || 'your companion'
  const [entries, setEntries] = useState(SEED)
  const [openEntry, setOpenEntry] = useState(null)
  const [writing, setWriting] = useState(false)
  const [latestPet, setLatestPet] = useState(SEED[SEED.length - 1].petResponse)
  const hasToday = entries.some(e => e.date === todayStr)
  const { month, day } = fmtDate(todayStr)

  function handleSave({ text, mood, petResponse }) {
    const entry = { id: Date.now(), date: todayStr, mood, text, petResponse }
    setEntries(p => [...p, entry])
    setLatestPet(petResponse)
    setWriting(false)
    setTimeout(() => setOpenEntry(entry), 300)
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => go?.('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l-5-5 5-5" stroke="#111" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Journal</span>
        <span className={styles.headerDate}>{month} {day}</span>
      </div>

      {/* Pet response — typography only */}
      <div className={styles.petCard}>
        <motion.p key={latestPet} className={styles.petQuote}
          initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >&#8220;{latestPet}&#8221;</motion.p>
        <span className={styles.petSig}>— {petName}</span>
      </div>

      {/* Section header */}
      <div className={styles.section}>
        <span className={styles.sectionLabel}>March — April 2026</span>
        <span className={styles.sectionCount}>{entries.length} entries</span>
      </div>

      {/* Grid */}
      <div className={styles.scroll}>
        <div className={styles.grid}>
          {entries.map((e, i) => (
            <LetterCard key={e.id} entry={e} index={i} onClick={() => setOpenEntry(e)} />
          ))}
          {!hasToday && (
            <motion.button className={styles.todaySlot} onClick={() => setWriting(true)}
              animate={{ opacity: [0.35, 0.8, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ opacity: 1, scale: 1.04 }}
            >
              <span className={styles.todayPlus} />
              <span className={styles.todayText}>today</span>
            </motion.button>
          )}
        </div>
      </div>

      {!writing && hasToday && (
        <motion.button className={styles.fab}
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
          onClick={() => setWriting(true)}
        >Write</motion.button>
      )}

      <AnimatePresence>
        {writing && <WritePanel petName={petName} onClose={() => setWriting(false)} onSave={handleSave} />}
      </AnimatePresence>
      <AnimatePresence>
        {openEntry && <OpenLetter entry={openEntry} petName={petName} onClose={() => setOpenEntry(null)} />}
      </AnimatePresence>
    </div>
  )
}
