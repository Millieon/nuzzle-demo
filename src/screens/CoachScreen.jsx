import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './CoachScreen.module.css'

// ── Greeting generator ──────────────────────────────────────────────────────
function greetingForContext(petName, goal) {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const greetings = {
    morning: [
      `The ${time} is still quiet. A good shape for starting small.`,
      `You're here before the day fills up. That's already something.`,
      `It's early. No rush — just a window, if you want it.`,
    ],
    afternoon: [
      `The day's halfway through. Sometimes the second half is where things land.`,
      `Afternoon. The busy part might be done — or maybe it's just beginning.`,
      `You came back. That's not nothing.`,
    ],
    evening: [
      `The evening has its own rhythm. Slower, usually. Sometimes that helps.`,
      `End of the day. Not everything needs to happen before it's over.`,
      `It's late enough to stop pushing. Or just late enough to start one small thing.`,
    ],
  }

  const pool = greetings[time] || greetings.morning
  return pool[Math.floor(Math.random() * pool.length)]
}

// ── Seed data ────────────────────────────────────────────────────────────────
const SEED_STEPS = [
  { id: 1, text: '5 minutes of breathing — before anything else', time: 'Morning', tag: 'done' },
  { id: 2, text: 'Write 200 words of your chapter', time: 'Afternoon', tag: 'now' },
  { id: 3, text: 'Walk outside — any distance counts', time: '6 pm', tag: 'later' },
  { id: 4, text: 'Read 15 minutes before bed', time: '9 pm', tag: 'later' },
]

// ── Claude API call ─────────────────────────────────────────────────────
async function askCoach(messages, { petName, goal, tone, steps }) {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'

  const doneSteps = steps.filter(s => s.tag === 'done').map(s => s.text)
  const pendingSteps = steps.filter(s => s.tag !== 'done').map(s => `${s.text} (${s.time})`)

  const system = `You are a gentle, thoughtful habit coach inside Nuzzle, a companion app. The user has a virtual pet named "${petName}".
Their active goal is: "${goal}"
Preferred tone: ${tone}
It is currently ${timeOfDay}.

Today's progress:
- Done: ${doneSteps.length ? doneSteps.join(', ') : 'nothing yet'}
- Remaining: ${pendingSteps.length ? pendingSteps.join(', ') : 'all done'}

Guidelines:
- Be warm but not performative. No exclamation marks. No emoji.
- Keep replies to 2-3 sentences. Be specific to their situation.
- Never say "proud", "amazing", "journey", or "you've got this".
- Speak like a thoughtful friend who's been paying attention, not a motivational poster.
- If they ask about strategy, give one concrete suggestion. Don't list options.`

  const apiMessages = messages.map(m => ({
    role: m.type === 'user' ? 'user' : 'assistant',
    content: m.text,
  }))

  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system,
      messages: apiMessages,
    }),
  })

  if (!response.ok) throw new Error('Coach API error')
  const data = await response.json()
  return data.content?.[0]?.text?.trim() || "I'm here — let me think on that."
}

const FALLBACK_REPLIES = [
  "That's a fair question. Let me think about how to frame it around what you've told me about your schedule.",
  "You don't need to do everything today. The point is direction, not distance.",
  "Here's what I'd suggest: keep the morning anchor. If the rest slips, the morning one holds the pattern.",
]

// ── Main ─────────────────────────────────────────────────────────────────────
export default function CoachScreen({ go, profile }) {
  const petName = profile?.petName || 'your companion'
  const goal = profile?.goal || 'Build a daily writing habit'
  const tone = profile?.tone || 'steady'

  const [steps, setSteps] = useState(SEED_STEPS)
  const [greeting] = useState(() => greetingForContext(petName, goal))
  const [showRestart, setShowRestart] = useState(true)
  const [askText, setAskText] = useState('')
  const [replies, setReplies] = useState([])
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)

  const hour = new Date().getHours()
  const timeLabel = hour < 12 ? 'This morning' : hour < 17 ? 'This afternoon' : 'This evening'

  const doneCount = steps.filter(s => s.tag === 'done').length

  function toggleStep(id) {
    setSteps(prev => prev.map(s => {
      if (s.id !== id) return s
      if (s.tag === 'done') {
        // un-check: find the right tag based on position
        const idx = SEED_STEPS.findIndex(ss => ss.id === id)
        return { ...s, tag: SEED_STEPS[idx]?.tag || 'later' }
      }
      return { ...s, tag: 'done' }
    }))
  }

  function handleRestart() {
    // Reset all steps, dismiss banner
    setSteps(SEED_STEPS.map(s => ({ ...s, tag: s.tag === 'done' ? SEED_STEPS.find(ss => ss.id === s.id)?.tag || 'later' : s.tag })))
    setShowRestart(false)
  }

  async function handleAsk() {
    if (!askText.trim()) return
    const q = askText.trim()
    setAskText('')
    const updated = [...replies, { type: 'user', text: q }]
    setReplies(updated)
    setTyping(true)

    try {
      const reply = await askCoach(updated, { petName, goal, tone, steps })
      setReplies(prev => [...prev, { type: 'coach', text: reply }])
    } catch {
      const fallback = FALLBACK_REPLIES[Math.floor(Math.random() * FALLBACK_REPLIES.length)]
      setReplies(prev => [...prev, { type: 'coach', text: fallback }])
    } finally {
      setTyping(false)
    }
  }

  // Auto-scroll when new replies appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [replies, typing])

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => go?.('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l-5-5 5-5" stroke="#111" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Coach</span>
      </div>

      {/* Scrollable content */}
      <div className={styles.scroll} ref={scrollRef}>

        {/* ── Greeting card (dark) ── */}
        <motion.div className={styles.greeting}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.greetingPetRow}>
            <div className={styles.greetingPetDot}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="10" r="4" fill="rgba(255,255,255,0.25)"/>
                <circle cx="8" cy="6.5" r="3" fill="rgba(255,255,255,0.25)"/>
                <polygon points="5,5 4,2 7,4" fill="rgba(255,255,255,0.2)"/>
                <polygon points="11,5 12,2 9,4" fill="rgba(255,255,255,0.2)"/>
              </svg>
            </div>
            <span className={styles.greetingPetStatus}>{petName} is nearby — resting</span>
          </div>
          <p className={styles.greetingText}>{greeting}</p>
          <span className={styles.greetingTime}>{timeLabel}</span>
        </motion.div>

        {/* ── Active goal ── */}
        <motion.div className={styles.goalCard}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <div className={styles.goalIcon}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#888" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17V3l12 7-12 7z"/>
            </svg>
          </div>
          <div className={styles.goalBody}>
            <p className={styles.goalLabel}>Active goal</p>
            <p className={styles.goalTitle}>{goal}</p>
            <p className={styles.goalSub}>Focused on consistency over intensity. Small steps, repeated.</p>
          </div>
        </motion.div>

        {/* ── Restart banner (contextual) ── */}
        <AnimatePresence>
          {showRestart && (
            <motion.div className={styles.restartBanner}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className={styles.restartText}>
                It's been a few days. That's fine — gaps happen, and they don't erase what came before. Pick up from here.
              </p>
              <button className={styles.restartBtn} onClick={handleRestart}>
                Start fresh from today
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Today's steps ── */}
        <div className={styles.stepsHeader}>
          <span className={styles.stepsTitle}>Today's steps</span>
          <span className={styles.stepsCount}>{doneCount}/{steps.length}</span>
        </div>

        <div className={styles.stepsList}>
          {steps.map((step, i) => (
            <motion.div key={step.id} className={styles.step}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.12 + i * 0.04 }}
            >
              <button
                className={`${styles.stepCheck} ${step.tag === 'done' ? styles.stepCheckDone : ''}`}
                onClick={() => toggleStep(step.id)}
              >
                {step.tag === 'done' && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className={styles.stepBody}>
                <p className={`${styles.stepText} ${step.tag === 'done' ? styles.stepTextDone : ''}`}>
                  {step.text}
                </p>
                <div className={styles.stepMeta}>
                  <span className={`${styles.stepTag} ${
                    step.tag === 'done' ? styles.tagDone :
                    step.tag === 'now'  ? styles.tagNow  :
                    styles.tagLater
                  }`}>
                    {step.tag === 'done' ? 'Done' : step.tag === 'now' ? 'Now' : 'Later'}
                  </span>
                  <span className={styles.stepTime}>{step.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Coach conversation ── */}
        <AnimatePresence>
          {replies.map((r, i) => (
            r.type === 'coach' ? (
              <motion.div key={i} className={styles.replyBubble}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.replySig}>
                  <span className={styles.replySigDot} />
                  <span className={styles.replySigName}>Coach</span>
                </div>
                <p className={styles.replyText}>{r.text}</p>
              </motion.div>
            ) : (
              <motion.div key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: 'flex-end',
                  background: '#111', color: '#fff',
                  borderRadius: '16px 16px 4px 16px',
                  padding: '12px 16px',
                  fontFamily: 'var(--sans)', fontSize: 14,
                  maxWidth: '80%', lineHeight: 1.5,
                }}
              >
                {r.text}
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {typing && (
          <div className={styles.typing}>
            {[0,1,2].map(i => <span key={i} style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
      </div>

      {/* ── Ask your coach (persistent input) ── */}
      <div className={styles.askWrap}>
        <div className={styles.askInner}>
          <input
            className={styles.askInput}
            placeholder="Ask your coach anything…"
            value={askText}
            onChange={e => setAskText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAsk() }}
          />
          <button
            className={styles.askSend}
            disabled={!askText.trim() || typing}
            onClick={handleAsk}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M9 3l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
