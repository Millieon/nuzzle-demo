import { useState, lazy, Suspense } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Text-only screens — load immediately
import WelcomeScreen from './screens/WelcomeScreen'
import {
  GoalScreen, ScheduleScreen, PastScreen,
  MotivationScreen, ToneScreen, CompanionScreen,
  ConfirmScreen, SoundsScreen,
} from './screens/Screens'

// 3D-heavy screens — lazy loaded so Three.js only downloads when needed
const GenScreen  = lazy(() => import('./screens/GenScreen'))
const ChatScreen = lazy(() => import('./screens/ChatScreen'))
const HomeScreen = lazy(() => import('./screens/HomeScreen'))

function ScreenLoader() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--app)' }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#ccc',
            animation: 'pulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}

const SCREENS = [
  'welcome',
  'goal', 'schedule', 'past', 'motivation', 'tone', 'companion',
  'gen', 'confirm', 'sounds', 'chat',
  'home',
]

export default function App() {
  const [screen, setScreen]   = useState('welcome')
  const [profile, setProfile] = useState({})
  const [dir, setDir]         = useState(1)

  const go = (next) => {
    setDir(SCREENS.indexOf(next) > SCREENS.indexOf(screen) ? 1 : -1)
    setScreen(next)
  }
  const updateProfile = (key, val) => setProfile(p => ({ ...p, [key]: val }))
  const p = { go, profile, updateProfile }

  const screenMap = {
    welcome:    <WelcomeScreen    {...p} />,
    goal:       <GoalScreen       {...p} />,
    schedule:   <ScheduleScreen   {...p} />,
    past:       <PastScreen       {...p} />,
    motivation: <MotivationScreen {...p} />,
    tone:       <ToneScreen       {...p} />,
    companion:  <CompanionScreen  {...p} />,
    gen:        <Suspense fallback={<ScreenLoader />}><GenScreen  {...p} /></Suspense>,
    confirm:    <ConfirmScreen    {...p} />,
    sounds:     <SoundsScreen     {...p} />,
    chat:       <Suspense fallback={<ScreenLoader />}><ChatScreen {...p} /></Suspense>,
    home:       <Suspense fallback={<ScreenLoader />}><HomeScreen {...p} /></Suspense>,
  }

  return (
    <div className="phone">
      <AnimatePresence mode="wait" custom={dir} initial={false}>
        <motion.div
          key={screen}
          custom={dir}
          initial={{ opacity: 0, x: dir * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -40 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
        >
          {screenMap[screen]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
