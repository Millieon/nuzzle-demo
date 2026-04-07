import { useState, useRef, useMemo, Suspense, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import styles from './HomeScreen.module.css'

// ── Collision helper ──────────────────────────────────────────────────────
const MIN_DIST = 1.2 // minimum distance between furniture centers

function resolveCollisions(x, z, obstacles) {
  let rx = x, rz = z
  for (let i = 0; i < 3; i++) { // iterate a few times for chain resolution
    for (const ob of obstacles) {
      const dx = rx - ob.x, dz = rz - ob.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < MIN_DIST && dist > 0.001) {
        // Push away from obstacle along the direction vector
        const push = (MIN_DIST - dist)
        rx += (dx / dist) * push
        rz += (dz / dist) * push
      } else if (dist <= 0.001) {
        // Almost exact overlap — nudge in a random-ish direction
        rx += MIN_DIST * 0.7
      }
    }
  }
  // Re-clamp to room bounds after push
  rx = Math.max(-2.0, Math.min(2.0, rx))
  rz = Math.max(-0.8, Math.min(1.2, rz))
  return { x: rx, z: rz }
}

// ── Walking cat ────────────────────────────────────────────────────────────
const PET_AVOID = 1.5 // distance the pet keeps from furniture centers (large to cover visual bounds)

function pushOutOfObstacles(x, z, obstacles) {
  let px = x, pz = z
  for (let i = 0; i < 6; i++) { // more iterations for reliable push-out
    for (const ob of obstacles) {
      const dx = px - ob.x, dz = pz - ob.z
      const dist = Math.sqrt(dx * dx + dz * dz)
      if (dist < PET_AVOID && dist > 0.001) {
        const push = (PET_AVOID - dist) + 0.05 // extra margin
        px += (dx / dist) * push
        pz += (dz / dist) * push
      } else if (dist <= 0.001) {
        px += PET_AVOID
      }
    }
  }
  // clamp to walkable area
  px = Math.max(-2.2, Math.min(2.2, px))
  pz = Math.max(-1.0, Math.min(1.2, pz))
  return { x: px, z: pz }
}

function findSafeTarget(obstacles) {
  for (let i = 0; i < 50; i++) {
    const tx = (Math.random() - 0.5) * 3.0
    const tz = (Math.random() - 0.5) * 1.6
    let clear = true
    for (const ob of obstacles) {
      const dx = tx - ob.x, dz = tz - ob.z
      if (Math.sqrt(dx * dx + dz * dz) < PET_AVOID + 0.2) { clear = false; break }
    }
    if (clear) {
      // also make sure within walkable bounds
      if (tx > -2.0 && tx < 2.0 && tz > -0.8 && tz < 1.0) return { tx, tz }
    }
  }
  // fallback: push out from center
  const pushed = pushOutOfObstacles(0, 0, obstacles)
  return { tx: pushed.x, tz: pushed.z }
}

function RoomCat({ obstacles = [] }) {
  const meshRef = useRef()
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}ar_ready_pet_walking.glb`)
  const s = useRef({ x:0, z:0, tx:0.4, tz:0.3, angle:0, phase:'walk', timer:0, bob:0, inited: false })
  const obstaclesRef = useRef(obstacles)
  obstaclesRef.current = obstacles

  useFrame((_, dt) => {
    const m = meshRef.current; if (!m) return
    const r = s.current; const SPD = 0.22
    const obs = obstaclesRef.current

    // ── First frame: place cat at a safe starting position ──
    if (!r.inited) {
      r.inited = true
      const safe = findSafeTarget(obs)
      r.x = safe.tx; r.z = safe.tz
      r.tx = safe.tx; r.tz = safe.tz
    }

    // ── Every frame: push cat out if inside any furniture ──
    const pushed = pushOutOfObstacles(r.x, r.z, obs)
    r.x = pushed.x; r.z = pushed.z

    if (r.phase === 'walk') {
      const dx = r.tx - r.x, dz = r.tz - r.z
      const dist = Math.sqrt(dx*dx + dz*dz)
      if (dist < 0.06) { r.phase='pause'; r.timer=1.5+Math.random()*2 }
      else {
        const step = Math.min(SPD*dt, dist)
        const nx = r.x + (dx/dist)*step
        const nz = r.z + (dz/dist)*step

        // Check if next position is clear
        let nextClear = true
        for (const ob of obs) {
          const ddx = nx - ob.x, ddz = nz - ob.z
          if (Math.sqrt(ddx * ddx + ddz * ddz) < PET_AVOID) { nextClear = false; break }
        }

        if (nextClear) {
          r.x = nx; r.z = nz
        } else {
          // Blocked — reroute immediately
          const safe = findSafeTarget(obs)
          r.tx = safe.tx; r.tz = safe.tz
        }

        const ta = Math.atan2(r.tx - r.x, r.tz - r.z); let diff = ta - r.angle
        if (diff > Math.PI) diff -= Math.PI*2
        if (diff < -Math.PI) diff += Math.PI*2
        r.angle += diff * Math.min(dt*5, 1); r.bob += dt*9
      }
    } else {
      r.timer -= dt
      if (r.timer <= 0) {
        const safe = findSafeTarget(obs)
        r.tx = safe.tx; r.tz = safe.tz
        r.phase='walk'
      }
    }
    m.position.x = r.x
    m.position.y = -1.1 + Math.sin(r.bob)*0.02
    m.position.z = r.z
    m.rotation.y = r.angle
    m.rotation.z = r.phase==='walk' ? Math.sin(r.bob)*0.025 : 0
  })

  return <primitive ref={meshRef} object={scene} position={[0,-1.1,0]} scale={1.6} />
}

function FallbackCatRoom() {
  const ref = useRef()
  useFrame(s => { if (ref.current) ref.current.position.y = -1.1 + Math.sin(s.clock.elapsedTime*0.7)*0.03 })
  return (
    <group ref={ref}>
      <mesh position={[0,-0.6,0]}><sphereGeometry args={[0.55,32,32]}/><meshStandardMaterial color="#D4C4B0" roughness={0.55}/></mesh>
      <mesh position={[0,0.12,0]}><sphereGeometry args={[0.38,32,32]}/><meshStandardMaterial color="#D4C4B0" roughness={0.55}/></mesh>
    </group>
  )
}

// ── Draggable sofa ────────────────────────────────────────────────────────
function DraggableSofa({ enabled, onDragChange, onPositionChange, obstacles = [] }) {
  const meshRef = useRef()
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}sofa.glb`)
  const { camera, gl } = useThree()
  const dragging = useRef(false)
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.1))
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const intersection = useRef(new THREE.Vector3())

  // Load saved position or use default
  const saved = useRef(() => {
    try {
      const s = localStorage.getItem('nuzzle-sofa-pos')
      if (s) return JSON.parse(s)
    } catch {}
    return { x: -1.0, z: 0.6 }
  })

  const pos = useRef(saved.current())

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.x = pos.current.x
      meshRef.current.position.z = pos.current.z
    }
  }, [])

  function getFloorPoint(e) {
    const rect = gl.domElement.getBoundingClientRect()
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    if (clientX == null) return null
    mouse.current.x = ((clientX - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((clientY - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(mouse.current, camera)
    const hit = raycaster.current.ray.intersectPlane(floorPlane.current, intersection.current)
    return hit
  }

  function onPointerDown(e) {
    if (!enabled) return
    e.stopPropagation()
    dragging.current = true
    gl.domElement.style.cursor = 'grabbing'
    gl.domElement.setPointerCapture(e.pointerId)
    onDragChange?.(true)
  }

  function onPointerMove(e) {
    if (!dragging.current || !meshRef.current) return
    e.stopPropagation()
    const pt = getFloorPoint(e)
    if (pt) {
      let x = Math.max(-2.0, Math.min(2.0, pt.x))
      let z = Math.max(-0.8, Math.min(1.2, pt.z))
      const resolved = resolveCollisions(x, z, obstacles)
      meshRef.current.position.x = resolved.x
      meshRef.current.position.z = resolved.z
      pos.current = resolved
    }
  }

  function onPointerUp(e) {
    if (!dragging.current) return
    dragging.current = false
    gl.domElement.style.cursor = ''
    gl.domElement.releasePointerCapture(e.pointerId)
    onDragChange?.(false)
    onPositionChange?.(pos.current)
    // Save position
    try { localStorage.setItem('nuzzle-sofa-pos', JSON.stringify(pos.current)) } catch {}
  }

  return (
    <primitive
      ref={meshRef}
      object={scene}
      position={[pos.current.x, -1.1, pos.current.z]}
      scale={1.2}
      rotation={[0, Math.PI * 0.15, 0]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerOver={() => { if (enabled && !dragging.current) gl.domElement.style.cursor = 'grab' }}
      onPointerOut={() => { if (!dragging.current) gl.domElement.style.cursor = '' }}
    />
  )
}

// ── Generic draggable room object ─────────────────────────────────────────
function DraggableRoomObject({ id, modelPath, initialPosition, enabled, onDragChange, onPositionChange, scale: s = 1.0, obstacles = [] }) {
  const meshRef = useRef()
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}${modelPath}`)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const { camera, gl } = useThree()
  const dragging = useRef(false)
  const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.1))
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const intersection = useRef(new THREE.Vector3())
  const pos = useRef(initialPosition || { x: 0, z: 0 })

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.x = pos.current.x
      meshRef.current.position.z = pos.current.z
    }
  }, [])

  function getFloorPoint(e) {
    const rect = gl.domElement.getBoundingClientRect()
    const cx = e.clientX ?? e.touches?.[0]?.clientX
    const cy = e.clientY ?? e.touches?.[0]?.clientY
    if (cx == null) return null
    mouse.current.x = ((cx - rect.left) / rect.width) * 2 - 1
    mouse.current.y = -((cy - rect.top) / rect.height) * 2 + 1
    raycaster.current.setFromCamera(mouse.current, camera)
    return raycaster.current.ray.intersectPlane(floorPlane.current, intersection.current)
  }

  return (
    <primitive
      ref={meshRef}
      object={cloned}
      position={[pos.current.x, -1.1, pos.current.z]}
      scale={s}
      onPointerDown={e => {
        if (!enabled) return
        e.stopPropagation()
        dragging.current = true
        gl.domElement.style.cursor = 'grabbing'
        gl.domElement.setPointerCapture(e.pointerId)
        onDragChange?.(true)
      }}
      onPointerMove={e => {
        if (!dragging.current || !meshRef.current) return
        e.stopPropagation()
        const pt = getFloorPoint(e)
        if (pt) {
          let x = Math.max(-2.0, Math.min(2.0, pt.x))
          let z = Math.max(-0.8, Math.min(1.2, pt.z))
          const resolved = resolveCollisions(x, z, obstacles)
          meshRef.current.position.x = resolved.x
          meshRef.current.position.z = resolved.z
          pos.current = resolved
        }
      }}
      onPointerUp={e => {
        if (!dragging.current) return
        dragging.current = false
        gl.domElement.style.cursor = ''
        gl.domElement.releasePointerCapture(e.pointerId)
        onDragChange?.(false)
        onPositionChange?.(id, pos.current)
      }}
      onPointerOver={() => { if (enabled && !dragging.current) gl.domElement.style.cursor = 'grab' }}
      onPointerOut={() => { if (!dragging.current) gl.domElement.style.cursor = '' }}
    />
  )
}

// ── Add furniture panel ───────────────────────────────────────────────────
function AddFurniturePanel({ onClose, onGenerated }) {
  const [step, setStep] = useState('choose') // choose | photo | describe | generating
  const [text, setText] = useState('')
  const fileRef = useRef()

  function startGenerate(method) {
    setStep('generating')
    setTimeout(() => {
      onGenerated({
        id: Date.now(),
        name: 'Round Table',
        modelPath: 'round_table.glb',
        createdFrom: method,
      })
    }, 1800)
  }

  return (
    <motion.div className={styles.addPanelOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div className={styles.addPanel}
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.addPanelHandle} />

        {step === 'choose' && (
          <>
            <h3 className={styles.addPanelTitle}>Create furniture</h3>
            <p className={styles.addPanelSub}>Choose how you'd like to create your furniture</p>
            <div className={styles.addPanelOptions}>
              <button className={styles.addPanelOption} onClick={() => {
                fileRef.current?.click()
              }}>
                <div className={styles.addPanelOptionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <span className={styles.addPanelOptionLabel}>Upload a photo</span>
                <span className={styles.addPanelOptionDesc}>Take or upload a photo of furniture</span>
              </button>
              <button className={styles.addPanelOption} onClick={() => setStep('describe')}>
                <div className={styles.addPanelOptionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                </div>
                <span className={styles.addPanelOptionLabel}>Describe it</span>
                <span className={styles.addPanelOptionDesc}>Type a description and we'll generate it</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={() => startGenerate('photo')}
            />
          </>
        )}

        {step === 'describe' && (
          <>
            <h3 className={styles.addPanelTitle}>Describe your furniture</h3>
            <textarea
              className={styles.addPanelTextarea}
              placeholder="e.g. A small wooden round table with warm oak finish..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              autoFocus
            />
            <button
              className={styles.addPanelGenBtn}
              disabled={!text.trim()}
              onClick={() => startGenerate('describe')}
            >
              Generate furniture
            </button>
          </>
        )}

        {step === 'generating' && (
          <div className={styles.addPanelGenerating}>
            <div className={styles.addPanelSpinner}>
              {[0,1,2].map(i => <span key={i} style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            <p className={styles.addPanelGenText}>Creating your furniture...</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Inventory drawer ──────────────────────────────────────────────────────
function InventoryDrawer({ assets, placed, onPlace, onRemove, onClose }) {
  return (
    <motion.div className={styles.inventoryOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div className={styles.inventoryPanel}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.addPanelHandle} />
        <h3 className={styles.addPanelTitle}>My furniture</h3>

        {assets.length === 0 && placed.length === 0 && (
          <p className={styles.inventoryEmpty}>No furniture yet. Tap + to create some.</p>
        )}

        {placed.length > 0 && (
          <>
            <p className={styles.inventorySectionLabel}>In room</p>
            <div className={styles.inventoryGrid}>
              {placed.map(item => (
                <div key={item.id} className={styles.inventoryItem}>
                  <div className={styles.inventoryItemIcon}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#888" strokeWidth="1.2">
                      <rect x="4" y="10" width="20" height="10" rx="2"/>
                      <circle cx="8" cy="22" r="1.5"/><circle cx="20" cy="22" r="1.5"/>
                    </svg>
                  </div>
                  <span className={styles.inventoryItemName}>{item.name}</span>
                  <button className={styles.inventoryRemoveBtn} onClick={() => onRemove(item.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {assets.length > 0 && (
          <>
            <p className={styles.inventorySectionLabel}>Available</p>
            <div className={styles.inventoryGrid}>
              {assets.map(item => (
                <div key={item.id} className={styles.inventoryItem}>
                  <div className={styles.inventoryItemIcon}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#888" strokeWidth="1.2">
                      <rect x="4" y="10" width="20" height="10" rx="2"/>
                      <circle cx="8" cy="22" r="1.5"/><circle cx="20" cy="22" r="1.5"/>
                    </svg>
                  </div>
                  <span className={styles.inventoryItemName}>{item.name}</span>
                  <button className={styles.inventoryPlaceBtn} onClick={() => onPlace(item.id)}>
                    Place in room
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

function NavBar({ go }) {
  const NAV = [
    { label:'Home',      route:null,        active:true  },
    { label:'Community', route:'community', active:false },
    { label:'Coach',     route:'coach',     active:false },
    { label:'Diary',     route:'diary',     active:false },
    { label:'Me',        route:null,        active:false },
  ]
  return (
    <nav className={styles.nav}>
      {NAV.map(item => (
        <div key={item.label}
          className={`${styles.navItem} ${item.active ? styles.navActive : ''} ${item.route ? styles.navClickable : ''}`}
          onClick={() => item.route && go?.(item.route)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={item.active ? '#111' : '#ccc'} strokeWidth="1.5">
            {item.label==='Home'      && <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>}
            {item.label==='Community' && <><circle cx="11" cy="11" r="8"/><circle cx="11" cy="8" r="2.5"/><path d="M5 18c0-3 2.7-5 6-5s6 2 6 5"/></>}
            {item.label==='Coach'     && <><circle cx="11" cy="11" r="8"/><path d="M11 7v4l2.5 2.5"/></>}
            {item.label==='Diary'     && <><rect x="4" y="2" width="14" height="18" rx="2"/><line x1="8" y1="8" x2="14" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="11" y2="16"/></>}
            {item.label==='Me'        && <><circle cx="11" cy="8" r="3.5"/><path d="M3.5 19c0-4.142 3.358-7 7.5-7s7.5 2.858 7.5 7"/></>}
          </svg>
          <span className={styles.navLabel}>{item.label}</span>
        </div>
      ))}
    </nav>
  )
}

// ── Diary invite card ──────────────────────────────────────────────────────
function DiaryInvite({ petName, entry, onOpen }) {
  return (
    <motion.div
      className={styles.diaryInvite}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
    >
      <div className={styles.diaryInviteInner}>
        <div className={styles.diaryInviteText}>
          <span className={styles.diaryInviteLabel}>{petName} wrote something</span>
          <p className={styles.diaryInvitePreview}>&#8220;{entry.text.slice(0, 72)}{entry.text.length > 72 ? '…' : ''}&#8221;</p>
        </div>
        <div className={styles.diaryInviteArrow}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <span className={styles.diaryInviteCta}>Add your own thoughts →</span>
    </motion.div>
  )
}

// ── Generate diary via Claude API ──────────────────────────────────────────
async function generateDiaryEntry(petName, tasks, profile) {
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night'
  const goal = profile?.goal || 'building better habits'

  const prompt = `You are ${petName}, a gentle virtual companion who has watched your person move through their day.
They completed all of today's tasks:
${tasks.map((t, i) => `${i + 1}. ${t.text} (${t.time})`).join('\n')}

Their goal is: "${goal}"
It is now ${timeOfDay}.

Write a short diary entry — 2 to 3 sentences — as an observation from your perspective. 
You noticed them. You were there. Write warmly but quietly, like a companion who doesn't need to shout.
No emoji. No exclamation marks. Write in the register of a journal — intimate, unhurried.
Do not start with "I". Do not use the word "journey" or "proud" or "amazing".
Return only the diary text, nothing else.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) throw new Error('API error')
  const data = await response.json()
  return data.content?.[0]?.text?.trim() || ''
}

// ── Tasks & bubbles ────────────────────────────────────────────────────────
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
  'All done. I noticed.',
]

// ── Main screen ────────────────────────────────────────────────────────────
export default function HomeScreen({ go, profile, updateProfile }) {
  const [taskIdx, setTaskIdx] = useState(0)
  const [ticked,  setTicked]  = useState(false)
  const [allDone, setAllDone] = useState(false)
  const [flash,   setFlash]   = useState(false)

  const [arrangeMode, setArrangeMode] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Furniture system
  const [furnitureAssets, setFurnitureAssets] = useState(() => {
    try { const s = localStorage.getItem('nuzzle-furniture-assets'); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [placedFurniture, setPlacedFurniture] = useState(() => {
    try { const s = localStorage.getItem('nuzzle-placed-furniture'); return s ? JSON.parse(s) : [] } catch { return [] }
  })
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [showInventory, setShowInventory] = useState(false)
  const [showAR, setShowAR] = useState(false)

  // Poster system
  const [poster, setPoster] = useState(() => {
    try {
      const s = localStorage.getItem('nuzzle-poster')
      const p = s ? JSON.parse(s) : null
      return p && p.src ? p : { src: `${import.meta.env.BASE_URL}rothko_flattened.png`, x: 48, y: 10, scale: 1 }
    } catch { return { src: `${import.meta.env.BASE_URL}rothko_flattened.png`, x: 48, y: 10, scale: 1 } }
  })
  const [showPosterMenu, setShowPosterMenu] = useState(false)
  const posterFileRef = useRef(null)
  const posterDrag = useRef({ active: false, type: 'move', startX: 0, startY: 0, origX: 0, origY: 0, origScale: 1 })

  // Track sofa position for collision detection
  const [sofaPos, setSofaPos] = useState(() => {
    try { const s = localStorage.getItem('nuzzle-sofa-pos'); return s ? JSON.parse(s) : { x: -1.0, z: 0.6 } } catch { return { x: -1.0, z: 0.6 } }
  })

  // Persist furniture state
  // Load model-viewer web component for AR
  useEffect(() => {
    if (!customElements.get('model-viewer')) {
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('nuzzle-furniture-assets', JSON.stringify(furnitureAssets)) } catch {}
  }, [furnitureAssets])
  useEffect(() => {
    try { localStorage.setItem('nuzzle-placed-furniture', JSON.stringify(placedFurniture)) } catch {}
  }, [placedFurniture])

  function handleFurnitureGenerated(item) {
    setFurnitureAssets(prev => [...prev, item])
    setShowAddPanel(false)
    // Auto-open inventory to show the new item
    setTimeout(() => setShowInventory(true), 300)
  }

  function handlePlaceFurniture(id) {
    const item = furnitureAssets.find(a => a.id === id)
    if (!item) return
    setFurnitureAssets(prev => prev.filter(a => a.id !== id))
    setPlacedFurniture(prev => [...prev, { ...item, position: { x: 0.5, z: 0 } }])
  }

  function handleRemoveFurniture(id) {
    const item = placedFurniture.find(p => p.id === id)
    if (!item) return
    setPlacedFurniture(prev => prev.filter(p => p.id !== id))
    setFurnitureAssets(prev => [...prev, { id: item.id, name: item.name, modelPath: item.modelPath }])
  }

  function handleFurniturePositionChange(id, pos) {
    setPlacedFurniture(prev => prev.map(p => p.id === id ? { ...p, position: pos } : p))
  }

  // Persist poster
  useEffect(() => {
    try { localStorage.setItem('nuzzle-poster', JSON.stringify(poster)) } catch {}
  }, [poster])

  function handlePosterUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPoster(prev => ({ ...prev, src: reader.result }))
      setShowPosterMenu(false)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function handlePosterRemove() {
    setPoster(null)
    setShowPosterMenu(false)
  }

  function handlePosterPointerDown(e, type = 'move') {
    e.preventDefault()
    e.stopPropagation()
    const wallEl = type === 'move' ? e.currentTarget.parentElement : e.currentTarget.closest('[class*="wallBack"]')?.parentElement || e.currentTarget.parentElement.parentElement
    const rect = wallEl.getBoundingClientRect()
    posterDrag.current = {
      active: true,
      type,
      startX: e.clientX,
      startY: e.clientY,
      origX: poster.x,
      origY: poster.y,
      origScale: poster.scale || 1,
      wallW: rect.width,
      wallH: rect.height,
    }
    const onMove = (ev) => {
      if (!posterDrag.current.active) return
      const d = posterDrag.current
      if (d.type === 'move') {
        const dx = ((ev.clientX - d.startX) / d.wallW) * 100
        const dy = ((ev.clientY - d.startY) / d.wallH) * 100
        setPoster(prev => prev ? ({
          ...prev,
          x: Math.max(15, Math.min(75, d.origX + dx)),
          y: Math.max(5, Math.min(45, d.origY + dy)),
        }) : prev)
      } else {
        // resize via scale
        const dx = ev.clientX - d.startX
        const dy = ev.clientY - d.startY
        const delta = (dx + dy) / 150
        setPoster(prev => prev ? ({
          ...prev,
          scale: Math.max(0.4, Math.min(2.5, d.origScale + delta)),
        }) : prev)
      }
    }
    const onUp = () => {
      posterDrag.current.active = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  // Diary generation state
  const [diaryState, setDiaryState] = useState('idle') // idle | generating | ready
  const [diaryEntry, setDiaryEntry] = useState(null)

  const petName = profile?.petName || 'your companion'
  const donePct = taskIdx / TASKS.length
  const now     = new Date()
  const days    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const months  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const dateStr = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`

  // Trigger diary generation when all tasks done
  useEffect(() => {
    if (!allDone || diaryState !== 'idle') return
    setDiaryState('generating')

    const todayStr = new Date().toISOString().slice(0, 10)

    // Small delay — let the "all done" moment breathe before showing diary
    const timer = setTimeout(async () => {
      try {
        const text = await generateDiaryEntry(petName, TASKS, profile)
        const entry = {
          id: Date.now(),
          date: todayStr,
          mood: 'calm',
          text,
          petGenerated: true, // flag so DiaryScreen knows this came from the pet
        }
        setDiaryEntry(entry)
        setDiaryState('ready')
      } catch {
        // Fallback if API fails
        const fallbackTexts = [
          `Today all four things happened. The breathing in the morning, the words in the afternoon, the walk, and the reading before sleep. It was a full day — quiet in the way that full days sometimes are.`,
          `Every task, done. There was something steady about the way today moved — no rushing, no skipping. Just one thing, then the next.`,
          `A complete day. The kind that doesn't announce itself but leaves something behind — a small, solid feeling that something was kept.`,
        ]
        const text = fallbackTexts[Math.floor(Math.random() * fallbackTexts.length)]
        const entry = { id: Date.now(), date: todayStr, mood: 'calm', text, petGenerated: true }
        setDiaryEntry(entry)
        setDiaryState('ready')
      }
    }, 2200)

    return () => clearTimeout(timer)
  }, [allDone])

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

  function openDiary() {
    if (diaryEntry) {
      updateProfile('generatedDiaryEntry', diaryEntry)
    }
    go('diary')
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
            <div className={styles.shelfItem} style={{left:'5%',  width:'28%', height:22, background:'#D4C4B0'}}/>
            <div className={styles.shelfItem} style={{left:'38%', width:'24%', height:16, background:'#B8C8D4'}}/>
            <div className={styles.shelfItem} style={{left:'66%', width:'20%', height:20, background:'#C8B8B0'}}/>
          </div>
          <div className={styles.rug} />
        </div>

        <div className={styles.catCanvas}>
          <Canvas
            camera={{ position:[0,1.2,4.5], fov:38 }}
            gl={{ alpha:true, antialias:true, powerPreference:'default', failIfMajorPerformanceCaveat:false }}
            style={{ pointerEvents: arrangeMode ? 'auto' : 'none' }}
            onCreated={({ gl }) => { gl.domElement.addEventListener('webglcontextlost', e => e.preventDefault()) }}
            shadows={false}
          >
            <ambientLight intensity={2.5} />
            <directionalLight position={[5,8,5]}   intensity={2.0} color="#fffaf5" />
            <directionalLight position={[-4,4,-3]}  intensity={1.2} color="#e8f0ff" />
            <directionalLight position={[0,-2,4]}   intensity={0.6} color="#fff8f0" />
            <Suspense fallback={<FallbackCatRoom />}>
              <RoomCat obstacles={[sofaPos, ...placedFurniture.map(f => f.position)]} />
            </Suspense>
            <Suspense fallback={null}>
              <DraggableSofa
                enabled={arrangeMode}
                onDragChange={setIsDragging}
                onPositionChange={setSofaPos}
                obstacles={placedFurniture.map(f => f.position)}
              />
            </Suspense>
            {placedFurniture.map(item => (
              <Suspense key={item.id} fallback={null}>
                <DraggableRoomObject
                  id={item.id}
                  modelPath={item.modelPath}
                  initialPosition={item.position}
                  enabled={arrangeMode}
                  onDragChange={setIsDragging}
                  onPositionChange={handleFurniturePositionChange}
                  scale={1.0}
                  obstacles={[
                    sofaPos,
                    ...placedFurniture.filter(f => f.id !== item.id).map(f => f.position)
                  ]}
                />
              </Suspense>
            ))}
            <ContactShadows position={[0,-1.55,0]} opacity={0.10} scale={4} blur={2} far={1} />
          </Canvas>
          <AnimatePresence>
            {arrangeMode && (
              <motion.div className={styles.arrangeBanner}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.25 }}
              >
                <span className={styles.arrangeBannerText}>Drag to reposition</span>
                <button className={styles.arrangeDoneBtn} onClick={() => setArrangeMode(false)}>
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Poster — sits above the 3D canvas so it's interactive */}
        {poster && (
          <div
            className={`${styles.poster} ${styles.posterDraggable}`}
            style={{ left: `${poster.x}%`, top: `${poster.y}%`, transform: `scale(${poster.scale || 1})`, transformOrigin: 'top left' }}
            onPointerDown={(e) => handlePosterPointerDown(e, 'move')}
          >
            <img src={poster.src} alt="Wall poster" />
            <button className={styles.posterMenuBtn} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setShowPosterMenu(true) }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="3" r="1"/><circle cx="7" cy="7" r="1"/><circle cx="7" cy="11" r="1"/>
              </svg>
            </button>
            <div
              className={styles.posterResize}
              onPointerDown={(e) => handlePosterPointerDown(e, 'resize')}
            />
          </div>
        )}
        {!poster && (
          <button
            className={styles.addPosterBtn}
            onClick={() => setShowPosterMenu(true)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="16" height="14" rx="2"/>
              <path d="M2 13l4-4 3 3 4-5 5 6"/>
            </svg>
            Add poster
          </button>
        )}
        <input
          ref={posterFileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handlePosterUpload}
        />

        <motion.div className={styles.bubble} key={taskIdx}
          initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.3 }}
        >
          &#8220;{BUBBLES[Math.min(taskIdx, BUBBLES.length-1)]}&#8221;
        </motion.div>

        {!arrangeMode && (
          <div className={styles.roomActions}>
            <button className={styles.addFurnitureBtn} onClick={() => setShowAddPanel(true)}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="9" y1="4" x2="9" y2="14"/><line x1="4" y1="9" x2="14" y2="9"/>
              </svg>
            </button>
            {(furnitureAssets.length > 0 || placedFurniture.length > 0) && (
              <button className={styles.inventoryBtn} onClick={() => setShowInventory(true)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                  <path d="M1 6h14"/><path d="M6 6v7M10 6v7"/>
                </svg>
                <span className={styles.inventoryBadge}>{furnitureAssets.length + placedFurniture.length}</span>
              </button>
            )}
            <button className={styles.arrangeBtn} onClick={() => setArrangeMode(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6h12M2 10h12"/>
                <rect x="1" y="2" width="14" height="12" rx="2"/>
                <path d="M5 6v4M11 6v4"/>
              </svg>
              Arrange room
            </button>
          </div>
        )}

        <div className={styles.topBar}>
          <span className={styles.dateLabel}>{dateStr}</span>
          <button className={styles.arBtn} onClick={() => setShowAR(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"/>
              <path d="M12 12L20 7.5"/>
              <path d="M12 12V21"/>
              <path d="M12 12L4 7.5"/>
            </svg>
            AR
          </button>
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

        {/* Furniture overlays */}
        <AnimatePresence>
          {showAddPanel && (
            <AddFurniturePanel
              onClose={() => setShowAddPanel(false)}
              onGenerated={handleFurnitureGenerated}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showInventory && (
            <InventoryDrawer
              assets={furnitureAssets}
              placed={placedFurniture}
              onPlace={handlePlaceFurniture}
              onRemove={handleRemoveFurniture}
              onClose={() => setShowInventory(false)}
            />
          )}
        </AnimatePresence>

        {/* Poster menu */}
        <AnimatePresence>
          {showPosterMenu && (
            <motion.div className={styles.posterMenuOverlay}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPosterMenu(false)}
            >
              <motion.div className={styles.posterMenu}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                onClick={e => e.stopPropagation()}
              >
                <button className={styles.posterMenuItem} onClick={() => { posterFileRef.current?.click() }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="14" height="12" rx="2"/>
                    <path d="M2 11l4-4 3 3 4-5 3 3.5"/>
                  </svg>
                  Upload poster photo
                </button>
                {poster && (
                  <button className={`${styles.posterMenuItem} ${styles.posterMenuRemove}`} onClick={handlePosterRemove}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                      <path d="M3 5h12M7 5V3h4v2M5 5v10h8V5"/>
                    </svg>
                    Remove poster
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task banner / all done / generating / diary invite */}
      <AnimatePresence mode="wait">
        {!allDone ? (
          <motion.div key={taskIdx}
            className={`${styles.banner} ${flash ? styles.bannerFlash : ''}`}
            onClick={handleTick}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }} transition={{ duration:0.28 }}
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

        ) : diaryState === 'generating' ? (
          <motion.div key="generating" className={`${styles.banner} ${styles.bannerDone}`}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          >
            <span className={styles.stepText} style={{ color:'#aaa', fontStyle:'italic', textAlign:'center', fontSize:13 }}>
              {petName} is writing…
            </span>
            <span className={styles.generatingDots}>
              {[0,1,2].map(i => <span key={i} style={{ animationDelay:`${i*0.2}s` }} />)}
            </span>
          </motion.div>

        ) : diaryState === 'ready' && diaryEntry ? (
          <DiaryInvite key="invite" petName={petName} entry={diaryEntry} onOpen={openDiary} />

        ) : (
          <motion.div key="done" className={`${styles.banner} ${styles.bannerDone}`}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
          >
            <span className={styles.stepText} style={{ textAlign:'center', color:'#888', fontStyle:'italic' }}>
              All done today ✓
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <NavBar go={go} />

      {/* AR Viewer overlay */}
      <AnimatePresence>
        {showAR && (
          <motion.div className={styles.arOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className={styles.arHeader}>
              <button className={styles.arCloseBtn} onClick={() => setShowAR(false)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/>
                </svg>
              </button>
              <span className={styles.arTitle}>AR View</span>
              <div style={{ width: 36 }} />
            </div>
            <model-viewer
              src={`${import.meta.env.BASE_URL}ar_ready_pet_walking.glb`}
              ar
              ar-modes="webxr scene-viewer quick-look"
              camera-controls
              touch-action="pan-y"
              auto-rotate
              shadow-intensity="1"
              style={{ width: '100%', height: '100%', background: 'transparent' }}
              ar-scale="auto"
              ios-src=""
            >
              <button slot="ar-button" style={{
                display:'flex', alignItems:'center', gap:8,
                position:'absolute', bottom:40, left:'50%', transform:'translateX(-50%)',
                padding:'14px 28px', border:'none', borderRadius:30,
                background:'#222', color:'#fff', fontFamily:'var(--sans)',
                fontSize:15, fontWeight:600, cursor:'pointer',
                boxShadow:'0 4px 20px rgba(0,0,0,0.2)', whiteSpace:'nowrap'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z"/>
                  <path d="M12 12L20 7.5"/>
                  <path d="M12 12V21"/>
                  <path d="M12 12L4 7.5"/>
                </svg>
                View in your space
              </button>
            </model-viewer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

fetch(`${import.meta.env.BASE_URL}ar_ready_pet_walking.glb`, { method:'HEAD' })
  .then(r => { if (r.ok) useGLTF.preload(`${import.meta.env.BASE_URL}ar_ready_pet_walking.glb`) })
  .catch(() => {})

fetch(`${import.meta.env.BASE_URL}sofa.glb`, { method:'HEAD' })
  .then(r => { if (r.ok) useGLTF.preload(`${import.meta.env.BASE_URL}sofa.glb`) })
  .catch(() => {})

fetch(`${import.meta.env.BASE_URL}round_table.glb`, { method:'HEAD' })
  .then(r => { if (r.ok) useGLTF.preload(`${import.meta.env.BASE_URL}round_table.glb`) })
  .catch(() => {})