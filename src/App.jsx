import { useState, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Text-only screens — no WebGL, load immediately
import WelcomeScreen from './screens/WelcomeScreen'
import {
  GoalScreen, ScheduleScreen, PastScreen,
  MotivationScreen, ToneScreen, CompanionScreen,
  ConfirmScreen, SoundsScreen, NamingScreen,
} from './screens/Screens'

// Screens with WebGL Canvas — lazy so Three.js only loads when needed
const GenScreen   = lazy(() => import('./screens/GenScreen'))
const ChatScreen  = lazy(() => import('./screens/ChatScreen'))
const HomeScreen  = lazy(() => import('./screens/HomeScreen'))
const DiaryScreen = lazy(() => import('./screens/DiaryScreen'))

function ScreenLoader() {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F5F5F3',
    }}>
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
  'gen', 'confirm', 'naming', 'sounds', 'chat', 'home', 'diary',
]

export default function App() {
  const [screen, setScreen] = useState('welcome')
  const [profile, setProfile] = useState({})
  const [dir, setDir] = useState(1)

  const go = (next) => {
    setDir(SCREENS.indexOf(next) > SCREENS.indexOf(screen) ? 1 : -1)
    setScreen(next)
  }

  const updateProfile = (key, val) => setProfile(p => ({ ...p, [key]: val }))
  const p = { go, profile, updateProfile }

  function renderScreen() {
    switch (screen) {
      case 'welcome':    return <WelcomeScreen    {...p} />
      case 'goal':       return <GoalScreen       {...p} />
      case 'schedule':   return <ScheduleScreen   {...p} />
      case 'past':       return <PastScreen       {...p} />
      case 'motivation': return <MotivationScreen {...p} />
      case 'tone':       return <ToneScreen       {...p} />
      case 'companion':  return <CompanionScreen  {...p} />
      case 'gen':        return <Suspense fallback={<ScreenLoader />}><GenScreen    {...p} /></Suspense>
      case 'confirm':    return <Suspense fallback={<ScreenLoader />}><ConfirmScreen {...p} /></Suspense>
      case 'naming':     return <NamingScreen {...p} />
      case 'sounds':     return <Suspense fallback={<ScreenLoader />}><SoundsScreen  {...p} /></Suspense>
      case 'chat':       return <Suspense fallback={<ScreenLoader />}><ChatScreen    {...p} /></Suspense>
      case 'home':       return <Suspense fallback={<ScreenLoader />}><HomeScreen    {...p} /></Suspense>
      case 'diary':      return <Suspense fallback={<ScreenLoader />}><DiaryScreen   {...p} /></Suspense>
      default:           return <WelcomeScreen    {...p} />
    }
  }

  return (
    <div className="phone">
      {/*
        mode="wait" ensures the exiting screen fully unmounts BEFORE the
        entering screen mounts — critical for WebGL context limits.
        Keep duration short (0.18s) so there's minimal visual gap.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: dir * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -30 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}