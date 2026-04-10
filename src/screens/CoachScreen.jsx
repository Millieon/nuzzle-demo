import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

  // Tone rules
  const toneRules = {
    gentle: 'Be warm and encouraging, never pressuring. Celebrate every small effort.',
    coach: 'Be direct and action-oriented. Name setbacks honestly and suggest concrete restart steps.',
    ambient: 'Be light-touch and never demanding. Offer gentle nudges, not instructions.',
    steady: 'Be calm and measured. Balanced between warmth and directness.',
  }

  // Motivation framing
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
- Do not use exclamation marks excessively. Be genuine, not performative.`
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

// ── CoachScreen ─────────────────────────────────────────────────────────────
export default function CoachScreen({ go, profile }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const hasMounted = useRef(false)

  const systemPrompt = useRef(buildSystemPrompt(profile || {})).current
  const goal = profile?.goal || 'your goal'
  const goalDisplay = goal.length > 30 ? goal.slice(0, 30) + '...' : goal

  // Auto-scroll on new messages or loading change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // On mount: kick off intake with synthetic opening message
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

  const send = useCallback(() => {
    const val = input.trim()
    if (!val || loading) return

    const userMsg = { role: 'user', text: val }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    callCoach(systemPrompt, updated)
      .then(reply => {
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      })
      .catch(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: "I lost my train of thought — could you say that again?" }])
      })
      .finally(() => setLoading(false))
  }, [input, loading, messages, systemPrompt])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  function handleInput(e) {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => go('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l-5-5 5-5" stroke="#111" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className={styles.headerCenter}>
          <span className={styles.headerTitle}>Coach</span>
          <span className={styles.headerGoal}>{goalDisplay}</span>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Messages */}
      <div className={styles.messageList}>
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              className={`${styles.msgRow} ${m.role === 'user' ? styles.msgRowUser : styles.msgRowCoach}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {m.role === 'assistant' && (
                <div className={styles.avatar}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="5" cy="6" r="1.2" fill="#fff"/>
                    <circle cx="9" cy="6" r="1.2" fill="#fff"/>
                    <path d="M5 9.5c0 0 1 1.2 2 1.2s2-1.2 2-1.2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
              )}
              <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleCoach}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading dots */}
        {loading && (
          <motion.div
            className={`${styles.msgRow} ${styles.msgRowCoach}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className={styles.avatar}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="5" cy="6" r="1.2" fill="#fff"/>
                <circle cx="9" cy="6" r="1.2" fill="#fff"/>
                <path d="M5 9.5c0 0 1 1.2 2 1.2s2-1.2 2-1.2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className={`${styles.bubble} ${styles.bubbleCoach}`}>
              <div className={styles.dots}>
                {[0, 1, 2].map(i => (
                  <span key={i} className={styles.dot} style={{ animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className={styles.inputBar}>
        <div className={styles.inputPill}>
          <textarea
            ref={textareaRef}
            className={styles.input}
            placeholder="Message your coach..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            onInput={handleInput}
            rows={1}
          />
          <button
            className={styles.sendBtn}
            onClick={send}
            disabled={!input.trim() || loading}
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
