import { useState, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import styles from './HomeScreen.module.css'

// ── Walking cat — positional roaming, no animation dependency ─────────────
function RoomCat() {
  const ref  = useRef()
  const { scene } = useGLTF('/ar_ready_pet_walking.glb')

  const state = useRef({
    x: 0, z: 0,
    tx: 0.5, tz: 0.3,
    angle: 0,
    phase: 'walk',  // 'walk' | 'turn' | 'pause'
    timer: 0,
    // leg bob accumulator
    bob: 0,
  })

  function pickTarget() {
    const s = state.current
    s.tx = (Math.random() - 0.5) * 1.4
    s.tz = (Math.random() - 0.5) * 0.8
    s.phase = 'walk'
  }

  useFrame((_, delta) => {
    if (!ref.current) return
    const s    = state.current
    const SPEED = 0.22   // slow, deliberate walk
    const STOP  = 0.06

    if (s.phase === 'walk') {
      const dx   = s.tx - s.x
      const dz   = s.tz - s.z
      const dist = Math.sqrt(dx*dx + dz*dz)

      if (dist < STOP) {
        s.phase = 'pause'
        s.timer = 1.2 + Math.random() * 2.5
      } else {
        // Translate
        const step = Math.min(SPEED * delta, dist)
        s.x += (dx / dist) * step
        s.z += (dz / dist) * step

        // Smooth face-direction rotation
        const targetAngle = Math.atan2(dx, dz)
        let diff = targetAngle - s.angle
        if (diff >  Math.PI) diff -= Math.PI * 2
        if (diff < -Math.PI) diff += Math.PI * 2
        s.angle += diff * Math.min(delta * 5, 1)

        // Leg bob while walking
        s.bob += delta * 9
      }
    } else {
      s.timer -= delta
      if (s.timer <= 0) pickTarget()
    }

    // Apply position + facing
    ref.current.position.x = s.x
    ref.current.position.z = s.z
    ref.current.rotation.y = s.angle

    // Vertical bob: faster + more pronounced while walking, gentle idle breathe when stopped
    const isWalking = s.phase === 'walk'
    const bobFreq   = isWalking ? 9 : 1.2
    const bobAmp    = isWalking ? 0.022 : 0.008
    ref.current.position.y = -1.1 + Math.sin(s.bob * (isWalking ? 1 : 0.13)) * bobAmp

    // Slight body lean into the walk direction
    ref.current.rotation.z = isWalking ? Math.sin(s.bob) * 0.025 : 0
    ref.current.rotation.x = isWalking ? -0.04 : 0
  })

  return (
    <group ref={ref} position={[0, -1.1, 0]} scale={1.6}>
      <primitive object={scene.clone()} />
    </group>
  )
}

function FallbackCatRoom() {
  const ref = useRef()
  useFrame(s => {
    if (ref.current) ref.current.position.y = -1.1 + Math.sin(s.clock.elapsedTime * 0.7) * 0.03
  })
  return (
    <group ref={ref}>
      <mesh position={[0,-0.6,0]}>
        <sphereGeometry args={[0.55,32,32]} />
        <meshStandardMaterial color="#D4C4B0" roughness={0.55} />
      </mesh>
      <mesh position={[0,0.12,0]}>
        <sphereGeometry args={[0.38,32,32]} />
        <meshStandardMaterial color="#D4C4B0" roughness={0.55} />
      </mesh>
    </group>
  )
}

function NavBar() {
  return (
    <nav className={styles.nav}>
      {[
        { label:'Home',  active:true  },
        { label:'Room',  active:false },
        { label:'Coach', active:false },
        { label:'Diary', active:false },
        { label:'Me',    active:false },
      ].map(item => (
        <div key={item.label} className={`${styles.navItem} ${item.active ? styles.navActive : ''}`}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
               stroke={item.active ? '#111' : '#ccc'} strokeWidth="1.5">
            {item.label==='Home'  && <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>}
            {item.label==='Room'  && <><rect x="2" y="8" width="18" height="12" rx="1.5"/><path d="M6 8V6a5 5 0 0110 0v2"/></>}
            {item.label==='Coach' && <><circle cx="11" cy="11" r="8"/><path d="M11 7v4l2.5 2.5"/></>}
            {item.label==='Diary' && <><rect x="4" y="2" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="14" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="11" y2="16"/></>}
            {item.label==='Me'    && <><circle cx="11" cy="8" r="3.5"/><path d="M3.5 19c0-4.142 3.358-7 7.5-7s7.5 2.858 7.5 7"/></>}
          </svg>
          <span className={styles.navLabel}>{item.label}</span>
        </div>
      ))}
    </nav>
  )
}

const TASKS = [
  { text:'5 min breathing before work',      time:'Morning'   },
  { text:'Write 200 words of your chapter',  time:'Afternoon' },
  { text:'Evening walk — any length counts', time:'6 pm'      },
  { text:'Read 15 minutes before bed',       time:'9 pm'      },
]
const BUBBLES = [
  'Ready when you are.',
  'Good start. Keep it up.',
  'Almost there. One more.',
  'All done. I noticed. ✨',
]

export default function HomeScreen() {
  const [taskIdx, setTaskIdx] = useState(0)
  const [ticked,  setTicked]  = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [flash,   setFlash]   = useState(false)

  const donePct = taskIdx / TASKS.length
  const now     = new Date()
  const days    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`

  function handleTick() {
    if (allDone || ticked) return
    setTicked(true); setFlash(true)
    setTimeout(() => setFlash(false), 300)
    setTimeout(() => {
      setTicked(false)
      const next = taskIdx + 1
      if (next >= TASKS.length) setAllDone(true)
      else setTaskIdx(next)
    }, 380)
  }

  return (
    <div className={styles.root}>

      <div className={styles.roomEnv}>
        <div className={styles.roomBg}>
          <div className={styles.wallBack} />
          <div className={styles.floor} />
          <div className={styles.wallLeft} />
          <div className={styles.wallRight} />
          <div className={styles.ceiling} />
          <div className={styles.window}>
            <div className={styles.windowPane} />
            <div className={styles.windowLight} />
          </div>
          <div className={styles.shelf}>
            <div className={styles.shelfItem} style={{left:'5%', width:'28%',height:22,background:'#D4C4B0'}}/>
            <div className={styles.shelfItem} style={{left:'38%',width:'24%',height:16,background:'#B8C8D4'}}/>
            <div className={styles.shelfItem} style={{left:'66%',width:'20%',height:20,background:'#C8B8B0'}}/>
          </div>
          <div className={styles.rug} />
        </div>

        <div className={styles.catCanvas}>
          <Canvas
            camera={{ position:[0,1.2,4.5], fov:38 }}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'default',
              failIfMajorPerformanceCaveat: false,
            }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', e => { e.preventDefault() })
            }}
            shadows={false}
          >
            {/* Bright, neutral lighting — no HDR dependency */}
            <ambientLight intensity={2.5} />
            <directionalLight position={[5, 8, 5]}  intensity={2.0} color="#fffaf5" />
            <directionalLight position={[-4, 4, -3]} intensity={1.2} color="#e8f0ff" />
            <directionalLight position={[0, -2, 4]}  intensity={0.6} color="#fff8f0" />

            <Suspense fallback={<FallbackCatRoom />}>
              <RoomCat />
            </Suspense>
            <ContactShadows position={[0,-1.55,0]} opacity={0.10} scale={4} blur={2} far={1} />
          </Canvas>
        </div>

        <motion.div
          className={styles.bubble}
          key={taskIdx}
          initial={{ opacity:0, scale:0.9 }}
          animate={{ opacity:1, scale:1 }}
          transition={{ duration:0.3 }}
        >
          &#8220;{BUBBLES[Math.min(taskIdx, BUBBLES.length-1)]}&#8221;
        </motion.div>

        <div className={styles.topBar}>
          <span className={styles.dateLabel}>{dateStr}</span>
          <div className={styles.miniProgress}>
            <svg width="28" height="28" viewBox="0 0 28 28">
              <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2.5"/>
              <circle cx="14" cy="14" r="10" fill="none" stroke="#111" strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${donePct*62.8} 62.8`}
                transform="rotate(-90 14 14)"
                style={{ transition:'stroke-dasharray 0.6s ease' }}
              />
            </svg>
            <span className={styles.miniCount}>{taskIdx}/{TASKS.length}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!allDone ? (
          <motion.div
            key={taskIdx}
            className={`${styles.banner} ${flash ? styles.bannerFlash : ''}`}
            onClick={handleTick}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.28 }}
          >
            <span className={styles.stepLabel}>Step {taskIdx+1} of {TASKS.length}</span>
            <span className={styles.stepText}>{TASKS[taskIdx].text}</span>
            <div className={`${styles.tick} ${ticked ? styles.tickDone : ''}`}>
              {ticked
                ? <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" stroke="rgba(0,0,0,0.15)" strokeWidth="1" fill="none"/></svg>
              }
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            className={`${styles.banner} ${styles.bannerDone}`}
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
          >
            <span className={styles.stepText} style={{ textAlign:'center', color:'#888', fontStyle:'italic' }}>
              All done today ✓
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <NavBar />
    </div>
  )
}

fetch('/ar_ready_pet_walking.glb', { method:'HEAD' })
  .then(r => { if (r.ok) useGLTF.preload('/ar_ready_pet_walking.glb') })
  .catch(() => {})