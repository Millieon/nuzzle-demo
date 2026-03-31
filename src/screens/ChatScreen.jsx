import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CatModel from '../components/CatModel'
import styles from './ChatScreen.module.css'

const QUESTIONS = [
  { q: "Hi! I'm so happy to meet you. What's your name?",                          type: 'name' },
  { q: "Nice to meet you. Let's start with one goal today — what's something you've been wanting to do but keep putting off?", type: 'goal' },
  { q: "How long have you been wanting to work on this?",                           type: 'duration' },
  { q: "What would success look like for you in the next 30 days? Even a small win counts.", type: 'success' },
  { q: "How much time could you realistically set aside each day — 5 minutes, 15, maybe more?", type: 'time' },
  { q: "Last one: on a scale of 1 to 10, how motivated do you feel about this goal right now?", type: 'motivation' },
]

export default function ChatScreen({ go, updateProfile }) {
  const [messages, setMessages] = useState([])
  const [qIdx, setQIdx]         = useState(0)
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [recording, setRecording] = useState(false)
  const [answers, setAnswers]   = useState({})
  const messagesEndRef           = useRef()
  const inputRef                 = useRef()

  // Kick off first question
  useEffect(() => {
    askQuestion(0, [])
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  function askQuestion(idx, currentMessages) {
    if (idx >= QUESTIONS.length) return
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { role: 'pet', text: QUESTIONS[idx].q }])
    }, 1000)
  }

  function submit() {
    const val = input.trim()
    if (!val) return

    const newAnswers = { ...answers, [QUESTIONS[qIdx].type]: val }
    setAnswers(newAnswers)
    updateProfile(QUESTIONS[qIdx].type, val)
    setMessages(prev => [...prev, { role: 'user', text: val }])
    setInput('')

    const next = qIdx + 1
    setQIdx(next)

    if (next < QUESTIONS.length) {
      setTimeout(() => askQuestion(next, []), 500)
    } else {
      // All answered — send closing message then navigate
      setTyping(true)
      setTimeout(() => {
        setTyping(false)
        const score = parseInt(newAnswers.motivation || '0')
        let closer
        if (score >= 8)      closer = `A ${score} — that's real energy. Let's make it count. ✨`
        else if (score >= 5) closer = `A ${score} is a great place to start. We'll build from here. ✨`
        else if (score > 0)  closer = `Even at ${score}, showing up is what matters. I've got you. ✨`
        else                 closer = "I have everything I need. Let's build something together. ✨"
        setMessages(prev => [...prev, { role: 'pet', text: closer }])
        setTimeout(() => go('home'), 1800)
      }, 1000)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  function toggleMic() {
    setRecording(r => {
      if (!r) {
        setTimeout(() => {
          const demos = ["About 3 months", "Run 5km without stopping", "15 minutes a day", "I want to write every morning", "7 out of 10", "Around 6 months now"]
          setInput(demos[qIdx % demos.length])
          setRecording(false)
        }, 2000)
        return true
      }
      return false
    })
  }

  const progress = (qIdx / QUESTIONS.length) * 100

  return (
    <div className={styles.root}>
      {/* Cat + typing indicator */}
      <div className={styles.catZone}>
        <Suspense fallback={<div className={styles.catPlaceholder} />}>
          <CatModel
            height="100%"
            scale={1.5}
            position={[0, -1.2, 0]}
            mood={typing ? 'thinking' : 'idle'}
            showShadow={false}
            cameraPosition={[0, 0.2, 4]}
          />
        </Suspense>
        <AnimatePresence>
          {typing && (
            <motion.div
              className={styles.typingDots}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {[0,1,2].map(i => <span key={i} className={styles.td} style={{ animationDelay: `${i*0.2}s` }} />)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <motion.div className={styles.progressFill} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
      </div>

      {/* Chat panel */}
      <div className={styles.chatPanel}>
        <div className={styles.messages}>
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                className={`${styles.msg} ${m.role === 'user' ? styles.msgUser : styles.msgPet}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                <div className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubblePet}`}>
                  {m.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputRow}>
          <textarea
            ref={inputRef}
            className={styles.input}
            placeholder="Type your answer…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
          />
          <button
            className={`${styles.micBtn} ${recording ? styles.recording : ''}`}
            onClick={toggleMic}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="5" y="1" width="6" height="9" rx="3" fill="#fff"/>
              <path d="M2 8a6 6 0 0012 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <line x1="8" y1="14" x2="8" y2="16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="5" y1="16" x2="11" y2="16" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button className={styles.sendBtn} onClick={submit} disabled={!input.trim()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="#fff"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
