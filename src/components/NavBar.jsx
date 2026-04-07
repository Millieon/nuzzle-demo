import styles from './NavBar.module.css'

const NAV = [
  { label: 'Home', route: 'home' },
  { label: 'Community', route: 'community' },
  { label: 'Coach', route: 'coach' },
  { label: 'Diary', route: 'diary' },
  { label: 'Me', route: 'me' },
]

export default function NavBar({ go, active = 'home' }) {
  return (
    <nav className={styles.nav}>
      {NAV.map((item) => {
        const isActive = item.route === active
        return (
          <div
            key={item.label}
            className={`${styles.navItem} ${isActive ? styles.navActive : ''}`}
            onClick={() => go?.(item.route)}
            role="button"
            tabIndex={0}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              stroke={isActive ? '#111' : '#ccc'}
              strokeWidth="1.5"
            >
              {item.label === 'Home' && <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />}
              {item.label === 'Community' && (
                <>
                  <circle cx="11" cy="11" r="8" />
                  <circle cx="11" cy="8" r="2.5" />
                  <path d="M5 18c0-3 2.7-5 6-5s6 2 6 5" />
                </>
              )}
              {item.label === 'Coach' && (
                <>
                  <circle cx="11" cy="11" r="8" />
                  <path d="M11 7v4l2.5 2.5" />
                </>
              )}
              {item.label === 'Diary' && (
                <>
                  <rect x="4" y="2" width="14" height="18" rx="2" />
                  <line x1="8" y1="8" x2="14" y2="8" />
                  <line x1="8" y1="12" x2="14" y2="12" />
                  <line x1="8" y1="16" x2="11" y2="16" />
                </>
              )}
              {item.label === 'Me' && (
                <>
                  <circle cx="11" cy="8" r="3.5" />
                  <path d="M3.5 19c0-4.142 3.358-7 7.5-7s7.5 2.858 7.5 7" />
                </>
              )}
            </svg>
            <span className={styles.navLabel}>{item.label}</span>
          </div>
        )
      })}
    </nav>
  )
}

