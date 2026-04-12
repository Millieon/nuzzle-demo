import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import buildStepsFromProfile from '../buildSteps'
import styles from './CoachScreen.module.css'

// ── Build dynamic system prompt from profile ────────────────────────────────
function buildSystemPrompt(profile) {
  const goal = profile.goal || 'your goal'
  const wake = profile.wake || 'not specified'
  const energy = profile.energy || 'not specified'
  const free = profile.free || 'not specified'
  const blocker = profile.blocker || 'not specified'
  const motivationStyle = profile.motivationStyle || 'not specified'
  const tone = profile.tone || 'steady'

  const toneRules = {
    gentle: 'Be warm and encouraging, never pressuring. Celebrate every small effort.',
    coach: 'Be direct and action-oriented. Name setbacks honestly and suggest concrete restart steps.',
    ambient: 'Be light-touch and never demanding. Offer gentle nudges, not instructions.',
    steady: 'Be calm and measured. Balanced between warmth and directness.',
  }

  const motivationRules = {
    social: 'Use accountability framing — "show up for someone", suggest sharing progress.',
    reward: 'Use milestones and visible wins — reference streaks, progress markers, and rewards.',
    structure: 'Give structured plans and checklists — be specific about order and timing.',
    intrinsic: 'Connect back to their personal why — help them feel the meaning behind the work.',
  }

  return `You are a personal coach inside Nuzzle, a habit-building companion app. You are intelligent, warm, and genuinely helpful — never generic.

== WHAT YOU ALREADY KNOW (from onboarding) ==
- Goal: ${goal}
- Wake time: ${wake}
- Best energy window: ${energy}
- Free time pockets: ${free}
- What stopped them before: ${blocker}
- Motivation style: ${motivationStyle}
- Preferred tone: ${tone}

== YOUR COACHING APPROACH ==
You operate in two phases:

PHASE 1 — INTAKE (first 3–5 exchanges):
You have their onboarding profile above but you do NOT yet have goal-specific context. You MUST gather this before giving any advice. Ask ONE question at a time — never list all questions at once. Be warm, not clinical.

Detect the goal type and ask the most important missing context:

For FITNESS / GYM / EXERCISE / WEIGHT goals, ask one at a time:
- Current fitness level (beginner / intermediate / athletic)
- Height and weight (for load calibration and pacing)
- Any injuries or physical limitations
- Gym access (membership, home equipment, or none)
- How many sessions per week they can realistically do
- Time available per session

For WRITING / CREATIVE / BOOK / JOURNAL goals, ask one at a time:
- What format (novel / essays / blog / journal / screenwriting)
- Current output, if any (how much are they writing now?)
- Biggest block (blank page / time / perfectionism / finishing)
- What a 30-day win looks like for them

For MEDITATION / SLEEP / ANXIETY / STRESS / MINDFULNESS goals, ask one at a time:
- Current practice level (never tried / occasional / lapsed regular)
- Main stress triggers
- Morning or evening preference for practice
- Any techniques already tried (apps, guided, breathwork)

For LEARNING / LANGUAGE / SKILL / STUDY goals, ask one at a time:
- Current level in the subject
- Preferred learning format (reading / video / hands-on practice)
- Daily time available for study
- Specific target (exam / conversational fluency / hobby proficiency)

For ANY OTHER GOAL:
- Identify and ask the 2–3 most important contextual gaps: current baseline, frequency, environment, and obstacles.

PHASE 2 — COACHING (once intake is complete):
Transition naturally (e.g. "That gives me a clear picture." or "That's everything I need to work with."). Then deliver a personalised plan that references their actual data. After the plan, handle follow-ups as an ongoing coach.

== TONE RULES ==
${toneRules[tone] || toneRules.steady}
${motivationStyle && motivationRules[motivationStyle] ? motivationRules[motivationStyle] : ''}

== HARD RULES ==
- Never say "Great question!" or any hollow filler phrase.
- Never be generic — always reference the user's actual data.
- During intake: keep replies to 2–4 sentences + the next question.
- During coaching: keep replies to 4–6 sentences unless the user asks for detail.
- After intake, plans MUST reference their schedule (energy window: ${energy}, free pockets: ${free}, wake time: ${wake}) and their specific goal data.
- Format plans with clear structure when appropriate — use line breaks between steps, not walls of text.
- Use ** for bold headings in plans so they are easy to scan.
- Do not use exclamation marks excessively. Be genuine, not performative.`
}

// ── Greeting generator ──────────────────────────────────────────────────────
function greetingForContext(petName, goal, blocker) {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  const blockerHints = {
    restart: 'Picking back up is the hardest part — and you just did it.',
    life: 'Life will keep interrupting. The trick is making the steps small enough to fit between.',
    start: 'You don\'t need the full picture. Just the next step.',
    forgot: 'Showing up here is a form of remembering.',
    new: 'Starting fresh means no bad habits to unlearn. That\'s an advantage.',
  }

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
  let greeting = pool[Math.floor(Math.random() * pool.length)]
  if (blocker && blockerHints[blocker]) {
    greeting += ' ' + blockerHints[blocker]
  }
  return greeting
}

// ── Simple markdown renderer ────────────────────────────────────────────────
function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Empty line → spacer
    if (!line.trim()) {
      elements.push(<div key={i} style={{ height: 8 }} />)
      i++
      continue
    }

    // Bold-only line → heading
    const boldMatch = line.match(/^\*\*(.+?)\*\*$/)
    if (boldMatch) {
      elements.push(
        <p key={i} className={styles.mdHeading}>{boldMatch[1]}</p>
      )
      i++
      continue
    }

    // Numbered list item
    const numMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      elements.push(
        <div key={i} className={styles.mdListItem}>
          <span className={styles.mdListNum}>{numMatch[1]}.</span>
          <span>{renderInlineBold(numMatch[2])}</span>
        </div>
      )
      i++
      continue
    }

    // Bullet list item (- or *)
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)/)
    if (bulletMatch) {
      const indented = line.match(/^\s{2,}/)
      elements.push(
        <div key={i} className={`${styles.mdListItem} ${indented ? styles.mdIndented : ''}`}>
          <span className={styles.mdBullet} />
          <span>{renderInlineBold(bulletMatch[1])}</span>
        </div>
      )
      i++
      continue
    }

    // Regular paragraph
    elements.push(
      <p key={i} className={styles.mdPara}>{renderInlineBold(line)}</p>
    )
    i++
  }

  return elements
}

function renderInlineBold(text) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

// ── Detect if a message is a plan ───────────────────────────────────────────
function isPlanMessage(text) {
  const planSignals = [
    /week\s*\d/i,
    /\*\*week/i,
    /plan\*\*/i,
    /session\s*[a-c]/i,
    /\*\*day\s*\d/i,
    /\*\*phase/i,
    /daily\s*habit/i,
    /suggested\s*schedule/i,
  ]
  const matchCount = planSignals.filter(re => re.test(text)).length
  // Also check for structural density — multiple bold headings + list items
  const boldCount = (text.match(/\*\*.+?\*\*/g) || []).length
  const listCount = (text.match(/^\s*[-*\d]/gm) || []).length
  return matchCount >= 2 || (boldCount >= 3 && listCount >= 4)
}

// ── API call ────────────────────────────────────────────────────────────────
async function callCoach(systemPrompt, messages) {
  const apiMessages = messages.map(m => ({
    role: m.role,
    content: m.text,
  }))

  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    }),
  })

  if (!response.ok) throw new Error('Coach API error')
  const data = await response.json()
  return data.content?.[0]?.text?.trim() || "Let me think about that for a moment."
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function CoachScreen({ go, profile, steps = [], setSteps }) {
  const petName = profile?.petName || 'your companion'
  const goal = profile?.goal || 'your goal'
  const tone = profile?.tone || 'steady'
  const blocker = profile?.blocker || ''

  const initialSteps = useMemo(() => buildStepsFromProfile(profile || {}), [profile])
  const [greeting] = useState(() => greetingForContext(petName, goal, blocker))
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pinnedPlan, setPinnedPlan] = useState(null)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)
  const hasMounted = useRef(false)

  const systemPrompt = useRef(buildSystemPrompt(profile || {})).current

  const hour = new Date().getHours()
  const timeLabel = hour < 12 ? 'This morning' : hour < 17 ? 'This afternoon' : 'This evening'
  const doneCount = (steps || []).filter(s => s.tag === 'done').length

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, loading, pinnedPlan])

  // On mount: kick off intake
  useEffect(() => {
    if (hasMounted.current) return
    hasMounted.current = true

    const opener = { role: 'user', text: `Hi, I want to work on: ${profile?.goal || 'my goal'}` }
    setMessages([opener])
    setLoading(true)

    callCoach(systemPrompt, [opener])
      .then(reply => {
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm here — tell me more about what you're working on." }])
      })
      .finally(() => setLoading(false))
  }, [systemPrompt, profile?.goal])

  function toggleStep(id) {
    if (!setSteps) return
    setSteps(prev => (prev || []).map(s => {
      if (s.id !== id) return s
      if (s.tag === 'done') {
        const original = initialSteps.find(ss => ss.id === id)
        return { ...s, tag: original?.tag || 'later' }
      }
      return { ...s, tag: 'done' }
    }))
  }

  const send = useCallback(() => {
    const val = input.trim()
    if (!val || loading) return

    const userMsg = { role: 'user', text: val }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    callCoach(systemPrompt, updated)
      .then(reply => {
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
        if (isPlanMessage(reply)) setPinnedPlan(reply)
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: "I lost my train of thought — could you say that again?" }])
      })
      .finally(() => setLoading(false))
  }, [input, loading, messages, systemPrompt])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function handleInput(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

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

        {/* ── Pinned AI Plan (appears once coach generates one) ── */}
        <AnimatePresence>
          {pinnedPlan && (
            <motion.div className={styles.planCard}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.planHeader}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#888" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="12" height="12" rx="2"/>
                  <line x1="5" y1="6" x2="11" y2="6"/>
                  <line x1="5" y1="9" x2="9" y2="9"/>
                </svg>
                <span className={styles.planHeaderLabel}>Your plan</span>
              </div>
              <div className={styles.planBody}>
                {renderMarkdown(pinnedPlan)}
              </div>
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
          {messages.map((m, i) => (
            m.role === 'assistant' ? (
              <motion.div key={i} className={styles.replyBubble}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.replySig}>
                  <span className={styles.replySigDot} />
                  <span className={styles.replySigName}>Coach</span>
                </div>
                <div className={styles.replyText}>{renderMarkdown(m.text)}</div>
              </motion.div>
            ) : (
              <motion.div key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={styles.userBubble}
              >
                {m.text}
              </motion.div>
            )
          ))}
        </AnimatePresence>

        {loading && (
          <div className={styles.typing}>
            {[0,1,2].map(i => <span key={i} style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
      </div>

      {/* ── Input bar ── */}
      <div className={styles.askWrap}>
        <div className={styles.askInner}>
          <textarea
            ref={textareaRef}
            className={styles.askInput}
            placeholder="Ask your coach anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            rows={1}
          />
          <button
            className={styles.askSend}
            disabled={!input.trim() || loading}
            onClick={send}
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
