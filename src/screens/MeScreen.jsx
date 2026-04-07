import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import NavBar from '../components/NavBar'
import styles from './MeScreen.module.css'

const TONES = [
  { value: 'gentle', name: 'Gentle presence', desc: 'Soft, reassuring, never pushes.' },
  { value: 'steady', name: 'Steady companion', desc: 'Calm, encouraging, consistent.' },
  { value: 'coach', name: 'Coach', desc: 'Direct, practical, restart-oriented.' },
  { value: 'ambient', name: 'Ambient', desc: 'Quiet, minimal, background support.' },
]

function toneLabel(tone) {
  return TONES.find(t => t.value === tone)?.name || 'Steady companion'
}

function qualitativeCount(n) {
  if (n <= 0) return 'in small starts'
  if (n === 1) return 'in one clear way'
  if (n <= 3) return 'in a handful of ways'
  return 'in many small ways'
}

function buildJourneyNarrative({ petName, goal, doneSteps }) {
  const who = petName || 'your companion'
  const g = goal || 'showing up for what matters'
  const doneTexts = doneSteps.map(s => s.text).slice(0, 2)
  const thread = doneTexts.length ? `I noticed ${doneTexts.join(' — and ')}` : 'I noticed the way you came back here'
  const showUp = qualitativeCount(doneSteps.length)
  return `I’ve been watching you try to make room for ${g}. ${thread}. You’ve shown up ${showUp}, and it still counts. — ${who}`
}

function computeMilestones({ doneSteps, hasAnyDiary }) {
  // Narrative, non-numeric. Chosen by “coach” logic here, but framed as story beats.
  const base = [
    { id: 'first', title: 'First appearance', sub: 'A beginning that didn’t need momentum.' },
    { id: 'quiet', title: 'Quiet consistency', sub: 'Small returns. Less negotiation.' },
    { id: 'forming', title: 'Something is forming', sub: 'A shape you can recognize in yourself.' },
    { id: 'yours', title: 'Yours to name', sub: 'You decide what this becomes.' },
  ]

  let unlocked = 0
  if (doneSteps.length > 0) unlocked = 1
  if (doneSteps.length >= 2 || hasAnyDiary) unlocked = 2
  if (doneSteps.length >= 3 && hasAnyDiary) unlocked = 3
  return { items: base, unlocked }
}

function loadDiaryPeek() {
  try {
    const raw = localStorage.getItem('nuzzle-diary-entries')
    if (!raw) return null
    const entries = JSON.parse(raw)
    if (!Array.isArray(entries) || !entries.length) return null
    // most recent by date then id
    const sorted = [...entries].sort((a, b) => {
      const da = String(a.date || '')
      const db = String(b.date || '')
      if (da !== db) return da < db ? 1 : -1
      return (b.id || 0) - (a.id || 0)
    })
    return sorted[0]
  } catch {
    return null
  }
}

export default function MeScreen({ go, profile, updateProfile, steps = [] }) {
  const petName = profile?.petName || 'your companion'
  const goal = profile?.goal || 'a steadier day'
  const tone = profile?.tone || 'steady'

  const doneSteps = useMemo(() => steps.filter(s => s.tag === 'done'), [steps])
  const [diaryPeek, setDiaryPeek] = useState(() => loadDiaryPeek())

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'nuzzle-diary-entries') setDiaryPeek(loadDiaryPeek())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const narrative = useMemo(() => {
    return buildJourneyNarrative({ petName, goal, doneSteps })
  }, [petName, goal, doneSteps])

  const milestones = useMemo(() => {
    const hasAnyDiary = !!diaryPeek
    return computeMilestones({ doneSteps, hasAnyDiary })
  }, [doneSteps, diaryPeek])

  function setTone(next) {
    updateProfile?.('tone', next)
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => go?.('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l-5-5 5-5" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={styles.headerTitle}>Me</span>
        <span className={styles.toneBadge}>{toneLabel(tone)}</span>
      </div>

      <div className={styles.scroll}>
        {/* Journey narrative */}
        <motion.div
          className={styles.narrativeCard}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className={styles.narrativeText}>&#8220;{narrative}&#8221;</p>
          <span className={styles.narrativeHint}>A reflection from your coach. Qualitative, not counted.</span>
        </motion.div>

        {/* Milestones */}
        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>Milestones</span>
          <span className={styles.sectionSub}>Named, not numbered</span>
        </div>
        <div className={styles.milestones}>
          {milestones.items.map((m, idx) => {
            const locked = idx > milestones.unlocked
            const current = idx === milestones.unlocked
            return (
              <div
                key={m.id}
                className={`${styles.milestone} ${current ? styles.milestoneCurrent : ''} ${locked ? styles.milestoneLocked : ''}`}
              >
                <div className={styles.milestoneTop}>
                  <span className={styles.milestoneTitle}>{m.title}</span>
                  {locked ? <span className={styles.lockTag}>Locked</span> : <span className={styles.openTag}>{current ? 'Now' : 'Kept'}</span>}
                </div>
                <p className={styles.milestoneSub}>{m.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Tone selector */}
        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>Accountability tone</span>
          <span className={styles.sectionSub}>Always user-controlled</span>
        </div>
        <div className={styles.toneGrid}>
          {TONES.map(t => (
            <button
              key={t.value}
              className={`${styles.toneCard} ${tone === t.value ? styles.toneCardActive : ''}`}
              onClick={() => setTone(t.value)}
            >
              <span className={styles.toneName}>{t.name}</span>
              <span className={styles.toneDesc}>{t.desc}</span>
            </button>
          ))}
        </div>

        {/* Diary peek */}
        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>Journal</span>
          <span className={styles.sectionSub}>A place to be honest</span>
        </div>
        <div className={styles.diaryCard} onClick={() => go?.('diary')} role="button" tabIndex={0}>
          {diaryPeek ? (
            <>
              <p className={styles.diaryPeek}>&#8220;{String(diaryPeek.text || '').slice(0, 140)}{String(diaryPeek.text || '').length > 140 ? '…' : ''}&#8221;</p>
              <span className={styles.diaryMeta}>Most recent entry</span>
            </>
          ) : (
            <>
              <p className={styles.diaryPeek}>&#8220;A quiet place for whatever happened today.&#8221;</p>
              <span className={styles.diaryMeta}>No entries yet</span>
            </>
          )}
          <button className={styles.diaryCta} onClick={(e) => { e.stopPropagation(); go?.('diary') }}>
            Write today’s entry →
          </button>
        </div>

        {/* Account + Settings */}
        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>Account</span>
          <span className={styles.sectionSub}>Basics</span>
        </div>
        <div className={styles.basicCard}>
          <div className={styles.basicRow}>
            <span className={styles.basicLabel}>Profile</span>
            <span className={styles.basicValue}>{petName} · {goal}</span>
          </div>
          <div className={styles.basicRow}>
            <span className={styles.basicLabel}>Sign-in</span>
            <span className={styles.basicValueMuted}>Guest (local demo)</span>
          </div>
        </div>

        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>Subscription</span>
          <span className={styles.sectionSub}>Manage plan</span>
        </div>
        <div className={styles.basicCard}>
          <div className={styles.basicRow}>
            <span className={styles.basicLabel}>Plan</span>
            <span className={styles.basicValueMuted}>Not connected</span>
          </div>
          <button className={styles.disabledBtn} disabled>
            View plans
          </button>
        </div>

        <div className={styles.sectionRow}>
          <span className={styles.sectionTitle}>Payment methods</span>
          <span className={styles.sectionSub}>Cards & wallets</span>
        </div>
        <div className={styles.basicCard}>
          <div className={styles.basicRow}>
            <span className={styles.basicLabel}>Saved</span>
            <span className={styles.basicValueMuted}>None</span>
          </div>
          <button className={styles.disabledBtn} disabled>
            Add payment method
          </button>
        </div>
      </div>

      <NavBar go={go} active="me" />
    </div>
  )
}

