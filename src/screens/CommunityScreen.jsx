import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, ContactShadows } from '@react-three/drei'
import styles from './CommunityScreen.module.css'

// ─── London center ───────────────────────────────────────────────────────────
const LONDON_CENTER = [51.515, -0.09]
const DEFAULT_ZOOM = 14

// ─── Seed data — nearby companions with London lat/lng ───────────────────────
const COMPANIONS = [
  { id: 1, name: 'Freya', pet: 'Moss', desc: 'A silver fox with ember eyes', style: 'stylised',
    lat: 51.521, lng: -0.102, colour: '#b8c4b0', tier: 'core',
    room: 'A minimal studio with afternoon light', avatar: 'silver_fox.png', model: 'silver_fox.glb' },
  { id: 2, name: 'Jackson', pet: 'Pixel', desc: 'A neon geometric cat', style: 'stylised',
    lat: 51.519, lng: -0.076, colour: '#b0b8c4', tier: 'core',
    room: 'A creative workspace, plants everywhere', avatar: 'neon_cat.png', model: 'neon_cat.glb' },
  { id: 3, name: 'Rynn', pet: 'Shiro', desc: 'A tiny cloud creature with ears', style: 'fantastical',
    lat: 51.512, lng: -0.065, colour: '#c4c0b8', tier: 'free',
    room: 'A cosy London flat, warm lamp light', avatar: 'cloud_creature.png', model: 'cloud_creature.glb' },
  { id: 4, name: 'Moka', pet: 'Cleo', desc: 'A realistic Dachshund with amber eyes', style: 'realistic',
    lat: 51.508, lng: -0.095, colour: '#c0b8b4', tier: 'core',
    room: 'A Southwark apartment, high ceilings' },
  { id: 5, name: 'Elaine', pet: 'Bruno', desc: 'A golden retriever, always grinning', style: 'realistic',
    lat: 51.523, lng: -0.115, colour: '#c8c0a8', tier: 'plus',
    room: 'A bright kitchen with a garden view', avatar: 'poddle_dog.png', model: 'poddle_dog.glb' },
  { id: 6, name: 'Ivan', pet: 'Luka', desc: 'A cute little pig', style: 'stylised',
    lat: 51.505, lng: -0.075, colour: '#b4b8b8', tier: 'core',
    room: 'A Borough home office, neat desk' },
  { id: 7, name: 'Sam', pet: 'Dot', desc: 'A sleek Abyssinian cat, very still', style: 'stylised',
    lat: 51.518, lng: -0.055, colour: '#a8a8a8', tier: 'free',
    room: 'A London studio, productivity corner', avatar: 'aby_cat.png', model: 'aby_cat.glb' },
  { id: 8, name: 'Alfie', pet: 'Toast', desc: 'A cute baby tiger, always curious', style: 'realistic',
    lat: 51.514, lng: -0.088, colour: '#c8b8a0', tier: 'plus',
    room: 'A shared flat, busy windowsill' },
]

const GIFTS = [
  { id: 'paw',     label: 'Paw print',    cost: 'free' },
  { id: 'fish',    label: 'Tiny fish',    cost: 'free' },
  { id: 'ribbon',  label: 'Ribbon bow',   cost: 'core' },
  { id: 'lamp',    label: 'Warm lamp',    cost: 'core' },
]

const PRIVACY_MODES = [
  { id: 'private', label: 'Private', sub: 'Only you can see you' },
  { id: 'friends', label: 'Friends', sub: 'Friends only' },
  { id: 'public',  label: 'Public',  sub: 'Visible on the map' },
]

// ─── Small SVG pet avatar ─────────────────────────────────────────────────────
function petSvgHtml(colour, style = 'stylised') {
  const ears = style === 'fantastical'
    ? `<ellipse cx="11" cy="8" rx="2.5" ry="4" fill="${colour}" transform="rotate(-20 11 8)"/>
       <ellipse cx="21" cy="8" rx="2.5" ry="4" fill="${colour}" transform="rotate(20 21 8)"/>`
    : style === 'realistic'
    ? `<polygon points="10,9 8,4 13,7" fill="${colour}"/>
       <polygon points="22,9 24,4 19,7" fill="${colour}"/>`
    : `<polygon points="10,9 8,3 14,7" fill="${colour}"/>
       <polygon points="22,9 24,3 18,7" fill="${colour}"/>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="15" fill="${colour}" opacity="0.18"/>
    <ellipse cx="16" cy="20" rx="7" ry="5.5" fill="${colour}"/>
    <circle cx="16" cy="13" r="6" fill="${colour}"/>
    ${ears}
    <circle cx="13" cy="12.5" r="1.5" fill="rgba(0,0,0,0.35)"/>
    <circle cx="19" cy="12.5" r="1.5" fill="rgba(0,0,0,0.35)"/>
    <circle cx="13.5" cy="12" r="0.5" fill="#fff"/>
    <circle cx="19.5" cy="12" r="0.5" fill="#fff"/>
  </svg>`
}

function PetDot({ colour, size = 32, style = 'stylised' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" fill={colour} opacity="0.18"/>
      <ellipse cx="16" cy="20" rx="7" ry="5.5" fill={colour}/>
      <circle cx="16" cy="13" r="6" fill={colour}/>
      {style === 'fantastical' ? (
        <>
          <ellipse cx="11" cy="8" rx="2.5" ry="4" fill={colour} transform="rotate(-20 11 8)"/>
          <ellipse cx="21" cy="8" rx="2.5" ry="4" fill={colour} transform="rotate(20 21 8)"/>
        </>
      ) : style === 'realistic' ? (
        <>
          <polygon points="10,9 8,4 13,7" fill={colour}/>
          <polygon points="22,9 24,4 19,7" fill={colour}/>
        </>
      ) : (
        <>
          <polygon points="10,9 8,3 14,7" fill={colour}/>
          <polygon points="22,9 24,3 18,7" fill={colour}/>
        </>
      )}
      <circle cx="13" cy="12.5" r="1.5" fill="rgba(0,0,0,0.35)"/>
      <circle cx="19" cy="12.5" r="1.5" fill="rgba(0,0,0,0.35)"/>
      <circle cx="13.5" cy="12" r="0.5" fill="#fff"/>
      <circle cx="19.5" cy="12" r="0.5" fill="#fff"/>
    </svg>
  )
}

// ─── Leaflet custom icons ─────────────────────────────────────────────────────
function createPetIcon(colour, style, avatar) {
  const inner = avatar
    ? `<img src="${import.meta.env.BASE_URL}${avatar}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
    : petSvgHtml(colour, style)
  return L.divIcon({
    className: styles.leafletPetIcon,
    html: `<div class="${styles.markerBubble}">
      ${inner}
    </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })
}

const youIcon = L.divIcon({
  className: styles.leafletYouIcon,
  html: `<div class="${styles.youDot}"><div class="${styles.youPulse}"></div></div>
         <span class="${styles.youLabel}">You</span>`,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
})

// ─── Fly to filtered bounds ──────────────────────────────────────────────────
function FitBounds({ companions }) {
  const map = useMap()
  const didInit = useRef(false)
  useEffect(() => {
    if (companions.length === 0) return
    const bounds = L.latLngBounds(companions.map(c => [c.lat, c.lng]))
    bounds.extend(LONDON_CENTER)
    if (!didInit.current) {
      map.fitBounds(bounds.pad(0.12), { maxZoom: 15 })
      didInit.current = true
    } else {
      map.flyToBounds(bounds.pad(0.12), { duration: 0.6, maxZoom: 15 })
    }
  }, [companions.length])
  return null
}

// ─── 3D pet model for profile room ───────────────────────────────────────────
function RoomPet({ model }) {
  const meshRef = useRef()
  const { scene } = useGLTF(`${import.meta.env.BASE_URL}${model}`)
  const s = useRef({ bob: 0, phase: 'idle', timer: 0, angle: 0 })

  useFrame((_, dt) => {
    const m = meshRef.current; if (!m) return
    const r = s.current
    r.bob += dt * 2.5
    m.position.y = -1.1 + Math.sin(r.bob) * 0.02
    m.rotation.y += dt * 0.3
  })

  return <primitive ref={meshRef} object={scene} position={[0, -1.1, 0]} scale={1.6} rotation={[0, Math.PI, 0]} />
}

// ─── Profile card overlay ─────────────────────────────────────────────────────
function ProfileCard({ companion, onClose, isCoreUser }) {
  const [giftSent, setGiftSent] = useState(null)
  const [showGifts, setShowGifts] = useState(false)

  function sendGift(gift) {
    if (gift.cost === 'core' && !isCoreUser) return
    setGiftSent(gift)
    setShowGifts(false)
  }

  return (
    <motion.div className={styles.overlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div className={styles.profileCard}
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Room preview */}
        <div className={styles.roomPreview}>
          {companion.model ? (
            <>
              <Canvas
                camera={{ position: [0, 1.2, 4.5], fov: 38 }}
                gl={{ alpha: true, antialias: true, powerPreference: 'default' }}
                style={{ position: 'absolute', inset: 0 }}
              >
                <ambientLight intensity={0.9} />
                <directionalLight position={[3, 5, 4]} intensity={0.6} />
                <Suspense fallback={null}>
                  <RoomPet model={companion.model} />
                </Suspense>
                <ContactShadows position={[0, -1.55, 0]} opacity={0.10} scale={4} blur={2} far={1} />
              </Canvas>
              <p className={styles.roomCaption}>{companion.room}</p>
            </>
          ) : (
            <>
              <div className={styles.roomPreviewBg}>
                <div className={styles.roomFloor} />
                <div className={styles.roomWall} />
                <div className={styles.roomWindow} />
              </div>
              <div className={styles.roomPetCenter}>
                <PetDot colour={companion.colour} size={56} style={companion.style} />
              </div>
              <p className={styles.roomCaption}>{companion.room}</p>
            </>
          )}
        </div>

        <div className={styles.profileBody}>
          <div className={styles.profileTop}>
            <div>
              <p className={styles.profilePetName}>{companion.pet}</p>
              <p className={styles.profileOwner}>{companion.name}'s companion</p>
            </div>
            <span className={styles.profileStyle}>{companion.style}</span>
          </div>

          <p className={styles.profileDesc}>&#8220;{companion.desc}&#8221;</p>

          <AnimatePresence mode="wait">
            {giftSent ? (
              <motion.div key="sent" className={styles.giftSent}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              >
                <span className={styles.giftSentIcon}>&#10022;</span>
                <span>{companion.pet} received your {giftSent.label}</span>
              </motion.div>
            ) : showGifts ? (
              <motion.div key="gifts" className={styles.giftPanel}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              >
                <p className={styles.giftLabel}>Send a gift</p>
                <div className={styles.giftGrid}>
                  {GIFTS.map(g => (
                    <button key={g.id}
                      className={`${styles.giftBtn} ${g.cost === 'core' && !isCoreUser ? styles.giftLocked : ''}`}
                      onClick={() => sendGift(g)}
                    >
                      {g.label}
                      {g.cost === 'core' && !isCoreUser && (
                        <span className={styles.giftLockTag}>Core</span>
                      )}
                    </button>
                  ))}
                </div>
                <button className={styles.giftCancel} onClick={() => setShowGifts(false)}>Cancel</button>
              </motion.div>
            ) : (
              <motion.button key="trigger" className={styles.sendGiftTrigger}
                onClick={() => setShowGifts(true)}
                whileHover={{ opacity: 0.8 }}
              >
                Send a gift
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </motion.div>
    </motion.div>
  )
}

// ─── Privacy panel ────────────────────────────────────────────────────────────
function PrivacyPanel({ current, onChange, onClose }) {
  return (
    <motion.div className={styles.privacyPanel}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
    >
      <p className={styles.privacyTitle}>Visibility</p>
      {PRIVACY_MODES.map(m => (
        <button key={m.id}
          className={`${styles.privacyRow} ${current === m.id ? styles.privacyRowActive : ''}`}
          onClick={() => { onChange(m.id); onClose() }}
        >
          <span className={`${styles.privacyDot} ${current === m.id ? styles.privacyDotActive : ''}`} />
          <span className={styles.privacyLabel}>{m.label}</span>
          <span className={styles.privacySub}>{m.sub}</span>
        </button>
      ))}
    </motion.div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function CommunityScreen({ go, profile }) {
  const [selected, setSelected]       = useState(null)
  const [privacy, setPrivacy]         = useState('private')
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [search, setSearch]           = useState('')
  const isCoreUser = true

  const filtered = COMPANIONS.filter(c =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.pet.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.root}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => go?.('home')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 15l-5-5 5-5" stroke="#111" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span className={styles.headerTitle}>Neighbourhood</span>

        <div className={styles.privacyWrap}>
          <button className={styles.privacyToggle}
            onClick={() => setShowPrivacy(v => !v)}
          >
            <span className={`${styles.privacyPill} ${styles['pill_' + privacy]}`}>
              {privacy === 'private' ? 'Private' : privacy === 'friends' ? 'Friends' : 'Public'}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5l3 3 3-3" stroke="#888" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </button>
          <AnimatePresence>
            {showPrivacy && (
              <PrivacyPanel
                current={privacy}
                onChange={setPrivacy}
                onClose={() => setShowPrivacy(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Search ── */}
      <div className={styles.searchWrap}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={styles.searchIcon}>
          <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.2"/>
          <path d="M9.5 9.5l2.5 2.5" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search companions..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* ── Interactive Map ── */}
      <div className={styles.mapWrap}>
        <MapContainer
          center={LONDON_CENTER}
          zoom={DEFAULT_ZOOM}
          className={styles.leafletMap}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds companions={filtered} />

          {/* "You" marker */}
          <Marker position={LONDON_CENTER} icon={youIcon} />

          {/* Companion markers */}
          {filtered.map(c => (
            <Marker
              key={c.id}
              position={[c.lat, c.lng]}
              icon={createPetIcon(c.colour, c.style, c.avatar)}
              eventHandlers={{ click: () => setSelected(c) }}
            />
          ))}
        </MapContainer>

        {/* Privacy overlay when private */}
        {privacy === 'private' && (
          <div className={styles.privateNotice}>
            <p className={styles.privateText}>You're hidden from the map</p>
            <button className={styles.privateBtn}
              onClick={() => { setPrivacy('public'); setShowPrivacy(false) }}
            >Go public</button>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <p className={styles.footerCount}>
          <strong>{filtered.length}</strong> companions nearby
        </p>
        <p className={styles.footerSub}>Showing display names and companions only. No habit data.</p>
      </div>

      {/* ── Profile card ── */}
      <AnimatePresence>
        {selected && (
          <ProfileCard
            companion={selected}
            onClose={() => setSelected(null)}
            isCoreUser={isCoreUser}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
