import { motion } from 'framer-motion'
import styles from './DotGrid.module.css'

const MOOD_META = {
  radiant: { label: 'Radiant', color: '#F0C060', energy: 30 },
  good:    { label: 'Good',    color: '#82C9A0', energy: 20 },
  still:   { label: 'Still',   color: '#9EB0C8', energy: 15 },
  heavy:   { label: 'Heavy',   color: '#B8A8C8', energy: 10 },
  dark:    { label: 'Dark',    color: '#999999', energy:  8 },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function pad(n) { return String(n).padStart(2, '0') }

function toDateStr(date) {
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
}

function Dot({ dateStr, entry, isToday, isFuture, onTap }) {
  const color = entry ? MOOD_META[entry.mood]?.color : null

  return (
    <motion.div
      className={[
        styles.dot,
        isToday && styles.dotToday,
        isFuture && styles.dotFuture,
        entry && styles.dotFilled,
      ].filter(Boolean).join(' ')}
      style={color ? { background: color, boxShadow: `0 0 0 2px ${color}22` } : {}}
      onClick={() => !isFuture && onTap(dateStr)}
      whileTap={!isFuture ? { scale: 0.8 } : {}}
      whileHover={!isFuture ? { scale: 1.15 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    />
  )
}

export default function DotGrid({ entries, onDayTap }) {
  const year = new Date().getFullYear()
  const today = toDateStr(new Date())

  const entryMap = Object.fromEntries(entries.map(e => [e.date, e]))

  return (
    <div className={styles.grid}>
      {MONTHS.map((monthName, m) => {
        const daysInMonth = new Date(year, m + 1, 0).getDate()

        return (
          <div className={styles.monthRow} key={m}>
            <span className={styles.monthLabel}>{monthName}</span>
            <div className={styles.dotsRow}>
              {Array.from({ length: daysInMonth }, (_, d) => {
                const dateStr = `${year}-${pad(m+1)}-${pad(d+1)}`
                const entry = entryMap[dateStr]
                const isToday = dateStr === today
                const isFuture = dateStr > today

                return (
                  <Dot
                    key={dateStr}
                    dateStr={dateStr}
                    entry={entry}
                    isToday={isToday}
                    isFuture={isFuture}
                    onTap={onDayTap}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
